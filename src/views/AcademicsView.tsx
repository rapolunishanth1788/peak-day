import React, { useState } from 'react';
import { 
  GraduationCap, 
  BookOpen, 
  Sparkles, 
  CheckCircle2, 
  HelpCircle, 
  Calendar, 
  BarChart2, 
  FileText, 
  Plus, 
  ChevronRight, 
  ChevronDown, 
  Send, 
  Star, 
  AlertTriangle, 
  Clock, 
  X, 
  Upload,
  Check,
  Target,
  Edit2,
  Save,
  Award
} from 'lucide-react';
import { 
  Subject, 
  Topic, 
  TopicStatus, 
  AttendanceRecord, 
  QuizQuestion, 
  DoubtSolution, 
  ExamPlan,
  User,
  DocumentAttachment,
  AICopilotAction
} from '../types';
import { api, UserFullData } from '../services/api';
import { SectionAIAssistant } from '../components/SectionAIAssistant';
import { SectionPlanFlow } from '../components/SectionPlanFlow';

interface AcademicsViewProps {
  user?: User;
  data?: UserFullData;
  subjects: Subject[];
  attendance: AttendanceRecord[];
  attachments?: DocumentAttachment[];
  onUpdateUser?: (user: User) => void;
  onUpdateSubject: (subject: Subject) => void;
  onAddSubject: (subject: Omit<Subject, 'id' | 'userId'>) => void;
  onUpdateAttendance: (attendance: AttendanceRecord[]) => void;
  onApplyAction?: (action: AICopilotAction) => void;
  onAddAttachment?: (attachment: DocumentAttachment) => void;
  onDeleteAttachment?: (id: string) => void;
}

