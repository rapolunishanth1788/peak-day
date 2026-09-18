import React, { useState, useEffect } from 'react';
import { Flame, Wind, Play, Pause, RotateCcw, Check, X, ArrowRight, Activity } from 'lucide-react';

interface WorkoutWarmupCoolDownModalProps {
  mode: 'warmup' | 'cooldown';
  onClose: () => void;
}

interface RoutineStep {
  name: string;
  durationSeconds: number;
  muscleFocus: string;
  instructions: string;
}

const WARMUP_STEPS: RoutineStep[] = [
  {
    name: 'Neck & Shoulder Rolls',
    durationSeconds: 30,
    muscleFocus: 'Cervical spine & Trapezius',
    instructions: 'Slow controlled rotations. 15s clockwise, then 15s counter-clockwise to release upper-body desk tension.',
  },
  {
    name: 'Arm Circles & Hugs',
    durationSeconds: 30,
    muscleFocus: 'Rotator cuff & Chest',
    instructions: 'Progressively larger forward circles for 15s, then backward circles and horizontal dynamic hugs.',
  },
  {
    name: 'Torso Twists & Reach',
    durationSeconds: 40,
    muscleFocus: 'Thoracic spine & Obliques',
    instructions: 'Rotate through the mid-back while pivoting on the back foot. Keep hips stable and core lightly braced.',
  },
  {
    name: 'Cat-Cow Spinal Flow',
    durationSeconds: 45,
    muscleFocus: 'Full spine mobilization',
    instructions: 'Inhale while arching back into Cow, exhale deeply while curling spine into Cat. Synchronize with breath.',
  },
  {
    name: 'Deep Bodyweight Squats & Hip Pries',
    durationSeconds: 45,
    muscleFocus: 'Quads, Adductors & Hip capsules',
    instructions: 'Descend to full depth, pry knees outward with elbows for 2 seconds, then drive through mid-foot to stand.',
  },
  {
    name: 'World’s Greatest Stretch',
    durationSeconds: 60,
    muscleFocus: 'Hip flexors, Hamstrings & T-Spine',
    instructions: 'Step into a deep lunge, place hand inside front foot, rotate opposite arm toward ceiling. Switch sides at 30s.',
  },
  {
    name: 'Light Jumping Jacks / High Knees',
    durationSeconds: 50,
    muscleFocus: 'Cardiovascular elevation & CNS activation',
    instructions: 'Light bouncing to elevate heart rate, increase muscle temperature, and prepare the central nervous system.',
  },
];

const COOLDOWN_STEPS: RoutineStep[] = [
  {
    name: 'Doorway Pec / Chest Opener',
    durationSeconds: 45,
    muscleFocus: 'Pectorals & Anterior Deltoids',
    instructions: 'Forearms on doorframe or rack at 90 degrees, gently lean forward. Relieves heavy pressing fatigue.',
  },
  {
    name: 'Dead Hang or Lat Stretch',
    durationSeconds: 45,
    muscleFocus: 'Lats & Spinal decompression',
    instructions: 'Hang lightly from a pull-up bar with feet skimming floor, or grab an upright pole and sit back to lengthen lats.',
  },
  {
    name: 'Standing Quad & Hip Flexor Stretch',
    durationSeconds: 50,
    muscleFocus: 'Quadriceps & Psoas',
    instructions: 'Pull heel to glute, keep knees touching and tuck pelvis forward. 25s per leg.',
  },
  {
    name: 'Seated Hamstring & Calf Reach',
    durationSeconds: 50,
    muscleFocus: 'Posterior chain',
    instructions: 'Hinge forward from hips with a flat back towards toes. Exhale into the gentle tension.',
  },
  {
    name: 'Child’s Pose into Cobra',
    durationSeconds: 60,
    muscleFocus: 'Lower back, Glutes & Abdominals',
    instructions: 'Sink hips back onto heels, reach fingertips forward. Hold for 30s, then gently press hips forward into gentle Cobra.',
  },
  {
    name: 'Parasympathetic Box Breathing (4-4-4-4)',
    durationSeconds: 60,
    muscleFocus: 'Nervous system recovery & Cortisol reduction',
    instructions: 'Inhale for 4s, hold for 4s, exhale slowly for 4s, hold empty for 4s. Shuts down fight-or-flight response.',
  },
];

