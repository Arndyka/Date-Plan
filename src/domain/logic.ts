export const rupiah = (n: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(n);
export function parseRupiah(value: string): number {
  if (!/^\d+$/.test(value.trim())) throw new Error('Masukkan rupiah bulat, minimal 0.');
  const n = Number(value);
  if (!Number.isSafeInteger(n)) throw new Error('Nominal terlalu besar.');
  return n;
}
export function summarizeBudget(items: { estimate: number; actual: number }[], limit: number) {
  parseRupiah(String(limit));
  let estimated = 0,
    actual = 0;
  for (const x of items) {
    [x.estimate, x.actual].forEach((n) => parseRupiah(String(n)));
    estimated += x.estimate;
    actual += x.actual;
  }
  return { estimated, actual, remaining: limit - actual };
}
export function jakartaInstant(date: string, time: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time))
    throw new Error('Tanggal atau jam tidak valid.');
  const day = new Date(`${date}T00:00:00Z`);
  if (!Number.isFinite(day.getTime()) || day.toISOString().slice(0, 10) !== date)
    throw new Error('Tanggal tidak valid.');
  return new Date(`${date}T${time}:00+07:00`).toISOString();
}
export function validateSchedule(start: string, end: string): void {
  if (
    !Number.isFinite(Date.parse(start)) ||
    !Number.isFinite(Date.parse(end)) ||
    Date.parse(end) <= Date.parse(start)
  )
    throw new Error('Jam selesai harus setelah jam mulai.');
}
export const today = () =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
export const prettyDate = (date: string, short = false) =>
  new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: short ? 'short' : 'long',
    year: short ? undefined : 'numeric',
    timeZone: 'Asia/Jakarta',
  }).format(new Date(`${date}T12:00:00+07:00`));
export function safeTikTokUrl(value: string): URL | null {
  try {
    const u = new URL(value);
    return u.protocol === 'https:' &&
      !u.username &&
      !u.password &&
      !u.port &&
      (u.hostname === 'tiktok.com' || u.hostname.endsWith('.tiktok.com'))
      ? u
      : null;
  } catch {
    return null;
  }
}
export function safeMapsUrl(value: string): string | null {
  try {
    const u = new URL(value);
    return u.protocol === 'https:' &&
      !u.username &&
      !u.password &&
      ['maps.app.goo.gl', 'goo.gl', 'maps.google.com', 'www.google.com', 'google.com'].includes(
        u.hostname,
      )
      ? u.href
      : null;
  } catch {
    return null;
  }
}
export const mapsUrl = (place: string, directions = false) =>
  `https://www.google.com/maps/${directions ? 'dir' : 'search'}/?${new URLSearchParams(directions ? { api: '1', destination: place } : { api: '1', query: place })}`;
interface CalendarPlan {
  id: string;
  title: string;
  date: string;
  start: string;
  end: string;
  note: string;
  location: string;
}
const stamp = (value: string) => value.replace(/[-:]/g, '').replace(/\.\d{3}/, '');
const escapeIcs = (s: string) =>
  s
    .replace(/\\/g, '\\\\')
    .replace(/\r?\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;')
    .replace(/\r/g, '');
function fold(line: string): string {
  let out = '',
    chunk = '';
  for (const ch of line) {
    if (new TextEncoder().encode(chunk + ch).length > 75) {
      out += chunk + '\r\n';
      chunk = ' ';
    }
    chunk += ch;
  }
  return out + chunk;
}
export function calendarIcs(plan: CalendarPlan): string {
  const start = jakartaInstant(plan.date, plan.start),
    end = jakartaInstant(plan.date, plan.end);
  validateSchedule(start, end);
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Our Little Date//ID',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${escapeIcs(plan.id)}@our-little-date`,
    `DTSTAMP:${stamp(new Date().toISOString())}`,
    `DTSTART:${stamp(start)}`,
    `DTEND:${stamp(end)}`,
    `SUMMARY:${escapeIcs(plan.title)}`,
    `DESCRIPTION:${escapeIcs(plan.note)}`,
    `LOCATION:${escapeIcs(plan.location)}`,
    'END:VEVENT',
    'END:VCALENDAR',
    '',
  ]
    .map(fold)
    .join('\r\n');
}
export function googleCalendarUrl(plan: CalendarPlan): string {
  const start = jakartaInstant(plan.date, plan.start),
    end = jakartaInstant(plan.date, plan.end);
  validateSchedule(start, end);
  return (
    'https://calendar.google.com/calendar/render?' +
    new URLSearchParams({
      action: 'TEMPLATE',
      text: plan.title,
      dates: `${stamp(start)}/${stamp(end)}`,
      details: plan.note,
      location: plan.location,
      ctz: 'Asia/Jakarta',
    })
  );
}
export function eligibleIdeas<T extends { category: string; estimate: number }>(
  items: T[],
  category: string | null,
  ceiling: number | null,
): T[] {
  return items.filter(
    (x) => (!category || x.category === category) && (ceiling === null || x.estimate <= ceiling),
  );
}
