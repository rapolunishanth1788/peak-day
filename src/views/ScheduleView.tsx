import React, { useState } from 'react';
import { 
  Calendar as CalendarIcon, 
  Plus, 
  Clock, 
  Sparkles, 
  ChevronLeft, 
  ChevronRight, 
  Check, 
  X, 
  Download, 
  Printer, 
  Columns, 
  List, 
  Grid3X3, 
  Flame, 
  Video, 
  MapPin, 
  Repeat,
  AlertCircle,
  Globe,
  Sliders,
  CalendarDays
} from 'lucide-react';
import { 
  ScheduleEvent, 
  EventCategory, 
  ScheduleScope,
  ProposedSchedule, 
  Task, 
  DocumentAttachment, 
  User, 
  AICopilotAction 
} from '../types';
import { api, UserFullData } from '../services/api';
import { SectionAIAssistant } from '../components/SectionAIAssistant';
import { SectionPlanFlow } from '../components/SectionPlanFlow';
import { QuickEventNaturalBar } from '../components/schedule/QuickEventNaturalBar';
import { ScheduleConflictDetector } from '../components/schedule/ScheduleConflictDetector';
import { ScheduleAnalyticsCard } from '../components/schedule/ScheduleAnalyticsCard';
import { ScheduleDayTimeline } from '../components/schedule/ScheduleDayTimeline';
import { ScheduleWeekGrid } from '../components/schedule/ScheduleWeekGrid';
import { ScheduleMonthGrid } from '../components/schedule/ScheduleMonthGrid';
import { ScheduleAgendaList } from '../components/schedule/ScheduleAgendaList';
import { GeneralRoutineManager } from '../components/schedule/GeneralRoutineManager';
import { exportScheduleToICS } from '../utils/calendarExport';
import { DAYS_OF_WEEK, getDayOfWeekFromDate, resolveScheduleForDay } from '../utils/scheduleResolution';

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
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month' | 'agenda' | 'general' | 'aiOptimizer'>('day');
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [personaFilter, setPersonaFilter] = useState<'all' | 'student' | 'business' | 'wellness'>('all');

  // Event modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<ScheduleEvent | null>(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<EventCategory>('class');
  const [eventDate, setEventDate] = useState(selectedDate);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:30');
  const [location, setLocation] = useState('');
  const [meetingUrl, setMeetingUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [isHighFocus, setIsHighFocus] = useState(false);
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [recurring, setRecurring] = useState<'none' | 'daily' | 'weekly' | 'weekdays'>('none');
  const [attendees, setAttendees] = useState('');

  // Scope & Day customization state
  const [scheduleScope, setScheduleScope] = useState<ScheduleScope>('dayOfWeek');
  const [selectedDaysOfWeek, setSelectedDaysOfWeek] = useState<number[]>([1]); // default Monday
  const [disabledDaysOfWeek, setDisabledDaysOfWeek] = useState<number[]>([]);

  // AI Schedule proposal modal state
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
    deepwork: { bg: 'bg-violet-500/15', border: 'border-violet-500/30', text: 'text-violet-400' },
    client: { bg: 'bg-sky-500/15', border: 'border-sky-500/30', text: 'text-sky-400' },
    standup: { bg: 'bg-teal-500/15', border: 'border-teal-500/30', text: 'text-teal-400' },
    deadline: { bg: 'bg-red-500/15', border: 'border-red-500/30', text: 'text-red-400' },
  };

  const currentDayOfWeek = getDayOfWeekFromDate(selectedDate);
  const currentDayInfo = DAYS_OF_WEEK.find(d => d.id === currentDayOfWeek) || DAYS_OF_WEEK[1];

  const handleOpenAdd = () => {
    setEditingEvent(null);
    setTitle('');
    setCategory('class');
    setEventDate(selectedDate);
    setStartTime('09:00');
    setEndTime('10:30');
    setLocation('');
    setMeetingUrl('');
    setNotes('');
    setIsHighFocus(false);
    setPriority('medium');
    setRecurring('none');
    setAttendees('');
    // If in General Routine view, default to general scope; otherwise specific day
    if (viewMode === 'general') {
      setScheduleScope('general');
      setSelectedDaysOfWeek([0, 1, 2, 3, 4, 5, 6]);
    } else {
      setScheduleScope('dayOfWeek');
      setSelectedDaysOfWeek([currentDayOfWeek]);
    }
    setDisabledDaysOfWeek([]);
    setIsModalOpen(true);
  };

  const handleOpenAddAtTime = (timeStr: string, dateStr?: string) => {
    setEditingEvent(null);
    setTitle('');
    setCategory('class');
    const targetDate = dateStr || selectedDate;
    setEventDate(targetDate);
    setStartTime(timeStr);
    const [h, m] = timeStr.split(':').map(Number);
    const endH = (h + 1) % 24;
    setEndTime(`${String(endH).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    setLocation('');
    setMeetingUrl('');
    setNotes('');
    setIsHighFocus(false);
    setPriority('medium');
    setRecurring('none');
    setAttendees('');
    setScheduleScope('dayOfWeek');
    setSelectedDaysOfWeek([getDayOfWeekFromDate(targetDate)]);
    setDisabledDaysOfWeek([]);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (evt: ScheduleEvent) => {
    setEditingEvent(evt);
    setTitle(evt.title);
    setCategory(evt.category);
    setEventDate(evt.date);
    setStartTime(evt.startTime);
    setEndTime(evt.endTime);
    setLocation(evt.location || '');
    setMeetingUrl(evt.meetingUrl || '');
    setNotes(evt.notes || '');
    setIsHighFocus(!!evt.isHighFocus);
    setPriority(evt.priority || 'medium');
    setRecurring(evt.recurring || 'none');
    setAttendees(evt.attendees || '');

    // Scope & Days
    if (evt.isGeneralRoutine || evt.scheduleScope === 'general' || evt.recurring === 'daily') {
      setScheduleScope('general');
    } else if (evt.scheduleScope === 'dayOfWeek' || evt.daysOfWeek?.length || evt.dayOfWeek !== undefined) {
      setScheduleScope('dayOfWeek');
    } else {
      setScheduleScope('specificDate');
    }
    setSelectedDaysOfWeek(evt.daysOfWeek || (evt.dayOfWeek !== undefined ? [evt.dayOfWeek] : [currentDayOfWeek]));
    setDisabledDaysOfWeek(evt.disabledDaysOfWeek || []);

    setIsModalOpen(true);
  };

  const handleSaveEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const isGeneral = scheduleScope === 'general';
    const computedRecurring = isGeneral ? 'daily' : scheduleScope === 'dayOfWeek' ? 'weekly' : recurring;

    const payload = {
      title: title.trim(),
      category,
      date: eventDate,
      startTime,
      endTime,
      scheduleScope,
      isGeneralRoutine: isGeneral,
      daysOfWeek: scheduleScope === 'dayOfWeek' ? selectedDaysOfWeek : undefined,
      disabledDaysOfWeek: isGeneral && disabledDaysOfWeek.length > 0 ? disabledDaysOfWeek : undefined,
      recurring: computedRecurring,
      location: location.trim() || undefined,
      meetingUrl: meetingUrl.trim() || undefined,
      notes: notes.trim() || undefined,
      isHighFocus,
      priority,
      attendees: attendees.trim() || undefined,
    };

    if (editingEvent) {
      onUpdateEvent({
        ...editingEvent,
        ...payload,
      });
    } else {
      onAddEvent(payload);
    }
    setIsModalOpen(false);
  };

  // Day navigation
  const shiftDate = (days: number) => {
    const current = new Date(selectedDate);
    current.setDate(current.getDate() + days);
    setSelectedDate(current.toISOString().split('T')[0]);
  };

  // Jump to specific day of the week (e.g., this week's Monday, Tuesday, etc.)
  const handleJumpToDayOfWeek = (targetDayId: number) => {
    const current = new Date(selectedDate);
    const currentDay = current.getDay(); // 0-6
    const diff = targetDayId - currentDay;
    const targetDate = new Date(current);
    targetDate.setDate(current.getDate() + diff);
    setSelectedDate(targetDate.toISOString().split('T')[0]);
    setViewMode('day');
  };

  // Filter events based on persona category
  const filteredEvents = events.filter((ev) => {
    if (personaFilter === 'student') {
      return ['class', 'study', 'exam', 'reminder'].includes(ev.category);
    }
    if (personaFilter === 'business') {
      return ['meeting', 'deepwork', 'client', 'standup', 'deadline', 'reminder'].includes(ev.category);
    }
    if (personaFilter === 'wellness') {
      return ['workout', 'personal', 'reminder'].includes(ev.category);
    }
    return true;
  });

  const handleExportICS = () => {
    exportScheduleToICS(events, `${user.name}'s PeakDay Schedule`);
  };

  const handlePrint = () => {
    window.print();
  };

  const toggleDayOfWeekSelection = (dayId: number) => {
    if (selectedDaysOfWeek.includes(dayId)) {
      if (selectedDaysOfWeek.length > 1) {
        setSelectedDaysOfWeek(selectedDaysOfWeek.filter((d) => d !== dayId));
      }
    } else {
      setSelectedDaysOfWeek([...selectedDaysOfWeek, dayId].sort());
    }
  };

  const toggleDisabledDay = (dayId: number) => {
    if (disabledDaysOfWeek.includes(dayId)) {
      setDisabledDaysOfWeek(disabledDaysOfWeek.filter((d) => d !== dayId));
    } else {
      setDisabledDaysOfWeek([...disabledDaysOfWeek, dayId].sort());
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Top Header & Planning Flow Callout */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <CalendarIcon className="w-7 h-7 text-blue-400" />
            <span>Schedule Planner</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            General master routine common to every single day + customizable day-specific overrides (Monday, Tuesday, etc.).
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Export to ICS (Google / Apple Calendar) */}
          <button
            onClick={handleExportICS}
            className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Export to Google Calendar, Apple Calendar, or Outlook (.ics)"
          >
            <Download className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden sm:inline">Export</span>
            <span>.ICS</span>
          </button>

          {/* Print View */}
          <button
            onClick={handlePrint}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors"
            title="Print Schedule / PDF"
          >
            <Printer className="w-4 h-4" />
          </button>

          {/* Section Plan Flow with 3 Dedicated Options: Manual, AI, and Upload File Auto-Scan */}
          <SectionPlanFlow
            section="schedule"
            user={user}
            data={data}
            onApplyAction={onApplyAction}
            onAddAttachment={onAddAttachment}
            onOpenFullAI={() => setViewMode('aiOptimizer')}
            onManualCreate={handleOpenAdd}
          />

          {/* New Event Button */}
          <button
            onClick={handleOpenAdd}
            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-semibold flex items-center gap-1.5 shadow-md shadow-blue-600/20 transition-all hover:scale-[1.02] cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Event</span>
          </button>
        </div>
      </div>

      {/* AI Natural Language Quick Event Bar */}
      <QuickEventNaturalBar
        selectedDate={selectedDate}
        onAddEvent={onAddEvent}
      />

      {/* Real-Time Overlap & Conflict Detector */}
      <ScheduleConflictDetector
        selectedDate={selectedDate}
        events={events}
        onUpdateEvent={onUpdateEvent}
      />

      {/* Navigation, Master Blueprint & Day-of-Week Switcher Bar */}
      <div className="space-y-3">
        {/* Main View Mode Selector & Date Controls */}
        <div className="p-4 rounded-2xl bg-[#0b1222] border border-slate-800/90 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          {/* Date Navigator */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => shiftDate(-1)}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
              title="Previous Day"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-[#0e1629] border border-slate-700/80 rounded-xl px-3 py-1.5 text-xs sm:text-sm text-white focus:outline-none focus:border-blue-500"
            />

            <button
              onClick={() => shiftDate(1)}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
              title="Next Day"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
              className="px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
            >
              Today
            </button>
          </div>

          {/* View Mode Tabs (Day / Week / Month / Agenda / General Master / AI Copilot) */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-900/90 border border-slate-800 overflow-x-auto">
            {[
              { id: 'day', label: 'Day Timeline', icon: Clock },
              { id: 'week', label: 'Week View', icon: Columns },
              { id: 'month', label: 'Month View', icon: Grid3X3 },
              { id: 'agenda', label: 'Agenda Feed', icon: List },
            ].map((tab) => {
              const Icon = tab.icon;
              const active = viewMode === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setViewMode(tab.id as any)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap transition-all ${
                    active
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}

            {/* Master General Routine Tab */}
            <button
              onClick={() => setViewMode('general')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap transition-all ${
                viewMode === 'general'
                  ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-sm'
                  : 'text-cyan-400 hover:text-cyan-200 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30'
              }`}
              title="View and edit the common baseline schedule for every single day"
            >
              <Globe className="w-3.5 h-3.5 text-cyan-300" />
              <span>General Daily Blueprint</span>
              <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-cyan-400/20 text-cyan-200">
                Master
              </span>
            </button>

            {/* AI Assistant Tab */}
            <button
              onClick={() => setViewMode('aiOptimizer')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                viewMode === 'aiOptimizer'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-sm'
                  : 'text-indigo-300 hover:text-white bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-300 animate-pulse" />
              <span>AI Copilot</span>
            </button>
          </div>

          {/* Persona Mode Filter */}
          <div className="flex items-center gap-1 bg-slate-900/90 border border-slate-800 rounded-xl p-1 overflow-x-auto text-[11px]">
            {[
              { id: 'all', label: 'All Modes' },
              { id: 'student', label: '🎓 Student' },
              { id: 'business', label: '💼 Business' },
              { id: 'wellness', label: '⚡ Wellness' },
            ].map((persona) => (
              <button
                key={persona.id}
                onClick={() => setPersonaFilter(persona.id as any)}
                className={`px-2.5 py-1 rounded-lg font-semibold whitespace-nowrap transition-colors ${
                  personaFilter === persona.id
                    ? 'bg-slate-700 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-300'
                }`}
              >
                {persona.label}
              </button>
            ))}
          </div>
        </div>

        {/* Day-of-Week Quick Switcher & Day Customization Strip */}
        <div className="p-3 rounded-2xl bg-[#0e1629] border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            <span className="text-[11px] font-bold text-slate-400 mr-1 whitespace-nowrap flex items-center gap-1">
              <CalendarDays className="w-3.5 h-3.5 text-blue-400" />
              <span>Select Day:</span>
            </span>

            {/* General Blueprint Quick Pill */}
            <button
              onClick={() => setViewMode('general')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 whitespace-nowrap cursor-pointer ${
                viewMode === 'general'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'bg-slate-900 text-cyan-300 hover:bg-slate-800 border border-cyan-500/30'
              }`}
              title="Common master routine for all 7 days"
            >
              <Globe className="w-3 h-3" />
              <span>🌐 General Blueprint</span>
            </button>

            <span className="h-4 w-px bg-slate-700 mx-1" />

            {/* Mon, Tue, Wed, Thu, Fri, Sat, Sun Quick Buttons */}
            {DAYS_OF_WEEK.map((d) => {
              const isSelectedDay = currentDayOfWeek === d.id && viewMode !== 'general';
              return (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => handleJumpToDayOfWeek(d.id)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    isSelectedDay
                      ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-400/40'
                      : 'bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-800'
                  }`}
                  title={`View & modify schedule for ${d.full}`}
                >
                  <span>{d.short}</span>
                </button>
              );
            })}
          </div>

          <div className="text-xs text-slate-400 flex items-center gap-2">
            {viewMode === 'general' ? (
              <span className="text-cyan-300 font-medium flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5" />
                <span>Editing Universal Routine (Common to every single day)</span>
              </span>
            ) : (
              <span>
                Viewing <strong>{currentDayInfo.full}</strong>: Master Everyday Routine + {currentDayInfo.short} specific overrides
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Analytics & Circadian Load Breakdown */}
      {viewMode !== 'aiOptimizer' && viewMode !== 'general' && (
        <ScheduleAnalyticsCard
          selectedDate={selectedDate}
          events={filteredEvents}
        />
      )}

      {/* VIEW MODES RENDERING */}

      {/* 1. General Master Everyday Routine Manager */}
      {viewMode === 'general' && (
        <GeneralRoutineManager
          events={events}
          categoryColors={categoryColors}
          onAddEvent={onAddEvent}
          onUpdateEvent={onUpdateEvent}
          onDeleteEvent={onDeleteEvent}
          onOpenEdit={handleOpenEdit}
        />
      )}

      {/* 2. AI Assistant Full View */}
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

      {/* 3. Day Timeline (24-Hour Visual Grid) */}
      {viewMode === 'day' && (
        <ScheduleDayTimeline
          selectedDate={selectedDate}
          events={filteredEvents}
          categoryColors={categoryColors}
          onOpenAddAtTime={(timeStr) => handleOpenAddAtTime(timeStr, selectedDate)}
          onOpenEdit={handleOpenEdit}
          onDeleteEvent={onDeleteEvent}
          onUpdateEvent={onUpdateEvent}
        />
      )}

      {/* 4. Week View Matrix */}
      {viewMode === 'week' && (
        <ScheduleWeekGrid
          selectedDate={selectedDate}
          events={filteredEvents}
          categoryColors={categoryColors}
          onSelectDate={(d) => setSelectedDate(d)}
          onOpenAddAtTime={handleOpenAddAtTime}
          onOpenEdit={handleOpenEdit}
        />
      )}

      {/* 5. Month View Grid */}
      {viewMode === 'month' && (
        <ScheduleMonthGrid
          selectedDate={selectedDate}
          events={filteredEvents}
          categoryColors={categoryColors}
          onSelectDate={(d) => {
            setSelectedDate(d);
            setViewMode('day');
          }}
          onOpenAddAtDate={(d) => {
            setSelectedDate(d);
            handleOpenAdd();
          }}
          onOpenEdit={handleOpenEdit}
        />
      )}

      {/* 6. Agenda Feed */}
      {viewMode === 'agenda' && (
        <ScheduleAgendaList
          events={filteredEvents}
          selectedDate={selectedDate}
          categoryColors={categoryColors}
          onOpenEdit={handleOpenEdit}
          onDeleteEvent={onDeleteEvent}
          onUpdateEvent={onUpdateEvent}
          onSelectDate={(d) => {
            setSelectedDate(d);
            setViewMode('day');
          }}
        />
      )}

      {/* ADD / EDIT EVENT MODAL (WITH GENERAL VS DAY-SPECIFIC SCOPE SELECTION) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="w-full max-w-xl rounded-2xl bg-[#0b1222] border border-slate-800 p-6 shadow-2xl animate-in zoom-in-95 duration-150 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-blue-400" />
                <span>{editingEvent ? 'Edit Schedule Event' : 'Create Schedule Event'}</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEvent} className="space-y-4">
              {/* Event Title */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Event Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Morning Focus, Algorithms Lecture, Board Review, Gym"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-[#0e1629] border border-slate-700/80 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              {/* SCHEDULE SCOPE: General Everyday vs Specific Day(s) vs One-Off Date */}
              <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2.5">
                <label className="block text-xs font-bold text-white">Applies To / Schedule Scope *</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {/* Option 1: General Routine (All Days) */}
                  <button
                    type="button"
                    onClick={() => setScheduleScope('general')}
                    className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                      scheduleScope === 'general'
                        ? 'bg-blue-600/20 border-blue-500 text-white ring-1 ring-blue-500'
                        : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs">
                      <Globe className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Every Single Day</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">
                      General baseline common across all 7 days
                    </p>
                  </button>

                  {/* Option 2: Specific Day(s) of Week */}
                  <button
                    type="button"
                    onClick={() => setScheduleScope('dayOfWeek')}
                    className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                      scheduleScope === 'dayOfWeek'
                        ? 'bg-emerald-600/20 border-emerald-500 text-white ring-1 ring-emerald-500'
                        : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs">
                      <CalendarIcon className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Specific Day(s)</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">
                      e.g. Every Monday, Tuesday, or Mon/Wed
                    </p>
                  </button>

                  {/* Option 3: Single Specific Date */}
                  <button
                    type="button"
                    onClick={() => setScheduleScope('specificDate')}
                    className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                      scheduleScope === 'specificDate'
                        ? 'bg-indigo-600/20 border-indigo-500 text-white ring-1 ring-indigo-500'
                        : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs">
                      <Clock className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Single Date Only</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">
                      One-off event or deadline on exact date
                    </p>
                  </button>
                </div>

                {/* Day of Week Multi-Selector (When Specific Day is selected) */}
                {scheduleScope === 'dayOfWeek' && (
                  <div className="pt-2 border-t border-slate-800 space-y-1.5">
                    <span className="text-[11px] font-semibold text-slate-300 block">
                      Select active day(s) of the week:
                    </span>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {DAYS_OF_WEEK.map((d) => {
                        const isTicked = selectedDaysOfWeek.includes(d.id);
                        return (
                          <button
                            key={d.id}
                            type="button"
                            onClick={() => toggleDayOfWeekSelection(d.id)}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                              isTicked
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            {d.short}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* General Routine Day Skip selector (When Every Day is selected) */}
                {scheduleScope === 'general' && (
                  <div className="pt-2 border-t border-slate-800 space-y-1.5">
                    <span className="text-[11px] font-semibold text-slate-300 block">
                      Active all 7 days by default. Click any day to skip/rest on that day:
                    </span>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {DAYS_OF_WEEK.map((d) => {
                        const isSkipped = disabledDaysOfWeek.includes(d.id);
                        return (
                          <button
                            key={d.id}
                            type="button"
                            onClick={() => toggleDisabledDay(d.id)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                              !isSkipped
                                ? 'bg-blue-600/30 text-blue-200 border border-blue-500/40'
                                : 'bg-slate-800 text-slate-500 line-through'
                            }`}
                            title={!isSkipped ? `Active on ${d.full}` : `Skipped on ${d.full}`}
                          >
                            {d.short}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Date Picker (When Specific Date is selected) */}
                {scheduleScope === 'specificDate' && (
                  <div className="pt-2 border-t border-slate-800">
                    <label className="block text-[11px] text-slate-400 mb-1">Select Date</label>
                    <input
                      type="date"
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                      className="bg-[#0a101f] border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                      required
                    />
                  </div>
                )}
              </div>

              {/* Category & Priority */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as EventCategory)}
                    className="w-full bg-[#0e1629] border border-slate-700/80 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-blue-500"
                  >
                    <optgroup label="Academic (Student)">
                      <option value="class">Class / Lecture</option>
                      <option value="study">Study Session</option>
                      <option value="exam">Exam / Midterm</option>
                    </optgroup>
                    <optgroup label="Professional (Business)">
                      <option value="meeting">Client / Team Meeting</option>
                      <option value="deepwork">Deep Work Sprint</option>
                      <option value="standup">Daily Standup</option>
                      <option value="client">Client Review / Pitch</option>
                      <option value="deadline">Project Deadline</option>
                    </optgroup>
                    <optgroup label="Wellness & Personal">
                      <option value="workout">Workout / Gym</option>
                      <option value="personal">Personal / Free</option>
                      <option value="reminder">Reminder</option>
                    </optgroup>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full bg-[#0e1629] border border-slate-700/80 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="low">Low Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="high">High Priority</option>
                    <option value="urgent">Urgent / Critical</option>
                  </select>
                </div>
              </div>

              {/* Start Time & End Time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Start Time</label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full bg-[#0e1629] border border-slate-700/80 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">End Time</label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full bg-[#0e1629] border border-slate-700/80 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              {/* Location & Meeting URL */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Location / Room</label>
                  <input
                    type="text"
                    placeholder="e.g. Hall B, Room 402, Gym"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full bg-[#0e1629] border border-slate-700/80 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Video / Call URL</label>
                  <input
                    type="url"
                    placeholder="https://meet.google.com/... or Zoom"
                    value={meetingUrl}
                    onChange={(e) => setMeetingUrl(e.target.value)}
                    className="w-full bg-[#0e1629] border border-slate-700/80 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Deep Work / High Focus Toggle */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="flex items-center gap-2">
                  <Flame className={`w-4 h-4 ${isHighFocus ? 'text-amber-400' : 'text-slate-500'}`} />
                  <div>
                    <span className="text-xs font-bold text-white block">High-Focus Deep Work Block</span>
                    <span className="text-[10px] text-slate-400">Protects this time for deep study or critical client presentations</span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={isHighFocus}
                  onChange={(e) => setIsHighFocus(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 bg-slate-800 border-slate-700"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Notes & Prep Instructions</label>
                <textarea
                  rows={2}
                  placeholder="Agenda points, textbook chapters, or deliverables to prepare..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-[#0e1629] border border-slate-700/80 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Modal Action Buttons */}
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 shadow-md shadow-blue-600/20 transition-all cursor-pointer"
                >
                  {editingEvent ? 'Update Event' : 'Save Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
