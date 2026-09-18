import React, { useState } from 'react';
import { Trophy, X, Target, Flame, Activity } from 'lucide-react';

interface WorkoutOneRepMaxCalculatorProps {
  onClose: () => void;
}

export const WorkoutOneRepMaxCalculator: React.FC<WorkoutOneRepMaxCalculatorProps> = ({
  onClose,
}) => {
  const [weight, setWeight] = useState<number>(80);
  const [reps, setReps] = useState<number>(5);
  const [unit, setUnit] = useState<'kg' | 'lbs'>('kg');

  // Brzycki formula: weight / (1.0278 - (0.0278 * reps))
  const brzycki = reps === 1 ? weight : Math.round(weight / (1.0278 - 0.0278 * Math.min(reps, 15)));
  // Epley formula: weight * (1 + (reps / 30))
  const epley = reps === 1 ? weight : Math.round(weight * (1 + reps / 30));
  // Average
  const average1RM = Math.round((brzycki + epley) / 2);

  const percentageTable = [
    { pct: 100, reps: '1 rep', label: 'Absolute 1RM Max' },
    { pct: 95, reps: '~2 reps', label: 'Peak Power' },
    { pct: 90, reps: '~4 reps', label: 'Maximal Strength' },
    { pct: 85, reps: '~6 reps', label: 'Strength & Density' },
    { pct: 80, reps: '~8 reps', label: 'Hypertrophy Core' },
    { pct: 75, reps: '~10 reps', label: 'Muscle Volume' },
    { pct: 70, reps: '~12 reps', label: 'Metabolic Pump' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-lg rounded-3xl bg-[#0b1222] border border-purple-500/30 p-6 shadow-2xl space-y-5 relative max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30">
              <Trophy className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-white">One-Rep Max (1RM) Calculator</h3>
              <p className="text-[11px] text-slate-400">Scientifically estimated strength & training zones</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Inputs */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Weight Lifted</label>
            <input
              type="number"
              value={weight}
              onChange={(e) => setWeight(Math.max(1, Number(e.target.value)))}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Reps Completed</label>
            <input
              type="number"
              min={1}
              max={15}
              value={reps}
              onChange={(e) => setReps(Math.min(15, Math.max(1, Number(e.target.value))))}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Unit</label>
            <div className="flex rounded-xl bg-slate-900 border border-slate-800 p-1">
              <button
                type="button"
                onClick={() => setUnit('kg')}
                className={`flex-1 py-1 rounded-lg text-xs font-bold transition-all ${
                  unit === 'kg' ? 'bg-purple-600 text-white shadow-xs' : 'text-slate-400'
                }`}
              >
                KG
              </button>
              <button
                type="button"
                onClick={() => setUnit('lbs')}
                className={`flex-1 py-1 rounded-lg text-xs font-bold transition-all ${
                  unit === 'lbs' ? 'bg-purple-600 text-white shadow-xs' : 'text-slate-400'
                }`}
              >
                LBS
              </button>
            </div>
          </div>
        </div>

        {/* Result Highlight */}
        <div className="p-5 rounded-2xl bg-gradient-to-r from-purple-900/30 to-indigo-900/30 border border-purple-500/30 text-center space-y-1">
          <span className="text-[11px] font-bold text-purple-300 uppercase tracking-wider">
            Estimated 1-Rep Maximum
          </span>
          <div className="text-4xl font-black text-white">
            {average1RM} <span className="text-xl text-purple-400 font-bold">{unit}</span>
          </div>
          <div className="flex items-center justify-center gap-4 text-[11px] text-slate-400 pt-2">
            <span>Epley: {epley} {unit}</span>
            <span>•</span>
            <span>Brzycki: {brzycki} {unit}</span>
          </div>
        </div>

        {/* Training Percentages Table */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-white block">Training Percentage Table</span>
          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {percentageTable.map((row) => {
              const targetKg = Math.round((average1RM * row.pct) / 100);
              return (
                <div
                  key={row.pct}
                  className="flex items-center justify-between p-2 rounded-xl bg-[#0e1629] border border-slate-800/80 text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-12 font-bold text-purple-400">{row.pct}%</span>
                    <span className="text-slate-200">{row.label}</span>
                    <span className="text-[10px] text-slate-500">({row.reps})</span>
                  </div>
                  <span className="font-bold text-white">{targetKg} {unit}</span>
                </div>
              );
            })}
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
};
