/**
 * Time utilities for the availability engine.
 *
 * Working hours are stored as "HH:mm" strings. Within a given day we work in
 * "minutes since midnight" integers, which makes overlap math trivial and
 * timezone-free. Conversion to/from Date happens only at the edges.
 */

/** Parse "HH:mm" into minutes since midnight. Returns null when invalid. */
export function parseHHmm(value: string): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
  return hours * 60 + minutes;
}

/** Format minutes since midnight as "HH:mm". */
export function formatHHmm(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export interface Interval {
  /** minutes since midnight, inclusive start */
  start: number;
  /** minutes since midnight, exclusive end */
  end: number;
}

/** True when two half-open intervals [start,end) overlap. */
export function intervalsOverlap(a: Interval, b: Interval): boolean {
  return a.start < b.end && b.start < a.end;
}

/**
 * Extracts local minutes-since-midnight for a given Date relative to a target
 * calendar day. Anything outside the day is clamped to [0, 1440].
 */
export function minutesOfDay(date: Date): number {
  return date.getHours() * 60 + date.getMinutes();
}

/**
 * Builds a Date for a given calendar day (year/month/day from `day`) at the
 * given minutes-since-midnight, in local time.
 */
export function dateAtMinutes(day: Date, minutes: number): Date {
  const d = new Date(day);
  d.setHours(0, 0, 0, 0);
  d.setMinutes(minutes);
  return d;
}
