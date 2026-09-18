import { 
  User, 
  Task, 
  ScheduleEvent, 
  WorkoutPlan, 
  WorkoutSessionLog, 
  Subject, 
  AttendanceRecord, 
  Assignment, 
  Exam, 
  UserSettings, 
  NotificationItem,
  ProposedSchedule,
  ProposedWorkoutPlan,
  QuizQuestion,
  DoubtSolution,
  ExamPreparationPlan,
  DocumentAttachment,
  AICopilotAction,
  AISectionType,
  AICopilotAttachedFile
} from '../types';
import { syncUserToFirestore, saveUserDataToFirestore } from './firebase';

const TOKEN_KEY = 'peakday_auth_token';
const CACHE_KEY_PREFIX = 'peakday_cache_';

export interface UserFullData {
  tasks: Task[];
  schedules: ScheduleEvent[];
  workoutPlans: WorkoutPlan[];
  workoutSessions?: WorkoutSessionLog[];
  workoutLogs?: WorkoutSessionLog[];
  subjects: Subject[];
  attendance: AttendanceRecord[];
  assignments?: Assignment[];
  exams?: Exam[];
  attachments?: DocumentAttachment[];
  settings?: UserSettings;
  notifications: NotificationItem[];
}

function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

function setStoredToken(token: string | null) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(endpoint, {
    ...options,
    headers,
  });

  if (!res.ok) {
    let errorMsg = 'An error occurred';
    try {
      const data = await res.json();
      errorMsg = data.error || data.message || errorMsg;
    } catch {
      errorMsg = `Server error (${res.status})`;
    }
    throw new Error(errorMsg);
  }

  return res.json();
}

