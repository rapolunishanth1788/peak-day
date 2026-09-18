import React from 'react';
import { 
  Home, 
  Calendar, 
  CheckSquare, 
  Dumbbell, 
  GraduationCap, 
  Settings, 
  LogOut,
  ChevronRight
} from 'lucide-react';
import { MountainLogo } from './MountainLogo';
import { User } from '../types';

export type ActiveTab = 'home' | 'schedule' | 'tasks' | 'workout' | 'academics' | 'settings';

interface SidebarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  onLogout: () => void;
  user: User;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  activeTab, 
  onSelectTab, 
  onLogout,
  user
}) => {
  const navItems: { id: ActiveTab; label: string; icon: React.ReactNode }[] = [
    { id: 'home', label: 'Home', icon: <Home className="w-5 h-5" /> },
    { id: 'schedule', label: 'Schedule', icon: <Calendar className="w-5 h-5" /> },
    { id: 'tasks', label: 'Tasks', icon: <CheckSquare className="w-5 h-5" /> },
    { id: 'workout', label: 'Workout', icon: <Dumbbell className="w-5 h-5" /> },
    { id: 'academics', label: 'Academics', icon: <GraduationCap className="w-5 h-5" /> },
  ];

  return (
    <aside className="hidden md:flex flex-col justify-between w-64 h-screen sticky top-0 bg-[#090d18] border-r border-slate-800/80 p-5 z-20 select-none">
      {/* Top Logo & Navigation */}
      <div className="space-y-7">
        {/* Brand Header */}
        <div className="pt-2 px-1">
          <MountainLogo size="md" />
          <p className="text-[11px] tracking-widest text-slate-500 font-medium pl-10 mt-0.5">
            Plan • Track • Improve
          </p>
        </div>

        {/* Primary Navigation List */}
        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-600/25 to-blue-500/10 text-white border border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.15)]'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={isActive ? 'text-blue-400' : 'text-slate-400'}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </div>
                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_8px_#60A5FA]" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Subtle Divider */}
        <div className="border-t border-slate-800/80 px-2 my-2" />

        {/* Secondary Links */}
        <div className="space-y-1">
          <button
            onClick={() => onSelectTab('settings')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
              activeTab === 'settings'
                ? 'bg-slate-800/80 text-white border border-slate-700/60'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Settings className="w-5 h-5 text-slate-400" />
            <span>Settings</span>
          </button>

          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-rose-300 hover:bg-rose-500/10 transition-all"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Bottom Motivational Widget matching design */}
      <div className="relative rounded-2xl bg-gradient-to-br from-[#0e1629] to-[#0a0f1d] border border-slate-800/90 p-4 overflow-hidden shadow-lg">
        <div className="absolute right-0 bottom-0 opacity-20 pointer-events-none">
          <svg width="110" height="90" viewBox="0 0 110 90" fill="none">
            <path d="M10 90L60 20L110 90H10Z" fill="#3B82F6" />
            <path d="M60 20L110 90H60V20Z" fill="#1D4ED8" />
          </svg>
        </div>
        <div className="relative z-10 space-y-1">
          <div className="text-xs font-bold text-slate-300 tracking-wide leading-snug">
            Better <br />
            Habits <br />
            Bigger <br />
            Goals
          </div>
          <div className="w-7 h-1 rounded-full bg-blue-500 mt-2" />
        </div>
      </div>
    </aside>
  );
};
