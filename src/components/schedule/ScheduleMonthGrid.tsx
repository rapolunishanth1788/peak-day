import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, Globe } from 'lucide-react';
import { ScheduleEvent, EventCategory } from '../../types';
import { isEventActiveOnDay, getDayOfWeekFromDate } from '../../utils/scheduleResolution';

interface ScheduleMonthGridProps {
  selectedDate: string;
  events: ScheduleEvent[];
  categoryColors: Record<EventCategory, { bg: string; border: string; text: string }>;
  onSelectDate: (date: string) => void;
  onOpenAddAtDate: (dateStr: string) => void;
  onOpenEdit: (event: ScheduleEvent) => void;
}

export const ScheduleMonthGrid: React.FC<ScheduleMonthGridProps> = ({
  selectedDate,
  events,
  categoryColors,
  onSelectDate,
  onOpenAddAtDate,
  onOpenEdit,
}) => {
  const currentDate = new Date(selectedDate);
  const [currentYear, setCurrentYear] = useState(currentDate.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(currentDate.getMonth()); // 0-11

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  const shiftMonth = (offset: number) => {
    let nextM = currentMonth + offset;
    let nextY = currentYear;
    if (nextM < 0) {
      nextM = 11;
      nextY--;
    } else if (nextM > 11) {
      nextM = 0;
      nextY++;
    }
    setCurrentMonth(nextM);
    setCurrentYear(nextY);
  };

  // First day of current month
  const firstDay = new Date(currentYear, currentMonth, 1);
  const startingDayOfWeek = firstDay.getDay(); // 0 = Sun, 1 = Mon...
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  // Days array for the month matrix
  const days = [];
  // Leading empty days
  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(null);
  }
  // Days of the month
  for (let d = 1; d <= daysInMonth; d++) {
    const mStr = String(currentMonth + 1).padStart(2, '0');
    const dStr = String(d).padStart(2, '0');
    days.push({
      dayNumber: d,
      dateStr: `${currentYear}-${mStr}-${dStr}`,
    });
  }

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-4">
      {/* Month Header Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-[#0b1222] border border-slate-800/90">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <button
              onClick={() => shiftMonth(-1)}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => shiftMonth(1)}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
              title="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-blue-400" />
            <span>{monthNames[currentMonth]} {currentYear}</span>
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              const now = new Date();
              setCurrentYear(now.getFullYear());
              setCurrentMonth(now.getMonth());
              onSelectDate(todayStr);
            }}
            className="px-3 py-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
          >
            This Month
          </button>
          <span className="text-xs text-slate-400">
            Click any date to open day agenda
          </span>
        </div>
      </div>

      {/* 7-Column Calendar Grid */}
      <div className="rounded-2xl bg-[#0b1222] border border-slate-800/90 overflow-hidden">
        {/* Weekday Names */}
        <div className="grid grid-cols-7 border-b border-slate-800 bg-[#0e1629] text-center">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((wd) => (
            <div key={wd} className="py-2.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              {wd}
            </div>
          ))}
        </div>

        {/* Days Matrix */}
        <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-slate-800/60">
          {days.map((item, idx) => {
            if (!item) {
              return <div key={`empty-${idx}`} className="min-h-[96px] bg-slate-950/20" />;
            }

            const isSelected = item.dateStr === selectedDate;
            const isToday = item.dateStr === todayStr;
            const dayOfWeek = getDayOfWeekFromDate(item.dateStr);
            const dayEvents = events.filter(
              (ev) => isEventActiveOnDay(ev, item.dateStr, dayOfWeek).active
            );

            return (
              <div
                key={item.dateStr}
                onClick={() => onSelectDate(item.dateStr)}
                className={`min-h-[100px] p-2 flex flex-col justify-between transition-colors relative cursor-pointer hover:bg-blue-500/5 ${
                  isSelected ? 'bg-blue-600/10' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center ${
                      isToday
                        ? 'bg-blue-600 text-white shadow-sm'
                        : isSelected
                        ? 'bg-blue-500/20 text-blue-300 font-extrabold'
                        : 'text-slate-300'
                    }`}
                  >
                    {item.dayNumber}
                  </span>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenAddAtDate(item.dateStr);
                    }}
                    className="p-1 rounded text-slate-600 hover:text-blue-400 hover:bg-slate-800 opacity-0 group-hover:opacity-100 transition-all"
                    title={`Add event to ${item.dateStr}`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Day Event Pills */}
                <div className="space-y-1 mt-1 flex-1">
                  {dayEvents.slice(0, 3).map((evt) => {
                    const style = categoryColors[evt.category] || categoryColors.class;
                    return (
                      <div
                        key={evt.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenEdit(evt);
                        }}
                        className={`text-[10px] px-1.5 py-0.5 rounded truncate border ${style.border} ${style.bg} ${style.text} font-medium hover:scale-[1.02] transition-transform`}
                        title={`${evt.title} (${evt.startTime})`}
                      >
                        <span className="font-semibold text-white mr-1">{evt.startTime}</span>
                        <span>{evt.title}</span>
                      </div>
                    );
                  })}
                  {dayEvents.length > 3 && (
                    <div className="text-[9px] text-slate-500 font-semibold px-1">
                      +{dayEvents.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
