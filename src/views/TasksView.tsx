import React, { useState } from 'react';
import { 
  CheckSquare, 
  Plus, 
  Calendar as CalendarIcon, 
  Clock, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  Circle, 
  AlertCircle, 
  Copy, 
  X, 
  Tag, 
  Check,
  Sparkles,
  LayoutList,
  Target,
  Columns,
  Flame,
  Wand2
} from 'lucide-react';
import { Task, Priority, TaskCategory, DocumentAttachment, User, AICopilotAction, EisenhowerQuadrant, TaskStatus } from '../types';
import { UserFullData, api } from '../services/api';
import { SectionAIAssistant } from '../components/SectionAIAssistant';
import { SectionPlanFlow } from '../components/SectionPlanFlow';
import { TaskEisenhowerMatrix } from '../components/tasks/TaskEisenhowerMatrix';
import { TaskKanbanBoard } from '../components/tasks/TaskKanbanBoard';
import { TaskPomodoroTimer } from '../components/tasks/TaskPomodoroTimer';

interface TasksViewProps {
  user: User;
  data: UserFullData;
  tasks: Task[];
  attachments?: DocumentAttachment[];
  onAddTask: (task: Omit<Task, 'id' | 'userId' | 'createdAt'>) => void;
  onUpdateTask: (task: Task) => void;
  onDeleteTask: (id: string) => void;
  onToggleComplete: (id: string) => void;
  onApplyAction: (action: AICopilotAction) => void;
  onAddAttachment?: (attachment: DocumentAttachment) => void;
  onDeleteAttachment?: (id: string) => void;
}

