import React, { useState, useEffect } from 'react';
import { 
  Dumbbell, 
  Play, 
  Pause, 
  Square, 
  Check, 
  Plus, 
  Sparkles, 
  Flame, 
  Trophy, 
  Clock, 
  Trash2, 
  Edit3, 
  X, 
  ChevronRight, 
  RotateCcw,
  AlertCircle,
  Calculator,
  Layers,
  Bot,
  Volume2,
  Minus,
  CheckCircle2,
  Calendar
} from 'lucide-react';
import { WorkoutPlan, WorkoutLog, Exercise, DocumentAttachment, User, AICopilotAction } from '../types';
import { api, UserFullData } from '../services/api';
import { DocumentUploadZone } from '../components/DocumentUploadZone';
import { SectionAIAssistant } from '../components/SectionAIAssistant';
import { SectionPlanFlow } from '../components/SectionPlanFlow';
import { WorkoutPlateCalculator } from '../components/workout/WorkoutPlateCalculator';
import { WorkoutOneRepMaxCalculator } from '../components/workout/WorkoutOneRepMaxCalculator';
import { WorkoutExerciseCoachModal } from '../components/workout/WorkoutExerciseCoachModal';

interface WorkoutViewProps {
  user: User;
  data: UserFullData;
  workoutPlans: WorkoutPlan[];
  workoutLogs: WorkoutLog[];
  attachments?: DocumentAttachment[];
  onSaveWorkoutPlan: (plan: WorkoutPlan) => void;
  onLogWorkout: (log: Omit<WorkoutLog, 'id' | 'userId'>) => void;
  onApplyAction: (action: AICopilotAction) => void;
  onAddAttachment?: (attachment: DocumentAttachment) => void;
  onDeleteAttachment?: (id: string) => void;
}

