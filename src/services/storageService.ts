import type { Student, Heat, FirebaseSyncConfig, SchoolLevelId } from '../types/olympics';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  onSnapshot, 
  setDoc, 
  doc, 
  deleteDoc,
  getDocs
} from 'firebase/firestore';

const LOCAL_STORAGE_KEY_FIREBASE = 'mini_olimpiadas_firebase_config_v1';
const LOCAL_STORAGE_KEY_ACTIVE_LEVEL = 'mini_olimpiadas_active_level_v1';

// Initial sample data for primaria first run
const INITIAL_SAMPLE_STUDENTS: Student[] = [
  { id: 's1', firstName: 'Jesús Miguel', lastName: 'Tipacamú Gómez', gradeGroup: '1º A', gender: 'boy', events: [], createdAt: Date.now() - 10000 },
  { id: 's2', firstName: 'Leonardo', lastName: 'Bermúdez Burgos', gradeGroup: '1º A', gender: 'boy', events: [], createdAt: Date.now() - 9000 },
  { id: 's3', firstName: 'Emiliano', lastName: 'Zepeda Gómez', gradeGroup: '1º B', gender: 'boy', events: [], createdAt: Date.now() - 8000 },
  { id: 's4', firstName: 'Iker Oswaldo', lastName: 'Hernández Collí', gradeGroup: '1º A', gender: 'boy', events: [], createdAt: Date.now() - 7000 },
  { id: 's5', firstName: 'Altair Sophia', lastName: 'Alemán García', gradeGroup: '1º A', gender: 'girl', events: [], createdAt: Date.now() - 6000 },
  { id: 's6', firstName: 'Erika', lastName: 'Máximo López', gradeGroup: '1º B', gender: 'girl', events: [], createdAt: Date.now() - 5000 }
];

export const DEFAULT_FIREBASE_CONFIG: FirebaseSyncConfig = {
  apiKey: "AIzaSyD2qygTuNBP82d2-V1YINKBXjUTTto0v4g",
  authDomain: "olimpiada-9127b.firebaseapp.com",
  projectId: "olimpiada-9127b",
  storageBucket: "olimpiada-9127b.firebasestorage.app",
  messagingSenderId: "110977594090",
  appId: "1:110977594090:web:6a3bb3aa02edc3a401dd93"
};

export class StorageService {
  private static db: any = null;
  private static isFirebaseInitialized = false;

