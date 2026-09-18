import React from 'react';
import { ChevronLeft, ChevronRight, Plus, Clock, Sparkles, Globe } from 'lucide-react';
import { ScheduleEvent, EventCategory } from '../../types';
import { isEventActiveOnDay } from '../../utils/scheduleResolution';

interface ScheduleWeekGridProps {
  selectedDate: string;
  events: ScheduleEvent[];
  categoryColors: Record<EventCategory, { bg: string; border: string; text: string }>;
  onSelectDate: (date: string) => void;
  onOpenAddAtTime: (timeStr: string, dateStr?: string) => void;
  onOpenEdit: (event: ScheduleEvent) => void;
}

export const ScheduleWeekGrid: React.FC<ScheduleWeekGridProps> = ({
  selectedDate,
  events,
  categoryColors,
  onSelectDate,
  onOpenAddAtTime,
  onOpenEdit,
}) => {
  // Calculate the 7 days of the week containing selectedDate (Monday to Sunday)
  const current = new Date(selectedDate);
  const dayIndex = current.getDay(); // 0 = Sun, 1 = Mon...
  // Calculate Monday
  const distanceToMonday = (dayIndex + 6) % 7;
  const monday = new Date(current);
  monday.setDate(current.getDate() - distanceToMonday);

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
    const dayNumber = d.getDate();
    return { dateStr, dayName, dayNumber, dateObj: d, dayOfWeek: d.getDay() };
  });

  const hours = Array.from({ length: 14 }, (_, i) => i + 8); // 08:00 to 21:00

  // Shift week by -7 or +7 days
  const shiftWeek = (offsetDays: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + offsetDays);
    onSelectDate(d.toISOString().split('T')[0]);
  };

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-4">
      {/* Week Header Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-[#0b1222] border border-slate-800/90">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <button
              onClick={() => shiftWeek(-7)}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
              title="Previous Week"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => shiftWeek(7)}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
              title="Next Week"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <h3 className="text-sm font-bold text-white">
            Week of {weekDays[0].dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} –{' '}
            {weekDays[6].dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onSelectDate(todayStr)}
            className="px-3 py-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
          >
            Current Week
          </button>
          <span className="text-xs text-slate-400">
            Click any cell to schedule for that day & time
          </span>
        </div>
      </div>

      {/* Week Calendar Matrix */}
      <div className="rounded-2xl bg-[#0b1222] border border-slate-800/90 overflow-x-auto">
        <div className="min-w-[760px]">
          {/* Day Columns Header */}
          <div className="grid grid-cols-8 border-b border-slate-800 bg-[#0e1629]">
            {/* Time label placeholder */}
            <div className="p-3 text-center text-xs font-bold text-slate-500 border-r border-slate-800/80">
              Time
            </div>

            {/* 7 Day Headers */}
            {weekDays.map((day) => {
              const isSelected = day.dateStr === selectedDate;
              const isToday = day.dateStr === todayStr;
              const dayEvts = events.filter((ev) => isEventActiveOnDay(ev, day.dateStr, day.dayOfWeek).active);

              return (
                <button
                  key={day.dateStr}
                  type="button"
                  onClick={() => onSelectDate(day.dateStr)}
                  className={`p-2.5 text-center border-r border-slate-800/80 last:border-r-0 transition-colors cursor-pointer ${
                    isSelected ? 'bg-blue-600/15 text-blue-300' : 'hover:bg-slate-800/50'
                  }`}
                >
                  <span className="text-[11px] font-semibold uppercase tracking-wider block text-slate-400">
                    {day.dayName}
                  </span>
                  <div className="flex items-center justify-center gap-1.5 mt-0.5">
                    <span
                      className={`text-sm font-bold w-6 h-6 rounded-full flex items-center justify-center ${
                        isToday
                          ? 'bg-blue-600 text-white shadow-sm'
                          : isSelected
                          ? 'bg-blue-500/20 text-blue-300'
                          : 'text-white'
                      }`}
                    >
                      {day.dayNumber}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      ({dayEvts.length})
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Hourly Rows */}
          <div className="divide-y divide-slate-800/60">
            {hours.map((hour) => {
              const timeLabel = `${String(hour).padStart(2, '0')}:00`;

              return (
                <div key={hour} className="grid grid-cols-8 min-h-[56px] group">
                  {/* Time Label */}
                  <div className="p-2 text-center text-xs text-slate-500 font-medium border-r border-slate-800/80 bg-slate-900/30">
                    {timeLabel}
                  </div>

                  {/* 7 Columns for this hour */}
                  {weekDays.map((day) => {
                    const cellEvents = events.filter((ev) => {
                      const isActive = isEventActiveOnDay(ev, day.dateStr, day.dayOfWeek).active;
                      const [eh] = ev.startTime.split(':').map(Number);
                      return isActive && eh === hour;
                    });

                    return (
                      <div
                        key={day.dateStr}
                        onClick={() => onOpenAddAtTime(timeLabel, day.dateStr)}
                        className={`p-1 border-r border-slate-800/80 last:border-r-0 relative hover:bg-blue-500/5 cursor-pointer transition-colors ${
                          day.dateStr === selectedDate ? 'bg-blue-950/10' : ''
                        }`}
                      >
                        {cellEvents.map((evt) => {
                          const style = categoryColors[evt.category] || categoryColors.class;
                          const isGeneral = evt.isGeneralRoutine || evt.scheduleScope === 'general' || evt.recurring === 'daily';
                          return (
                            <div
                              key={evt.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                onOpenEdit(evt);
                              }}
                              className={`p-1.5 rounded-lg text-left text-[11px] font-semibold border ${style.border} ${style.bg} ${style.text} shadow-xs mb-1 truncate hover:scale-[1.02] transition-transform`}
                              title={`${evt.title} (${evt.startTime} - ${evt.endTime}) ${isGeneral ? '[General Daily Routine]' : '[Day Specific]'}`}
                            >
                              <div className="font-bold text-white truncate text-[11px] leading-tight flex items-center gap-1">
                                {isGeneral && <Globe className="w-2.5 h-2.5 text-blue-400 shrink-0" />}
                                <span className="truncate">{evt.title}</span>
                              </div>
                              <div className="text-[9px] opacity-80 mt-0.5">
                                {evt.startTime}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
