// Explicit, opt-in hosted verification. Creates and removes only its own temporary users/room.
// Run with DATEPLAN_ADMIN_KEY in the process environment, never a VITE_* variable.
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { chromium, devices, expect } from '@playwright/test';

const url = 'https://rwdwbvnunsnampznfhyv.supabase.co';
const site = process.env.DATEPLAN_SITE_URL ?? 'https://arndyka.github.io/Date-Plan/';
const publishable = process.env.DATEPLAN_PUBLIC_KEY;
const secret = process.env.DATEPLAN_ADMIN_KEY;
if (!publishable || !secret) throw new Error('Provide DATEPLAN_PUBLIC_KEY and DATEPLAN_ADMIN_KEY.');
const options = {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
};
const admin = createClient(url, secret, options);
const makeClient = () => createClient(url, publishable, options);
const check = (result) => {
  if (result.error) throw new Error(result.error.message);
  return result.data;
};
const users = [],
  clients = [];
const report = [];
let room, browser;
const mark = (text) => {
  report.push(text);
  console.log(`PASS ${text}`);
};
const run = randomUUID();
const planData = {
  title: `Activation QA ${run}`,
  date: '2026-12-20',
  start: '15:00',
  end: '18:00',
  location: 'Jakarta',
  budget: 300000,
  share: 50,
  status: 'terjadwal',
  note: '',
  rain: '',
};
try {
  for (let i = 0; i < 3; i++) {
    const email = `dateplan-qa-${run}-${i}@example.com`,
      password = `Qa!${randomUUID()}`;
    const { user } = check(
      await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { dateplan_activation_test: run },
      }),
    );
    users.push({ id: user.id, email, password });
    const client = makeClient();
    check(await client.auth.signInWithPassword({ email, password }));
    clients.push(client);
  }
  mark('three temporary users authenticate with the public client');
  room = check(
    await clients[0].rpc('create_space', { room_name: `QA ${run}`, nickname: 'QA Satu' }),
  );
  const invite = check(await clients[0].rpc('create_invite', { target: room }));
  const race = await Promise.all(
    [1, 2].map((i) => clients[i].rpc('accept_invite', { token: invite, nickname: `QA ${i + 1}` })),
  );
  assert.equal(race.filter((x) => !x.error).length, 1);
  const partnerIndex = race[0].error ? 2 : 1,
    outsiderIndex = partnerIndex === 1 ? 2 : 1;
  const partner = clients[partnerIndex],
    outsider = clients[outsiderIndex];
  assert.equal(
    check(await admin.from('space_members').select('user_id').eq('space_id', room)).length,
    2,
  );
  assert.ok(
    (await outsider.rpc('accept_invite', { token: invite, nickname: 'Third person' })).error,
  );
  mark('concurrent invitation acceptance admits exactly one partner and rejects reuse');
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
  ]) {
    assert.deepEqual(check(await outsider.from(table).select('*')), []);
  }
  const anon = makeClient();
  assert.ok((await anon.from('spaces').select('id')).error);
  assert.ok((await outsider.from('plans').insert({ space_id: room, data: planData })).error);
  mark('outsider and anonymous access are denied by hosted RLS');
  const plan = check(
    await clients[0].from('plans').insert({ space_id: room, data: planData }).select().single(),
  );
  const realtime = partner.channel(`activation-${run}`);
  let resolveEvent;
  const event = new Promise((resolve) => {
    resolveEvent = resolve;
  });
  realtime.on(
    'postgres_changes',
    { event: 'UPDATE', schema: 'public', table: 'plans', filter: `id=eq.${plan.id}` },
    resolveEvent,
  );
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Realtime subscription timed out')), 15000);
    realtime.on('system', {}, (payload) => {
      console.log(
        'REALTIME',
        JSON.stringify({
          extension: payload.extension,
          status: payload.status,
          message: payload.message,
        }),
      );
      if (payload.extension === 'postgres_changes' && payload.status === 'ok') {
        clearTimeout(timeout);
        resolve();
      }
    });
    realtime.subscribe((status) => {
      if (['CHANNEL_ERROR', 'TIMED_OUT'].includes(status)) {
        clearTimeout(timeout);
        reject(new Error(`Realtime ${status}`));
      }
    });
  });
  const updated = check(
    await clients[0]
      .from('plans')
      .update({ data: { ...planData, note: 'Remote sync verified' } })
      .eq('id', plan.id)
      .eq('version', plan.version)
      .select()
      .single(),
  );
  let eventTimer;
  const payload = await Promise.race([
    event,
    new Promise((_, reject) => {
      eventTimer = setTimeout(() => reject(new Error('Realtime update not received')), 15000);
    }),
  ]);
  clearTimeout(eventTimer);
  assert.equal(payload.new.id, plan.id);
  assert.equal(payload.new.version, updated.version);
  await partner.removeChannel(realtime);
  assert.deepEqual(
    check(
      await partner
        .from('plans')
        .update({ data: planData })
        .eq('id', plan.id)
        .eq('version', plan.version)
        .select(),
    ),
    [],
  );
  mark('Realtime delivers partner changes and stale version writes are rejected');

  browser = await chromium.launch({ channel: process.platform === 'win32' ? 'msedge' : undefined });
  const desktop = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const phone = await browser.newContext({ ...devices['iPhone 13'] });
  const a = await desktop.newPage(),
    b = await phone.newPage();
  const errors = [];
  for (const page of [a, b]) page.on('pageerror', (e) => errors.push(e.message));
  async function login(page, user) {
    await page.goto(site);
    await expect(page.getByLabel('Email', { exact: true })).toBeEnabled({ timeout: 15000 });
    await page.getByLabel('Email', { exact: true }).fill(user.email);
    await page.getByLabel('Password', { exact: true }).fill(user.password);
    await page.getByRole('button', { name: 'Masuk ke ruang kita' }).click();
    await expect(page.getByRole('heading', { name: 'Waktu berdua, dibuat istimewa.' })).toBeVisible(
      { timeout: 20000 },
    );
    await expect(page.getByText('Terhubung langsung', { exact: true })).toBeVisible({
      timeout: 15000,
    });
  }
  await login(a, users[0]);
  await login(b, users[partnerIndex]);
  const title = `Browser QA ${run.slice(0, 8)}`;
  await a.getByRole('button', { name: 'Buat date baru', exact: true }).first().click();
  await a.getByLabel('Judul date').fill(title);
  await a.getByLabel('Tanggal mulai', { exact: true }).fill('2026-12-21');
  await a.getByLabel('Tanggal selesai', { exact: true }).fill('2026-12-23');
  await a.getByLabel('Jam mulai (WIB)', { exact: true }).fill('23:00');
  await a.getByLabel('Jam selesai (WIB)', { exact: true }).fill('18:00');
  await a.getByLabel('Batas budget (Rp)').fill('250000');
  await a.getByRole('button', { name: 'Simpan rencana' }).click();
  await expect(a.getByRole('heading', { name: title, exact: true })).toBeVisible({
    timeout: 10000,
  });
  await b.getByRole('link', { name: 'Rencana', exact: true }).click();
  await expect(b.getByRole('heading', { name: title, exact: true })).toBeVisible({
    timeout: 10000,
  });
  await b.getByRole('heading', { name: title, exact: true }).click();
  await b.getByRole('button', { name: 'Edit rencana' }).click();
  await b.getByLabel('Judul date').fill(`${title} bersama`);
  await b.getByRole('button', { name: 'Simpan rencana' }).click();
  await expect(a.getByRole('heading', { name: `${title} bersama`, exact: true })).toBeVisible({
    timeout: 10000,
  });
  mark('live desktop and phone logins synchronize plan creation and edits without reload');

  await a.getByRole('button', { name: 'Edit rencana' }).click();
  await a.getByLabel('Judul date').fill('Unsaved draft');
  await b.getByRole('button', { name: 'Edit rencana' }).click();
  await b.getByLabel('Judul date').fill(`${title} final`);
  await b.getByRole('button', { name: 'Simpan rencana' }).click();
  await expect(a.locator('h1')).toHaveText(`${title} final`, { timeout: 10000 });
  await a.getByRole('button', { name: 'Simpan rencana' }).click();
  await expect(a.getByRole('alert')).toContainText('diubah', { timeout: 10000 });
  await expect(a.getByLabel('Judul date')).toHaveValue('Unsaved draft');
  await a.keyboard.press('Escape');
  await a.reload();
  await expect(a.getByRole('heading', { name: `${title} final`, exact: true })).toBeVisible({
    timeout: 15000,
  });
  assert.deepEqual(errors, []);
  mark('live stale edits preserve the draft and cloud data survives reload');

  await a.bringToFront();
  await a.getByRole('button', { name: 'Tambah kegiatan', exact: true }).click();
  await a.getByLabel('Nama kegiatan').fill('Perjalanan lintas malam');
  await a.getByLabel('Tanggal kegiatan', { exact: true }).fill('2026-12-22');
  await a.getByLabel('Tanggal selesai kegiatan', { exact: true }).fill('2026-12-23');
  await a.getByLabel('Mulai (WIB)', { exact: true }).fill('23:30');
  await a.getByLabel('Selesai (WIB)', { exact: true }).fill('02:00');
  await a.getByRole('button', { name: 'Simpan kegiatan' }).click();
  await expect(a.getByRole('dialog')).toHaveCount(0);
  await expect(
    b.getByRole('heading', { name: 'Perjalanan lintas malam', exact: true }),
  ).toBeVisible({ timeout: 10000 });
  await b.bringToFront();
  await b.getByRole('button', { name: 'Edit rencana', exact: true }).click();
  await b.getByLabel('Tanggal selesai', { exact: true }).fill('2026-12-22');
  await b.getByRole('button', { name: 'Simpan rencana', exact: true }).click();
  await expect(b.getByRole('alert')).toContainText('kegiatan di luar rentang');
  await b.keyboard.press('Escape');
  const racePlan = check(
    await clients[0]
      .from('plans')
      .insert({ space_id: room, data: { ...planData, endDate: '2026-12-23' } })
      .select()
      .single(),
  );
  const raceActivity = {
    title: 'Range race',
    date: '2026-12-23',
    endDate: '2026-12-23',
    start: '09:00',
    end: '10:00',
    estimate: 0,
    actual: 0,
    paidFirst: 0,
  };
  const racing = await Promise.all([
    clients[0]
      .from('plans')
      .update({ data: { ...racePlan.data, endDate: '2026-12-22' } })
      .eq('id', racePlan.id)
      .select(),
    partner
      .from('activities')
      .insert({ space_id: room, plan_id: racePlan.id, data: raceActivity })
      .select(),
  ]);
  assert.equal(racing.filter((result) => result.error).length, 1);
  const finalRange = check(
    await clients[0].from('plans').select('data').eq('id', racePlan.id).single(),
  ).data;
  const finalChildren = check(
    await partner.from('activities').select('data').eq('plan_id', racePlan.id),
  );
  assert.ok(
    finalChildren.every(
      (child) => child.data.date >= finalRange.date && child.data.endDate <= finalRange.endDate,
    ),
  );
  check(await clients[0].from('plans').delete().eq('id', racePlan.id));
  mark('multi-day and overnight activities sync; concurrent range edits cannot orphan activities');

  await a.goto(`${site}#/ideas`);
  await b.goto(`${site}#/ideas`);
  for (const page of [a, b]) {
    await expect(page.getByLabel('Kota rekomendasi')).toHaveValue('Bandung');
    await expect(
      page.getByRole('region', { name: 'Date minggu ini' }).getByRole('article'),
    ).toHaveCount(6);
  }
  await a.getByLabel('Kota rekomendasi').fill('Yogyakarta');
  await a.getByRole('button', { name: 'Simpan lokasi' }).click();
  await expect(b.getByLabel('Kota rekomendasi')).toHaveValue('Yogyakarta', { timeout: 10000 });
  await b.getByLabel('Kota rekomendasi').fill('Bogor');
  await b.getByRole('button', { name: 'Simpan lokasi' }).click();
  await expect(a.getByLabel('Kota rekomendasi')).toHaveValue('Bogor', { timeout: 10000 });
  let releaseWishlist;
  const wishlistGate = new Promise((resolve) => {
    releaseWishlist = resolve;
  });
  const wishlistEndpoint = `${url}/rest/v1/wishlist_items*`;
  await a.route(wishlistEndpoint, async (route) => {
    if (route.request().method() !== 'POST') return route.continue();
    const response = await route.fetch();
    await wishlistGate;
    await route.fulfill({ response });
  });
  try {
    const cards = a.getByRole('region', { name: 'Pustaka ide date' }).getByRole('article');
    await cards.first().getByRole('button', { name: 'Simpan wishlist' }).click();
    await expect(cards.nth(1).getByRole('button', { name: 'Simpan wishlist' })).toBeDisabled();
  } finally {
    releaseWishlist();
  }
  await expect(
    b
      .getByRole('region', { name: 'Pustaka ide date' })
      .getByRole('article')
      .first()
      .getByRole('button', { name: 'Sudah di wishlist' }),
  ).toBeDisabled({ timeout: 10000 });
  await expect(
    a
      .getByRole('region', { name: 'Pustaka ide date' })
      .getByRole('article')
      .first()
      .getByRole('button', { name: 'Sudah di wishlist' }),
  ).toBeDisabled({ timeout: 10000 });
  await a.unroute(wishlistEndpoint);
  assert.deepEqual(
    await a
      .getByRole('region', { name: 'Date minggu ini' })
      .getByRole('heading', { level: 3 })
      .allTextContents(),
    await b
      .getByRole('region', { name: 'Date minggu ini' })
      .getByRole('heading', { level: 3 })
      .allTextContents(),
  );
  mark('weekly recommendations, city preferences and saved ideas synchronize between devices');

  // generateLink does not send email. Exercise the actual recovery redirect with a disposable user.
  const recovery = check(
    await admin.auth.admin.generateLink({
      type: 'recovery',
      email: users[0].email,
      options: { redirectTo: site },
    }),
  );
  assert.equal(recovery.properties.redirect_to, site);
  const recoveryContext = await browser.newContext();
  const recoveryPage = await recoveryContext.newPage();
  await recoveryPage.goto(recovery.properties.action_link);
  await expect(
    recoveryPage.getByRole('heading', { name: 'Password baru', exact: true }),
  ).toBeVisible({ timeout: 20000 });
  const newPassword = `Recovered!${randomUUID()}`;
  await recoveryPage.getByLabel('Password', { exact: true }).fill(newPassword);
  await recoveryPage.getByRole('button', { name: 'Simpan password', exact: true }).click();
  await expect(recoveryPage.getByRole('button', { name: 'Masuk ke ruang kita' })).toBeVisible({
    timeout: 15000,
  });
  check(
    await makeClient().auth.signInWithPassword({ email: users[0].email, password: newPassword }),
  );
  mark('recovery link returns to the production app and changes the temporary password');
} finally {
  await browser?.close();
  for (const client of clients) {
    await client.removeAllChannels();
    await client.auth.signOut();
  }
  if (room && users[0])
    check(await admin.from('spaces').delete().eq('id', room).eq('created_by', users[0].id));
  for (const user of users) check(await admin.auth.admin.deleteUser(user.id));
  console.log('CLEANUP temporary room and test accounts removed');
}
console.log(JSON.stringify({ checksPassed: report.length, result: 'PASS' }));
