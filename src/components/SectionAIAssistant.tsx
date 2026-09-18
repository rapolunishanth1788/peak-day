import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  Send, 
  Dumbbell, 
  Calendar, 
  CheckSquare, 
  GraduationCap, 
  RotateCcw, 
  Check, 
  ArrowRight, 
  ExternalLink,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Zap,
  Bot,
  Clock,
  Plus,
  Paperclip,
  Image as ImageIcon,
  FileText,
  File,
  X,
  UploadCloud
} from 'lucide-react';
import { 
  AISectionType, 
  AICopilotAction, 
  AICopilotMessage, 
  AICopilotAttachedFile,
  User, 
  ScheduleEvent, 
  Task, 
  WorkoutPlan, 
  Subject 
} from '../types';
import { api, UserFullData } from '../services/api';

interface SectionAIAssistantProps {
  section: AISectionType;
  user: User;
  data: UserFullData;
  onApplyAction: (action: AICopilotAction) => void;
  onNavigate?: (tab: any) => void;
  isDrawer?: boolean;
  onCloseDrawer?: () => void;
}

const SECTION_METADATA: Record<AISectionType, { title: string; subtitle: string; icon: any; color: string; bgBadge: string }> = {
  workout: {
    title: 'Workout AI Coach',
    subtitle: 'Autonomous fitness strategist: build splits, adjust sets/reps, & log routines',
    icon: Dumbbell,
    color: 'text-purple-400',
    bgBadge: 'bg-purple-500/15 border-purple-500/30 text-purple-300',
  },
  schedule: {
    title: 'Schedule AI Optimizer',
    subtitle: 'Smart timetable coordinator: add classes, reschedule events, & clear conflicts',
    icon: Calendar,
    color: 'text-blue-400',
    bgBadge: 'bg-blue-500/15 border-blue-500/30 text-blue-300',
  },
  tasks: {
    title: 'Task AI Strategist',
    subtitle: 'Productivity copilot: prioritize backlog, break down projects, & schedule deadlines',
    icon: CheckSquare,
    color: 'text-emerald-400',
    bgBadge: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300',
  },
  academics: {
    title: 'Academic AI Professor',
    subtitle: 'Personal university mentor: clarify concepts, build curriculum, & target exam goals',
    icon: GraduationCap,
    color: 'text-amber-400',
    bgBadge: 'bg-amber-500/15 border-amber-500/30 text-amber-300',
  },
  global: {
    title: 'Peak AI Copilot',
    subtitle: 'Unified life & study orchestrator with real-time execution across all areas',
    icon: Sparkles,
    color: 'text-cyan-400',
    bgBadge: 'bg-cyan-500/15 border-cyan-500/30 text-cyan-300',
  },
};

const PROMPT_SUGGESTIONS: Record<AISectionType, string[]> = {
  workout: [
    'Switch my plan to a 4-day Push Pull Legs split',
    'Add an Upper Body Hypertrophy routine to my workout plan',
    'Add 4 sets of Barbell Squats & Leg Press to Leg Day',
    'Reschedule today’s workout to tomorrow',
  ],
  schedule: [
    'Add Physics Class every Mon & Wed at 10:00 AM',
    'Find a 2-hour deep focus study block before 6 PM',
    'Move my gym session to 6:30 PM today',
    'Clear all commitments after 5 PM this Friday',
  ],
  tasks: [
    'Break down "Complete Final Project" into actionable subtasks',
    'Add high-priority task "Revise Operating Systems" due tomorrow',
    'Prioritize my study tasks for high-yield impact',
    'Add daily 30-minute revision habits for this week',
  ],
  academics: [
    'Explain Gradient Descent and Backpropagation intuitively',
    'Add a new subject "Data Structures & Algorithms" with 3 core units',
    'How many classes can I safely miss while staying above 75%?',
    'Create an exam preparation timeline for my upcoming finals',
  ],
  global: [
    'Analyze my workload and suggest a balanced daily schedule',
    'I have midterms next week: prepare study blocks and lighten workouts',
    'Add my university lecture at 11 AM and schedule 45 mins gym afterward',
    'Set up a high-performance routine based on my goals',
  ],
};

