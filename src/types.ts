/**
 * PEAK DAY - Core Types
 */

export type AppTheme = 'midnight' | 'deep-ocean' | 'forest' | 'sunset' | 'dark' | 'light';

export interface User {
  id: string;
  name: string;
  email: string;
  age?: number;
  occupation?: 'student' | 'job' | 'both';
  primaryGoals?: string;
  studyingFor?: string;
  targetExamDate?: string;
  targetDailyHours?: number;
  dreamAspiration?: string;
  studentRole?: string; // e.g. "B.Tech Student"
  avatar?: string;
  semester?: string;
  institution?: string;
  targetGpa?: string;
  preferences?: {
    dailyStudyTargetHours?: number;
    workoutDaysGoal?: number;
    minAttendancePercentage?: number;
  };
  settings?: {
    theme?: AppTheme;
    pushNotifications?: boolean;
    autoSyncCalendar?: boolean;
    soundEffects?: boolean;
  };
  createdAt: string;
}

export interface DocumentAttachment {
  id: string;
  userId: string;
  section: 'schedule' | 'tasks' | 'workout' | 'academics';
  fileName: string;
  fileType: 'pdf' | 'png' | 'jpg' | 'other';
  fileData: string;
  fileSize: number;
  uploadedAt: string;
  notes?: string;
}

export type Priority = 'low' | 'medium' | 'high' | 'urgent';

export type TaskCategory = 
  | 'Study' 
  | 'College' 
  | 'Career' 
  | 'Workout' 
  | 'Personal' 
  | 'Projects' 
  | 'Other';

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  userId: string;
  title: string;
  description?: string;
  dueDate: string; // YYYY-MM-DD
  dueTime?: string; // HH:mm
  priority: Priority;
  category: TaskCategory;
  subtasks: Subtask[];
  recurring?: 'none' | 'daily' | 'weekly' | 'weekdays';
  notes?: string;
  completed: boolean;
  completedAt?: string;
  createdAt: string;
}

export type EventCategory = 
  | 'class' 
  | 'study' 
  | 'workout' 
  | 'personal' 
  | 'exam' 
  | 'meeting' 
  | 'reminder';

export interface ScheduleEvent {
  id: string;
  userId: string;
  title: string;
  category: EventCategory;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  dayOfWeek?: number; // 0-6 (Sun-Sat) for recurring
  recurring?: 'none' | 'daily' | 'weekly' | 'weekdays';
  location?: string;
  notes?: string;
  color?: string;
}

export interface ExerciseSet {
  setNumber: number;
  targetReps: number;
  actualReps?: number;
  targetWeightKg: number;
  actualWeightKg?: number;
  completed: boolean;
}

export interface WorkoutExercise {
  id: string;
  name: string;
  targetMuscle: string;
  sets: ExerciseSet[] | number;
  targetSets?: number;
  targetReps?: number;
  targetWeight?: number;
  targetWeightKg?: number;
  restTimeSeconds?: number;
  notes?: string;
}

export type Exercise = WorkoutExercise;

export interface WorkoutDayPlan {
  id: string;
  dayName: string; // e.g. "Monday", "Push Day", "Chest + Triceps"
  dayOfWeek?: number; // 1 = Monday, 2 = Tuesday etc.
  muscleGroups?: string[];
  exercises: WorkoutExercise[];
  isRestDay?: boolean;
}

export interface WorkoutPlan {
  id: string;
  userId: string;
  name: string; // e.g. "PPL Split (4-Day)"
  description?: string;
  days: WorkoutDayPlan[];
  active?: boolean;
}

export interface WorkoutSessionLog {
  id: string;
  userId: string;
  date?: string;
  workoutName?: string;
  dayName: string;
  startedAt?: string;
  finishedAt?: string;
  durationMinutes: number;
  totalVolumeKg: number;
  completedSets?: number;
  completedSetsCount?: number;
  exercises?: {
    name: string;
    targetMuscle: string;
    sets: {
      setNumber: number;
      reps: number;
      weightKg: number;
      completed: boolean;
    }[];
  }[];
  notes?: string;
}

export type WorkoutLog = WorkoutSessionLog;

export type TopicStatus = 
  | 'Not Started' 
  | 'Learning' 
  | 'Practiced' 
  | 'Completed' 
  | 'Needs Revision';

export interface Topic {
  id: string;
  title: string;
  status: TopicStatus;
  notes?: string;
  resources?: string[];
  difficulty?: 'Easy' | 'Medium' | 'Hard';
  confidence?: number;
  confidenceLevel?: number; // 1 - 5
  revisionDate?: string;
  subtopics?: string[];
}

