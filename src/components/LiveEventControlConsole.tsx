import React, { useState, useEffect, useMemo } from 'react';
import { OLYMPIC_EVENTS, extractBaseGrade } from '../types/olympics';
import type { 
  Student, 
  Heat, 
  HeatResult, 
  HeatPlace, 
  OlympicEventId 
} from '../types/olympics';
import { 
  Radio, 
  ChevronLeft, 
  ChevronRight, 
  Send, 
  CheckCircle2, 
  AlertTriangle, 
  UserX, 
  Trophy,
  Save
} from 'lucide-react';

interface LiveEventControlConsoleProps {
  students: Student[];
  heats: Heat[];
  activeHeatId: string | null;
  onSetActiveHeatId: (heatId: string) => void;
  onSaveHeatResults: (heatId: string, results: HeatResult[], nextHeatId: string | null) => void;
  onOpenMedallero?: () => void;
  onOpenImpresion?: () => void;
}

// Discipline priority order: Relevos -> Velocidad -> Vallas -> Bala
const EVENT_PRIORITY_ORDER: Record<OlympicEventId, number> = {
  relevos: 1,
  velocidad: 2,
  vallas: 3,
  bala: 4
};

function getGradeNumber(gradeGroup: string): number {
  if (!gradeGroup) return 99;
  const match = gradeGroup.match(/([1-6])/);
  return match ? parseInt(match[1], 10) : 99;
}

// Helper to clean student name
function getCleanStudentFullName(st: Student): string {
  if (!st) return '';
  const rawName = `${st.firstName || ''} ${st.lastName || ''}`.trim();
  return rawName
    .replace(/\s*\(?\s*[1-6]º?\s*[RO]*\s*[A-F]?\s*\)?$/i, '')
    .replace(/\s*-\s*[1-6]º?\s*[A-F]?$/i, '')
    .trim();
}