export const WorkoutView: React.FC<WorkoutViewProps> = ({
  user,
  data,
  workoutPlans,
  workoutLogs,
  attachments = [],
  onSaveWorkoutPlan,
  onLogWorkout,
  onApplyAction,
  onAddAttachment,
  onDeleteAttachment,
}) => {
  const [activeMainTab, setActiveMainTab] = useState<'routine' | 'logs' | 'aiCoach' | 'attachments'>('routine');
  const [activePlanIndex, setActivePlanIndex] = useState(0);
  const currentPlan = workoutPlans[activePlanIndex] || workoutPlans[0];
  const [activeDayIndex, setActiveDayIndex] = useState(0);
  const currentDay = currentPlan?.days[activeDayIndex] || currentPlan?.days[0];

  // Active Workout Session State
  const [isActiveSession, setIsActiveSession] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const [restTimer, setRestTimer] = useState<number | null>(null);
  
  // Set tracking per exercise: { [exerciseId]: { sets: [{ setNumber: 1, weight: 60, reps: 10, completed: true }] } }
  const [loggedSets, setLoggedSets] = useState<Record<string, { setNumber: number; weight: number; reps: number; completed: boolean }[]>>({});

  // Summary modal
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [summaryData, setSummaryData] = useState<{ duration: number; volume: number; completedSets: number } | null>(null);

  // Peak AI Workout Assistant (Routine Generation)
  const [isAIOpen, setIsAIOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [proposedPlan, setProposedPlan] = useState<any | null>(null);

  // New Modern Workout Interactive Tools
  const [showPlateCalculator, setShowPlateCalculator] = useState(false);
  const [plateCalcInitialWeight, setPlateCalcInitialWeight] = useState<number>(60);
  const [show1RMCalculator, setShow1RMCalculator] = useState(false);
  const [coachExercise, setCoachExercise] = useState<{ name: string; targetMuscle?: string; currentWeight?: number } | null>(null);

  // New Exercise Modal
  const [showAddExerciseModal, setShowAddExerciseModal] = useState(false);
  const [newExName, setNewExName] = useState('');
  const [newExMuscle, setNewExMuscle] = useState('Chest');
  const [newExSets, setNewExSets] = useState(3);
  const [newExReps, setNewExReps] = useState(10);
  const [newExWeight, setNewExWeight] = useState(20);

  // New Split Day Modal
  const [showAddDayModal, setShowAddDayModal] = useState(false);
  const [newDayName, setNewDayName] = useState('');

  // Rest Timer Audio Chime
  const playRestChime = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    } catch (e) {
      // Audio might be blocked without user interaction
    }
  };

  // Timer effect for active workout
  useEffect(() => {
    let interval: any = null;
    if (isActiveSession && !isPaused) {
      interval = setInterval(() => {
        setSessionSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isActiveSession, isPaused]);

  // Rest timer countdown effect
  useEffect(() => {
    let timer: any = null;
    if (restTimer !== null && restTimer > 0) {
      timer = setInterval(() => {
        setRestTimer((prev) => {
          if (prev && prev <= 1) {
            playRestChime();
            return null;
          }
          return prev ? prev - 1 : null;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [restTimer]);

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Start active workout session
  const handleStartWorkout = () => {
    if (!currentDay) return;
    setIsActiveSession(true);
    setIsPaused(false);
    setSessionSeconds(0);
    
    // Initialize empty sets based on current day exercises
    const initialSets: Record<string, any[]> = {};
    currentDay.exercises?.forEach((ex) => {
      const setCount = Array.isArray(ex.sets) ? ex.sets.length : (Number(ex.sets) || 3);
      const defaultWeight = (ex as any).targetWeight || (ex as any).targetWeightKg || 20;
      const defaultReps = (ex as any).targetReps || 10;
      initialSets[ex.id] = Array.from({ length: setCount }).map((_, i) => ({
        setNumber: i + 1,
        weight: defaultWeight,
        reps: defaultReps,
        completed: false,
      }));
    });
    setLoggedSets(initialSets);
  };

  // Toggle set completion
  const handleToggleSet = (exerciseId: string, setIdx: number) => {
    const exerciseSets = [...(loggedSets[exerciseId] || [])];
    if (exerciseSets[setIdx]) {
      const willBeCompleted = !exerciseSets[setIdx].completed;
      exerciseSets[setIdx].completed = willBeCompleted;
      setLoggedSets({ ...loggedSets, [exerciseId]: exerciseSets });

      // If marked completed, trigger a 60s rest countdown
      if (willBeCompleted) {
        setRestTimer(60);
      }
    }
  };

  const handleUpdateSetValues = (exerciseId: string, setIdx: number, field: 'weight' | 'reps', val: number) => {
    const exerciseSets = [...(loggedSets[exerciseId] || [])];
    if (exerciseSets[setIdx]) {
      exerciseSets[setIdx][field] = val;
      setLoggedSets({ ...loggedSets, [exerciseId]: exerciseSets });
    }
  };

  // Add Set to Active Exercise
  const handleAddSetToExercise = (exerciseId: string) => {
    const current = loggedSets[exerciseId] || [];
    const lastSet = current[current.length - 1];
    const newSet = {
      setNumber: current.length + 1,
      weight: lastSet ? lastSet.weight : 20,
      reps: lastSet ? lastSet.reps : 10,
      completed: false,
    };
    setLoggedSets({ ...loggedSets, [exerciseId]: [...current, newSet] });
  };

  // Remove Set from Active Exercise
  const handleRemoveSetFromExercise = (exerciseId: string, setIdx: number) => {
    const current = loggedSets[exerciseId] || [];
    if (current.length <= 1) return;
    const updated = current.filter((_, i) => i !== setIdx).map((s, i) => ({ ...s, setNumber: i + 1 }));
    setLoggedSets({ ...loggedSets, [exerciseId]: updated });
  };

  // Finish Workout
  const handleFinishWorkout = () => {
    let totalVolume = 0;
    let completedSetsCount = 0;

    Object.values(loggedSets).forEach((sets) => {
      sets.forEach((s) => {
        if (s.completed) {
          totalVolume += (s.weight || 0) * (s.reps || 0);
          completedSetsCount++;
        }
      });
    });

    const summary = {
      duration: sessionSeconds,
      volume: totalVolume,
      completedSets: completedSetsCount,
    };

    setSummaryData(summary);
    setShowSummaryModal(true);

    // Save log to backend
    onLogWorkout({
      date: new Date().toISOString().split('T')[0],
      dayName: currentDay?.dayName || 'Workout',
      durationMinutes: Math.round(sessionSeconds / 60) || 1,
      totalVolumeKg: totalVolume,
      completedSets: completedSetsCount,
      notes: `Completed ${completedSetsCount} sets in ${currentDay?.dayName}`,
    });

    setIsActiveSession(false);
  };

  const handleGenerateAIWorkout = async () => {
    if (!aiPrompt.trim()) return;
    setAiLoading(true);
    try {
      const res = await api.askWorkoutAI(aiPrompt, workoutPlans);
      setProposedPlan(res);
    } catch (err) {
      console.error(err);
    } finally {
      setAiLoading(false);
    }
  };

  // Handle Add Custom Exercise to Current Day Routine
  const handleAddCustomExercise = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExName.trim() || !currentPlan || !currentDay) return;

    const newEx: Exercise = {
      id: `ex-${Date.now()}`,
      name: newExName.trim(),
      targetMuscle: newExMuscle,
      sets: Array.from({ length: newExSets }).map((_, i) => ({
        setNumber: i + 1,
        targetReps: newExReps,
        targetWeightKg: newExWeight,
      })),
    } as any;

    const updatedDays = currentPlan.days.map((d, idx) => {
      if (idx === activeDayIndex) {
        return {
          ...d,
          exercises: [...(d.exercises || []), newEx],
        };
      }
      return d;
    });

    onSaveWorkoutPlan({
      ...currentPlan,
      days: updatedDays,
    });

    setNewExName('');
    setShowAddExerciseModal(false);
  };

  // Handle Delete Exercise
  const handleDeleteExercise = (exerciseId: string) => {
    if (!currentPlan || !currentDay) return;
    const updatedDays = currentPlan.days.map((d, idx) => {
      if (idx === activeDayIndex) {
        return {
          ...d,
          exercises: d.exercises?.filter((ex) => ex.id !== exerciseId) || [],
        };
      }
      return d;
    });

    onSaveWorkoutPlan({
      ...currentPlan,
      days: updatedDays,
    });
  };

  // Handle Add New Split Day
  const handleAddSplitDay = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDayName.trim() || !currentPlan) return;

    const newDay = {
      id: `day-${Date.now()}`,
      dayName: newDayName.trim(),
      exercises: [],
    };

    const updatedPlan = {
      ...currentPlan,
      days: [...(currentPlan.days || []), newDay],
    };

    onSaveWorkoutPlan(updatedPlan);
    setActiveDayIndex(updatedPlan.days.length - 1);
    setNewDayName('');
    setShowAddDayModal(false);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header & AI Assistant Callout */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <Dumbbell className="w-7 h-7 text-purple-400" />
            <span>Workout Tracker & Coaching</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Build athletic discipline with custom splits, active rest timers, plate calculators, and AI form analysis.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Quick Tools Bar */}
          <button
            onClick={() => {
              setPlateCalcInitialWeight(60);
              setShowPlateCalculator(true);
            }}
            className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700/80 hover:border-purple-500/60 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
            title="Olympic Plate Barbell Calculator"
          >
            <Layers className="w-3.5 h-3.5 text-purple-400" />
            <span>Plate Calc</span>
          </button>

          <button
            onClick={() => setShow1RMCalculator(true)}
            className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700/80 hover:border-purple-500/60 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
            title="One-Rep Max Estimator"
          >
            <Calculator className="w-3.5 h-3.5 text-cyan-400" />
            <span>1RM Estimator</span>
          </button>

          <SectionPlanFlow
            section="workout"
            user={user}
            data={data}
            onApplyAction={onApplyAction}
            onAddAttachment={onAddAttachment}
            onOpenFullAI={() => setActiveMainTab('aiCoach')}
          />
        </div>
      </div>

      {/* Sub navigation tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3 overflow-x-auto">
        <button
          onClick={() => setActiveMainTab('routine')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer ${
            activeMainTab === 'routine'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Dumbbell className="w-4 h-4" />
          <span>Routine Split</span>
        </button>

        <button
          onClick={() => setActiveMainTab('logs')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer ${
            activeMainTab === 'logs'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Trophy className="w-4 h-4" />
          <span>Workout Logs ({workoutLogs.length})</span>
        </button>

        <button
          onClick={() => setActiveMainTab('aiCoach')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer ${
            activeMainTab === 'aiCoach'
              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-600/20'
              : 'text-purple-300 hover:text-white bg-purple-500/10 border border-purple-500/20 hover:bg-purple-500/20'
          }`}
        >
          <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
          <span>AI Workout Coach</span>
          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-400/20 text-purple-200">
            Autonomous
          </span>
        </button>

        <button
          onClick={() => setActiveMainTab('attachments')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer ${
            activeMainTab === 'attachments'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <span>Routine Docs ({attachments.length})</span>
        </button>
      </div>

      {/* When AI Coach tab is active */}
      {activeMainTab === 'aiCoach' && (
        <div className="animate-in fade-in duration-200">
          <SectionAIAssistant
            section="workout"
            user={user}
            data={data}
            onApplyAction={onApplyAction}
          />
        </div>
      )}

      {/* Routine Split & Live Session Tab */}
      {activeMainTab === 'routine' && (
        <div className="space-y-6">

      {/* Active Workout Session Floating Banner if Active */}
      {isActiveSession && (
        <div className="sticky top-16 z-30 p-4 rounded-2xl bg-gradient-to-r from-purple-950 via-indigo-950 to-[#0e1424] border-2 border-purple-500/50 shadow-2xl flex flex-wrap items-center justify-between gap-4 animate-in slide-in-from-top duration-200">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-400">
              <Dumbbell className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="text-xs font-semibold text-purple-300 uppercase tracking-wider">
                Live Workout • {currentDay?.dayName}
              </div>
              <div className="text-2xl font-black text-white font-mono flex items-center gap-3">
                <span>{formatTime(sessionSeconds)}</span>
                {restTimer !== null && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-sans px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex items-center gap-1 font-bold">
                      <Clock className="w-3 h-3 text-cyan-400" />
                      <span>Rest: {restTimer}s</span>
                    </span>
                    <button
                      onClick={() => setRestTimer((prev) => (prev ? prev + 15 : 15))}
                      className="px-1.5 py-0.5 rounded text-[10px] bg-cyan-900/50 text-cyan-200 border border-cyan-700/50 cursor-pointer"
                    >
                      +15s
                    </button>
                    <button
                      onClick={() => setRestTimer(null)}
                      className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-400 cursor-pointer"
                    >
                      Skip
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPaused(!isPaused)}
              className="p-2.5 rounded-xl bg-slate-800 text-slate-200 hover:text-white cursor-pointer"
              title={isPaused ? 'Resume' : 'Pause'}
            >
              {isPaused ? <Play className="w-5 h-5 text-emerald-400" /> : <Pause className="w-5 h-5" />}
            </button>
            <button
              onClick={handleFinishWorkout}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs sm:text-sm font-bold shadow-lg flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Finish Workout</span>
            </button>
          </div>
        </div>
      )}

      {/* Routine & Day Selector */}
      {currentPlan && (
        <div className="p-4 rounded-2xl bg-[#0e1424] border border-slate-800/90 space-y-4">
          {/* Day Split Tabs */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {currentPlan?.days?.map((day, idx) => (
                <button
                  key={day.id}
                  onClick={() => {
                    if (!isActiveSession) setActiveDayIndex(idx);
                  }}
                  disabled={isActiveSession}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
                    activeDayIndex === idx
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  } disabled:opacity-50`}
                >
                  {day.dayName}
                </button>
              ))}

              {!isActiveSession && (
                <button
                  onClick={() => setShowAddDayModal(true)}
                  className="px-3 py-1.5 rounded-xl bg-slate-900/60 border border-dashed border-slate-700 hover:border-purple-500 text-slate-400 hover:text-white text-xs font-medium flex items-center gap-1 transition-all cursor-pointer whitespace-nowrap"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Split Day</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              {!isActiveSession && (
                <button
                  onClick={() => setShowAddExerciseModal(true)}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-purple-400" />
                  <span>Add Exercise</span>
                </button>
              )}

              {!isActiveSession && currentDay && currentDay.exercises && currentDay.exercises.length > 0 ? (
                <button
                  onClick={handleStartWorkout}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs sm:text-sm font-bold shadow-md shadow-purple-600/20 flex items-center gap-2 transition-all hover:scale-[1.02] cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>Start Workout</span>
                </button>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* Exercises Section */}
      <div className="rounded-2xl bg-[#0e1424] border border-slate-800/90 p-5 min-h-[380px] space-y-4">
        {currentPlan ? (
          <>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white">
                  {currentDay?.dayName || 'Workout Routine'}
                </h3>
                <span className="text-xs text-slate-400">
                  {currentDay?.exercises?.length || 0} exercises planned
                </span>
              </div>

              <div className="text-xs text-purple-400 font-medium">
                {isActiveSession ? 'Tap checkmark to log each set & start rest timer' : 'Review routine'}
              </div>
            </div>

            {currentDay && currentDay.exercises && currentDay.exercises.length > 0 ? (
          <div className="space-y-4">
            {currentDay.exercises.map((exercise) => {
              const activeExerciseSets = loggedSets[exercise.id] || [];

              return (
                <div
                  key={exercise.id}
                  className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all space-y-3"
                >
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <h4 className="text-sm font-bold text-white">{exercise.name}</h4>
                      <div className="text-xs text-purple-400 flex items-center gap-2 mt-0.5">
                        <span className="px-2 py-0.5 rounded bg-purple-500/15 border border-purple-500/30">
                          {exercise.targetMuscle}
                        </span>
                        <span className="text-slate-500">
                          Target: {Array.isArray(exercise.sets) ? exercise.sets.length : (exercise.sets || 3)} sets × {(exercise as any).targetReps || 10} reps @ {(exercise as any).targetWeight || (exercise as any).targetWeightKg || 0}kg
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {/* AI Biomechanics Coach Button */}
                      <button
                        onClick={() => {
                          const currentW = activeExerciseSets[0]?.weight || (exercise as any).targetWeight || (exercise as any).targetWeightKg || 60;
                          setCoachExercise({
                            name: exercise.name,
                            targetMuscle: exercise.targetMuscle,
                            currentWeight: currentW,
                          });
                        }}
                        className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-purple-600/20 to-indigo-600/20 hover:from-purple-600/30 hover:to-indigo-600/30 text-purple-300 border border-purple-500/30 text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
                        title="Get AI Biomechanics & Coaching Tips"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                        <span>AI Coach</span>
                      </button>

                      {/* Plate Calculator Shortcut */}
                      <button
                        onClick={() => {
                          const w = activeExerciseSets[0]?.weight || (exercise as any).targetWeight || (exercise as any).targetWeightKg || 60;
                          setPlateCalcInitialWeight(w);
                          setShowPlateCalculator(true);
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
                        title="Calculate Barbell Plates"
                      >
                        <Layers className="w-3.5 h-3.5 text-purple-400" />
                      </button>

                      {!isActiveSession && (
                        <button
                          onClick={() => handleDeleteExercise(exercise.id)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 cursor-pointer"
                          title="Remove from routine"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Active Set Logging Table */}
                  {isActiveSession ? (
                    <div className="space-y-2 pt-1">
                      <div className="grid grid-cols-12 gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider px-2">
                        <span className="col-span-2">Set</span>
                        <span className="col-span-4">Weight (kg)</span>
                        <span className="col-span-4">Reps</span>
                        <span className="col-span-2 text-right">Log</span>
                      </div>

                      {activeExerciseSets.map((set, sIdx) => (
                        <div
                          key={sIdx}
                          className={`grid grid-cols-12 gap-2 items-center p-2 rounded-lg border transition-all ${
                            set.completed
                              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                              : 'bg-slate-800/60 border-slate-700/60 text-slate-200'
                          }`}
                        >
                          <div className="col-span-2 flex items-center gap-1">
                            <span className="font-bold text-xs pl-1">#{set.setNumber}</span>
                            {activeExerciseSets.length > 1 && !set.completed && (
                              <button
                                onClick={() => handleRemoveSetFromExercise(exercise.id, sIdx)}
                                className="text-slate-500 hover:text-rose-400 p-0.5 text-[10px]"
                                title="Remove set"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                          <div className="col-span-4 flex items-center gap-1">
                            <input
                              type="number"
                              value={set.weight}
                              onChange={(e) =>
                                handleUpdateSetValues(exercise.id, sIdx, 'weight', parseFloat(e.target.value) || 0)
                              }
                              className="w-full bg-[#131b2e] border border-slate-700 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-purple-500"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setPlateCalcInitialWeight(set.weight);
                                setShowPlateCalculator(true);
                              }}
                              className="text-slate-500 hover:text-purple-400 p-1 shrink-0 cursor-pointer"
                              title="Calculate barbell plates for this weight"
                            >
                              <Layers className="w-3 h-3" />
                            </button>
                          </div>
                          <div className="col-span-4">
                            <input
                              type="number"
                              value={set.reps}
                              onChange={(e) =>
                                handleUpdateSetValues(exercise.id, sIdx, 'reps', parseInt(e.target.value) || 0)
                              }
                              className="w-full bg-[#131b2e] border border-slate-700 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-purple-500"
                            />
                          </div>
                          <div className="col-span-2 text-right">
                            <button
                              type="button"
                              onClick={() => handleToggleSet(exercise.id, sIdx)}
                              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                set.completed
                                  ? 'bg-emerald-500 text-white'
                                  : 'bg-slate-700 text-slate-400 hover:text-white'
                              }`}
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}

                      {/* Add Set Button */}
                      <div className="pt-1 flex justify-start">
                        <button
                          type="button"
                          onClick={() => handleAddSetToExercise(exercise.id)}
                          className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <Plus className="w-3 h-3 text-purple-400" />
                          <span>Add Set</span>
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-12 text-center text-xs text-slate-500 space-y-3">
            <p>No exercises configured for this split day yet.</p>
            <button
              onClick={() => setShowAddExerciseModal(true)}
              className="px-4 py-2 rounded-xl bg-purple-600/30 hover:bg-purple-600/40 text-purple-300 border border-purple-500/30 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add First Exercise</span>
            </button>
          </div>
        )}
          </>
        ) : (
          <div className="py-20 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center mx-auto">
              <Dumbbell className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">No Workout Routines Added</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                You haven't added any workout splits or routines yet. Ask the AI Workout Coach to generate one tailored to your schedule or equipment.
              </p>
            </div>
            <button
              onClick={() => setIsAIOpen(true)}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-lg shadow-purple-600/20 inline-flex items-center gap-2 transition-all hover:scale-[1.02] cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Create Workout Split with AI</span>
            </button>
          </div>
        )}
      </div>

      {/* Safety & Medical Disclaimer Requirement */}
      <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 text-[11px] text-slate-400 flex items-start gap-2.5">
        <AlertCircle className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong>Peak Health Guidance:</strong> AI workout suggestions are provided for general student fitness and athletic conditioning. Prioritize proper biomechanics, warm up thoroughly, and consult a certified trainer or medical professional before attempting heavy maximal loads.
        </p>
      </div>
        </div>
      )}

      {/* Workout Logs Tab */}
      {activeMainTab === 'logs' && (
        <div className="p-5 rounded-2xl bg-[#0e1424] border border-slate-800/90 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-base font-bold text-white">Workout Session History</h3>
              <p className="text-xs text-slate-400">Past logged sessions and training volume history.</p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-500/15 border border-purple-500/30 text-purple-300">
              {workoutLogs.length} Total Logs
            </span>
          </div>

          {workoutLogs.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500 space-y-2">
              <Trophy className="w-8 h-8 text-slate-600 mx-auto" />
              <p>No workout sessions logged yet. Complete a workout or ask the AI Coach to log one for you!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {workoutLogs.map((log) => (
                <div key={log.id} className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between flex-wrap gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">{log.dayName}</span>
                      <span className="text-xs text-slate-500">• {log.date}</span>
                    </div>
                    {log.notes && <p className="text-xs text-slate-400">{log.notes}</p>}
                  </div>
                  <div className="flex items-center gap-4 text-xs">
                    <div className="text-right">
                      <div className="text-slate-500 text-[10px]">Duration</div>
                      <div className="font-bold text-white">{log.durationMinutes} mins</div>
                    </div>
                    {log.totalVolumeKg !== undefined && (
                      <div className="text-right">
                        <div className="text-slate-500 text-[10px]">Volume</div>
                        <div className="font-bold text-purple-400">{log.totalVolumeKg} kg</div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Workout Attachments Tab */}
      {activeMainTab === 'attachments' && (
        <DocumentUploadZone
          section="workout"
          sectionTitle="Workout Routine & Nutrition Plans"
          attachments={attachments}
          onAddAttachment={onAddAttachment || (() => {})}
          onDeleteAttachment={onDeleteAttachment || (() => {})}
        />
      )}

      {/* Workout Summary Modal */}
      {showSummaryModal && summaryData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-[#0e1424] border border-purple-500/40 p-6 shadow-2xl text-center space-y-4 animate-in zoom-in-95 duration-150">
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white mx-auto shadow-lg shadow-purple-600/30">
              <Trophy className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-extrabold text-white">Workout Completed!</h3>
              <p className="text-xs text-slate-400">Great discipline today. Your progress has been securely logged.</p>
            </div>

            <div className="grid grid-cols-3 gap-2 py-2">
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <div className="text-[10px] text-slate-500 font-medium">Duration</div>
                <div className="text-base font-bold text-white font-mono mt-0.5">
                  {formatTime(summaryData.duration)}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <div className="text-[10px] text-slate-500 font-medium">Total Volume</div>
                <div className="text-base font-bold text-purple-400 mt-0.5">
                  {summaryData.volume} kg
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <div className="text-[10px] text-slate-500 font-medium">Sets Done</div>
                <div className="text-base font-bold text-emerald-400 mt-0.5">
                  {summaryData.completedSets}
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowSummaryModal(false)}
              className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md cursor-pointer"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* Peak AI Workout Coach Modal */}
      {isAIOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-[#0e1424] border border-purple-500/30 p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-400" />
                <h3 className="text-base font-bold text-white">Peak AI Workout Coach</h3>
              </div>
              <button
                onClick={() => {
                  setIsAIOpen(false);
                  setProposedPlan(null);
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {!proposedPlan ? (
              <div className="space-y-4">
                <p className="text-xs text-slate-300 leading-relaxed">
                  Ask Peak AI to design a tailored gym split, home workout, or athletic endurance routine customized to your available equipment and days.
                </p>

                <textarea
                  rows={3}
                  placeholder="e.g. Create a 4-day Push-Pull-Legs split for hypertrophy with dumbbells and bench"
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  className="w-full bg-[#131b2e] border border-slate-700/80 rounded-xl p-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />

                <div className="flex flex-wrap gap-2">
                  {[
                    'Design a 4-day Upper/Lower split',
                    'Home dumbbell workout for busy college students',
                    '3-day full body strength routine',
                  ].map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => setAiPrompt(chip)}
                      className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-800/80 text-purple-300 hover:bg-slate-700 border border-slate-700/60 cursor-pointer"
                    >
                      {chip}
                    </button>
                  ))}
                </div>

                <div className="flex justify-end gap-2 pt-3">
                  <button
                    type="button"
                    onClick={() => setIsAIOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={aiLoading || !aiPrompt.trim()}
                    onClick={handleGenerateAIWorkout}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 shadow-md flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                  >
                    {aiLoading ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Generate Split</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs text-purple-300">
                  <strong>{proposedPlan.name}</strong>: {proposedPlan.description}
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto">
                  {proposedPlan.days?.map((d: any, i: number) => (
                    <div key={i} className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs">
                      <div className="font-bold text-white">{d.dayName}</div>
                      <div className="text-slate-400 text-[11px] mt-0.5">
                        {d.exercises?.map((e: any) => e.name).join(', ')}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                  <button
                    onClick={() => setProposedPlan(null)}
                    className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-400 bg-slate-800 cursor-pointer"
                  >
                    Discard
                  </button>
                  <button
                    onClick={() => {
                      onSaveWorkoutPlan({
                        ...proposedPlan,
                        id: `plan-${Date.now()}`,
                        userId: currentPlan?.userId || '',
                      });
                      setIsAIOpen(false);
                      setProposedPlan(null);
                    }}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>Apply Workout Split</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Olympic Plate Calculator Modal */}
      {showPlateCalculator && (
        <WorkoutPlateCalculator
          initialWeight={plateCalcInitialWeight}
          onClose={() => setShowPlateCalculator(false)}
        />
      )}

      {/* One-Rep Max Calculator Modal */}
      {show1RMCalculator && (
        <WorkoutOneRepMaxCalculator
          onClose={() => setShow1RMCalculator(false)}
        />
      )}

      {/* AI Biomechanics Coach Modal */}
      {coachExercise && (
        <WorkoutExerciseCoachModal
          exerciseName={coachExercise.name}
          targetMuscle={coachExercise.targetMuscle}
          currentWeight={coachExercise.currentWeight}
          onClose={() => setCoachExercise(null)}
        />
      )}

      {/* Add Custom Exercise Modal */}
      {showAddExerciseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-3xl bg-[#0b1222] border border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Dumbbell className="w-4 h-4 text-purple-400" />
                <span>Add Exercise to {currentDay?.dayName}</span>
              </h3>
              <button
                onClick={() => setShowAddExerciseModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddCustomExercise} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Exercise Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Incline Dumbbell Press"
                  value={newExName}
                  onChange={(e) => setNewExName(e.target.value)}
                  className="w-full bg-[#131b2e] border border-slate-700/80 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Target Muscle Group</label>
                <select
                  value={newExMuscle}
                  onChange={(e) => setNewExMuscle(e.target.value)}
                  className="w-full bg-[#131b2e] border border-slate-700/80 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                >
                  {['Chest', 'Back', 'Shoulders', 'Quads', 'Hamstrings', 'Glutes', 'Biceps', 'Triceps', 'Core / Abs', 'Cardio'].map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Sets</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={newExSets}
                    onChange={(e) => setNewExSets(parseInt(e.target.value) || 3)}
                    className="w-full bg-[#131b2e] border border-slate-700/80 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Target Reps</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={newExReps}
                    onChange={(e) => setNewExReps(parseInt(e.target.value) || 10)}
                    className="w-full bg-[#131b2e] border border-slate-700/80 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Weight (kg)</label>
                  <input
                    type="number"
                    min={0}
                    step={0.5}
                    value={newExWeight}
                    onChange={(e) => setNewExWeight(parseFloat(e.target.value) || 0)}
                    className="w-full bg-[#131b2e] border border-slate-700/80 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddExerciseModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 shadow-md shadow-purple-600/20 cursor-pointer"
                >
                  Add Exercise
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Split Day Modal */}
      {showAddDayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-3xl bg-[#0b1222] border border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-purple-400" />
                <span>Add Split Day</span>
              </h3>
              <button
                onClick={() => setShowAddDayModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddSplitDay} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Day Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Leg Day / Hypertrophy or Friday Arms & Abs"
                  value={newDayName}
                  onChange={(e) => setNewDayName(e.target.value)}
                  className="w-full bg-[#131b2e] border border-slate-700/80 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddDayModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 shadow-md shadow-purple-600/20 cursor-pointer"
                >
                  Create Day Split
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
