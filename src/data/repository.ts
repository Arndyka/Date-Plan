import type { SupabaseClient } from '@supabase/supabase-js';
import {
  entities,
  emptyTables,
  type EntityName,
  type DataMap,
  type Row,
  type Snapshot,
  type Space,
} from '../domain/types';
export class ConflictError extends Error {
  constructor() {
    super(
      'Data ini sudah diubah atau dihapus pasanganmu. Isianmu tetap ada; tutup lalu buka kembali untuk memuat versi terbaru.',
    );
  }
}
type Links = { plan_id?: string | null; item_id?: string | null };
export interface Repository {
  load(): Promise<Snapshot | null>;
  save<K extends EntityName>(
    kind: K,
    data: DataMap[K],
    old?: Row<K>,
    links?: Links,
  ): Promise<Row<K>>;
  remove<K extends EntityName>(kind: K, row: Row<K>): Promise<void>;
  updateSpace(old: Space, patch: Pick<Space, 'name' | 'sweet_note'>): Promise<void>;
  nickname(name: string): Promise<void>;
}
interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}
export class DemoRepository implements Repository {
  private readonly key = 'our-little-date.demo.v1';
  constructor(
    private storage: StorageLike,
    private seed: Snapshot,
    private user = seed.members[0].user_id,
  ) {}
  async load(): Promise<Snapshot> {
    const raw = this.storage.getItem(this.key);
    if (!raw) {
      this.persist(this.seed);
      return structuredClone(this.seed);
    }
    try {
      const parsed = JSON.parse(raw);
      if (!parsed.tables?.plans || !parsed.space) throw new Error();
      return parsed;
    } catch {
      throw new Error(
        'Data demo tidak dapat dibaca. Reset demo melalui Pengaturan atau hapus data situs.',
      );
    }
  }
  private persist(s: Snapshot) {
    this.storage.setItem(this.key, JSON.stringify(s));
  }
  async save<K extends EntityName>(
    kind: K,
    data: DataMap[K],
    old?: Row<K>,
    links: Links = {},
  ): Promise<Row<K>> {
    const s = await this.load();
    const list = s.tables[kind] as Row<K>[];
    if (old && !list.some((x) => x.id === old.id && x.version === old.version))
      throw new ConflictError();
    const now = new Date().toISOString();
    const row: Row<K> = {
      id: old?.id ?? crypto.randomUUID(),
      space_id: s.space.id,
      author_id: old?.author_id ?? this.user,
      plan_id:
        kind === 'inspirations' && 'plan_id' in links
          ? (links.plan_id ?? null)
          : (old?.plan_id ?? links.plan_id ?? null),
      item_id: old?.item_id ?? links.item_id ?? null,
      data: structuredClone(data),
      version: (old?.version ?? 0) + 1,
      created_at: old?.created_at ?? now,
      updated_at: now,
    };
    if (
      kind === 'wishlist_votes' &&
      !old &&
      list.some((x) => x.item_id === row.item_id && x.author_id === row.author_id)
    )
      throw new Error('Kamu sudah menyukai ide ini.');
    const index = list.findIndex((x) => x.id === row.id);
    if (index < 0) list.push(row);
    else list[index] = row;
    this.persist(s);
    return row;
  }
  async remove<K extends EntityName>(kind: K, row: Row<K>): Promise<void> {
    const s = await this.load();
    const list = s.tables[kind] as Row<K>[];
    if (!list.some((x) => x.id === row.id && x.version === row.version)) throw new ConflictError();
    list.splice(
      list.findIndex((x) => x.id === row.id),
      1,
    );
    if (kind === 'plans')
      for (const child of ['activities', 'checklist_items', 'memories'] as const)
        s.tables[child] = s.tables[child].filter((x) => x.plan_id !== row.id) as never;
    if (kind === 'plans')
      s.tables.inspirations = s.tables.inspirations.map((x) =>
        x.plan_id === row.id ? { ...x, plan_id: null } : x,
      );
    if (kind === 'wishlist_items')
      s.tables.wishlist_votes = s.tables.wishlist_votes.filter((x) => x.item_id !== row.id);
    this.persist(s);
  }
  async updateSpace(old: Space, patch: Pick<Space, 'name' | 'sweet_note'>) {
    const s = await this.load();
    if (s.space.version !== old.version) throw new ConflictError();
    s.space = { ...s.space, ...patch, version: old.version + 1 };
    this.persist(s);
  }
  async nickname(name: string) {
    const s = await this.load();
    s.members = s.members.map((x) => (x.user_id === this.user ? { ...x, nickname: name } : x));
    this.persist(s);
  }
}
export class CloudRepository implements Repository {
  private spaceId = '';
  constructor(
    private client: SupabaseClient,
    private userId: string,
  ) {}
  async load(): Promise<Snapshot | null> {
    const membership = await this.client
      .from('space_members')
      .select('*')
      .eq('user_id', this.userId)
      .maybeSingle();
    if (membership.error) throw membership.error;
    if (!membership.data) return null;
    this.spaceId = membership.data.space_id;
    const [room, members, ...collections] = await Promise.all([
      this.client.from('spaces').select('*').eq('id', this.spaceId).single(),
      this.client.from('space_members').select('*').eq('space_id', this.spaceId).order('slot'),
      ...entities.map((t) =>
        this.client.from(t).select('*').eq('space_id', this.spaceId).order('created_at'),
      ),
    ]);
    for (const result of [room, members, ...collections]) if (result.error) throw result.error;
    const tables = emptyTables();
    entities.forEach((t, i) => {
      tables[t] = collections[i].data as never;
    });
    return {
      space: room.data as unknown as Space,
      members: members.data as unknown as Snapshot['members'],
      tables,
    };
  }
  async save<K extends EntityName>(
    kind: K,
    data: DataMap[K],
    old?: Row<K>,
    links: Links = {},
  ): Promise<Row<K>> {
    const result = old
      ? await this.client
          .from(kind)
          .update({
            data,
            ...(kind === 'inspirations' && 'plan_id' in links ? { plan_id: links.plan_id } : {}),
          })
          .eq('id', old.id)
          .eq('version', old.version)
          .select()
          .maybeSingle()
      : await this.client
          .from(kind)
          .insert({ data, space_id: this.spaceId, ...links })
          .select()
          .single();
    if (result.error) throw result.error;
    if (!result.data) throw new ConflictError();
    return result.data as Row<K>;
  }
  async remove<K extends EntityName>(kind: K, row: Row<K>) {
    const r = await this.client
      .from(kind)
      .delete()
      .eq('id', row.id)
      .eq('version', row.version)
      .select('id');
    if (r.error) throw r.error;
    if (!r.data?.length) throw new ConflictError();
  }
  async updateSpace(old: Space, patch: Pick<Space, 'name' | 'sweet_note'>) {
    const r = await this.client
      .from('spaces')
      .update(patch)
      .eq('id', old.id)
      .eq('version', old.version)
      .select('id');
    if (r.error) throw r.error;
    if (!r.data?.length) throw new ConflictError();
  }
  async nickname(name: string) {
    const r = await this.client
      .from('space_members')
      .update({ nickname: name })
      .eq('user_id', this.userId);
    if (r.error) throw r.error;
  }
}
