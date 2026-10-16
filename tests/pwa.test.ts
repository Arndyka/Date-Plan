import { expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

function worker() {
  const handlers: Record<string, (event: any) => void> = {};
  const cache = {
    addAll: vi.fn(async () => {}),
    match: vi.fn(async () => new Response('offline')),
  };
  const caches = {
    open: vi.fn(async () => cache),
    keys: vi.fn(async () => ['spendly-shell-v2', 'date-plan-shell-old', 'date-plan-shell-current']),
    delete: vi.fn(async () => true),
  };
  const self = {
    registration: { scope: 'https://example.com/Date-Plan/' },
    addEventListener: (name: string, handler: (e: any) => void) => {
      handlers[name] = handler;
    },
    skipWaiting: vi.fn(async () => {}),
    clients: { claim: vi.fn(async () => {}) },
  };
  const fetch = vi.fn(async () => new Response('network'));
  const code = readFileSync('scripts/sw-template.js', 'utf8')
    .replace('__VERSION__', 'current')
    .replace('__FILES__', JSON.stringify(['offline.html', 'assets/app.js']));
  runInNewContext(code, { self, caches, fetch, URL, Set, Promise });
  return { handlers, self, caches, fetch, cache };
}
it('only precaches packaged static files and never forces a waiting update', async () => {
  const w = worker();
  let pending: Promise<unknown> = Promise.resolve();
  w.handlers.install({
    waitUntil: (p: Promise<unknown>) => {
      pending = p;
    },
  });
  await pending;
  expect(w.cache.addAll).toHaveBeenCalledWith([
    'https://example.com/Date-Plan/offline.html',
    'https://example.com/Date-Plan/assets/app.js',
  ]);
  expect(w.self.skipWaiting).not.toHaveBeenCalled();
  w.handlers.message({ data: { type: 'ACTIVATE_UPDATE' }, waitUntil: () => {} });
  expect(w.self.skipWaiting).toHaveBeenCalledOnce();
});
it('keeps sibling apps caches and cleans only old Date-Plan releases', async () => {
  const w = worker();
  let pending: Promise<unknown> = Promise.resolve();
  w.handlers.activate({
    waitUntil: (p: Promise<unknown>) => {
      pending = p;
    },
  });
  await pending;
  expect(w.caches.delete.mock.calls).toEqual([['date-plan-shell-old']]);
});
it('ignores auth, cloud calls, POSTs, query strings and other repository paths', () => {
  const w = worker();
  for (const [url, method] of [
    ['https://project.supabase.co/rest/v1/plans', 'GET'],
    ['https://example.com/Spendly/assets/app.js', 'GET'],
    ['https://example.com/Date-Plan/assets/app.js?token=secret', 'GET'],
    ['https://example.com/Date-Plan/auth', 'POST'],
    ['https://example.com/Date-Plan/private.json', 'GET'],
  ]) {
    const respondWith = vi.fn();
    w.handlers.fetch({ request: { url, method, mode: 'cors' }, respondWith });
    expect(respondWith).not.toHaveBeenCalled();
  }
});
it('uses the offline page only after navigation network failure', async () => {
  const w = worker();
  let pending: Promise<Response> = Promise.resolve(new Response());
  w.fetch.mockRejectedValueOnce(new Error('offline'));
  w.handlers.fetch({
    request: {
      url: 'https://example.com/Date-Plan/?auth=private',
      method: 'GET',
      mode: 'navigate',
    },
    respondWith: (p: Promise<Response>) => {
      pending = p;
    },
  });
  expect(await (await pending).text()).toBe('offline');
  expect(w.cache.match).toHaveBeenCalledWith('https://example.com/Date-Plan/offline.html');
});
