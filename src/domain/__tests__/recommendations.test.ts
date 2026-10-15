import { describe, expect, it } from 'vitest';
import { dateIdeas } from '../dateIdeas';
import {
  weekStart,
  weeklyIdeas,
  ideasForCity,
  filterIdeas,
  ideaToWishlist,
} from '../recommendations';

describe('shared weekly date suggestions', () => {
  it('eventually rotates through the entire available collection', () => {
    for (const city of ['Bandung', 'Yogyakarta']) {
      const seen = new Set<string>();
      for (let offset = 0; offset < 104; offset++) {
        const day = new Date('2026-10-12T00:00:00Z');
        day.setUTCDate(day.getUTCDate() + offset * 7);
        for (const idea of weeklyIdeas(city, day.toISOString().slice(0, 10))) seen.add(idea.id);
      }
      expect([...seen].sort()).toEqual(
        ideasForCity(city)
          .map((x) => x.id)
          .sort(),
      );
    }
  });
  it('changes at Monday midnight Jakarta, including year boundaries', () => {
    expect(weekStart(new Date('2026-10-18T16:59:59Z'))).toBe('2026-10-12');
    expect(weekStart(new Date('2026-10-18T17:00:00Z'))).toBe('2026-10-19');
    expect(weekStart(new Date('2027-01-01T12:00:00Z'))).toBe('2026-12-28');
  });
  it('offers six distinct ideas with a different selection next week, stable across devices', () => {
    const first = weeklyIdeas('Bandung', '2026-10-12');
    expect(first).toHaveLength(6);
    expect(new Set(first.map((x) => x.id)).size).toBe(6);
    expect(weeklyIdeas(' Bandung ', '2026-10-12')).toEqual(first);
    expect(weeklyIdeas('bandung', '2026-10-12')).toEqual(first);
    expect(weeklyIdeas('Bandung', '2026-10-19').map((x) => x.id)).not.toEqual(
      first.map((x) => x.id),
    );
    expect(first.some((x) => x.city === 'Bandung')).toBe(true);
  });
  it('never recommends a fixed Bandung venue as a venue in another city', () => {
    const elsewhere = ideasForCity('Yogyakarta');
    expect(elsewhere.length).toBeGreaterThan(40);
    expect(elsewhere.every((x) => !x.city || x.city === 'Yogyakarta')).toBe(true);
    expect(weeklyIdeas('Yogyakarta', '2026-10-12').every((x) => !x.city)).toBe(true);
    const outside = elsewhere.find((x) => x.setting === 'Outdoor')!;
    expect(ideaToWishlist(outside, 'Yogyakarta').place).toContain('Yogyakarta');
    const home = elsewhere.find((x) => x.setting === 'Di rumah')!;
    expect(ideaToWishlist(home, 'Yogyakarta').place).toBe('Di rumah');
  });
  it('filters by search, mood, setting and total budget without substituting unmatched ideas', () => {
    const all = ideasForCity('Bandung');
    const filtered = filterIdeas(all, {
      search: '',
      category: '',
      setting: 'Di rumah',
      ceiling: 0,
    });
    expect(filtered.length).toBeGreaterThan(0);
    expect(filtered.every((x) => x.estimate === 0 && x.setting === 'Di rumah')).toBe(true);
    expect(
      filterIdeas(all, { search: 'Geologi', category: '', setting: '', ceiling: null }).map(
        (x) => x.id,
      ),
    ).toEqual(['bandung-geologi']);
    expect(
      filterIdeas(all, { search: 'zznomatch', category: '', setting: '', ceiling: null }),
    ).toEqual([]);
    expect(dateIdeas.length).toBeGreaterThanOrEqual(60);
    expect(new Set(dateIdeas.map((x) => x.id)).size).toBe(dateIdeas.length);
  });
});
