import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, 
  ScheduleEvent, 
  Task, 
  WorkoutPlan, 
  WorkoutLog, 
  Subject, 
  AttendanceRecord, 
  ProposedSchedule, 
  NotificationItem, 
  DocumentAttachment,
  AICopilotAction
} from './types';
import { api, UserFullData } from './services/api';
import { AuthPage } from './components/AuthPage';
import { Sidebar, ActiveTab } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { MountainBackground } from './components/MountainBackground';
import { GlobalSearchModal } from './components/GlobalSearchModal';
import { NotificationsModal } from './components/NotificationsModal';
import { AICopilotDrawer } from './components/AICopilotDrawer';
import { FloatingCopilotButton } from './components/FloatingCopilotButton';
import { HomeView } from './views/HomeView';
import { ScheduleView } from './views/ScheduleView';
import { TasksView } from './views/TasksView';
import { WorkoutView } from './views/WorkoutView';
import { AcademicsView } from './views/AcademicsView';
import { SettingsView } from './views/SettingsView';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [loading, setLoading] = useState<boolean>(true);
  const [data, setData] = useState<UserFullData>({
    schedules: [],
    tasks: [],
    workoutPlans: [],
    workoutLogs: [],
    workoutSessions: [],
    subjects: [],
    attendance: [],
    notifications: [],
    attachments: [],
  });

  // Modals & Copilot Drawer
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isCopilotDrawerOpen, setIsCopilotDrawerOpen] = useState(false);
  const [copilotNotification, setCopilotNotification] = useState<string | null>(null);

  // Load current user and their data on mount
  useEffect(() => {
    const initApp = async () => {
      try {
        const storedUser = await api.getCurrentUser();
        if (storedUser) {
          setUser(storedUser);
          const userData = await api.getUserData();
          setData(userData);
        }
      } catch (err) {
        console.error('Failed to load user data:', err);
      } finally {
        setLoading(false);
      }
    };
    initApp();
  }, []);

  // Global keyboard shortcut: Ctrl+K / Cmd+K to open Search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Sync state changes with backend
  const persistChanges = useCallback(
    async (updatedPartial: Partial<UserFullData>) => {
      setData((prev) => {
        const next = { ...prev, ...updatedPartial };
        // fire and forget background sync
        api.saveUserData(next).catch((err: any) => console.error('Auto-save error:', err));
        return next;
      });
    },
    []
  );

  // Auth Handlers
  const handleAuthSuccess = async (authenticatedUser: User) => {
    setUser(authenticatedUser);
    setLoading(true);
    try {
      const userData = await api.getUserData();
      setData(userData);
      setActiveTab('home');
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    api.logout();
    setUser(null);
    setData({
      schedules: [],
      tasks: [],
      workoutPlans: [],
      workoutLogs: [],
      workoutSessions: [],
      subjects: [],
      attendance: [],
      notifications: [],
    });
    setActiveTab('home');
  };

  // Schedule Event Handlers
  const handleAddEvent = (eventInput: Omit<ScheduleEvent, 'id' | 'userId'>) => {
    const newEvent: ScheduleEvent = {
      ...eventInput,
      id: `ev-${Date.now()}`,
      userId: user?.id || '',
    };
    persistChanges({ schedules: [...data.schedules, newEvent] });
  };

  const handleUpdateEvent = (updated: ScheduleEvent) => {
    const updatedList = data.schedules.map((ev) => (ev.id === updated.id ? updated : ev));
    persistChanges({ schedules: updatedList });
  };

  const handleDeleteEvent = (id: string) => {
    const updatedList = data.schedules.filter((ev) => ev.id !== id);
    persistChanges({ schedules: updatedList });
  };

  const handleApplyProposedSchedule = (proposed: ProposedSchedule) => {
    const newEvents: ScheduleEvent[] = proposed.events.map((ev, i) => ({
      id: `ev-ai-${Date.now()}-${i}`,
      userId: user?.id || '',
      title: ev.title,
      startTime: ev.startTime,
      endTime: ev.endTime,
      category: ev.category,
      date: new Date().toISOString().split('T')[0],
      notes: ev.notes,
    }));
    persistChanges({ schedules: [...data.schedules, ...newEvents] });
  };

  // Task Handlers
  const handleAddTask = (taskInput: Omit<Task, 'id' | 'userId' | 'createdAt'>) => {
    const newTask: Task = {
      ...taskInput,
      id: `task-${Date.now()}`,
      userId: user?.id || '',
      createdAt: new Date().toISOString(),
    };
    persistChanges({ tasks: [newTask, ...data.tasks] });
  };

  const handleUpdateTask = (updated: Task) => {
    const updatedList = data.tasks.map((t) => (t.id === updated.id ? updated : t));
    persistChanges({ tasks: updatedList });
  };

  const handleDeleteTask = (id: string) => {
    const updatedList = data.tasks.filter((t) => t.id !== id);
    persistChanges({ tasks: updatedList });
  };

  const handleToggleTaskComplete = (id: string) => {
    const updatedList = data.tasks.map((t) =>
      t.id === id ? { ...t, completed: !t.completed } : t
    );
    persistChanges({ tasks: updatedList });
  };

  // Workout Handlers
  const handleSaveWorkoutPlan = (plan: WorkoutPlan) => {
    const existingIdx = data.workoutPlans.findIndex((p) => p.id === plan.id);
    let updatedPlans = [...data.workoutPlans];
    if (existingIdx >= 0) {
      updatedPlans[existingIdx] = plan;
    } else {
      updatedPlans.push(plan);
    }
    persistChanges({ workoutPlans: updatedPlans });
  };

  const handleLogWorkout = (logInput: Omit<WorkoutLog, 'id' | 'userId'>) => {
    const newLog: WorkoutLog = {
      ...logInput,
      id: `wlog-${Date.now()}`,
      userId: user?.id || '',
    };
    persistChanges({ workoutLogs: [newLog, ...(data.workoutLogs || [])] });
  };

  // Academic Handlers
  const handleUpdateSubject = (updated: Subject) => {
    const updatedList = data.subjects.map((s) => (s.id === updated.id ? updated : s));
    persistChanges({ subjects: updatedList });
  };

  const handleAddSubject = (subjectInput: Omit<Subject, 'id' | 'userId'>) => {
    const newSub: Subject = {
      ...subjectInput,
      id: `sub-${Date.now()}`,
      userId: user?.id || '',
    };
    persistChanges({ subjects: [...data.subjects, newSub] });
  };

  const handleUpdateAttendance = (updatedAttendance: AttendanceRecord[]) => {
    persistChanges({ attendance: updatedAttendance });
  };

  // Notifications Handlers
  const handleMarkAllNotificationsRead = () => {
    const updated = data.notifications.map((n) => ({ ...n, read: true }));
    persistChanges({ notifications: updated });
  };

  const handleDismissNotification = (id: string) => {
    const updated = data.notifications.filter((n) => n.id !== id);
    persistChanges({ notifications: updated });
  };

  // Profile Update
  const handleUpdateUser = (updatedUser: User) => {
    setUser(updatedUser);
    api.updateProfile(updatedUser);
  };

  // Sync selected theme to document root data-theme
  useEffect(() => {
    const theme = user?.settings?.theme || 'midnight';
    document.documentElement.setAttribute('data-theme', theme);
  }, [user?.settings?.theme]);

  // Document Attachment handlers
  const handleAddAttachment = (attachment: DocumentAttachment) => {
    const list = data.attachments || [];
    persistChanges({ attachments: [...list, attachment] });
  };

  const handleDeleteAttachment = (id: string) => {
    const list = (data.attachments || []).filter((a) => a.id !== id);
    persistChanges({ attachments: list });
  };

  // AI Copilot Action Execution Engine
  const handleApplyCopilotAction = (action: AICopilotAction) => {
    try {
      const p = (action.payload || action.data || {}) as any;
      switch (action.type) {
        case 'ADD_SCHEDULE_EVENT': {
          const newEvent: ScheduleEvent = {
            id: `ev-copilot-${Date.now()}`,
            userId: user?.id || '',
            title: p.title || 'Scheduled Event',
            date: p.date || new Date().toISOString().split('T')[0],
            startTime: p.startTime || '09:00',
            endTime: p.endTime || '10:00',
            category: p.category || 'study',
            location: p.location,
            notes: p.notes || 'Added via AI Copilot',
          };
          persistChanges({ schedules: [...data.schedules, newEvent] });
          setCopilotNotification(`Scheduled "${newEvent.title}" on ${newEvent.date}!`);
          break;
        }
        case 'RESCHEDULE_EVENT': {
          const updatedList = data.schedules.map((ev) => {
            if (
              (p.id && ev.id === p.id) ||
              (p.title && ev.title.toLowerCase().includes(p.title.toLowerCase()))
            ) {
              return {
                ...ev,
                date: p.newDate || p.date || ev.date,
                startTime: p.newStartTime || p.startTime || ev.startTime,
                endTime: p.newEndTime || p.endTime || ev.endTime,
              };
            }
            return ev;
          });
          persistChanges({ schedules: updatedList });
          setCopilotNotification(`Updated event timing successfully!`);
          break;
        }
        case 'DELETE_SCHEDULE_EVENT': {
          const updatedList = data.schedules.filter(
            (ev) =>
              ev.id !== p.id &&
              (!p.title || !ev.title.toLowerCase().includes(p.title.toLowerCase()))
          );
          persistChanges({ schedules: updatedList });
          setCopilotNotification(`Removed schedule event.`);
          break;
        }
        case 'UPDATE_WORKOUT_PLAN': {
          const updatedPlan: WorkoutPlan = {
            id: p.id || (data.workoutPlans[0]?.id ? data.workoutPlans[0].id : `plan-${Date.now()}`),
            userId: user?.id || '',
            name: p.name || 'AI Athletic Program',
            description: p.description || 'Optimized split routine',
            days: p.days || [],
          };
          handleSaveWorkoutPlan(updatedPlan);
          setCopilotNotification(`Saved workout program: "${updatedPlan.name}"!`);
          break;
        }
        case 'ADD_WORKOUT_DAY': {
          const currentPlan = data.workoutPlans[0] || {
            id: `plan-${Date.now()}`,
            userId: user?.id || '',
            name: 'Personalized Workout Routine',
            description: 'AI Generated Split',
            days: [],
          };
          const updatedPlan: WorkoutPlan = {
            ...currentPlan,
            days: [...(currentPlan.days || []), p],
          };
          handleSaveWorkoutPlan(updatedPlan);
          setCopilotNotification(`Added "${p.dayName || 'Workout Day'}" to routine!`);
          break;
        }
        case 'LOG_WORKOUT': {
          handleLogWorkout({
            date: p.date || new Date().toISOString().split('T')[0],
            dayName: p.dayName || 'Workout Session',
            durationMinutes: Number(p.durationMinutes) || 45,
            totalVolumeKg: Number(p.totalVolumeKg) || 0,
            completedSets: Number(p.completedSets) || 12,
            notes: p.notes || 'Logged via AI Workout Assistant',
          });
          setCopilotNotification(`Logged workout: "${p.dayName || 'Workout Session'}"!`);
          break;
        }
        case 'ADD_TASK': {
          handleAddTask({
            title: p.title || 'New Task',
            description: p.description,
            dueDate: p.dueDate || new Date().toISOString().split('T')[0],
            dueTime: p.dueTime,
            priority: p.priority || 'medium',
            category: p.category || 'academic',
            subtasks: p.subtasks || [],
            completed: false,
          });
          setCopilotNotification(`Added task: "${p.title}"!`);
          break;
        }
        case 'UPDATE_TASK': {
          const target = data.tasks.find(
            (t) =>
              (p.id && t.id === p.id) ||
              (p.title && t.title.toLowerCase().includes(p.title.toLowerCase()))
          );
          if (target) {
            handleUpdateTask({ ...target, ...p });
            setCopilotNotification(`Updated task "${target.title}"!`);
          }
          break;
        }
        case 'COMPLETE_TASK': {
          const target = data.tasks.find(
            (t) =>
              (p.id && t.id === p.id) ||
              (p.title && t.title.toLowerCase().includes(p.title.toLowerCase()))
          );
          if (target) {
            handleToggleTaskComplete(target.id);
            setCopilotNotification(`Marked "${target.title}" complete!`);
          }
          break;
        }
        case 'ADD_SUBJECT': {
          handleAddSubject({
            name: p.name || 'New Subject',
            code: p.code || 'SUB101',
            professor: p.professor || p.instructor,
            color: p.color || '#3B82F6',
            targetAttendancePercentage: p.targetAttendancePercentage || 75,
            units: p.units || [],
            createdAt: new Date().toISOString(),
          });
          setCopilotNotification(`Added course "${p.name}"!`);
          break;
        }
        case 'UPDATE_STUDY_GOAL': {
          if (user) {
            const updatedUser: User = {
              ...user,
              studyingFor: p.studyingFor || user.studyingFor,
              studentRole: p.studentRole || user.studentRole,
              targetExamDate: p.targetExamDate || user.targetExamDate,
              targetGpa: p.targetGpa || user.targetGpa,
              dreamAspiration: p.dreamAspiration || user.dreamAspiration,
            };
            handleUpdateUser(updatedUser);
            setCopilotNotification(`Updated student focus and exam goals!`);
          }
          break;
        }
        default:
          setCopilotNotification(`Applied AI action!`);
      }
      setTimeout(() => setCopilotNotification(null), 4000);
    } catch (err) {
      console.error('Error executing copilot action:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070b14] flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-3 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
        <p className="text-xs text-slate-400 font-medium tracking-wide">Loading Peak Day...</p>
      </div>
    );
  }

  // If not logged in, render the AuthPage matching the screenshot
  if (!user) {
    return <AuthPage onAuthSuccess={handleAuthSuccess} />;
  }

  const unreadCount = data.notifications.filter((n) => !n.read).length;

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 font-sans flex antialiased selection:bg-blue-500/30 selection:text-white">
      <MountainBackground variant="subtle" />

      {/* Desktop Persistent Left Sidebar (Matching Screenshot) */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onLogout={handleLogout}
        user={user}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 z-10">
        <TopBar
          user={user}
          onOpenSearch={() => setIsSearchOpen(true)}
          onOpenNotifications={() => setIsNotificationsOpen(true)}
          onOpenCopilot={() => setIsCopilotDrawerOpen(true)}
          unreadCount={unreadCount}
          onSelectTab={setActiveTab}
          onLogout={handleLogout}
          activeTab={activeTab}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.18, ease: [0.25, 1, 0.5, 1] }}
              className="w-full"
            >
              {activeTab === 'home' && (
                <HomeView user={user} data={data} onNavigate={setActiveTab} />
              )}

              {activeTab === 'schedule' && (
                <ScheduleView
                  events={data.schedules}
                  tasks={data.tasks}
                  attachments={data.attachments || []}
                  user={user}
                  data={data}
                  onAddEvent={handleAddEvent}
                  onUpdateEvent={handleUpdateEvent}
                  onDeleteEvent={handleDeleteEvent}
                  onApplyProposedSchedule={handleApplyProposedSchedule}
                  onApplyAction={handleApplyCopilotAction}
                  onAddAttachment={handleAddAttachment}
                  onDeleteAttachment={handleDeleteAttachment}
                />
              )}

              {activeTab === 'tasks' && (
                <TasksView
                  user={user}
                  data={data}
                  tasks={data.tasks}
                  attachments={data.attachments || []}
                  onAddTask={handleAddTask}
                  onUpdateTask={handleUpdateTask}
                  onDeleteTask={handleDeleteTask}
                  onToggleComplete={handleToggleTaskComplete}
                  onApplyAction={handleApplyCopilotAction}
                  onAddAttachment={handleAddAttachment}
                  onDeleteAttachment={handleDeleteAttachment}
                />
              )}

              {activeTab === 'workout' && (
                <WorkoutView
                  user={user}
                  data={data}
                  workoutPlans={data.workoutPlans}
                  workoutLogs={data.workoutLogs || []}
                  attachments={data.attachments || []}
                  onSaveWorkoutPlan={handleSaveWorkoutPlan}
                  onLogWorkout={handleLogWorkout}
                  onApplyAction={handleApplyCopilotAction}
                  onAddAttachment={handleAddAttachment}
                  onDeleteAttachment={handleDeleteAttachment}
                />
              )}

              {activeTab === 'academics' && (
                <AcademicsView
                  user={user}
                  data={data}
                  subjects={data.subjects}
                  attendance={data.attendance}
                  attachments={data.attachments || []}
                  onUpdateUser={handleUpdateUser}
                  onUpdateSubject={handleUpdateSubject}
                  onAddSubject={handleAddSubject}
                  onUpdateAttendance={handleUpdateAttendance}
                  onApplyAction={handleApplyCopilotAction}
                  onAddAttachment={handleAddAttachment}
                  onDeleteAttachment={handleDeleteAttachment}
                />
              )}

              {activeTab === 'settings' && (
                <SettingsView
                  user={user}
                  data={data}
                  onUpdateUser={handleUpdateUser}
                  onLogout={handleLogout}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Floating Global Copilot Launcher */}
      <FloatingCopilotButton
        onClick={() => setIsCopilotDrawerOpen(true)}
        activeSection={
          activeTab === 'workout' || activeTab === 'schedule' || activeTab === 'tasks' || activeTab === 'academics'
            ? activeTab
            : 'global'
        }
      />

      {/* Global AI Copilot Slide-Over Drawer */}
      <AICopilotDrawer
        isOpen={isCopilotDrawerOpen}
        onClose={() => setIsCopilotDrawerOpen(false)}
        initialSection={
          activeTab === 'workout' || activeTab === 'schedule' || activeTab === 'tasks' || activeTab === 'academics'
            ? activeTab
            : 'global'
        }
        user={user}
        data={data}
        onApplyAction={handleApplyCopilotAction}
      />

      {/* Copilot Action Toast Notification */}
      {copilotNotification && (
        <div className="fixed bottom-6 left-6 z-50 animate-in fade-in slide-in-from-bottom-5 duration-200">
          <div className="px-4 py-3 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white text-xs sm:text-sm font-semibold shadow-2xl flex items-center gap-3 border border-white/20">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>{copilotNotification}</span>
          </div>
        </div>
      )}

      {/* Global Modals */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        data={data}
        onNavigate={setActiveTab}
      />

      <NotificationsModal
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        notifications={data.notifications}
        onMarkAllRead={handleMarkAllNotificationsRead}
        onDismiss={handleDismissNotification}
      />
    </div>
  );
}
