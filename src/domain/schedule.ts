import { jakartaInstant, prettyDate, validateSchedule } from './logic';

type Dates = { date: string; endDate?: string };
type Schedule = Dates & { start: string; end: string };
type ActivitySchedule = Omit<Schedule, 'date'> & { date?: string };
export const endDate = (plan: Dates) => plan.endDate || plan.date;
export const dateInPlan = (date: string, plan: Dates) => date >= plan.date && date <= endDate(plan);
export const activityDates = (activity: ActivitySchedule, plan: Dates): Schedule => ({
  ...activity,
  date: activity.date || plan.date,
  endDate: activity.endDate || activity.date || plan.date,
});
export function scheduleLabel(plan: Schedule): string {
  return endDate(plan) === plan.date
    ? `${prettyDate(plan.date)} · ${plan.start}–${plan.end} WIB`
    : `${prettyDate(plan.date)} · ${plan.start} — ${prettyDate(endDate(plan))} · ${plan.end} WIB`;
}
export function dateRangeLabel(plan: Dates): string {
  return endDate(plan) === plan.date
    ? prettyDate(plan.date)
    : `${prettyDate(plan.date, true)} – ${prettyDate(endDate(plan))}`;
}
export function validateActivityDates(activity: ActivitySchedule, plan: Dates) {
  const a = activityDates(activity, plan);
  validateSchedule(jakartaInstant(a.date, a.start), jakartaInstant(endDate(a), a.end));
  if (!dateInPlan(a.date, plan) || !dateInPlan(endDate(a), plan))
    throw new Error('Tanggal kegiatan harus di dalam rentang rencana.');
}
export function validatePlanDates(
  plan: Schedule,
  activities: ActivitySchedule[] = [],
  previous: Dates = plan,
) {
  validateSchedule(jakartaInstant(plan.date, plan.start), jakartaInstant(endDate(plan), plan.end));
  if (
    activities.some((a) => {
      const dates = activityDates(a, previous);
      return !dateInPlan(dates.date, plan) || !dateInPlan(endDate(dates), plan);
    })
  )
    throw new Error(
      'Masih ada kegiatan di luar rentang baru. Ubah tanggal kegiatan terlebih dahulu atau perluas rentang rencana.',
    );
}
export function schedulesOverlap(a: ActivitySchedule, b: ActivitySchedule, plan: Dates) {
  const first = activityDates(a, plan),
    second = activityDates(b, plan);
  return (
    jakartaInstant(first.date, first.start) < jakartaInstant(endDate(second), second.end) &&
    jakartaInstant(second.date, second.start) < jakartaInstant(endDate(first), first.end)
  );
}