export const TasksView: React.FC<TasksViewProps> = ({
  user,
  data,
  tasks,
  attachments = [],
  onAddTask,
  onUpdateTask,
  onDeleteTask,
  onToggleComplete,
  onApplyAction,
  onAddAttachment,
  onDeleteAttachment,
}) => {
  const [tasksViewMode, setTasksViewMode] = useState<'list' | 'eisenhower' | 'kanban' | 'aiAssistant'>('list');
  const [filterView, setFilterView] = useState<'today' | 'upcoming' | 'completed' | 'overdue' | 'all'>('today');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');

  // Task Focus Pomodoro state
  const [activeFocusTask, setActiveFocusTask] = useState<Task | null>(null);

  // Task modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueTime, setDueTime] = useState('18:00');
  const [priority, setPriority] = useState<Priority>('medium');
  const [category, setCategory] = useState<TaskCategory>('Study');
  const [subtaskInput, setSubtaskInput] = useState('');
  const [subtasks, setSubtasks] = useState<{ id: string; title: string; completed: boolean; estimatedMinutes?: number }[]>([]);
  const [eisenhowerQuadrant, setEisenhowerQuadrant] = useState<EisenhowerQuadrant>('q2_not_urgent_important');
  const [taskStatus, setTaskStatus] = useState<TaskStatus>('todo');
  const [estimatedMinutes, setEstimatedMinutes] = useState<number>(30);
  const [isDecomposingAI, setIsDecomposingAI] = useState(false);
  const [aiCoachingTip, setAiCoachingTip] = useState<string | null>(null);

  const todayStr = new Date().toISOString().split('T')[0];

  // Progress metrics
  const todayTasks = tasks.filter((t) => t.dueDate === todayStr);
  const completedTodayCount = todayTasks.filter((t) => t.completed).length;
  const todayPercentage = todayTasks.length > 0 ? Math.round((completedTodayCount / todayTasks.length) * 100) : 0;

  const priorityColors: Record<Priority, { bg: string; text: string; dot: string }> = {
    low: { bg: 'bg-slate-800 text-slate-300', text: 'text-slate-400', dot: 'bg-slate-400' },
    medium: { bg: 'bg-blue-500/15 text-blue-300', text: 'text-blue-400', dot: 'bg-blue-400' },
    high: { bg: 'bg-amber-500/15 text-amber-300', text: 'text-amber-400', dot: 'bg-amber-400' },
    urgent: { bg: 'bg-rose-500/15 text-rose-300', text: 'text-rose-400', dot: 'bg-rose-400' },
  };

  const handleOpenAdd = () => {
    setEditingTask(null);
    setTitle('');
    setDescription('');
    setDueDate(new Date().toISOString().split('T')[0]);
    setDueTime('18:00');
    setPriority('medium');
    setCategory('Study');
    setSubtasks([]);
    setEisenhowerQuadrant('q2_not_urgent_important');
    setTaskStatus('todo');
    setEstimatedMinutes(30);
    setAiCoachingTip(null);
    setIsModalOpen(true);
  };

  const handleOpenAddWithQuadrant = (quadrant: EisenhowerQuadrant) => {
    handleOpenAdd();
    setEisenhowerQuadrant(quadrant);
    if (quadrant === 'q1_urgent_important') setPriority('urgent');
    else if (quadrant === 'q2_not_urgent_important') setPriority('high');
    else if (quadrant === 'q3_urgent_not_important') setPriority('medium');
    else setPriority('low');
  };

  const handleOpenAddWithStatus = (status: TaskStatus) => {
    handleOpenAdd();
    setTaskStatus(status);
  };

  const handleOpenEdit = (t: Task) => {
    setEditingTask(t);
    setTitle(t.title);
    setDescription(t.description || '');
    setDueDate(t.dueDate);
    setDueTime(t.dueTime || '18:00');
    setPriority(t.priority);
    setCategory(t.category);
    setSubtasks(t.subtasks || []);
    setEisenhowerQuadrant(t.eisenhowerQuadrant || 'q2_not_urgent_important');
    setTaskStatus(t.status || (t.completed ? 'completed' : 'todo'));
    setEstimatedMinutes(t.estimatedMinutes || 30);
    setAiCoachingTip(null);
    setIsModalOpen(true);
  };

  const handleDuplicate = (t: Task) => {
    onAddTask({
      title: `${t.title} (Copy)`,
      description: t.description,
      dueDate: t.dueDate,
      dueTime: t.dueTime,
      priority: t.priority,
      category: t.category,
      subtasks: t.subtasks,
      completed: false,
      eisenhowerQuadrant: t.eisenhowerQuadrant,
      status: 'todo',
      estimatedMinutes: t.estimatedMinutes,
    });
  };

  const handleAddSubtask = () => {
    if (!subtaskInput.trim()) return;
    setSubtasks([...subtasks, { id: `st-${Date.now()}`, title: subtaskInput.trim(), completed: false, estimatedMinutes: 15 }]);
    setSubtaskInput('');
  };

  const handleToggleSubtask = (stId: string) => {
    setSubtasks(
      subtasks.map((st) => (st.id === stId ? { ...st, completed: !st.completed } : st))
    );
  };

  const handleRemoveSubtask = (stId: string) => {
    setSubtasks(subtasks.filter((st) => st.id !== stId));
  };

  // AI Task Decomposition / Micro-Steps Auto-breakdown
  const handleAIDecompose = async () => {
    if (!title.trim()) return;
    setIsDecomposingAI(true);
    try {
      const res = await api.decomposeTask(title, description, category, priority);
      if (res.subtasks && res.subtasks.length > 0) {
        setSubtasks(res.subtasks);
      }
      if (res.estimatedMinutes) {
        setEstimatedMinutes(res.estimatedMinutes);
      }
      if (res.recommendedQuadrant) {
        setEisenhowerQuadrant(res.recommendedQuadrant);
      }
      if (res.coachingTip) {
        setAiCoachingTip(res.coachingTip);
      }
    } catch (err) {
      console.error('Failed to decompose task:', err);
    } finally {
      setIsDecomposingAI(false);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const isDone = taskStatus === 'completed';

    if (editingTask) {
      onUpdateTask({
        ...editingTask,
        title: title.trim(),
        description: description.trim() || undefined,
        dueDate,
        dueTime,
        priority,
        category,
        subtasks,
        eisenhowerQuadrant,
        status: taskStatus,
        estimatedMinutes,
        completed: isDone,
        completedAt: isDone ? editingTask.completedAt || new Date().toISOString() : undefined,
      });
    } else {
      onAddTask({
        title: title.trim(),
        description: description.trim() || undefined,
        dueDate,
        dueTime,
        priority,
        category,
        subtasks,
        completed: isDone,
        eisenhowerQuadrant,
        status: taskStatus,
        estimatedMinutes,
      });
    }
    setIsModalOpen(false);
  };

  // Filter tasks for List view
  const filteredTasks = tasks.filter((t) => {
    // View filter
    if (filterView === 'today' && t.dueDate !== todayStr) return false;
    if (filterView === 'upcoming' && (t.dueDate <= todayStr || t.completed)) return false;
    if (filterView === 'completed' && !t.completed) return false;
    if (filterView === 'overdue' && (t.dueDate >= todayStr || t.completed)) return false;

    // Category filter
    if (filterCategory !== 'all' && t.category !== filterCategory) return false;

    // Priority filter
    if (filterPriority !== 'all' && t.priority !== filterPriority) return false;

    return true;
  }).sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    return (a.dueTime || '23:59').localeCompare(b.dueTime || '23:59');
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header & New Task Trigger */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <CheckSquare className="w-7 h-7 text-emerald-400" />
            <span>Tasks & Workflow</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Prioritize with the Eisenhower matrix, manage agile stages, and enter deep Pomodoro focus.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Plan Tasks with 3 Options: 1.Manual, 2.AI, 3.Upload File (Auto-Scan) */}
          <SectionPlanFlow
            section="tasks"
            user={user}
            data={data}
            onApplyAction={onApplyAction}
            onAddAttachment={onAddAttachment}
            onOpenFullAI={() => setTasksViewMode('aiAssistant')}
            onManualCreate={handleOpenAdd}
          />

          <button
            onClick={handleOpenAdd}
            className="px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-semibold flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all hover:scale-[1.02] self-start sm:self-auto cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Task</span>
          </button>
        </div>
      </div>

      {/* Progress Card */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#0c221a] to-[#0a1714] border border-emerald-500/25 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg">
        <div className="space-y-1">
          <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
            Today's Velocity
          </span>
          <div className="text-2xl font-black text-white">
            {completedTodayCount} of {todayTasks.length} Completed
          </div>
          <p className="text-xs text-slate-400">
            {todayTasks.length === 0
              ? 'No tasks due today. Plan ahead or check upcoming deadlines.'
              : todayPercentage === 100
              ? '🎉 Outstanding! All targets for today are finished.'
              : `${todayTasks.length - completedTodayCount} active tasks remaining for today.`}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="w-full sm:w-56 space-y-2">
          <div className="flex justify-between text-xs font-semibold text-slate-300">
            <span>Progress</span>
            <span className="text-emerald-400">{todayPercentage}%</span>
          </div>
          <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden border border-slate-700/50">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
              style={{ width: `${todayPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Primary Layout Mode Switcher */}
      <div className="flex items-center justify-between flex-wrap gap-3 pb-2 border-b border-slate-800">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <button
            onClick={() => setTasksViewMode('list')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer ${
              tasksViewMode === 'list'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <LayoutList className="w-4 h-4" />
            <span>Smart List</span>
          </button>

          <button
            onClick={() => setTasksViewMode('eisenhower')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer ${
              tasksViewMode === 'eisenhower'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Target className="w-4 h-4" />
            <span>Eisenhower Matrix</span>
            <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
              Q1-Q4
            </span>
          </button>

          <button
            onClick={() => setTasksViewMode('kanban')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer ${
              tasksViewMode === 'kanban'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Columns className="w-4 h-4" />
            <span>Kanban Board</span>
          </button>

          <button
            onClick={() => setTasksViewMode('aiAssistant')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer ${
              tasksViewMode === 'aiAssistant'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-600/20'
                : 'text-emerald-300 hover:text-white bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20'
            }`}
          >
            <Sparkles className="w-4 h-4 text-teal-300" />
            <span>AI Copilot</span>
          </button>
        </div>
      </div>

      {/* Mode 1: Eisenhower Matrix */}
      {tasksViewMode === 'eisenhower' && (
        <div className="animate-in fade-in duration-200">
          <TaskEisenhowerMatrix
            tasks={tasks}
            onToggleComplete={onToggleComplete}
            onUpdateTask={onUpdateTask}
            onOpenAddWithQuadrant={handleOpenAddWithQuadrant}
            onOpenEdit={handleOpenEdit}
          />
        </div>
      )}

      {/* Mode 2: Kanban Board */}
      {tasksViewMode === 'kanban' && (
        <div className="animate-in fade-in duration-200">
          <TaskKanbanBoard
            tasks={tasks}
            onToggleComplete={onToggleComplete}
            onUpdateTask={onUpdateTask}
            onOpenAddWithStatus={handleOpenAddWithStatus}
            onOpenEdit={handleOpenEdit}
          />
        </div>
      )}

      {/* Mode 3: AI Assistant */}
      {tasksViewMode === 'aiAssistant' && (
        <div className="animate-in fade-in duration-200">
          <SectionAIAssistant
            section="tasks"
            user={user}
            data={data}
            onApplyAction={onApplyAction}
          />
        </div>
      )}

      {/* Mode 4: Smart Filtered List View */}
      {tasksViewMode === 'list' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Filter Tabs & Category Bar */}
          <div className="p-4 rounded-2xl bg-[#0e1424] border border-slate-800/90 space-y-3">
            {/* View Mode Tabs */}
            <div className="flex flex-wrap items-center gap-1">
              {[
                { id: 'today', label: 'Today' },
                { id: 'upcoming', label: 'Upcoming' },
                { id: 'overdue', label: 'Overdue' },
                { id: 'completed', label: 'Completed' },
                { id: 'all', label: 'All Tasks' },
              ].map((v) => (
                <button
                  key={v.id}
                  onClick={() => setFilterView(v.id as any)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    filterView === v.id
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  {v.label}
                </button>
              ))}
            </div>

            {/* Categories & Priority Selectors */}
            <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-800/70">
              <div className="flex items-center gap-1 text-xs text-slate-400">
                <Tag className="w-3.5 h-3.5 text-slate-500" />
                <span>Category:</span>
              </div>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                {['all', 'Study', 'College', 'Career', 'Workout', 'Projects', 'Personal'].map((c) => (
                  <button
                    key={c}
                    onClick={() => setFilterCategory(c)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all cursor-pointer ${
                      filterCategory === c
                        ? 'bg-slate-700 text-white'
                        : 'bg-slate-900/60 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Task List */}
          <div className="rounded-2xl bg-[#0e1424] border border-slate-800/90 p-4 sm:p-5 min-h-[380px]">
            {filteredTasks.length > 0 ? (
              <div className="space-y-2.5">
                {filteredTasks.map((task) => {
                  const pStyle = priorityColors[task.priority];
                  const totalSubtasks = task.subtasks?.length || 0;
                  const completedSubtasks = task.subtasks?.filter((st) => st.completed).length || 0;

                  return (
                    <div
                      key={task.id}
                      className={`p-3.5 sm:p-4 rounded-xl border transition-all ${
                        task.completed
                          ? 'bg-slate-900/40 border-slate-800/60 opacity-60'
                          : 'bg-[#12182b]/80 border-slate-800 hover:border-slate-700 hover:shadow-md'
                      } flex flex-col sm:flex-row sm:items-center justify-between gap-3 group`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Checkbox Trigger */}
                        <button
                          onClick={() => onToggleComplete(task.id)}
                          className="mt-0.5 text-slate-500 hover:text-emerald-400 transition-colors shrink-0 cursor-pointer"
                        >
                          {task.completed ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-400 animate-in zoom-in-75 duration-150" />
                          ) : (
                            <Circle className="w-5 h-5 text-slate-500 hover:text-emerald-400" />
                          )}
                        </button>

                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              onClick={() => handleOpenEdit(task)}
                              className={`text-sm font-semibold transition-all cursor-pointer hover:text-blue-300 ${
                                task.completed ? 'line-through text-slate-400' : 'text-white'
                              }`}
                            >
                              {task.title}
                            </span>

                            {/* Priority Badge */}
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${pStyle.bg}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${pStyle.dot}`} />
                              <span>{task.priority}</span>
                            </span>

                            {/* Category Badge */}
                            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700/60 font-medium">
                              {task.category}
                            </span>

                            {/* Estimated Duration */}
                            {task.estimatedMinutes && (
                              <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/10 text-cyan-300 border border-blue-500/20 font-medium flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                <span>{task.estimatedMinutes}m</span>
                              </span>
                            )}
                          </div>

                          {task.description && (
                            <p className="text-xs text-slate-400 leading-relaxed max-w-xl">
                              {task.description}
                            </p>
                          )}

                          {/* Subtasks summary if any */}
                          {totalSubtasks > 0 && (
                            <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-400">
                              <CheckSquare className="w-3 h-3 text-slate-500" />
                              <span>
                                {completedSubtasks}/{totalSubtasks} subtasks
                              </span>
                              <div className="w-20 h-1.5 rounded-full bg-slate-800 overflow-hidden ml-1">
                                <div
                                  className="h-full bg-emerald-400 rounded-full"
                                  style={{ width: `${Math.round((completedSubtasks / totalSubtasks) * 100)}%` }}
                                />
                              </div>
                            </div>
                          )}

                          {/* Due date info */}
                          <div className="flex items-center gap-3 text-[11px] text-slate-500 pt-0.5">
                            <span className="flex items-center gap-1">
                              <CalendarIcon className="w-3 h-3" />
                              <span>{task.dueDate}</span>
                            </span>
                            {task.dueTime && (
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                <span>{task.dueTime}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0 opacity-80 group-hover:opacity-100">
                        {/* Pomodoro Focus Button */}
                        {!task.completed && (
                          <button
                            onClick={() => setActiveFocusTask(task)}
                            className="px-2.5 py-1.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-cyan-300 border border-blue-500/30 text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
                            title="Enter Deep Work Pomodoro Focus"
                          >
                            <Flame className="w-3.5 h-3.5 text-amber-400" />
                            <span>Focus</span>
                          </button>
                        )}

                        <button
                          onClick={() => handleDuplicate(task)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
                          title="Duplicate task"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(task)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
                          title="Edit task"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteTask(task.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 cursor-pointer"
                          title="Delete task"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-16 text-center space-y-3">
                <CheckSquare className="w-12 h-12 text-slate-700 mx-auto" />
                <p className="text-slate-400 text-sm font-medium">No tasks found matching this criteria.</p>
                <button
                  onClick={handleOpenAdd}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-white font-semibold transition-colors cursor-pointer"
                >
                  Create New Task
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Pomodoro Focus Timer Modal */}
      {activeFocusTask && (
        <TaskPomodoroTimer
          task={activeFocusTask}
          onClose={() => setActiveFocusTask(null)}
          onUpdateTask={(updated) => {
            onUpdateTask(updated);
            setActiveFocusTask(updated);
          }}
        />
      )}

      {/* Add / Edit Task Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-lg rounded-3xl bg-[#0b1222] border border-slate-800 p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-emerald-400" />
                <span>{editingTask ? 'Edit Task' : 'New Task'}</span>
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Task Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Complete Organic Chemistry Problem Set #4"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-[#131b2e] border border-slate-700/80 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Description / Objectives</label>
                <textarea
                  rows={2}
                  placeholder="Optional context, syllabus references, or links..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-[#131b2e] border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Due Date</label>
                  <input
                    type="date"
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full bg-[#131b2e] border border-slate-700/80 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Target Time</label>
                  <input
                    type="time"
                    value={dueTime}
                    onChange={(e) => setDueTime(e.target.value)}
                    className="w-full bg-[#131b2e] border border-slate-700/80 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as Priority)}
                    className="w-full bg-[#131b2e] border border-slate-700/80 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="low">Low Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="high">High Priority</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as TaskCategory)}
                    className="w-full bg-[#131b2e] border border-slate-700/80 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Study">Study</option>
                    <option value="College">College</option>
                    <option value="Career">Career</option>
                    <option value="Workout">Workout</option>
                    <option value="Projects">Projects</option>
                    <option value="Personal">Personal</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              {/* Eisenhower Quadrant & Est. Duration */}
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Eisenhower Quadrant</label>
                  <select
                    value={eisenhowerQuadrant}
                    onChange={(e) => setEisenhowerQuadrant(e.target.value as EisenhowerQuadrant)}
                    className="w-full bg-[#131b2e] border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="q1_urgent_important">Q1: Do First (Urgent & Important)</option>
                    <option value="q2_not_urgent_important">Q2: Schedule (Growth / Deep Work)</option>
                    <option value="q3_urgent_not_important">Q3: Delegate / Batch (Urgent, Not Imp)</option>
                    <option value="q4_neither">Q4: Eliminate / Backlog (Neither)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Est. Duration (Minutes)</label>
                  <input
                    type="number"
                    min={5}
                    step={5}
                    value={estimatedMinutes}
                    onChange={(e) => setEstimatedMinutes(Number(e.target.value))}
                    className="w-full bg-[#131b2e] border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Subtasks Section with AI Auto-Breakdown */}
              <div className="pt-2 border-t border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-slate-300">
                    Checklist / Micro-Action Steps
                  </label>
                  <button
                    type="button"
                    onClick={handleAIDecompose}
                    disabled={isDecomposingAI || !title.trim()}
                    className="px-2.5 py-1 rounded-xl bg-gradient-to-r from-blue-600/30 to-cyan-600/30 hover:from-blue-600/40 hover:to-cyan-600/40 text-cyan-300 border border-blue-500/30 text-[11px] font-bold flex items-center gap-1 transition-all disabled:opacity-50 cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3 text-cyan-400" />
                    <span>{isDecomposingAI ? 'Breaking down...' : '✨ AI Auto-Breakdown'}</span>
                  </button>
                </div>

                {aiCoachingTip && (
                  <div className="p-2.5 rounded-xl bg-blue-950/30 border border-blue-500/25 text-[11px] text-blue-200">
                    💡 <strong>AI Tip:</strong> {aiCoachingTip}
                  </div>
                )}

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Add step manually..."
                    value={subtaskInput}
                    onChange={(e) => setSubtaskInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSubtask();
                      }
                    }}
                    className="flex-1 bg-[#131b2e] border border-slate-700/80 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddSubtask}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 text-xs text-emerald-400 hover:bg-slate-700 font-semibold cursor-pointer"
                  >
                    Add
                  </button>
                </div>

                {subtasks.length > 0 && (
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    {subtasks.map((st) => (
                      <div
                        key={st.id}
                        className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800 text-xs"
                      >
                        <div
                          onClick={() => handleToggleSubtask(st.id)}
                          className="flex items-center gap-2 cursor-pointer flex-1"
                        >
                          {st.completed ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          ) : (
                            <Circle className="w-4 h-4 text-slate-500 shrink-0" />
                          )}
                          <span className={st.completed ? 'line-through text-slate-500' : 'text-slate-200'}>
                            {st.title}
                          </span>
                          {st.estimatedMinutes && (
                            <span className="text-[10px] text-slate-500">({st.estimatedMinutes}m)</span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveSubtask(st.id)}
                          className="text-slate-500 hover:text-rose-400 p-1 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-600/20 cursor-pointer"
                >
                  {editingTask ? 'Update Task' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
