import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, Bot, Zap } from 'lucide-react';
import { AISectionType } from '../types';

interface FloatingCopilotButtonProps {
  onClick: () => void;
  activeSection: AISectionType;
}

const SECTION_NAMES: Record<AISectionType, string> = {
  workout: 'AI Coach',
  schedule: 'AI Schedule',
  tasks: 'AI Strategist',
  academics: 'AI Professor',
  global: 'Peak AI',
};

export const FloatingCopilotButton: React.FC<FloatingCopilotButtonProps> = ({
  onClick,
  activeSection,
}) => {
  const sectionLabel = SECTION_NAMES[activeSection] || 'AI Assistant';

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="fixed bottom-6 right-6 z-40"
    >
      <button
        onClick={onClick}
        className="group relative flex items-center gap-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:via-indigo-500 hover:to-purple-500 text-white font-semibold text-xs sm:text-sm shadow-xl shadow-blue-600/30 border border-blue-400/30 hover:shadow-blue-500/50 hover:scale-105 active:scale-95 transition-all"
        title="Open Dedicated AI Assistant"
      >
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-300" />
        </span>

        <Sparkles className="w-4 h-4 text-cyan-200 group-hover:rotate-12 transition-transform" />

        <span className="tracking-wide">
          Ask <span className="font-bold text-cyan-200">{sectionLabel}</span>
        </span>

        <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-white/15 text-white">
          <Zap className="w-2.5 h-2.5 mr-0.5 text-amber-300" />
          Live
        </span>
      </button>
    </motion.div>
  );
};