export const WorkoutWarmupCoolDownModal: React.FC<WorkoutWarmupCoolDownModalProps> = ({
  mode,
  onClose,
}) => {
  const steps = mode === 'warmup' ? WARMUP_STEPS : COOLDOWN_STEPS;
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const currentStep = steps[currentStepIndex];

  const [secondsRemaining, setSecondsRemaining] = useState(currentStep.durationSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  // Update timer on step switch
  useEffect(() => {
    setSecondsRemaining(steps[currentStepIndex].durationSeconds);
    setIsRunning(false);
  }, [currentStepIndex, steps]);

  // Audio beep
  const playStepBeep = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(659.25, ctx.currentTime); // E5
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch (e) {
      // Audio might require user interaction
    }
  };

  // Timer countdown
  useEffect(() => {
    let interval: any = null;
    if (isRunning && secondsRemaining > 0) {
      interval = setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            playStepBeep();
            if (!completedSteps.includes(currentStepIndex)) {
              setCompletedSteps((c) => [...c, currentStepIndex]);
            }
            if (currentStepIndex < steps.length - 1) {
              setCurrentStepIndex((idx) => idx + 1);
            } else {
              setIsRunning(false);
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, secondsRemaining, currentStepIndex, steps.length, completedSteps]);

  const handleNext = () => {
    if (!completedSteps.includes(currentStepIndex)) {
      setCompletedSteps((c) => [...c, currentStepIndex]);
    }
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex((i) => i + 1);
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((i) => i - 1);
    }
  };

  const progressPct = Math.round(((completedSteps.length) / steps.length) * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-lg rounded-3xl bg-[#0b1222] border border-purple-500/30 p-6 shadow-2xl space-y-5 relative">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <span
              className={`p-2 rounded-xl ${
                mode === 'warmup'
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  : 'bg-teal-500/20 text-teal-400 border border-teal-500/30'
              }`}
            >
              {mode === 'warmup' ? <Flame className="w-5 h-5" /> : <Wind className="w-5 h-5" />}
            </span>
            <div>
              <h3 className="text-base font-bold text-white">
                {mode === 'warmup' ? '5-Minute Dynamic Warm-Up' : 'Post-Workout Cool-Down & Recovery'}
              </h3>
              <p className="text-[11px] text-slate-400">
                {mode === 'warmup'
                  ? 'Joint lubrication, CNS prep, and injury prevention'
                  : 'Spinal decompression, lactic flush, and autonomic recovery'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-[11px] text-slate-400">
            <span>
              Step {currentStepIndex + 1} of {steps.length}
            </span>
            <span>{progressPct}% Completed</span>
          </div>
          <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                mode === 'warmup' ? 'bg-amber-500' : 'bg-teal-500'
              }`}
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* Active Step Card */}
        <div className="p-5 rounded-2xl bg-[#0e1629] border border-slate-800/90 space-y-4 text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/15 border border-purple-500/30 text-purple-300">
            <Activity className="w-3.5 h-3.5" />
            <span>Target: {currentStep.muscleFocus}</span>
          </div>

          <div>
            <h4 className="text-xl font-extrabold text-white">{currentStep.name}</h4>
            <p className="text-xs text-slate-300 leading-relaxed max-w-sm mx-auto mt-2">
              {currentStep.instructions}
            </p>
          </div>

          {/* Interactive Countdown Timer */}
          <div className="flex flex-col items-center justify-center pt-2">
            <div className="text-5xl font-mono font-black text-white tracking-wider">
              00:{secondsRemaining.toString().padStart(2, '0')}
            </div>
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mt-1">
              Seconds Remaining
            </span>
          </div>

          {/* Control Buttons */}
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => setSecondsRemaining(currentStep.durationSeconds)}
              className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
              title="Reset Timer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => setIsRunning(!isRunning)}
              className={`px-5 py-2 rounded-xl text-xs font-bold text-white flex items-center gap-2 cursor-pointer shadow-md transition-all ${
                isRunning
                  ? 'bg-amber-600 hover:bg-amber-500'
                  : 'bg-purple-600 hover:bg-purple-500'
              }`}
            >
              {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
              <span>{isRunning ? 'Pause' : 'Start Timer'}</span>
            </button>

            <button
              type="button"
              onClick={handleNext}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1 cursor-pointer"
            >
              <span>Next</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Step Selector Horizontal List */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {steps.map((st, idx) => {
            const isDone = completedSteps.includes(idx);
            const isCurrent = idx === currentStepIndex;

            return (
              <button
                key={`routine-step-${mode}-${idx}`}
                type="button"
                onClick={() => setCurrentStepIndex(idx)}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${
                  isCurrent
                    ? 'bg-purple-600 text-white shadow-xs'
                    : isDone
                    ? 'bg-emerald-950/40 border border-emerald-500/30 text-emerald-300'
                    : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {isDone ? <Check className="w-3 h-3 text-emerald-400" /> : <span>#{idx + 1}</span>}
                <span>{st.name.split(' ')[0]}</span>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-colors cursor-pointer"
        >
          Finish & Return to Session
        </button>
      </div>
    </div>
  );
};
