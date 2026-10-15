import { describe, expect, it } from 'vitest';
import {
  parseRupiah,
  summarizeBudget,
  jakartaInstant,
  validateSchedule,
  safeTikTokUrl,
  mapsUrl,
  calendarIcs,
  googleCalendarUrl,
  eligibleIdeas,
} from '../logic';

describe('money', () => {
  it('accepts whole rupiah only', () => {
    expect(parseRupiah('150000')).toBe(150000);
    for (const value of ['-1', '1.5', 'abc', '9007199254740992', ''])
      expect(() => parseRupiah(value)).toThrow();
  });
  it('tracks total spending without allocating costs between partners', () => {
    expect(summarizeBudget([{ estimate: 200, actual: 101 }], 300)).toEqual({
      estimated: 200,
      actual: 101,
      remaining: 199,
    });
    expect(summarizeBudget([{ estimate: 500, actual: 0 }], 600).actual).toBe(0);
    expect(summarizeBudget([{ estimate: 0, actual: 110 }], 100).remaining).toBe(-10);
    expect(() => summarizeBudget([{ estimate: 0, actual: -1 }], 100)).toThrow();
  });
});
describe('time and external links', () => {
  it('preserves Jakarta dates and rejects nonexistent dates', () => {
    expect(jakartaInstant('2026-10-15', '00:30')).toBe('2026-10-14T17:30:00.000Z');
    expect(() => jakartaInstant('2026-02-29', '12:00')).toThrow();
    expect(jakartaInstant('2028-02-29', '12:00')).toContain('2028-02-29');
    expect(() => validateSchedule('2026-10-15T12:00:00Z', '2026-10-15T11:00:00Z')).toThrow();
  });
  it('rejects unsafe and deceptive TikTok hosts', () => {
    for (const url of [
      'javascript:alert(1)',
      'https://tiktok.com.evil.test/a',
      'http://tiktok.com/a',
      'https://evil.test/?tiktok.com',
      'https://user:pass@tiktok.com/a',
    ])
      expect(safeTikTokUrl(url)).toBeNull();
    expect(safeTikTokUrl('https://vt.tiktok.com/abc')?.hostname).toBe('vt.tiktok.com');
    expect(new URL(mapsUrl('Cafe & flowers', true)).searchParams.get('destination')).toBe(
      'Cafe & flowers',
    );
  });
});
describe('calendar', () => {
  const plan = {
    id: 'plan-1',
    title: 'Date, kita; ♥\nBEGIN:VEVENT',
    date: '2026-10-15',
    start: '00:30',
    end: '02:30',
    note: 'Bawa bunga',
    location: 'Jakarta',
  };
  it('exports stable UID, UTC dates and safe ICS text', () => {
    const ics = calendarIcs(plan);
    expect(ics).toContain('UID:plan-1@our-little-date');
    expect(ics).toContain('DTSTART:20261014T173000Z');
    expect(ics.match(/^BEGIN:VEVENT$/gm)).toHaveLength(1);
    expect(ics).toContain('Date\\, kita\\; ♥\\nBEGIN:VEVENT');
    for (const line of ics.split('\r\n'))
      expect(new TextEncoder().encode(line).length).toBeLessThanOrEqual(75);
  });
  it('prefills Google Calendar with matching instants', () => {
    const url = new URL(googleCalendarUrl(plan));
    expect(url.searchParams.get('dates')).toBe('20261014T173000Z/20261014T193000Z');
    expect(url.searchParams.get('text')).toBe(plan.title);
  });
});
it('filters ideas by category and ceiling, including no matches', () => {
  const ideas = [
    { title: 'Coffee', category: 'Kuliner', estimate: 80000 },
    { title: 'Museum', category: 'Seni', estimate: 20000 },
  ];
  expect(eligibleIdeas(ideas, 'Seni', 30000)).toHaveLength(1);
  expect(eligibleIdeas(ideas, null, 10000)).toEqual([]);
});
