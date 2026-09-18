import React, { useState } from 'react';
import { 
  Settings as SettingsIcon, 
  User as UserIcon, 
  Download, 
  Save, 
  Sparkles, 
  Check, 
  Palette,
  Briefcase,
  GraduationCap,
  Target
} from 'lucide-react';
import { User, AppTheme } from '../types';
import { UserFullData } from '../services/api';

interface SettingsViewProps {
  user: User;
  data: UserFullData;
  onUpdateUser: (updatedUser: User) => void;
  onLogout: () => void;
}

interface ThemeOption {
  id: AppTheme;
  name: string;
  description: string;
  bgHex: string;
  cardHex: string;
  accentHex: string;
}

const THEME_OPTIONS: ThemeOption[] = [
  {
    id: 'midnight',
    name: 'Midnight',
    description: 'Deep nebula black & electric indigo blue',
    bgHex: '#070b14',
    cardHex: '#0e1424',
    accentHex: '#3b82f6',
  },
  {
    id: 'deep-ocean',
    name: 'Deep Ocean',
    description: 'Aquatic depths with cyan bioluminescence',
    bgHex: '#031422',
    cardHex: '#072238',
    accentHex: '#06b6d4',
  },
  {
    id: 'forest',
    name: 'Forest',
    description: 'Evergreen emerald, jade and pine sanctuary',
    bgHex: '#051a14',
    cardHex: '#0c2b22',
    accentHex: '#10b981',
  },
  {
    id: 'sunset',
    name: 'Sunset',
    description: 'Twilight purple, crimson & warm rose',
    bgHex: '#170d1e',
    cardHex: '#261533',
    accentHex: '#f43f5e',
  },
  {
    id: 'light',
    name: 'Crisp Light',
    description: 'Clean, modern high-contrast daytime canvas',
    bgHex: '#f8fafc',
    cardHex: '#ffffff',
    accentHex: '#2563eb',
  },
];

