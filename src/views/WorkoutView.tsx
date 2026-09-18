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
  AlertCircle
} from 'lucide-react';
import { WorkoutPlan, WorkoutLog, Exercise, DocumentAttachment, User, AICopilotAction } from '../types';
import { api, UserFullData } from '../services/api';
import { DocumentUploadZone } from '../components/DocumentUploadZone';
import { SectionAIAssistant } from '../components/SectionAIAssistant';

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

  // Peak AI Workout Assistant
  const [isAIOpen, setIsAIOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [proposedPlan, setProposedPlan] = useState<any | null>(null);

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
        setRestTimer((prev) => (prev && prev > 1 ? prev - 1 : null));
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
    currentDay.exercises.forEach((ex) => {
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

  return (
    <div className="space-y-6 pb-12">
      {/* Header & AI Assistant Callout */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <Dumbbell className="w-7 h-7 text-purple-400" />
            <span>Workout Tracker</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Build athletic discipline with custom splits, active rest timers, and volume metrics.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setActiveMainTab('aiCoach')}
            className="px-3.5 py-2 rounded-xl bg-purple-600/20 border border-purple-500/40 hover:border-purple-400 text-purple-300 text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-lg shadow-purple-500/10 transition-all hover:scale-[1.02]"
          >
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span>AI Workout Coach</span>
          </button>
        </div>
      </div>

      {/* Sub navigation tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3 overflow-x-auto">
        <button
          onClick={() => setActiveMainTab('routine')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 ${
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
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 ${
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
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 ${
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
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 ${
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
                  <span className="text-xs font-sans px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex items-center gap-1 font-normal">
                    <Clock className="w-3 h-3" />
                    <span>Rest: {restTimer}s</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPaused(!isPaused)}
              className="p-2.5 rounded-xl bg-slate-800 text-slate-200 hover:text-white"
              title={isPaused ? 'Resume' : 'Pause'}
            >
              {isPaused ? <Play className="w-5 h-5 text-emerald-400" /> : <Pause className="w-5 h-5" />}
            </button>
            <button
              onClick={handleFinishWorkout}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs sm:text-sm font-bold shadow-lg flex items-center gap-1.5"
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
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                    activeDayIndex === idx
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  } disabled:opacity-50`}
                >
                  {day.dayName}
                </button>
              ))}
            </div>

            {!isActiveSession && currentDay && currentDay.exercises && currentDay.exercises.length > 0 ? (
              <button
                onClick={handleStartWorkout}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs sm:text-sm font-bold shadow-md shadow-purple-600/20 flex items-center gap-2 transition-all hover:scale-[1.02]"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Start Workout</span>
              </button>
            ) : null}
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
                  <div className="flex items-center justify-between">
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
                          <span className="col-span-2 font-bold text-xs pl-1">#{set.setNumber}</span>
                          <div className="col-span-4">
                            <input
                              type="number"
                              value={set.weight}
                              onChange={(e) =>
                                handleUpdateSetValues(exercise.id, sIdx, 'weight', parseFloat(e.target.value) || 0)
                              }
                              className="w-full bg-[#131b2e] border border-slate-700 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-purple-500"
                            />
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
                              className={`p-1.5 rounded-lg transition-colors ${
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
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-12 text-center text-xs text-slate-500">
            No exercises configured for this split day yet.
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
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-lg shadow-purple-600/20 inline-flex items-center gap-2 transition-all hover:scale-[1.02]"
            >
              <Sparkles className="w-4 h-4" />
              <span>Create Workout Split with AI</span>
            </button>
          </div>
        )}
      </div>

      {/* Safety & Medical Disclaimer Requirement (Section 12) */}
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
              className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md"
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
                className="p-1 rounded-lg text-slate-400 hover:text-white"
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
                      className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-800/80 text-purple-300 hover:bg-slate-700 border border-slate-700/60"
                    >
                      {chip}
                    </button>
                  ))}
                </div>

                <div className="flex justify-end gap-2 pt-3">
                  <button
                    type="button"
                    onClick={() => setIsAIOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={aiLoading || !aiPrompt.trim()}
                    onClick={handleGenerateAIWorkout}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 shadow-md flex items-center gap-1.5 disabled:opacity-50"
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
                    className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-400 bg-slate-800"
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
                    className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 flex items-center gap-1.5"
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

      {/* Upload PNG/PDF Workout Routine Section */}
      <DocumentUploadZone
        section="workout"
        sectionTitle="Workout Routine & Nutrition"
        attachments={attachments}
        onAddAttachment={onAddAttachment || (() => {})}
        onDeleteAttachment={onDeleteAttachment || (() => {})}
      />
    </div>
  );
};