export const AcademicsView: React.FC<AcademicsViewProps> = ({
  user,
  data,
  subjects,
  attendance,
  attachments = [],
  onUpdateUser,
  onUpdateSubject,
  onAddSubject,
  onUpdateAttendance,
  onApplyAction,
  onAddAttachment,
  onDeleteAttachment,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'topics' | 'tutor' | 'quiz' | 'doubts' | 'attendance' | 'aiCopilot'>('topics');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(subjects[0]?.id || '');
  const activeSubject = subjects.find((s) => s.id === selectedSubjectId) || subjects[0];

  // What the student wants to study for - state & editor
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [studyingForInput, setStudyingForInput] = useState(user?.studyingFor || user?.studentRole || '');
  const [targetExamDateInput, setTargetExamDateInput] = useState(user?.targetExamDate || '');
  const [targetGpaInput, setTargetGpaInput] = useState(user?.targetGpa || '');
  const [dreamAspirationInput, setDreamAspirationInput] = useState(user?.dreamAspiration || '');
  const [goalSaveSuccess, setGoalSaveSuccess] = useState(false);

  const handleSaveAcademicGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const updated: User = {
      ...user,
      studyingFor: studyingForInput,
      studentRole: studyingForInput,
      targetExamDate: targetExamDateInput,
      targetGpa: targetGpaInput,
      dreamAspiration: dreamAspirationInput,
    };
    if (onUpdateUser) {
      onUpdateUser(updated);
    }
    api.updateProfile(updated);
    setIsEditingGoal(false);
    setGoalSaveSuccess(true);
    setTimeout(() => setGoalSaveSuccess(false), 3000);
  };

  // Syllabus AI Import Modal
  const [showSyllabusModal, setShowSyllabusModal] = useState(false);
  const [syllabusText, setSyllabusText] = useState('');
  const [syllabusLoading, setSyllabusLoading] = useState(false);

  // AI Tutor State
  const [tutorInput, setTutorInput] = useState('');
  const [tutorSubject, setTutorSubject] = useState(activeSubject?.name || 'Computer Science');
  const [tutorTopic, setTutorTopic] = useState('');
  const [tutorLoading, setTutorLoading] = useState(false);
  const [tutorMessages, setTutorMessages] = useState<{ sender: 'user' | 'ai'; text: string }[]>([
    {
      sender: 'ai',
      text: "Hello! I am your Peak AI Personal Academic Tutor. Ask me any conceptual question, request a step-by-step breakdown from first principles, or ask for high-yield exam practice questions.",
    },
  ]);

  // AI Quiz Generator State
  const [quizCount, setQuizCount] = useState<number>(5);
  const [quizDifficulty, setQuizDifficulty] = useState<'easy' | 'medium' | 'hard' | 'mixed'>('mixed');
  const [quizLoading, setQuizLoading] = useState(false);
  const [activeQuiz, setActiveQuiz] = useState<QuizQuestion[] | null>(null);
  const [userAnswers, setUserAnswers] = useState<Record<number, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  // AI Doubt Solver State
  const [doubtText, setDoubtText] = useState('');
  const [doubtLoading, setDoubtLoading] = useState(false);
  const [doubtSolution, setDoubtSolution] = useState<DoubtSolution | null>(null);

  // Update a topic status
  const handleUpdateTopic = (unitId: string, topicId: string, updates: Partial<Topic>) => {
    if (!activeSubject) return;
    const updatedUnits = activeSubject.units.map((unit) => {
      if (unit.id !== unitId) return unit;
      return {
        ...unit,
        topics: unit.topics.map((t) => (t.id === topicId ? { ...t, ...updates } : t)),
      };
    });
    onUpdateSubject({ ...activeSubject, units: updatedUnits });
  };

  // Syllabus import handler
  const handleImportSyllabus = async () => {
    if (!syllabusText.trim()) return;
    setSyllabusLoading(true);
    try {
      const subjects = await api.analyzeSyllabus(syllabusText);
      if (subjects && subjects.length > 0) {
        subjects.forEach((sub: any) => {
          onAddSubject({
            name: sub.name,
            code: sub.code || 'SUB-101',
            createdAt: new Date().toISOString(),
            units: (sub.units || []).map((u: any, uIdx: number) => ({
              id: `u-${Date.now()}-${uIdx}`,
              unitNumber: u.unitNumber || uIdx + 1,
              title: u.title || `Unit ${uIdx + 1}`,
              topics: (u.topics || []).map((t: any, tIdx: number) => ({
                id: `top-${Date.now()}-${uIdx}-${tIdx}`,
                title: typeof t === 'string' ? t : t.title || 'Topic',
                status: 'Not Started' as TopicStatus,
                confidence: 3,
                confidenceLevel: 3,
                difficulty: 'Medium',
              })),
            })),
          });
        });
      }
      setShowSyllabusModal(false);
      setSyllabusText('');
    } catch (err) {
      console.error(err);
    } finally {
      setSyllabusLoading(false);
    }
  };

  // AI Tutor message send
  const handleSendTutor = async (promptToSend?: string) => {
    const query = promptToSend || tutorInput;
    if (!query.trim() || tutorLoading) return;

    const newMessages = [...tutorMessages, { sender: 'user' as const, text: query }];
    setTutorMessages(newMessages);
    setTutorInput('');
    setTutorLoading(true);

    try {
      const response = await api.askTutorAI(
        query,
        tutorSubject,
        tutorTopic || undefined,
        newMessages.slice(-4)
      );
      setTutorMessages([...newMessages, { sender: 'ai', text: response }]);
    } catch (err) {
      setTutorMessages([
        ...newMessages,
        { sender: 'ai', text: 'I encountered an issue processing your query. Please try again.' },
      ]);
    } finally {
      setTutorLoading(false);
    }
  };

  // Generate Quiz
  const handleGenerateQuiz = async () => {
    setQuizLoading(true);
    setUserAnswers({});
    setQuizSubmitted(false);
    try {
      const questions = await api.generateQuiz(
        activeSubject?.name || 'General Engineering',
        undefined,
        tutorTopic || 'Core Principles',
        quizCount,
        quizDifficulty
      );
      setActiveQuiz(questions);
    } catch (err) {
      console.error(err);
    } finally {
      setQuizLoading(false);
    }
  };

  // Solve Doubt
  const handleSolveDoubt = async () => {
    if (!doubtText.trim() || doubtLoading) return;
    setDoubtLoading(true);
    try {
      const sol = await api.solveDoubt(doubtText, activeSubject?.name);
      setDoubtSolution(sol);
    } catch (err) {
      console.error(err);
    } finally {
      setDoubtLoading(false);
    }
  };

  // Calculate overall statistics
  let totalTopics = 0;
  let completedTopics = 0;
  let learningTopics = 0;
  if (activeSubject) {
    activeSubject.units.forEach((u) => {
      u.topics.forEach((t) => {
        totalTopics++;
        if (t.status === 'Completed') completedTopics++;
        if (t.status === 'Learning') learningTopics++;
      });
    });
  }
  const completionPct = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Sub-navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <GraduationCap className="w-7 h-7 text-amber-400" />
            <span>Academics & AI Personal Tutor</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Master your syllabus, solve doubts step-by-step, generate mock exams, and keep attendance safe.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {user && data && onApplyAction && (
            <SectionPlanFlow
              section="academics"
              user={user}
              data={data}
              onApplyAction={onApplyAction}
              onAddAttachment={onAddAttachment}
              onOpenFullAI={() => setActiveSubTab('aiCopilot')}
            />
          )}

          <button
            onClick={() => setActiveSubTab('aiCopilot')}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-600/20 via-orange-600/20 to-yellow-600/20 border border-amber-500/40 hover:border-amber-400 text-amber-300 text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all self-start sm:self-auto hover:scale-[1.02]"
          >
            <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
            <span>AI Academic Copilot</span>
          </button>

          <button
            onClick={() => setShowSyllabusModal(true)}
            className="px-3.5 py-2 rounded-xl bg-amber-600/20 border border-amber-500/40 hover:border-amber-400 text-amber-300 text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all self-start sm:self-auto"
          >
            <Upload className="w-4 h-4 text-amber-400" />
            <span>Upload Syllabus</span>
          </button>
        </div>
      </div>

      {/* Student Study Focus & Target Goal Section */}
      <div className="rounded-2xl bg-gradient-to-r from-[#241708] via-[#1a1105] to-[#120b04] border border-amber-500/30 p-5 shadow-lg relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-amber-500/20">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <span>Academic Study Focus & Aspirations</span>
              </h2>
              <p className="text-xs text-amber-200/70">
                Personalize your study plan, syllabus tracker, and AI tutor for your exact degree and targets.
              </p>
            </div>
          </div>

          {!isEditingGoal && (
            <button
              type="button"
              onClick={() => {
                setStudyingForInput(user?.studyingFor || user?.studentRole || '');
                setTargetExamDateInput(user?.targetExamDate || '');
                setTargetGpaInput(user?.targetGpa || '');
                setDreamAspirationInput(user?.dreamAspiration || '');
                setIsEditingGoal(true);
              }}
              className="px-3.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-amber-200 text-xs font-semibold flex items-center gap-1.5 transition-all self-start sm:self-auto"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Update Study Target</span>
            </button>
          )}
        </div>

        {goalSaveSuccess && (
          <div className="mt-3 p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>Academic study targets saved successfully!</span>
          </div>
        )}

        {!isEditingGoal ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 pt-3.5">
            <div className="p-3 rounded-xl bg-black/30 border border-amber-500/20">
              <span className="text-[10px] uppercase font-bold text-amber-400/80 tracking-wider block">
                Studying For
              </span>
              <p className="text-sm font-bold text-white mt-0.5 truncate">
                {user?.studyingFor || user?.studentRole || 'Not specified yet'}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-black/30 border border-amber-500/20">
              <span className="text-[10px] uppercase font-bold text-amber-400/80 tracking-wider block">
                Target Exam Date
              </span>
              <p className="text-sm font-bold text-white mt-0.5 truncate">
                {user?.targetExamDate || 'Finals / Semester end'}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-black/30 border border-amber-500/20">
              <span className="text-[10px] uppercase font-bold text-amber-400/80 tracking-wider block">
                Target Score / CGPA
              </span>
              <p className="text-sm font-bold text-white mt-0.5 truncate">
                {user?.targetGpa || 'Top Honors / 8.5+'}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-black/30 border border-amber-500/20">
              <span className="text-[10px] uppercase font-bold text-amber-400/80 tracking-wider block">
                Dream Aspiration
              </span>
              <p className="text-sm font-bold text-white mt-0.5 truncate">
                {user?.dreamAspiration || 'Master curriculum & ace exams'}
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSaveAcademicGoal} className="pt-3.5 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-amber-200 mb-1">
                  What are you studying or preparing for?
                </label>
                <input
                  type="text"
                  value={studyingForInput}
                  onChange={(e) => setStudyingForInput(e.target.value)}
                  placeholder="e.g. B.Tech Computer Science, UPSC, USMLE, GATE, or Semester Finals"
                  className="w-full bg-[#131b2e] border border-amber-500/40 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-400"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-amber-200 mb-1">
                  Target Exam Date or Semester Period
                </label>
                <input
                  type="text"
                  value={targetExamDateInput}
                  onChange={(e) => setTargetExamDateInput(e.target.value)}
                  placeholder="e.g. May 2026 or Spring Semester"
                  className="w-full bg-[#131b2e] border border-amber-500/40 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-amber-200 mb-1">
                  Target CGPA, Percentage or Grade Goal
                </label>
                <input
                  type="text"
                  value={targetGpaInput}
                  onChange={(e) => setTargetGpaInput(e.target.value)}
                  placeholder="e.g. 9.2 CGPA or 90% Distinction"
                  className="w-full bg-[#131b2e] border border-amber-500/40 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-amber-200 mb-1">
                  Dream Career, College or Long-Term Goal
                </label>
                <input
                  type="text"
                  value={dreamAspirationInput}
                  onChange={(e) => setDreamAspirationInput(e.target.value)}
                  placeholder="e.g. Software Engineer, Doctor, Graduate School"
                  className="w-full bg-[#131b2e] border border-amber-500/40 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsEditingGoal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-amber-600 hover:bg-amber-500 flex items-center gap-1.5 shadow-md"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Academic Goal</span>
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="p-1 rounded-2xl bg-[#0e1424] border border-slate-800 flex items-center gap-1 overflow-x-auto">
        {[
          { id: 'topics', label: 'Syllabus & Topics', icon: BookOpen },
          { id: 'aiCopilot', label: 'AI Academic Copilot', icon: Sparkles },
          { id: 'tutor', label: 'Peak AI Tutor', icon: Sparkles },
          { id: 'quiz', label: 'Quiz Generator', icon: HelpCircle },
          { id: 'doubts', label: 'Instant Doubt Solver', icon: FileText },
          { id: 'attendance', label: 'Attendance & Thresholds', icon: BarChart2 },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? tab.id === 'aiCopilot'
                    ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-md shadow-amber-600/20'
                    : 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
                  : tab.id === 'aiCopilot'
                  ? 'text-amber-300 hover:text-white bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Icon className={`w-4 h-4 ${tab.id === 'aiCopilot' ? 'text-amber-400 animate-pulse' : ''}`} />
              <span>{tab.label}</span>
              {tab.id === 'aiCopilot' && (
                <span className="px-1 py-0.2 rounded text-[9px] font-bold bg-amber-400/20 text-amber-200">
                  Autonomous
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* DEDICATED AI ACADEMIC COPILOT TAB */}
      {activeSubTab === 'aiCopilot' && user && data && (
        <div className="animate-in fade-in duration-200">
          <SectionAIAssistant
            section="academics"
            user={user}
            data={data}
            onApplyAction={onApplyAction || (() => {})}
          />
        </div>
      )}

      {/* TAB 1: SYLLABUS & TOPIC TRACKER */}
      {activeSubTab === 'topics' && (
        <div className="space-y-5">
          {/* Subject Switcher */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {subjects.map((sub) => (
              <button
                key={sub.id}
                onClick={() => setSelectedSubjectId(sub.id)}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all ${
                  selectedSubjectId === sub.id
                    ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-white shadow-md'
                    : 'bg-[#0e1424] text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {sub.name} ({sub.code || ''})
              </button>
            ))}
          </div>

          {/* Subject Progress Summary Card */}
          {activeSubject && (
            <div className="p-5 rounded-2xl bg-gradient-to-r from-[#241708] to-[#140e06] border border-amber-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
                  Subject Overview
                </span>
                <h3 className="text-xl font-bold text-white mt-0.5">{activeSubject.name}</h3>
                <p className="text-xs text-slate-400 mt-1">
                  {completedTopics} of {totalTopics} topics completed • {learningTopics} in progress
                </p>
              </div>

              <div className="w-full md:w-64 space-y-1.5">
                <div className="flex justify-between text-xs text-amber-300 font-bold">
                  <span>Progress</span>
                  <span>{completionPct}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full transition-all duration-500"
                    style={{ width: `${completionPct}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Units and Topics Accordion */}
          {activeSubject?.units?.map((unit) => (
            <div
              key={unit.id}
              className="rounded-2xl bg-[#0e1424] border border-slate-800/90 overflow-hidden"
            >
              <div className="p-4 bg-slate-900/60 border-b border-slate-800/80 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white">
                    Unit {unit.unitNumber}: {unit.title}
                  </h4>
                  <span className="text-[11px] text-slate-400">
                    {unit.topics.filter((t) => t.status === 'Completed').length} of {unit.topics.length} topics mastered
                  </span>
                </div>
              </div>

              <div className="divide-y divide-slate-800/60">
                {unit.topics.map((topic) => {
                  const statusColors: Record<TopicStatus, string> = {
                    'Not Started': 'bg-slate-800 text-slate-400 border-slate-700',
                    Learning: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
                    Practiced: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
                    Completed: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
                    'Needs Revision': 'bg-amber-500/15 text-amber-400 border-amber-500/30',
                  };

                  return (
                    <div
                      key={topic.id}
                      className="p-3.5 sm:p-4 hover:bg-slate-800/30 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="text-sm font-semibold text-white">{topic.title}</div>
                        <div className="flex items-center gap-3 text-xs text-slate-400">
                          {topic.difficulty && (
                            <span className="text-[11px] text-slate-500">
                              Difficulty: <strong>{topic.difficulty}</strong>
                            </span>
                          )}
                          <div className="flex items-center gap-0.5">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                onClick={() => handleUpdateTopic(unit.id, topic.id, { confidence: star, confidenceLevel: star })}
                                className="text-slate-600 hover:text-amber-400"
                              >
                                <Star
                                  className={`w-3.5 h-3.5 ${
                                    star <= (topic.confidence || topic.confidenceLevel || 0)
                                      ? 'text-amber-400 fill-amber-400'
                                      : 'text-slate-700'
                                  }`}
                                />
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Status Selector & AI Action */}
                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        <select
                          value={topic.status}
                          onChange={(e) =>
                            handleUpdateTopic(unit.id, topic.id, { status: e.target.value as TopicStatus })
                          }
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold border ${
                            statusColors[topic.status]
                          } bg-[#121829] focus:outline-none`}
                        >
                          <option value="Not Started">Not Started</option>
                          <option value="Learning">Learning</option>
                          <option value="Practiced">Practiced</option>
                          <option value="Completed">Completed</option>
                          <option value="Needs Revision">Needs Revision</option>
                        </select>

                        <button
                          onClick={() => {
                            setTutorTopic(topic.title);
                            setTutorSubject(activeSubject.name);
                            setActiveSubTab('tutor');
                            handleSendTutor(`Teach me the core principles and formulas of "${topic.title}" from basics.`);
                          }}
                          className="p-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold flex items-center gap-1"
                          title="Ask Peak AI Tutor about this topic"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                          <span className="hidden sm:inline">Tutor</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 2: PEAK AI PERSONAL TUTOR CHAT */}
      {activeSubTab === 'tutor' && (
        <div className="rounded-2xl bg-[#0e1424] border border-slate-800 p-5 space-y-4 min-h-[500px] flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Peak AI Personal Tutor</h3>
                  <p className="text-[11px] text-slate-400">
                    Subject: {tutorSubject} {tutorTopic ? `• Topic: ${tutorTopic}` : ''}
                  </p>
                </div>
              </div>

              {/* Preset prompt buttons */}
              <div className="hidden lg:flex items-center gap-1.5">
                {[
                  'Explain from basics',
                  'Give practice questions',
                  'Test my knowledge',
                  'Summarize high-yield points',
                ].map((preset) => (
                  <button
                    key={preset}
                    onClick={() => handleSendTutor(`${preset} for ${tutorTopic || tutorSubject}`)}
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Chat History */}
            <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
              {tutorMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-blue-600 text-white ml-auto max-w-[80%]'
                      : 'bg-slate-900 border border-slate-800 text-slate-200 mr-auto max-w-[90%] whitespace-pre-line'
                  }`}
                >
                  {msg.text}
                </div>
              ))}
              {tutorLoading && (
                <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-amber-400 flex items-center gap-2 max-w-xs">
                  <div className="w-4 h-4 border-2 border-amber-400/30 border-t-amber-400 rounded-full animate-spin" />
                  <span>Formulating pedagogical breakdown...</span>
                </div>
              )}
            </div>
          </div>

          {/* Tutor Input Box */}
          <div className="pt-3 border-t border-slate-800">
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Ask any question, or type 'quiz me on this topic'..."
                value={tutorInput}
                onChange={(e) => setTutorInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSendTutor();
                  }
                }}
                className="flex-1 bg-[#131b2e] border border-slate-700/80 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
              <button
                onClick={() => handleSendTutor()}
                disabled={tutorLoading || !tutorInput.trim()}
                className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-md"
              >
                <Send className="w-4 h-4" />
                <span>Send</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: AI QUIZ GENERATOR */}
      {activeSubTab === 'quiz' && (
        <div className="space-y-5">
          <div className="p-5 rounded-2xl bg-[#0e1424] border border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white">AI Adaptive Quiz Generator</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Generate customized practice tests from your syllabus topics to cement retention.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <select
                  value={quizCount}
                  onChange={(e) => setQuizCount(Number(e.target.value))}
                  className="bg-[#131b2e] border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white"
                >
                  <option value={5}>5 Questions</option>
                  <option value={10}>10 Questions</option>
                  <option value={15}>15 Questions</option>
                </select>

                <select
                  value={quizDifficulty}
                  onChange={(e) => setQuizDifficulty(e.target.value as any)}
                  className="bg-[#131b2e] border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                  <option value="mixed">Mixed Difficulty</option>
                </select>

                <button
                  onClick={handleGenerateQuiz}
                  disabled={quizLoading}
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-md flex items-center gap-1.5 disabled:opacity-50"
                >
                  {quizLoading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Generate Quiz</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Active Quiz Form */}
            {activeQuiz ? (
              <div className="space-y-6 pt-2">
                {activeQuiz.map((q, idx) => (
                  <div key={q.id || idx} className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-sm font-semibold text-white">
                        {idx + 1}. {q.question}
                      </h4>
                      {q.difficulty && (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-amber-400 uppercase font-bold border border-slate-700">
                          {q.difficulty}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {(q.options || []).map((opt, optIdx) => {
                        const isSelected = userAnswers[idx] === optIdx;
                        const isCorrect = q.correctIndex !== undefined
                          ? q.correctIndex === optIdx
                          : (q.correctAnswer === opt || q.correctAnswer === String.fromCharCode(65 + optIdx));
                        let btnClass = 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700';

                        if (quizSubmitted) {
                          if (isCorrect) {
                            btnClass = 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300';
                          } else if (isSelected && !isCorrect) {
                            btnClass = 'bg-rose-500/20 border-rose-500/50 text-rose-300';
                          }
                        } else if (isSelected) {
                          btnClass = 'bg-amber-600 text-white border-amber-500';
                        }

                        return (
                          <button
                            key={optIdx}
                            onClick={() => {
                              if (!quizSubmitted) {
                                setUserAnswers({ ...userAnswers, [idx]: optIdx });
                              }
                            }}
                            className={`p-3 rounded-xl border text-xs text-left font-medium transition-all ${btnClass}`}
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </div>

                    {quizSubmitted && q.explanation && (
                      <div className="p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/60 text-xs text-slate-300 leading-relaxed">
                        <strong className="text-amber-400">Explanation:</strong> {q.explanation}
                      </div>
                    )}
                  </div>
                ))}

                <div className="flex justify-between items-center pt-2">
                  {!quizSubmitted ? (
                    <button
                      onClick={() => setQuizSubmitted(true)}
                      className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md"
                    >
                      Submit & Evaluate Answers
                    </button>
                  ) : (
                    <div className="text-sm font-bold text-white flex items-center gap-2">
                      <span>Score:</span>
                      <span className="text-emerald-400">
                        {activeQuiz.reduce((acc, q, idx) => {
                          const uAns = userAnswers[idx];
                          const isCorrect = q.correctIndex !== undefined
                            ? q.correctIndex === uAns
                            : (uAns !== undefined && (q.options?.[uAns] === q.correctAnswer || String.fromCharCode(65 + uAns) === q.correctAnswer));
                          return isCorrect ? acc + 1 : acc;
                        }, 0)} /{' '}
                        {activeQuiz.length}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-slate-500">
                Click "Generate Quiz" to test your knowledge on {activeSubject?.name || 'your curriculum'}.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: INSTANT DOUBT SOLVER */}
      {activeSubTab === 'doubts' && (
        <div className="p-5 rounded-2xl bg-[#0e1424] border border-slate-800 space-y-4">
          <div>
            <h3 className="text-base font-bold text-white">Instant Academic Doubt Solver</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Paste any conceptual question or numerical problem. Peak AI breaks it down into Given Information, Strategy, Step-by-Step Proof, and Final Answer.
            </p>
          </div>

          <div className="space-y-2">
            <textarea
              rows={3}
              placeholder="e.g. In a balanced 3-phase star-connected system, if line voltage is 415V, calculate phase voltage and total active power for a power factor of 0.8..."
              value={doubtText}
              onChange={(e) => setDoubtText(e.target.value)}
              className="w-full bg-[#131b2e] border border-slate-700/80 rounded-xl p-3.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />

            <div className="flex justify-end">
              <button
                onClick={handleSolveDoubt}
                disabled={doubtLoading || !doubtText.trim()}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-md flex items-center gap-1.5 disabled:opacity-50"
              >
                {doubtLoading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Solve Step-by-Step</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {doubtSolution && (
            <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-3.5 animate-in fade-in duration-200">
              {doubtSolution.given && (
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Given Data</h4>
                  {Array.isArray(doubtSolution.given) ? (
                    <ul className="list-disc list-inside text-xs text-slate-300 space-y-0.5">
                      {doubtSolution.given.map((g: any, i: number) => (
                        <li key={i}>{String(g)}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-slate-300">{String(doubtSolution.given)}</p>
                  )}
                </div>
              )}

              {doubtSolution.approach && (
                <div>
                  <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-1">Approach / Formula</h4>
                  <p className="text-xs text-slate-200">{doubtSolution.approach}</p>
                </div>
              )}

              {doubtSolution.steps && doubtSolution.steps.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-1">Step-by-Step Execution</h4>
                  <div className="space-y-1.5">
                    {doubtSolution.steps.map((st: any, i: number) => {
                      const text = typeof st === 'string'
                        ? st
                        : `${st.stepNumber ? st.stepNumber + '. ' : ''}${st.stepTitle ? st.stepTitle + ': ' : ''}${st.content || ''}`;
                      return (
                        <div key={i} className="p-2 rounded bg-slate-800/80 text-xs text-slate-200 font-mono">
                          {text}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {doubtSolution.finalAnswer && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 font-bold">
                  Final Answer: {doubtSolution.finalAnswer}
                </div>
              )}

              {(doubtSolution.whyItWorks || doubtSolution.whyThisMethodWorks) && (
                <div className="text-xs text-slate-400 italic">
                  <strong>Why this method works:</strong> {doubtSolution.whyItWorks || doubtSolution.whyThisMethodWorks}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 5: ATTENDANCE TRACKER & 75% THRESHOLD WARNINGS */}
      {activeSubTab === 'attendance' && (
        <div className="space-y-4">
          <div className="rounded-2xl bg-[#0e1424] border border-slate-800 p-5 space-y-4">
            <div>
              <h3 className="text-base font-bold text-white">Attendance Tracker</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Monitor your university attendance percentage with proactive 75% threshold safety calculations.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {attendance.map((att) => {
                const pct = att.totalClasses > 0 ? Math.round((att.attendedClasses / att.totalClasses) * 100) : 100;
                const isSafe = pct >= (att.targetPercentage || 75);

                // Calculate how many more classes needed to reach 75%, or how many can be missed
                // (attended + x) / (total + x) >= 0.75  => attended + x >= 0.75*total + 0.75*x => 0.25*x >= 0.75*total - attended
                // x = (0.75 * total - attended) / 0.25
                const target = (att.targetPercentage || 75) / 100;
                const classesNeeded = Math.max(0, Math.ceil((target * att.totalClasses - att.attendedClasses) / (1 - target)));
                
                // If above target, how many can be missed: attended / (total + y) >= target => y = (attended - target*total)/target
                const canMiss = Math.max(0, Math.floor((att.attendedClasses - target * att.totalClasses) / target));

                return (
                  <div
                    key={att.id}
                    className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-white">{att.subjectName}</h4>
                      <span
                        className={`text-xs font-bold px-2.5 py-0.5 rounded-md ${
                          isSafe
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : 'bg-rose-500/15 text-rose-400 border border-rose-500/30 animate-pulse'
                        }`}
                      >
                        {pct}%
                      </span>
                    </div>

                    <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          isSafe ? 'bg-emerald-500' : 'bg-rose-500'
                        }`}
                        style={{ width: `${Math.min(100, pct)}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>Attended: {att.attendedClasses} / {att.totalClasses} classes</span>
                      <span>Target: {att.targetPercentage || 75}%</span>
                    </div>

                    {/* Proactive safety guidance */}
                    <div
                      className={`p-2 rounded-lg text-[11px] ${
                        isSafe
                          ? 'bg-emerald-500/10 text-emerald-300'
                          : 'bg-rose-500/10 text-rose-300 font-semibold'
                      }`}
                    >
                      {isSafe ? (
                        <span>You can safely miss <strong>{canMiss}</strong> more class(es) without falling below 75%.</span>
                      ) : (
                        <span>Warning: You must attend the next <strong>{classesNeeded}</strong> consecutive class(es) to reach 75%.</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Upload Syllabus Modal */}
      {showSyllabusModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-[#0e1424] border border-slate-800 p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">Import Academic Syllabus</h3>
              <button
                onClick={() => setShowSyllabusModal(false)}
                className="p-1 rounded text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Paste your course syllabus text, chapter list, or module outlines. Peak AI will parse subjects, units, topics, and difficulty levels automatically.
            </p>

            <textarea
              rows={6}
              placeholder="e.g. Course: Computer Networks (CS-401)&#10;Unit 1: Physical Layer (Transmission media, Multiplexing, Switching)&#10;Unit 2: Data Link Layer (Framing, Flow control, Error detection)..."
              value={syllabusText}
              onChange={(e) => setSyllabusText(e.target.value)}
              className="w-full bg-[#131b2e] border border-slate-700/80 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 font-mono"
            />

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowSyllabusModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={syllabusLoading || !syllabusText.trim()}
                onClick={handleImportSyllabus}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-amber-600 hover:bg-amber-500 flex items-center gap-1.5 disabled:opacity-50"
              >
                {syllabusLoading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Analyze & Build Curriculum</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
