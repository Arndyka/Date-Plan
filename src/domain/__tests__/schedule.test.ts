import { expect, it } from 'vitest';
import { calendarIcs, googleCalendarUrl } from '../logic';
import {
  dateInPlan,
  validateActivityDates,
  schedulesOverlap,
  validatePlanDates,
} from '../schedule';

const trip = {
  id: 'trip',
  title: 'Bandung',
  date: '2026-10-23',
  endDate: '2026-10-25',
  start: '23:00',
  end: '18:00',
  note: '',
  location: 'Bandung',
};
it('exports a multi-day trip with the real end date in both calendar formats', () => {
  expect(calendarIcs(trip)).toContain('DTEND:20261025T110000Z');
  expect(new URL(googleCalendarUrl(trip)).searchParams.get('dates')).toBe(
    '20261023T160000Z/20261025T110000Z',
  );
});
it('includes every day and supports month/year boundaries and legacy one-day plans', () => {
  expect(
    ['2026-10-22', '2026-10-23', '2026-10-24', '2026-10-25', '2026-10-26'].map((d) =>
      dateInPlan(d, trip),
    ),
  ).toEqual([false, true, true, true, false]);
  expect(dateInPlan('2027-01-01', { ...trip, date: '2026-12-31', endDate: '2027-01-02' })).toBe(
    true,
  );
  expect(dateInPlan('2026-10-24', { date: '2026-10-23' })).toBe(false);
});
it('validates real dates, ordered instants and activities inside the trip', () => {
  const night = { date: '2026-10-23', endDate: '2026-10-24', start: '23:30', end: '02:00' };
  expect(() => validateActivityDates(night, trip)).not.toThrow();
  expect(() => validateActivityDates({ ...night, endDate: '2026-10-26' }, trip)).toThrow(/rentang/);
  expect(() => validateActivityDates({ ...night, endDate: night.date }, trip)).toThrow();
  expect(() => validatePlanDates({ ...trip, endDate: '2026-02-30' })).toThrow();
  expect(() => validatePlanDates({ ...trip, endDate: '2026-10-22' })).toThrow();
  expect(() => validatePlanDates({ ...trip, endDate: '2026-10-23' }, [night], trip)).toThrow();
});
it('only warns about real overlap, including overnight activities', () => {
  const night = { date: '2026-10-23', endDate: '2026-10-24', start: '23:30', end: '02:00' };
  expect(schedulesOverlap(night, { date: '2026-10-24', start: '01:00', end: '03:00' }, trip)).toBe(
    true,
  );
  expect(schedulesOverlap(night, { date: '2026-10-24', start: '02:00', end: '03:00' }, trip)).toBe(
    false,
  );
  expect(
    schedulesOverlap(
      { date: '2026-10-23', start: '09:00', end: '10:00' },
      { date: '2026-10-24', start: '09:00', end: '10:00' },
      trip,
    ),
  ).toBe(false);
});
