import React, { useState, useMemo } from 'react';
import { Search, X, Calendar, CheckSquare, Dumbbell, GraduationCap, ArrowRight } from 'lucide-react';
import { UserFullData } from '../services/api';
import { ActiveTab } from './Sidebar';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: UserFullData;
  onNavigate: (tab: ActiveTab) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  data,
  onNavigate,
}) => {
  const [query, setQuery] = useState('');

  const searchResults = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();

    const results: {
      id: string;
      title: string;
      subtitle: string;
      category: 'schedule' | 'task' | 'workout' | 'academics';
      tab: ActiveTab;
    }[] = [];

    // Search tasks
    data.tasks.forEach((t) => {
      if (t.title.toLowerCase().includes(q) || (t.description && t.description.toLowerCase().includes(q))) {
        results.push({
          id: `task-${t.id}`,
          title: t.title,
          subtitle: `Task • Priority: ${t.priority} • Due: ${t.dueDate}`,
          category: 'task',
          tab: 'tasks',
        });
      }
    });

    // Search schedules
    data.schedules.forEach((s) => {
      if (s.title.toLowerCase().includes(q) || (s.location && s.location.toLowerCase().includes(q))) {
        results.push({
          id: `sch-${s.id}`,
          title: s.title,
          subtitle: `Event • ${s.startTime} - ${s.endTime} • ${s.category}`,
          category: 'schedule',
          tab: 'schedule',
        });
      }
    });

    // Search workouts
    data.workoutPlans.forEach((wp) => {
      if (wp.name.toLowerCase().includes(q)) {
        results.push({
          id: `wp-${wp.id}`,
          title: wp.name,
          subtitle: `Workout Routine • ${wp.days.length} days`,
          category: 'workout',
          tab: 'workout',
        });
      }
      wp.days.forEach((d) => {
        d.exercises.forEach((ex) => {
          if (ex.name.toLowerCase().includes(q) || ex.targetMuscle.toLowerCase().includes(q)) {
            results.push({
              id: `ex-${ex.id}`,
              title: ex.name,
              subtitle: `Exercise • ${ex.targetMuscle} in ${d.dayName}`,
              category: 'workout',
              tab: 'workout',
            });
          }
        });
      });
    });

    // Search subjects & topics
    data.subjects.forEach((sub) => {
      if (sub.name.toLowerCase().includes(q) || (sub.code && sub.code.toLowerCase().includes(q))) {
        results.push({
          id: `sub-${sub.id}`,
          title: sub.name,
          subtitle: `Academic Subject • ${sub.code || ''}`,
          category: 'academics',
          tab: 'academics',
        });
      }
      sub.units.forEach((u) => {
        u.topics.forEach((top) => {
          if (top.title.toLowerCase().includes(q)) {
            results.push({
              id: `top-${top.id}`,
              title: top.title,
              subtitle: `Topic in ${sub.name} • Status: ${top.status}`,
              category: 'academics',
              tab: 'academics',
            });
          }
        });
      });
    });

    return results.slice(0, 8);
  }, [query, data]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-xl rounded-2xl bg-[#0e1424] border border-slate-800 shadow-2xl overflow-hidden flex flex-col">
        {/* Search Header */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-800">
          <Search className="w-5 h-5 text-blue-400 shrink-0" />
          <input
            type="text"
            placeholder="Search tasks, classes, workouts, academic topics..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            className="w-full bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none"
          />
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-2 divide-y divide-slate-800/40">
          {searchResults.length > 0 ? (
            searchResults.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  onNavigate(item.tab);
                  onClose();
                }}
                className="w-full text-left flex items-center justify-between p-3 rounded-xl hover:bg-slate-800/60 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-700/60 flex items-center justify-center text-slate-300 group-hover:text-blue-400 group-hover:border-blue-500/40 transition-colors">
                    {item.category === 'schedule' && <Calendar className="w-4 h-4" />}
                    {item.category === 'task' && <CheckSquare className="w-4 h-4" />}
                    {item.category === 'workout' && <Dumbbell className="w-4 h-4" />}
                    {item.category === 'academics' && <GraduationCap className="w-4 h-4" />}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white group-hover:text-blue-300 transition-colors">
                      {item.title}
                    </div>
                    <div className="text-xs text-slate-400">{item.subtitle}</div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
              </button>
            ))
          ) : query.trim() ? (
            <div className="py-8 text-center text-sm text-slate-400">
              No matching records found for "{query}".
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-slate-500">
              Type keywords to search across your schedules, tasks, workouts, and subjects.
            </div>
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2.5 bg-slate-900/60 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
          <span>Search your isolated student database</span>
          <span>Press ESC to close</span>
        </div>
      </div>
    </div>
  );
};