  // Active level storage key
  static getStoredActiveLevel(): SchoolLevelId {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY_ACTIVE_LEVEL);
      if (stored === 'preescolar' || stored === 'primaria' || stored === 'secundaria') {
        return stored;
      }
    } catch {}
    return 'primaria';
  }

  static saveStoredActiveLevel(levelId: SchoolLevelId): void {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY_ACTIVE_LEVEL, levelId);
    } catch {}
  }

  // Initialize Firebase if config exists
  static initFirebase(config: FirebaseSyncConfig = DEFAULT_FIREBASE_CONFIG): boolean {
    try {
      if (!config.apiKey || !config.projectId) return false;
      const app = !getApps().length ? initializeApp(config) : getApp();
      this.db = getFirestore(app);
      this.isFirebaseInitialized = true;
      localStorage.setItem(LOCAL_STORAGE_KEY_FIREBASE, JSON.stringify(config));
      return true;
    } catch (err) {
      console.error('Error in unhandled Firebase init:', err);
      this.isFirebaseInitialized = false;
      return false;
    }
  }

  static getStoredFirebaseConfig(): FirebaseSyncConfig {
    try {
      const data = localStorage.getItem(LOCAL_STORAGE_KEY_FIREBASE);
      if (data) {
        const parsed = JSON.parse(data);
        if (parsed && parsed.apiKey) return parsed;
      }
    } catch {}
    return DEFAULT_FIREBASE_CONFIG;
  }

  static clearFirebaseConfig(): void {
    localStorage.removeItem(LOCAL_STORAGE_KEY_FIREBASE);
    this.db = null;
    this.isFirebaseInitialized = false;
  }

  // Load students per school level (preescolar, primaria, secundaria)
  static loadLocalStudents(levelId: SchoolLevelId = 'primaria'): Student[] {
    try {
      const key = `mini_olimpiadas_students_v1_${levelId}`;
      const data = localStorage.getItem(key);
      if (data !== null) {
        const parsed: Student[] = JSON.parse(data);
        if (Array.isArray(parsed)) {
          return parsed.map(s => ({
            ...s,
            events: Array.isArray(s.events) ? s.events : []
          }));
        }
      }
    } catch (err) {
      console.error('Error loading local students:', err);
    }

    if (levelId === 'primaria') {
      this.saveLocalStudents(INITIAL_SAMPLE_STUDENTS, 'primaria');
      return INITIAL_SAMPLE_STUDENTS;
    }
    return [];
  }

  static saveLocalStudents(students: Student[], levelId: SchoolLevelId = 'primaria'): void {
    try {
      const key = `mini_olimpiadas_students_v1_${levelId}`;
      localStorage.setItem(key, JSON.stringify(students));
    } catch (err) {
      console.error('Error saving local students:', err);
    }
  }

  // Load heats per school level
  static loadLocalHeats(levelId: SchoolLevelId = 'primaria'): Heat[] {
    try {
      const key = `mini_olimpiadas_heats_v1_${levelId}`;
      const data = localStorage.getItem(key);
      if (data !== null) {
        const parsed: Heat[] = JSON.parse(data);
        if (Array.isArray(parsed)) {
          return parsed.map(h => ({
            ...h,
            studentIds: Array.isArray(h.studentIds) ? h.studentIds : []
          }));
        }
      }
    } catch (err) {
      console.error('Error loading local heats:', err);
    }
    return [];
  }

  static saveLocalHeats(heats: Heat[], levelId: SchoolLevelId = 'primaria'): void {
    try {
      const key = `mini_olimpiadas_heats_v1_${levelId}`;
      localStorage.setItem(key, JSON.stringify(heats));
    } catch (err) {
      console.error('Error saving local heats:', err);
    }
  }

  // Real-time Firestore Listeners partitioned by level (events/{levelId}/students)
  static subscribeToCloudStudents(
    levelId: SchoolLevelId, 
    onUpdate: (students: Student[]) => void,
    onError?: (err: any) => void
  ): (() => void) | null {
    if (!this.isFirebaseInitialized || !this.db) return null;
    try {
      const colRef = collection(this.db, 'events', levelId, 'students');
      return onSnapshot(colRef, (snapshot) => {
        const cloudStudents: Student[] = snapshot.docs.map(doc => {
          const data = doc.data() as Student;
          return {
            ...data,
            events: Array.isArray(data.events) ? data.events : []
          };
        });

        if (snapshot.empty) {
          const local = this.loadLocalStudents(levelId);
          if (local.length > 0) {
            local.forEach(st => this.syncStudentToCloud(st, levelId));
            return;
          }
        }

        // Cloud snapshot is authoritative for deletions, additions, and updates
        this.saveLocalStudents(cloudStudents, levelId);
        onUpdate(cloudStudents);
      }, (err) => {
        console.error('Firestore students error:', err);
        if (onError) onError(err);
      });
    } catch (err) {
      console.error('Firestore subscribe error:', err);
      if (onError) onError(err);
      return null;
    }
  }

  static subscribeToCloudHeats(
    levelId: SchoolLevelId, 
    onUpdate: (heats: Heat[]) => void,
    onError?: (err: any) => void
  ): (() => void) | null {
    if (!this.isFirebaseInitialized || !this.db) return null;
    try {
      const colRef = collection(this.db, 'events', levelId, 'heats');
      return onSnapshot(colRef, (snapshot) => {
        const cloudHeats: Heat[] = snapshot.docs.map(doc => {
          const data = doc.data() as Heat;
          return {
            ...data,
            studentIds: Array.isArray(data.studentIds) ? data.studentIds : []
          };
        });

        if (snapshot.empty) {
          const local = this.loadLocalHeats(levelId);
          if (local.length > 0) {
            local.forEach(h => this.syncHeatToCloud(h, levelId));
            return;
          }
        }

        // Cloud snapshot is authoritative for deletions, additions, and updates
        this.saveLocalHeats(cloudHeats, levelId);
        onUpdate(cloudHeats);
      }, (err) => {
        console.error('Firestore subscribe error:', err);
        if (onError) onError(err);
      });
    } catch (err) {
      console.error('Firestore subscribe error:', err);
      if (onError) onError(err);
      return null;
    }
  }

  // Cloud Sync writing helpers
  static async syncStudentToCloud(student: Student, levelId: SchoolLevelId = 'primaria'): Promise<void> {
    if (!this.isFirebaseInitialized || !this.db) return;
    try {
      await setDoc(doc(this.db, 'events', levelId, 'students', student.id), student);
    } catch (err) {
      console.error('Cloud sync student failed:', err);
    }
  }

  static async syncHeatToCloud(heat: Heat, levelId: SchoolLevelId = 'primaria'): Promise<void> {
    if (!this.isFirebaseInitialized || !this.db) return;
    try {
      await setDoc(doc(this.db, 'events', levelId, 'heats', heat.id), heat);
    } catch (err) {
      console.error('Cloud sync heat failed:', err);
    }
  }

  static async deleteHeatFromCloud(heatId: string, levelId: SchoolLevelId = 'primaria'): Promise<void> {
    if (!this.isFirebaseInitialized || !this.db) return;
    try {
      await deleteDoc(doc(this.db, 'events', levelId, 'heats', heatId));
    } catch (err) {
      console.error('Cloud delete heat failed:', err);
    }
  }

  static async deleteStudentFromCloud(studentId: string, levelId: SchoolLevelId = 'primaria'): Promise<void> {
    if (!this.isFirebaseInitialized || !this.db) return;
    try {
      await deleteDoc(doc(this.db, 'events', levelId, 'students', studentId));
    } catch (err) {
      console.error('Cloud delete student failed:', err);
    }
  }

  static async clearLevelCloudData(levelId: SchoolLevelId): Promise<void> {
    if (!this.isFirebaseInitialized || !this.db) return;
    try {
      const studentsRef = collection(this.db, 'events', levelId, 'students');
      const heatsRef = collection(this.db, 'events', levelId, 'heats');
      
      const studentsSnap = await getDocs(studentsRef);
      const heatsSnap = await getDocs(heatsRef);

      const deletePromises: Promise<void>[] = [];
      studentsSnap.forEach(d => deletePromises.push(deleteDoc(d.ref)));
      heatsSnap.forEach(d => deletePromises.push(deleteDoc(d.ref)));

      await Promise.all(deletePromises);
    } catch (err) {
      console.error('Error clearing cloud level data:', err);
    }
  }

  // Export JSON Backup
  static exportEventJSON(students: Student[], heats: Heat[], levelId: SchoolLevelId = 'primaria'): void {
    const data = {
      version: '1.0',
      levelId,
      exportedAt: new Date().toISOString(),
      students,
      heats
    };
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `la_salle_${levelId}_backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }
}
