import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  getDocFromServer,
  collection, 
  getDocs,
  query,
  where
} from 'firebase/firestore';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithCredential,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { User } from '../types';

export type AppData = Record<string, any>;

// Initialize Firebase App singleton
export const firebaseApp = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore (support named database if provided)
export const db = firebaseConfig.firestoreDatabaseId 
  ? getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId)
  : getFirestore(firebaseApp);

export const auth = getAuth(firebaseApp);
export const googleProvider = new GoogleAuthProvider();

export {
  signInWithPopup,
  signInWithCredential,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged
};

// Test connection on startup per Firebase integration guidelines
export async function validateFirestoreConnection(): Promise<boolean> {
  try {
    // Attempt to probe the Firestore instance
    await getDocFromServer(doc(db, 'system', 'connection_probe'));
    return true;
  } catch (error: any) {
    if (error?.message?.includes('the client is offline')) {
      console.warn('Firebase client appears offline, will retry in background.');
      return false;
    }
    // Document not found is fine, it proves connection was established
    return true;
  }
}

// Save or sync user profile in Firestore
export async function syncUserToFirestore(user: User): Promise<void> {
  try {
    const userRef = doc(db, 'users', user.id);
    await setDoc(userRef, {
      id: user.id,
      name: user.name,
      email: user.email.toLowerCase(),
      age: user.age || null,
      occupation: user.occupation || 'student',
      primaryGoals: user.primaryGoals || '',
      studyingFor: user.studyingFor || '',
      targetExamDate: user.targetExamDate || '',
      targetDailyHours: user.targetDailyHours || null,
      dreamAspiration: user.dreamAspiration || '',
      studentRole: user.studentRole || 'Student',
      semester: user.semester || '',
      institution: user.institution || '',
      targetGpa: user.targetGpa || '',
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  } catch (err) {
    console.error('Failed to sync user to Firestore:', err);
  }
}

// Fetch user profile from Firestore by email
export async function findUserByEmailInFirestore(email: string): Promise<User | null> {
  try {
    const usersCol = collection(db, 'users');
    const q = query(usersCol, where('email', '==', email.toLowerCase()));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      return snapshot.docs[0].data() as User;
    }
  } catch (err) {
    console.error('Failed to find user in Firestore:', err);
  }
  return null;
}

// Save full student user data (schedules, tasks, workouts, academics) to Firestore
export async function saveUserDataToFirestore(userId: string, data: AppData): Promise<void> {
  try {
    const dataRef = doc(db, 'user_data', userId);
    await setDoc(dataRef, {
      userId,
      ...data,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  } catch (err) {
    console.error('Failed to save user data to Firestore:', err);
  }
}

// Load full student user data from Firestore
export async function loadUserDataFromFirestore(userId: string): Promise<AppData | null> {
  try {
    const dataRef = doc(db, 'user_data', userId);
    const snap = await getDoc(dataRef);
    if (snap.exists()) {
      return snap.data() as AppData;
    }
  } catch (err) {
    console.error('Failed to load user data from Firestore:', err);
  }
  return null;
}

// Run connection validation in background
validateFirestoreConnection().catch(() => {});
