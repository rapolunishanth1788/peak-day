import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  MapPin, 
  Video, 
  ExternalLink, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  Circle, 
  Sparkles, 
  Plus,
  Repeat,
  Zap,
  Flame,
  Globe,
  Calendar as CalendarIcon,
  EyeOff
} from 'lucide-react';
import { ScheduleEvent, EventCategory } from '../../types';
import { resolveScheduleForDay, getDayOfWeekFromDate, DAYS_OF_WEEK } from '../../utils/scheduleResolution';

interface ScheduleDayTimelineProps {
  selectedDate: string;
  events: ScheduleEvent[];
  categoryColors: Record<EventCategory, { bg: string; border: string; text: string }>;
  onOpenAddAtTime: (timeStr: string) => void;
  onOpenEdit: (event: ScheduleEvent) => void;
  onDeleteEvent: (id: string) => void;
  onUpdateEvent: (event: ScheduleEvent) => void;
}

export const ScheduleDayTimeline: React.FC<ScheduleDayTimelineProps> = ({
  selectedDate,
  events,
  categoryColors,
  onOpenAddAtTime,
  onOpenEdit,
  onDeleteEvent,
  onUpdateEvent,
}) => {
  const [currentTime, setCurrentTime] = useState<string>('');
  const isToday = selectedDate === new Date().toISOString().split('T')[0];
  const dayOfWeek = getDayOfWeekFromDate(selectedDate);
  const currentDayName = DAYS_OF_WEEK.find((d) => d.id === dayOfWeek)?.full || 'Day';

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const h = String(now.getHours()).padStart(2, '0');
      const m = String(now.getMinutes()).padStart(2, '0');
      setCurrentTime(`${h}:${m}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  // Resolve all active events for this date (both general daily routine and day-specific/date-specific)
  const resolvedItems = resolveScheduleForDay(events, selectedDate, dayOfWeek);

  // Quick reschedule helper (+X minutes)
  const handleShiftTime = (evt: ScheduleEvent, minutesToAdd: number) => {
    const [sh, sm] = evt.startTime.split(':').map(Number);
    const [eh, em] = evt.endTime.split(':').map(Number);
    const duration = (eh * 60 + em) - (sh * 60 + sm);

    const newStartTotal = (sh * 60 + sm + minutesToAdd) % (24 * 60);
    const newEndTotal = (newStartTotal + duration) % (24 * 60);

    const nsh = String(Math.floor(newStartTotal / 60)).padStart(2, '0');
    const nsm = String(newStartTotal % 60).padStart(2, '0');
    const neh = String(Math.floor(newEndTotal / 60)).padStart(2, '0');
    const nem = String(newEndTotal % 60).padStart(2, '0');

    onUpdateEvent({
      ...evt,
      startTime: `${nsh}:${nsm}`,
      endTime: `${neh}:${nem}`,
    });
  };

  // Toggle completion
  const handleToggleComplete = (evt: ScheduleEvent) => {
    onUpdateEvent({
      ...evt,
      completed: !evt.completed,
    });
  };

  // Toggle skip on this day for a general routine event
  const handleToggleSkipForDay = (evt: ScheduleEvent) => {
    const disabled = evt.disabledDaysOfWeek || [];
    let updated: number[];
    if (disabled.includes(dayOfWeek)) {
      updated = disabled.filter((d) => d !== dayOfWeek);
    } else {
      updated = [...disabled, dayOfWeek];
    }
    onUpdateEvent({
      ...evt,
      disabledDaysOfWeek: updated,
    });
  };

  // Hours to show in timeline: 06:00 to 23:00
  const hours = Array.from({ length: 18 }, (_, i) => i + 6);

  return (
    <div className="space-y-4">
      {/* Current day & active routine summary bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-4 py-2.5 rounded-xl bg-[#0e1629] border border-slate-800 text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold text-white flex items-center gap-1.5">
            <CalendarIcon className="w-4 h-4 text-blue-400" />
            <span>{currentDayName} Agenda</span>
          </span>
          <span className="text-slate-400">({selectedDate})</span>
          {isToday && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-cyan-300">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
              <span>Today</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 text-slate-400 text-[11px]">
          <span className="flex items-center gap-1">
            <Globe className="w-3 h-3 text-blue-400" />
            <span>General Routine</span>
          </span>
          <span className="flex items-center gap-1">
            <CalendarIcon className="w-3 h-3 text-emerald-400" />
            <span>{currentDayName} Specific</span>
          </span>
        </div>
      </div>

      {/* Hourly Timeline Grid */}
      <div className="relative rounded-2xl bg-[#0b1222] border border-slate-800/90 p-4 sm:p-6 overflow-hidden">
        {/* Timeline Hours */}
        <div className="space-y-6 relative">
          {hours.map((hour) => {
            const timeLabel = `${String(hour).padStart(2, '0')}:00`;
            const matchingItems = resolvedItems.filter((item) => {
              const [eh] = item.event.startTime.split(':').map(Number);
              return eh === hour;
            });

            return (
              <div key={hour} className="group relative flex items-start gap-4 min-h-[64px]">
                {/* Hour Label */}
                <div className="w-14 sm:w-16 shrink-0 pt-0.5 text-right">
                  <span className="text-xs font-semibold text-slate-500 group-hover:text-blue-400 transition-colors">
                    {timeLabel}
                  </span>
                </div>

                {/* Horizontal Guide line */}
                <div className="absolute left-16 sm:left-20 right-0 top-3 h-px bg-slate-800/70 group-hover:bg-slate-700/80 transition-colors pointer-events-none" />

                {/* Slot Content Container */}
                <div className="flex-1 pl-4 sm:pl-6 space-y-2 relative z-10">
                  {matchingItems.length > 0 ? (
                    matchingItems.map(({ event: evt, sourceType, sourceLabel }) => {
                      const style = categoryColors[evt.category] || categoryColors.class;
                      return (
                        <div
                          key={evt.id}
                          className={`p-3.5 sm:p-4 rounded-xl border ${style.border} ${style.bg} transition-all hover:scale-[1.008] shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 group/card ${
                            evt.completed ? 'opacity-60 bg-slate-900/40 border-slate-800' : ''
                          }`}
                        >
                          <div className="flex items-start gap-3 min-w-0">
                            {/* Completion Checkbox */}
                            <button
                              type="button"
                              onClick={() => handleToggleComplete(evt)}
                              className="mt-0.5 text-slate-400 hover:text-emerald-400 transition-colors shrink-0"
                              title={evt.completed ? 'Mark as incomplete' : 'Mark as completed'}
                            >
                              {evt.completed ? (
                                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                              ) : (
                                <Circle className="w-5 h-5 text-slate-500 hover:text-slate-300" />
                              )}
                            </button>

                            <div className="space-y-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`text-sm font-bold text-white group-hover/card:text-blue-300 transition-colors ${evt.completed ? 'line-through text-slate-400' : ''}`}>
                                  {evt.title}
                                </span>

                                <span className={`text-[10px] px-2 py-0.5 rounded-md font-semibold uppercase tracking-wider ${style.text} bg-slate-900/70 border ${style.border}`}>
                                  {evt.category}
                                </span>

                                {/* Source Routine Badge (General vs Day-Specific vs Single Date) */}
                                {sourceType === 'general' ? (
                                  <span className="text-[10px] px-2 py-0.5 rounded-md font-semibold bg-blue-500/20 text-cyan-300 border border-blue-500/30 flex items-center gap-1">
                                    <Globe className="w-3 h-3" />
                                    <span>Every Day</span>
                                  </span>
                                ) : sourceType === 'dayOfWeek' ? (
                                  <span className="text-[10px] px-2 py-0.5 rounded-md font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                                    <CalendarIcon className="w-3 h-3" />
                                    <span>{sourceLabel}</span>
                                  </span>
                                ) : (
                                  <span className="text-[10px] px-2 py-0.5 rounded-md font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                                    Specific Date
                                  </span>
                                )}

                                {evt.isHighFocus && (
                                  <span className="text-[10px] px-2 py-0.5 rounded-md font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                                    <Flame className="w-3 h-3 text-amber-400" />
                                    <span>High Focus</span>
                                  </span>
                                )}
                              </div>

                              {/* Time, Location, and Link info */}
                              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                                <span className="font-semibold text-slate-300 flex items-center gap-1">
                                  <Clock className="w-3.5 h-3.5 text-blue-400" />
                                  <span>{evt.startTime} - {evt.endTime}</span>
                                </span>

                                {evt.location && (
                                  <span className="flex items-center gap-1 text-slate-300">
                                    <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                                    <span>{evt.location}</span>
                                  </span>
                                )}

                                {evt.meetingUrl && (
                                  <a
                                    href={evt.meetingUrl}
                                    target="_blank"
                                    rel="noreferrer noopener"
                                    className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 underline font-medium"
                                  >
                                    <Video className="w-3.5 h-3.5" />
                                    <span>Join Meeting / Class</span>
                                    <ExternalLink className="w-3 h-3" />
                                  </a>
                                )}

                                {evt.notes && (
                                  <span className="text-slate-400 italic truncate max-w-sm">
                                    "{evt.notes}"
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Quick Actions (Reschedule, Skip Today for General, Edit, Delete) */}
                          <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0 opacity-90 sm:opacity-75 group-hover/card:opacity-100 transition-opacity">
                            {/* Quick +15m / +30m Shift */}
                            <div className="hidden sm:flex items-center gap-1 bg-slate-900/90 border border-slate-800 rounded-lg p-0.5 text-[10px]">
                              <button
                                onClick={() => handleShiftTime(evt, 15)}
                                className="px-1.5 py-0.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
                                title="Shift start & end forward by 15 minutes"
                              >
                                +15m
                              </button>
                              <button
                                onClick={() => handleShiftTime(evt, 30)}
                                className="px-1.5 py-0.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
                                title="Shift start & end forward by 30 minutes"
                              >
                                +30m
                              </button>
                            </div>

                            {/* If general routine, allow skipping on this day */}
                            {sourceType === 'general' && (
                              <button
                                onClick={() => handleToggleSkipForDay(evt)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 transition-colors"
                                title={`Skip this general event on ${currentDayName}`}
                              >
                                <EyeOff className="w-4 h-4" />
                              </button>
                            )}

                            <button
                              onClick={() => onOpenEdit(evt)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                              title="Edit Event"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => onDeleteEvent(evt.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                              title="Delete Event"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    /* Empty Hour Slot: Hoverable to create event at this time */
                    <button
                      type="button"
                      onClick={() => onOpenAddAtTime(timeLabel)}
                      className="w-full text-left py-2 px-3 rounded-lg border border-dashed border-slate-800 hover:border-blue-500/40 hover:bg-blue-500/5 text-slate-500 hover:text-blue-300 text-xs transition-all flex items-center justify-between group/slot"
                    >
                      <span className="opacity-0 group-hover/slot:opacity-100 transition-opacity flex items-center gap-1.5">
                        <Plus className="w-3.5 h-3.5 text-blue-400" />
                        <span>Schedule at {timeLabel}</span>
                      </span>
                      <span className="text-[10px] text-slate-600 group-hover/slot:text-slate-400">
                        Free Slot
                      </span>
                    </button>
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
