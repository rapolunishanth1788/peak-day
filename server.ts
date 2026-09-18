import express from 'express';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const PORT = 3000;
const app = express();

app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

// ----------------------------------------------------
// AI Client Setup
// ----------------------------------------------------
let aiClient: GoogleGenAI | null = null;
function getGeminiAI(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// ----------------------------------------------------
// Isolated Multi-User Persistence Engine
// ----------------------------------------------------
const DATA_DIR = path.join(process.cwd(), '.data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
const USERS_FILE = path.join(DATA_DIR, 'users.json');

interface StoredUser {
  id: string;
  name: string;
  email: string;
  password?: string;
  passwordHash?: string;
  studentRole: string;
  avatar?: string;
  semester?: string;
  institution?: string;
  targetGpa?: string;
  occupation?: string;
  age?: number;
  studyingFor?: string;
  primaryGoals?: string;
  createdAt: string;
}

function loadUsers(): StoredUser[] {
  try {
    if (fs.existsSync(USERS_FILE)) {
      const content = fs.readFileSync(USERS_FILE, 'utf-8');
      return JSON.parse(content);
    }
  } catch (err) {
    console.error('Error loading users:', err);
  }
  return [];
}

function saveUsers(users: StoredUser[]) {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving users:', err);
  }
}

function getUserDataFilePath(userId: string) {
  const userDir = path.join(DATA_DIR, 'userdata');
  if (!fs.existsSync(userDir)) {
    fs.mkdirSync(userDir, { recursive: true });
  }
  return path.join(userDir, `${userId}.json`);
}

function getUserData(userId: string) {
  const filePath = getUserDataFilePath(userId);
  if (fs.existsSync(filePath)) {
    try {
      return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    } catch (err) {
      console.error(`Error reading data for user ${userId}:`, err);
    }
  }
  return null;
}

function saveUserData(userId: string, data: any) {
  const filePath = getUserDataFilePath(userId);
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error(`Error saving data for user ${userId}:`, err);
  }
}

function createCleanUserData(userId: string, userName: string) {
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
      academicGradingSystem: 'percentage',
      aiDetailLevel: 'balanced',
    },
    notifications: [
      {
        id: `notif_${Date.now()}`,
        title: `Welcome to PEAK DAY, ${userName.split(' ')[0]}!`,
        message: 'Your personal all-in-one productivity platform is ready. Add your classes, daily tasks, or workouts to get started.',
        type: 'ai',
        time: 'Just now',
        read: false,
      },
    ],
  };
}

// Clean startup - no hardcoded demo accounts or personal credentials
function initializeDefaultData() {
  // Database starts clean for real users
}

initializeDefaultData();

// Helper to authenticate request
function getAuthUser(req: express.Request): StoredUser | null {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;
  const token = authHeader.replace('Bearer ', '').trim();
  if (!token) return null;

  const users = loadUsers();
  // Token can be the user ID or a simulated signed token
  const user = users.find((u) => u.id === token || `token_${u.id}` === token);
  return user || null;
}

// ----------------------------------------------------
// AUTHENTICATION ROUTES
// ----------------------------------------------------
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const users = loadUsers();
  const normalizedEmail = email.trim().toLowerCase();
  const user = users.find((u) => u.email.toLowerCase() === normalizedEmail);

  if (!user) {
    return res.status(404).json({ 
      error: `No account found with email "${normalizedEmail}". Please check your email address or click "Sign up" to create a new account.` 
    });
  }

  // Verify password
  const enteredPassword = password.trim();
  const validPassword = user.password || 'student123';

  if (user.password && user.password !== enteredPassword) {
    return res.status(401).json({ 
      error: 'Incorrect password. Please verify your password and try again.' 
    });
  }

  // If user didn't have password stored before, save it now
  if (!user.password) {
    user.password = enteredPassword;
    saveUsers(users);
  }

  // Ensure isolated user data exists
  if (!getUserData(user.id)) {
    saveUserData(user.id, createCleanUserData(user.id, user.name));
  }

  // Login successful
  res.json({ user, token: user.id });
});

app.post('/api/auth/register', (req, res) => {
  const { name, email, password, age, occupation, primaryGoals, studyingFor } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Full name, email, and password are required' });
  }

  const trimmedPassword = password.trim();
  if (trimmedPassword.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long' });
  }

  const users = loadUsers();
  const normalizedEmail = email.trim().toLowerCase();
  const existing = users.find((u) => u.email.toLowerCase() === normalizedEmail);
  if (existing) {
    return res.status(409).json({ error: 'An account with this email address already exists. Please sign in instead.' });
  }

  const newUserId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const newUser: any = {
    id: newUserId,
    name: name.trim(),
    email: normalizedEmail,
    password: trimmedPassword,
    age: age ? Number(age) : undefined,
    occupation: occupation || 'student',
    primaryGoals: primaryGoals || '',
    studyingFor: studyingFor || '',
    studentRole: occupation === 'job' ? 'Working Professional' : 'Student',
    semester: 'Semester 1',
    createdAt: new Date().toISOString(),
  };

  users.push(newUser);
  saveUsers(users);

  // Initialize clean dataset for this new user with only data they add
  const initialData = createCleanUserData(newUserId, newUser.name);
  saveUserData(newUserId, initialData);

  res.status(201).json({ user: newUser, token: newUser.id });
});

