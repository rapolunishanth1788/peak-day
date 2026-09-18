import React, { useState } from 'react';
import { AlertTriangle, Sparkles, Check, Clock, ArrowRight, ShieldAlert } from 'lucide-react';
import { ScheduleEvent } from '../../types';
import { api } from '../../services/api';
import { resolveScheduleForDay } from '../../utils/scheduleResolution';

interface ScheduleConflictDetectorProps {
  selectedDate: string;
  events: ScheduleEvent[];
  onUpdateEvent: (event: ScheduleEvent) => void;
}

interface ConflictPair {
  eventA: ScheduleEvent;
  eventB: ScheduleEvent;
}

export const ScheduleConflictDetector: React.FC<ScheduleConflictDetectorProps> = ({
  selectedDate,
  events,
  onUpdateEvent,
}) => {
  const [loading, setLoading] = useState(false);
  const [resolutionProposal, setResolutionProposal] = useState<{
    summary: string;
    resolvedEvents: ScheduleEvent[];
  } | null>(null);

  // Resolve all active events for this date (including general daily baseline and day-specific additions)
  const resolved = resolveScheduleForDay(events, selectedDate);
  const dayEvents = resolved.map((item) => item.event);

  // Helper to convert HH:mm to minutes from midnight
  const toMinutes = (timeStr: string) => {
    const [h, m] = (timeStr || '00:00').split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
  };

  // Detect overlapping pairs
  const conflicts: ConflictPair[] = [];
  const conflictingEventIds = new Set<string>();

  for (let i = 0; i < dayEvents.length; i++) {
    for (let j = i + 1; j < dayEvents.length; j++) {
      const a = dayEvents[i];
      const b = dayEvents[j];
      const startA = toMinutes(a.startTime);
      const endA = toMinutes(a.endTime);
      const startB = toMinutes(b.startTime);
      const endB = toMinutes(b.endTime);

      if (startA < endB && endA > startB) {
        conflicts.push({ eventA: a, eventB: b });
        conflictingEventIds.add(a.id);
        conflictingEventIds.add(b.id);
      }
    }
  }

  if (conflicts.length === 0 && !resolutionProposal) {
    return null;
  }

  const handleAutoResolve = async () => {
    setLoading(true);
    try {
      const uniqueConflictingEvents = dayEvents.filter((ev) => conflictingEventIds.has(ev.id));
      const res = await api.resolveScheduleConflicts(
        uniqueConflictingEvents,
        dayEvents,
        selectedDate
      );
      setResolutionProposal(res);
    } catch (err) {
      console.error('Failed to resolve conflicts with AI:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyResolution = () => {
    if (!resolutionProposal) return;
    resolutionProposal.resolvedEvents.forEach((ev) => {
      onUpdateEvent(ev);
    });
    setResolutionProposal(null);
  };

  return (
    <div className="rounded-2xl bg-[#1f1212]/90 border border-amber-500/40 p-4 sm:p-5 shadow-lg space-y-3 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <span>{conflicts.length} Schedule Overlap{conflicts.length > 1 ? 's' : ''} Detected</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-500/20 text-amber-300">
                Conflict Warning
              </span>
            </h4>
            <p className="text-xs text-amber-200/70 mt-0.5">
              Overlapping events cause schedule crunch, missed classes, and meeting double-bookings.
            </p>
          </div>
        </div>

        {!resolutionProposal && (
          <button
            onClick={handleAutoResolve}
            disabled={loading}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-indigo-600 hover:from-amber-500 hover:to-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md transition-all self-start sm:self-auto cursor-pointer"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-amber-200" />
                <span>AI Auto-Resolve Overlaps</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Conflict list preview */}
      {!resolutionProposal && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
          {conflicts.map((pair, idx) => (
            <div
              key={idx}
              className="p-2.5 rounded-xl bg-slate-900/80 border border-amber-500/20 text-xs text-slate-300 flex items-center justify-between gap-2"
            >
              <div className="truncate">
                <span className="font-semibold text-white">{pair.eventA.title}</span>
                <span className="text-slate-400 text-[11px] block">
                  {pair.eventA.startTime} - {pair.eventA.endTime}
                </span>
              </div>
              <span className="text-amber-400 font-bold shrink-0 text-xs">⚡ Overlaps With</span>
              <div className="truncate text-right">
                <span className="font-semibold text-white">{pair.eventB.title}</span>
                <span className="text-slate-400 text-[11px] block">
                  {pair.eventB.startTime} - {pair.eventB.endTime}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Resolution Proposal */}
      {resolutionProposal && (
        <div className="p-3.5 rounded-xl bg-[#0f172a] border border-emerald-500/40 space-y-3 animate-in fade-in duration-150">
          <div className="flex items-center gap-2 text-xs text-emerald-300 font-semibold">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>AI Resolved Schedule with Staggered 15-Minute Transit Buffers</span>
          </div>
          <p className="text-xs text-slate-300">{resolutionProposal.summary}</p>

          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {resolutionProposal.resolvedEvents.map((ev, i) => (
              <div
                key={i}
                className="p-2 rounded-lg bg-slate-900/90 border border-slate-800 flex items-center justify-between text-xs"
              >
                <span className="font-medium text-white">{ev.title}</span>
                <span className="text-emerald-400 font-bold">
                  {ev.startTime} - {ev.endTime}
                </span>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-800">
            <button
              onClick={() => setResolutionProposal(null)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-white bg-slate-800"
            >
              Dismiss
            </button>
            <button
              onClick={handleApplyResolution}
              className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-md flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Apply AI Resolution</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
