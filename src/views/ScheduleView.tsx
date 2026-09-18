import React, { useState } from 'react';
import { 
  Calendar as CalendarIcon, 
  Plus, 
  Clock, 
  MapPin, 
  Sparkles, 
  Trash2, 
  Edit3, 
  ChevronLeft, 
  ChevronRight, 
  Check, 
  X, 
  AlertCircle,
  Repeat
} from 'lucide-react';
import { ScheduleEvent, EventCategory, ProposedSchedule, Task, DocumentAttachment, User, AICopilotAction } from '../types';
import { api, UserFullData } from '../services/api';
import { DocumentUploadZone } from '../components/DocumentUploadZone';
import { SectionAIAssistant } from '../components/SectionAIAssistant';

interface ScheduleViewProps {
  user: User;
  data: UserFullData;
  events: ScheduleEvent[];
  tasks: Task[];
  attachments?: DocumentAttachment[];
  onAddEvent: (event: Omit<ScheduleEvent, 'id' | 'userId'>) => void;
  onUpdateEvent: (event: ScheduleEvent) => void;
  onDeleteEvent: (id: string) => void;
  onApplyProposedSchedule: (proposed: ProposedSchedule) => void;
  onApplyAction: (action: AICopilotAction) => void;
  onAddAttachment?: (attachment: DocumentAttachment) => void;
  onDeleteAttachment?: (id: string) => void;
}

