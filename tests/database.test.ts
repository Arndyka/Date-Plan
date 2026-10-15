import { beforeAll, afterAll, describe, it, expect } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import { readFileSync, readdirSync } from 'node:fs';

const a = '00000000-0000-4000-8000-000000000001';
const b = '00000000-0000-4000-8000-000000000002';
const c = '00000000-0000-4000-8000-000000000003';
const db = new PGlite();
let room: string, plan: string, token: string;
async function as(user: string) {
  await db.exec(
    `reset role; set role authenticated; select set_config('request.jwt.claim.sub', '${user}', false);`,
  );
}
async function rows(sql: string, args: unknown[] = []) {
  return (await db.query<Record<string, any>>(sql, args)).rows;
}
beforeAll(async () => {
  await db.exec(
    `create role anon; create role authenticated; create schema auth; create table auth.users(id uuid primary key); insert into auth.users values ('${a}'),('${b}'),('${c}'); create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$; grant usage on schema auth to authenticated; grant execute on function auth.uid() to authenticated;`,
  );
  for (const file of readdirSync('supabase/migrations')
    .filter((x) => x.endsWith('.sql'))
    .sort())
    await db.exec(readFileSync(`supabase/migrations/${file}`, 'utf8'));
}, 30000); // WASM startup on Windows ARM can exceed the default 10s hook limit.
afterAll(async () => {
  await db.close();
});

