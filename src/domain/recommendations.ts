import { dateIdeas, type DateIdea } from './dateIdeas';
import type { WishlistData } from './types';

export const normalizeCity = (city: string) => city.trim().replace(/\s+/g, ' ') || 'Bandung';
export function weekStart(now = new Date()): string {
  const localDay = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
  const date = new Date(`${localDay}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() - ((date.getUTCDay() + 6) % 7));
  return date.toISOString().slice(0, 10);
}
export function ideasForCity(city: string): DateIdea[] {
  return dateIdeas.filter(
    (x) => !x.city || x.city.toLowerCase() === normalizeCity(city).toLowerCase(),
  );
}
export function weeklyIdeas(city: string, week = weekStart()): DateIdea[] {
  const candidates = ideasForCity(city);
  const index = Math.floor(Date.parse(`${week}T00:00:00Z`) / 604800000);
  const local = candidates.filter((x) => x.city);
  const groups = [...new Set(candidates.filter((x) => !x.city).map((x) => x.category))];
  const hash = [...normalizeCity(city).toLowerCase()].reduce(
    (n, c) => (n * 31 + c.charCodeAt(0)) >>> 0,
    0,
  );
  const pick = <T>(values: T[], n: number) =>
    values[((n % values.length) + values.length) % values.length];
  const chosen: DateIdea[] = local.length ? [pick(local, index)] : [];
  for (let i = 0; chosen.length < 6 && i < groups.length; i++) {
    const category = pick(groups, index + i);
    const pool = candidates.filter((x) => !x.city && x.category === category);
    // Keep pool rotation independent of the rotating category position, so every idea appears.
    chosen.push(pick(pool, index + hash + groups.indexOf(category)));
  }
  return chosen;
}
export function filterIdeas(
  items: DateIdea[],
  filter: { search: string; category: string; setting: string; ceiling: number | null },
): DateIdea[] {
  const search = filter.search.trim().toLocaleLowerCase('id');
  return items.filter(
    (x) =>
      (!filter.category || x.category === filter.category) &&
      (!filter.setting || x.setting === filter.setting) &&
      (filter.ceiling === null || x.estimate <= filter.ceiling) &&
      (!search ||
        `${x.title} ${x.description} ${x.query}`.toLocaleLowerCase('id').includes(search)),
  );
}
export function ideaToWishlist(idea: DateIdea, city: string): WishlistData {
  return {
    title: idea.title,
    category: idea.category,
    estimate: idea.estimate,
    place:
      idea.setting === 'Di rumah'
        ? 'Di rumah'
        : idea.city
          ? idea.query
          : `${idea.query}, ${normalizeCity(city)}`,
    note: `${idea.description}\nDurasi: sekitar ${idea.duration} menit.\nPersiapan: ${idea.preparation}\nAnggaran perkiraan untuk berdua; cek harga dan ketersediaan sebelum berangkat.${idea.source ? `\nReferensi tempat: ${idea.source.url}` : ''}`,
  };
}
