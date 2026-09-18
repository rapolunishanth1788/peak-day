import React, { useState, useEffect } from 'react';
import { Sparkles, X, Check, AlertTriangle, ShieldCheck, Dumbbell, Clock } from 'lucide-react';
import { api } from '../../services/api';

interface WorkoutExerciseCoachModalProps {
  exerciseName: string;
  targetMuscle?: string;
  currentWeight?: number;
  onClose: () => void;
}

export const WorkoutExerciseCoachModal: React.FC<WorkoutExerciseCoachModalProps> = ({
  exerciseName,
  targetMuscle,
  currentWeight,
  onClose,
}) => {
  const [loading, setLoading] = useState(true);
  const [coachData, setCoachData] = useState<{
    formCues: string[];
    warmupStrategy: string;
    commonMistakes: string[];
    targetMuscles: string[];
    recommendedRestSeconds: number;
    alternatives: string[];
  } | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchCoaching = async () => {
      setLoading(true);
      try {
        const data = await api.getExerciseCoaching(exerciseName, targetMuscle, currentWeight);
        if (isMounted) setCoachData(data);
      } catch (err) {
        console.error('Failed to get coaching:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchCoaching();
    return () => {
      isMounted = false;
    };
  }, [exerciseName, targetMuscle, currentWeight]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-lg rounded-3xl bg-[#0b1222] border border-purple-500/30 p-6 shadow-2xl space-y-5 relative max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30">
              <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-white">AI Biomechanics Coach</h3>
              <p className="text-[11px] text-slate-400">Technique, warmup ramp & safety cues</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Exercise Header */}
        <div className="p-4 rounded-2xl bg-[#0e1629] border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-purple-400 uppercase tracking-wider block">
              {targetMuscle || 'Core Movement'}
            </span>
            <h2 className="text-lg font-black text-white">{exerciseName}</h2>
          </div>
          {currentWeight && (
            <span className="px-3 py-1 rounded-xl bg-purple-600/20 text-purple-300 border border-purple-500/30 text-xs font-bold">
              {currentWeight} kg working
            </span>
          )}
        </div>

        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-3">
            <div className="w-8 h-8 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
            <span className="text-xs text-slate-400">Analyzing exercise kinetics with Gemini...</span>
          </div>
        ) : coachData ? (
          <div className="space-y-4 text-xs">
            {/* Form Cues */}
            <div className="space-y-2">
              <span className="font-bold text-white flex items-center gap-1.5 text-xs">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Execution & Mind-Muscle Cues</span>
              </span>
              <div className="space-y-1.5">
                {coachData.formCues?.map((cue, i) => (
                  <div key={i} className="flex items-start gap-2 p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-300">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{cue}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Warmup Ramp */}
            {coachData.warmupStrategy && (
              <div className="p-3 rounded-xl bg-blue-950/20 border border-blue-500/25 text-blue-200 space-y-1">
                <span className="font-bold block text-[11px] uppercase tracking-wider text-blue-400">
                  Optimal Warm-Up Progression
                </span>
                <p className="leading-relaxed text-slate-300">{coachData.warmupStrategy}</p>
              </div>
            )}

            {/* Common Mistakes */}
            {coachData.commonMistakes?.length > 0 && (
              <div className="space-y-1.5">
                <span className="font-bold text-white flex items-center gap-1.5 text-xs">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <span>Flaws to Avoid</span>
                </span>
                <div className="space-y-1">
                  {coachData.commonMistakes.map((m, i) => (
                    <div key={i} className="p-2 rounded-lg bg-amber-950/20 border border-amber-500/20 text-amber-200">
                      • {m}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Alternatives if equipment is taken */}
            {coachData.alternatives?.length > 0 && (
              <div className="pt-2 border-t border-slate-800">
                <span className="text-[11px] text-slate-400 block mb-1.5">Equipment busy? Try these equivalents:</span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {coachData.alternatives.map((alt, i) => (
                    <span key={i} className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 border border-slate-700 text-[11px] font-semibold">
                      {alt}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="py-8 text-center text-xs text-slate-400">
            Could not load coaching tips. Please try again.
          </div>
        )}

        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition-colors"
        >
          Got It
        </button>
      </div>
    </div>
  );
};