export interface Unit {
  id: string;
  unitNumber: number;
  title: string;
  topics: Topic[];
}

export interface Subject {
  id: string;
  userId: string;
  name: string;
  code?: string;
  instructor?: string;
  professor?: string;
  color?: string;
  targetAttendancePercentage?: number;
  targetGrade?: string;
  units: Unit[];
  createdAt: string;
}

export interface AttendanceRecord {
  id: string;
  userId: string;
  subjectId: string;
  subjectName: string;
  totalClasses: number;
  attendedClasses: number;
  minPercentageRequired?: number; // e.g. 75
  targetPercentage?: number;
}

export interface Assignment {
  id: string;
  userId: string;
  subjectId: string;
  subjectName: string;
  title: string;
  dueDate: string;
  status: 'pending' | 'in_progress' | 'submitted' | 'graded';
  maxMarks?: number;
  scoredMarks?: number;
  notes?: string;
}

export interface Exam {
  id: string;
  userId: string;
  subjectName: string;
  examTitle: string; // e.g. "Midterm 1", "Final Exam"
  examDate: string;
  syllabusCovered: string[];
  totalMarks?: number;
  scoredMarks?: number;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'schedule' | 'task' | 'workout' | 'academic' | 'ai';
  time: string;
  read: boolean;
  actionUrl?: string;
}

export interface UserSettings {
  theme: AppTheme | 'system';
  notifyUpcomingClasses: boolean;
  notifyTasksDue: boolean;
  notifyWorkoutTime: boolean;
  dailyDigestTime: string;
  academicGradingSystem: 'percentage' | 'gpa10' | 'gpa4' | 'letters';
  aiDetailLevel: 'concise' | 'balanced' | 'in_depth';
}

// AI Service Structures
export interface ProposedScheduleEvent {
  title: string;
  category: EventCategory;
  date: string;
  startTime: string;
  endTime: string;
  notes?: string;
}

export interface ProposedSchedule {
  summary: string;
  targetDate: string;
  events: ProposedScheduleEvent[];
}

export interface ProposedWorkoutPlan {
  planName: string;
  splitSummary: string;
  disclaimer: string;
  days: WorkoutDayPlan[];
}

export interface QuizQuestion {
  id: string;
  question: string;
  type?: 'mcq' | 'short_answer' | 'numerical' | 'conceptual';
  options?: string[]; // 4 options for MCQ
  correctAnswer?: string;
  correctIndex?: number;
  explanation?: string;
  difficulty?: string;
  topicRef?: string;
}

export interface QuizResult {
  totalQuestions: number;
  correctCount: number;
  scorePercentage: number;
  weakTopics: string[];
  strongTopics: string[];
  answers: {
    questionId: string;
    question: string;
    userAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
    explanation: string;
  }[];
}

export interface DoubtSolution {
  given: string | string[];
  approach: string;
  steps: ({ stepNumber: number; stepTitle: string; content: string } | string)[];
  finalAnswer: string;
  whyThisMethodWorks?: string;
  whyItWorks?: string;
}

export interface ExamPlanDay {
  dayNumber: number;
  date: string;
  focusTopic: string;
  subtopics: string[];
  estimatedHours: number;
  practiceTasks: string[];
}

export interface ExamPreparationPlan {
  subject: string;
  examDate: string;
  daysRemaining: number;
  dailyPlan: ExamPlanDay[];
  revisionStrategy: string;
}

export type ExamPlan = ExamPreparationPlan;

// ----------------------------------------------------
// DEDICATED AI COPILOT & ACTION SYSTEM TYPES
// ----------------------------------------------------
export type AISectionType = 'workout' | 'schedule' | 'tasks' | 'academics' | 'global';

export type AIActionType = 
  | 'ADD_SCHEDULE_EVENT'
  | 'RESCHEDULE_EVENT'
  | 'DELETE_SCHEDULE_EVENT'
  | 'UPDATE_WORKOUT_PLAN'
  | 'ADD_WORKOUT_DAY'
  | 'LOG_WORKOUT'
  | 'ADD_TASK'
  | 'UPDATE_TASK'
  | 'COMPLETE_TASK'
  | 'ADD_SUBJECT'
  | 'UPDATE_STUDY_GOAL';

export interface AICopilotAction {
  id: string;
  type: AIActionType;
  summary: string;
  data?: any;
  payload?: any;
  status?: 'pending' | 'applied' | 'dismissed';
}

export interface AICopilotAttachedFile {
  id: string;
  name: string;
  type: string;
  size: number;
  base64: string;
}

export interface AICopilotMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  files?: AICopilotAttachedFile[];
  actions?: AICopilotAction[];
  groundingSources?: { title?: string; uri?: string }[];
}

