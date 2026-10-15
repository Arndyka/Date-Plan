import { describe, it, expect } from 'vitest';
import { DemoRepository, ConflictError } from './repository';
import { makeDemo } from '../demo/demoData';
const storage = () => {
  const map = new Map<string, string>();
  return {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => {
      map.set(k, v);
    },
  };
};
describe('demo repository integrity', () => {
  it('persists records and refuses stale updates or deletion', async () => {
    const store = storage(),
      repo = new DemoRepository(store, makeDemo());
    const snap = await repo.load();
    const plan = snap!.tables.plans[0];
    const next = await repo.save('plans', { ...plan.data, title: 'Changed' }, plan);
    expect(next.version).toBe(plan.version + 1);
    await expect(repo.save('plans', { ...plan.data, title: 'Old' }, plan)).rejects.toBeInstanceOf(
      ConflictError,
    );
    await expect(repo.remove('plans', plan)).rejects.toBeInstanceOf(ConflictError);
    expect((await new DemoRepository(store, makeDemo()).load())!.tables.plans[0].data.title).toBe(
      'Changed',
    );
  });
  it('removes child records when a plan is deleted', async () => {
    const repo = new DemoRepository(storage(), makeDemo()),
      snap = await repo.load();
    const plan = snap!.tables.plans[0];
    expect(snap!.tables.activities.some((x) => x.plan_id === plan.id)).toBe(true);
    await repo.remove('plans', plan);
    expect((await repo.load())!.tables.activities.some((x) => x.plan_id === plan.id)).toBe(false);
  });
});
