import React, { useState } from 'react';
import { 
  Globe, 
  Plus, 
  Sparkles, 
  Clock, 
  Edit3, 
  Trash2, 
  Flame, 
  Check, 
  CheckCircle2, 
  X,
  AlertCircle
} from 'lucide-react';
import { ScheduleEvent, EventCategory } from '../../types';
import { DAYS_OF_WEEK } from '../../utils/scheduleResolution';

interface GeneralRoutineManagerProps {
  events: ScheduleEvent[];
  categoryColors: Record<EventCategory, { bg: string; border: string; text: string }>;
  onAddEvent: (event: Omit<ScheduleEvent, 'id' | 'userId'>) => void;
  onUpdateEvent: (event: ScheduleEvent) => void;
  onDeleteEvent: (id: string) => void;
  onOpenEdit: (event: ScheduleEvent) => void;
}

export const GeneralRoutineManager: React.FC<GeneralRoutineManagerProps> = ({
  events,
  categoryColors,
  onAddEvent,
  onUpdateEvent,
  onDeleteEvent,
  onOpenEdit,
}) => {
  // Filter events that are general daily routine (common to every single day)
  const generalEvents = events.filter(
    (ev) => ev.isGeneralRoutine === true || ev.scheduleScope === 'general' || ev.recurring === 'daily'
  ).sort((a, b) => a.startTime.localeCompare(b.startTime));

  const [quickTitle, setQuickTitle] = useState('');
  const [quickStartTime, setQuickStartTime] = useState('08:00');
  const [quickEndTime, setQuickEndTime] = useState('09:00');
  const [quickCategory, setQuickCategory] = useState<EventCategory>('study');
  const [isAdding, setIsAdding] = useState(false);

  // Toggle day exclusion for a general event
  const handleToggleDayForEvent = (evt: ScheduleEvent, dayId: number) => {
    const disabled = evt.disabledDaysOfWeek || [];
    let updatedDisabled: number[];
    if (disabled.includes(dayId)) {
      updatedDisabled = disabled.filter((d) => d !== dayId);
    } else {
      updatedDisabled = [...disabled, dayId];
    }

    onUpdateEvent({
      ...evt,
      disabledDaysOfWeek: updatedDisabled,
    });
  };

  // Quick preset loader
  const handleLoadBlueprint = (type: 'student' | 'executive') => {
    const today = new Date().toISOString().split('T')[0];
    if (type === 'student') {
      const studentDefaults: Omit<ScheduleEvent, 'id' | 'userId'>[] = [
        {
          title: 'Morning Focus & Academic Review',
          category: 'study',
          date: today,
          startTime: '07:30',
          endTime: '08:30',
          scheduleScope: 'general',
          isGeneralRoutine: true,
          isHighFocus: true,
          notes: 'High cognitive energy window for reading or problem set warm-up',
        },
        {
          title: 'Lunch & Cognitive Reset',
          category: 'personal',
          date: today,
          startTime: '12:30',
          endTime: '13:30',
          scheduleScope: 'general',
          isGeneralRoutine: true,
          notes: 'Nutritious meal and brief walk',
        },
        {
          title: 'Daily Training & Workout',
          category: 'workout',
          date: today,
          startTime: '17:30',
          endTime: '18:45',
          scheduleScope: 'general',
          isGeneralRoutine: true,
          disabledDaysOfWeek: [0], // Rest day on Sunday
          notes: 'Strength, hypertrophy, or cardio session (Rest on Sunday)',
        },
        {
          title: 'Evening Study Wrap-up & Tomorrow Planning',
          category: 'study',
          date: today,
          startTime: '21:00',
          endTime: '22:00',
          scheduleScope: 'general',
          isGeneralRoutine: true,
          notes: 'Daily task wrap-up and agenda review',
        },
      ];

      studentDefaults.forEach((item) => onAddEvent(item));
    } else {
      const execDefaults: Omit<ScheduleEvent, 'id' | 'userId'>[] = [
        {
          title: 'Executive Deep Work Block',
          category: 'deepwork',
          date: today,
          startTime: '08:00',
          endTime: '10:30',
          scheduleScope: 'general',
          isGeneralRoutine: true,
          isHighFocus: true,
          notes: 'Uninterrupted strategic execution and mission-critical deliverables',
        },
        {
          title: 'Lunch & Network Break',
          category: 'personal',
          date: today,
          startTime: '12:30',
          endTime: '13:30',
          scheduleScope: 'general',
          isGeneralRoutine: true,
        },
        {
          title: 'Daily Fitness & Recovery',
          category: 'workout',
          date: today,
          startTime: '18:00',
          endTime: '19:00',
          scheduleScope: 'general',
          isGeneralRoutine: true,
          disabledDaysOfWeek: [0],
        },
      ];

      execDefaults.forEach((item) => onAddEvent(item));
    }
  };

  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;

    const today = new Date().toISOString().split('T')[0];
    onAddEvent({
      title: quickTitle.trim(),
      category: quickCategory,
      date: today,
      startTime: quickStartTime,
      endTime: quickEndTime,
      scheduleScope: 'general',
      isGeneralRoutine: true,
      recurring: 'daily',
    });

    setQuickTitle('');
    setIsAdding(false);
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Master Routine Header Callout */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-[#0e172e] via-[#101b38] to-[#12162f] border border-blue-500/30 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-32 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-blue-500/20 text-cyan-300 border border-blue-500/30">
                <Globe className="w-5 h-5" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white tracking-wide">
                General Daily Blueprint (Master Routine)
              </h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
              These baseline blocks automatically apply to <strong>every single day</strong> of your week (Monday through Sunday). You can customize or turn off individual blocks on specific days (like resting on Sundays or adjusting on Monday) without altering your master routine.
            </p>
          </div>

          {/* Quick Starter Templates */}
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            <button
              onClick={() => handleLoadBlueprint('student')}
              className="px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-blue-300 hover:text-white border border-blue-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Load Student Blueprint</span>
            </button>

            <button
              onClick={() => handleLoadBlueprint('executive')}
              className="px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-indigo-300 hover:text-white border border-indigo-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Load Executive Blueprint</span>
            </button>
          </div>
        </div>
      </div>

      {/* Routine Blocks List */}
      <div className="rounded-2xl bg-[#0b1222] border border-slate-800/90 p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-white">Universal Routine Blocks</span>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-500/20 text-cyan-300">
              {generalEvents.length} Active
            </span>
          </div>

          <button
            onClick={() => setIsAdding(!isAdding)}
            className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add General Block</span>
          </button>
        </div>

        {/* Quick Add Form */}
        {isAdding && (
          <form onSubmit={handleQuickAdd} className="p-4 rounded-xl bg-[#0f172a] border border-blue-500/30 space-y-3 animate-in fade-in duration-150">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white">Add New Universal Everyday Block</span>
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-[11px] text-slate-400 mb-1">Block Title</label>
                <input
                  type="text"
                  placeholder="e.g. Morning Study Block or Workout"
                  value={quickTitle}
                  onChange={(e) => setQuickTitle(e.target.value)}
                  className="w-full bg-[#0a101f] border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Start Time</label>
                <input
                  type="time"
                  value={quickStartTime}
                  onChange={(e) => setQuickStartTime(e.target.value)}
                  className="w-full bg-[#0a101f] border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">End Time</label>
                <input
                  type="time"
                  value={quickEndTime}
                  onChange={(e) => setQuickEndTime(e.target.value)}
                  className="w-full bg-[#0a101f] border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2">
                <label className="text-[11px] text-slate-400">Category:</label>
                <select
                  value={quickCategory}
                  onChange={(e) => setQuickCategory(e.target.value as EventCategory)}
                  className="bg-[#0a101f] border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white"
                >
                  <option value="study">Study</option>
                  <option value="class">Class</option>
                  <option value="deepwork">Deep Work</option>
                  <option value="workout">Workout</option>
                  <option value="personal">Personal / Meal</option>
                  <option value="meeting">Meeting</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-white bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 shadow-sm"
                >
                  Save to All Days
                </button>
              </div>
            </div>
          </form>
        )}

        {/* List of general routine blocks */}
        {generalEvents.length > 0 ? (
          <div className="space-y-3">
            {generalEvents.map((evt) => {
              const style = categoryColors[evt.category] || categoryColors.class;
              const disabledDays = evt.disabledDaysOfWeek || [];

              return (
                <div
                  key={evt.id}
                  className={`p-4 rounded-xl border ${style.border} ${style.bg} transition-all hover:scale-[1.005] flex flex-col md:flex-row md:items-center justify-between gap-4`}
                >
                  <div className="flex items-start gap-3.5">
                    {/* Time indicator */}
                    <div className="flex flex-col items-center justify-center w-20 py-2 px-2.5 rounded-xl bg-slate-900/90 border border-slate-800 shrink-0 text-center shadow-xs">
                      <span className="text-xs font-bold text-white leading-none">{evt.startTime}</span>
                      <span className="text-[10px] text-slate-400 leading-none mt-1">{evt.endTime}</span>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-white">{evt.title}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-md font-semibold uppercase tracking-wider ${style.text} bg-slate-900/70 border ${style.border}`}>
                          {evt.category}
                        </span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-500/20 text-cyan-300 border border-blue-500/30 flex items-center gap-1">
                          <Globe className="w-3 h-3" />
                          <span>Every Single Day</span>
                        </span>
                        {evt.isHighFocus && (
                          <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                            <Flame className="w-3 h-3 text-amber-400" />
                            <span>High Focus</span>
                          </span>
                        )}
                      </div>

                      {evt.notes && (
                        <p className="text-xs text-slate-400 italic">
                          "{evt.notes}"
                        </p>
                      )}

                      {/* Day Active Selector: Click to toggle off on specific days */}
                      <div className="flex items-center gap-1.5 pt-1 flex-wrap">
                        <span className="text-[10px] text-slate-400 font-medium mr-1">Active on:</span>
                        {DAYS_OF_WEEK.map((d) => {
                          const isSkipped = disabledDays.includes(d.id);
                          return (
                            <button
                              key={d.id}
                              type="button"
                              onClick={() => handleToggleDayForEvent(evt, d.id)}
                              className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                                !isSkipped
                                  ? 'bg-blue-600/30 text-blue-200 border border-blue-500/40 shadow-xs'
                                  : 'bg-slate-900/60 text-slate-500 hover:text-slate-400 line-through'
                              }`}
                              title={!isSkipped ? `Active on ${d.full}. Click to skip on ${d.full}` : `Skipped on ${d.full}. Click to enable.`}
                            >
                              {d.short}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 self-end md:self-auto shrink-0">
                    <button
                      onClick={() => onOpenEdit(evt)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                      title="Edit General Event"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDeleteEvent(evt.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title="Delete from All Days"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-12 text-center space-y-3">
            <Globe className="w-10 h-10 text-slate-600 mx-auto" />
            <div className="text-sm font-semibold text-slate-300">No general daily routine blocks configured</div>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Add your everyday recurring blocks like wake-up, lunch, workout, or study hours. They will automatically populate every day of the week!
            </p>
            <div className="pt-2 flex items-center justify-center gap-2">
              <button
                onClick={() => handleLoadBlueprint('student')}
                className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold"
              >
                Load Student Daily Routine
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
