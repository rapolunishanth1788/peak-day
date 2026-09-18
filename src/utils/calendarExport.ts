import { ScheduleEvent } from '../types';

/**
 * Converts a date (YYYY-MM-DD) and time (HH:mm) into iCalendar UTC/Local format: YYYYMMDDTHHMMSS
 */
function toICalDateTime(dateStr: string, timeStr: string): string {
  const [year, month, day] = dateStr.split('-');
  const [hours, minutes] = timeStr.split(':');
  
  const cleanYear = year.padStart(4, '0');
  const cleanMonth = month.padStart(2, '0');
  const cleanDay = day.padStart(2, '0');
  const cleanHours = hours.padStart(2, '0');
  const cleanMinutes = minutes.padStart(2, '0');

  return `${cleanYear}${cleanMonth}${cleanDay}T${cleanHours}${cleanMinutes}00`;
}

/**
 * Escapes text fields according to RFC 5545 specifications.
 */
function escapeICalText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

/**
 * Generates an RFC 5545 .ics calendar file content from ScheduleEvent array
 * and triggers immediate browser download.
 */
export function exportScheduleToICS(events: ScheduleEvent[], calendarName = 'PeakDay Schedule') {
  const timestamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//PeakDay//Peak Schedule Planner//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${calendarName}`,
    'X-WR-TIMEZONE:UTC',
  ];

  events.forEach((evt) => {
    try {
      const dtStart = toICalDateTime(evt.date, evt.startTime);
      const dtEnd = toICalDateTime(evt.date, evt.endTime || evt.startTime);

      lines.push('BEGIN:VEVENT');
      lines.push(`UID:${evt.id}@peakday.app`);
      lines.push(`DTSTAMP:${timestamp}`);
      lines.push(`DTSTART:${dtStart}`);
      lines.push(`DTEND:${dtEnd}`);
      lines.push(`SUMMARY:${escapeICalText(evt.title)}`);

      const descParts: string[] = [];
      if (evt.category) descParts.push(`Category: ${evt.category.toUpperCase()}`);
      if (evt.isHighFocus) descParts.push(`Type: High-Focus Block`);
      if (evt.priority) descParts.push(`Priority: ${evt.priority}`);
      if (evt.meetingUrl) descParts.push(`Meeting Link: ${evt.meetingUrl}`);
      if (evt.attendees) descParts.push(`Attendees: ${evt.attendees}`);
      if (evt.notes) descParts.push(`Notes: ${evt.notes}`);

      if (descParts.length > 0) {
        lines.push(`DESCRIPTION:${escapeICalText(descParts.join('\n'))}`);
      }

      if (evt.location) {
        lines.push(`LOCATION:${escapeICalText(evt.location)}`);
      }

      if (evt.meetingUrl) {
        lines.push(`URL:${escapeICalText(evt.meetingUrl)}`);
      }

      // Recurrence rule if specified
      if (evt.recurring === 'daily') {
        lines.push('RRULE:FREQ=DAILY');
      } else if (evt.recurring === 'weekdays') {
        lines.push('RRULE:FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR');
      } else if (evt.recurring === 'weekly') {
        lines.push('RRULE:FREQ=WEEKLY');
      }

      lines.push('STATUS:CONFIRMED');
      lines.push('END:VEVENT');
    } catch (e) {
      console.warn('Skipping invalid event for ICS export:', evt, e);
    }
  });

  lines.push('END:VCALENDAR');

  const icsContent = lines.join('\r\n');
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `peakday-schedule-${new Date().toISOString().split('T')[0]}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
