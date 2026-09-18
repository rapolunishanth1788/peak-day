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
  Sparkles
} from 'lucide-react';
import { Task, Priority, TaskCategory, DocumentAttachment, User, AICopilotAction } from '../types';
import { UserFullData } from '../services/api';
import { SectionAIAssistant } from '../components/SectionAIAssistant';
import { SectionPlanFlow } from '../components/SectionPlanFlow';

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
  const [filterView, setFilterView] = useState<'today' | 'upcoming' | 'completed' | 'overdue' | 'all' | 'aiAssistant'>('today');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');

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
  const [subtasks, setSubtasks] = useState<{ id: string; title: string; completed: boolean }[]>([]);

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
    setIsModalOpen(true);
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
    });
  };

  const handleAddSubtask = () => {
    if (!subtaskInput.trim()) return;
    setSubtasks([...subtasks, { id: `st-${Date.now()}`, title: subtaskInput.trim(), completed: false }]);
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

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

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
        completed: false,
      });
    }
    setIsModalOpen(false);
  };

  // Filter tasks
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
            <span>Daily Tasks</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Prioritize, organize subtasks, and check off items without friction.
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
            onOpenFullAI={() => setFilterView('aiAssistant')}
            onManualCreate={handleOpenAdd}
          />

          <button
            onClick={handleOpenAdd}
            className="px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-semibold flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all hover:scale-[1.02] self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>New Task</span>
          </button>
        </div>
      </div>

      {/* Progress Card */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#0c221a] to-[#0a1714] border border-emerald-500/25 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg">
        <div className="space-y-1">
          <div className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
            Today's Momentum
          </div>
          <div className="text-xl sm:text-2xl font-bold text-white flex items-baseline gap-2">
            <span>{completedTodayCount} of {todayTasks.length} Completed</span>
            <span className="text-xs text-slate-400 font-normal">({todayPercentage}%)</span>
          </div>
        </div>

        <div className="w-full sm:w-64">
          <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
              style={{ width: `${todayPercentage}%` }}
            />
          </div>
        </div>
      </div>

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
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                filterView === v.id
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              {v.label}
            </button>
          ))}

          <button
            onClick={() => setFilterView('aiAssistant')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
              filterView === 'aiAssistant'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-sm'
                : 'text-emerald-300 hover:text-white bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-teal-300" />
            <span>AI Assistant</span>
            <span className="px-1 py-0.2 rounded text-[9px] font-bold bg-emerald-400/20 text-emerald-200">Live</span>
          </button>
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
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
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

      {/* AI Assistant View */}
      {filterView === 'aiAssistant' && (
        <div className="animate-in fade-in duration-200">
          <SectionAIAssistant
            section="tasks"
            user={user}
            data={data}
            onApplyAction={onApplyAction}
          />
        </div>
      )}

      {/* Task List */}
      {filterView !== 'aiAssistant' && (
      <div className="rounded-2xl bg-[#0e1424] border border-slate-800/90 p-4 sm:p-5 min-h-[380px]">
        {filteredTasks.length > 0 ? (
          <div className="space-y-2.5">
            {filteredTasks.map((task) => {
              const pStyle = priorityColors[task.priority];
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
                    {/* Checkbox Trigger with micro-animation */}
                    <button
                      onClick={() => onToggleComplete(task.id)}
                      className="mt-0.5 text-slate-500 hover:text-emerald-400 transition-colors shrink-0"
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
                          className={`text-sm font-semibold transition-all ${
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
                      </div>

                      {task.description && (
                        <p className="text-xs text-slate-400 leading-relaxed max-w-xl">
                          {task.description}
                        </p>
                      )}

                      {/* Subtasks summary if any */}
                      {task.subtasks && task.subtasks.length > 0 && (
                        <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-400">
                          <CheckSquare className="w-3 h-3 text-slate-500" />
                          <span>
                            {task.subtasks.filter((st) => st.completed).length}/{task.subtasks.length} subtasks
                          </span>
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
                  <div className="flex items-center gap-1 self-end sm:self-auto shrink-0 opacity-80 group-hover:opacity-100">
                    <button
                      onClick={() => handleDuplicate(task)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                      title="Duplicate task"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleOpenEdit(task)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                      title="Edit task"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteTask(task.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10"
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
            <div className="w-12 h-12 rounded-2xl bg-slate-800/60 flex items-center justify-center text-slate-500 mx-auto">
              <CheckSquare className="w-6 h-6" />
            </div>
            <div className="text-sm font-semibold text-slate-300">No tasks in this view</div>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              You're clear for now! Add a task to stay ahead of upcoming college assignments, project milestones, or personal habits.
            </p>
            <button
              onClick={handleOpenAdd}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm"
            >
              Create Task
            </button>
          </div>
        )}
      </div>
      )}

      {/* Task Creation & Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-[#0e1424] border border-slate-800 p-6 shadow-2xl animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h3 className="text-base font-bold text-white">
                {editingTask ? 'Edit Task' : 'New Task'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Task Title</label>
                <input
                  type="text"
                  placeholder="e.g. Complete Operating Systems Homework"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-[#131b2e] border border-slate-700/80 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Description / Details</label>
                <textarea
                  rows={2}
                  placeholder="Additional context, links, or instructions..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-[#131b2e] border border-slate-700/80 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Due Date</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full bg-[#131b2e] border border-slate-700/80 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Due Time</label>
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

              {/* Subtasks Section */}
              <div className="pt-2 border-t border-slate-800">
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Checklist / Subtasks</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    placeholder="Add step..."
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
                    className="px-3 py-1.5 rounded-xl bg-slate-800 text-xs text-emerald-400 hover:bg-slate-700 font-semibold"
                  >
                    Add
                  </button>
                </div>

                {subtasks.length > 0 && (
                  <div className="space-y-1.5 max-h-36 overflow-y-auto">
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
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveSubtask(st.id)}
                          className="text-slate-500 hover:text-rose-400 p-1"
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
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-600/20"
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