export const SectionAIAssistant: React.FC<SectionAIAssistantProps> = ({
  section,
  user,
  data,
  onApplyAction,
  onNavigate,
  isDrawer = false,
  onCloseDrawer,
}) => {
  const meta = SECTION_METADATA[section] || SECTION_METADATA.global;
  const Icon = meta.icon;

  const [activeSection, setActiveSection] = useState<AISectionType>(section);
  const [messages, setMessages] = useState<AICopilotMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [autoApply, setAutoApply] = useState(false);
  const [appliedActionIds, setAppliedActionIds] = useState<Record<string, boolean>>({});
  const [expandedActionIds, setExpandedActionIds] = useState<Record<string, boolean>>({});

  // File Upload State
  const [attachedFiles, setAttachedFiles] = useState<AICopilotAttachedFile[]>([]);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Sync activeSection prop changes
  useEffect(() => {
    setActiveSection(section);
  }, [section]);

  // Initial welcome message per section
  useEffect(() => {
    if (messages.length === 0) {
      const welcomeMap: Record<AISectionType, string> = {
        workout: `Hello ${user.name.split(' ')[0]}! I am your dedicated **Workout AI Coach**. I can help you craft hyper-targeted training splits, add exercises, update sets and weights, or log completed sessions. You can also upload workout split screenshots or gym logs (PNG, PDF) for me to calibrate!`,
        schedule: `Hello ${user.name.split(' ')[0]}! I am your **Schedule AI Optimizer**. I can analyze your timetable, add classes or study sessions, move workouts, or clear conflicts automatically. Upload timetable photos or syllabi (PNG, PDF) anytime!`,
        tasks: `Hello ${user.name.split(' ')[0]}! I am your **Task AI Strategist**. I can break down large projects into bite-sized steps, prioritize urgent deadlines, or add new tasks directly to your board. Feel free to upload project rubrics or assignment sheets!`,
        academics: `Greetings ${user.name.split(' ')[0]}! I am your **Academic AI Professor**. I can break down complex university concepts, structure course syllabi, build exam schedules, and optimize attendance targets. You can upload textbook chapters or syllabus PDFs!`,
        global: `Hello ${user.name.split(' ')[0]}! I am **Peak AI Copilot**. I coordinate across your schedule, workout plan, tasks, and academics. Upload any schedule photo, syllabus PDF, or workout routine to auto-configure your system!`,
      };

      setMessages([
        {
          id: `msg_init_${Date.now()}`,
          sender: 'assistant',
          text: welcomeMap[activeSection],
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }
  }, [activeSection, user.name]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // File Processing Handlers
  const processFiles = async (fileList: FileList | File[]) => {
    setFileError(null);
    const newFiles: AICopilotAttachedFile[] = [];
    const filesArray = Array.from(fileList);

    for (const file of filesArray) {
      // 15MB file limit
      if (file.size > 15 * 1024 * 1024) {
        setFileError(`File "${file.name}" exceeds 15MB limit.`);
        continue;
      }

      try {
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        newFiles.push({
          id: `file_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          name: file.name,
          type: file.type || (file.name.endsWith('.pdf') ? 'application/pdf' : 'image/png'),
          size: file.size,
          base64,
        });
      } catch (err) {
        console.error('Error reading file:', file.name, err);
        setFileError(`Failed to read "${file.name}". Please try another file.`);
      }
    }

    if (newFiles.length > 0) {
      setAttachedFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
      e.target.value = '';
    }
  };

  const handleRemoveFile = (id: string) => {
    setAttachedFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Drag & Drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if ((!text && attachedFiles.length === 0) || loading) return;

    const outgoingFiles = [...attachedFiles];
    const defaultText = outgoingFiles.length > 0 
      ? (text || `Please analyze the ${outgoingFiles.length} attached file(s) and extract actionable updates.`) 
      : text;

    const userMsg: AICopilotMessage = {
      id: `msg_user_${Date.now()}`,
      sender: 'user',
      text: defaultText,
      files: outgoingFiles.length > 0 ? outgoingFiles : undefined,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setAttachedFiles([]);
    setFileError(null);
    setLoading(true);

    try {
      const history = messages.map((m) => ({
        role: m.sender === 'user' ? 'user' : 'assistant',
        content: m.text,
      }));

      const res = await api.askCopilot(activeSection, defaultText, data, history, outgoingFiles.length > 0 ? outgoingFiles : undefined);

      const assistantMsg: AICopilotMessage = {
        id: `msg_ai_${Date.now()}`,
        sender: 'assistant',
        text: res.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actions: res.actions,
        groundingSources: res.groundingSources,
      };

      setMessages((prev) => [...prev, assistantMsg]);

      // If auto-apply is enabled and actions were generated, apply them immediately
      if (autoApply && res.actions && res.actions.length > 0) {
        res.actions.forEach((act) => {
          onApplyAction(act);
          setAppliedActionIds((prev) => ({ ...prev, [act.id]: true }));
        });
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `msg_err_${Date.now()}`,
          sender: 'assistant',
          text: `I encountered a problem processing that request: ${err.message || 'Please check your connection and try again.'}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteAction = (action: AICopilotAction) => {
    onApplyAction(action);
    setAppliedActionIds((prev) => ({ ...prev, [action.id]: true }));
  };

  const toggleExpandAction = (id: string) => {
    setExpandedActionIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const clearChat = () => {
    setMessages([]);
  };

  return (
    <div 
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative flex flex-col bg-[#0b101e]/90 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-md ${isDrawer ? 'h-full' : 'h-[640px]'}`}
    >
      {/* Drag & Drop Visual Backdrop */}
      <AnimatePresence>
        {isDraggingOver && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-blue-950/85 backdrop-blur-md border-2 border-dashed border-blue-400 rounded-3xl flex flex-col items-center justify-center p-6 text-center pointer-events-none"
          >
            <div className="w-16 h-16 rounded-2xl bg-blue-500/20 border border-blue-400/40 flex items-center justify-center text-blue-300 mb-3 animate-bounce">
              <UploadCloud className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-white mb-1">Drop Files to Upload</h3>
            <p className="text-xs text-blue-200/80 max-w-xs">
              Upload PNG, JPG, or PDF files to analyze with {meta.title} (timetables, syllabus, workout splits, assignments)
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Bar */}
      <div className="p-4 sm:p-5 border-b border-slate-800/80 bg-gradient-to-r from-slate-900/90 via-[#0e1529]/90 to-slate-900/90 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border shadow-md ${meta.bgBadge}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white truncate">{meta.title}</h2>
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Active Copilot</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 truncate">{meta.subtitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Section Selector Pills */}
          <div className="hidden lg:flex items-center bg-slate-900/90 border border-slate-800 rounded-xl p-1 text-[11px]">
            {(['workout', 'schedule', 'tasks', 'academics', 'global'] as AISectionType[]).map((sec) => (
              <button
                key={sec}
                onClick={() => setActiveSection(sec)}
                className={`px-2.5 py-1 rounded-lg capitalize font-medium transition-all ${
                  activeSection === sec
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {sec}
              </button>
            ))}
          </div>

          {/* Auto-apply toggle */}
          <label className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-800/60 border border-slate-700/60 text-[11px] text-slate-300 cursor-pointer select-none hover:bg-slate-800 transition-colors">
            <input
              type="checkbox"
              checked={autoApply}
              onChange={(e) => setAutoApply(e.target.checked)}
              className="w-3.5 h-3.5 rounded bg-slate-900 border-slate-700 text-blue-500 focus:ring-0 focus:ring-offset-0 cursor-pointer"
            />
            <span className="flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-400" />
              <span>Auto-apply</span>
            </span>
          </label>

          <button
            onClick={clearChat}
            title="Reset conversation"
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {isDrawer && onCloseDrawer && (
            <button
              onClick={onCloseDrawer}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800/80 border border-slate-700/60 transition-colors"
            >
              Done
            </button>
          )}
        </div>
      </div>

      {/* Suggested Action Chips */}
      <div className="px-4 py-2.5 bg-[#090d18]/70 border-b border-slate-800/60 flex items-center gap-2 overflow-x-auto no-scrollbar text-xs">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="px-3 py-1 rounded-full bg-blue-600/25 hover:bg-blue-600/40 border border-blue-500/40 text-blue-300 hover:text-white whitespace-nowrap text-[11px] font-bold transition-all shrink-0 flex items-center gap-1.5 shadow-sm"
        >
          <Paperclip className="w-3 h-3 text-blue-400" />
          <span>Upload PNG / PDF</span>
        </button>

        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider shrink-0 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-blue-400" />
          <span>Quick actions:</span>
        </span>
        {PROMPT_SUGGESTIONS[activeSection].map((suggestion, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(suggestion)}
            className="px-3 py-1 rounded-full bg-slate-800/70 hover:bg-blue-600/20 hover:border-blue-500/40 border border-slate-700/60 text-slate-300 hover:text-blue-300 whitespace-nowrap text-[11px] font-medium transition-all shrink-0"
          >
            {suggestion}
          </button>
        ))}
      </div>

      {/* Messages Stream */}
      <div className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-4">
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div className="flex items-center gap-1.5 mb-1 px-1 text-[11px] text-slate-500">
                {msg.sender === 'assistant' ? (
                  <>
                    <Bot className="w-3 h-3 text-blue-400" />
                    <span className="font-semibold text-slate-400">{meta.title}</span>
                  </>
                ) : (
                  <span className="font-semibold text-slate-400">You</span>
                )}
                <span>•</span>
                <span>{msg.timestamp}</span>
              </div>

              {/* Message Bubble */}
              <div
                className={`max-w-[88%] sm:max-w-[80%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-br-none shadow-md shadow-blue-500/10'
                    : 'bg-[#12192e] border border-slate-800 text-slate-200 rounded-bl-none shadow-lg'
                }`}
              >
                {/* Attached Files inside Message Bubble */}
                {msg.files && msg.files.length > 0 && (
                  <div className="mb-2.5 flex flex-wrap gap-2">
                    {msg.files.map((file) => (
                      <div
                        key={file.id}
                        className={`flex items-center gap-2 p-1.5 pr-2.5 rounded-xl text-[11px] font-medium border shadow-sm ${
                          msg.sender === 'user'
                            ? 'bg-blue-700/60 border-blue-400/30 text-white'
                            : 'bg-slate-800/90 border-slate-700 text-slate-200'
                        }`}
                      >
                        {file.type?.includes('pdf') ? (
                          <div className="w-7 h-7 rounded-lg bg-rose-500/20 border border-rose-500/30 text-rose-300 flex items-center justify-center shrink-0">
                            <FileText className="w-3.5 h-3.5" />
                          </div>
                        ) : (
                          <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 flex items-center justify-center shrink-0 overflow-hidden">
                            {file.base64?.startsWith('data:image') ? (
                              <img src={file.base64} alt={file.name} className="w-full h-full object-cover" />
                            ) : (
                              <ImageIcon className="w-3.5 h-3.5" />
                            )}
                          </div>
                        )}
                        <div className="min-w-0 max-w-[130px] sm:max-w-[170px]">
                          <p className="truncate font-semibold text-[11px]">{file.name}</p>
                          <span className="text-[10px] opacity-75">{formatFileSize(file.size)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="whitespace-pre-wrap space-y-2">
                  {msg.text}
                </div>

                {/* Grounding Web Sources if present */}
                {msg.groundingSources && msg.groundingSources.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-800/80 space-y-1.5">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <span>Search Grounding Sources:</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {msg.groundingSources.map((source, sIdx) => (
                        <a
                          key={sIdx}
                          href={source.uri}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800/80 hover:bg-slate-700 text-[10px] text-blue-400 hover:text-blue-300 border border-slate-700 transition-colors"
                        >
                          <span className="truncate max-w-[140px]">{source.title || 'Source'}</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Proposed Real Executable Actions Cards */}
              {msg.actions && msg.actions.length > 0 && (
                <div className="w-full max-w-[92%] sm:max-w-[85%] mt-3 space-y-2.5 pl-2">
                  <div className="text-[11px] font-bold text-blue-400 flex items-center gap-1.5 uppercase tracking-wider">
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    <span>Proposed System Changes ({msg.actions.length}):</span>
                  </div>

                  {msg.actions.map((action) => {
                    const isApplied = appliedActionIds[action.id];
                    const isExpanded = expandedActionIds[action.id];

                    return (
                      <div
                        key={action.id}
                        className={`p-3.5 rounded-2xl border transition-all ${
                          isApplied
                            ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-200'
                            : 'bg-[#10172b] border-blue-500/30 hover:border-blue-500/60 shadow-lg'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-500/15 border border-blue-500/30 text-blue-300">
                                {action.type.replace(/_/g, ' ')}
                              </span>
                              {isApplied && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                                  <Check className="w-3 h-3" />
                                  <span>Applied to {action.type.includes('WORKOUT') ? 'Workout' : action.type.includes('SCHEDULE') ? 'Schedule' : 'Tasks'}</span>
                                </span>
                              )}
                            </div>
                            <p className="text-xs sm:text-sm font-semibold text-white leading-snug">
                              {action.summary}
                            </p>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              onClick={() => toggleExpandAction(action.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                              title="Inspect action details"
                            >
                              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>

                            <button
                              disabled={isApplied}
                              onClick={() => handleExecuteAction(action)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md ${
                                isApplied
                                  ? 'bg-emerald-600/30 text-emerald-300 cursor-default border border-emerald-500/30'
                                  : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/25 active:scale-95'
                              }`}
                            >
                              {isApplied ? (
                                <>
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Applied</span>
                                </>
                              ) : (
                                <>
                                  <Zap className="w-3.5 h-3.5 text-amber-300" />
                                  <span>Apply Changes</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Collapsible Action Details */}
                        {isExpanded && (
                          <div className="mt-3 pt-3 border-t border-slate-800/80 text-[11px] font-mono text-slate-300 bg-[#080d1a] p-2.5 rounded-xl overflow-x-auto max-h-48">
                            <pre>{JSON.stringify(action.data, null, 2)}</pre>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {loading && (
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-[#12192e] border border-slate-800 text-slate-400 text-xs w-fit animate-pulse">
            <div className="w-4 h-4 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
            <span>{meta.title} is thinking and drafting actions...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-3.5 sm:p-4 bg-gradient-to-t from-slate-900 via-[#0b101e] to-[#0b101e] border-t border-slate-800">
        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/png,image/jpeg,image/webp,image/gif,application/pdf,text/plain"
          onChange={handleFileInputChange}
          className="hidden"
        />

        {/* File Error Alert */}
        {fileError && (
          <div className="mb-2.5 px-3 py-2 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between animate-fadeIn">
            <span className="flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              <span>{fileError}</span>
            </span>
            <button
              type="button"
              onClick={() => setFileError(null)}
              className="p-1 rounded text-rose-400 hover:text-white"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Attached Files Tray */}
        {attachedFiles.length > 0 && (
          <div className="mb-2.5 flex items-center gap-2 overflow-x-auto no-scrollbar p-2 bg-[#090e1d] border border-blue-500/30 rounded-2xl">
            <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider px-1.5 shrink-0 flex items-center gap-1">
              <Paperclip className="w-3 h-3" />
              <span>Attached ({attachedFiles.length}):</span>
            </span>

            {attachedFiles.map((file) => (
              <div
                key={file.id}
                className="flex items-center gap-2 pl-2 pr-1.5 py-1 rounded-xl bg-slate-800/90 border border-slate-700/80 text-white text-xs shrink-0 shadow-sm"
              >
                {file.type?.includes('pdf') ? (
                  <FileText className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                ) : (
                  <ImageIcon className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                )}
                <span className="max-w-[120px] truncate text-[11px] font-medium">{file.name}</span>
                <span className="text-[10px] text-slate-400">({formatFileSize(file.size)})</span>
                <button
                  type="button"
                  onClick={() => handleRemoveFile(file.id)}
                  className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-700/60 transition-colors"
                  title="Remove file"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-2.5 py-1 rounded-xl text-[11px] font-semibold text-blue-400 hover:text-blue-300 hover:bg-blue-600/15 border border-blue-500/25 shrink-0 flex items-center gap-1"
            >
              <Plus className="w-3 h-3" />
              <span>Add more</span>
            </button>
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          {/* File Attachment Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={loading}
            className={`p-3 rounded-2xl border transition-all shrink-0 flex items-center justify-center ${
              attachedFiles.length > 0
                ? 'bg-blue-600/20 text-blue-300 border-blue-500/50 shadow-sm shadow-blue-500/10'
                : 'bg-[#12192e] hover:bg-slate-800 text-slate-400 hover:text-slate-200 border-slate-800 hover:border-slate-700'
            }`}
            title="Upload PNG, PDF, or image to AI Copilot"
          >
            <Paperclip className="w-4 h-4" />
          </button>

          <div className="relative flex-1">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder={
                attachedFiles.length > 0
                  ? `Add message or send ${attachedFiles.length} file(s) for instant AI analysis...`
                  : `Ask ${meta.title} or upload PNG/PDF (e.g. "Add 4-day PPL", "Upload timetable")...`
              }
              disabled={loading}
              className="w-full bg-[#12192e] border border-slate-800 focus:border-blue-500 rounded-2xl pl-4 pr-10 py-3 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all shadow-inner"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">
              <Bot className="w-4 h-4" />
            </span>
          </div>

          <button
            type="submit"
            disabled={loading || (!inputMessage.trim() && attachedFiles.length === 0)}
            className="p-3 rounded-2xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:hover:bg-blue-600 text-white font-semibold transition-all shadow-lg shadow-blue-600/20 shrink-0 flex items-center justify-center"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
        <div className="flex items-center justify-between text-[10px] text-slate-500 px-1 pt-2">
          <span>Supports PNG, JPG, PDF attachments. AI actions update records with verification.</span>
          <span className="flex items-center gap-1">
            <Zap className="w-2.5 h-2.5 text-amber-400" />
            <span>Search Grounded with Gemini</span>
          </span>
        </div>
      </div>
    </div>
  );
};
