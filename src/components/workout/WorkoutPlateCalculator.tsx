import React, { useState } from 'react';
import { Dumbbell, X, RotateCcw } from 'lucide-react';

interface WorkoutPlateCalculatorProps {
  initialWeight?: number;
  onClose: () => void;
}

export const WorkoutPlateCalculator: React.FC<WorkoutPlateCalculatorProps> = ({
  initialWeight = 60,
  onClose,
}) => {
  const [unit, setUnit] = useState<'kg' | 'lbs'>('kg');
  const [barWeight, setBarWeight] = useState<number>(20);
  const [targetWeight, setTargetWeight] = useState<number>(initialWeight);

  // Standard Olympic plates
  const availablePlatesKg = [25, 20, 15, 10, 5, 2.5, 1.25];
  const availablePlatesLbs = [45, 35, 25, 10, 5, 2.5];

  const platesToUse = unit === 'kg' ? availablePlatesKg : availablePlatesLbs;

  // Calculate plates per side
  const weightPerSide = Math.max(0, (targetWeight - barWeight) / 2);

  const calculatePlates = (perSide: number, plates: number[]) => {
    let remaining = perSide;
    const result: { weight: number; count: number; color: string }[] = [];

    const plateColors: Record<number, string> = {
      25: 'bg-red-600 text-white',
      20: 'bg-blue-600 text-white',
      15: 'bg-yellow-500 text-black',
      10: 'bg-emerald-600 text-white',
      5: 'bg-white text-black',
      2.5: 'bg-slate-700 text-white',
      1.25: 'bg-slate-500 text-white',
      45: 'bg-blue-600 text-white',
      35: 'bg-yellow-500 text-black',
      // default
    };

    plates.forEach((p) => {
      const count = Math.floor(remaining / p);
      if (count > 0) {
        result.push({
          weight: p,
          count,
          color: plateColors[p] || 'bg-slate-700 text-white',
        });
        remaining = Math.round((remaining - count * p) * 100) / 100;
      }
    });

    return { result, remaining };
  };

  const { result: platesPerSide, remaining } = calculatePlates(weightPerSide, platesToUse);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-md rounded-3xl bg-[#0b1222] border border-purple-500/30 p-6 shadow-2xl space-y-5 relative">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30">
              <Dumbbell className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-white">Olympic Barbell Plate Calculator</h3>
              <p className="text-[11px] text-slate-400">Exact plate configuration per side</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Units & Bar Weight */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Weight Unit</label>
            <div className="flex rounded-xl bg-slate-900 border border-slate-800 p-1">
              <button
                type="button"
                onClick={() => {
                  setUnit('kg');
                  setBarWeight(20);
                }}
                className={`flex-1 py-1 rounded-lg text-xs font-bold transition-all ${
                  unit === 'kg' ? 'bg-purple-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                KG
              </button>
              <button
                type="button"
                onClick={() => {
                  setUnit('lbs');
                  setBarWeight(45);
                }}
                className={`flex-1 py-1 rounded-lg text-xs font-bold transition-all ${
                  unit === 'lbs' ? 'bg-purple-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                LBS
              </button>
            </div>
          </div>

          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Barbell Weight ({unit})</label>
            <input
              type="number"
              value={barWeight}
              onChange={(e) => setBarWeight(Number(e.target.value))}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500"
            />
          </div>
        </div>

        {/* Target Weight Slider / Input */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1">
            <label className="text-slate-300 font-semibold">Total Target Weight</label>
            <span className="font-bold text-purple-400 text-sm">{targetWeight} {unit}</span>
          </div>
          <input
            type="range"
            min={barWeight}
            max={unit === 'kg' ? 250 : 500}
            step={unit === 'kg' ? 2.5 : 5}
            value={targetWeight}
            onChange={(e) => setTargetWeight(Number(e.target.value))}
            className="w-full accent-purple-500"
          />
          <div className="flex items-center gap-1.5 mt-2">
            {[40, 60, 80, 100, 120, 140].map((quick) => {
              const val = unit === 'kg' ? quick : Math.round(quick * 2.2);
              return (
                <button
                  key={val}
                  type="button"
                  onClick={() => setTargetWeight(val)}
                  className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-semibold transition-colors"
                >
                  {val}{unit}
                </button>
              );
            })}
          </div>
        </div>

        {/* Barbell Visual Representation */}
        <div className="p-4 rounded-2xl bg-[#0e1629] border border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Per Side Load:</span>
            <span className="font-bold text-white">{weightPerSide} {unit}</span>
          </div>

          {/* Graphical Plates Stack */}
          <div className="h-20 bg-slate-950/60 rounded-xl border border-slate-800/80 flex items-center justify-center gap-1.5 px-3 overflow-x-auto">
            {/* Bar sleeve */}
            <div className="w-4 h-6 bg-slate-600 rounded-l" title="Barbell Collar" />

            {platesPerSide.length > 0 ? (
              platesPerSide.flatMap((p, idx) =>
                Array.from({ length: p.count }).map((_, cIdx) => (
                  <div
                    key={`plate-${p.weight}-${idx}-${cIdx}`}
                    className={`h-16 w-6 rounded-md flex flex-col items-center justify-center text-[10px] font-black shadow-md border border-black/30 ${p.color}`}
                    title={`${p.weight} ${unit}`}
                  >
                    <span>{p.weight}</span>
                  </div>
                ))
              )
            ) : (
              <span className="text-xs text-slate-500 italic">No plates (Empty Bar)</span>
            )}

            {/* Collar clip */}
            <div className="w-2.5 h-8 bg-amber-500 rounded-r shadow-xs" title="Barbell Clip" />
          </div>

          {/* List of plates */}
          <div className="space-y-1 pt-2 border-t border-slate-800/80">
            <span className="text-[11px] font-semibold text-slate-300 block">Plates each side:</span>
            <div className="flex items-center gap-2 flex-wrap text-xs">
              {platesPerSide.length > 0 ? (
                platesPerSide.map((p) => (
                  <span
                    key={p.weight}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-200 border border-slate-700 font-bold flex items-center gap-1"
                  >
                    <span>{p.count}x</span>
                    <span className="text-purple-400">{p.weight} {unit}</span>
                  </span>
                ))
              ) : (
                <span className="text-xs text-slate-500">Just load the bare bar</span>
              )}
            </div>
          </div>

          {remaining > 0 && (
            <p className="text-[11px] text-amber-400">
              * Note: {remaining} {unit} per side cannot be loaded with available standard plates.
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition-colors"
        >
          Done
        </button>
      </div>
    </div>
  );
};
