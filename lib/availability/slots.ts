import {
  formatHHmm,
  intervalsOverlap,
  type Interval,
} from "@/lib/availability/time";

export interface ComputeSlotsInput {
  /** Barber working intervals for the day (minutes since midnight). */
  workingIntervals: Interval[];
  /** Busy intervals: existing appointments + blocked times (lunch, etc). */
  busyIntervals: Interval[];
  /** Service duration in minutes. */
  durationMinutes: number;
  /** Step between candidate start times in minutes (e.g. 15 or 30). */
  stepMinutes: number;
  /**
   * Earliest allowed start (minutes since midnight). Slots before this are
   * dropped. Used to enforce lead time / "today already passed" rules.
   * Defaults to 0.
   */
  minStartMinutes?: number;
}

/**
 * Pure slot computation. Given the barber's working windows and the busy
 * windows for a day, returns the list of start times (as minutes since
 * midnight) where a service of `durationMinutes` fits without overlapping any
 * busy interval and stays within a working window.
 *
 * This is the core of section 12 and is intentionally free of DB/timezone
 * concerns so it can be unit-tested deterministically.
 */
export function computeAvailableSlots(input: ComputeSlotsInput): number[] {
  const {
    workingIntervals,
    busyIntervals,
    durationMinutes,
    stepMinutes,
    minStartMinutes = 0,
  } = input;

  if (durationMinutes <= 0 || stepMinutes <= 0) return [];

  const slots: number[] = [];

  for (const window of workingIntervals) {
    // Align first candidate to the step grid within the window.
    let start = window.start;
    if (start < minStartMinutes) {
      // Advance to the first grid point >= minStartMinutes.
      const diff = minStartMinutes - window.start;
      start = window.start + Math.ceil(diff / stepMinutes) * stepMinutes;
    }

    for (; start + durationMinutes <= window.end; start += stepMinutes) {
      const candidate: Interval = { start, end: start + durationMinutes };
      const conflicts = busyIntervals.some((busy) =>
        intervalsOverlap(candidate, busy),
      );
      if (!conflicts) slots.push(start);
    }
  }

  // De-duplicate (overlapping working windows) and sort.
  return Array.from(new Set(slots)).sort((a, b) => a - b);
}

/** Convenience: returns slots formatted as "HH:mm". */
export function computeAvailableSlotsHHmm(input: ComputeSlotsInput): string[] {
  return computeAvailableSlots(input).map(formatHHmm);
}

/**
 * Checks whether a specific [start, start+duration) interval is free given the
 * busy intervals and working windows. Used server-side to double-check a
 * booking right before persisting it (defense against race conditions).
 */
export function isSlotAvailable(
  candidate: Interval,
  workingIntervals: Interval[],
  busyIntervals: Interval[],
): boolean {
  const withinWorking = workingIntervals.some(
    (w) => candidate.start >= w.start && candidate.end <= w.end,
  );
  if (!withinWorking) return false;
  return !busyIntervals.some((busy) => intervalsOverlap(candidate, busy));
}
