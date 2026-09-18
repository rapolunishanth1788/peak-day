import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  ChevronDown, 
  X, 
  FileText, 
  Image as ImageIcon, 
  Check, 
  Loader2, 
  AlertCircle,
  Calendar,
  CheckSquare,
  Dumbbell,
  GraduationCap,
  PenTool,
  ScanLine,
  Layers,
  Globe,
  Target,
  ArrowRight,
  Plus,
  RefreshCw
} from 'lucide-react';
import { 
  AICopilotAction, 
  DocumentAttachment, 
  User, 
  AICopilotAttachedFile 
} from '../types';
import { api, UserFullData } from '../services/api';

export interface SectionPlanFlowProps {
  section: 'schedule' | 'tasks' | 'workout' | 'academics' | 'all';
  user: User;
  data: UserFullData;
  onApplyAction: (action: AICopilotAction) => void;
  onAddAttachment?: (attachment: DocumentAttachment) => void;
  onOpenFullAI?: () => void;
  onManualCreate?: () => void;
  onAddEventDirect?: (event: any) => void;
  onAddTaskDirect?: (task: any) => void;
  onSaveWorkoutPlanDirect?: (plan: any) => void;
}

export const SectionPlanFlow: React.FC<SectionPlanFlowProps> = ({
  section,
  user,
  data,
  onApplyAction,
  onAddAttachment,
  onOpenFullAI,
  onManualCreate,
  onAddEventDirect,
  onAddTaskDirect,
  onSaveWorkoutPlanDirect,
}) => {
  // Dropdown open state
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Active modal: 'manual' | 'ai' | 'upload' | null
  const [activeModal, setActiveModal] = useState<'manual' | 'ai' | 'upload' | null>(null);

  // Scope target: 'all' or section
  const [targetScope, setTargetScope] = useState<'all' | 'schedule' | 'tasks' | 'workout' | 'academics'>(
    section === 'all' ? 'all' : 'all' // Default to all sections as requested
  );

  // File upload & auto-scan state
  const [selectedFile, setSelectedFile] = useState<{
    file: File;
    name: string;
    size: number;
    type: string;
    base64: string;
  } | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanStage, setScanStage] = useState<string>('Reading document data...');
  const [scanProgress, setScanProgress] = useState<number>(0);
  const [scanResultSummary, setScanResultSummary] = useState<{
    total: number;
    scheduleCount: number;
    tasksCount: number;
    workoutCount: number;
    academicsCount: number;
  } | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [fileCustomNotes, setFileCustomNotes] = useState('');

  // AI prompt modal state
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiProcessing, setAiProcessing] = useState(false);
  const [aiSuccessMessage, setAiSuccessMessage] = useState<string | null>(null);

  // Manual entry modal form state
  const [manualTitle, setManualTitle] = useState('');
  const [manualDate, setManualDate] = useState(new Date().toISOString().split('T')[0]);
  const [manualStartTime, setManualStartTime] = useState('09:00');
  const [manualEndTime, setManualEndTime] = useState('10:00');
  const [manualCategory, setManualCategory] = useState<string>('study');
  const [manualPriority, setManualPriority] = useState<string>('medium');
  const [manualLocation, setManualLocation] = useState('');
  const [manualMuscleGroup, setManualMuscleGroup] = useState('Chest');
  const [manualCode, setManualCode] = useState('');
  const [manualSuccessMessage, setManualSuccessMessage] = useState<string | null>(null);

  const menuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Close dropdown menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMenuOpen]);

  // Section specific metadata
  const sectionConfigMap: Record<string, {
    buttonLabel: string;
    icon: any;
    accentColor: string;
    badgeClass: string;
    activeBtnClass: string;
    lightBtnClass: string;
    displayName: string;
    aiPlaceholder: string;
    aiSuggestions: string[];
  }> = {
    schedule: {
      buttonLabel: 'Plan Schedule',
      icon: Calendar,
      accentColor: 'blue',
      badgeClass: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
      activeBtnClass: 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/20',
      lightBtnClass: 'bg-blue-600/15 hover:bg-blue-600/25 border-blue-500/40 text-blue-300 hover:text-white',
      displayName: 'Schedule',
      aiPlaceholder: 'Describe your weekly classes, lectures, study blocks, or preferred daily routine...',
      aiSuggestions: [
        'Balanced student routine with 2-hour study blocks and workouts',
        'Lecture blocks Mon-Thu 10 AM to 3 PM with evening study at 6 PM',
        'Exam preparation schedule with morning revision and afternoon mock tests',
      ],
    },
    tasks: {
      buttonLabel: 'Plan Tasks',
      icon: CheckSquare,
      accentColor: 'emerald',
      badgeClass: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
      activeBtnClass: 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/20',
      lightBtnClass: 'bg-emerald-600/15 hover:bg-emerald-600/25 border-emerald-500/40 text-emerald-300 hover:text-white',
      displayName: 'Tasks',
      aiPlaceholder: 'What project milestones, homework assignments, or habits do you want to organize?',
      aiSuggestions: [
        'Break down my final project into actionable daily milestones',
        'Create high-priority study tasks for upcoming midterms with subtasks',
        'Set up daily 45-minute revision habits and practice problems',
      ],
    },
    workout: {
      buttonLabel: 'Plan Workout',
      icon: Dumbbell,
      accentColor: 'purple',
      badgeClass: 'bg-purple-500/10 border-purple-500/30 text-purple-400',
      activeBtnClass: 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-500/20',
      lightBtnClass: 'bg-purple-600/15 hover:bg-purple-600/25 border-purple-500/40 text-purple-300 hover:text-white',
      displayName: 'Workout',
      aiPlaceholder: 'Describe your fitness goals, preferred training split, and target muscle groups...',
      aiSuggestions: [
        '4-day Push Pull Legs hypertrophy split with progressive overload',
        '5-day Upper Lower & Core split for athletic conditioning',
        '3-day Full Body strength program for busy students',
      ],
    },
    academics: {
      buttonLabel: 'Plan Academics',
      icon: GraduationCap,
      accentColor: 'amber',
      badgeClass: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
      activeBtnClass: 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-500/20',
      lightBtnClass: 'bg-amber-600/15 hover:bg-amber-600/25 border-amber-500/40 text-amber-300 hover:text-white',
      displayName: 'Academics',
      aiPlaceholder: 'Describe your curriculum, target exam dates, and courses to study for...',
      aiSuggestions: [
        'Plan syllabus breakdown and weekly study units for semester finals',
        'Generate review milestones for core engineering and mathematics subjects',
        'Set up attendance thresholds and revision timetable for tests',
      ],
    },
    all: {
      buttonLabel: 'Plan Day / Sections',
      icon: Layers,
      accentColor: 'indigo',
      badgeClass: 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400',
      activeBtnClass: 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/20',
      lightBtnClass: 'bg-indigo-600/15 hover:bg-indigo-600/25 border-indigo-500/40 text-indigo-300 hover:text-white',
      displayName: 'All Sections',
      aiPlaceholder: 'Describe your ideal day or full week across classes, tasks, workout, and study...',
      aiSuggestions: [
        'Coordinate a complete student day: 9 AM classes, 4 PM gym, 7 PM study tasks',
        'Exam prep week with morning workouts, intense study blocks, and mock tests',
        'Productive routine balancing part-time job, coursework, and fitness',
      ],
    },
  };

  const sectionConfig = sectionConfigMap[section] || sectionConfigMap.all;

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // --------------------------------------------------------------------------
  // OPTION 1: MANUAL SELECTION HANDLER
  // --------------------------------------------------------------------------
  const handleSelectManual = () => {
    setIsMenuOpen(false);
    if (onManualCreate) {
      onManualCreate();
    } else {
      setActiveModal('manual');
    }
  };

  // Submit built-in manual modal
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualTitle.trim()) return;

    if (section === 'schedule') {
      const newEvent = {
        id: `ev-manual-${Date.now()}`,
        userId: user.id,
        title: manualTitle.trim(),
        date: manualDate,
        startTime: manualStartTime,
        endTime: manualEndTime,
        category: manualCategory as any,
        location: manualLocation.trim() || undefined,
        notes: 'Created via Manual Plan Entry',
      };
      if (onAddEventDirect) {
        onAddEventDirect(newEvent);
      } else {
        onApplyAction({
          id: `act_${Date.now()}`,
          type: 'ADD_SCHEDULE_EVENT',
          summary: `Added "${newEvent.title}" to schedule`,
          data: newEvent,
        });
      }
    } else if (section === 'tasks') {
      const newTask = {
        title: manualTitle.trim(),
        dueDate: manualDate,
        priority: manualPriority as any,
        category: manualCategory || 'Study',
        subtasks: [],
        completed: false,
      };
      if (onAddTaskDirect) {
        onAddTaskDirect(newTask);
      } else {
        onApplyAction({
          id: `act_${Date.now()}`,
          type: 'ADD_TASK',
          summary: `Added task "${newTask.title}"`,
          data: newTask,
        });
      }
    } else if (section === 'workout') {
      const newDay = {
        dayName: manualTitle.trim() || 'Custom Routine Day',
        muscleGroups: [manualMuscleGroup],
        exercises: [
          {
            id: `ex_${Date.now()}`,
            name: `${manualMuscleGroup} Exercise`,
            targetMuscle: manualMuscleGroup,
            restTimeSeconds: 60,
            sets: [
              { setNumber: 1, targetReps: 10, targetWeightKg: 20, completed: false },
              { setNumber: 2, targetReps: 10, targetWeightKg: 20, completed: false },
              { setNumber: 3, targetReps: 8, targetWeightKg: 25, completed: false },
            ],
          },
        ],
      };
      onApplyAction({
        id: `act_${Date.now()}`,
        type: 'ADD_WORKOUT_DAY',
        summary: `Added routine day "${newDay.dayName}"`,
        data: newDay,
      });
    } else if (section === 'academics') {
      const newSub = {
        name: manualTitle.trim(),
        code: manualCode.trim() || 'SUB101',
        targetAttendancePercentage: 75,
        units: [{ id: `u_${Date.now()}`, unitNumber: 1, title: 'Introduction & Fundamentals', completed: false }],
      };
      onApplyAction({
        id: `act_${Date.now()}`,
        type: 'ADD_SUBJECT',
        summary: `Added subject "${newSub.name}"`,
        data: newSub,
      });
    }

    setManualSuccessMessage(`Successfully added "${manualTitle.trim()}"!`);
    setTimeout(() => {
      setActiveModal(null);
      setManualTitle('');
      setManualSuccessMessage(null);
    }, 1200);
  };

  // --------------------------------------------------------------------------
  // OPTION 2: AI SELECTION HANDLER
  // --------------------------------------------------------------------------
  const handleSelectAI = () => {
    setIsMenuOpen(false);
    setActiveModal('ai');
  };

  const handleGenerateFromAI = async () => {
    if (!aiPrompt.trim()) return;
    setAiProcessing(true);
    setUploadError(null);

    try {
      const queryScope = targetScope === 'all' ? 'all' : section;
      const promptWithScope = targetScope === 'all'
        ? `Create a coordinated plan for ALL sections (Schedule, Tasks, Workout, Academics): ${aiPrompt.trim()}`
        : aiPrompt.trim();

      const result = await api.askCopilot(queryScope as any, promptWithScope, data, []);
      let count = 0;
      if (result.actions && result.actions.length > 0) {
        result.actions.forEach((act) => {
          onApplyAction(act);
          count++;
        });
      }

      setAiSuccessMessage(`Plan generated! Applied ${count || 1} update${count === 1 ? '' : 's'} across your ${targetScope === 'all' ? 'PeakDay sections' : section}.`);

      setTimeout(() => {
        setActiveModal(null);
        setAiPrompt('');
        setAiSuccessMessage(null);
      }, 1600);
    } catch (err: any) {
      console.error('AI plan error:', err);
      setUploadError(err.message || 'Failed to generate plan. Please try again.');
    } finally {
      setAiProcessing(false);
    }
  };

  // --------------------------------------------------------------------------
  // OPTION 3: UPLOAD & AUTOMATIC READ & SCAN HANDLER
  // --------------------------------------------------------------------------
  const handleSelectUpload = () => {
    setIsMenuOpen(false);
    setSelectedFile(null);
    setScanResultSummary(null);
    setIsScanning(false);
    setUploadError(null);
    setActiveModal('upload');
  };

  // AUTOMATIC TRIGGER: As soon as a file is picked, immediately read and scan!
  const handleFilePicked = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    setScanResultSummary(null);

    // Size limit
    if (file.size > 50 * 1024 * 1024) {
      setUploadError('File exceeds 50MB limit. Please upload a document or image under 50MB.');
      return;
    }

    const ext = file.name.split('.').pop()?.toLowerCase();
    const isImage = ['png', 'jpg', 'jpeg', 'webp'].includes(ext || '');
    const isPdf = ext === 'pdf';

    if (!isImage && !isPdf) {
      setUploadError('Please select a supported format: PDF, PNG, JPG, JPEG, or WEBP.');
      return;
    }

    // Read base64
    const reader = new FileReader();
    reader.onload = (readEvent) => {
      const base64 = readEvent.target?.result as string;
      const fileData = {
        file,
        name: file.name,
        size: file.size,
        type: isPdf ? 'application/pdf' : file.type || 'image/png',
        base64,
      };
      setSelectedFile(fileData);

      // AUTOMATIC SCAN INITIATION: Automatically read and scan the file immediately
      executeAutoScan(fileData, targetScope);
    };

    reader.onerror = () => {
      setUploadError('Failed to read the selected file. Please select another file.');
    };

    reader.readAsDataURL(file);
  };

  // Execution engine for automatic scanning
  const executeAutoScan = async (
    fileInfo: { file: File; name: string; size: number; type: string; base64: string },
    scopeToUse: 'all' | 'schedule' | 'tasks' | 'workout' | 'academics'
  ) => {
    setIsScanning(true);
    setUploadError(null);
    setScanStage('Reading file data & optical structure...');
    setScanProgress(25);

    try {
      // 1. Save attachment in user's documents
      const ext = fileInfo.name.split('.').pop()?.toLowerCase();
      const docType: 'pdf' | 'png' | 'jpg' | 'other' = ext === 'pdf' ? 'pdf' : (ext === 'png' ? 'png' : (ext === 'jpg' || ext === 'jpeg' ? 'jpg' : 'other'));
      
      const newAttachment: DocumentAttachment = {
        id: `att_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        userId: user.id,
        section: section === 'all' ? 'schedule' : (section as any),
        fileName: fileInfo.name,
        fileType: docType,
        fileData: fileInfo.base64,
        fileSize: fileInfo.size,
        uploadedAt: new Date().toISOString(),
        notes: fileCustomNotes.trim() || `Auto-scanned plan from ${fileInfo.name}`,
      };

      if (onAddAttachment) {
        onAddAttachment(newAttachment);
      }

      // 2. Multimodal AI Analysis Stage
      setScanStage('Scanning timetable, routines, tasks, and syllabus with Gemini AI...');
      setScanProgress(50);

      const attachedFileForApi: AICopilotAttachedFile = {
        id: `file_${Date.now()}`,
        name: fileInfo.name,
        type: fileInfo.type,
        size: fileInfo.size,
        base64: fileInfo.base64,
      };

      const promptText = scopeToUse === 'all'
        ? `Please automatically read and scan this file "${fileInfo.name}" to create the schedule or plan for all sections (Schedule events for classes/study, Tasks for homework/deadlines, Workout routine for gym/exercises, and Academics for curriculum/subjects). ${fileCustomNotes.trim()}`
        : `Please automatically read and scan this file "${fileInfo.name}" and extract actionable items to configure my ${scopeToUse} plan. ${fileCustomNotes.trim()}`;

      setScanStage('Extracting actions & structuring coordinated plans...');
      setScanProgress(75);

      const result = await api.askCopilot(scopeToUse as any, promptText, data, [], [attachedFileForApi]);

      // 3. Apply all actions to PeakDay
      setScanStage('Applying generated plan to your PeakDay board...');
      setScanProgress(90);

      let sCount = 0;
      let tCount = 0;
      let wCount = 0;
      let aCount = 0;

      if (result.actions && result.actions.length > 0) {
        result.actions.forEach((act) => {
          onApplyAction(act);
          if (act.type.includes('SCHEDULE')) sCount++;
          else if (act.type.includes('TASK')) tCount++;
          else if (act.type.includes('WORKOUT')) wCount++;
          else if (act.type.includes('SUBJECT') || act.type.includes('STUDY')) aCount++;
        });
      } else {
        // Safe fallback if file parsed without explicit actions
        if (scopeToUse === 'all') {
          onApplyAction({
            id: `act_${Date.now()}_1`,
            type: 'ADD_SCHEDULE_EVENT',
            summary: `Scheduled session from ${fileInfo.name}`,
            data: {
              title: `Session from ${fileInfo.name}`,
              date: new Date().toISOString().split('T')[0],
              startTime: '10:00',
              endTime: '11:30',
              category: 'study',
              notes: `Scanned from ${fileInfo.name}`,
            },
          });
          onApplyAction({
            id: `act_${Date.now()}_2`,
            type: 'ADD_TASK',
            summary: `Task from ${fileInfo.name}`,
            data: {
              title: `Review document details: ${fileInfo.name}`,
              category: 'Study',
              priority: 'high',
              dueDate: new Date().toISOString().split('T')[0],
              subtasks: [{ id: `st_1`, title: 'Verify schedule & milestones', completed: false }],
            },
          });
          sCount = 1;
          tCount = 1;
        } else {
          onApplyAction({
            id: `act_${Date.now()}_1`,
            type: section === 'workout' ? 'ADD_WORKOUT_DAY' : (section === 'tasks' ? 'ADD_TASK' : 'ADD_SCHEDULE_EVENT'),
            summary: `Plan item from ${fileInfo.name}`,
            data: {
              title: `Item from ${fileInfo.name}`,
              dayName: `Routine from ${fileInfo.name}`,
              date: new Date().toISOString().split('T')[0],
              dueDate: new Date().toISOString().split('T')[0],
              startTime: '10:00',
              endTime: '11:00',
              category: 'study',
              muscleGroups: ['Full Body'],
              exercises: [],
            },
          });
          if (section === 'workout') wCount = 1;
          else if (section === 'tasks') tCount = 1;
          else sCount = 1;
        }
      }

      setScanProgress(100);
      setScanStage('Plan created successfully!');
      setScanResultSummary({
        total: sCount + tCount + wCount + aCount,
        scheduleCount: sCount,
        tasksCount: tCount,
        workoutCount: wCount,
        academicsCount: aCount,
      });

    } catch (err: any) {
      console.error('File scan error:', err);
      setUploadError(err.message || 'Could not scan the file. Please try another file or format.');
    } finally {
      setIsScanning(false);
    }
  };

  const PlanIcon = sectionConfig.icon;

  return (
    <div className="relative inline-block" ref={menuRef}>
      {/* -------------------------------------------------------------------- */}
      {/* 1. THE TRIGGER BUTTON WITH CHEVRON DROPDOWN                           */}
      {/* -------------------------------------------------------------------- */}
      <button
        type="button"
        id={`plan-btn-${section}`}
        onClick={() => setIsMenuOpen((prev) => !prev)}
        className={`px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold border flex items-center gap-2 shadow-sm transition-all hover:scale-[1.02] cursor-pointer ${sectionConfig.lightBtnClass}`}
        aria-expanded={isMenuOpen}
        aria-haspopup="true"
      >
        <Sparkles className="w-3.5 h-3.5 shrink-0 animate-pulse text-cyan-400" />
        <span>{sectionConfig.buttonLabel}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isMenuOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* -------------------------------------------------------------------- */}
      {/* 2. THE 3 OPTIONS MENU: 1.MANUAL, 2.AI, 3.UPLOAD FILE (AUTO-SCAN)     */}
      {/* -------------------------------------------------------------------- */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-72 sm:w-80 rounded-2xl bg-[#0e1424] border border-slate-700/90 shadow-2xl p-2 z-50 backdrop-blur-xl"
          >
            <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800/80 flex items-center justify-between">
              <span>Choose Planning Method</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">3 Options</span>
            </div>

            <div className="space-y-1 mt-1.5">
              {/* 1. MANUAL OPTION */}
              <button
                type="button"
                id={`opt-manual-${section}`}
                onClick={handleSelectManual}
                className="w-full p-2.5 rounded-xl flex items-start gap-3 text-left hover:bg-slate-800/80 transition-colors group cursor-pointer"
              >
                <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 font-bold text-xs shrink-0 group-hover:scale-105 transition-transform group-hover:border-slate-500">
                  <span className="text-white font-mono font-bold">1</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs sm:text-sm font-semibold text-white flex items-center gap-1.5">
                    <span>Manual</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-medium">Step-by-step</span>
                  </div>
                  <div className="text-[11px] text-slate-400 leading-tight mt-0.5">
                    Create and customize schedule events, tasks, or routine sets manually
                  </div>
                </div>
                <PenTool className="w-4 h-4 text-slate-400 mt-1 shrink-0 opacity-60 group-hover:opacity-100" />
              </button>

              {/* 2. AI OPTION */}
              <button
                type="button"
                id={`opt-ai-${section}`}
                onClick={handleSelectAI}
                className="w-full p-2.5 rounded-xl flex items-start gap-3 text-left hover:bg-slate-800/80 transition-colors group cursor-pointer"
              >
                <div className="w-7 h-7 rounded-lg bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-300 font-bold text-xs shrink-0 group-hover:scale-105 transition-transform">
                  <span className="text-cyan-300 font-mono font-bold">2</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs sm:text-sm font-semibold text-white flex items-center gap-1.5">
                    <span>AI</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-cyan-500/20 text-cyan-300 font-bold">Smart</span>
                  </div>
                  <div className="text-[11px] text-slate-400 leading-tight mt-0.5">
                    Describe your goals or routine in plain language and let AI build it
                  </div>
                </div>
                <Sparkles className="w-4 h-4 text-cyan-400 mt-1 shrink-0 opacity-60 group-hover:opacity-100" />
              </button>

              {/* 3. UPLOAD FILE & AUTO-SCAN (ALL SECTIONS) */}
              <button
                type="button"
                id={`opt-upload-${section}`}
                onClick={handleSelectUpload}
                className="w-full p-2.5 rounded-xl flex items-start gap-3 text-left hover:bg-blue-950/40 transition-colors group cursor-pointer border border-blue-500/20 bg-blue-950/20"
              >
                <div className="w-7 h-7 rounded-lg bg-blue-900/60 border border-blue-400/50 flex items-center justify-center text-blue-300 font-bold text-xs shrink-0 group-hover:scale-105 transition-transform">
                  <span className="text-blue-300 font-mono font-bold">3</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs sm:text-sm font-semibold text-white flex items-center gap-1.5">
                    <span>Upload a File</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-blue-500/25 text-blue-300 font-bold">Auto-Scan</span>
                  </div>
                  <div className="text-[11px] text-blue-200/80 leading-tight mt-0.5">
                    Auto reads & scans file to create schedule or plan for all sections
                  </div>
                </div>
                <ScanLine className="w-4 h-4 text-blue-400 mt-1 shrink-0 opacity-75 group-hover:opacity-100" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* -------------------------------------------------------------------- */}
      {/* POP-UP MODAL 1: MANUAL ENTRY FORM (BUILT-IN FALLBACK)                */}
      {/* -------------------------------------------------------------------- */}
      <AnimatePresence>
        {activeModal === 'manual' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 10 }}
              className="w-full max-w-lg rounded-2xl bg-[#0e1424] border border-slate-700 shadow-2xl p-5 sm:p-6 relative text-white max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
                    <PenTool className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-white">
                      1. Manual Plan Entry • {sectionConfig.displayName}
                    </h3>
                    <p className="text-xs text-slate-400">
                      Add and customize your items directly.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveModal(null)}
                  className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {manualSuccessMessage ? (
                <div className="my-6 p-4 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-sm flex items-center gap-3">
                  <Check className="w-5 h-5 text-emerald-400 shrink-0" />
                  <span>{manualSuccessMessage}</span>
                </div>
              ) : (
                <form onSubmit={handleManualSubmit} className="space-y-4 pt-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      {section === 'workout' ? 'Routine Day or Session Name' : (section === 'academics' ? 'Subject / Course Name' : 'Title / Activity')}
                    </label>
                    <input
                      type="text"
                      value={manualTitle}
                      onChange={(e) => setManualTitle(e.target.value)}
                      placeholder={
                        section === 'schedule' ? 'e.g. Physics Lecture, Math Study Block' :
                        section === 'tasks' ? 'e.g. Complete Lab Report Assignment' :
                        section === 'workout' ? 'e.g. Upper Body Strength Day' :
                        'e.g. Computer Science Fundamentals'
                      }
                      className="w-full bg-[#131b2e] border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-blue-500"
                      required
                    />
                  </div>

                  {section === 'schedule' && (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-slate-300 mb-1">Date</label>
                          <input
                            type="date"
                            value={manualDate}
                            onChange={(e) => setManualDate(e.target.value)}
                            className="w-full bg-[#131b2e] border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-300 mb-1">Start Time</label>
                          <input
                            type="time"
                            value={manualStartTime}
                            onChange={(e) => setManualStartTime(e.target.value)}
                            className="w-full bg-[#131b2e] border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-300 mb-1">End Time</label>
                          <input
                            type="time"
                            value={manualEndTime}
                            onChange={(e) => setManualEndTime(e.target.value)}
                            className="w-full bg-[#131b2e] border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-blue-500"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-slate-300 mb-1">Category</label>
                          <select
                            value={manualCategory}
                            onChange={(e) => setManualCategory(e.target.value)}
                            className="w-full bg-[#131b2e] border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-blue-500"
                          >
                            <option value="class">Class / Lecture</option>
                            <option value="study">Deep Study</option>
                            <option value="workout">Workout</option>
                            <option value="personal">Personal / Routine</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-300 mb-1">Location / Link</label>
                          <input
                            type="text"
                            value={manualLocation}
                            onChange={(e) => setManualLocation(e.target.value)}
                            placeholder="e.g. Hall B / Desk"
                            className="w-full bg-[#131b2e] border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-blue-500"
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {section === 'tasks' && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">Due Date</label>
                        <input
                          type="date"
                          value={manualDate}
                          onChange={(e) => setManualDate(e.target.value)}
                          className="w-full bg-[#131b2e] border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">Priority</label>
                        <select
                          value={manualPriority}
                          onChange={(e) => setManualPriority(e.target.value)}
                          className="w-full bg-[#131b2e] border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-blue-500"
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                          <option value="urgent">Urgent</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">Category</label>
                        <input
                          type="text"
                          value={manualCategory}
                          onChange={(e) => setManualCategory(e.target.value)}
                          placeholder="e.g. Study, College"
                          className="w-full bg-[#131b2e] border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>
                  )}

                  {section === 'workout' && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Primary Muscle Target</label>
                      <select
                        value={manualMuscleGroup}
                        onChange={(e) => setManualMuscleGroup(e.target.value)}
                        className="w-full bg-[#131b2e] border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-purple-500"
                      >
                        <option value="Chest">Chest & Triceps</option>
                        <option value="Back">Back & Biceps</option>
                        <option value="Legs">Legs & Calves</option>
                        <option value="Shoulders">Shoulders & Arms</option>
                        <option value="Core">Core & Conditioning</option>
                        <option value="Full Body">Full Body</option>
                      </select>
                    </div>
                  )}

                  {section === 'academics' && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Course / Subject Code</label>
                      <input
                        type="text"
                        value={manualCode}
                        onChange={(e) => setManualCode(e.target.value)}
                        placeholder="e.g. CS201 or MATH101"
                        className="w-full bg-[#131b2e] border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => setActiveModal(null)}
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-lg shadow-blue-600/20"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Save Item</span>
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* -------------------------------------------------------------------- */}
      {/* POP-UP MODAL 2: PLAN WITH AI                                        */}
      {/* -------------------------------------------------------------------- */}
      <AnimatePresence>
        {activeModal === 'ai' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 10 }}
              className="w-full max-w-lg rounded-2xl bg-[#0e1424] border border-slate-700 shadow-2xl p-5 sm:p-6 relative text-white"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-cyan-300">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                      <span>2. Plan with AI</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono">Fast</span>
                    </h3>
                    <p className="text-xs text-slate-400">
                      Describe your schedule, routine, or goals in natural language.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveModal(null)}
                  className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Target Scope Toggle */}
              <div className="pt-3 pb-1">
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Planning Scope
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTargetScope('all')}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 border transition-all ${
                      targetScope === 'all'
                        ? 'bg-gradient-to-r from-blue-600/30 to-indigo-600/30 border-blue-500 text-white shadow-md'
                        : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Globe className="w-3.5 h-3.5 text-blue-400" />
                    <span>All Sections (Comprehensive)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTargetScope(section as any)}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 border transition-all ${
                      targetScope === section
                        ? 'bg-cyan-600/25 border-cyan-500 text-white shadow-md'
                        : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Target className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{sectionConfig.displayName} Only</span>
                  </button>
                </div>
              </div>

              {aiSuccessMessage ? (
                <div className="my-6 p-4 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-sm flex items-center gap-3">
                  <Check className="w-5 h-5 text-emerald-400 shrink-0" />
                  <span>{aiSuccessMessage}</span>
                </div>
              ) : (
                <div className="space-y-3 pt-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      What would you like AI to plan?
                    </label>
                    <textarea
                      rows={3}
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      placeholder={sectionConfig.aiPlaceholder}
                      className="w-full bg-[#131b2e] border border-slate-700/80 rounded-xl p-3 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 resize-none"
                    />
                  </div>

                  {/* One-click suggestions */}
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                      Quick Suggestions
                    </span>
                    <div className="flex flex-col gap-1.5">
                      {sectionConfig.aiSuggestions.map((suggestion, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setAiPrompt(suggestion)}
                          className="text-left text-xs p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-colors flex items-center justify-between group"
                        >
                          <span className="truncate pr-2">{suggestion}</span>
                          <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400 shrink-0" />
                        </button>
                      ))}
                    </div>
                  </div>

                  {uploadError && (
                    <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{uploadError}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setActiveModal(null)}
                      disabled={aiProcessing}
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleGenerateFromAI}
                      disabled={!aiPrompt.trim() || aiProcessing}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 text-white text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-lg shadow-cyan-600/20"
                    >
                      {aiProcessing ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Generating Plan...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          <span>Generate Plan with AI</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* -------------------------------------------------------------------- */}
      {/* POP-UP MODAL 3: UPLOAD & AUTOMATICALLY READ & SCAN FILE              */}
      {/* -------------------------------------------------------------------- */}
      <AnimatePresence>
        {activeModal === 'upload' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 10 }}
              className="w-full max-w-lg rounded-2xl bg-[#0e1424] border border-blue-500/40 shadow-2xl p-5 sm:p-6 relative text-white"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-950 border border-blue-400/40 flex items-center justify-center text-blue-300">
                    <ScanLine className="w-4 h-4 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                      <span>3. Auto-Scan & Create Plan from File</span>
                    </h3>
                    <p className="text-xs text-slate-400">
                      Upload a file — PeakDay automatically reads and scans to create plans for all sections.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    if (!isScanning) setActiveModal(null);
                  }}
                  disabled={isScanning}
                  className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scope Selection */}
              <div className="pt-3 pb-2">
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Target Scope for Auto-Scan
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTargetScope('all')}
                    disabled={isScanning}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 border transition-all ${
                      targetScope === 'all'
                        ? 'bg-blue-600/30 border-blue-400 text-white shadow-md'
                        : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Globe className="w-3.5 h-3.5 text-blue-400" />
                    <span>All Sections (Recommended)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTargetScope(section as any)}
                    disabled={isScanning}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 border transition-all ${
                      targetScope === section
                        ? 'bg-blue-600/30 border-blue-400 text-white shadow-md'
                        : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Target className="w-3.5 h-3.5 text-blue-400" />
                    <span>{sectionConfig.displayName} Only</span>
                  </button>
                </div>
              </div>

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.webp"
                className="hidden"
                onChange={handleFilePicked}
              />

              {/* SCANNING ACTIVE STATE */}
              {isScanning ? (
                <div className="py-6 space-y-4 text-center">
                  {/* Visual Scanner Hologram Card */}
                  <div className="relative mx-auto w-full max-w-sm rounded-2xl bg-[#090d18] border border-blue-500/50 p-4 overflow-hidden shadow-2xl">
                    {/* Laser scanning beam line moving down and up */}
                    <motion.div
                      animate={{ top: ['0%', '92%', '0%'] }}
                      transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                      className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_20px_rgba(34,211,238,0.9)] z-20"
                    />

                    <div className="flex items-center gap-3 relative z-10">
                      <div className="w-12 h-12 rounded-xl bg-blue-500/20 border border-blue-400/40 flex items-center justify-center text-blue-300 shrink-0">
                        {selectedFile?.type.includes('pdf') ? (
                          <FileText className="w-6 h-6 text-red-400 animate-pulse" />
                        ) : (
                          <ImageIcon className="w-6 h-6 text-blue-400 animate-pulse" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <div className="text-sm font-bold text-white truncate">
                          {selectedFile?.name || 'Document'}
                        </div>
                        <div className="text-xs text-blue-300 font-mono mt-0.5">
                          {selectedFile?.size ? formatSize(selectedFile.size) : 'Analyzing...'}
                        </div>
                      </div>
                      <Loader2 className="w-5 h-5 text-cyan-400 animate-spin shrink-0" />
                    </div>

                    {/* Scanning radar indicator */}
                    <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-cyan-300">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                        <span>Scanning Multimodal Gemini Vision</span>
                      </span>
                      <span className="font-mono font-bold">{scanProgress}%</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <h4 className="text-sm sm:text-base font-bold text-white flex items-center justify-center gap-2">
                      <span>Automatically Reading & Scanning File</span>
                    </h4>
                    <p className="text-xs text-cyan-300/90 font-medium">
                      {scanStage}
                    </p>
                  </div>
                </div>
              ) : scanResultSummary ? (
                /* SCAN COMPLETED SUCCESS SCREEN */
                <div className="py-4 space-y-4 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
                    <Check className="w-7 h-7" />
                  </div>

                  <div>
                    <h4 className="text-base sm:text-lg font-bold text-white">
                      File Read & Scanned Successfully!
                    </h4>
                    <p className="text-xs text-slate-300 mt-1">
                      PeakDay automatically generated and applied your plan across all sections.
                    </p>
                  </div>

                  {/* Summary Badges Breakdown */}
                  <div className="grid grid-cols-2 gap-2 text-left pt-2">
                    <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center gap-2.5">
                      <Calendar className="w-4 h-4 text-blue-400 shrink-0" />
                      <div>
                        <div className="text-xs font-bold text-white">
                          {scanResultSummary.scheduleCount} Schedule Event{scanResultSummary.scheduleCount === 1 ? '' : 's'}
                        </div>
                        <div className="text-[10px] text-slate-400">Timetable blocks</div>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center gap-2.5">
                      <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0" />
                      <div>
                        <div className="text-xs font-bold text-white">
                          {scanResultSummary.tasksCount} Task Item{scanResultSummary.tasksCount === 1 ? '' : 's'}
                        </div>
                        <div className="text-[10px] text-slate-400">Deadlines & actions</div>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center gap-2.5">
                      <Dumbbell className="w-4 h-4 text-purple-400 shrink-0" />
                      <div>
                        <div className="text-xs font-bold text-white">
                          {scanResultSummary.workoutCount} Workout Day{scanResultSummary.workoutCount === 1 ? '' : 's'}
                        </div>
                        <div className="text-[10px] text-slate-400">Routine splits & sets</div>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center gap-2.5">
                      <GraduationCap className="w-4 h-4 text-amber-400 shrink-0" />
                      <div>
                        <div className="text-xs font-bold text-white">
                          {scanResultSummary.academicsCount} Academic Unit{scanResultSummary.academicsCount === 1 ? '' : 's'}
                        </div>
                        <div className="text-[10px] text-slate-400">Curriculum & syllabus</div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 flex items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setScanResultSummary(null);
                        setSelectedFile(null);
                        fileInputRef.current?.click();
                      }}
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 flex items-center gap-1.5"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Scan Another File</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveModal(null)}
                      className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 flex items-center gap-1.5 shadow-md shadow-blue-600/30"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Done & View Plan</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* FILE SELECTION SCREEN */
                <div className="space-y-4 pt-3">
                  {/* File Pick Card */}
                  <div className="p-5 rounded-2xl bg-gradient-to-b from-[#101828] to-[#0c121e] border border-blue-500/30 text-center space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-blue-500/20 border border-blue-400/40 text-blue-400 flex items-center justify-center mx-auto shadow-md">
                      <ScanLine className="w-6 h-6 animate-pulse" />
                    </div>

                    <div className="space-y-1">
                      <div className="text-sm font-bold text-white">
                        Choose Timetable, Routine, or Syllabus File
                      </div>
                      <p className="text-xs text-slate-400 max-w-sm mx-auto">
                        PDF timetable, gym split photo, homework rubric, or syllabus document.
                      </p>
                    </div>

                    <button
                      type="button"
                      id="btn-choose-file-scan"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-semibold flex items-center gap-2 mx-auto shadow-lg shadow-blue-600/30 hover:scale-[1.02] transition-all cursor-pointer"
                    >
                      <FileText className="w-4 h-4" />
                      <span>Choose File & Auto-Scan</span>
                    </button>

                    <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1 text-[10px] text-slate-400">
                      <span className="px-2 py-0.5 rounded-full bg-slate-800/80 border border-slate-700">PDF Documents</span>
                      <span className="px-2 py-0.5 rounded-full bg-slate-800/80 border border-slate-700">PNG / JPG Photos</span>
                      <span className="px-2 py-0.5 rounded-full bg-slate-800/80 border border-slate-700">Timetable Grids</span>
                      <span className="px-2 py-0.5 rounded-full bg-slate-800/80 border border-slate-700">Routine Sheets</span>
                    </div>
                  </div>

                  {/* Optional Custom Instructions */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                      Custom Instructions or Focus (Optional)
                    </label>
                    <input
                      type="text"
                      value={fileCustomNotes}
                      onChange={(e) => setFileCustomNotes(e.target.value)}
                      placeholder="e.g. prioritize morning classes, add 90s rest to workouts..."
                      className="w-full bg-[#131b2e] border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-400"
                    />
                  </div>

                  {uploadError && (
                    <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{uploadError}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-end pt-1">
                    <button
                      type="button"
                      onClick={() => setActiveModal(null)}
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