app.post('/api/auth/google', (req, res) => {
  const { email, name, avatar } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Valid Google email is required' });
  }
  const userEmail = email.trim().toLowerCase();
  const userName = (name || userEmail.split('@')[0]).trim();

  const users = loadUsers();
  let user = users.find((u) => u.email.toLowerCase() === userEmail);

  if (!user) {
    const newUserId = `usr_g_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    user = {
      id: newUserId,
      name: userName,
      email: userEmail,
      avatar: avatar || undefined,
      password: 'student123',
      studentRole: 'Student',
      createdAt: new Date().toISOString(),
    };
    users.push(user);
    saveUsers(users);
  }

  // Ensure isolated user data exists with clean data only
  if (!getUserData(user.id)) {
    saveUserData(user.id, createCleanUserData(user.id, user.name));
  }

  res.json({ user, token: user.id });
});

app.get('/api/auth/me', (req, res) => {
  const user = getAuthUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  res.json({ user });
});

app.post('/api/auth/update-profile', (req, res) => {
  const user = getAuthUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { 
    name, 
    age, 
    occupation, 
    primaryGoals, 
    studyingFor, 
    targetExamDate, 
    targetDailyHours, 
    dreamAspiration, 
    studentRole, 
    semester, 
    institution, 
    targetGpa 
  } = req.body;

  const users = loadUsers();
  const idx = users.findIndex((u) => u.id === user.id);
  if (idx !== -1) {
    if (name) users[idx].name = name.trim();
    if (age !== undefined) (users[idx] as any).age = Number(age);
    if (occupation !== undefined) (users[idx] as any).occupation = occupation;
    if (primaryGoals !== undefined) (users[idx] as any).primaryGoals = primaryGoals;
    if (studyingFor !== undefined) (users[idx] as any).studyingFor = studyingFor;
    if (targetExamDate !== undefined) (users[idx] as any).targetExamDate = targetExamDate;
    if (targetDailyHours !== undefined) (users[idx] as any).targetDailyHours = Number(targetDailyHours);
    if (dreamAspiration !== undefined) (users[idx] as any).dreamAspiration = dreamAspiration;
    if (studentRole !== undefined) users[idx].studentRole = studentRole;
    if (semester !== undefined) users[idx].semester = semester;
    if (institution !== undefined) users[idx].institution = institution;
    if (targetGpa !== undefined) users[idx].targetGpa = targetGpa;
    saveUsers(users);
    return res.json({ user: users[idx] });
  }
  res.status(404).json({ error: 'User not found' });
});

// ----------------------------------------------------
// ISOLATED DATA ACCESS ROUTES
// ----------------------------------------------------
app.get('/api/data', (req, res) => {
  const user = getAuthUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized. Please login to access your data.' });
  }

  let data = getUserData(user.id);
  if (!data) {
    data = createCleanUserData(user.id, user.name);
    saveUserData(user.id, data);
  }

  res.json({ data });
});

app.post('/api/data/sync', (req, res) => {
  const user = getAuthUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const incomingData = req.body;
  if (!incomingData || typeof incomingData !== 'object') {
    return res.status(400).json({ error: 'Invalid payload' });
  }

  // Ensure all entities belong strictly to this user
  if (Array.isArray(incomingData.tasks)) {
    incomingData.tasks = incomingData.tasks.map((t: any) => ({ ...t, userId: user.id }));
  }
  if (Array.isArray(incomingData.schedules)) {
    incomingData.schedules = incomingData.schedules.map((s: any) => ({ ...s, userId: user.id }));
  }
  if (Array.isArray(incomingData.workoutPlans)) {
    incomingData.workoutPlans = incomingData.workoutPlans.map((w: any) => ({ ...w, userId: user.id }));
  }
  if (Array.isArray(incomingData.workoutSessions)) {
    incomingData.workoutSessions = incomingData.workoutSessions.map((w: any) => ({ ...w, userId: user.id }));
  }
  if (Array.isArray(incomingData.subjects)) {
    incomingData.subjects = incomingData.subjects.map((sub: any) => ({ ...sub, userId: user.id }));
  }

  saveUserData(user.id, incomingData);
  res.json({ success: true, timestamp: new Date().toISOString() });
});

// ----------------------------------------------------
// PEAK AI SERVICES (SECURE SERVER-SIDE GEMINI API)
// ----------------------------------------------------

// 1. Peak AI Schedule Assistant
app.post('/api/ai/schedule-assistant', async (req, res) => {
  const user = getAuthUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { prompt, existingEvents, tasks, targetDate } = req.body;
  const dateToPlan = targetDate || new Date().toISOString().split('T')[0];
  const ai = getGeminiAI();

  if (!ai) {
    // Intelligent contextual fallback when API key is unconfigured
    const fallbackProposed = {
      summary: `Structured schedule for ${dateToPlan} balancing your study goals, physical training, and personal time.`,
      targetDate: dateToPlan,
      events: [
        { title: 'Morning Focus: Mathematics & Problem Sets', category: 'study', date: dateToPlan, startTime: '08:30', endTime: '10:30', notes: 'Peak cognitive window' },
        { title: 'College Classes & Academic Lectures', category: 'class', date: dateToPlan, startTime: '11:00', endTime: '14:30', notes: 'Core coursework' },
        { title: 'Workout Session (Strength & Conditioning)', category: 'workout', date: dateToPlan, startTime: '17:00', endTime: '18:15', notes: 'Decompress and build strength' },
        { title: 'Assignment Review & Day Planning', category: 'study', date: dateToPlan, startTime: '19:30', endTime: '21:00', notes: 'Daily task wrap-up' },
      ],
    };
    return res.json({ proposedSchedule: fallbackProposed });
  }

  try {
    const systemPrompt = `You are Peak AI, an expert academic and personal time-management AI assistant.
The user wants to plan or optimize their day on date: ${dateToPlan}.
User prompt: "${prompt}".
Existing scheduled events: ${JSON.stringify(existingEvents || [])}
Pending tasks: ${JSON.stringify(tasks || [])}

Analyze their constraints, cognitive energy, commute/meal breaks, study depth, and workout schedule.
Propose a realistic, balanced schedule that will NOT burn the student out.
Return a JSON object with:
- "summary": A concise 1-2 sentence rationale for the schedule.
- "targetDate": "${dateToPlan}"
- "events": Array of proposed events, each with:
  - "title": string
  - "category": one of ["class", "study", "workout", "personal", "exam", "meeting", "reminder"]
  - "date": "${dateToPlan}"
  - "startTime": "HH:mm" (24h format)
  - "endTime": "HH:mm" (24h format)
  - "notes": string optional short advice or rationale`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: systemPrompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json({ proposedSchedule: parsed });
  } catch (err: any) {
    console.error('Schedule AI error:', err);
    res.status(500).json({ error: 'Failed to generate schedule proposal with AI', details: err.message });
  }
});

// 2. Peak AI Workout Assistant
app.post('/api/ai/workout-assistant', async (req, res) => {
  const user = getAuthUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { prompt, currentPlan, equipment, goals, experienceLevel } = req.body;
  const ai = getGeminiAI();

  if (!ai) {
    const fallbackPlan = {
      planName: 'Peak Student 4-Day Strength Split',
      splitSummary: 'An optimal 4-day push/pull/upper/lower routine tailored for busy academic weeks.',
      disclaimer: 'Note: AI-generated workouts provide educational guidance. Adjust weights to your fitness level and consult a healthcare professional prior to vigorous training.',
      days: [
        {
          id: `wd_${Date.now()}_1`,
          dayName: 'Day 1: Chest, Shoulders & Triceps (Push)',
          muscleGroups: ['Chest', 'Shoulders', 'Triceps'],
          exercises: [
            { id: 'ex-fb-1', name: 'Dumbbell Bench Press', targetMuscle: 'Chest', restTimeSeconds: 90, sets: [{ setNumber: 1, targetReps: 10, targetWeightKg: 22, completed: false }, { setNumber: 2, targetReps: 10, targetWeightKg: 24, completed: false }, { setNumber: 3, targetReps: 8, targetWeightKg: 26, completed: false }] },
            { id: 'ex-fb-2', name: 'Overhead Dumbbell Press', targetMuscle: 'Shoulders', restTimeSeconds: 90, sets: [{ setNumber: 1, targetReps: 10, targetWeightKg: 16, completed: false }, { setNumber: 2, targetReps: 8, targetWeightKg: 18, completed: false }] },
            { id: 'ex-fb-3', name: 'Tricep Rope Pushdown', targetMuscle: 'Triceps', restTimeSeconds: 60, sets: [{ setNumber: 1, targetReps: 12, targetWeightKg: 20, completed: false }, { setNumber: 2, targetReps: 10, targetWeightKg: 25, completed: false }] },
          ],
        },
        {
          id: `wd_${Date.now()}_2`,
          dayName: 'Day 2: Back & Biceps (Pull)',
          muscleGroups: ['Back', 'Biceps'],
          exercises: [
            { id: 'ex-fb-4', name: 'Lat Pulldown / Pullups', targetMuscle: 'Lats', restTimeSeconds: 90, sets: [{ setNumber: 1, targetReps: 10, targetWeightKg: 55, completed: false }, { setNumber: 2, targetReps: 8, targetWeightKg: 60, completed: false }] },
            { id: 'ex-fb-5', name: 'Dumbbell Incline Curls', targetMuscle: 'Biceps', restTimeSeconds: 60, sets: [{ setNumber: 1, targetReps: 12, targetWeightKg: 12, completed: false }, { setNumber: 2, targetReps: 10, targetWeightKg: 14, completed: false }] },
          ],
        },
      ],
    };
    return res.json({ proposedWorkout: fallbackPlan });
  }

  try {
    const promptText = `You are Peak AI, a certified strength coach and exercise physiologist.
User prompt: "${prompt}"
Context:
Equipment: ${equipment || 'Standard Gym / Dumbbells'}
Goals: ${goals || 'Hypertrophy & Posture'}
Experience level: ${experienceLevel || 'Intermediate'}
Current workout plan: ${JSON.stringify(currentPlan || {})}

Create a structured workout split proposal. Include exercises, target sets, reps, weight suggestions, and rest time.
Ensure you include a clear educational disclaimer.
Return a valid JSON object matching:
{
  "planName": string,
  "splitSummary": string,
  "disclaimer": "Note: AI-generated workouts provide general educational information...",
  "days": [
    {
      "id": string,
      "dayName": string,
      "muscleGroups": string[],
      "isRestDay": boolean optional,
      "exercises": [
        {
          "id": string,
          "name": string,
          "targetMuscle": string,
          "restTimeSeconds": number,
          "sets": [
            { "setNumber": number, "targetReps": number, "targetWeightKg": number, "completed": false }
          ]
        }
      ]
    }
  ]
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: promptText,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json({ proposedWorkout: parsed });
  } catch (err: any) {
    console.error('Workout AI error:', err);
    res.status(500).json({ error: 'Failed to generate workout proposal', details: err.message });
  }
});

