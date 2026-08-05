export type Gender = 'boy' | 'girl';

export type OlympicEventId = 'velocidad' | 'vallas' | 'relevos' | 'bala';

export type SchoolLevelId = 'preescolar' | 'primaria' | 'secundaria';

export type HeatPlace = 1 | 2 | 3 | 'DNS' | null;

export interface HeatResult {
  studentId: string;
  place: HeatPlace; // 1 (Oro), 2 (Plata), 3 (Bronce), 'DNS' (No se presentó)
  timeMark?: string; // e.g. "9.42s" or "3.50m"
}

export interface OlympicEvent {
  id: OlympicEventId;
  name: string;
  shortName: string;
  icon: string;
  description: string;
  color: string;
  badgeBg: string;
}

export interface SchoolLevel {
  id: SchoolLevelId;
  name: string;
  shortName: string;
  icon: string;
  badgeBg: string;
  grades: string[];
}

export interface Student {
  id: string;
  firstName: string;
  lastName: string;
  gradeGroup: string; // e.g. "Maternal A", "1º A", "2º B"
  gender: Gender;
  events: OlympicEventId[]; // Array of selected events
  notes?: string;
  createdAt: number;
}

export interface Heat {
  id: string;
  number: number; // Hit 1, Hit 2...
  gradeGroup: string; // Base grade or specific group e.g. "Maternal" or "1º A"
  gender: Gender;
  eventId: OlympicEventId; // Discipline
  studentIds: string[]; // List of student IDs in this heat
  results?: HeatResult[]; // Race results with places & ties
  status?: 'pending' | 'live' | 'finished'; // Current live status
  createdAt: number;
}

export interface FirebaseSyncConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

export const SCHOOL_LEVELS: SchoolLevel[] = [
  {
    id: 'preescolar',
    name: 'Nivel Preescolar & Maternal',
    shortName: 'Preescolar',
    icon: 'Baby',
    badgeBg: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
    grades: ['Maternal', '1º', '2º', '3º']
  },
  {
    id: 'primaria',
    name: 'Nivel Primaria',
    shortName: 'Primaria',
    icon: 'School',
    badgeBg: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    grades: ['1º', '2º', '3º', '4º', '5º', '6º']
  },
  {
    id: 'secundaria',
    name: 'Nivel Secundaria',
    shortName: 'Secundaria',
    icon: 'GraduationCap',
    badgeBg: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    grades: ['1º', '2º', '3º']
  }
];

export const OLYMPIC_EVENTS: OlympicEvent[] = [
  {
    id: 'velocidad',
    name: 'Carrera de Velocidad',
    shortName: 'Velocidad',
    icon: 'Zap',
    description: 'Sprint lineal de velocidad máxima',
    color: '#3b82f6',
    badgeBg: 'bg-blue-500/20 text-blue-300 border-blue-500/30'
  },
  {
    id: 'vallas',
    name: 'Salto de Vallas',
    shortName: 'Vallas',
    icon: 'Activity',
    description: 'Carrera de velocidad con obstáculos de altura',
    color: '#8b5cf6',
    badgeBg: 'bg-purple-500/20 text-purple-300 border-purple-500/30'
  },
  {
    id: 'relevos',
    name: 'Carrera de Relevos',
    shortName: 'Relevos (Equipos por Grupo)',
    icon: 'Users',
    description: 'Equipos de 4 del mismo grupo (ej. 1ºA vs 1ºB)',
    color: '#10b981',
    badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
  },
  {
    id: 'bala',
    name: 'Lanzamiento de Bala',
    shortName: 'Lanz. Bala',
    icon: 'Target',
    description: 'Prueba de fuerza e impulso por grupos',
    color: '#f59e0b',
    badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/30'
  }
];

export const MIN_EVENTS_PER_STUDENT = 2;
export const MAX_HEAT_CAPACITY = 5;
export const RELEVOS_TEAM_SIZE = 4;

// Helper to extract base grade level (e.g. "Maternal A" -> "Maternal", "1º A" -> "1º", "2º B" -> "2º")
export function extractBaseGrade(gradeGroup: string): string {
  if (!gradeGroup) return '1º';
  const str = gradeGroup.trim();
  if (/^mat(ernal)?/i.test(str)) return 'Maternal';
  const match = str.match(/^([1-6]º?)/i);
  if (match) {
    let base = match[1].toUpperCase();
    if (!base.includes('º')) base = base.replace(/([1-6])/, '$1º');
    return base;
  }
  return gradeGroup;
}
