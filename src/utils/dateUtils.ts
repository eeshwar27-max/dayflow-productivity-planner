import { Task, RecurringOccurrenceRecord } from '../types';
import { detectUserTimezone } from '../config/brandConfig';

export const DEFAULT_TIMEZONE = detectUserTimezone();

/**
 * Returns the current date string (YYYY-MM-DD) in the specified IANA timezone.
 * Avoids .toISOString() which shifts local calendar dates near midnight.
 */
export function getTodayInTimezone(
  timezone: string = DEFAULT_TIMEZONE,
  referenceDate: Date = new Date()
): string {
  const safeTz = isValidTimezone(timezone) ? timezone : 'UTC';
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: safeTz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = formatter.formatToParts(referenceDate);
  const year = parts.find((p) => p.type === 'year')?.value ?? '2026';
  const month = parts.find((p) => p.type === 'month')?.value ?? '01';
  const day = parts.find((p) => p.type === 'day')?.value ?? '01';
  return `${year}-${month}-${day}`;
}

export function isValidTimezone(tz: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

/**
 * Returns the current time in HH:mm (24-hour) in the specified timezone.
 */
export function getCurrentTimeInTimezone(
  timezone: string = DEFAULT_TIMEZONE,
  referenceDate: Date = new Date()
): string {
  const safeTz = isValidTimezone(timezone) ? timezone : 'UTC';
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: safeTz,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  return formatter.format(referenceDate);
}

/**
 * Formats an ISO timestamp or Date into a readable timestamp in the user's timezone.
 */
export function formatTimestamp(
  dateInput: Date | string = new Date(),
  timezone: string = DEFAULT_TIMEZONE,
  use12Hour: boolean = true
): string {
  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(d.getTime())) return '';
  const safeTz = isValidTimezone(timezone) ? timezone : 'UTC';
  return new Intl.DateTimeFormat('en-US', {
    timeZone: safeTz,
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: use12Hour,
  }).format(d);
}

/**
 * Parses a YYYY-MM-DD string into { year, month (1-12), day (1-31) } safely without timezone drift.
 */
export function parseDateParts(dateStr: string): { year: number; month: number; day: number } {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr.trim());
  if (!match) {
    throw new Error(`Invalid date string format: ${dateStr}. Expected YYYY-MM-DD.`);
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) {
    throw new Error(`Out of range date parts in: ${dateStr}`);
  }
  const maxDays = getDaysInMonth(year, month);
  if (day > maxDays) {
    throw new Error(`Invalid day ${day} for month ${year}-${month}`);
  }
  return { year, month, day };
}

export function isValidDateString(dateStr?: string): boolean {
  if (!dateStr) return false;
  try {
    parseDateParts(dateStr);
    return true;
  } catch {
    return false;
  }
}

export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