export const api = {
  getStoredToken,
  setStoredToken,

  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    const res = await request<{ user: User; token: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setStoredToken(res.token);
    // Asynchronously mirror profile to Google Firestore
    syncUserToFirestore(res.user).catch((e) => console.warn('Firestore sync note:', e));
    return res;
  },

  async register(
    name: string, 
    email: string, 
    password: string, 
    details?: { age?: number; occupation?: 'student' | 'job' | 'both'; primaryGoals?: string; studyingFor?: string }
  ): Promise<{ user: User; token: string }> {
    const res = await request<{ user: User; token: string }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, ...(details || {}) }),
    });
    setStoredToken(res.token);
    // Asynchronously mirror profile to Google Firestore
    syncUserToFirestore(res.user).catch((e) => console.warn('Firestore sync note:', e));
    return res;
  },

  async loginWithGoogle(email?: string, name?: string): Promise<{ user: User; token: string }> {
    const res = await request<{ user: User; token: string }>('/api/auth/google', {
      method: 'POST',
      body: JSON.stringify({ email, name }),
    });
    setStoredToken(res.token);
    // Asynchronously mirror profile to Google Firestore
    syncUserToFirestore(res.user).catch((e) => console.warn('Firestore sync note:', e));
    return res;
  },

  async getCurrentUser(): Promise<User | null> {
    const token = getStoredToken();
    if (!token) return null;
    try {
      const res = await request<{ user: User }>('/api/auth/me');
      return res.user;
    } catch (err) {
      setStoredToken(null);
      return null;
    }
  },

  async updateProfile(updates: Partial<User>): Promise<User> {
    const res = await request<{ user: User }>('/api/auth/update-profile', {
      method: 'POST',
      body: JSON.stringify(updates),
    });
    return res.user;
  },

  logout() {
    setStoredToken(null);
  },

  // Isolated User Data
  async fetchUserData(userId: string): Promise<UserFullData> {
    try {
      const res = await request<{ data: UserFullData }>('/api/data');
      if (res.data) {
        localStorage.setItem(`${CACHE_KEY_PREFIX}${userId}`, JSON.stringify(res.data));
        return res.data;
      }
    } catch (err) {
      console.warn('Network fetch failed, attempting local cache fallback:', err);
    }

    const cached = localStorage.getItem(`${CACHE_KEY_PREFIX}${userId}`);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch {
        // ignore
      }
    }

    return {
      tasks: [],
      schedules: [],
      workoutPlans: [],
      workoutSessions: [],
      workoutLogs: [],
      subjects: [],
      attendance: [],
      assignments: [],
      exams: [],
      settings: {
        theme: 'dark',
        notifyUpcomingClasses: true,
        notifyTasksDue: true,
        notifyWorkoutTime: true,
        dailyDigestTime: '08:00',
        academicGradingSystem: 'gpa10',
        aiDetailLevel: 'balanced',
      },
      notifications: [],
    };
  },

  async getUserData(): Promise<UserFullData> {
    const user = await this.getCurrentUser();
    return this.fetchUserData(user ? user.id : 'anonymous');
  },

  async saveUserData(data: UserFullData): Promise<void> {
    const user = await this.getCurrentUser();
    return this.syncUserData(user ? user.id : 'anonymous', data);
  },

  async syncUserData(userId: string, data: UserFullData): Promise<void> {
    localStorage.setItem(`${CACHE_KEY_PREFIX}${userId}`, JSON.stringify(data));
    // Asynchronously mirror full student state to Google Firestore
    saveUserDataToFirestore(userId, data as any).catch((e) => console.warn('Firestore data sync note:', e));
    try {
      await request('/api/data/sync', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch (err) {
      console.error('Failed to sync to server:', err);
    }
  },

  // AI Services
  async askScheduleAI(prompt: string, existingEvents: ScheduleEvent[], tasks: Task[], targetDate?: string): Promise<ProposedSchedule> {
    const res = await request<{ proposedSchedule: ProposedSchedule }>('/api/ai/schedule-assistant', {
      method: 'POST',
      body: JSON.stringify({ prompt, existingEvents, tasks, targetDate }),
    });
    return res.proposedSchedule;
  },

  async askWorkoutAI(prompt: string, currentPlan: any, equipment?: string, goals?: string, experienceLevel?: string): Promise<ProposedWorkoutPlan> {
    const res = await request<{ proposedWorkout: ProposedWorkoutPlan }>('/api/ai/workout-assistant', {
      method: 'POST',
      body: JSON.stringify({ prompt, currentPlan, equipment, goals, experienceLevel }),
    });
    return res.proposedWorkout;
  },

  async askAcademicTutor(message: string, topic?: string, subject?: string, mode?: string, conversationHistory?: any[]): Promise<string> {
    const res = await request<{ reply: string }>('/api/ai/academic-tutor', {
      method: 'POST',
      body: JSON.stringify({ message, topic, subject, mode, conversationHistory }),
    });
    return res.reply;
  },

  async askTutorAI(message: string, subject?: string, topic?: string, conversationHistory?: any[]): Promise<string> {
    return this.askAcademicTutor(message, topic, subject, 'balanced', conversationHistory);
  },

  async analyzeSyllabus(contentText: string, fileName?: string): Promise<Subject[]> {
    const res = await request<{ subjects: Subject[] }>('/api/ai/syllabus-analyzer', {
      method: 'POST',
      body: JSON.stringify({ contentText, fileName }),
    });
    return res.subjects;
  },

  async generateQuiz(subject: string, unit?: string, topic?: string, count: number = 5, difficulty: string = 'Medium', questionType: string = 'MCQ'): Promise<QuizQuestion[]> {
    const res = await request<{ questions: QuizQuestion[] }>('/api/ai/quiz-generator', {
      method: 'POST',
      body: JSON.stringify({ subject, unit, topic, count, difficulty, questionType }),
    });
    return res.questions;
  },

  async solveDoubt(questionText: string, subjectContext?: string): Promise<DoubtSolution> {
    const res = await request<{ solution: DoubtSolution }>('/api/ai/doubt-solver', {
      method: 'POST',
      body: JSON.stringify({ questionText, subjectContext }),
    });
    return res.solution;
  },

  async planExam(subjectName: string, examDate: string, remainingTopics: string[]): Promise<ExamPreparationPlan> {
    const res = await request<{ plan: ExamPreparationPlan }>('/api/ai/exam-planner', {
      method: 'POST',
      body: JSON.stringify({ subjectName, examDate, remainingTopics }),
    });
    return res.plan;
  },

  async askCopilot(
    section: AISectionType,
    message: string,
    currentData: any,
    conversationHistory?: any[],
    files?: AICopilotAttachedFile[]
  ): Promise<{ reply: string; actions?: AICopilotAction[]; groundingSources?: { title?: string; uri?: string }[] }> {
    const res = await request<{ reply: string; actions?: AICopilotAction[]; groundingSources?: any[] }>('/api/ai/copilot-action', {
      method: 'POST',
      body: JSON.stringify({ section, message, currentData, conversationHistory, files }),
    });
    return res;
  },
};
