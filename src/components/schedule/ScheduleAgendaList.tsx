import React, { useState } from 'react';
import { 
  Search, 
  Clock, 
  MapPin, 
  Video, 
  ExternalLink, 
  CheckCircle2, 
  Circle, 
  Edit3, 
  Trash2, 
  Repeat, 
  Flame,
  Globe,
  Calendar as CalendarIcon
} from 'lucide-react';
import { ScheduleEvent, EventCategory } from '../../types';
import { DAYS_OF_WEEK } from '../../utils/scheduleResolution';

interface ScheduleAgendaListProps {
  events: ScheduleEvent[];
  selectedDate: string;
  categoryColors: Record<EventCategory, { bg: string; border: string; text: string }>;
  onOpenEdit: (event: ScheduleEvent) => void;
  onDeleteEvent: (id: string) => void;
  onUpdateEvent: (event: ScheduleEvent) => void;
  onSelectDate: (date: string) => void;
}

export const ScheduleAgendaList: React.FC<ScheduleAgendaListProps> = ({
  events,
  selectedDate,
  categoryColors,
  onOpenEdit,
  onDeleteEvent,
  onUpdateEvent,
  onSelectDate,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const todayStr = new Date().toISOString().split('T')[0];

  const filtered = events.filter((ev) => {
    const matchesSearch = 
      ev.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (ev.location && ev.location.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (ev.notes && ev.notes.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || ev.category === selectedCategory;
    return matchesSearch && matchesCategory;
  }).sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return a.startTime.localeCompare(b.startTime);
  });

  // Group events by Date
  const groupedByDate: Record<string, ScheduleEvent[]> = {};
  filtered.forEach((ev) => {
    if (!groupedByDate[ev.date]) {
      groupedByDate[ev.date] = [];
    }
    groupedByDate[ev.date].push(ev);
  });

  const sortedDates = Object.keys(groupedByDate).sort();

  return (
    <div className="space-y-4">
      {/* Search & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-[#0b1222] border border-slate-800/90">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search all events by title, room, notes or link..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#0e1629] border border-slate-700/80 rounded-xl pl-9 pr-3.5 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-blue-500 placeholder-slate-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'all', label: 'All' },
            { id: 'class', label: 'Classes' },
            { id: 'study', label: 'Study' },
            { id: 'meeting', label: 'Meetings' },
            { id: 'deepwork', label: 'Deep Work' },
            { id: 'workout', label: 'Workouts' },
            { id: 'exam', label: 'Exams' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedCategory === cat.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chronological Event Feed */}
      {sortedDates.length > 0 ? (
        <div className="space-y-6">
          {sortedDates.map((dateStr) => {
            const dateObj = new Date(dateStr);
            const isToday = dateStr === todayStr;
            const dateEvents = groupedByDate[dateStr];

            const dateLabel = isToday
              ? 'Today'
              : dateObj.toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'short',
                  day: 'numeric',
                });

            return (
              <div key={dateStr} className="space-y-3">
                {/* Date Heading */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4 text-blue-400" />
                    <span className="text-sm font-bold text-white">{dateLabel}</span>
                    <span className="text-xs text-slate-400">({dateStr})</span>
                    {isToday && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-cyan-300">
                        Current Day
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => onSelectDate(dateStr)}
                    className="text-xs text-blue-400 hover:text-blue-300 font-medium"
                  >
                    View Day Timeline →
                  </button>
                </div>

                {/* Event Cards for this date */}
                <div className="space-y-2.5">
                  {dateEvents.map((evt) => {
                    const style = categoryColors[evt.category] || categoryColors.class;
                    return (
                      <div
                        key={evt.id}
                        className={`p-3.5 sm:p-4 rounded-xl border ${style.border} ${style.bg} transition-all hover:scale-[1.005] flex flex-col sm:flex-row sm:items-center justify-between gap-3 group ${
                          evt.completed ? 'opacity-60 bg-slate-900/30' : ''
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <button
                            type="button"
                            onClick={() => onUpdateEvent({ ...evt, completed: !evt.completed })}
                            className="mt-0.5 text-slate-400 hover:text-emerald-400 transition-colors shrink-0"
                          >
                            {evt.completed ? (
                              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                            ) : (
                              <Circle className="w-5 h-5 text-slate-500 hover:text-slate-300" />
                            )}
                          </button>

                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`text-sm font-bold text-white ${evt.completed ? 'line-through text-slate-400' : ''}`}>
                                {evt.title}
                              </span>
                              <span className={`text-[10px] px-2 py-0.5 rounded-md font-semibold uppercase tracking-wider ${style.text} bg-slate-900/70 border ${style.border}`}>
                                {evt.category}
                              </span>

                              {/* Routine Scope Badge */}
                              {(evt.isGeneralRoutine || evt.scheduleScope === 'general' || evt.recurring === 'daily') ? (
                                <span className="text-[10px] px-2 py-0.5 rounded-md font-semibold bg-blue-500/20 text-cyan-300 border border-blue-500/30 flex items-center gap-1">
                                  <Globe className="w-3 h-3" />
                                  <span>Every Day</span>
                                </span>
                              ) : (evt.scheduleScope === 'dayOfWeek' || (evt.daysOfWeek && evt.daysOfWeek.length > 0)) ? (
                                <span className="text-[10px] px-2 py-0.5 rounded-md font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                                  <CalendarIcon className="w-3 h-3" />
                                  <span>
                                    {evt.daysOfWeek && evt.daysOfWeek.length > 0
                                      ? evt.daysOfWeek.map(d => DAYS_OF_WEEK.find(item => item.id === d)?.short).filter(Boolean).join(', ')
                                      : 'Weekly Day'}
                                  </span>
                                </span>
                              ) : null}

                              {evt.isHighFocus && (
                                <span className="text-[10px] px-2 py-0.5 rounded-md font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                                  <Flame className="w-3 h-3 text-amber-400" />
                                  <span>High Focus</span>
                                </span>
                              )}
                              {evt.recurring && evt.recurring !== 'none' && (
                                <span className="flex items-center gap-1 text-[10px] text-slate-400 bg-slate-800/80 px-1.5 py-0.5 rounded">
                                  <Repeat className="w-3 h-3" />
                                  <span className="capitalize">{evt.recurring}</span>
                                </span>
                              )}
                            </div>

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
                                  <span>Join Call</span>
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

                        <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0 opacity-80 group-hover:opacity-100">
                          <button
                            onClick={() => onOpenEdit(evt)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onDeleteEvent(evt.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-16 text-center rounded-2xl bg-[#0b1222] border border-slate-800/90 space-y-2">
          <CalendarIcon className="w-10 h-10 text-slate-600 mx-auto" />
          <div className="text-sm font-semibold text-slate-300">No matching events found</div>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try adjusting your search terms or filter, or use the Quick Event bar above to add an event.
          </p>
        </div>
      )}
    </div>
  );
};
