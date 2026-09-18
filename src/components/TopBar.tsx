import React, { useState, useRef, useEffect } from 'react';
import { 
  Search, 
  Bell, 
  ChevronDown, 
  User as UserIcon, 
  Settings, 
  LogOut,
  Sparkles,
  Menu,
  X,
  Home,
  Calendar,
  CheckSquare,
  Dumbbell,
  GraduationCap
} from 'lucide-react';
import { User, NotificationItem } from '../types';
import { ActiveTab } from './Sidebar';
import { MountainLogo } from './MountainLogo';

interface TopBarProps {
  user: User;
  onOpenSearch: () => void;
  onOpenNotifications: () => void;
  onOpenCopilot?: () => void;
  unreadCount: number;
  onSelectTab: (tab: ActiveTab) => void;
  onLogout: () => void;
  activeTab: ActiveTab;
}

export const TopBar: React.FC<TopBarProps> = ({
  user,
  onOpenSearch,
  onOpenNotifications,
  onOpenCopilot,
  unreadCount,
  onSelectTab,
  onLogout,
  activeTab
}) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getInitials = (name: string) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <header className="sticky top-0 z-20 w-full bg-[#090d18]/80 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-6 py-3.5 flex items-center justify-between">
      {/* Mobile Brand / Menu toggle */}
      <div className="flex items-center gap-3 md:hidden">
        <button
          onClick={() => setShowMobileMenu(!showMobileMenu)}
          className="p-2 rounded-xl bg-slate-800/60 text-slate-300 hover:text-white"
        >
          {showMobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
        <MountainLogo size="sm" />
      </div>

      {/* Center/Left Search Box (Matching Design) */}
      <div className="hidden sm:flex items-center flex-1 max-w-md">
        <button
          onClick={onOpenSearch}
          className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl bg-[#111625] border border-slate-800/80 text-slate-400 hover:border-slate-700 hover:text-slate-300 transition-all text-xs sm:text-sm group"
        >
          <div className="flex items-center gap-2.5">
            <Search className="w-4 h-4 text-slate-500 group-hover:text-blue-400 transition-colors" />
            <span>Search anything...</span>
          </div>
          <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-semibold text-slate-400 bg-slate-800/80 border border-slate-700/60 rounded-md">
            Ctrl K
          </kbd>
        </button>
      </div>

      {/* Right Controls: Search button on small screens, Notifications, Profile */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenSearch}
          className="sm:hidden p-2 rounded-xl bg-slate-800/60 text-slate-300 hover:text-white"
        >
          <Search className="w-5 h-5" />
        </button>

        {/* AI Copilot Quick Summon */}
        {onOpenCopilot && (
          <button
            onClick={onOpenCopilot}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-blue-600/20 via-indigo-600/20 to-purple-600/20 hover:from-blue-600/30 hover:to-purple-600/30 border border-blue-500/30 text-blue-300 hover:text-white transition-all text-xs font-semibold shadow-sm group"
            title="Open Peak AI Assistant"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-300 group-hover:rotate-12 transition-transform" />
            <span className="hidden sm:inline">AI Copilot</span>
          </button>
        )}

        {/* Notifications Icon Button with Badge */}
        <button
          onClick={onOpenNotifications}
          className="relative p-2.5 rounded-xl bg-[#111625] border border-slate-800/80 text-slate-400 hover:text-white hover:border-slate-700 transition-all"
          title="Notifications"
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_#3B82F6]" />
          )}
        </button>

        {/* User Profile Trigger */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-3 p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-[#111625] border border-slate-800/80 hover:border-slate-700 transition-all select-none"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white font-bold text-xs shadow-sm">
              {getInitials(user.name)}
            </div>
            <div className="hidden sm:block text-left">
              <div className="text-xs font-semibold text-white leading-tight">
                {user.name}
              </div>
              <div className="text-[10px] text-slate-400 leading-tight">
                {user.studentRole || 'Student'}
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
          </button>

          {/* Profile Dropdown Menu */}
          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-[#0e1424] border border-slate-800/90 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-3 py-2 border-b border-slate-800/80 mb-1">
                <div className="text-xs font-bold text-white">{user.name}</div>
                <div className="text-[11px] text-slate-400 truncate">{user.email}</div>
                {user.semester && (
                  <span className="inline-block mt-1 px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 text-[10px] font-medium border border-blue-500/20">
                    {user.semester}
                  </span>
                )}
              </div>

              <button
                onClick={() => {
                  onSelectTab('settings');
                  setShowProfileMenu(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors"
              >
                <Settings className="w-4 h-4 text-slate-400" />
                <span>Account & Preferences</span>
              </button>

              <button
                onClick={() => {
                  onLogout();
                  setShowProfileMenu(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-rose-300 hover:bg-rose-500/10 transition-colors mt-1"
              >
                <LogOut className="w-4 h-4 text-rose-400" />
                <span>Sign out</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Nav Overlay */}
      {showMobileMenu && (
        <div className="fixed inset-0 top-[61px] bg-[#070b14]/95 z-40 p-6 flex flex-col justify-between md:hidden animate-in fade-in duration-200">
          <div className="space-y-3">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-2">Navigation</div>
            {[
              { id: 'home' as ActiveTab, label: 'Home', icon: <Home className="w-5 h-5" /> },
              { id: 'schedule' as ActiveTab, label: 'Schedule', icon: <Calendar className="w-5 h-5" /> },
              { id: 'tasks' as ActiveTab, label: 'Tasks', icon: <CheckSquare className="w-5 h-5" /> },
              { id: 'workout' as ActiveTab, label: 'Workout', icon: <Dumbbell className="w-5 h-5" /> },
              { id: 'academics' as ActiveTab, label: 'Academics', icon: <GraduationCap className="w-5 h-5" /> },
              { id: 'settings' as ActiveTab, label: 'Settings', icon: <Settings className="w-5 h-5" /> },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  onSelectTab(item.id);
                  setShowMobileMenu(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  activeTab === item.id 
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' 
                    : 'text-slate-300 hover:bg-slate-800/60'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
          </div>

          <button
            onClick={onLogout}
            className="w-full py-3 px-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm font-medium flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      )}
    </header>
  );
};