export const LiveEventControlConsole: React.FC<LiveEventControlConsoleProps> = ({
  students = [],
  heats = [],
  activeHeatId,
  onSetActiveHeatId,
  onSaveHeatResults,
  onOpenMedallero,
  onOpenImpresion
}) => {
  const [isCompletionModalOpen, setIsCompletionModalOpen] = useState<boolean>(false);
  // All non-empty heats sorted in official event order: Relevos -> Velocidad -> Vallas -> Bala
  const validHeats = useMemo(() => {
    return (heats || [])
      .filter(h => {
        const validStudents = (h.studentIds || [])
          .map(id => (students || []).find(s => s.id === id))
          .filter((s): s is Student => s !== undefined);
        return validStudents.length > 0;
      })
      .sort((a, b) => {
        const evA = EVENT_PRIORITY_ORDER[a.eventId || 'velocidad'] || 99;
        const evB = EVENT_PRIORITY_ORDER[b.eventId || 'velocidad'] || 99;
        if (evA !== evB) return evA - evB;

        const gA = getGradeNumber(a.gradeGroup);
        const gB = getGradeNumber(b.gradeGroup);
        if (gA !== gB) return gA - gB;

        if (a.gender !== b.gender) return a.gender === 'boy' ? -1 : 1;
        return a.number - b.number;
      });
  }, [heats, students]);

  const currentHeat = useMemo(() => {
    if (!activeHeatId) {
      const liveH = validHeats.find(h => h.status === 'live');
      if (liveH) return liveH;
      const pendingH = validHeats.find(h => h.status !== 'finished');
      if (pendingH) return pendingH;
      return validHeats[0] || null;
    }
    return validHeats.find(h => h.id === activeHeatId) || validHeats[0] || null;
  }, [validHeats, activeHeatId]);

  const currentIndex = useMemo(() => {
    if (!currentHeat) return -1;
    return validHeats.findIndex(h => h.id === currentHeat.id);
  }, [validHeats, currentHeat]);

  // Parse Relevos Teams for a single Heat object (Chunks of 4 students per team)
  const getRelevosTeamsForHeat = (heat: Heat) => {
    const heatStudents = (heat.studentIds || [])
      .map(id => (students || []).find(s => s.id === id))
      .filter((s): s is Student => s !== undefined);

    const groupMap = new Map<string, Student[]>();
    heatStudents.forEach(st => {
      const grp = st.gradeGroup || 'Equipo';
      const list = groupMap.get(grp) || [];
      list.push(st);
      groupMap.set(grp, list);
    });

    const teams: { teamNumber: number; gradeGroup: string; students: Student[] }[] = [];
    let tIdx = 1;
    const leftovers: Student[] = [];

    const sortedGroups = Array.from(groupMap.keys()).sort();

    // 1st pass: full teams of 4 from same group
    sortedGroups.forEach((grp) => {
      const stList = groupMap.get(grp) || [];
      const fullCount = Math.floor(stList.length / 4);
      for (let t = 0; t < fullCount; t++) {
        const chunk = stList.slice(t * 4, (t + 1) * 4);
        const suffix = fullCount > 1 ? ` (Eq. ${t + 1})` : '';
        teams.push({
          teamNumber: tIdx++,
          gradeGroup: `${grp}${suffix}`,
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
        teamNumber: tIdx++,
        gradeGroup: `Comb. (${grpNames})`,
        students: chunk
      });
    }

    return teams;
  };

  // Results state for the active heat (map of studentId -> { place, timeMark })
  const [localResults, setLocalResults] = useState<Map<string, { place: HeatPlace; timeMark: string }>>(new Map());

  // Populate localResults when currentHeat changes
  useEffect(() => {
    if (currentHeat) {
      const map = new Map<string, { place: HeatPlace; timeMark: string }>();
      const existingResults = currentHeat.results || [];

      const isRelevos = (currentHeat.eventId || 'velocidad') === 'relevos';
      if (isRelevos) {
        const teams = getRelevosTeamsForHeat(currentHeat);
        teams.forEach(t => {
          t.students.forEach(st => {
            const found = existingResults.find(r => r.studentId === st.id);
            map.set(st.id, {
              place: found ? found.place : null,
              timeMark: found ? found.timeMark || '' : ''
            });
          });
        });
      } else {
        (currentHeat.studentIds || []).forEach(stId => {
          const found = existingResults.find(r => r.studentId === stId);
          map.set(stId, {
            place: found ? found.place : null,
            timeMark: found ? found.timeMark || '' : ''
          });
        });
      }

      setLocalResults(map);
    }
  }, [currentHeat, heats]);

  if (!currentHeat) {
    return (
      <div className="glass-panel p-12 rounded-3xl border border-slate-800 text-center text-slate-400 space-y-3 dark-card-fix">
        <Radio className="w-10 h-10 mx-auto text-slate-600 animate-pulse" />
        <p className="text-sm font-semibold text-slate-300">No hay Hits creados para controlar en vivo.</p>
        <p className="text-xs">Crea primero los Hits en la pestaña <strong>"2. Hits"</strong>.</p>
      </div>
    );
  }

  const eventInfo = OLYMPIC_EVENTS.find(e => e.id === (currentHeat.eventId || 'velocidad')) || OLYMPIC_EVENTS[0];
  const isRelevos = (currentHeat.eventId || 'velocidad') === 'relevos';
  const isBala = (currentHeat.eventId || 'velocidad') === 'bala';

  const heatStudents = (currentHeat.studentIds || [])
    .map(id => (students || []).find(s => s.id === id))
    .filter((s): s is Student => s !== undefined);

  const relevosTeams = isRelevos ? getRelevosTeamsForHeat(currentHeat) : [];

  // Helper to build formatted results from map
  const buildFormattedResults = (map: Map<string, { place: HeatPlace; timeMark: string }>): HeatResult[] => {
    const resList: HeatResult[] = [];
    map.forEach((val, stId) => {
      if (val.place) {
        resList.push({
          studentId: stId,
          place: val.place,
          timeMark: val.timeMark
        });
      }
    });
    return resList;
  };

  // Toggle place for an individual student
  const handleTogglePlace = (studentId: string, placeToSet: HeatPlace) => {
    const current = localResults.get(studentId) || { place: null, timeMark: '' };
    const newPlace = current.place === placeToSet ? null : placeToSet;

    const nextMap = new Map(localResults);
    nextMap.set(studentId, { ...current, place: newPlace });
    setLocalResults(nextMap);

    const formatted = buildFormattedResults(nextMap);
    onSaveHeatResults(currentHeat.id, formatted, null);
  };

  // Toggle place for an entire Relevos Team (Updates all 4 students in team)
  const handleToggleTeamPlace = (teamStudents: Student[], placeToSet: HeatPlace) => {
    const firstStudentId = teamStudents[0]?.id;
    if (!firstStudentId) return;

    const currentPlace = localResults.get(firstStudentId)?.place;
    const newPlace = currentPlace === placeToSet ? null : placeToSet;

    const nextMap = new Map(localResults);
    teamStudents.forEach(st => {
      const curr = nextMap.get(st.id) || { place: null, timeMark: '' };
      nextMap.set(st.id, { ...curr, place: newPlace });
    });
    setLocalResults(nextMap);

    const formatted = buildFormattedResults(nextMap);
    onSaveHeatResults(currentHeat.id, formatted, null);
  };

  const handleTimeChange = (studentId: string, value: string) => {
    const current = localResults.get(studentId) || { place: null, timeMark: '' };
    const nextMap = new Map(localResults);
    nextMap.set(studentId, { ...current, timeMark: value });
    setLocalResults(nextMap);
  };

  const nextHeat = currentIndex >= 0 && currentIndex < validHeats.length - 1 ? validHeats[currentIndex + 1] : null;
  const prevHeat = currentIndex > 0 ? validHeats[currentIndex - 1] : null;

  const isLastHeat = currentIndex >= 0 && currentIndex === validHeats.length - 1;

  // Save / Broadcast Handlers
  const handleSaveCorrectionOnly = () => {
    const formatted = buildFormattedResults(localResults);
    onSaveHeatResults(currentHeat.id, formatted, null);
    alert(`¡Resultados del Hit #${currentIndex + 1} guardados y actualizados en vivo!`);
  };

  const handleBroadcastAndAdvance = () => {
    const formatted = buildFormattedResults(localResults);
    if (isLastHeat) {
      onSaveHeatResults(currentHeat.id, formatted, null, true);
      setIsCompletionModalOpen(true);
    } else if (nextHeat) {
      onSaveHeatResults(currentHeat.id, formatted, nextHeat.id, false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in font-sans pb-12">
      
      {/* HEADER CONSOLE CONTROL & HEAT SELECTOR */}
      <div className="bg-slate-900 border border-amber-500/40 p-5 rounded-3xl shadow-xl flex flex-col md:flex-row items-center justify-between gap-4 dark-card-fix">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black">
            <Radio className="w-6 h-6 animate-pulse text-slate-950" />
          </div>
          <div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-amber-500/20 text-amber-300 border border-amber-500/30">
              Consola del Maestro en Vivo
            </span>
            <h1 className="text-lg font-black text-white">
              Control de Carrera & Edición de Resultados
            </h1>
          </div>
        </div>

        {/* Quick Selector Dropdown & Stepper */}
        <div className="flex flex-wrap items-center gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
          <button
            disabled={!prevHeat}
            onClick={() => prevHeat && onSetActiveHeatId(prevHeat.id)}
            className={`p-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
              prevHeat ? 'bg-slate-800 text-white hover:bg-slate-700' : 'text-slate-600 cursor-not-allowed'
            }`}
            title="Ir al Hit Anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Selector Dropdown for Any Heat (Finished or Pending) */}
          <select
            value={currentHeat.id}
            onChange={(e) => onSetActiveHeatId(e.target.value)}
            className="bg-slate-900 text-amber-300 font-bold border border-slate-700 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-amber-500 cursor-pointer max-w-[240px] sm:max-w-xs truncate"
          >
            {validHeats.map((h, hIdx) => {
              const isFinished = h.status === 'finished';
              const isLive = h.status === 'live';
              const evName = (OLYMPIC_EVENTS.find(e => e.id === (h.eventId || 'velocidad')) || OLYMPIC_EVENTS[0]).name;
              return (
                <option key={h.id} value={h.id}>
                  {isLive ? '🔴 EN PISTA: ' : isFinished ? '✅ FINALIZADO: ' : '⏳ PENDIENTE: '}
                  Hit #{hIdx + 1} — {evName} ({extractBaseGrade(h.gradeGroup)} {h.gender === 'boy' ? 'Niños' : 'Niñas'})
                </option>
              );
            })}
          </select>

          <button
            disabled={!nextHeat}
            onClick={() => nextHeat && onSetActiveHeatId(nextHeat.id)}
            className={`p-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
              nextHeat ? 'bg-amber-500 text-slate-950 hover:bg-amber-400 font-bold' : 'text-slate-600 cursor-not-allowed'
            }`}
            title="Ir al Siguiente Hit"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ACTIVE / EDITING HEAT CONTROL PANEL */}
      <div className="glass-panel p-6 rounded-3xl border border-amber-500/30 space-y-6 shadow-2xl dark-card-fix">
        
        {/* Banner Alert when Editing a Finished Heat */}
        {currentHeat.status === 'finished' && (
          <div className="bg-amber-500/15 border-2 border-amber-400 p-3.5 rounded-2xl flex items-center gap-3 text-xs font-bold text-amber-300 shadow-lg">
            <AlertTriangle className="w-5 h-5 shrink-0 text-amber-400 animate-pulse" />
            <div>
              <span>
                <strong>Modo Edición de Hit Finalizado (# {currentIndex + 1})</strong>: Puedes ajustar las posiciones o marcas de este Hit. Al presionar "Guardar Corrección", los cambios se reflejarán inmediatamente en la pantalla LIVE de los papás.
              </span>
            </div>
          </div>
        )}

        {/* Active Hit Title Info */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider inline-block mb-1 ${
              currentHeat.status === 'finished'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
            }`}>
              {currentHeat.status === 'finished' ? '✅ CORRIGIENDO RESULTADOS' : '🔴 HIT EN PISTA DE SALIDA'}
            </span>
            <h2 className="text-xl font-black text-white">
              {isRelevos 
                ? `RELEVO HIT — ${extractBaseGrade(currentHeat.gradeGroup)} Grado (${currentHeat.gender === 'boy' ? 'Varonil' : 'Femenil'})`
                : isBala 
                ? `Lanzamiento de Bala — ${extractBaseGrade(currentHeat.gradeGroup)} Grado` 
                : `Hit #${currentHeat.number} — ${eventInfo.name}`}
            </h2>
            <p className="text-xs text-amber-400 font-bold mt-0.5">
              {extractBaseGrade(currentHeat.gradeGroup)} Grado — {currentHeat.gender === 'boy' ? 'Rama Varonil (Niños)' : 'Rama Femenil (Niñas)'}
            </p>
          </div>

          <div className="text-right">
            <span className="text-xs text-slate-400 font-semibold block">En competencia:</span>
            <span className="text-base font-black text-white">
              {isRelevos ? `${relevosTeams.length} Equipos en Pista` : `${heatStudents.length} competidores en carril`}
            </span>
          </div>
        </div>

        {/* Competitor Touch Scoring List */}
        <div className="space-y-4">
          <p className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
            <Trophy className="w-4 h-4 text-amber-400" />
            {isRelevos 
              ? 'Toca el lugar del podio (1.º, 2.º, 3.º u Ausente) para cada EQUIPO participante:' 
              : 'Toca el lugar del podio (1.º, 2.º, 3.º u Ausente) para cada alumno:'}
          </p>

          {isRelevos ? (
            /* RELEVOS TEAMS SCORING LIST */
            <div className="space-y-4">
              {relevosTeams.map((team) => {
                const sampleStId = team.students[0]?.id;
                const teamPlace = sampleStId ? localResults.get(sampleStId)?.place : null;

                return (
                  <div 
                    key={team.teamNumber}
                    className={`p-5 rounded-2xl border transition-all space-y-3 ${
                      teamPlace === 1
                        ? 'bg-amber-500/15 border-amber-400 shadow-lg shadow-amber-500/10'
                        : teamPlace === 2
                        ? 'bg-slate-300/15 border-slate-300'
                        : teamPlace === 3
                        ? 'bg-amber-800/20 border-amber-700'
                        : teamPlace === 'DNS'
                        ? 'bg-rose-950/40 border-rose-800/60 opacity-60'
                        : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="bg-emerald-500 text-slate-950 font-black px-2.5 py-0.5 rounded text-xs uppercase">
                            Carril {team.teamNumber}
                          </span>
                          <span className="text-base font-black text-amber-300">
                            Equipo {team.teamNumber} ({team.gradeGroup})
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 mt-1">
                          {team.students.map(st => getCleanStudentFullName(st)).join(', ')}
                        </p>
                      </div>

                      {/* Touch Podium Buttons for Team */}
                      <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
                        <button
                          type="button"
                          onClick={() => handleToggleTeamPlace(team.students, 1)}
                          className={`px-3 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1 ${
                            teamPlace === 1
                              ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/30 scale-105'
                              : 'bg-slate-950 text-slate-300 border border-slate-800 hover:border-amber-400/50'
                          }`}
                        >
                          🥇 1.º Equipo
                        </button>

                        <button
                          type="button"
                          onClick={() => handleToggleTeamPlace(team.students, 2)}
                          className={`px-3 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1 ${
                            teamPlace === 2
                              ? 'bg-slate-200 text-slate-950 shadow-md shadow-slate-200/30 scale-105'
                              : 'bg-slate-950 text-slate-300 border border-slate-800 hover:border-slate-400/50'
                          }`}
                        >
                          🥈 2.º Equipo
                        </button>

                        <button
                          type="button"
                          onClick={() => handleToggleTeamPlace(team.students, 3)}
                          className={`px-3 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1 ${
                            teamPlace === 3
                              ? 'bg-amber-700 text-white shadow-md shadow-amber-700/30 scale-105'
                              : 'bg-slate-950 text-slate-300 border border-slate-800 hover:border-amber-700/50'
                          }`}
                        >
                          🥉 3.º Equipo
                        </button>

                        <button
                          type="button"
                          onClick={() => handleToggleTeamPlace(team.students, 'DNS')}
                          className={`px-2.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                            teamPlace === 'DNS'
                              ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                              : 'bg-slate-950 text-slate-500 border border-slate-800 hover:text-rose-400'
                          }`}
                        >
                          <UserX className="w-3.5 h-3.5" />
                          <span>DNS</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* INDIVIDUAL SCORING LIST */
            <div className="space-y-3">
              {heatStudents.map((st, idx) => {
                const res = localResults.get(st.id) || { place: null, timeMark: '' };
                const place = res.place;

                return (
                  <div 
                    key={st.id}
                    className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                      place === 1
                        ? 'bg-amber-500/15 border-amber-400 shadow-lg shadow-amber-500/10'
                        : place === 2
                        ? 'bg-slate-300/15 border-slate-300'
                        : place === 3
                        ? 'bg-amber-800/20 border-amber-700'
                        : place === 'DNS'
                        ? 'bg-rose-950/40 border-rose-800/60 opacity-60'
                        : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-xl bg-slate-800 text-amber-300 font-black text-xs flex items-center justify-center font-mono shrink-0">
                        #{idx + 1}
                      </span>
                      <div>
                        <h4 className="text-sm font-black text-white">
                          {getCleanStudentFullName(st)}
                        </h4>
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                          <span className="font-mono text-amber-300 font-bold">Grupo: {st.gradeGroup}</span>
                          <span>•</span>
                          <span>{isBala ? 'Competidor' : `Carril #${idx + 1}`}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
                      <input
                        type="text"
                        value={res.timeMark}
                        onChange={(e) => handleTimeChange(st.id, e.target.value)}
                        placeholder="Tiempo/Marca"
                        className="bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-mono text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500 w-28 text-center"
                      />

                      <button
                        type="button"
                        onClick={() => handleTogglePlace(st.id, 1)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1 ${
                          place === 1
                            ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/30 scale-105'
                            : 'bg-slate-950 text-slate-400 border border-slate-800 hover:border-amber-400/50'
                        }`}
                      >
                        🥇 1.º (Oro)
                      </button>

                      <button
                        type="button"
                        onClick={() => handleTogglePlace(st.id, 2)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1 ${
                          place === 2
                            ? 'bg-slate-200 text-slate-950 shadow-md shadow-slate-200/30 scale-105'
                            : 'bg-slate-950 text-slate-400 border border-slate-800 hover:border-slate-400/50'
                        }`}
                      >
                        🥈 2.º (Plata)
                      </button>

                      <button
                        type="button"
                        onClick={() => handleTogglePlace(st.id, 3)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1 ${
                          place === 3
                            ? 'bg-amber-700 text-white shadow-md shadow-amber-700/30 scale-105'
                            : 'bg-slate-950 text-slate-400 border border-slate-800 hover:border-amber-700/50'
                        }`}
                      >
                        🥉 3.º (Bronce)
                      </button>

                      <button
                        type="button"
                        onClick={() => handleTogglePlace(st.id, 'DNS')}
                        className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                          place === 'DNS'
                            ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                            : 'bg-slate-950 text-slate-500 border border-slate-800 hover:text-rose-400'
                        }`}
                      >
                        <UserX className="w-3.5 h-3.5" />
                        <span>DNS</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* DUAL ACTION BUTTONS (GUARDAR CORRECCIÓN vs GUARDAR Y AVANZAR) */}
        <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-slate-300 flex items-center gap-1">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Al guardar, las correcciones se reflejan al instante en la pantalla de los papás.</span>
          </p>

          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
            {/* Save Correction Only */}
            <button
              onClick={handleSaveCorrectionOnly}
              className="flex-1 sm:flex-none px-5 py-3 rounded-2xl font-black bg-slate-800 text-amber-300 border border-amber-500/40 hover:bg-slate-700 shadow-md flex items-center justify-center gap-2 transition-all text-xs"
            >
              <Save className="w-4 h-4" />
              <span>Guardar Corrección</span>
            </button>

            {/* Save & Advance / Finish */}
            <button
              onClick={handleBroadcastAndAdvance}
              className={`flex-1 sm:flex-none px-6 py-3 rounded-2xl font-black shadow-xl flex items-center justify-center gap-2 transition-all text-xs transform hover:scale-[1.02] ${
                isLastHeat
                  ? 'bg-gradient-to-r from-emerald-500 via-amber-400 to-amber-500 text-slate-950 shadow-emerald-500/25 border border-amber-300'
                  : 'bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 hover:from-amber-400 hover:to-amber-300 shadow-amber-500/25'
              }`}
            >
              <Send className="w-4 h-4" />
              <span>
                {isLastHeat ? '🏆 Guardar & Finalizar Competencia' : 'Guardar & Avanzar al Siguiente Hit ➔'}
              </span>
            </button>
          </div>
        </div>

      </div>

      {/* 🏆 EVENT COMPLETION CELEBRATION MODAL */}
      {isCompletionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in">
          <div className="bg-slate-900 border-2 border-amber-400 rounded-3xl p-6 md:p-8 max-w-lg w-full text-center space-y-6 shadow-2xl relative overflow-hidden">
            
            {/* Confetti decoration / Glow */}
            <div className="w-20 h-20 mx-auto rounded-3xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-4xl shadow-inner">
              🏆
            </div>

            <div className="space-y-2">
              <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 inline-block">
                ¡Competencia Concluida Exitosamente!
              </span>
              <h2 className="text-2xl font-black text-white tracking-tight">
                Todos los Hits han sido Registrados
              </h2>
              <p className="text-xs text-slate-300">
                Has guardado el último Hit de la jornada. Todos los tiempos, marcas y lugares ya se encuentran sincronizados en tiempo real.
              </p>
            </div>

            <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 space-y-2 text-xs text-slate-300">
              <div className="flex justify-between border-b border-slate-800 pb-1.5 font-semibold">
                <span>Total de Hits Completados:</span>
                <span className="text-amber-300 font-bold">{validHeats.length} Hits</span>
              </div>
              <div className="flex justify-between font-semibold">
                <span>Total de Alumnos Participantes:</span>
                <span className="text-emerald-300 font-bold">{students.length} Alumnos</span>
              </div>
            </div>

            <div className="space-y-2.5 pt-2">
              {onOpenMedallero && (
                <button
                  onClick={() => {
                    setIsCompletionModalOpen(false);
                    onOpenMedallero();
                  }}
                  className="w-full py-3.5 px-4 rounded-2xl font-black bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 shadow-xl hover:from-amber-300 hover:to-amber-400 transition-all flex items-center justify-center gap-2 text-sm"
                >
                  🥇 Ir al Medallero y Cuadro de Honor
                </button>
              )}

              {onOpenImpresion && (
                <button
                  onClick={() => {
                    setIsCompletionModalOpen(false);
                    onOpenImpresion();
                  }}
                  className="w-full py-3 px-4 rounded-2xl font-bold bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-700 transition-all flex items-center justify-center gap-2 text-xs"
                >
                  🖨️ Imprimir Resumen y Planillas Oficiales
                </button>
              )}

              <button
                onClick={() => setIsCompletionModalOpen(false)}
                className="w-full py-2 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-all"
              >
                Cerrar y permanecer en la consola
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
