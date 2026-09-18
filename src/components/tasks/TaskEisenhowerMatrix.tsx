import React from 'react';
import { 
  AlertTriangle, 
  Target, 
  Clock, 
  Coffee, 
  CheckCircle2, 
  Circle, 
  Plus, 
  Sparkles,
  ArrowRight,
  Flame,
  Check
} from 'lucide-react';
import { Task, EisenhowerQuadrant, Priority } from '../../types';

interface TaskEisenhowerMatrixProps {
  tasks: Task[];
  onToggleComplete: (id: string) => void;
  onUpdateTask: (task: Task) => void;
  onOpenAddWithQuadrant: (quadrant: EisenhowerQuadrant) => void;
  onOpenEdit: (task: Task) => void;
}

export const TaskEisenhowerMatrix: React.FC<TaskEisenhowerMatrixProps> = ({
  tasks,
  onToggleComplete,
  onUpdateTask,
  onOpenAddWithQuadrant,
  onOpenEdit,
}) => {
  // Helper to determine quadrant if not explicitly assigned
  const getQuadrant = (t: Task): EisenhowerQuadrant => {
    if (t.eisenhowerQuadrant) return t.eisenhowerQuadrant;
    if (t.priority === 'urgent') return 'q1_urgent_important';
    if (t.priority === 'high') return 'q2_not_urgent_important';
    if (t.priority === 'medium') return 'q3_urgent_not_important';
    return 'q4_neither';
  };

  const quadrants: {
    id: EisenhowerQuadrant;
    title: string;
    subtitle: string;
    actionLabel: string;
    color: {
      bg: string;
      border: string;
      headerBg: string;
      badge: string;
      text: string;
      accent: string;
    };
    icon: React.ElementType;
  }[] = [
    {
      id: 'q1_urgent_important',
      title: 'Do First',
      subtitle: 'Urgent & Important (Crises, Deadlines)',
      actionLabel: 'Execute Immediately',
      color: {
        bg: 'bg-rose-950/20',
        border: 'border-rose-500/30',
        headerBg: 'bg-rose-500/10 text-rose-300',
        badge: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
        text: 'text-rose-400',
        accent: 'text-rose-400',
      },
      icon: Flame,
    },
    {
      id: 'q2_not_urgent_important',
      title: 'Schedule (Deep Growth)',
      subtitle: 'Not Urgent & Important (Deep Work, Learning)',
      actionLabel: 'Protect Dedicated Time',
      color: {
        bg: 'bg-emerald-950/20',
        border: 'border-emerald-500/30',
        headerBg: 'bg-emerald-500/10 text-emerald-300',
        badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
        text: 'text-emerald-400',
        accent: 'text-emerald-400',
      },
      icon: Target,
    },
    {
      id: 'q3_urgent_not_important',
      title: 'Delegate / Quick Batch',
      subtitle: 'Urgent & Not Important (Interrupts, Fast tasks)',
      actionLabel: 'Batch or Automate',
      color: {
        bg: 'bg-amber-950/20',
        border: 'border-amber-500/30',
        headerBg: 'bg-amber-500/10 text-amber-300',
        badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
        text: 'text-amber-400',
        accent: 'text-amber-400',
      },
      icon: Clock,
    },
    {
      id: 'q4_neither',
      title: 'Eliminate / Backlog',
      subtitle: 'Neither Urgent Nor Important',
      actionLabel: 'Deprioritize / Drop',
      color: {
        bg: 'bg-slate-900/40',
        border: 'border-slate-800',
        headerBg: 'bg-slate-800/40 text-slate-400',
        badge: 'bg-slate-800 text-slate-400 border-slate-700',
        text: 'text-slate-400',
        accent: 'text-slate-400',
      },
      icon: Coffee,
    },
  ];

  const handleMoveQuadrant = (t: Task, newQ: EisenhowerQuadrant) => {
    onUpdateTask({
      ...t,
      eisenhowerQuadrant: newQ,
    });
  };

  return (
    <div className="space-y-4">
      {/* Matrix Philosophy Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3.5 rounded-2xl bg-[#0b1222] border border-slate-800 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-blue-400" />
          <span className="font-bold text-white">Eisenhower Decision Matrix</span>
          <span className="text-slate-500 hidden sm:inline">•</span>
          <span>Prioritize by Importance vs Urgency to eliminate overwhelm</span>
        </div>
        <div className="text-[11px] text-slate-400">
          Tip: High performers spend 60%+ of their energy in <strong>Q2 (Schedule)</strong>
        </div>
      </div>

      {/* 2x2 Quadrant Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {quadrants.map((quad) => {
          const Icon = quad.icon;
          const quadTasks = tasks.filter((t) => getQuadrant(t) === quad.id);
          const activeCount = quadTasks.filter((t) => !t.completed).length;

          return (
            <div
              key={quad.id}
              className={`rounded-2xl border ${quad.color.border} ${quad.color.bg} p-4 flex flex-col justify-between min-h-[340px] shadow-lg relative overflow-hidden`}
            >
              <div>
                {/* Header */}
                <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-800/80 mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className={`p-2 rounded-xl ${quad.color.headerBg} border ${quad.color.border}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-white">{quad.title}</h3>
                        <span className={`px-2 py-0.2 rounded-full text-[10px] font-bold border ${quad.color.badge}`}>
                          {activeCount} Active
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400">{quad.subtitle}</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onOpenAddWithQuadrant(quad.id)}
                    className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                    title={`Add task to ${quad.title}`}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {/* Task List */}
                <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
                  {quadTasks.length > 0 ? (
                    quadTasks.map((task) => {
                      const completedSubtasks = task.subtasks?.filter((st) => st.completed).length || 0;
                      const totalSubtasks = task.subtasks?.length || 0;

                      return (
                        <div
                          key={task.id}
                          className={`p-3 rounded-xl border border-slate-800/90 bg-[#0d1527]/90 hover:border-slate-700 transition-all flex items-start justify-between gap-2.5 group ${
                            task.completed ? 'opacity-50' : ''
                          }`}
                        >
                          <div className="flex items-start gap-2.5 min-w-0 flex-1">
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

                            <div className="min-w-0 flex-1">
                              <span
                                onClick={() => onOpenEdit(task)}
                                className={`text-xs font-semibold text-white group-hover:text-blue-300 cursor-pointer transition-colors block truncate ${
                                  task.completed ? 'line-through text-slate-400' : ''
                                }`}
                              >
                                {task.title}
                              </span>

                              <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400 flex-wrap">
                                <span>{task.category}</span>
                                <span>•</span>
                                <span>Due: {task.dueDate}</span>
                                {task.estimatedMinutes && (
                                  <>
                                    <span>•</span>
                                    <span className="text-cyan-400">⏱️ {task.estimatedMinutes}m</span>
                                  </>
                                )}
                                {totalSubtasks > 0 && (
                                  <>
                                    <span>•</span>
                                    <span className="text-emerald-400">
                                      {completedSubtasks}/{totalSubtasks} steps
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Quick quadrant reassign menu */}
                          <div className="shrink-0 flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                            <select
                              value={getQuadrant(task)}
                              onChange={(e) => handleMoveQuadrant(task, e.target.value as EisenhowerQuadrant)}
                              className="text-[10px] bg-slate-900 border border-slate-800 rounded px-1.5 py-0.5 text-slate-400 hover:text-white cursor-pointer"
                              title="Move to another quadrant"
                            >
                              <option value="q1_urgent_important">Q1: Do First</option>
                              <option value="q2_not_urgent_important">Q2: Schedule</option>
                              <option value="q3_urgent_not_important">Q3: Delegate</option>
                              <option value="q4_neither">Q4: Backlog</option>
                            </select>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="py-8 text-center text-xs text-slate-500 border border-dashed border-slate-800/80 rounded-xl">
                      No tasks in this quadrant
                    </div>
                  )}
                </div>
              </div>

              {/* Footer advice */}
              <div className="pt-3 border-t border-slate-800/60 mt-2 flex items-center justify-between text-[11px] text-slate-400">
                <span className="font-semibold">{quad.actionLabel}</span>
                <span className="text-[10px] text-slate-500">
                  {quadTasks.length} items
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
