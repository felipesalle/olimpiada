import React, { useState, useMemo } from 'react';
import { 
  OLYMPIC_EVENTS, 
  MAX_HEAT_CAPACITY, 
  RELEVOS_TEAM_SIZE,
  extractBaseGrade
} from '../types/olympics';
import type { 
  Student, 
  Heat, 
  Gender, 
  OlympicEventId 
} from '../types/olympics';
import { 
  Layers, 
  Plus, 
  Trash2, 
  GripVertical, 
  Users, 
  Zap, 
  Activity, 
  Target, 
  CheckCircle2, 
  ArrowRight,
  Shuffle,
  Info,
  Award
} from 'lucide-react';
import { SeoulOlympicIcon } from './SeoulOlympicIcons';

interface HeatBuilderViewProps {
  students: Student[];
  heats: Heat[];
  onCreateHeat: (gradeGroup: string, gender: Gender, eventId: OlympicEventId) => void;
  onDeleteHeat: (heatId: string) => void;
  onAssignStudentToHeat: (studentId: string, targetHeatId: string | null, activeFilterEventId?: OlympicEventId) => void;
  onAutoCreateHeatsForCurrentFilter: (baseGrade: string, gender: Gender, eventId: OlympicEventId) => void;
}

export const HeatBuilderView: React.FC<HeatBuilderViewProps> = ({
  students = [],
  heats = [],
  onCreateHeat,
  onDeleteHeat,
  onAssignStudentToHeat,
  onAutoCreateHeatsForCurrentFilter
}) => {
  const [selectedEventId, setSelectedEventId] = useState<OlympicEventId>('velocidad');
  const [selectedGender, setSelectedGender] = useState<Gender>('boy');
  const [draggedStudentId, setDraggedStudentId] = useState<string | null>(null);

  // Extract unique Base Grades e.g. "1º", "2º", "3º"
  const uniqueBaseGrades = useMemo(() => {
    const gradesSet = new Set((students || []).map(s => extractBaseGrade(s.gradeGroup)));
    const sorted = Array.from(gradesSet).sort();
    return sorted.length > 0 ? sorted : ['1º'];
  }, [students]);

  const [selectedBaseGrade, setSelectedBaseGrade] = useState<string>(uniqueBaseGrades[0] || '1º');

  // Sync selectedBaseGrade if uniqueBaseGrades changes
  React.useEffect(() => {
    if (!uniqueBaseGrades.includes(selectedBaseGrade) && uniqueBaseGrades.length > 0) {
      setSelectedBaseGrade(uniqueBaseGrades[0]);
    }
  }, [uniqueBaseGrades, selectedBaseGrade]);

  // Current selected Event info
  const currentEventInfo = OLYMPIC_EVENTS.find(e => e.id === selectedEventId) || OLYMPIC_EVENTS[0];
  const isRelevos = selectedEventId === 'relevos';
  const isBala = selectedEventId === 'bala';

  // All students belonging to selected Base Grade & Gender
  const eligibleStudentsForGradeGender = useMemo(() => {
    return (students || []).filter(s => {
      const matchBaseGrade = extractBaseGrade(s.gradeGroup) === selectedBaseGrade;
      const matchGender = s.gender === selectedGender;
      return matchBaseGrade && matchGender;
    });
  }, [students, selectedBaseGrade, selectedGender]);

  // Filter heats for current Event, Base Grade, and Gender
  const currentHeats = useMemo(() => {
    return (heats || [])
      .filter(h => {
        const heatEvent = h.eventId || 'velocidad';
        const matchEvent = heatEvent === selectedEventId;
        const matchBaseGrade = extractBaseGrade(h.gradeGroup) === selectedBaseGrade;
        const matchGender = h.gender === selectedGender;
        return matchEvent && matchBaseGrade && matchGender;
      })
      .sort((a, b) => a.number - b.number);
  }, [heats, selectedEventId, selectedBaseGrade, selectedGender]);

  // Student IDs assigned to ANY heat in this specific Event
  const assignedStudentIdsInCurrentEvent = useMemo(() => {
    const ids = new Set<string>();
    (heats || []).filter(h => (h.eventId || 'velocidad') === selectedEventId)
         .forEach(h => (h.studentIds || []).forEach(id => ids.add(id)));
    return ids;
  }, [heats, selectedEventId]);

  // Unassigned students for this specific Event
  const unassignedStudents = useMemo(() => {
    return eligibleStudentsForGradeGender.filter(s => !assignedStudentIdsInCurrentEvent.has(s.id));
  }, [eligibleStudentsForGradeGender, assignedStudentIdsInCurrentEvent]);

  // Drag & Drop Handlers
  const handleDragStart = (e: React.DragEvent, studentId: string) => {
    e.dataTransfer.setData('text/plain', studentId);
    setDraggedStudentId(studentId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDropToHeat = (e: React.DragEvent, heatId: string) => {
    e.preventDefault();
    const studentId = e.dataTransfer.getData('text/plain') || draggedStudentId;
    if (studentId) {
      onAssignStudentToHeat(studentId, heatId, selectedEventId);
    }
    setDraggedStudentId(null);
  };

  const handleDropToUnassigned = (e: React.DragEvent) => {
    e.preventDefault();
    const studentId = e.dataTransfer.getData('text/plain') || draggedStudentId;
    if (studentId) {
      onAssignStudentToHeat(studentId, null, selectedEventId);
    }
    setDraggedStudentId(null);
  };

  const renderEventIcon = (eventId: OlympicEventId) => {
    return <SeoulOlympicIcon eventId={eventId} size={20} className="shrink-0 text-amber-400" />;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* 1. DISCIPLINE EVENT SELECTOR (4 PRUEBAS) */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <Award className="w-4 h-4 text-amber-400" /> Selecciona la Prueba Atlética para Armar sus Hits:
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {OLYMPIC_EVENTS.map(ev => {
            const isSelected = selectedEventId === ev.id;
            return (
              <button
                key={ev.id}
                onClick={() => setSelectedEventId(ev.id)}
                className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                  isSelected
                    ? 'bg-slate-900 border-amber-500 shadow-lg shadow-amber-500/10'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/40 text-slate-400'
                }`}
              >
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                  isSelected ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-slate-800 text-slate-400'
                }`}>
                  {renderEventIcon(ev.id)}
                </div>
                <div>
                  <p className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                    {ev.name}
                  </p>
                  <p className="text-[10px] text-slate-500">
                    {ev.id === 'bala' 
                      ? '1 solo Hit único por grado/género (Sin límite)' 
                      : ev.id === 'relevos' 
                      ? 'Equipos de 4 (Mismo grupo o combinados)' 
                      : 'Hits de 4-5 alumnos (Mezcla A y B)'}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. BASE GRADE & GENDER FILTERS */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Base Grade Selector */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-2 shrink-0">
            Grado Escolar:
          </span>
          {uniqueBaseGrades.map(baseG => (
            <button
              key={baseG}
              onClick={() => setSelectedBaseGrade(baseG)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                selectedBaseGrade === baseG
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'bg-slate-950 text-slate-400 border border-slate-800 hover:border-slate-700'
              }`}
            >
              {baseG} Grado (Mezcla A/B)
            </button>
          ))}
        </div>

        {/* Gender Selector & Auto-Create Action */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-1">
            <button
              onClick={() => setSelectedGender('boy')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                selectedGender === 'boy'
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              👦 Niños ({eligibleStudentsForGradeGender.filter(s => s.gender === 'boy').length})
            </button>
            <button
              onClick={() => setSelectedGender('girl')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                selectedGender === 'girl'
                  ? 'bg-pink-500/20 text-pink-300 border border-pink-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              👧 Niñas ({eligibleStudentsForGradeGender.filter(s => s.gender === 'girl').length})
            </button>
          </div>

          <button
            onClick={() => onAutoCreateHeatsForCurrentFilter(selectedBaseGrade, selectedGender, selectedEventId)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30 transition-all"
            title={isBala ? "Agrupar a todos los alumnos en 1 solo Hit masivo" : isRelevos ? "Crear equipos de 4 integrantes" : "Mezclar alumnos de A y B en Hits parejas"}
          >
            <Shuffle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">
              {isBala ? 'Auto Hit Único (Bala)' : isRelevos ? 'Auto Equipos Relevos' : 'Auto-Crear Hits'}
            </span>
          </button>
        </div>

      </div>

      {/* 3. MAIN BOARD: UNASSIGNED POOL + HITS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: Unassigned Students for this Event */}
        <div 
          onDragOver={handleDragOver}
          onDrop={handleDropToUnassigned}
          className="lg:col-span-4 glass-panel p-5 rounded-2xl border border-slate-800 flex flex-col min-h-[500px]"
        >
          <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-400" />
                Pendientes para {currentEventInfo.shortName}
              </h2>
              <p className="text-[11px] text-slate-400">
                {selectedBaseGrade} Grado — {selectedGender === 'boy' ? 'Niños' : 'Niñas'} (Arrastra al Hit)
              </p>
            </div>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
              unassignedStudents.length > 0
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
            }`}>
              {unassignedStudents.length} pend.
            </span>
          </div>

          {/* Student Cards List */}
          <div className="space-y-2.5 overflow-y-auto flex-1 pr-1">
            {unassignedStudents.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500 space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 opacity-80" />
                <p className="text-xs font-semibold text-slate-300">¡Todos los alumnos están asignados en esta prueba!</p>
                <p className="text-[11px]">Puedes cambiar de prueba arriba o moverlos entre Hits.</p>
              </div>
            ) : (
              unassignedStudents.map(student => (
                <div
                  key={student.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, student.id)}
                  className="p-3 bg-slate-900/90 border border-slate-700/70 hover:border-amber-500/60 rounded-xl cursor-grab active:cursor-grabbing transition-all shadow-md flex items-center justify-between group"
                >
                  <div className="flex items-center gap-2.5">
                    <GripVertical className="w-4 h-4 text-slate-500 group-hover:text-amber-400 transition-colors" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-100">{student.firstName} {student.lastName}</span>
                        <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] font-mono font-semibold text-amber-300 border border-amber-500/20">
                          {student.gradeGroup}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Quick Click Assign button */}
                  {currentHeats.length > 0 && (
                    <button
                      onClick={() => onAssignStudentToHeat(student.id, currentHeats[0].id)}
                      className="text-[10px] font-bold px-2 py-1 rounded bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-300 transition-all flex items-center gap-0.5"
                    >
                      <span>Hit 1</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Hits / Teams Grid */}
        <div className="lg:col-span-8 space-y-4">
          
          {/* Section Header */}
          <div className="flex items-center justify-between bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
            <div>
              <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-400" />
                {isBala 
                  ? 'Hit Único - Lanzamiento de Bala (Sin límite de alumnos)' 
                  : isRelevos 
                  ? 'Equipos de Relevos (4 alumnos)' 
                  : `Hits de ${currentEventInfo.shortName}`}
              </h2>
              <p className="text-[11px] text-slate-400">
                {isBala
                  ? 'En Lanzamiento de Bala compiten todos los alumnos del grado en un único Hit masivo.'
                  : isRelevos 
                  ? 'Generalmente del mismo salón, pero puedes combinar salones para completar 4 integrantes.'
                  : 'Arrastra y ordena alumnos de 1ºA y 1ºB en carreras parejas de 4-5 competidores.'}
              </p>
            </div>

            <button
              onClick={() => onCreateHeat(selectedBaseGrade, selectedGender, selectedEventId)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 text-slate-950 hover:bg-amber-400 shadow-md shadow-amber-500/20 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>{isBala ? 'Crear Hit Único' : isRelevos ? 'Nuevo Equipo Relevos' : 'Nuevo Hit'}</span>
            </button>
          </div>

          {/* Hits Grid */}
          {currentHeats.length === 0 ? (
            <div className="glass-panel p-12 rounded-2xl border border-slate-800 text-center text-slate-500 space-y-3">
              <Layers className="w-10 h-10 mx-auto text-slate-600" />
              <p className="text-sm font-semibold text-slate-300">
                No hay Hits creados para {currentEventInfo.shortName} ({selectedBaseGrade} Grado - {selectedGender === 'boy' ? 'Niños' : 'Niñas'})
              </p>
              <p className="text-xs">
                Haz clic en <strong>"{isBala ? 'Auto Hit Único' : 'Auto-Crear Hits'}"</strong> para meter a los competidores.
              </p>
            </div>
          ) : (
            <div className={`grid gap-4 ${isBala ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>
              {currentHeats.map((heat) => {
                const heatStudents = (heat.studentIds || [])
                  .map(id => (students || []).find(s => s.id === id))
                  .filter((s): s is Student => s !== undefined);

                const count = heatStudents.length;

                // Group analysis for Relevos
                const groupsInHeat = Array.from(new Set(heatStudents.map(s => s.gradeGroup)));
                const isMixedGroupsInRelevos = isRelevos && groupsInHeat.length > 1;

                const maxCapacity = isBala ? 999 : isRelevos ? RELEVOS_TEAM_SIZE : MAX_HEAT_CAPACITY;
                const minCapacity = isBala ? 1 : isRelevos ? RELEVOS_TEAM_SIZE : 4;
                const isIdealCount = isBala ? count > 0 : (count >= minCapacity && count <= maxCapacity);

                return (
                  <div
                    key={heat.id}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDropToHeat(e, heat.id)}
                    className="glass-panel p-4 rounded-2xl border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between"
                  >
                    
                    {/* Hit Card Header */}
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
                      <div className="flex items-center gap-2">
                        <span className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center justify-center font-bold text-xs">
                          #{heat.number}
                        </span>
                        <div>
                          <h3 className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                            <span>{isBala ? 'Hit Único - Lanzamiento de Bala' : isRelevos ? `Hit Único Relevos (${selectedBaseGrade} Grado)` : `Hit #${heat.number}`}</span>
                            {isRelevos && (
                              <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 text-[10px] border border-emerald-500/30 font-medium">
                                {groupsInHeat.length} Equipos ({groupsInHeat.join(', ')})
                              </span>
                            )}
                          </h3>
                          <span className="text-[10px] text-slate-400">
                            {currentEventInfo.shortName} — {selectedBaseGrade} Grado ({heat.gender === 'boy' ? 'Niños' : 'Niñas'})
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Capacity Indicator */}
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          isBala || isRelevos
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : isIdealCount
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : count > maxCapacity
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}>
                          {isBala ? `${count} competidores (Sin límite)` : isRelevos ? `${groupsInHeat.length} Equipos en Pista (${count} alumnos)` : `${count} / ${maxCapacity} alumnos`}
                        </span>

                        <button
                          onClick={() => onDeleteHeat(heat.id)}
                          className="p-1 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all"
                          title="Eliminar este Hit"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Relevos exception info tag */}
                    {isMixedGroupsInRelevos && (
                      <div className="mb-2 p-2 rounded-lg bg-sky-500/10 border border-sky-500/20 text-[10px] text-sky-300 flex items-center gap-1.5">
                        <Info className="w-3.5 h-3.5 shrink-0 text-sky-400" />
                        <span>Relevos en Pista: Se compite por equipos según su grupo ({groupsInHeat.join(', ')}).</span>
                      </div>
                    )}

                    {/* Drop Zone / Student List */}
                    <div className="space-y-3 min-h-[140px] max-h-[420px] overflow-y-auto bg-slate-950/60 p-2.5 rounded-xl border border-dashed border-slate-800">
                      {heatStudents.length === 0 ? (
                        <div className="h-full py-8 flex flex-col items-center justify-center text-center text-slate-500">
                          <p className="text-xs">Arrastra alumnos aquí</p>
                          <p className="text-[10px] text-slate-600">
                            {isBala ? '(Sin límite de alumnos para Bala)' : isRelevos ? '(Se agrupan automáticamente en equipos de 4 por salón)' : '(4 a 5 mezclando A y B)'}
                          </p>
                        </div>
                      ) : isRelevos ? (
                        /* RELEVOS TEAM BLOCKS DISPLAY (CHUNKS OF 4 STUDENTS PER TEAM) */
                        (() => {
                          const groupMap = new Map<string, Student[]>();
                          heatStudents.forEach(st => {
                            const grp = st.gradeGroup || 'Equipo';
                            const list = groupMap.get(grp) || [];
                            list.push(st);
                            groupMap.set(grp, list);
                          });

                          const teams: { laneNumber: number; label: string; students: Student[] }[] = [];
                          let laneCounter = 1;
                          const leftovers: Student[] = [];
                          const sortedGroups = Array.from(groupMap.keys()).sort();

                          // 1st pass: full teams of 4 from same group
                          sortedGroups.forEach(grp => {
                            const stList = groupMap.get(grp) || [];
                            const fullCount = Math.floor(stList.length / 4);
                            for (let t = 0; t < fullCount; t++) {
                              const chunk = stList.slice(t * 4, (t + 1) * 4);
                              const suffix = fullCount > 1 ? ` (Eq. ${t + 1})` : '';
                              teams.push({
                                laneNumber: laneCounter++,
                                label: `Equipo ${grp}${suffix}`,
                                students: chunk
                              });
                            }
                            leftovers.push(...stList.slice(fullCount * 4));
                          });

                          // 2nd pass: combine leftovers across groups into full Teams of 4!
                          for (let i = 0; i + 4 <= leftovers.length; i += 4) {
                            const chunk = leftovers.slice(i, i + 4);
                            const grpNames = Array.from(new Set(chunk.map(s => s.gradeGroup))).join('+');
                            teams.push({
                              laneNumber: laneCounter++,
                              label: `Equipo Combinado (${grpNames})`,
                              students: chunk
                            });
                          }

                          return teams.map((team) => {
                            const isFull = team.students.length === RELEVOS_TEAM_SIZE;
                            return (
                              <div key={`${team.label}-${team.laneNumber}`} className="space-y-1.5 p-2 rounded-xl bg-slate-900/80 border border-slate-800">
                                <div className="flex items-center justify-between text-[11px] font-bold border-b border-slate-800 pb-1">
                                  <span className="text-amber-300 flex items-center gap-1">
                                    <span>🏃‍♂️ Carril {team.laneNumber}:</span>
                                    <span>{team.label}</span>
                                  </span>
                                  <span className={`px-2 py-0.2 rounded text-[10px] font-mono ${
                                    isFull ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                  }`}>
                                    {team.students.length} / {RELEVOS_TEAM_SIZE} integrantes
                                  </span>
                                </div>

                                <div className="space-y-1">
                                  {team.students.map((st, index) => (
                                    <div
                                      key={st.id}
                                      draggable
                                      onDragStart={(e) => handleDragStart(e, st.id)}
                                      className="p-1.5 bg-slate-950 border border-slate-800 hover:border-amber-500/50 rounded-lg flex items-center justify-between cursor-grab active:cursor-grabbing text-xs transition-all"
                                    >
                                      <div className="flex items-center gap-2">
                                        <span className="w-4 h-4 rounded-full bg-slate-800 text-amber-300 text-[10px] font-mono flex items-center justify-center font-bold">
                                          #{index + 1}
                                        </span>
                                        <span className="font-semibold text-slate-100">{st.firstName} {st.lastName}</span>
                                      </div>
                                      <button
                                        onClick={() => onAssignStudentToHeat(st.id, null)}
                                        className="text-[10px] text-slate-500 hover:text-slate-300 px-1 py-0.2 rounded hover:bg-slate-800"
                                        title="Quitar de este Hit"
                                      >
                                        ✕
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          });
                        })()
                      ) : (
                        heatStudents.map((st, index) => (
                          <div
                            key={st.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, st.id)}
                            className="p-2 bg-slate-900 border border-slate-700/60 rounded-lg flex items-center justify-between cursor-grab active:cursor-grabbing text-xs hover:border-amber-500/50 transition-all"
                          >
                            <div className="flex items-center gap-2">
                              <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-400 text-[10px] font-mono flex items-center justify-center font-bold">
                                #{index + 1}
                              </span>
                              <span className="font-semibold text-slate-100">{st.firstName} {st.lastName}</span>
                              <span className="px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-300 text-[10px] font-mono border border-amber-500/20">
                                {st.gradeGroup}
                              </span>
                            </div>

                            <button
                              onClick={() => onAssignStudentToHeat(st.id, null)}
                              className="text-[10px] text-slate-500 hover:text-slate-300 px-1.5 py-0.5 rounded hover:bg-slate-800"
                              title="Quitar de este Hit"
                            >
                              ✕
                            </button>
                          </div>
                        ))
                      )}
                    </div>

                  </div>
                );
              })}
            </div>
          )}

        </div>

      </div>

    </div>
  );
};