describe('actual PostgreSQL access policies and RPCs', () => {
  it('creates an owned room and inserts the first member atomically', async () => {
    await as(a);
    room = (await rows(`select public.create_space('Our room','Arn') as id`))[0].id;
    expect(await rows('select * from public.space_members')).toHaveLength(1);
    await expect(rows(`select public.create_space('Another','Arn')`)).rejects.toThrow();
    plan = (
      await rows(`insert into plans(space_id,data) values ($1,$2) returning id`, [
        room,
        {
          title: 'Museum date',
          date: '2026-10-20',
          start: '10:00',
          end: '12:00',
          budget: 200000,
          share: 50,
          status: 'terjadwal',
          note: '',
          location: 'Jakarta',
          rain: '',
        },
      ])
    )[0].id;
    token = (await rows('select create_invite($1) as token', [room]))[0].token;
  });
  it('outsiders cannot see any private entity or add to the room', async () => {
    await as(c);
    for (const table of [
      'spaces',
      'space_members',
      'space_invites',
      'plans',
      'activities',
      'calendar_notes',
      'inspirations',
      'wishlist_items',
      'wishlist_votes',
      'checklist_items',
      'memories',
    ])
      expect(await rows(`select * from ${table}`)).toHaveLength(0);
    await expect(
      rows('insert into plans(space_id,data) values ($1,$2)', [room, { title: 'Stolen' }]),
    ).rejects.toThrow();
    await expect(rows('select create_invite($1)', [room])).rejects.toThrow();
  });
  it('accepts an invite once, admits the partner, and refuses a third member', async () => {
    await as(b);
    expect((await rows('select accept_invite($1,$2) as id', [token, 'Angel']))[0].id).toBe(room);
    expect(await rows('select * from plans')).toHaveLength(1);
    await expect(rows('select accept_invite($1,$2)', [token, 'Again'])).rejects.toThrow();
    await as(c);
    await expect(rows('select accept_invite($1,$2)', [token, 'Third'])).rejects.toThrow();
    await as(a);
    await expect(rows('select create_invite($1)', [room])).rejects.toThrow();
  });
  it('rejects invalid money, parent ownership, and plan time ranges', async () => {
    await as(a);
    const activity = {
      title: 'Coffee',
      start: '10:00',
      end: '11:00',
      estimate: 20000,
      actual: 10000,
      paidFirst: 10001,
      place: 'Cafe',
      address: '',
      maps: '',
      category: 'Kuliner',
      done: false,
      position: 0,
      note: '',
    };
    await expect(
      rows('insert into activities(space_id,plan_id,data) values($1,$2,$3)', [
        room,
        plan,
        activity,
      ]),
    ).rejects.toThrow();
    await expect(
      rows(`update plans set data=jsonb_set(data,'{end}','"09:00"') where id=$1`, [plan]),
    ).rejects.toThrow();
    const record = (
      await rows('insert into activities(space_id,plan_id,data) values($1,$2,$3) returning *', [
        room,
        plan,
        { ...activity, paidFirst: 10000 },
      ])
    )[0];
    expect(record.version).toBe(1);
    await expect(
      rows(`update activities set author_id=$1 where id=$2`, [b, record.id]),
    ).rejects.toThrow();
  });
  it('prevents stale updates and preserves incrementing versions', async () => {
    await as(a);
    expect(
      await rows(
        `update plans set data=jsonb_set(data,'{title}','"Updated"') where id=$1 and version=1 returning version`,
        [plan],
      ),
    ).toEqual([{ version: 2 }]);
    await as(b);
    expect(
      await rows(
        `update plans set data=jsonb_set(data,'{title}','"Stale"') where id=$1 and version=1 returning version`,
        [plan],
      ),
    ).toEqual([]);
    expect(await rows('delete from plans where id=$1 and version=1 returning id', [plan])).toEqual(
      [],
    );
    expect((await rows('select data from plans where id=$1', [plan]))[0].data.title).toBe(
      'Updated',
    );
  });
  it('enforces one vote per member and author-only journal edits', async () => {
    await as(a);
    const item = (
      await rows('insert into wishlist_items(space_id,data) values($1,$2) returning id', [
        room,
        { title: 'Garden', category: 'Outdoor', estimate: 50000, place: 'Jakarta', note: '' },
      ])
    )[0].id;
    await rows('insert into wishlist_votes(space_id,item_id) values($1,$2)', [room, item]);
    await expect(
      rows('insert into wishlist_votes(space_id,item_id) values($1,$2)', [room, item]),
    ).rejects.toThrow();
    const memory = (
      await rows('insert into memories(space_id,plan_id,data) values($1,$2,$3) returning id', [
        room,
        plan,
        { content: 'Lovely', favorite: 'Coffee', rating: 5 },
      ])
    )[0].id;
    await as(b);
    expect(await rows('select * from memories')).toHaveLength(1);
    expect(
      await rows(
        `update memories set data='{"content":"hijack","rating":1}' where id=$1 returning id`,
        [memory],
      ),
    ).toEqual([]);
  });
  it('allows deleting a plan while preserving linked inspiration', async () => {
    await as(a);
    const extra = (
      await rows('insert into plans(space_id,data) values($1,$2) returning id', [
        room,
        {
          title: 'Temporary plan',
          date: '2026-11-20',
          start: '10:00',
          end: '12:00',
          budget: 0,
          share: 50,
          status: 'draft',
        },
      ])
    )[0].id;
    const ref = (
      await rows('insert into inspirations(space_id,plan_id,data) values($1,$2,$3) returning id', [
        room,
        extra,
        { title: 'Reference', url: 'https://vt.tiktok.com/example/', category: 'Seni', note: '' },
      ])
    )[0].id;
    await rows('delete from plans where id=$1', [extra]);
    expect(
      (await rows('select plan_id from inspirations where id=$1', [ref]))[0].plan_id,
    ).toBeNull();
  });
  it('shares recommendation city only with room members and rejects invalid or stale changes', async () => {
    await as(a);
    const before = (
      await rows('select recommendation_city,version from spaces where id=$1', [room])
    )[0];
    expect(before.recommendation_city).toBe('Bandung');
    await rows('update spaces set recommendation_city=$1 where id=$2 and version=$3', [
      'Yogyakarta',
      room,
      before.version,
    ]);
    await as(b);
    expect(
      (await rows('select recommendation_city from spaces where id=$1', [room]))[0]
        .recommendation_city,
    ).toBe('Yogyakarta');
    expect(
      await rows(
        'update spaces set recommendation_city=$1 where id=$2 and version=$3 returning id',
        ['Bogor', room, before.version],
      ),
    ).toEqual([]);
    await expect(
      rows('update spaces set recommendation_city=$1 where id=$2', ['   ', room]),
    ).rejects.toThrow();
    await expect(
      rows('update spaces set recommendation_city=$1 where id=$2', ['a'.repeat(81), room]),
    ).rejects.toThrow();
    await as(c);
    expect(
      await rows('update spaces set recommendation_city=$1 where id=$2 returning id', [
        'Bogor',
        room,
      ]),
    ).toEqual([]);
  });
  it('rejects expired and revoked invitations', async () => {
    await as(c);
    const other = (await rows(`select create_space('Other','Other') as id`))[0].id;
    const expired = (await rows('select create_invite($1) as token', [other]))[0].token;
    await db.exec('reset role');
    await rows(`update space_invites set expires_at=now()-interval '1 day' where space_id=$1`, [
      other,
    ]);
    await as(b);
    await expect(rows('select accept_invite($1,$2)', [expired, 'B'])).rejects.toThrow();
    await as(c);
    const revoked = (await rows('select create_invite($1) as token', [other]))[0].token;
    await rows('update space_invites set revoked=true where space_id=$1', [other]);
    await as(b);
    await expect(rows('select accept_invite($1,$2)', [revoked, 'B'])).rejects.toThrow();
  });
});
