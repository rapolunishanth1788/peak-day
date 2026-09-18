import { ScheduleEvent, ScheduleScope } from '../types';

export interface ResolvedScheduleItem {
  event: ScheduleEvent;
  sourceType: 'general' | 'dayOfWeek' | 'specificDate';
  sourceLabel: string;
  isOverriddenOrCustomized?: boolean;
}

export const DAYS_OF_WEEK = [
  { id: 0, short: 'Sun', full: 'Sunday' },
  { id: 1, short: 'Mon', full: 'Monday' },
  { id: 2, short: 'Tue', full: 'Tuesday' },
  { id: 3, short: 'Wed', full: 'Wednesday' },
  { id: 4, short: 'Thu', full: 'Thursday' },
  { id: 5, short: 'Fri', full: 'Friday' },
  { id: 6, short: 'Sat', full: 'Saturday' },
];

/**
 * Returns the day of week (0-6, where 0=Sunday, 1=Monday... 6=Saturday) from a YYYY-MM-DD date string.
 */
export function getDayOfWeekFromDate(dateStr: string): number {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.getDay();
}

/**
 * Checks if an event is active on a given date and day of week.
 */
export function isEventActiveOnDay(
  evt: ScheduleEvent,
  targetDate: string,
  targetDayOfWeek: number
): { active: boolean; sourceType: 'general' | 'dayOfWeek' | 'specificDate'; sourceLabel: string } {
  // Check if disabled/skipped on this day of week
  if (evt.disabledDaysOfWeek && evt.disabledDaysOfWeek.includes(targetDayOfWeek)) {
    return { active: false, sourceType: 'general', sourceLabel: 'Skipped today' };
  }

  // 1. General Daily Routine (common for every single day)
  const isGeneral = 
    evt.isGeneralRoutine === true || 
    evt.scheduleScope === 'general' || 
    evt.recurring === 'daily';

  if (isGeneral) {
    return {
      active: true,
      sourceType: 'general',
      sourceLabel: 'General Daily (All Days)',
    };
  }

  // 2. Day of Week specific (e.g. Every Monday, Every Tuesday, or multiple days)
  const isDayOfWeek = 
    evt.scheduleScope === 'dayOfWeek' || 
    evt.recurring === 'weekly' || 
    (evt.daysOfWeek && evt.daysOfWeek.length > 0) ||
    evt.dayOfWeek !== undefined;

  if (isDayOfWeek) {
    const matchesDay = 
      (evt.daysOfWeek && evt.daysOfWeek.includes(targetDayOfWeek)) ||
      evt.dayOfWeek === targetDayOfWeek;

    if (matchesDay) {
      const dayName = DAYS_OF_WEEK.find(d => d.id === targetDayOfWeek)?.short || 'Day';
      return {
        active: true,
        sourceType: 'dayOfWeek',
        sourceLabel: `${dayName} Routine`,
      };
    }
  }

  // 3. Weekdays recurring (Mon-Fri)
  if (evt.recurring === 'weekdays' && targetDayOfWeek >= 1 && targetDayOfWeek <= 5) {
    return {
      active: true,
      sourceType: 'dayOfWeek',
      sourceLabel: 'Mon-Fri Weekday',
    };
  }

  // 4. Specific Date only
  if (evt.date === targetDate) {
    return {
      active: true,
      sourceType: 'specificDate',
      sourceLabel: 'Specific Date Only',
    };
  }

  return { active: false, sourceType: 'specificDate', sourceLabel: 'Inactive' };
}

/**
 * Resolves and sorts all active events for a specific date or day of week.
 */
export function resolveScheduleForDay(
  events: ScheduleEvent[],
  targetDate: string,
  targetDayOfWeek?: number
): ResolvedScheduleItem[] {
  const dow = targetDayOfWeek !== undefined ? targetDayOfWeek : getDayOfWeekFromDate(targetDate);
  const resolved: ResolvedScheduleItem[] = [];

  events.forEach((evt) => {
    const check = isEventActiveOnDay(evt, targetDate, dow);
    if (check.active) {
      resolved.push({
        event: evt,
        sourceType: check.sourceType,
        sourceLabel: check.sourceLabel,
      });
    }
  });

  return resolved.sort((a, b) => a.event.startTime.localeCompare(b.event.startTime));
}
