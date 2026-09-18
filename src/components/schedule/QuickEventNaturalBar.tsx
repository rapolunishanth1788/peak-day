import React, { useState } from 'react';
import { Sparkles, Plus, ArrowRight, Clock, MapPin, Video, AlertCircle } from 'lucide-react';
import { ScheduleEvent, EventCategory } from '../../types';
import { api } from '../../services/api';

interface QuickEventNaturalBarProps {
  selectedDate: string;
  onAddEvent: (event: Omit<ScheduleEvent, 'id' | 'userId'>) => void;
}

export const QuickEventNaturalBar: React.FC<QuickEventNaturalBarProps> = ({
  selectedDate,
  onAddEvent,
}) => {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [parsedDraft, setParsedDraft] = useState<Partial<ScheduleEvent> | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleParse = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || loading) return;

    setLoading(true);
    setError(null);
    try {
      const parsed = await api.parseQuickEvent(input.trim(), selectedDate);
      if (parsed && parsed.title) {
        setParsedDraft(parsed);
      } else {
        setError('Could not fully understand event details. Try including a time and title.');
      }
    } catch (err: any) {
      console.error(err);
      setError('AI parsing failed. Please try a simpler phrase or use the standard Add Event form.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmAdd = () => {
    if (!parsedDraft || !parsedDraft.title) return;

    onAddEvent({
      title: parsedDraft.title,
      category: (parsedDraft.category as EventCategory) || 'personal',
      date: parsedDraft.date || selectedDate,
      startTime: parsedDraft.startTime || '09:00',
      endTime: parsedDraft.endTime || '10:00',
      scheduleScope: parsedDraft.scheduleScope || 'specificDate',
      isGeneralRoutine: parsedDraft.isGeneralRoutine,
      daysOfWeek: parsedDraft.daysOfWeek,
      location: parsedDraft.location,
      meetingUrl: parsedDraft.meetingUrl,
      notes: parsedDraft.notes,
      isHighFocus: parsedDraft.isHighFocus,
      priority: parsedDraft.priority || 'medium',
      recurring: parsedDraft.recurring || 'none',
    });

    setParsedDraft(null);
    setInput('');
  };

  const suggestions = [
    'Daily morning focus routine 7:30am (Every day)',
    'Algorithms Lecture every Monday and Wednesday at 10am',
    'Executive Sync with Acme Corp Friday 3pm on Zoom',
    'Chest & Triceps Workout at 6:30 PM',
  ];

  return (
    <div className="rounded-2xl bg-gradient-to-r from-[#0d162a] to-[#121a36] border border-blue-500/25 p-4 sm:p-5 shadow-lg relative overflow-hidden">
      {/* Decorative glow */}
      <div className="absolute top-0 right-0 w-64 h-32 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-500/20 text-cyan-300 border border-blue-500/30">
              <Sparkles className="w-4 h-4 animate-pulse" />
            </div>
            <span className="text-xs sm:text-sm font-bold text-white tracking-wide">
              AI Natural Language Schedule Ingestion
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30">
              Student & Executive
            </span>
          </div>

          <span className="text-[11px] text-slate-400">
            Type anything in plain English — AI extracts title, time, room & links
          </span>
        </div>

        {/* Input Bar */}
        <form onSubmit={handleParse} className="flex flex-col sm:flex-row items-stretch gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                if (error) setError(null);
              }}
              placeholder="e.g. 'CS50 Lecture tomorrow 10am Room 302' or 'Client board review Friday 2pm on Zoom'"
              className="w-full bg-[#0a101f] border border-slate-700/80 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 shadow-inner"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 shadow-md shadow-blue-600/20 disabled:opacity-50 transition-all shrink-0 cursor-pointer"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-cyan-200" />
                <span>AI Parse Event</span>
              </>
            )}
          </button>
        </form>

        {/* Quick prompt chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px]">
          <span className="text-slate-400 shrink-0 text-[10px] font-medium">Quick Examples:</span>
          {suggestions.map((sugg, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setInput(sugg)}
              className="px-2.5 py-1 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-[11px] whitespace-nowrap transition-colors"
            >
              {sugg}
            </button>
          ))}
        </div>

        {error && (
          <div className="flex items-center gap-2 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-xl">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Parsed Result Preview Card */}
        {parsedDraft && (
          <div className="p-3.5 rounded-xl bg-[#0e172e] border border-cyan-500/40 animate-in fade-in slide-in-from-top-2 duration-150 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-white">{parsedDraft.title}</span>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-blue-500/20 text-cyan-300 border border-blue-500/30">
                  {parsedDraft.category || 'personal'}
                </span>
                {parsedDraft.isHighFocus && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    High Focus
                  </span>
                )}
                {parsedDraft.priority && (
                  <span className="text-[10px] capitalize px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                    {parsedDraft.priority} priority
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3 text-xs text-slate-400 flex-wrap">
                <span className="flex items-center gap-1 text-slate-300">
                  <Clock className="w-3.5 h-3.5 text-blue-400" />
                  <span>{parsedDraft.date} | {parsedDraft.startTime} - {parsedDraft.endTime}</span>
                </span>

                {parsedDraft.location && (
                  <span className="flex items-center gap-1 text-slate-300">
                    <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{parsedDraft.location}</span>
                  </span>
                )}

                {parsedDraft.meetingUrl && (
                  <span className="flex items-center gap-1 text-cyan-400 truncate max-w-xs">
                    <Video className="w-3.5 h-3.5" />
                    <span>Meeting Link Detected</span>
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
              <button
                type="button"
                onClick={() => setParsedDraft(null)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-white bg-slate-800"
              >
                Dismiss
              </button>
              <button
                type="button"
                onClick={handleConfirmAdd}
                className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-md flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Add to Schedule</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
