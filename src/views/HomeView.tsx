import React from 'react';
import { motion } from 'motion/react';
import { 
  Calendar, 
  CheckSquare, 
  Dumbbell, 
  GraduationCap, 
  ArrowRight, 
  CalendarDays, 
  Quote, 
  Clock, 
  Flame, 
  CheckCircle2, 
  TrendingUp,
  Sparkles,
  Target,
  Briefcase,
  Plus
} from 'lucide-react';
import { User } from '../types';
import { UserFullData } from '../services/api';
import { ActiveTab } from '../components/Sidebar';

interface HomeViewProps {
  user: User;
  data: UserFullData;
  onNavigate: (tab: ActiveTab) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ user, data, onNavigate }) => {
  const firstName = user.name.trim().split(' ')[0] || 'Student';

  // Compute live overview metrics strictly from actual data provided by the user
  const todayStr = new Date().toISOString().split('T')[0];
  const todayTasks = (data.tasks || []).filter((t) => t.dueDate === todayStr);
  const completedTasks = todayTasks.filter((t) => t.completed).length;
  const totalTodayTasks = todayTasks.length;

  const todayClasses = (data.schedules || []).filter((s) => s.category === 'class' && (!s.date || s.date === todayStr));
  const totalClasses = todayClasses.length;
  
  // Real completed classes based on actual schedule time passed today
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const completedClasses = todayClasses.filter((c) => {
    if (!c.endTime) return false;
    const parts = c.endTime.split(':');
    if (parts.length < 2) return false;
    const endMinutes = parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
    return endMinutes <= currentMinutes;
  }).length;

  // Real workout streak computed dynamically from user's logged workout sessions
  const calculateWorkoutStreak = (sessions: any[]): number => {
    if (!sessions || sessions.length === 0) return 0;
    const dates = new Set<string>();
    sessions.forEach((s) => {
      const d = s.date || (s.finishedAt ? s.finishedAt.split('T')[0] : null) || (s.startedAt ? s.startedAt.split('T')[0] : null);
      if (d) dates.add(d);
    });
    if (dates.size === 0) return 0;

    const sortedDates = Array.from(dates).sort().reverse();
    const today = new Date().toISOString().split('T')[0];
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterday = yesterdayDate.toISOString().split('T')[0];

    const mostRecent = sortedDates[0];
    if (mostRecent !== today && mostRecent !== yesterday) {
      return 0;
    }

    let streak = 0;
    let checkDate = new Date(mostRecent);
    for (const dateStr of sortedDates) {
      const expectedStr = checkDate.toISOString().split('T')[0];
      if (dateStr === expectedStr) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
    return streak;
  };

  const workoutSessionsList = data.workoutSessions || (data as any).workoutLogs || [];
  const workoutStreak = calculateWorkoutStreak(workoutSessionsList);

  // Academic completion strictly from user's added subjects
  let totalTopics = 0;
  let completedTopics = 0;
  (data.subjects || []).forEach((sub) => {
    (sub.units || []).forEach((u) => {
      (u.topics || []).forEach((t) => {
        totalTopics++;
        if (t.status === 'Completed') completedTopics++;
      });
    });
  });
  const academicProgressPct = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

  // Formatted date
  const dateFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div className="space-y-7 pb-10">
      {/* Top Welcome Header & Motivational Quote Card */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
            Good Morning, <br />
            <motion.span 
              animate={{ 
                filter: ['hue-rotate(0deg)', 'hue-rotate(45deg)', 'hue-rotate(0deg)'],
              }}
              transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
              className="bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent inline-block"
            >
              {firstName}
            </motion.span>
          </h1>
          <p className="text-slate-400 text-sm mt-1.5 font-normal flex items-center gap-2">
            <span>Stay consistent. Build the life you want.</span>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-400 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              <span>Active</span>
            </span>
          </p>
        </div>

        {/* Date and Quote Cards */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Date Chip */}
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-xs font-medium text-slate-300 shadow-sm self-start sm:self-auto">
            <CalendarDays className="w-4 h-4 text-blue-400" />
            <span>{dateFormatted}</span>
          </div>

          {/* Inspirational Quote Card with subtle continuous border animation */}
          <motion.div 
            animate={{ 
              borderColor: ['rgba(59, 130, 246, 0.2)', 'rgba(99, 102, 241, 0.4)', 'rgba(59, 130, 246, 0.2)'],
            }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
            className="relative p-3.5 px-4 rounded-2xl bg-gradient-to-r from-[#11192e] to-[#0c1324] border shadow-lg flex items-start gap-3 max-w-xs"
          >
            <Quote className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
            <div className="space-y-1">
              <p className="text-xs text-slate-200 font-medium italic">
                “Discipline today, freedom tomorrow.”
              </p>
              <div className="w-8 h-0.5 rounded-full bg-blue-500" />
            </div>
          </motion.div>
        </div>
      </div>

      {/* User Details & Aspirations Focus Strip (Animated) */}
      {(user.studyingFor || user.primaryGoals || user.occupation || user.age) && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-blue-950/40 via-indigo-950/30 to-purple-950/40 border border-blue-500/20 backdrop-blur-sm flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg"
        >
          <div className="space-y-1.5 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              {user.occupation && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-500/15 border border-blue-500/30 text-[11px] font-semibold text-blue-300 capitalize">
                  {user.occupation === 'job' ? <Briefcase className="w-3 h-3" /> : <GraduationCap className="w-3 h-3" />}
                  <span>{user.occupation === 'both' ? 'Student & Professional' : user.occupation === 'job' ? 'Professional' : 'Student'}</span>
                </span>
              )}
              {user.age && (
                <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[11px] font-medium text-slate-300 border border-slate-700">
                  {user.age} yrs
                </span>
              )}
              {user.studyingFor && (
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-[11px] font-semibold text-amber-300">
                  Target: {user.studyingFor}
                </span>
              )}
            </div>

            {user.primaryGoals && (
              <p className="text-xs sm:text-sm text-slate-300 font-medium flex items-center gap-2">
                <Target className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="truncate">Focus: “{user.primaryGoals}”</span>
              </p>
            )}
          </div>

          {/* Quick Action Animated Launch Buttons */}
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onNavigate('academics')}
              className="px-3.5 py-2 rounded-xl bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/40 text-amber-300 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5 animate-spin text-amber-400" style={{ animationDuration: '8s' }} />
              <span>AI Tutor</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onNavigate('tasks')}
              className="px-3.5 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Add Task</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onNavigate('workout')}
              className="px-3.5 py-2 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 text-purple-300 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
            >
              <Dumbbell className="w-3.5 h-3.5 text-purple-400" />
              <span>Log Workout</span>
            </motion.button>
          </div>
        </motion.div>
      )}

      {/* 4 Large Interactive Hub Cards (2x2 Grid) with continuous running animations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
        {/* CARD 1: SCHEDULE (Blue) */}
        <motion.div
          whileHover={{ y: -4, scale: 1.01 }}
          transition={{ duration: 0.2 }}
          onClick={() => onNavigate('schedule')}
          className="group relative rounded-3xl bg-gradient-to-br from-[#12264c] via-[#0e1c3a] to-[#0a1329] border border-blue-500/30 hover:border-blue-400/60 p-6 sm:p-7 shadow-[0_8px_30px_rgba(30,64,175,0.15)] cursor-pointer overflow-hidden flex flex-col justify-between min-h-[210px]"
        >
          {/* Continuous ambient glow orb */}
          <motion.div 
            animate={{ opacity: [0.15, 0.35, 0.15], scale: [0.95, 1.08, 0.95] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -top-10 -right-10 w-44 h-44 bg-blue-500/20 rounded-full blur-2xl pointer-events-none"
          />

          {/* Background Graphic: Translucent Calendar with Rotating Clock hands */}
          <div className="absolute -right-3 -bottom-3 sm:right-4 sm:bottom-4 w-36 h-36 opacity-30 group-hover:opacity-50 group-hover:scale-105 transition-all duration-300 pointer-events-none select-none">
            <svg viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
              <rect x="20" y="30" width="100" height="90" rx="16" fill="#3B82F6" fillOpacity="0.25" stroke="#60A5FA" strokeWidth="2.5" />
              <line x1="20" y1="55" x2="120" y2="55" stroke="#60A5FA" strokeWidth="2" strokeOpacity="0.6" />
              <rect x="36" y="70" width="16" height="12" rx="3" fill="#93C5FD" fillOpacity="0.4" />
              <rect x="62" y="70" width="16" height="12" rx="3" fill="#93C5FD" fillOpacity="0.4" />
              <rect x="88" y="70" width="16" height="12" rx="3" fill="#93C5FD" fillOpacity="0.8" />
              <rect x="36" y="92" width="16" height="12" rx="3" fill="#93C5FD" fillOpacity="0.4" />
              <rect x="62" y="92" width="16" height="12" rx="3" fill="#93C5FD" fillOpacity="0.4" />
              {/* Clock Overlay with continuous rotating hand */}
              <circle cx="115" cy="115" r="28" fill="#1D4ED8" stroke="#93C5FD" strokeWidth="2.5" />
              {/* Minute Hand revolving continuously */}
              <g transform="translate(115, 115)">
                <line x1="0" y1="0" x2="0" y2="-17" stroke="white" strokeWidth="2" strokeLinecap="round">
                  <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="14s" repeatCount="indefinite" />
                </line>
                <line x1="0" y1="0" x2="11" y2="0" stroke="white" strokeWidth="2" strokeLinecap="round" />
              </g>
            </svg>
          </div>

          <div className="relative z-10 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/20 border border-blue-400/40 flex items-center justify-center text-blue-300 shadow-inner group-hover:bg-blue-500/30 transition-colors">
              <Calendar className="w-6 h-6" />
            </div>

            <div className="space-y-1 max-w-[260px] sm:max-w-xs">
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Schedule
              </h2>
              <p className="text-xs sm:text-sm text-blue-200/70 leading-relaxed font-normal">
                View and manage your classes, meetings and important events.
              </p>
            </div>
          </div>

          <div className="relative z-10 pt-4">
            <div className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-blue-500/30 border border-blue-400/40 text-blue-200 group-hover:bg-blue-500 group-hover:text-white transition-all shadow-md">
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>
        </motion.div>

        {/* CARD 2: DAILY TASKS (Green) */}
        <motion.div
          whileHover={{ y: -4, scale: 1.01 }}
          transition={{ duration: 0.2 }}
          onClick={() => onNavigate('tasks')}
          className="group relative rounded-3xl bg-gradient-to-br from-[#0c2f25] via-[#0a231c] to-[#061713] border border-emerald-500/30 hover:border-emerald-400/60 p-6 sm:p-7 shadow-[0_8px_30px_rgba(16,185,129,0.15)] cursor-pointer overflow-hidden flex flex-col justify-between min-h-[210px]"
        >
          {/* Continuous ambient glow orb */}
          <motion.div 
            animate={{ opacity: [0.15, 0.35, 0.15], scale: [0.95, 1.08, 0.95] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
            className="absolute -top-10 -right-10 w-44 h-44 bg-emerald-500/20 rounded-full blur-2xl pointer-events-none"
          />

          {/* Background Graphic: Translucent Task Checklist */}
          <motion.div 
            animate={{ y: [0, -3, 0] }}
            transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -right-3 -bottom-3 sm:right-4 sm:bottom-4 w-36 h-36 opacity-30 group-hover:opacity-50 group-hover:scale-105 transition-all duration-300 pointer-events-none select-none"
          >
            <svg viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
              <rect x="30" y="20" width="105" height="120" rx="16" fill="#10B981" fillOpacity="0.25" stroke="#34D399" strokeWidth="2.5" />
              {/* Items with checkmarks */}
              <circle cx="52" cy="50" r="10" fill="#34D399" fillOpacity="0.8" />
              <path d="M48 50L51 53L57 46" stroke="#064E3B" strokeWidth="2" strokeLinecap="round" />
              <rect x="70" y="47" width="50" height="6" rx="3" fill="#A7F3D0" fillOpacity="0.5" />

              <circle cx="52" cy="80" r="10" fill="#34D399" fillOpacity="0.8" />
              <path d="M48 80L51 83L57 76" stroke="#064E3B" strokeWidth="2" strokeLinecap="round" />
              <rect x="70" y="77" width="42" height="6" rx="3" fill="#A7F3D0" fillOpacity="0.5" />

              <circle cx="52" cy="110" r="10" fill="#047857" stroke="#34D399" strokeWidth="1.5" />
              <rect x="70" y="107" width="35" height="6" rx="3" fill="#A7F3D0" fillOpacity="0.3" />
            </svg>
          </motion.div>

          <div className="relative z-10 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300 shadow-inner group-hover:bg-emerald-500/30 transition-colors">
              <CheckSquare className="w-6 h-6" />
            </div>

            <div className="space-y-1 max-w-[260px] sm:max-w-xs">
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Daily Tasks
              </h2>
              <p className="text-xs sm:text-sm text-emerald-200/70 leading-relaxed font-normal">
                Stay organized and get things done.
              </p>
            </div>
          </div>

          <div className="relative z-10 pt-4">
            <div className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-emerald-500/30 border border-emerald-400/40 text-emerald-200 group-hover:bg-emerald-500 group-hover:text-white transition-all shadow-md">
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>
        </motion.div>

        {/* CARD 3: WORKOUT (Purple) */}
        <motion.div
          whileHover={{ y: -4, scale: 1.01 }}
          transition={{ duration: 0.2 }}
          onClick={() => onNavigate('workout')}
          className="group relative rounded-3xl bg-gradient-to-br from-[#2c1743] via-[#201033] to-[#140822] border border-purple-500/30 hover:border-purple-400/60 p-6 sm:p-7 shadow-[0_8px_30px_rgba(168,85,247,0.15)] cursor-pointer overflow-hidden flex flex-col justify-between min-h-[210px]"
        >
          {/* Continuous ambient glow orb */}
          <motion.div 
            animate={{ opacity: [0.15, 0.35, 0.15], scale: [0.95, 1.08, 0.95] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
            className="absolute -top-10 -right-10 w-44 h-44 bg-purple-500/20 rounded-full blur-2xl pointer-events-none"
          />

          {/* Background Graphic: Athletic physique silhouette with continuous subtle float */}
          <motion.div 
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -right-3 -bottom-3 sm:right-4 sm:bottom-4 w-36 h-36 opacity-30 group-hover:opacity-50 group-hover:scale-105 transition-all duration-300 pointer-events-none select-none"
          >
            <svg viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
              {/* Muscular torso/pose silhouette */}
              <circle cx="80" cy="40" r="14" fill="#A855F7" fillOpacity="0.4" />
              <path 
                d="M50 70C50 60 65 55 80 55C95 55 110 60 110 70L124 88C127 92 122 97 116 93L98 84V130C98 135 94 140 88 140H72C66 140 62 135 62 130V84L44 93C38 97 33 92 36 88L50 70Z" 
                fill="#A855F7" 
                fillOpacity="0.5" 
              />
              <path 
                d="M26 82L38 74L42 84L30 92Z" 
                fill="#C084FC" 
                fillOpacity="0.6" 
              />
              <path 
                d="M134 82L122 74L118 84L130 92Z" 
                fill="#C084FC" 
                fillOpacity="0.6" 
              />
            </svg>
          </motion.div>

          <div className="relative z-10 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/20 border border-purple-400/40 flex items-center justify-center text-purple-300 shadow-inner group-hover:bg-purple-500/30 transition-colors">
              <Dumbbell className="w-6 h-6" />
            </div>

            <div className="space-y-1 max-w-[260px] sm:max-w-xs">
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Workout
              </h2>
              <p className="text-xs sm:text-sm text-purple-200/70 leading-relaxed font-normal">
                Track your progress, reach your goals.
              </p>
            </div>
          </div>

          <div className="relative z-10 pt-4">
            <div className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-purple-500/30 border border-purple-400/40 text-purple-200 group-hover:bg-purple-500 group-hover:text-white transition-all shadow-md">
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>
        </motion.div>

        {/* CARD 4: ACADEMICS (Amber/Bronze) */}
        <motion.div
          whileHover={{ y: -4, scale: 1.01 }}
          transition={{ duration: 0.2 }}
          onClick={() => onNavigate('academics')}
          className="group relative rounded-3xl bg-gradient-to-br from-[#3b2713] via-[#2a1b0b] to-[#1a0f05] border border-amber-500/30 hover:border-amber-400/60 p-6 sm:p-7 shadow-[0_8px_30px_rgba(245,158,11,0.15)] cursor-pointer overflow-hidden flex flex-col justify-between min-h-[210px]"
        >
          {/* Continuous ambient glow orb */}
          <motion.div 
            animate={{ opacity: [0.15, 0.35, 0.15], scale: [0.95, 1.08, 0.95] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
            className="absolute -top-10 -right-10 w-44 h-44 bg-amber-500/20 rounded-full blur-2xl pointer-events-none"
          />

          {/* Background Graphic: Translucent Graduation Cap hovering continuously */}
          <motion.div 
            animate={{ y: [0, -5, 0], rotate: [0, 1.5, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -right-3 -bottom-3 sm:right-4 sm:bottom-4 w-36 h-36 opacity-30 group-hover:opacity-50 group-hover:scale-105 transition-all duration-300 pointer-events-none select-none"
          >
            <svg viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
              <path d="M80 35L140 65L80 95L20 65L80 35Z" fill="#F59E0B" fillOpacity="0.4" stroke="#FBBF24" strokeWidth="2" />
              <path d="M45 80V110C45 125 115 125 115 110V80L80 98L45 80Z" fill="#B45309" fillOpacity="0.5" />
              <path d="M135 68V115" stroke="#FBBF24" strokeWidth="2.5" strokeLinecap="round" />
              <circle cx="135" cy="120" r="4" fill="#FDE68A" />
            </svg>
          </motion.div>

          <div className="relative z-10 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300 shadow-inner group-hover:bg-amber-500/30 transition-colors">
              <GraduationCap className="w-6 h-6" />
            </div>

            <div className="space-y-1 max-w-[260px] sm:max-w-xs">
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Academics
              </h2>
              <p className="text-xs sm:text-sm text-amber-200/70 leading-relaxed font-normal">
                Monitor your performance, track progress and plan ahead.
              </p>
            </div>
          </div>

          <div className="relative z-10 pt-4">
            <div className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-amber-500/30 border border-amber-400/40 text-amber-200 group-hover:bg-amber-500 group-hover:text-white transition-all shadow-md">
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Today's Overview Bar (Matching bottom section of Screenshot) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4 pt-1">
        {/* Today's Classes */}
        <div 
          onClick={() => onNavigate('schedule')}
          className="p-4 rounded-2xl bg-[#0f1526]/80 border border-slate-800/90 hover:border-slate-700 transition-all cursor-pointer flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/15 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[11px] text-slate-400 font-medium">Today's Classes</div>
              {totalClasses === 0 ? (
                <div className="text-xs text-slate-400 font-medium mt-0.5 flex items-center gap-1 group-hover:text-blue-300 transition-colors">
                  <span>No classes added</span>
                  <span className="text-[10px] text-blue-400 font-bold">• Add</span>
                </div>
              ) : (
                <div className="text-base font-bold text-white flex items-baseline gap-1">
                  <span>{completedClasses}</span>
                  <span className="text-xs text-slate-500 font-normal">/ {totalClasses} {totalClasses === 1 ? 'class' : 'classes'}</span>
                </div>
              )}
            </div>
          </div>
          <div className="w-7 h-7 rounded-full bg-slate-800/60 flex items-center justify-center text-slate-400 group-hover:text-white group-hover:bg-slate-800 transition-colors">
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Tasks Completed */}
        <div 
          onClick={() => onNavigate('tasks')}
          className="p-4 rounded-2xl bg-[#0f1526]/80 border border-slate-800/90 hover:border-slate-700 transition-all cursor-pointer flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[11px] text-slate-400 font-medium">Tasks Completed</div>
              {totalTodayTasks === 0 ? (
                <div className="text-xs text-slate-400 font-medium mt-0.5 flex items-center gap-1 group-hover:text-emerald-300 transition-colors">
                  <span>No tasks today</span>
                  <span className="text-[10px] text-emerald-400 font-bold">• Add</span>
                </div>
              ) : (
                <div className="text-base font-bold text-white flex items-baseline gap-1">
                  <span>{completedTasks}</span>
                  <span className="text-xs text-slate-500 font-normal">/ {totalTodayTasks} {totalTodayTasks === 1 ? 'task' : 'tasks'}</span>
                </div>
              )}
            </div>
          </div>
          <div className="w-7 h-7 rounded-full bg-slate-800/60 flex items-center justify-center text-slate-400 group-hover:text-white group-hover:bg-slate-800 transition-colors">
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Workout Streak */}
        <div 
          onClick={() => onNavigate('workout')}
          className="p-4 rounded-2xl bg-[#0f1526]/80 border border-slate-800/90 hover:border-slate-700 transition-all cursor-pointer flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <motion.div 
              animate={workoutStreak > 0 ? { scale: [1, 1.12, 1], filter: ['brightness(1)', 'brightness(1.25)', 'brightness(1)'] } : {}}
              transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
              className="w-9 h-9 rounded-xl bg-purple-500/15 border border-purple-500/20 flex items-center justify-center text-purple-400"
            >
              <Flame className={`w-4 h-4 ${workoutStreak > 0 ? 'text-orange-400 fill-orange-400/30' : 'text-slate-500'}`} />
            </motion.div>
            <div>
              <div className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                <span>Workout Streak</span>
                {workoutStreak > 0 && <span className="inline-block w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />}
              </div>
              {(data.workoutLogs || []).length === 0 && workoutStreak === 0 ? (
                <div className="text-xs text-slate-400 font-medium mt-0.5 flex items-center gap-1 group-hover:text-purple-300 transition-colors">
                  <span>No workouts logged</span>
                  <span className="text-[10px] text-purple-400 font-bold">• Log</span>
                </div>
              ) : (
                <div className="text-base font-bold text-white flex items-baseline gap-1">
                  <span>{workoutStreak}</span>
                  <span className="text-xs text-slate-500 font-normal">{workoutStreak === 1 ? 'day active' : 'days active'}</span>
                </div>
              )}
            </div>
          </div>
          <div className="w-7 h-7 rounded-full bg-slate-800/60 flex items-center justify-center text-slate-400 group-hover:text-white group-hover:bg-slate-800 transition-colors">
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Semester Progress */}
        <div 
          onClick={() => onNavigate('academics')}
          className="p-4 rounded-2xl bg-[#0f1526]/80 border border-slate-800/90 hover:border-slate-700 transition-all cursor-pointer flex items-center justify-between group"
        >
          <div className="flex items-center gap-3 flex-1 min-w-0 pr-2">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
              <GraduationCap className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[11px] text-slate-400 font-medium">Semester Progress</div>
              {(data.subjects || []).length === 0 ? (
                <div className="text-xs text-slate-400 font-medium mt-0.5 flex items-center gap-1 group-hover:text-amber-300 transition-colors">
                  <span>No subjects added</span>
                  <span className="text-[10px] text-amber-400 font-bold">• Setup</span>
                </div>
              ) : (
                <>
                  <div className="text-base font-bold text-white leading-tight">
                    {academicProgressPct}%
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden mt-1.5 relative">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${academicProgressPct}%` }}
                      transition={{ duration: 1.2, ease: 'easeOut' }}
                      className="h-full bg-gradient-to-r from-amber-500 via-amber-400 to-blue-500 rounded-full"
                    />
                  </div>
                </>
              )}
            </div>
          </div>
          <div className="w-7 h-7 rounded-full bg-slate-800/60 flex items-center justify-center text-slate-400 group-hover:text-white group-hover:bg-slate-800 transition-colors shrink-0">
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>
    </div>
  );
};