// 3. Peak AI Academic Personal Teacher / Tutor
app.post('/api/ai/academic-tutor', async (req, res) => {
  const user = getAuthUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { message, topic, subject, mode, conversationHistory } = req.body;
  const ai = getGeminiAI();

  if (!ai) {
    let mockReply = `### Peak AI Tutor: ${topic || 'Academic Overview'}\n\nHere is a structured explanation:\n\n1. **Core Concept**: Understanding this requires breaking down foundational definitions and seeing how they relate to the broader course structure in **${subject || 'your curriculum'}**.\n2. **Key Intuition**: Think of this concept as a transformation or mapping where invariant properties remain constant under specific operations.\n3. **Quick Example**: If given a standard matrix or problem statement, the first step is always checking dimensions and verifying preconditions.\n4. **Next Steps**: Would you like to try 3 quick practice questions to test your grasp, or explore step-by-step proofs?`;
    return res.json({ reply: mockReply });
  }

  try {
    const tutorPrompt = `You are Peak AI Tutor, an exceptional, patient, and intellectually rigorous personal university professor and tutor for ${user.name}.
Subject: ${subject || 'General STEM / Computer Science'}
Topic: ${topic || 'Course Topic'}
Teaching Mode: ${mode || 'explaining'} (Modes: explaining, summarizing, practice, testing, doubt solving, revision)

Conversation History:
${JSON.stringify(conversationHistory || [])}

User says:
"${message}"

Instructions:
- If mode is 'explaining': Provide an intuitive, crystal-clear explanation with a real-world analogy, step-by-step breakdown, and common mistakes students make.
- If mode is 'summarizing': Provide high-yield bullet points, formulas, and key theorems.
- If mode is 'practice': Present 2-3 graded practice questions with hints.
- If mode is 'testing': Present a question and wait for the student's answer before grading.
- Format beautifully with markdown, bolding, lists, and LaTeX / mathematical notation where relevant.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: tutorPrompt,
    });

    res.json({ reply: response.text });
  } catch (err: any) {
    console.error('Academic Tutor error:', err);
    res.status(500).json({ error: 'Failed to get tutor response', details: err.message });
  }
});

// 4. Syllabus / Course Material Analyzer
app.post('/api/ai/syllabus-analyzer', async (req, res) => {
  const user = getAuthUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { contentText, fileName } = req.body;
  const ai = getGeminiAI();

  if (!ai) {
    // Intelligent fallback parsing
    const fallbackSubjects = [
      {
        id: `sub_${Date.now()}_1`,
        userId: user.id,
        name: 'Extracted Course: Systems & Mathematics',
        code: 'CS301',
        targetGrade: 'A',
        createdAt: new Date().toISOString(),
        units: [
          {
            id: `u_${Date.now()}_1`,
            unitNumber: 1,
            title: 'Unit 1: Fundamentals & Core Equations',
            topics: [
              { id: `t_${Date.now()}_1`, title: 'Introduction & Foundations', status: 'Not Started', difficulty: 'Easy', confidenceLevel: 1 },
              { id: `t_${Date.now()}_2`, title: 'Theorems & Analytical Proofs', status: 'Not Started', difficulty: 'Medium', confidenceLevel: 1 },
              { id: `t_${Date.now()}_3`, title: 'Practical Applications', status: 'Not Started', difficulty: 'Hard', confidenceLevel: 1 },
            ],
          },
          {
            id: `u_${Date.now()}_2`,
            unitNumber: 2,
            title: 'Unit 2: Advanced Topics & Case Studies',
            topics: [
              { id: `t_${Date.now()}_4`, title: 'System Architectures', status: 'Not Started', difficulty: 'Medium', confidenceLevel: 1 },
              { id: `t_${Date.now()}_5`, title: 'Performance Optimization & Benchmarking', status: 'Not Started', difficulty: 'Hard', confidenceLevel: 1 },
            ],
          },
        ],
      },
    ];
    return res.json({ subjects: fallbackSubjects });
  }

  try {
    const prompt = `You are Peak AI Syllabus Analyzer. Analyze the following university syllabus or course outline text from file "${fileName || 'syllabus.pdf'}":
"""
${contentText.substring(0, 15000)}
"""

Extract structured subjects, units, topics, and subtopics.
Return a JSON array of subjects matching this schema:
[
  {
    "id": "sub_gen_1",
    "name": "Subject Name",
    "code": "Course Code if available",
    "units": [
      {
        "id": "u_gen_1",
        "unitNumber": 1,
        "title": "Unit Title",
        "topics": [
          {
            "id": "t_gen_1",
            "title": "Topic Name",
            "status": "Not Started",
            "difficulty": "Easy" | "Medium" | "Hard",
            "confidenceLevel": 1,
            "subtopics": ["Subtopic 1", "Subtopic 2"]
          }
        ]
      }
    ]
  }
]`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '[]');
    res.json({ subjects: parsed });
  } catch (err: any) {
    console.error('Syllabus analyzer error:', err);
    res.status(500).json({ error: 'Failed to analyze syllabus', details: err.message });
  }
});

// 5. AI Quiz Generator
app.post('/api/ai/quiz-generator', async (req, res) => {
  const user = getAuthUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { subject, unit, topic, count, difficulty, questionType } = req.body;
  const numQuestions = count || 5;
  const diff = difficulty || 'Medium';
  const qType = questionType || 'MCQ';
  const ai = getGeminiAI();

  if (!ai) {
    const mockQuestions = Array.from({ length: numQuestions }, (_, i) => ({
      id: `q_${Date.now()}_${i}`,
      question: `Question ${i + 1} regarding ${topic || subject}: What is the primary characteristic or consequence of this concept?`,
      type: 'mcq',
      options: [
        'A) It preserves invariant properties under basis transformation',
        'B) It reduces asymptotic complexity by half',
        'C) It produces an orthogonal subspace projection',
        'D) It minimizes entropy across all states',
      ],
      correctAnswer: 'A) It preserves invariant properties under basis transformation',
      explanation: 'In linear algebra and systemic analysis, the characteristic equation directly reveals invariant eigenvalues under change of basis.',
      topicRef: topic || subject,
    }));
    return res.json({ questions: mockQuestions });
  }

  try {
    const prompt = `Generate an academic quiz with ${numQuestions} questions for student ${user.name}.
Subject: ${subject}
Unit: ${unit || 'All'}
Topic: ${topic || 'Core curriculum'}
Difficulty: ${diff}
Question Type: ${qType} (Options: MCQ, Short answer, Numerical, Conceptual, or Mixed)

Rules:
- For MCQ: provide exactly 4 distinct options labeled "A) ...", "B) ...", "C) ...", "D) ...".
- "correctAnswer" must match the exact correct option string.
- Provide a clear, educational "explanation" that teaches why the answer is correct and why other choices are traps.
Return a JSON array of questions:
[
  {
    "id": string,
    "question": string,
    "type": "mcq" | "short_answer" | "numerical" | "conceptual",
    "options": ["A) ...", "B) ...", "C) ...", "D) ..."],
    "correctAnswer": string,
    "explanation": string,
    "topicRef": string
  }
]`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const questions = JSON.parse(response.text || '[]');
    res.json({ questions });
  } catch (err: any) {
    console.error('Quiz generator error:', err);
    res.status(500).json({ error: 'Failed to generate quiz', details: err.message });
  }
});

// 6. Doubt Solver with Step-by-Step Breakdown
app.post('/api/ai/doubt-solver', async (req, res) => {
  const user = getAuthUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { questionText, subjectContext } = req.body;
  const ai = getGeminiAI();

  if (!ai) {
    const fallbackSolution = {
      given: 'Problem statement provided in question query regarding ' + (subjectContext || 'Coursework'),
      approach: 'Identify standard boundary conditions, apply transformation equations, and isolate unknown variables systematically.',
      steps: [
        { stepNumber: 1, stepTitle: 'Setup & Assumptions', content: 'Write down the given parameters and verify unit consistency.' },
        { stepNumber: 2, stepTitle: 'Apply Primary Governing Formula', content: 'Substitute values into the fundamental characteristic equation.' },
        { stepNumber: 3, stepTitle: 'Algebraic Simplification', content: 'Carry out arithmetic operations while tracking signs and intermediate constants.' },
      ],
      finalAnswer: 'Computed final numerical or conceptual result with appropriate units.',
      whyThisMethodWorks: 'This method isolates the variable using linear independence principles, preventing cascading calculation errors.',
    };
    return res.json({ solution: fallbackSolution });
  }

  try {
    const prompt = `You are Peak AI Doubt Solver.
Subject context: ${subjectContext || 'STEM & Engineering'}
Question from student:
"""
${questionText}
"""

Solve the problem step-by-step. Do not merely give an answer — teach the student how to think through it.
For mathematical and analytical problems, format your response as JSON matching:
{
  "given": "Clear breakdown of what is provided and what needs to be solved",
  "approach": "High level strategy and rationale for choosing this method",
  "steps": [
    {
      "stepNumber": 1,
      "stepTitle": "Step heading",
      "content": "Detailed calculation or reasoning"
    }
  ],
  "finalAnswer": "The exact final simplified answer",
  "whyThisMethodWorks": "Pedagogical explanation of the underlying intuition"
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const solution = JSON.parse(response.text || '{}');
    res.json({ solution });
  } catch (err: any) {
    console.error('Doubt solver error:', err);
    res.status(500).json({ error: 'Failed to solve doubt', details: err.message });
  }
});

// 7. Exam Planner
app.post('/api/ai/exam-planner', async (req, res) => {
  const user = getAuthUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { subjectName, examDate, remainingTopics } = req.body;
  const targetDate = examDate || new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0];
  const ai = getGeminiAI();

  if (!ai) {
    const fallbackPlan = {
      subject: subjectName || 'Engineering Mathematics',
      examDate: targetDate,
      daysRemaining: 7,
      revisionStrategy: 'Spaced repetition with 70% active recall / problem solving and 30% theory review.',
      dailyPlan: [
        { dayNumber: 1, date: 'Day 1', focusTopic: 'Foundations & High-Weightage Unit 1', subtopics: ['Definitions', 'Key Proofs'], estimatedHours: 2.5, practiceTasks: ['Solve 5 textbook problems'] },
        { dayNumber: 2, date: 'Day 2', focusTopic: 'Core Theorems & Matrix Diagonalization', subtopics: ['Eigenvalues', 'Transformations'], estimatedHours: 3.0, practiceTasks: ['Previous year questions'] },
        { dayNumber: 3, date: 'Day 3', focusTopic: 'Unit 2: Calculus & Jacobians', subtopics: ['Partial derivatives', 'Extrema'], estimatedHours: 3.0, practiceTasks: ['Formula sheet summary'] },
        { dayNumber: 4, date: 'Day 4', focusTopic: 'Weak Spots & Doubt Resolution', subtopics: ['Review mistakes from Day 1-3'], estimatedHours: 2.0, practiceTasks: ['Timed 30-minute quiz'] },
        { dayNumber: 5, date: 'Day 5', focusTopic: 'Full Mock Test & Time Management', subtopics: ['Simulated exam condition'], estimatedHours: 3.5, practiceTasks: ['Full paper review'] },
      ],
    };
    return res.json({ plan: fallbackPlan });
  }

  try {
    const prompt = `You are Peak AI Exam Prep Strategist.
Create a structured day-by-day revision and study roadmap for student ${user.name}.
Subject: ${subjectName}
Exam Date: ${targetDate}
Remaining topics: ${JSON.stringify(remainingTopics || ['Core curriculum units'])}

Return a JSON object:
{
  "subject": "${subjectName}",
  "examDate": "${targetDate}",
  "daysRemaining": number,
  "revisionStrategy": "string explaining the psychological and academic strategy",
  "dailyPlan": [
    {
      "dayNumber": number,
      "date": string,
      "focusTopic": string,
      "subtopics": string[],
      "estimatedHours": number,
      "practiceTasks": string[]
    }
  ]
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const plan = JSON.parse(response.text || '{}');
    res.json({ plan });
  } catch (err: any) {
    console.error('Exam planner error:', err);
    res.status(500).json({ error: 'Failed to generate exam plan', details: err.message });
  }
});

// ----------------------------------------------------
// 6. Dedicated Section AI Assistant & Action Engine
// Allows AI to converse, advise, and MAKE REAL CHANGES
// to Schedules, Workout Plans, Tasks, & Academics
// ----------------------------------------------------
app.post('/api/ai/copilot-action', async (req, res) => {
  const user = getAuthUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { section, message, currentData, conversationHistory, files } = req.body;
  const ai = getGeminiAI();

  // Helper fallback rule engine if AI is unavailable or offline
  const generateRuleBasedActions = () => {
    const textLower = (message || '').toLowerCase();
    const actions: any[] = [];
    let reply = `I've analyzed your request for the ${section || 'dashboard'} section.`;

    if (Array.isArray(files) && files.length > 0) {
      reply += ` I also received ${files.length} attached file(s) (${files.map((f: any) => f.name).join(', ')}).`;
    }

    if (section === 'workout' || textLower.includes('workout') || textLower.includes('exercise') || textLower.includes('gym')) {
      if (textLower.includes('add') || textLower.includes('chest') || textLower.includes('push') || textLower.includes('plan')) {
        actions.push({
          id: `act_${Date.now()}_1`,
          type: 'ADD_WORKOUT_DAY',
          summary: 'Add Upper Body Power Day (Bench Press, Incline DB, Lat Pulldown)',
          data: {
            dayName: 'Upper Body Power',
            muscleGroups: ['Chest', 'Back', 'Shoulders'],
            exercises: [
              {
                id: `ex_${Date.now()}_1`,
                name: 'Barbell Bench Press',
                targetMuscle: 'Chest',
                restTimeSeconds: 90,
                sets: [
                  { setNumber: 1, targetReps: 8, targetWeightKg: 60, completed: false },
                  { setNumber: 2, targetReps: 8, targetWeightKg: 65, completed: false },
                  { setNumber: 3, targetReps: 6, targetWeightKg: 70, completed: false },
                ],
              },
              {
                id: `ex_${Date.now()}_2`,
                name: 'Incline Dumbbell Press',
                targetMuscle: 'Upper Chest',
                restTimeSeconds: 60,
                sets: [
                  { setNumber: 1, targetReps: 10, targetWeightKg: 22, completed: false },
                  { setNumber: 2, targetReps: 10, targetWeightKg: 24, completed: false },
                ],
              },
              {
                id: `ex_${Date.now()}_3`,
                name: 'Lat Pulldown',
                targetMuscle: 'Lats',
                restTimeSeconds: 60,
                sets: [
                  { setNumber: 1, targetReps: 10, targetWeightKg: 50, completed: false },
                  { setNumber: 2, targetReps: 10, targetWeightKg: 55, completed: false },
                ],
              }
            ],
          }
        });
        reply = `I have drafted an Upper Body Power routine for your workout plan. Review the exercises below and click "Apply to Workout Plan" to save it immediately.`;
      } else {
        reply = `Here is your current workout recommendation: To maximize hypertrophy and strength, maintain 48 hours recovery between the same muscle groups. Would you like me to add a dedicated workout day or adjust sets and reps for you?`;
      }
    } else if (section === 'schedule' || textLower.includes('schedule') || textLower.includes('class') || textLower.includes('meet')) {
      const todayStr = new Date().toISOString().split('T')[0];
      actions.push({
        id: `act_${Date.now()}_1`,
        type: 'ADD_SCHEDULE_EVENT',
        summary: 'Add Deep Focus Study Session (09:00 - 11:00)',
        data: {
          title: 'Deep Focus & Study Block',
          startTime: '09:00',
          endTime: '11:00',
          date: todayStr,
          category: 'study',
          location: 'Library / Desk',
          isHighFocus: true,
        }
      });
      reply = `I've prepared a high-focus study block on your schedule. You can apply it directly to your timetable with one click!`;
    } else if (section === 'tasks' || textLower.includes('task') || textLower.includes('todo')) {
      actions.push({
        id: `act_${Date.now()}_1`,
        type: 'ADD_TASK',
        summary: 'Add priority task: Complete Review & Practice Problems',
        data: {
          title: 'Complete Review & Practice Problems',
          category: 'Study',
          priority: 'high',
          dueDate: new Date().toISOString().split('T')[0],
          estimatedMinutes: 60,
          subtasks: [
            { id: `st_1`, title: 'Summarize key theorems and formulas', completed: false },
            { id: `st_2`, title: 'Solve 3 medium difficulty exercises', completed: false },
          ],
        }
      });
      reply = `I have created a structured high-priority task with actionable subtasks. Click "Apply Changes" to add it to your task board.`;
    } else {
      reply = `I am your dedicated Peak AI Assistant. Tell me what you'd like to adjust in your schedule, workout plan, or tasks!`;
    }

    return { reply, actions };
  };

  if (!ai) {
    const fallback = generateRuleBasedActions();
    return res.json(fallback);
  }

  try {
    const fileSummary = Array.isArray(files) && files.length > 0
      ? files.map((f: any) => `"${f.name}" (${f.type || 'file'})`).join(', ')
      : 'None';

    const systemPrompt = `You are Peak AI Section Assistant & Autonomous Copilot for ${user.name}.
Current Section: "${section || 'global'}" (Possible sections: 'workout', 'schedule', 'tasks', 'academics', 'global').
User Profile:
- Occupation: ${user.occupation || 'Student'}
- Age: ${user.age || 'Not specified'}
- Studying for / Major: ${user.studyingFor || 'General Studies'}
- Primary Goals: ${user.primaryGoals || 'Stay consistent and excel'}

Attached Files In This Message: ${fileSummary}

Current State Snapshot:
${JSON.stringify({
  scheduleCount: (currentData?.schedules || []).length,
  recentSchedules: (currentData?.schedules || []).slice(0, 8),
  tasksCount: (currentData?.tasks || []).length,
  recentTasks: (currentData?.tasks || []).slice(0, 8),
  workoutPlan: currentData?.workoutPlans?.[0] || null,
  subjects: (currentData?.subjects || []).map((s: any) => ({ name: s.name, code: s.code })),
  attendance: currentData?.attendance || [],
})}

Recent Conversation History:
${JSON.stringify(conversationHistory || [])}

User Instruction:
"${message || (files && files.length > 0 ? 'Please analyze the attached files and suggest actionable updates.' : 'Hello!')}"

CRITICAL MANDATE:
You are NOT just a conversational bot; you have FULL AUTHORITY to make real changes to the user's schedule, workout plan, tasks, and academics when requested or appropriate.
Whenever the user asks you to add, modify, reschedule, generate, or adjust anything, OR when the user uploads files (such as syllabus PDF, timetable image, workout split photo, homework assignment, routine screenshot), you MUST analyze the contents thoroughly and return one or more executable actions in the "actions" array.

FILE INGESTION CAPABILITY:
- If an image (PNG, JPG, WEBP) or document (PDF) is attached, carefully inspect all text, schedules, timetables, course syllabi, exercises, sets, weights, homework deadlines, or notes.
- Convert findings directly into concrete actions:
  * Classes/lectures/timetables -> "ADD_SCHEDULE_EVENT" or "ADD_SUBJECT"
  * Workout plans/splits/exercises -> "UPDATE_WORKOUT_PLAN" or "ADD_WORKOUT_DAY"
  * Completed sessions/logs -> "LOG_WORKOUT"
  * Deadlines/assignments/readings -> "ADD_TASK"

Allowed Action Types:
1. "ADD_SCHEDULE_EVENT": { title: string, startTime: "HH:mm", endTime: "HH:mm", date?: "YYYY-MM-DD", category: "class"|"study"|"workout"|"personal", location?: string, isHighFocus?: boolean }
2. "RESCHEDULE_EVENT": { eventId?: string, eventTitle: string, newStartTime: "HH:mm", newEndTime: "HH:mm", newDate?: "YYYY-MM-DD" }
3. "DELETE_SCHEDULE_EVENT": { eventId?: string, eventTitle: string }
4. "UPDATE_WORKOUT_PLAN": { planName: string, splitSummary: string, days: Array<{ id: string, dayName: string, muscleGroups: string[], isRestDay?: boolean, exercises: Array<{ id: string, name: string, targetMuscle: string, restTimeSeconds: number, sets: Array<{ setNumber: number, targetReps: number, targetWeightKg: number, completed: boolean }> }> }> }
5. "ADD_WORKOUT_DAY": { dayName: string, muscleGroups: string[], isRestDay?: boolean, exercises: Array<{ id: string, name: string, targetMuscle: string, restTimeSeconds: number, sets: Array<{ setNumber: number, targetReps: number, targetWeightKg: number, completed: boolean }> }> }
6. "LOG_WORKOUT": { dayName: string, durationMinutes: number, notes?: string, exercisesCompleted: any[] }
7. "ADD_TASK": { title: string, category: "Study"|"College"|"Career"|"Workout"|"Personal"|"Projects", priority: "low"|"medium"|"high"|"urgent", dueDate: "YYYY-MM-DD", estimatedMinutes?: number, subtasks?: Array<{ id: string, title: string, completed: boolean }> }
8. "UPDATE_TASK": { taskId?: string, taskTitle: string, priority?: string, dueDate?: string, completed?: boolean }
9. "COMPLETE_TASK": { taskId?: string, taskTitle: string }
10. "ADD_SUBJECT": { name: string, code?: string, professor?: string, color?: string, targetAttendancePercentage?: number, targetGrade?: string, units?: any[] }
11. "UPDATE_STUDY_GOAL": { studyingFor?: string, targetExamDate?: string, targetGpa?: string, dreamAspiration?: string }

Output Format:
You must return a strictly valid JSON object matching:
{
  "reply": "Friendly, precise conversational response explaining what you did, what you analyzed from the uploaded file(s) if any, or answering questions.",
  "actions": [
    {
      "id": "act_unique_string",
      "type": "ACTION_TYPE",
      "summary": "Short readable summary of the change (e.g. Added 4-day PPL plan or Moved study block to 4 PM)",
      "data": { ... matching schema ... }
    }
  ]
}
If no changes are requested (pure question), leave "actions": [].`;

    const contentsParts: any[] = [{ text: systemPrompt }];

    if (Array.isArray(files) && files.length > 0) {
      for (const file of files) {
        if (file.base64) {
          const cleanBase64 = file.base64.replace(/^data:[^;]+;base64,/, '');
          const mimeType = file.type || 'image/png';
          contentsParts.push({
            inlineData: {
              mimeType,
              data: cleanBase64,
            },
          });
          contentsParts.push({
            text: `[Attached File: "${file.name}" (${mimeType}) - Extract all pertinent data into executable actions.]`,
          });
        }
      }
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: contentsParts,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: 'application/json',
      },
    });

    const responseText = response.text || '{}';
    let parsed: any = null;
    try {
      parsed = JSON.parse(responseText);
    } catch (parseErr) {
      const match = responseText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (match) {
        parsed = JSON.parse(match[1]);
      } else {
        const first = responseText.indexOf('{');
        const last = responseText.lastIndexOf('}');
        if (first !== -1 && last > first) {
          parsed = JSON.parse(responseText.substring(first, last + 1));
        }
      }
    }

    if (!parsed) {
      return res.json(generateRuleBasedActions());
    }

    // Extract grounding sources if available
    const groundingMetadata = (response as any).candidates?.[0]?.groundingMetadata;
    const webSources = groundingMetadata?.groundingChunks?.map((chunk: any) => ({
      title: chunk.web?.title || 'Web Search Result',
      uri: chunk.web?.uri || '',
    })) || [];

    res.json({
      reply: parsed.reply || 'Here is what I have prepared for you.',
      actions: parsed.actions || [],
      groundingSources: webSources,
    });
  } catch (err: any) {
    console.error('Copilot AI error, falling back to rule engine:', err);
    res.json(generateRuleBasedActions());
  }
});
// DEV & PRODUCTION SERVER BOOTSTRAP
// ----------------------------------------------------
async function start() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Peak Day server listening on http://0.0.0.0:${PORT}`);
  });
}

start();
