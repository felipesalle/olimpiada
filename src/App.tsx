import React, { useState, useEffect, useMemo } from 'react';
import type { Student, Heat, Gender, OlympicEventId, HeatResult, FirebaseSyncConfig, SchoolLevelId } from './types/olympics';
import { extractBaseGrade, RELEVOS_TEAM_SIZE } from './types/olympics';
import { StorageService } from './services/storageService';
import { Header } from './components/Header';
import { StudentsView } from './components/StudentsView';
import { HeatBuilderView } from './components/HeatBuilderView';
import { PrintSheetView } from './components/PrintSheetView';
import { PublicPortalView } from './components/PublicPortalView';
import { LiveEventPublicView } from './components/LiveEventPublicView';
import { LiveEventControlConsole } from './components/LiveEventControlConsole';
import { TournamentReportView } from './components/TournamentReportView';
import { ExecutiveReportView } from './components/ExecutiveReportView';
import { StudentImportModal } from './components/StudentImportModal';
import { FirebaseConfigModal } from './components/FirebaseConfigModal';
import { TeacherAuthModal } from './components/TeacherAuthModal';
import { createPreescolarSimulationData } from './services/preescolarSimulation';

export default function App() {
  const [activeTab, setActiveTab] = useState<any>('public_live');
  const [activeLevel, setActiveLevel] = useState<SchoolLevelId>(() => StorageService.getStoredActiveLevel());
  const [isTeacherUnlocked, setIsTeacherUnlocked] = useState<boolean>(false);
  const [isTeacherModalOpen, setIsTeacherModalOpen] = useState<boolean>(false);
  const [activeHeatId, setActiveHeatId] = useState<string | null>(null);

  const [students, setStudents] = useState<Student[]>([]);
  const [heats, setHeats] = useState<Heat[]>([]);
  const [isFirebaseActive, setIsFirebaseActive] = useState<boolean>(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isFirebaseModalOpen, setIsFirebaseModalOpen] = useState(false);

  // Light / Dark Theme State
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const stored = localStorage.getItem('mini_olimpiadas_theme_v1');
    return (stored === 'light' || stored === 'dark') ? stored : 'dark';
  });

  useEffect(() => {
    localStorage.setItem('mini_olimpiadas_theme_v1', theme);
    if (theme === 'light') {
      document.documentElement.classList.add('light-mode');
    } else {
      document.documentElement.classList.remove('light-mode');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  // Ensure student has valid registered events array without mutating
  const sanitizeStudents = (rawStudents: Student[]): Student[] => {
    const DEFAULT_EVENTS: OlympicEventId[] = ['relevos', 'velocidad', 'vallas', 'bala'];
    return (rawStudents || []).map(s => {
      if (!s.events || s.events.length === 0) {
        return { ...s, events: DEFAULT_EVENTS };
      }
      return s;
    });
  };

  // Switch School Level (Preescolar & Maternal, Primaria, Secundaria)
  const handleSelectLevel = (newLevel: SchoolLevelId) => {
    setActiveLevel(newLevel);
    StorageService.saveStoredActiveLevel(newLevel);

    const localStudents = sanitizeStudents(StorageService.loadLocalStudents(newLevel));
    const localHeats = unifyRelevosHeats(StorageService.loadLocalHeats(newLevel));

    setStudents(localStudents);
    setHeats(localHeats);
    setActiveHeatId(null);
  };

  // Initialize data and check URL for admin override on mount
  useEffect(() => {
    const search = window.location.search.toLowerCase();
    const isTeacherUrl = search.includes('admin=true') || search.includes('maestro=true') || search.includes('teacher=true') || search.includes('control=true');

    if (isTeacherUrl) {
      setIsTeacherUnlocked(true);
      setActiveTab('teacher_live');
    } else {
      setActiveTab('public_search');
    }

    const storedConfig = StorageService.getStoredFirebaseConfig();
    if (storedConfig) {
      const active = StorageService.initFirebase(storedConfig);
      setIsFirebaseActive(active);
    }

    // Auto-pick level with active heats on initial mount
    let levelToLoad = activeLevel;
    let localHeats = StorageService.loadLocalHeats(levelToLoad);
    const hasLiveInLoaded = localHeats.some(h => h.status === 'live');

    if (!hasLiveInLoaded) {
      const levels: SchoolLevelId[] = ['preescolar', 'primaria', 'secundaria'];
      for (const lvl of levels) {
        const lHeats = StorageService.loadLocalHeats(lvl);
        if (lHeats.some(h => h.status === 'live')) {
          levelToLoad = lvl;
          localHeats = lHeats;
          setActiveLevel(lvl);
          StorageService.saveStoredActiveLevel(lvl);
          break;
        }
      }
    }

    const localStudents = sanitizeStudents(StorageService.loadLocalStudents(levelToLoad));
    setStudents(localStudents);
    setHeats(unifyRelevosHeats(localHeats));
  }, []);

  const [isAdBlockWarningVisible, setIsAdBlockWarningVisible] = useState(false);

  // Subscribe to Cloud Firestore changes if Firebase is active for activeLevel
  useEffect(() => {
    if (!isFirebaseActive) return;

    const handleFirebaseError = (err: any) => {
      console.warn('Firebase error detected (possible AdBlocker):', err);
      setIsAdBlockWarningVisible(true);
    };

    const unsubStudents = StorageService.subscribeToCloudStudents(
      activeLevel, 
      (cloudStudents) => {
        setStudents(sanitizeStudents(cloudStudents));
      },
      handleFirebaseError
    );

    const unsubHeats = StorageService.subscribeToCloudHeats(
      activeLevel, 
      (cloudHeats) => {
        setHeats(unifyRelevosHeats(cloudHeats));
      },
      handleFirebaseError
    );

    return () => {
      if (unsubStudents) unsubStudents();
      if (unsubHeats) unsubHeats();
    };
  }, [isFirebaseActive, activeLevel]);

  // Sync helpers
  // Auto-unify Relevos Heats of the same grade & gender into a single race heat
  const unifyRelevosHeats = (rawHeats: Heat[]): Heat[] => {
    if (!rawHeats || rawHeats.length === 0) return [];

    const relevosHeatsMap = new Map<string, Heat[]>();
    const nonRelevosHeats: Heat[] = [];

    rawHeats.forEach(h => {
      const eventId = h.eventId || 'velocidad';
      if (eventId === 'relevos') {
        const baseGrade = extractBaseGrade(h.gradeGroup);
        const key = `${baseGrade}_${h.gender}`;
        const list = relevosHeatsMap.get(key) || [];
        list.push(h);
        relevosHeatsMap.set(key, list);
      } else {
        nonRelevosHeats.push(h);
      }
    });

    const unifiedRelevosHeats: Heat[] = [];

    relevosHeatsMap.forEach((heatList) => {
      if (heatList.length <= 1) {
        unifiedRelevosHeats.push(...heatList);
      } else {
        const baseHeat = heatList[0];
        const allStudentIdsSet = new Set<string>();
        const mergedResultsMap = new Map<string, HeatResult>();

        heatList.forEach(h => {
          (h.studentIds || []).forEach(id => allStudentIdsSet.add(id));
          (h.results || []).forEach(r => mergedResultsMap.set(r.studentId, r));
        });

        const mergedHeat: Heat = {
          ...baseHeat,
          number: 1,
          studentIds: Array.from(allStudentIdsSet),
          results: Array.from(mergedResultsMap.values())
        };
        unifiedRelevosHeats.push(mergedHeat);
      }
    });

    return [...nonRelevosHeats, ...unifiedRelevosHeats];
  };

  const updateStudentsState = (newStudents: Student[]) => {
    const sanitized = sanitizeStudents(newStudents);
    setStudents(sanitized);
    StorageService.saveLocalStudents(sanitized, activeLevel);
  };

  const updateHeatsState = (newHeats: Heat[]) => {
    const unified = unifyRelevosHeats(newHeats);
    setHeats(unified);
    StorageService.saveLocalHeats(unified, activeLevel);
  };

  // Student Handlers
  const handleAddStudent = (studentData: Omit<Student, 'id' | 'createdAt'>) => {
    const keyNew = `${studentData.firstName}${studentData.lastName}${studentData.gradeGroup}`.toLowerCase().replace(/\s+/g, '');
    const alreadyExists = students.some(s => `${s.firstName}${s.lastName}${s.gradeGroup}`.toLowerCase().replace(/\s+/g, '') === keyNew);

    if (alreadyExists) {
      alert(`El alumno "${studentData.firstName} ${studentData.lastName}" ya existe en el grupo ${studentData.gradeGroup}.`);
      return;
    }

    const newStudent: Student = {
      ...studentData,
      id: 'st_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      createdAt: Date.now(),
      events: []
    };
    const updated = [newStudent, ...students];
    updateStudentsState(updated);
    if (isFirebaseActive) {
      StorageService.syncStudentToCloud(newStudent, activeLevel);
    }
  };

  const handleDeleteStudent = (studentId: string) => {
    const updatedStudents = students.filter(st => st.id !== studentId);

    const updatedHeats = heats.map(h => ({
      ...h,
      studentIds: (h.studentIds || []).filter(id => id !== studentId)
    }));

    updateHeatsState(updatedHeats);
    updateStudentsState(updatedStudents);

    if (isFirebaseActive) {
      StorageService.deleteStudentFromCloud(studentId, activeLevel);
    }
  };

  const handleRemoveDuplicates = () => {
    const seenKeys = new Set<string>();
    const toRemoveIds: string[] = [];

    const cleanedStudents = students.filter(s => {
      const key = `${s.firstName || ''}${s.lastName || ''}${s.gradeGroup || ''}`.toLowerCase().replace(/\s+/g, '');
      if (seenKeys.has(key)) {
        toRemoveIds.push(s.id);
        return false;
      }
      seenKeys.add(key);
      return true;
    });

    updateStudentsState(cleanedStudents);

    if (isFirebaseActive) {
      toRemoveIds.forEach(id => StorageService.deleteStudentFromCloud(id, activeLevel));
    }
  };

  const handleClearAllStudents = () => {
    if (window.confirm(`¿Estás seguro de que deseas vaciar TODOS los alumnos y hits del nivel ${activeLevel.toUpperCase()}?`)) {
      setStudents([]);
      setHeats([]);
      StorageService.saveLocalStudents([], activeLevel);
      StorageService.saveLocalHeats([], activeLevel);

      if (isFirebaseActive) {
        StorageService.clearLevelCloudData(activeLevel);
      }
    }
  };

  // Import Modal Handler
  const handleImportStudents = (imported: Omit<Student, 'id' | 'createdAt'>[]) => {
    const newStudents: Student[] = imported.map((st, index) => ({
      ...st,
      id: 'st_' + (Date.now() + index) + '_' + Math.random().toString(36).substring(2, 6),
      createdAt: Date.now() + index,
      events: []
    }));

    const merged = [...newStudents, ...students];
    updateStudentsState(merged);

    if (isFirebaseActive) {
      newStudents.forEach(st => StorageService.syncStudentToCloud(st, activeLevel));
    }
  };

  // Simulation Handler for Preescolar (Relevos Hit 1 Live)
  const handleLoadPreescolarSimulation = async () => {
    const { students: simStudents, heats: simHeats } = createPreescolarSimulationData();
    setActiveLevel('preescolar');
    StorageService.saveStoredActiveLevel('preescolar');

    StorageService.saveLocalStudents(simStudents, 'preescolar');
    StorageService.saveLocalHeats(simHeats, 'preescolar');

    setStudents(simStudents);
    setHeats(simHeats);
    setActiveHeatId('h_sim_1');

    // Force init Firebase if not active
    const active = StorageService.initFirebase();
    setIsFirebaseActive(active);

    if (active) {
      // Clear cloud first to ensure clean state then upload simulation data
      await StorageService.clearLevelCloudData('preescolar');
      await Promise.all([
        ...simStudents.map(st => StorageService.syncStudentToCloud(st, 'preescolar')),
        ...simHeats.map(h => StorageService.syncHeatToCloud(h, 'preescolar'))
      ]).catch(err => console.error('Cloud simulation upload error:', err));
    }
  };

  // Heat Handlers
  const handleCreateHeat = (baseGrade: string, gender: Gender, eventId: OlympicEventId) => {
    const existingGradeHeats = heats.filter(h => 
      (h.eventId || 'velocidad') === eventId &&
      extractBaseGrade(h.gradeGroup) === baseGrade && 
      h.gender === gender
    );
    const maxNumber = existingGradeHeats.reduce((max, h) => Math.max(max, h.number), 0);

    const newHeat: Heat = {
      id: 'heat_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      number: maxNumber + 1,
      gradeGroup: baseGrade,
      gender,
      eventId,
      studentIds: [],
      createdAt: Date.now()
    };

    const updated = [...heats, newHeat];
    updateHeatsState(updated);
    if (isFirebaseActive) {
      StorageService.syncHeatToCloud(newHeat, activeLevel);
    }
  };

  const handleDeleteHeat = (heatId: string) => {
    const updated = heats.filter(h => h.id !== heatId);
    updateHeatsState(updated);
    if (isFirebaseActive) {
      StorageService.deleteHeatFromCloud(heatId, activeLevel);
    }
  };

  const handleAssignStudentToHeat = (
    studentId: string, 
    targetHeatId: string | null, 
    activeFilterEventId?: OlympicEventId
  ) => {
    const student = students.find(s => s.id === studentId);
    if (!student) return;

    const targetHeat = targetHeatId ? heats.find(h => h.id === targetHeatId) : null;
    const eventIdToModify = targetHeat ? (targetHeat.eventId || 'velocidad') : activeFilterEventId;

    const updatedHeats = heats.map(h => {
      const hEventId = h.eventId || 'velocidad';

      if (targetHeatId && h.id === targetHeatId) {
        // Add student to target heat if not already present
        const currentIds = h.studentIds || [];
        if (!currentIds.includes(studentId)) {
          return { ...h, studentIds: [...currentIds, studentId] };
        }
        return h;
      } else if (eventIdToModify && hEventId === eventIdToModify) {
        // Remove student from other heats of THIS specific event discipline only
        const currentIds = h.studentIds || [];
        if (currentIds.includes(studentId)) {
          return { ...h, studentIds: currentIds.filter(id => id !== studentId) };
        }
        return h;
      }

      // Leave heats of ALL OTHER event disciplines (e.g. relevos, vallas, bala) completely untouched!
      return h;
    });

    updateHeatsState(updatedHeats);

    if (isFirebaseActive) {
      updatedHeats.forEach(h => StorageService.syncHeatToCloud(h, activeLevel));
    }
  };  // Helper to form complete Teams of 4 for Relevos (Combining leftovers across groups if necessary)
  const buildRelevosTeamStudentIds = (studentsList: Student[]): string[] => {
    const groupMap = new Map<string, Student[]>();
    studentsList.forEach(st => {
      const grp = st.gradeGroup || 'Equipo';
      const list = groupMap.get(grp) || [];
      list.push(st);
      groupMap.set(grp, list);
    });

    const assignedIds: string[] = [];
    const leftovers: Student[] = [];

    // First pass: full teams of 4 from the same group
    groupMap.forEach((stList) => {
      const fullCount = Math.floor(stList.length / 4);
      for (let i = 0; i < fullCount * 4; i++) {
        assignedIds.push(stList[i].id);
      }
      for (let i = fullCount * 4; i < stList.length; i++) {
        leftovers.push(stList[i]);
      }
    });

    // Second pass: combine leftovers across groups into full Teams of 4!
    for (let i = 0; i + 4 <= leftovers.length; i += 4) {
      for (let k = 0; k < 4; k++) {
        assignedIds.push(leftovers[i + k].id);
      }
    }

    return assignedIds;
  };

  // Auto Create Heats
  const handleAutoCreateHeatsForCurrentFilter = (baseGrade: string, gender: Gender, eventId: OlympicEventId) => {
    const isRelevos = eventId === 'relevos';
    const isBala = eventId === 'bala';

    const eligibleStudents = students.filter(s => {
      const matchGrade = extractBaseGrade(s.gradeGroup) === baseGrade;
      const matchGender = s.gender === gender;
      return matchGrade && matchGender;
    });

    if (eligibleStudents.length === 0) {
      alert(`No hay alumnos del grado "${baseGrade}" y género "${gender === 'boy' ? 'Niños' : 'Niñas'}" registrados.`);
      return;
    }

    const unassigned = eligibleStudents.filter(st => {
      return !heats.some(h => (h.eventId || 'velocidad') === eventId && (h.studentIds || []).includes(st.id));
    });

    if (unassigned.length === 0 && !isRelevos) {
      alert('Todos los alumnos elegibles ya están asignados a un Hit para esta prueba.');
      return;
    }

    const existingGradeHeats = heats.filter(h => 
      (h.eventId || 'velocidad') === eventId &&
      extractBaseGrade(h.gradeGroup) === baseGrade && 
      h.gender === gender
    );

    let currentNumber = existingGradeHeats.reduce((max, h) => Math.max(max, h.number), 0) + 1;
    const newHeatsCreated: Heat[] = [];

    if (isBala) {
      const allIds = eligibleStudents.map(s => s.id);
      const existingBalaHeat = heats.find(h => 
        (h.eventId || 'velocidad') === 'bala' &&
        extractBaseGrade(h.gradeGroup) === baseGrade &&
        h.gender === gender
      );

      if (existingBalaHeat) {
        const mergedIds = Array.from(new Set([...(existingBalaHeat.studentIds || []), ...allIds]));
        const updatedHeats = heats.map(h => h.id === existingBalaHeat.id ? { ...h, studentIds: mergedIds } : h);
        updateHeatsState(updatedHeats);
        if (isFirebaseActive) StorageService.syncHeatToCloud({ ...existingBalaHeat, studentIds: mergedIds }, activeLevel);
        return;
      } else {
        const newHeat: Heat = {
          id: 'heat_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
          number: 1,
          gradeGroup: baseGrade,
          gender,
          eventId: 'bala',
          studentIds: allIds,
          createdAt: Date.now()
        };
        newHeatsCreated.push(newHeat);
      }
    } else if (isRelevos) {
      const teamIds = buildRelevosTeamStudentIds(eligibleStudents);

      if (teamIds.length === 0) {
        alert(`No hay suficientes alumnos en ${baseGrade} Grado (${gender === 'boy' ? 'Niños' : 'Niñas'}) para formar al menos 1 equipo completo de 4 integrantes.`);
        return;
      }

      const existingRelevosHeat = heats.find(h => 
        (h.eventId || 'velocidad') === 'relevos' &&
        extractBaseGrade(h.gradeGroup) === baseGrade &&
        h.gender === gender
      );

      if (existingRelevosHeat) {
        const updatedHeat = { ...existingRelevosHeat, studentIds: teamIds };
        const updatedHeats = heats.map(h => h.id === existingRelevosHeat.id ? updatedHeat : h);
        updateHeatsState(updatedHeats);
        if (isFirebaseActive) StorageService.syncHeatToCloud(updatedHeat, activeLevel);
        return;
      } else {
        const existingRelevosCount = heats.filter(h => (h.eventId || 'velocidad') === 'relevos').length;
        const newHeat: Heat = {
          id: 'heat_relevos_' + baseGrade + '_' + gender + '_' + Date.now(),
          number: existingRelevosCount + 1,
          gradeGroup: baseGrade,
          gender,
          eventId: 'relevos',
          studentIds: teamIds,
          createdAt: Date.now()
        };
        const updatedHeats = [...heats, newHeat];
        updateHeatsState(updatedHeats);
        if (isFirebaseActive) StorageService.syncHeatToCloud(newHeat, activeLevel);
        return;
      }
    } else {
      for (let i = 0; i < unassigned.length; i += 4) {
        const chunk = unassigned.slice(i, i + 4).map(s => s.id);
        const newHeat: Heat = {
          id: 'heat_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
          number: currentNumber++,
          gradeGroup: baseGrade,
          gender,
          eventId,
          studentIds: chunk,
          createdAt: Date.now() + i
        };
        newHeatsCreated.push(newHeat);
      }
    }

    const updatedHeats = [...heats, ...newHeatsCreated];
    updateHeatsState(updatedHeats);

    if (isFirebaseActive) {
      newHeatsCreated.forEach(h => StorageService.syncHeatToCloud(h, activeLevel));
    }
  };

  const handleSetActiveHeatId = (heatId: string) => {
    setActiveHeatId(heatId);
    const updatedHeats = heats.map(h => {
      if (h.id === heatId) {
        const updated = { ...h, status: 'live' as const };
        if (isFirebaseActive) StorageService.syncHeatToCloud(updated, activeLevel);
        return updated;
      } else if (h.status === 'live') {
        const updated = { ...h, status: 'pending' as const };
        if (isFirebaseActive) StorageService.syncHeatToCloud(updated, activeLevel);
        return updated;
      }
      return h;
    });
    updateHeatsState(updatedHeats);
  };

  const handleSaveHeatResults = (heatId: string, results: HeatResult[], nextHeatId: string | null, isFinalSave: boolean = false) => {
    const shouldMarkFinished = Boolean(nextHeatId) || isFinalSave;

    const updatedHeats = heats.map(h => {
      if (h.id === heatId) {
        // Mark finished if advancing or doing final save of last heat
        const newStatus = shouldMarkFinished ? ('finished' as const) : ('live' as const);
        const updated = { ...h, results, status: newStatus };
        if (isFirebaseActive) StorageService.syncHeatToCloud(updated, activeLevel);
        return updated;
      }

      if (nextHeatId && h.id === nextHeatId) {
        const updated = { ...h, status: 'live' as const };
        if (isFirebaseActive) StorageService.syncHeatToCloud(updated, activeLevel);
        return updated;
      }

      return h;
    });

    updateHeatsState(updatedHeats);

    if (nextHeatId) {
      setActiveHeatId(nextHeatId);
    } else {
      setActiveHeatId(heatId);
    }
  };

  // Stats
  const totalStudents = students.length;

  const unassignedCount = useMemo(() => {
    const assigned = new Set<string>();
    heats.forEach(h => (h.studentIds || []).forEach(id => assigned.add(id)));
    return students.filter(s => !assigned.has(s.id)).length;
  }, [students, heats]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans app-root transition-colors">
      
      {/* Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        activeLevel={activeLevel}
        onSelectLevel={handleSelectLevel}
        isTeacherUnlocked={isTeacherUnlocked}
        onOpenTeacherAuthModal={() => setIsTeacherModalOpen(true)}
        onLockTeacher={() => {
          setIsTeacherUnlocked(false);
          setActiveTab('public_live');
        }}
        isFirebaseActive={isFirebaseActive}
        onOpenFirebaseModal={() => setIsFirebaseModalOpen(true)}
        onOpenImportModal={() => setIsImportModalOpen(true)}
        onExportData={() => StorageService.exportEventJSON(students, heats, activeLevel)}
        onAddStudent={() => setActiveTab('students')}
        totalStudents={totalStudents}
        unassignedCount={unassignedCount}
        totalHeats={heats.length}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      {/* AdBlocker Warning Banner */}
      {isAdBlockWarningVisible && (
        <div className="bg-rose-600 text-white px-4 py-3 text-xs font-bold flex items-center justify-between shadow-lg animate-fade-in z-50">
          <div className="flex items-center gap-2 max-w-5xl mx-auto">
            <span className="text-base">⚠️</span>
            <span>
              <strong>¡Conexión Bloqueada!</strong> Tu navegador tiene un bloqueador (AdBlock, uBlock, Brave Shield o Antivirus) que está bloqueando las peticiones a Firebase (<code>ERR_BLOCKED_BY_CLIENT</code>). 
              Desactiva el bloqueador para esta página (o añade <code>localhost</code> a la lista blanca) para que la pantalla en vivo reciba las actualizaciones en tiempo real.
            </span>
          </div>
          <button 
            onClick={() => setIsAdBlockWarningVisible(false)}
            className="text-white hover:text-rose-200 font-extrabold text-sm ml-4"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main View Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-8">
        {/* 🔴 1. Transmisión en Vivo de Solo Lectura (Modo Visualizador para Papás) */}
        {activeTab === 'public_live' && (
          <LiveEventPublicView
            students={students}
            heats={heats}
            activeHeatId={activeHeatId}
            activeLevel={activeLevel}
            onSelectLevel={handleSelectLevel}
          />
        )}

        {/* 🎓 2. Buscador de Alumnos y Horarios (Para Papás) */}
        {(activeTab === 'public_search' || activeTab === 'public') && (
          <PublicPortalView
            students={students}
            heats={heats}
          />
        )}

        {/* 🔴 3. Consola LIVE de Control Táctil (Exclusiva Maestro) */}
        {isTeacherUnlocked && activeTab === 'teacher_live' && (
          <LiveEventControlConsole
            students={students}
            heats={heats}
            activeHeatId={activeHeatId}
            onSetActiveHeatId={handleSetActiveHeatId}
            onSaveHeatResults={handleSaveHeatResults}
            onOpenMedallero={() => setActiveTab('report')}
            onOpenImpresion={() => setActiveTab('print')}
          />
        )}

        {/* 📊 4. Medallero y Reporte del Torneo */}
        {isTeacherUnlocked && activeTab === 'report' && (
          <TournamentReportView
            students={students}
            heats={heats}
          />
        )}

        {/* 👥 5. Gestión de Alumnos */}
        {isTeacherUnlocked && activeTab === 'students' && (
          <StudentsView
            students={students}
            heats={heats}
            onAddStudent={handleAddStudent}
            onDeleteStudent={handleDeleteStudent}
            onRemoveDuplicates={handleRemoveDuplicates}
            onClearAllStudents={handleClearAllStudents}
            onGoToHeatBuilder={() => setActiveTab('heats')}
            onLoadPreescolarSimulation={handleLoadPreescolarSimulation}
          />
        )}

        {/* 🏃 6. Creador de Hits */}
        {isTeacherUnlocked && activeTab === 'heats' && (
          <HeatBuilderView
            students={students}
            heats={heats}
            onCreateHeat={handleCreateHeat}
            onDeleteHeat={handleDeleteHeat}
            onAssignStudentToHeat={handleAssignStudentToHeat}
            onAutoCreateHeatsForCurrentFilter={handleAutoCreateHeatsForCurrentFilter}
          />
        )}

        {/* 🖨️ 7. Planillas de Impresión */}
        {isTeacherUnlocked && activeTab === 'print' && (
          <PrintSheetView
            students={students}
            heats={heats}
          />
        )}

        {/* 📋 8. Informe Ejecutivo para Dirección */}
        {isTeacherUnlocked && activeTab === 'executive_report' && (
          <ExecutiveReportView
            students={students}
            heats={heats}
            activeLevel={activeLevel}
          />
        )}
      </main>

      {/* Modals */}
      <TeacherAuthModal
        isOpen={isTeacherModalOpen}
        onClose={() => setIsTeacherModalOpen(false)}
        onUnlockTeacher={() => {
          setIsTeacherUnlocked(true);
          setActiveTab('students');
        }}
      />

      <StudentImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        existingStudents={students}
        onImportStudents={handleImportStudents}
      />

      <FirebaseConfigModal
        isOpen={isFirebaseModalOpen}
        onClose={() => setIsFirebaseModalOpen(false)}
        onConfigSaved={(config) => setIsFirebaseActive(!!config)}
      />

    </div>
  );
}