export const ScheduleView: React.FC<ScheduleViewProps> = ({
  user,
  data,
  events,
  tasks,
  attachments = [],
  onAddEvent,
  onUpdateEvent,
  onDeleteEvent,
  onApplyProposedSchedule,
  onApplyAction,
  onAddAttachment,
  onDeleteAttachment,
}) => {
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month' | 'aiOptimizer'>('day');
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [filterCategory, setFilterCategory] = useState<string>('all');

  // Event modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<ScheduleEvent | null>(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<EventCategory>('class');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:30');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [recurring, setRecurring] = useState<'none' | 'daily' | 'weekly' | 'weekdays'>('none');

  // Peak AI Assistant modal state
  const [isAIOpen, setIsAIOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [proposedSchedule, setProposedSchedule] = useState<ProposedSchedule | null>(null);

  const categoryColors: Record<EventCategory, { bg: string; border: string; text: string }> = {
    class: { bg: 'bg-blue-500/15', border: 'border-blue-500/30', text: 'text-blue-400' },
    study: { bg: 'bg-emerald-500/15', border: 'border-emerald-500/30', text: 'text-emerald-400' },
    workout: { bg: 'bg-purple-500/15', border: 'border-purple-500/30', text: 'text-purple-400' },
    personal: { bg: 'bg-amber-500/15', border: 'border-amber-500/30', text: 'text-amber-400' },
    exam: { bg: 'bg-rose-500/15', border: 'border-rose-500/30', text: 'text-rose-400' },
    meeting: { bg: 'bg-indigo-500/15', border: 'border-indigo-500/30', text: 'text-indigo-400' },
    reminder: { bg: 'bg-cyan-500/15', border: 'border-cyan-500/30', text: 'text-cyan-400' },
  };

  const handleOpenAdd = () => {
    setEditingEvent(null);
    setTitle('');
    setCategory('class');
    setStartTime('09:00');
    setEndTime('10:30');
    setLocation('');
    setNotes('');
    setRecurring('none');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (evt: ScheduleEvent) => {
    setEditingEvent(evt);
    setTitle(evt.title);
    setCategory(evt.category);
    setStartTime(evt.startTime);
    setEndTime(evt.endTime);
    setLocation(evt.location || '');
    setNotes(evt.notes || '');
    setRecurring(evt.recurring || 'none');
    setIsModalOpen(true);
  };

  const handleSaveEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (editingEvent) {
      onUpdateEvent({
        ...editingEvent,
        title: title.trim(),
        category,
        startTime,
        endTime,
        location: location.trim() || undefined,
        notes: notes.trim() || undefined,
        recurring,
        date: selectedDate,
      });
    } else {
      onAddEvent({
        title: title.trim(),
        category,
        startTime,
        endTime,
        location: location.trim() || undefined,
        notes: notes.trim() || undefined,
        recurring,
        date: selectedDate,
      });
    }
    setIsModalOpen(false);
  };

  // Day navigation
  const shiftDate = (days: number) => {
    const current = new Date(selectedDate);
    current.setDate(current.getDate() + days);
    setSelectedDate(current.toISOString().split('T')[0]);
  };

  // Filter events for selected date
  const filteredEvents = events.filter((ev) => {
    const matchesDate = ev.date === selectedDate || ev.recurring === 'daily';
    const matchesCategory = filterCategory === 'all' || ev.category === filterCategory;
    return matchesDate && matchesCategory;
  }).sort((a, b) => a.startTime.localeCompare(b.startTime));

  // Handle AI schedule suggestion
  const handleGenerateAISchedule = async () => {
    if (!aiPrompt.trim()) return;
    setAiLoading(true);
    try {
      const res = await api.askScheduleAI(aiPrompt, events, tasks, selectedDate);
      setProposedSchedule(res);
    } catch (err) {
      console.error(err);
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header & AI Assistant Callout */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <CalendarIcon className="w-7 h-7 text-blue-400" />
            <span>Schedule Planner</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Build your high-performance student routine with day-specific structures.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Peak AI Assistant Button */}
          <button
            onClick={() => setViewMode('aiOptimizer')}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-blue-600/30 via-indigo-600/30 to-purple-600/30 border border-blue-500/40 hover:border-blue-400 text-blue-300 text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-lg shadow-blue-500/10 transition-all hover:scale-[1.02]"
          >
            <Sparkles className="w-4 h-4 text-blue-400" />
            <span>Schedule AI Assistant</span>
          </button>

          {/* New Event Button */}
          <button
            onClick={handleOpenAdd}
            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-semibold flex items-center gap-1.5 shadow-md shadow-blue-600/20 transition-all hover:scale-[1.02]"
          >
            <Plus className="w-4 h-4" />
            <span>Add Event</span>
          </button>
        </div>
      </div>

      {/* View Switcher & Date Selector Bar */}
      <div className="p-4 rounded-2xl bg-[#0e1424] border border-slate-800/90 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Date Navigator */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => shiftDate(-1)}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-[#131a2e] border border-slate-700/80 rounded-xl px-3 py-1.5 text-xs sm:text-sm text-white focus:outline-none focus:border-blue-500"
          />

          <button
            onClick={() => shiftDate(1)}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
            className="px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
          >
            Today
          </button>
        </div>

        {/* View Mode Tabs (Day / Week / Month / AI Assistant) */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-900 border border-slate-800 self-start sm:self-auto overflow-x-auto">
          {(['day', 'week', 'month'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition-all whitespace-nowrap ${
                viewMode === mode
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {mode} View
            </button>
          ))}
          <button
            onClick={() => setViewMode('aiOptimizer')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              viewMode === 'aiOptimizer'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm'
                : 'text-blue-300 hover:text-white bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-300 animate-pulse" />
            <span>AI Assistant</span>
            <span className="px-1 py-0.2 rounded text-[9px] font-bold bg-blue-400/20 text-cyan-200">Live</span>
          </button>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {['all', 'class', 'study', 'workout', 'personal', 'exam'].map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium capitalize whitespace-nowrap transition-all ${
                filterCategory === cat
                  ? 'bg-slate-700 text-white'
                  : 'bg-slate-900/60 text-slate-400 hover:text-slate-300'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* AI Assistant Full View */}
      {viewMode === 'aiOptimizer' && (
        <div className="animate-in fade-in duration-200">
          <SectionAIAssistant
            section="schedule"
            user={user}
            data={data}
            onApplyAction={onApplyAction}
          />
        </div>
      )}

      {/* Events Timeline / List */}
      {viewMode !== 'aiOptimizer' && (
      <div className="rounded-2xl bg-[#0e1424] border border-slate-800/90 p-5 min-h-[420px]">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800/70 mb-5">
          <div className="text-sm font-bold text-white flex items-center gap-2">
            <span>Agenda for</span>
            <span className="text-blue-400 underline decoration-blue-500/40">
              {new Date(selectedDate).toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'short',
                day: 'numeric',
              })}
            </span>
          </div>
          <span className="text-xs text-slate-400">
            {filteredEvents.length} {filteredEvents.length === 1 ? 'event' : 'events'} scheduled
          </span>
        </div>

        {filteredEvents.length > 0 ? (
          <div className="space-y-3">
            {filteredEvents.map((evt) => {
              const style = categoryColors[evt.category] || categoryColors.class;
              return (
                <div
                  key={evt.id}
                  className={`p-4 rounded-xl border ${style.border} ${style.bg} transition-all hover:scale-[1.005] flex flex-col sm:flex-row sm:items-center justify-between gap-3 group`}
                >
                  <div className="flex items-start gap-3.5">
                    {/* Time indicator */}
                    <div className="flex flex-col items-center justify-center w-20 py-1.5 px-2 rounded-lg bg-slate-900/80 border border-slate-800 shrink-0 text-center">
                      <span className="text-xs font-bold text-white leading-none">{evt.startTime}</span>
                      <span className="text-[10px] text-slate-500 leading-none mt-1">{evt.endTime}</span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-bold text-white group-hover:text-blue-300 transition-colors`}>
                          {evt.title}
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-md font-semibold uppercase tracking-wider ${style.text} bg-slate-900/60 border ${style.border}`}>
                          {evt.category}
                        </span>
                        {evt.recurring && evt.recurring !== 'none' && (
                          <span className="flex items-center gap-1 text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                            <Repeat className="w-3 h-3" />
                            <span className="capitalize">{evt.recurring}</span>
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                        {evt.location && (
                          <span className="flex items-center gap-1 text-slate-400">
                            <MapPin className="w-3.5 h-3.5 text-slate-500" />
                            <span>{evt.location}</span>
                          </span>
                        )}
                        {evt.notes && (
                          <span className="text-slate-400 italic truncate max-w-sm">
                            "{evt.notes}"
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 self-end sm:self-auto shrink-0 opacity-80 group-hover:opacity-100">
                    <button
                      onClick={() => handleOpenEdit(evt)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
                      title="Edit event"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDeleteEvent(evt.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title="Delete event"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-16 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-800/60 flex items-center justify-center text-slate-500 mx-auto">
              <CalendarIcon className="w-6 h-6" />
            </div>
            <div className="text-sm font-semibold text-slate-300">No events scheduled for this day</div>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Create your classes, study hours, or workouts, or use Peak AI to automatically construct a balanced timetable.
            </p>
            <div className="pt-2 flex items-center justify-center gap-2">
              <button
                onClick={handleOpenAdd}
                className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold"
              >
                Add Event
              </button>
              <button
                onClick={() => {
                  setAiPrompt('Create a balanced study and workout schedule for today with my classes');
                  setIsAIOpen(true);
                }}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-blue-400 text-xs font-semibold flex items-center gap-1"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Auto-plan with AI</span>
              </button>
            </div>
          </div>
        )}
      </div>
      )}

      {/* Add / Edit Event Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-[#0e1424] border border-slate-800 p-6 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h3 className="text-base font-bold text-white">
                {editingEvent ? 'Edit Schedule Event' : 'New Schedule Event'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEvent} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Event Title</label>
                <input
                  type="text"
                  placeholder="e.g. Algorithms Lecture / Gym Push Day"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-[#131b2e] border border-slate-700/80 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as EventCategory)}
                    className="w-full bg-[#131b2e] border border-slate-700/80 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="class">Class / Lecture</option>
                    <option value="study">Study Session</option>
                    <option value="workout">Workout</option>
                    <option value="personal">Personal / Free</option>
                    <option value="exam">Exam</option>
                    <option value="meeting">Meeting</option>
                    <option value="reminder">Reminder</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Recurrence</label>
                  <select
                    value={recurring}
                    onChange={(e) => setRecurring(e.target.value as any)}
                    className="w-full bg-[#131b2e] border border-slate-700/80 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="none">One-time</option>
                    <option value="daily">Every Day</option>
                    <option value="weekdays">Mon - Fri</option>
                    <option value="weekly">Weekly</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Start Time</label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full bg-[#131b2e] border border-slate-700/80 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">End Time</label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full bg-[#131b2e] border border-slate-700/80 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Location (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Room 402, Campus Gym, Library"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full bg-[#131b2e] border border-slate-700/80 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Notes (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="Preparation instructions, links or topic names..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-[#131b2e] border border-slate-700/80 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 shadow-md shadow-blue-600/20"
                >
                  {editingEvent ? 'Update Event' : 'Save Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Peak AI Schedule Assistant Modal (Prompt -> Proposed Schedule with Apply/Edit/Discard) */}
      {isAIOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-2xl bg-[#0e1424] border border-blue-500/30 p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-400" />
                <h3 className="text-base font-bold text-white">Peak AI Schedule Assistant</h3>
              </div>
              <button
                onClick={() => {
                  setIsAIOpen(false);
                  setProposedSchedule(null);
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {!proposedSchedule ? (
              <div className="space-y-4">
                <p className="text-xs text-slate-300 leading-relaxed">
                  Tell Peak AI about your commitments, college timings, workout goals, or study target. The AI will formulate a realistic, non-overwhelming schedule for <strong>{selectedDate}</strong>.
                </p>

                <div className="space-y-2">
                  <label className="block text-xs font-medium text-slate-400">Describe your day or goal:</label>
                  <textarea
                    rows={3}
                    placeholder="e.g. I have college from 9 AM to 3 PM. I want to study mathematics for 2 hours, workout for 1 hour in the evening, and prepare for my physics test."
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    className="w-full bg-[#131b2e] border border-slate-700/80 rounded-xl p-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Suggested prompt chips */}
                <div className="flex flex-wrap gap-2 pt-1">
                  {[
                    'Plan my tomorrow with college and 2h study',
                    'Optimize my evening for exam revision and gym',
                    'Create a realistic weekend deep-work schedule',
                  ].map((sugg) => (
                    <button
                      key={sugg}
                      type="button"
                      onClick={() => setAiPrompt(sugg)}
                      className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-800/80 text-blue-300 hover:bg-slate-700 border border-slate-700/60 transition-colors"
                    >
                      {sugg}
                    </button>
                  ))}
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsAIOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={aiLoading || !aiPrompt.trim()}
                    onClick={handleGenerateAISchedule}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-md flex items-center gap-2 disabled:opacity-50"
                  >
                    {aiLoading ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Propose Schedule</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              /* Proposed Schedule Review (User remains in total control: Apply, Edit, Discard) */
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300 leading-relaxed">
                  <span className="font-bold text-white block mb-0.5">Proposed Schedule</span>
                  {proposedSchedule.summary}
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {proposedSchedule.events.map((ev, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="font-bold text-white">{ev.startTime} - {ev.endTime}</span>
                        <span className="text-slate-300 font-medium">{ev.title}</span>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] uppercase font-semibold bg-slate-800 text-blue-400">
                        {ev.category}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Apply, Edit, Discard Controls */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                  <button
                    onClick={() => setProposedSchedule(null)}
                    className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-800"
                  >
                    Discard
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        // Populate first event into editor to edit
                        if (proposedSchedule.events.length > 0) {
                          const first = proposedSchedule.events[0];
                          setTitle(first.title);
                          setCategory(first.category);
                          setStartTime(first.startTime);
                          setEndTime(first.endTime);
                          setIsAIOpen(false);
                          setIsModalOpen(true);
                        }
                      }}
                      className="px-3.5 py-2 rounded-xl text-xs font-semibold text-blue-300 bg-blue-950/60 border border-blue-800/60 hover:bg-blue-900"
                    >
                      Edit Individually
                    </button>

                    <button
                      onClick={() => {
                        onApplyProposedSchedule(proposedSchedule);
                        setIsAIOpen(false);
                        setProposedSchedule(null);
                      }}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-md flex items-center gap-1.5"
                    >
                      <Check className="w-4 h-4" />
                      <span>Apply to Schedule</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Upload PNG/PDF Timetable Section */}
      <DocumentUploadZone
        section="schedule"
        sectionTitle="Schedule & Timetable"
        attachments={attachments}
        onAddAttachment={onAddAttachment || (() => {})}
        onDeleteAttachment={onDeleteAttachment || (() => {})}
      />
    </div>
  );
};