export function getDaysInMonth(year: number, month1To12: number): number {
  const daysPerMonth = [31, isLeapYear(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return daysPerMonth[month1To12 - 1] ?? 30;
}

/**
 * Converts { year, month, day } to a UTC noon Date object solely for pure calendar math.
 */
function toCalendarUTCDate(dateStr: string): Date {
  const { year, month, day } = parseDateParts(dateStr);
  return new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
}

function fromCalendarUTCDate(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Adds (or subtracts) N calendar days from a YYYY-MM-DD date string deterministically.
 */
export function addDays(dateStr: string, daysToAdd: number): string {
  const utc = toCalendarUTCDate(dateStr);
  utc.setUTCDate(utc.getUTCDate() + daysToAdd);
  return fromCalendarUTCDate(utc);
}

/**
 * Returns day of week (0 = Sunday, 1 = Monday, ..., 6 = Saturday) for a YYYY-MM-DD string.
 */
export function getDayOfWeek(dateStr: string): number {
  return toCalendarUTCDate(dateStr).getUTCDay();
}

/**
 * Returns the difference in calendar days (dateB - dateA).
 * Positive when dateB is after dateA.
 */
export function diffInDays(dateA: string, dateB: string): number {
  const utcA = toCalendarUTCDate(dateA);
  const utcB = toCalendarUTCDate(dateB);
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round((utcB.getTime() - utcA.getTime()) / msPerDay);
}

/**
 * Calculates the next Monday strictly AFTER the given YYYY-MM-DD date string.
 */
export function getNextMondayAfter(dateStr: string): string {
  const dow = getDayOfWeek(dateStr); // 0 = Sun, 1 = Mon, ..., 6 = Sat
  const daysUntilNextMonday = dow === 0 ? 1 : 8 - dow;
  return addDays(dateStr, daysUntilNextMonday);
}

/**
 * Returns the start of the week (Monday if weekStartsOn=1, Sunday if weekStartsOn=0)
 * containing the given YYYY-MM-DD date string.
 */
export function getWeekStartDate(dateStr: string, weekStartsOn: 1 | 0 = 1): string {
  const dow = getDayOfWeek(dateStr);
  if (weekStartsOn === 1) {
    const diff = dow === 0 ? -6 : 1 - dow;
    return addDays(dateStr, diff);
  } else {
    return addDays(dateStr, -dow);
  }
}

/**
 * Returns an array of 7 YYYY-MM-DD strings for the week starting at weekStartDate.
 */
export function getWeekDays(weekStartDate: string): string[] {
  return Array.from({ length: 7 }, (_, i) => addDays(weekStartDate, i));
}

/**
 * Formats a YYYY-MM-DD date into a friendly readable string (e.g., "Sun, Oct 11, 2026").
 */
export function formatReadableDate(
  dateStr: string,
  options: { includeWeekday?: boolean; includeYear?: boolean; shortMonth?: boolean } = {
    includeWeekday: true,
    includeYear: true,
    shortMonth: true,
  }
): string {
  if (!isValidDateString(dateStr)) return dateStr || 'No date';
  const utc = toCalendarUTCDate(dateStr);
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'UTC',
    weekday: options.includeWeekday ? 'short' : undefined,
    day: 'numeric',
    month: options.shortMonth !== false ? 'short' : 'long',
    year: options.includeYear ? 'numeric' : undefined,
  }).format(utc);
}

/**
 * Formats a 24-hour "HH:mm" string into 12-hour or 24-hour format (e.g. "09:00" -> "9:00 AM", "17:30" -> "5:30 PM").
 */
export function formatTime12h(time24?: string, use12Hour: boolean = true): string {
  if (!time24) return '';
  const match = /^(\d{1,2}):(\d{2})$/.exec(time24.trim());
  if (!match) return time24;
  const hours24 = Number(match[1]);
  const minutes = match[2];
  if (!use12Hour) {
    return `${String(hours24).padStart(2, '0')}:${minutes}`;
  }
  const period = hours24 >= 12 ? 'PM' : 'AM';
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
  return `${hours12}:${minutes} ${period}`;
}

/**
 * Converts "HH:mm" to minutes since midnight (0..1439).
 */
export function timeToMinutes(time24: string): number {
  const match = /^(\d{1,2}):(\d{2})$/.exec(time24.trim());
  if (!match) return 0;
  return Number(match[1]) * 60 + Number(match[2]);
}

/**
 * Converts minutes since midnight to "HH:mm".
 */
export function minutesToTime(totalMinutes: number): string {
  const clamped = Math.max(0, Math.min(23 * 60 + 59, Math.round(totalMinutes)));
  const h = Math.floor(clamped / 60);
  const m = clamped % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * Checks if two [start, end) time intervals (in HH:mm) on the same day overlap.
 */
export function doTimeRangesOverlap(
  startA: string,
  endA: string,
  startB: string,
  endB: string
): boolean {
  const sA = timeToMinutes(startA);
  const eA = timeToMinutes(endA);
  const sB = timeToMinutes(startB);
  const eB = timeToMinutes(endB);
  if (eA <= sA || eB <= sB) return false;
  return sA < eB && sB < eA;
}

/**
 * Determines whether a task with a recurrence rule occurs on targetDate (YYYY-MM-DD).
 */
export function doesRecurringTaskOccurOnDate(task: Task, targetDate: string): boolean {
  if (!task.recurrence || task.recurrence.frequency === 'none') {
    return task.dueDate === targetDate;
  }
  const anchorDate = task.dueDate;
  if (!anchorDate || !isValidDateString(anchorDate) || !isValidDateString(targetDate)) {
    return false;
  }
  const dayDiff = diffInDays(anchorDate, targetDate);
  if (dayDiff < 0) return false;

  const { frequency, daysOfWeek, intervalDays, endDate } = task.recurrence;
  if (endDate && isValidDateString(endDate) && diffInDays(endDate, targetDate) > 0) {
    return false;
  }

  const dow = getDayOfWeek(targetDate);

  switch (frequency) {
    case 'daily':
      return true;
    case 'weekdays':
      return dow >= 1 && dow <= 5;
    case 'selected_days':
      if (!daysOfWeek || daysOfWeek.length === 0) return dow === getDayOfWeek(anchorDate);
      return daysOfWeek.includes(dow);
    case 'weekly':
      return dayDiff % 7 === 0;
    case 'custom_interval': {
      const step = intervalDays && intervalDays > 0 ? intervalDays : 1;
      return dayDiff % step === 0;
    }
    default:
      return false;
  }
}

export interface ResolvedTaskInstance {
  instanceId: string;
  task: Task;
  date: string;
  isRecurringInstance: boolean;
  effectiveStatus: 'Not started' | 'In progress' | 'Completed' | 'Skipped';
  effectiveScheduledStart?: string;
  effectiveScheduledEnd?: string;
  occurrenceRecord?: RecurringOccurrenceRecord;
}

/**
 * Resolves all tasks (one-off and recurring) that apply to a specific date (YYYY-MM-DD).
 * Deterministic and idempotent: never duplicates occurrences on reload or re-render.
 */
export function getTasksForDate(
  tasks: Task[],
  occurrences: RecurringOccurrenceRecord[],
  targetDate: string
): ResolvedTaskInstance[] {
  const occMap = new Map<string, RecurringOccurrenceRecord>();
  for (const occ of occurrences) {
    occMap.set(`${occ.taskId}_${occ.date}`, occ);
  }

  const results: ResolvedTaskInstance[] = [];

  for (const task of tasks) {
    if (task.archived || task.inInbox) continue;
    const isRecurring = Boolean(task.recurrence && task.recurrence.frequency !== 'none');

    if (!isRecurring) {
      if (task.dueDate === targetDate) {
        results.push({
          instanceId: task.id,
          task,
          date: targetDate,
          isRecurringInstance: false,
          effectiveStatus: task.status,
          effectiveScheduledStart: task.scheduledStart,
          effectiveScheduledEnd: task.scheduledEnd,
        });
      }
      continue;
    }

    const rescheduledHere = occurrences.find(
      (o) => o.taskId === task.id && o.rescheduledToDate === targetDate
    );

    const naturallyOccurs = doesRecurringTaskOccurOnDate(task, targetDate);
    if (!naturallyOccurs && !rescheduledHere) continue;

    const record = occMap.get(`${task.id}_${targetDate}`);
    if (record?.rescheduledToDate && record.rescheduledToDate !== targetDate) {
      continue;
    }

    results.push({
      instanceId: `${task.id}_${targetDate}`,
      task,
      date: targetDate,
      isRecurringInstance: true,
      effectiveStatus: record ? record.status : 'Not started',
      effectiveScheduledStart: record?.scheduledStart ?? task.scheduledStart,
      effectiveScheduledEnd: record?.scheduledEnd ?? task.scheduledEnd,
      occurrenceRecord: record,
    });
  }

  return results;
}