export const SettingsView: React.FC<SettingsViewProps> = ({
  user,
  data,
  onUpdateUser,
  onLogout,
}) => {
  const currentTheme = (user.settings?.theme || 'midnight') as AppTheme;
  const [selectedTheme, setSelectedTheme] = useState<AppTheme>(currentTheme);

  // User details
  const [name, setName] = useState(user.name);
  const [occupation, setOccupation] = useState<'student' | 'job' | 'both'>(user.occupation || 'student');
  const [age, setAge] = useState<number | string>(user.age || '');
  const [studyingFor, setStudyingFor] = useState(user.studyingFor || user.studentRole || '');
  const [primaryGoals, setPrimaryGoals] = useState(user.primaryGoals || '');
  const [semester, setSemester] = useState(user.semester || '');
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Performance Targets
  const [studyTarget, setStudyTarget] = useState(user.preferences?.dailyStudyTargetHours || 3);
  const [workoutDays, setWorkoutDays] = useState(user.preferences?.workoutDaysGoal || 5);
  const [minAttendance, setMinAttendance] = useState(user.preferences?.minAttendancePercentage || 75);

  const handleThemeChange = (newTheme: AppTheme) => {
    setSelectedTheme(newTheme);
    // Update CSS variables directly on HTML root
    document.documentElement.setAttribute('data-theme', newTheme);

    const updated: User = {
      ...user,
      settings: {
        ...(user.settings || {
          notificationsEnabled: true,
          soundEnabled: true,
          compactView: false,
          startOfWeek: 'monday',
          aiSuggestionsEnabled: true,
        }),
        theme: newTheme,
      },
    };
    onUpdateUser(updated);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const updated: User = {
      ...user,
      name,
      occupation,
      age: age ? Number(age) : undefined,
      studyingFor,
      studentRole: studyingFor,
      primaryGoals,
      semester,
      settings: {
        ...(user.settings || {
          notificationsEnabled: true,
          soundEnabled: true,
          compactView: false,
          startOfWeek: 'monday',
          aiSuggestionsEnabled: true,
        }),
        theme: selectedTheme,
      },
      preferences: {
        ...user.preferences,
        dailyStudyTargetHours: Number(studyTarget),
        workoutDaysGoal: Number(workoutDays),
        minAttendancePercentage: Number(minAttendance),
      },
    };
    onUpdateUser(updated);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleExportData = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(data, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `peak_day_backup_${user.name.replace(/\s+/g, '_')}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="max-w-4xl space-y-6 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-3">
          <SettingsIcon className="w-7 h-7 text-blue-400" />
          <span>Settings & Preferences</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Customize your theme, personal student/job details, daily momentum targets, and exports.
        </p>
      </div>

      {savedSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>Profile and preferences updated successfully!</span>
        </div>
      )}

      {/* Theme Selection Card */}
      <div className="rounded-2xl bg-[#0e1424] border border-slate-800 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Palette className="w-4 h-4 text-purple-400" />
            <span>Theme & Color Variables</span>
          </h3>
          <span className="text-xs font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
            Active: {THEME_OPTIONS.find((t) => t.id === selectedTheme)?.name || 'Midnight'}
          </span>
        </div>
        <p className="text-xs text-slate-400">
          Select your environment style. All background, card, and accent CSS variables update in real-time.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-1">
          {THEME_OPTIONS.map((theme) => {
            const isSelected = selectedTheme === theme.id;
            return (
              <button
                key={theme.id}
                type="button"
                onClick={() => handleThemeChange(theme.id)}
                className={`p-4 rounded-xl border text-left transition-all relative overflow-hidden group ${
                  isSelected
                    ? 'border-blue-500 bg-blue-950/30 shadow-lg ring-1 ring-blue-500'
                    : 'border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-900'
                }`}
              >
                {/* Color preview palette swatch */}
                <div className="flex items-center gap-2 mb-3">
                  <span
                    className="w-5 h-5 rounded-full border border-white/20 shadow-sm"
                    style={{ backgroundColor: theme.bgHex }}
                    title="Background"
                  />
                  <span
                    className="w-5 h-5 rounded-full border border-white/20 shadow-sm"
                    style={{ backgroundColor: theme.cardHex }}
                    title="Card"
                  />
                  <span
                    className="w-5 h-5 rounded-full border border-white/20 shadow-sm"
                    style={{ backgroundColor: theme.accentHex }}
                    title="Accent"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-white group-hover:text-blue-300 transition-colors">
                    {theme.name}
                  </span>
                  {isSelected && (
                    <span className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center text-white">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                  {theme.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* User Profile & Student/Job Information */}
      <form onSubmit={handleSaveProfile} className="rounded-2xl bg-[#0e1424] border border-slate-800 p-6 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <UserIcon className="w-4 h-4 text-blue-400" />
          <span>User & Academic Details</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[#131b2e] border border-slate-700 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Email Address</label>
            <input
              type="email"
              value={user.email}
              disabled
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-400 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Student or Job / Occupation</label>
            <div className="grid grid-cols-3 gap-2">
              {(['student', 'job', 'both'] as const).map((occ) => (
                <button
                  key={occ}
                  type="button"
                  onClick={() => setOccupation(occ)}
                  className={`py-2 px-2 rounded-xl text-xs font-medium border transition-all text-center ${
                    occupation === occ
                      ? 'bg-blue-600 border-blue-500 text-white shadow-sm'
                      : 'bg-[#131b2e] border-slate-700 text-slate-400 hover:text-white'
                  }`}
                >
                  {occ === 'both' ? 'Both' : occ === 'job' ? 'Job / Work' : 'Student'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Age</label>
            <input
              type="number"
              min="10"
              max="99"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="e.g. 21"
              className="w-full bg-[#131b2e] border border-slate-700 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-slate-300 mb-1">What are you studying or preparing for?</label>
            <input
              type="text"
              value={studyingFor}
              onChange={(e) => setStudyingFor(e.target.value)}
              placeholder="e.g. B.Tech Computer Science, Semester Finals, GATE / GRE, or Software Engineering career"
              className="w-full bg-[#131b2e] border border-slate-700 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-slate-300 mb-1">Primary Goals & Focus</label>
            <input
              type="text"
              value={primaryGoals}
              onChange={(e) => setPrimaryGoals(e.target.value)}
              placeholder="e.g. Ace university exams, stay consistent with workouts, master data structures"
              className="w-full bg-[#131b2e] border border-slate-700 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-2 transition-all shadow-md"
          >
            <Save className="w-4 h-4" />
            <span>Save Details</span>
          </button>
        </div>
      </form>

      {/* Target Goals Card */}
      <div className="rounded-2xl bg-[#0e1424] border border-slate-800 p-6 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-400" />
          <span>Performance & Academic Targets</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
            <label className="block text-xs font-medium text-slate-300">Daily Study Target</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={16}
                value={studyTarget}
                onChange={(e) => setStudyTarget(Number(e.target.value))}
                className="w-20 bg-[#131b2e] border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white"
              />
              <span className="text-xs text-slate-400">hours/day</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
            <label className="block text-xs font-medium text-slate-300">Weekly Workout Goal</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={7}
                value={workoutDays}
                onChange={(e) => setWorkoutDays(Number(e.target.value))}
                className="w-20 bg-[#131b2e] border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white"
              />
              <span className="text-xs text-slate-400">days/week</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
            <label className="block text-xs font-medium text-slate-300">Minimum Attendance</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={50}
                max={100}
                value={minAttendance}
                onChange={(e) => setMinAttendance(Number(e.target.value))}
                className="w-20 bg-[#131b2e] border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white"
              />
              <span className="text-xs text-slate-400">% threshold</span>
            </div>
          </div>
        </div>
      </div>

      {/* Data Export & Backup Card */}
      <div className="rounded-2xl bg-[#0e1424] border border-slate-800 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Export Personal Data</span>
          </h3>
          <p className="text-xs text-slate-400">
            Download your complete profile, schedule, tasks, workout history, and syllabus progress in JSON format.
          </p>
        </div>

        <button
          onClick={handleExportData}
          className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 hover:text-white text-xs font-semibold flex items-center gap-2 transition-all shrink-0"
        >
          <Download className="w-4 h-4 text-emerald-400" />
          <span>Export JSON</span>
        </button>
      </div>

      {/* Sign Out Card */}
      <div className="rounded-2xl bg-rose-500/5 border border-rose-500/20 p-6 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-white">Log Out of Peak Day</h3>
          <p className="text-xs text-slate-400 mt-0.5">End your session on this browser device safely.</p>
        </div>

        <button
          onClick={onLogout}
          className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-colors shadow-sm"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
};
