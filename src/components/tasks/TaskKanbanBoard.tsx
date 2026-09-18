import React from 'react';
import { 
  Plus, 
  CheckCircle2, 
  Circle, 
  Clock, 
  ChevronRight, 
  ChevronLeft, 
  Flame, 
  AlertCircle,
  Sparkles
} from 'lucide-react';
import { Task, TaskStatus, Priority } from '../../types';

interface TaskKanbanBoardProps {
  tasks: Task[];
  onToggleComplete: (id: string) => void;
  onUpdateTask: (task: Task) => void;
  onOpenAddWithStatus: (status: TaskStatus) => void;
  onOpenEdit: (task: Task) => void;
}

export const TaskKanbanBoard: React.FC<TaskKanbanBoardProps> = ({
  tasks,
  onToggleComplete,
  onUpdateTask,
  onOpenAddWithStatus,
  onOpenEdit,
}) => {
  // Determine status if not explicitly set
  const getStatus = (t: Task): TaskStatus => {
    if (t.completed) return 'completed';
    if (t.status) return t.status;
    return 'todo';
  };

  const columns: {
    id: TaskStatus;
    title: string;
    badgeColor: string;
    borderColor: string;
  }[] = [
    {
      id: 'todo',
      title: 'To Do',
      badgeColor: 'bg-slate-800 text-slate-300 border-slate-700',
      borderColor: 'border-slate-800',
    },
    {
      id: 'in_progress',
      title: 'In Progress',
      badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      borderColor: 'border-blue-500/30',
    },
    {
      id: 'in_review',
      title: 'Review / Blocked',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      borderColor: 'border-amber-500/30',
    },
    {
      id: 'completed',
      title: 'Completed',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      borderColor: 'border-emerald-500/30',
    },
  ];

  const handleMoveStatus = (task: Task, nextStatus: TaskStatus) => {
    const isCompleted = nextStatus === 'completed';
    onUpdateTask({
      ...task,
      status: nextStatus,
      completed: isCompleted,
      completedAt: isCompleted ? new Date().toISOString() : undefined,
    });
  };

  const priorityBadges: Record<Priority, { label: string; class: string }> = {
    low: { label: 'Low', class: 'bg-slate-800 text-slate-400' },
    medium: { label: 'Med', class: 'bg-blue-500/20 text-blue-300' },
    high: { label: 'High', class: 'bg-amber-500/20 text-amber-300' },
    urgent: { label: 'Urgent', class: 'bg-rose-500/20 text-rose-300 font-bold' },
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {columns.map((col) => {
        const colTasks = tasks.filter((t) => getStatus(t) === col.id);

        return (
          <div
            key={col.id}
            className={`rounded-2xl bg-[#0b1222] border ${col.borderColor} p-3.5 flex flex-col justify-between min-h-[420px] shadow-md`}
          >
            <div>
              {/* Column Header */}
              <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-800/80 mb-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs sm:text-sm font-bold text-white">{col.title}</h3>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${col.badgeColor}`}>
                    {colTasks.length}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => onOpenAddWithStatus(col.id)}
                  className="p-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                  title={`Add task to ${col.title}`}
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Cards List */}
              <div className="space-y-2.5 max-h-[480px] overflow-y-auto pr-1">
                {colTasks.length > 0 ? (
                  colTasks.map((task) => {
                    const totalSubtasks = task.subtasks?.length || 0;
                    const completedSubtasks = task.subtasks?.filter((s) => s.completed).length || 0;
                    const subtaskProgress = totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0;
                    const prio = priorityBadges[task.priority] || priorityBadges.medium;

                    return (
                      <div
                        key={task.id}
                        className="p-3 rounded-xl bg-[#0e1629] border border-slate-800/90 hover:border-slate-700 hover:shadow-lg transition-all space-y-2 group"
                      >
                        {/* Title & Checkbox */}
                        <div className="flex items-start justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => onToggleComplete(task.id)}
                            className="mt-0.5 text-slate-500 hover:text-emerald-400 shrink-0 transition-colors"
                          >
                            {task.completed ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            ) : (
                              <Circle className="w-4 h-4" />
                            )}
                          </button>

                          <div className="flex-1 min-w-0">
                            <span
                              onClick={() => onOpenEdit(task)}
                              className={`text-xs font-semibold text-white group-hover:text-blue-300 cursor-pointer block leading-tight ${
                                task.completed ? 'line-through text-slate-400' : ''
                              }`}
                            >
                              {task.title}
                            </span>
                          </div>

                          <span className={`px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wider shrink-0 ${prio.class}`}>
                            {prio.label}
                          </span>
                        </div>

                        {/* Description snippet if any */}
                        {task.description && (
                          <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                            {task.description}
                          </p>
                        )}

                        {/* Subtasks Progress Bar if subtasks exist */}
                        {totalSubtasks > 0 && (
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-[10px] text-slate-400">
                              <span>Subtasks</span>
                              <span className="font-semibold text-emerald-400">
                                {completedSubtasks}/{totalSubtasks} ({subtaskProgress}%)
                              </span>
                            </div>
                            <div className="w-full h-1 rounded-full bg-slate-800 overflow-hidden">
                              <div
                                className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                                style={{ width: `${subtaskProgress}%` }}
                              />
                            </div>
                          </div>
                        )}

                        {/* Meta strip & Step Transitions */}
                        <div className="pt-2 border-t border-slate-800/70 flex items-center justify-between gap-1 text-[10px] text-slate-400">
                          <span className="truncate">Due: {task.dueDate}</span>

                          {/* Quick Stage Transitions */}
                          <div className="flex items-center gap-1 shrink-0">
                            {col.id !== 'todo' && (
                              <button
                                type="button"
                                onClick={() => {
                                  if (col.id === 'in_progress') handleMoveStatus(task, 'todo');
                                  if (col.id === 'in_review') handleMoveStatus(task, 'in_progress');
                                  if (col.id === 'completed') handleMoveStatus(task, 'in_review');
                                }}
                                className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                                title="Move Left"
                              >
                                <ChevronLeft className="w-3 h-3" />
                              </button>
                            )}

                            {col.id !== 'completed' && (
                              <button
                                type="button"
                                onClick={() => {
                                  if (col.id === 'todo') handleMoveStatus(task, 'in_progress');
                                  if (col.id === 'in_progress') handleMoveStatus(task, 'in_review');
                                  if (col.id === 'in_review') handleMoveStatus(task, 'completed');
                                }}
                                className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                                title="Move Right"
                              >
                                <ChevronRight className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="py-10 text-center text-xs text-slate-500 border border-dashed border-slate-800/70 rounded-xl">
                    No tasks in {col.title}
                  </div>
                )}
              </div>
            </div>

            {/* Quick Add footer button */}
            <button
              type="button"
              onClick={() => onOpenAddWithStatus(col.id)}
              className="mt-3 w-full py-1.5 rounded-xl border border-dashed border-slate-800 hover:border-slate-700 hover:bg-slate-800/40 text-slate-400 hover:text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add to {col.title}</span>
            </button>
          </div>
        );
      })}
    </div>
  );
};
