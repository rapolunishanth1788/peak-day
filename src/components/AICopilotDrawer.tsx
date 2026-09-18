import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sparkles } from 'lucide-react';
import { AISectionType, AICopilotAction, User } from '../types';
import { UserFullData } from '../services/api';
import { SectionAIAssistant } from './SectionAIAssistant';

interface AICopilotDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  initialSection: AISectionType;
  user: User;
  data: UserFullData;
  onApplyAction: (action: AICopilotAction) => void;
  onNavigate?: (tab: any) => void;
}

export const AICopilotDrawer: React.FC<AICopilotDrawerProps> = ({
  isOpen,
  onClose,
  initialSection,
  user,
  data,
  onApplyAction,
  onNavigate,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            {/* Slide-over Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className="w-screen max-w-2xl bg-[#090d18] border-l border-slate-800 shadow-2xl flex flex-col"
            >
              <div className="flex-1 overflow-hidden p-2 sm:p-4">
                <SectionAIAssistant
                  section={initialSection}
                  user={user}
                  data={data}
                  onApplyAction={onApplyAction}
                  onNavigate={onNavigate}
                  isDrawer={true}
                  onCloseDrawer={onClose}
                />
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};
