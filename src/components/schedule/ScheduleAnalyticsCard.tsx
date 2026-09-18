import React from 'react';
import { 
  BarChart3, 
  Flame, 
  BookOpen, 
  Briefcase, 
  Dumbbell, 
  Clock, 
  Zap,
  TrendingUp,
  Sparkles
} from 'lucide-react';
import { ScheduleEvent } from '../../types';
import { resolveScheduleForDay } from '../../utils/scheduleResolution';

interface ScheduleAnalyticsCardProps {
  selectedDate: string;
  events: ScheduleEvent[];
}

export const ScheduleAnalyticsCard: React.FC<ScheduleAnalyticsCardProps> = ({
  selectedDate,
  events,
}) => {
  const resolved = resolveScheduleForDay(events, selectedDate);
  const dayEvents = resolved.map((item) => item.event);

  // Helper to calculate total minutes
  const getMinutes = (timeStr: string) => {
    const [h, m] = (timeStr || '00:00').split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
  };

  let totalMinutes = 0;
  let academicMinutes = 0;
  let businessMinutes = 0;
  let focusMinutes = 0;
  let workoutMinutes = 0;

  dayEvents.forEach((ev) => {
    const start = getMinutes(ev.startTime);
    const end = getMinutes(ev.endTime);
    const duration = Math.max(0, end - start);
    totalMinutes += duration;

    if (ev.category === 'class' || ev.category === 'study' || ev.category === 'exam') {
      academicMinutes += duration;
    }
    if (ev.category === 'meeting' || ev.category === 'client' || ev.category === 'standup') {
      businessMinutes += duration;
    }
    if (ev.isHighFocus || ev.category === 'deepwork' || ev.category === 'study' || ev.category === 'exam') {
      focusMinutes += duration;
    }
    if (ev.category === 'workout') {
      workoutMinutes += duration;
    }
  });

  const formatHours = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h === 0) return `${m}m`;
    if (m === 0) return `${h}h`;
    return `${h}h ${m}m`;
  };

  // Find longest free block between 08:00 (480) and 20:00 (1200)
  const sorted = [...dayEvents].sort((a, b) => a.startTime.localeCompare(b.startTime));
  let longestFreeMinutes = 0;
  let freeBlockWindow = 'None';

  let lastEnd = 8 * 60; // 08:00 AM
  sorted.forEach((ev) => {
    const evStart = getMinutes(ev.startTime);
    const evEnd = getMinutes(ev.endTime);
    if (evStart > lastEnd) {
      const gap = evStart - lastEnd;
      if (gap > longestFreeMinutes) {
        longestFreeMinutes = gap;
        const sh = String(Math.floor(lastEnd / 60)).padStart(2, '0');
        const sm = String(lastEnd % 60).padStart(2, '0');
        const eh = String(Math.floor(evStart / 60)).padStart(2, '0');
        const em = String(evStart % 60).padStart(2, '0');
        freeBlockWindow = `${sh}:${sm} – ${eh}:${em}`;
      }
    }
    lastEnd = Math.max(lastEnd, evEnd);
  });
  // Check after last event until 20:00
  if (lastEnd < 20 * 60) {
    const endGap = 20 * 60 - lastEnd;
    if (endGap > longestFreeMinutes) {
      longestFreeMinutes = endGap;
      const sh = String(Math.floor(lastEnd / 60)).padStart(2, '0');
      const sm = String(lastEnd % 60).padStart(2, '0');
      freeBlockWindow = `${sh}:${sm} – 20:00`;
    }
  }

  return (
    <div className="rounded-2xl bg-[#0b1222] border border-slate-800/90 p-4 sm:p-5 shadow-lg space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-blue-500/15 text-blue-400 border border-blue-500/25">
            <BarChart3 className="w-4 h-4" />
          </div>
          <h4 className="text-xs sm:text-sm font-bold text-white tracking-wide">
            Schedule Load & Circadian Energy Intelligence
          </h4>
        </div>
        <span className="text-[11px] text-slate-400 font-medium">
          {dayEvents.length} active commitments
        </span>
      </div>

      {/* 4-Stat Metric Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {/* Total Time */}
        <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
            <Clock className="w-3.5 h-3.5 text-blue-400" />
            <span>Total Scheduled</span>
          </div>
          <div className="text-lg font-bold text-white mt-1">
            {formatHours(totalMinutes)}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            {totalMinutes > 480 ? 'Heavy load' : totalMinutes > 240 ? 'Balanced' : 'Light workload'}
          </div>
        </div>

        {/* Deep Focus Time */}
        <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span>Deep Focus Time</span>
          </div>
          <div className="text-lg font-bold text-amber-300 mt-1">
            {formatHours(focusMinutes)}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            Exams, deep work & study
          </div>
        </div>

        {/* Academic & Class Time */}
        <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
            <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
            <span>Academics & Study</span>
          </div>
          <div className="text-lg font-bold text-emerald-300 mt-1">
            {formatHours(academicMinutes)}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            Lectures & study blocks
          </div>
        </div>

        {/* Business & Meetings */}
        <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
            <Briefcase className="w-3.5 h-3.5 text-indigo-400" />
            <span>Meetings & Client</span>
          </div>
          <div className="text-lg font-bold text-indigo-300 mt-1">
            {formatHours(businessMinutes)}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            Syncs & client reviews
          </div>
        </div>
      </div>

      {/* AI Circadian & Longest Free Block Callouts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
        {/* Circadian Recommendation */}
        <div className="p-3 rounded-xl bg-gradient-to-r from-blue-950/40 to-indigo-950/30 border border-blue-500/20 flex items-start gap-2.5">
          <Zap className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <div className="text-xs">
            <span className="font-semibold text-white block">Optimal Focus Window</span>
            <span className="text-slate-300">
              08:30 – 11:30 AM is peak alertness. Protect this block for hard exams or strategic client work.
            </span>
          </div>
        </div>

        {/* Longest Free Block */}
        <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-start gap-2.5">
          <Clock className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <div className="text-xs">
            <span className="font-semibold text-white block">
              Longest Free Window: {longestFreeMinutes > 0 ? formatHours(longestFreeMinutes) : 'Fully Booked'}
            </span>
            <span className="text-slate-400">
              {longestFreeMinutes > 0
                ? `Available during ${freeBlockWindow} — ideal for continuous deep work or gym.`
                : 'No open windows detected during daytime hours.'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
