import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  X, 
  CheckCircle2, 
  Circle, 
  Volume2, 
  VolumeX, 
  Flame, 
  Sparkles,
  Trophy
} from 'lucide-react';
import { Task, Subtask } from '../../types';

interface TaskPomodoroTimerProps {
  task: Task;
  onClose: () => void;
  onUpdateTask: (task: Task) => void;
}

export const TaskPomodoroTimer: React.FC<TaskPomodoroTimerProps> = ({
  task,
  onClose,
  onUpdateTask,
}) => {
  const [mode, setMode] = useState<'focus' | 'shortBreak' | 'longBreak'>('focus');
  const [timeLeft, setTimeLeft] = useState<number>(25 * 60); // 25 mins in seconds
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [completedCycles, setCompletedCycles] = useState<number>(0);

  const audioCtxRef = useRef<AudioContext | null>(null);

  // Play subtle bell chime on completion
  const playChime = () => {
    if (!soundEnabled) return;
    try {
      const ctx = audioCtxRef.current || new (window.AudioContext || (window as any).webkitAudioContext)();
      audioCtxRef.current = ctx;
      if (ctx.state === 'suspended') ctx.resume();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.3); // A5
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 1.2);
    } catch (e) {
      console.log('Audio chime error:', e);
    }
  };

  const setTimerMode = (newMode: 'focus' | 'shortBreak' | 'longBreak') => {
    setIsRunning(false);
    setMode(newMode);
    if (newMode === 'focus') setTimeLeft(25 * 60);
    else if (newMode === 'shortBreak') setTimeLeft(5 * 60);
    else setTimeLeft(15 * 60);
  };

  // Countdown effect
  useEffect(() => {
    let interval: any = null;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isRunning) {
      setIsRunning(false);
      playChime();
      if (mode === 'focus') {
        setCompletedCycles((c) => c + 1);
        setTimerMode('shortBreak');
      } else {
        setTimerMode('focus');
      }
    }
    return () => clearInterval(interval);
  }, [isRunning, timeLeft, mode]);

  const totalDuration = mode === 'focus' ? 25 * 60 : mode === 'shortBreak' ? 5 * 60 : 15 * 60;
  const progressPercent = Math.round(((totalDuration - timeLeft) / totalDuration) * 100);

  const minutes = String(Math.floor(timeLeft / 60)).padStart(2, '0');
  const seconds = String(timeLeft % 60).padStart(2, '0');

  // Toggle subtask within Pomodoro session
  const handleToggleSubtask = (subtaskId: string) => {
    const updated = (task.subtasks || []).map((st) =>
      st.id === subtaskId ? { ...st, completed: !st.completed } : st
    );
    onUpdateTask({
      ...task,
      subtasks: updated,
    });
  };

  const handleCompleteTask = () => {
    onUpdateTask({
      ...task,
      completed: true,
      completedAt: new Date().toISOString(),
      status: 'completed',
    });
    playChime();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="w-full max-w-lg rounded-3xl bg-[#0b1222] border border-blue-500/30 p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        {/* Glow */}
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Top bar */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-blue-500/20 text-cyan-300 border border-blue-500/30">
              <Flame className="w-4 h-4 animate-pulse" />
            </span>
            <div>
              <span className="text-xs font-bold text-white uppercase tracking-wider block">Deep Work Pomodoro</span>
              <span className="text-[11px] text-slate-400 truncate max-w-xs block">{task.title}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
              title={soundEnabled ? 'Chime sound active' : 'Sound muted'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-cyan-400" /> : <VolumeX className="w-4 h-4" />}
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex items-center justify-center gap-2 mt-6">
          {[
            { id: 'focus', label: 'Deep Focus (25m)' },
            { id: 'shortBreak', label: 'Short Break (5m)' },
            { id: 'longBreak', label: 'Long Break (15m)' },
          ].map((m) => (
            <button
              key={m.id}
              onClick={() => setTimerMode(m.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                mode === m.id
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 ring-1 ring-blue-400'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        {/* Circular Display */}
        <div className="flex flex-col items-center justify-center my-8">
          <div className="relative w-48 h-48 flex items-center justify-center">
            {/* SVG Ring */}
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="42"
                className="text-slate-800 stroke-current"
                strokeWidth="6"
                fill="transparent"
              />
              <circle
                cx="50"
                cy="50"
                r="42"
                className="text-cyan-400 stroke-current transition-all duration-1000 ease-linear"
                strokeWidth="6"
                strokeDasharray="264"
                strokeDashoffset={264 - (264 * progressPercent) / 100}
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>

            {/* Time Text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-4xl font-black text-white tracking-tight font-mono">
                {minutes}:{seconds}
              </span>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mt-1">
                {mode === 'focus' ? 'Focus Session' : 'Rest Window'}
              </span>
            </div>
          </div>

          {/* Cycles count */}
          <div className="mt-4 flex items-center gap-1.5 text-xs text-slate-400">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>Completed Today: <strong>{completedCycles}</strong> focus cycles</span>
          </div>
        </div>

        {/* Timer Controls */}
        <div className="flex items-center justify-center gap-4 mb-6">
          <button
            onClick={() => setTimerMode(mode)}
            className="p-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors cursor-pointer"
            title="Reset Timer"
          >
            <RotateCcw className="w-5 h-5" />
          </button>

          <button
            onClick={() => setIsRunning(!isRunning)}
            className={`px-8 py-3.5 rounded-2xl text-white font-bold text-sm flex items-center gap-2 transition-all shadow-lg hover:scale-[1.03] cursor-pointer ${
              isRunning
                ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-600/25'
                : 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 shadow-blue-600/30'
            }`}
          >
            {isRunning ? (
              <>
                <Pause className="w-5 h-5" />
                <span>Pause Session</span>
              </>
            ) : (
              <>
                <Play className="w-5 h-5" />
                <span>Start Flow</span>
              </>
            )}
          </button>
        </div>

        {/* Task Subtasks Checklist */}
        {task.subtasks && task.subtasks.length > 0 && (
          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800/90 space-y-2 mb-4">
            <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
              Active Action Steps
            </span>
            <div className="space-y-1.5 max-h-28 overflow-y-auto pr-1">
              {task.subtasks.map((st) => (
                <div
                  key={st.id}
                  onClick={() => handleToggleSubtask(st.id)}
                  className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-800/50 cursor-pointer text-xs"
                >
                  {st.completed ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <Circle className="w-4 h-4 text-slate-500 shrink-0" />
                  )}
                  <span className={`flex-1 ${st.completed ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                    {st.title}
                  </span>
                  {st.estimatedMinutes && (
                    <span className="text-[10px] text-slate-500">{st.estimatedMinutes}m</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Complete Task Button */}
        {!task.completed && (
          <button
            onClick={handleCompleteTask}
            className="w-full py-2.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Mark Task Completed</span>
          </button>
        )}
      </div>
    </div>
  );
};
