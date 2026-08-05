import React, { useMemo } from 'react';
import { OLYMPIC_EVENTS, SCHOOL_LEVELS, extractBaseGrade } from '../types/olympics';
import type { 
  Student, 
  Heat, 
  OlympicEventId,
  SchoolLevelId 
} from '../types/olympics';
import { 
  Radio, 
  ChevronRight, 
  Zap, 
  Activity, 
  Users, 
  Target,
  UserX,
  CheckCircle2,
  Info,
  Trophy
} from 'lucide-react';
import { LaSalleLogo } from './LaSalleLogo';
import { SeoulOlympicIcon } from './SeoulOlympicIcons';
import { TournamentReportView } from './TournamentReportView';

interface LiveEventPublicViewProps {
  students: Student[];
  heats: Heat[];
  activeHeatId: string | null;
  activeLevel?: SchoolLevelId;
  onSelectLevel?: (level: SchoolLevelId) => void;
}

// Helper to render Seoul 1988 Olympic Pictogram for discipline
const renderEventIcon = (eventId: OlympicEventId) => {
  return <SeoulOlympicIcon eventId={eventId} size={26} className="shrink-0 text-amber-300" />;
};

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

export const LiveEventPublicView: React.FC<LiveEventPublicViewProps> = ({
  students = [],
  heats = [],
  activeHeatId,
  activeLevel = 'primaria',
  onSelectLevel
}) => {

  const getStudent = (id: string): Student => {
    const found = (students || []).find(s => s.id === id);
    if (found) return found;
    return {
      id,
      firstName: 'Competidor',
      lastName: '',
      gradeGroup: '',
      gender: 'boy',
      events: [],
      createdAt: 0
    };
  };

  // All valid heats ordered by official discipline sequence
  const allOrderedHeats = useMemo(() => {
    return (heats || [])
      .filter(h => (h.studentIds || []).length > 0)
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

  // Active Hit
  const activeHeat = useMemo(() => {
    if (!activeHeatId) {
      const liveH = allOrderedHeats.find(h => h.status === 'live');
      if (liveH) return liveH;
      const pendingH = allOrderedHeats.find(h => h.status !== 'finished');
      if (pendingH) return pendingH;
      return allOrderedHeats[0] || null;
    }
    return allOrderedHeats.find(h => h.id === activeHeatId) || allOrderedHeats[0] || null;
  }, [allOrderedHeats, activeHeatId]);

  const activeIndex = useMemo(() => {
    if (!activeHeat) return -1;
    return allOrderedHeats.findIndex(h => h.id === activeHeat.id);
  }, [allOrderedHeats, activeHeat]);

  // Next Heat
  const nextHeat = useMemo(() => {
    if (activeIndex === -1 || activeIndex >= allOrderedHeats.length - 1) return null;
    return allOrderedHeats[activeIndex + 1];
  }, [allOrderedHeats, activeIndex]);

  // Previous Heat (Last finished heat)
  const previousHeat = useMemo(() => {
    const finished = allOrderedHeats.filter(h => h.status === 'finished');
    if (finished.length > 0) return finished[finished.length - 1];
    if (activeIndex > 0) return allOrderedHeats[activeIndex - 1];
    return null;
  }, [allOrderedHeats, activeIndex]);

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

  const renderEventIcon = (eventId: OlympicEventId) => {
    switch (eventId) {
      case 'relevos': return <Users className="w-6 h-6 text-emerald-400" />;
      case 'velocidad': return <Zap className="w-6 h-6 text-blue-400" />;
      case 'vallas': return <Activity className="w-6 h-6 text-purple-400" />;
      case 'bala': return <Target className="w-6 h-6 text-amber-400" />;
    }
  };

  // Check if all heats in the competition have been finished
  const isEventCompleted = useMemo(() => {
    if (!allOrderedHeats || allOrderedHeats.length === 0) return false;
    const finishedCount = allOrderedHeats.filter(h => h.status === 'finished').length;
    return finishedCount === allOrderedHeats.length;
  }, [allOrderedHeats]);

  return (
    <div className="space-y-6 animate-fade-in pb-8 font-sans max-w-7xl mx-auto">
      
      {/* HEADER LIVE BANNER */}
      <div className="bg-slate-900 border border-blue-900/40 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-4 shadow-xl dark-card-fix">
        <div className="flex items-center gap-3">
          <LaSalleLogo size={44} showText={false} />
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
              </span>
              <span className="text-[11px] font-black text-rose-400 uppercase tracking-wider">
                {isEventCompleted ? 'TRANSMISIÓN EN VIVO — EVENTO FINALIZADO' : 'TRANSMISIÓN EN VIVO DEL ESTADIO'}
              </span>
            </div>
            <h1 className="text-xl font-black text-white tracking-tight">
              OLIMPIADA LIVE — Colegio La Salle Tuxtla
            </h1>
          </div>
        </div>

        {/* Automated Live Status Badge */}
        <div className="flex items-center gap-2 bg-slate-950 px-3.5 py-2 rounded-xl border border-slate-800 text-xs font-bold text-slate-300">
          <Radio className="w-4 h-4 text-rose-400 animate-pulse" />
          <span>Sincronizado en tiempo real</span>
        </div>
      </div>

      {/* 🏆 EVENT COMPLETION HERO BANNER & MEDALLERO FOR PARENTS */}
      {isEventCompleted ? (
        <div className="space-y-6 animate-fade-in">
          <div className="dark-card-fix relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#051930] via-[#002B66] to-[#7f1d1d] border-2 border-amber-400 p-6 md:p-8 shadow-2xl text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-3xl bg-amber-400/20 border border-amber-400/50 flex items-center justify-center text-3xl shadow-lg">
              🎉
            </div>
            <div className="space-y-2 max-w-2xl mx-auto">
              <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 inline-block">
                ¡Competencia Concluida Exitosamente!
              </span>
              <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
                ¡Muchas gracias por acudir a animar a nuestros atletas!
              </h2>
              <p className="text-xs md:text-sm text-slate-200 font-medium leading-relaxed">
                Ha finalizado el programa oficial de carreras de las Mini / Olimpiadas Escolares del <strong>Colegio La Salle de Tuxtla</strong>. 
                ¡Agradecemos de corazón a todos los padres de familia por su constante apoyo, porras y dinamismo en las tribunas!
              </p>
            </div>
          </div>

          {/* MEDALLERO Y CUADRO DE HONOR INTEGRADO */}
          <div className="bg-slate-900/90 border border-amber-500/30 rounded-3xl p-5 md:p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-2.5 border-b border-slate-800 pb-3">
              <Trophy className="w-6 h-6 text-amber-400" />
              <div>
                <h3 className="text-lg font-black text-white">
                  Medallero General & Cuadro de Honor Oficial
                </h3>
                <p className="text-xs text-slate-400">
                  Resultados finales acumulados por grupo en todas las disciplinas.
                </p>
              </div>
            </div>
            <TournamentReportView students={students} heats={heats} />
          </div>
        </div>
      ) : activeHeat ? (
        (() => {
          const eventInfo = OLYMPIC_EVENTS.find(e => e.id === (activeHeat.eventId || 'velocidad')) || OLYMPIC_EVENTS[0];
          const isRelevos = (activeHeat.eventId || 'velocidad') === 'relevos';
          const isBala = (activeHeat.eventId || 'velocidad') === 'bala';
          const heatStudents = (activeHeat.studentIds || []).map(getStudent).filter((s): s is Student => s !== undefined);
          const relevosTeams = isRelevos ? getRelevosTeamsForHeat(activeHeat) : [];
          const activeResultsMap = new Map((activeHeat.results || []).map(r => [r.studentId, r]));

          // Avatar Image: niño.jpg vs niña.jpg
          const runnerAvatar = activeHeat.gender === 'boy' ? './niño.jpg' : './niña.jpg';

          return (
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-950 via-slate-900 to-slate-950 border-2 border-rose-500/80 p-5 md:p-6 shadow-2xl space-y-5 dark-card-fix">
              
              {/* Header Status Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-blue-900/60 pb-3">
                <div className="flex items-center gap-3">
                  <span className="px-3.5 py-1.5 rounded-full bg-rose-600 text-white font-black text-xs uppercase tracking-wider animate-pulse flex items-center gap-1.5 shadow-lg shadow-rose-500/30">
                    <Radio className="w-4 h-4" /> HIT EN PISTA
                  </span>
                  <span className="text-xs font-bold text-amber-300 bg-amber-500/10 px-3 py-1.5 rounded-xl border border-amber-500/20">
                    {extractBaseGrade(activeHeat.gradeGroup)} Grado — {activeHeat.gender === 'boy' ? 'Rama Varonil (Niños)' : 'Rama Femenil (Niñas)'}
                  </span>
                </div>

                <div className="text-xs font-mono font-bold text-slate-300 bg-slate-950/80 px-3 py-1 rounded-lg border border-slate-800">
                  {isRelevos ? `Relevo Hit — ${relevosTeams.length} Equipos` : `Hit #${activeIndex + 1} de ${allOrderedHeats.length}`}
                </div>
              </div>

              {/* Event Title */}
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-blue-900/60 border border-blue-700/60 flex items-center justify-center shrink-0">
                  {renderEventIcon(eventInfo.id)}
                </div>
                <div>
                  <h2 className="text-xl md:text-2xl font-black text-white tracking-tight">
                    {isRelevos 
                      ? `RELEVO HIT — ${extractBaseGrade(activeHeat.gradeGroup)} Grado (${activeHeat.gender === 'boy' ? 'Varonil' : 'Femenil'})`
                      : isBala 
                      ? `Lanzamiento de Bala — ${extractBaseGrade(activeHeat.gradeGroup)} Grado`
                      : `Hit #${activeHeat.number} — ${eventInfo.name}`}
                  </h2>
                  <p className="text-xs text-slate-300 font-medium">
                    {isRelevos 
                      ? `Carrera oficial de Relevos con los equipos representantes.`
                      : isBala 
                      ? 'Prueba de fuerza e impulso en orden de lista.' 
                      : 'Carrera de velocidad máxima en carril asignado.'}
                  </p>
                </div>
              </div>

              {/* ATHLETES/RELEVOS CARDS IN TRACK */}
              {isRelevos ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {relevosTeams.map((team) => {
                    const sampleStId = team.students[0]?.id;
                    const teamPlace = sampleStId ? activeResultsMap.get(sampleStId)?.place : null;

                    return (
                      <div 
                        key={team.teamNumber}
                        className={`rounded-2xl p-4 shadow-xl space-y-3 transition-all ${
                          teamPlace === 1
                            ? 'bg-amber-500/20 border-2 border-amber-400 shadow-amber-500/20 scale-[1.01]'
                            : teamPlace === 2
                            ? 'bg-slate-300/20 border-2 border-slate-300 shadow-slate-300/20'
                            : teamPlace === 3
                            ? 'bg-amber-800/25 border-2 border-amber-700'
                            : teamPlace === 'DNS'
                            ? 'bg-rose-950/40 border-2 border-rose-800/60 opacity-60'
                            : 'bg-slate-900/90 border-2 border-emerald-500/60 hover:border-amber-400'
                        }`}
                      >
                        <div className="flex items-center justify-between border-b border-emerald-900/50 pb-2">
                          <div className="flex items-center gap-2">
                            <img 
                              src={runnerAvatar} 
                              alt="Atleta" 
                              className="w-10 h-10 rounded-xl object-cover border-2 border-emerald-400 shadow"
                            />
                            <div>
                              <span className="bg-emerald-500 text-slate-950 font-black px-2.5 py-0.5 rounded text-[11px] uppercase shadow-sm">
                                Carril {team.teamNumber}
                              </span>
                              <p className="text-amber-300 font-extrabold text-xs mt-0.5">
                                Equipo {team.teamNumber} ({team.gradeGroup})
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-1 pt-1">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Integrantes del Equipo:</p>
                          <div className="space-y-1 font-semibold text-xs text-slate-100">
                            {team.students.map((st, sIdx) => (
                              <div key={st.id} className="flex items-center justify-between bg-slate-950/80 px-2.5 py-1 rounded-lg border border-slate-800">
                                <span className="text-amber-400 font-mono text-[10px]">#{sIdx + 1}</span>
                                <span className="font-bold uppercase text-[11px] text-slate-100">{getCleanStudentFullName(st)}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="pt-2 border-t border-slate-800 text-[11px] font-semibold flex items-center justify-between">
                          {teamPlace === 1 ? (
                            <span className="px-3 py-1 rounded-full bg-amber-400 text-slate-950 font-black flex items-center gap-1 shadow-md animate-bounce">
                              🥇 1.er Lugar (Oro)
                            </span>
                          ) : teamPlace === 2 ? (
                            <span className="px-3 py-1 rounded-full bg-slate-200 text-slate-950 font-black flex items-center gap-1 shadow-md">
                              🥈 2.º Lugar (Plata)
                            </span>
                          ) : teamPlace === 3 ? (
                            <span className="px-3 py-1 rounded-full bg-amber-700 text-white font-black flex items-center gap-1 shadow-md">
                              🥉 3.er Lugar (Bronce)
                            </span>
                          ) : teamPlace === 'DNS' ? (
                            <span className="px-2.5 py-0.5 rounded-full bg-rose-600 text-white font-bold flex items-center gap-1">
                              <UserX className="w-3.5 h-3.5" /> Ausente (DNS)
                            </span>
                          ) : (
                            <span className="text-emerald-400 font-semibold flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> En Posición de Salida
                            </span>
                          )}
                          <span className="text-slate-400 font-mono text-[10px]">{team.students.length} Alumnos</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* INDIVIDUAL RUNNERS CARD GRID */
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                  {heatStudents.map((st, idx) => {
                    const stResult = activeResultsMap.get(st.id);
                    const place = stResult?.place;

                    return (
                      <div 
                        key={st.id} 
                        className={`rounded-2xl p-4 shadow-xl flex flex-col justify-between space-y-3 transition-all group ${
                          place === 1
                            ? 'bg-amber-500/20 border-2 border-amber-400 shadow-amber-500/20 scale-[1.01]'
                            : place === 2
                            ? 'bg-slate-300/20 border-2 border-slate-300 shadow-slate-300/20'
                            : place === 3
                            ? 'bg-amber-800/25 border-2 border-amber-700'
                            : place === 'DNS'
                            ? 'bg-rose-950/40 border-2 border-rose-800/60 opacity-60'
                            : 'bg-slate-900/90 border-2 border-slate-700/80 hover:border-amber-400'
                        }`}
                      >
                        <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                          <div className="flex items-center gap-2.5">
                            <img 
                              src={runnerAvatar} 
                              alt="Atleta" 
                              className="w-11 h-11 rounded-xl object-cover border-2 border-amber-400/80 shadow shrink-0"
                            />
                            <div>
                              <span className="px-2 py-0.5 rounded text-[10px] font-black bg-amber-500 text-slate-950 uppercase tracking-wider">
                                CARRIL {idx + 1}
                              </span>
                              <p className="text-[11px] font-bold text-amber-300 font-mono mt-0.5">
                                Grupo {st.gradeGroup}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div>
                          <h4 className="text-base font-black text-white group-hover:text-amber-300 transition-colors leading-tight">
                            {getCleanStudentFullName(st)}
                          </h4>
                          <p className="text-xs text-slate-300 font-medium mt-0.5">
                            {st.gradeGroup}
                          </p>
                        </div>

                        <div className="pt-2 border-t border-slate-800 text-[11px] font-semibold flex items-center justify-between">
                          {place === 1 ? (
                            <span className="px-2.5 py-1 rounded-full bg-amber-400 text-slate-950 font-black flex items-center gap-1 shadow-md animate-bounce text-xs">
                              🥇 1.er Lugar
                            </span>
                          ) : place === 2 ? (
                            <span className="px-2.5 py-1 rounded-full bg-slate-200 text-slate-950 font-black flex items-center gap-1 shadow-md text-xs">
                              🥈 2.º Lugar
                            </span>
                          ) : place === 3 ? (
                            <span className="px-2.5 py-1 rounded-full bg-amber-700 text-white font-black flex items-center gap-1 shadow-md text-xs">
                              🥉 3.er Lugar
                            </span>
                          ) : place === 'DNS' ? (
                            <span className="px-2 py-0.5 rounded-full bg-rose-600 text-white font-bold flex items-center gap-1 text-[11px]">
                              <UserX className="w-3.5 h-3.5" /> Ausente
                            </span>
                          ) : (
                            <span className="text-emerald-400 flex items-center gap-1 text-[11px] font-bold">
                              <CheckCircle2 className="w-3.5 h-3.5" /> En pista
                            </span>
                          )}
                          {stResult?.timeMark && (
                            <span className="font-mono text-amber-300 font-bold text-xs bg-slate-950 px-2 py-0.5 rounded border border-amber-500/20">{stResult.timeMark}</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

            </div>
          );
        })()
      ) : (
        <div className="glass-panel p-8 rounded-3xl border border-slate-800 text-center text-slate-400 space-y-3">
          <p className="text-base font-bold text-white">No hay ningún Hit activo actualmente en {activeLevel.toUpperCase()}.</p>
          <p className="text-xs text-slate-300">Selecciona otra sección para visualizar la competencia:</p>
          <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
            {SCHOOL_LEVELS.map(lvl => (
              <button
                key={lvl.id}
                onClick={() => onSelectLevel && onSelectLevel(lvl.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                  activeLevel === lvl.id
                    ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-md'
                    : 'bg-slate-900 text-slate-200 border-slate-700 hover:border-amber-400'
                }`}
              >
                {lvl.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 🏁 SECTION 2 & 3: HIT ANTERIOR (WITH PODIO IMAGE) & SIGUIENTE HIT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* HIT ANTERIOR (PODIO SECTION) */}
        <div className="lg:col-span-7 glass-panel p-5 rounded-3xl border border-amber-500/30 shadow-xl space-y-4 dark-card-fix">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-400" />
                HIT ANTERIOR — Podio & Ganadores
              </h3>
              <p className="text-xs text-slate-300">
                Premiación y medallas de la última competencia finalizada.
              </p>
            </div>
            <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 text-xs font-bold">
              Último Resultado
            </span>
          </div>

          {!previousHeat ? (
            <div className="p-8 text-center text-slate-400 text-xs italic bg-slate-950/60 rounded-2xl border border-slate-800">
              Aún no ha finalizado ningún Hit previo. Los resultados del podio aparecerán aquí en cuanto concluya la primera carrera.
            </div>
          ) : (
            (() => {
              const evInfo = OLYMPIC_EVENTS.find(e => e.id === (previousHeat.eventId || 'velocidad')) || OLYMPIC_EVENTS[0];
              const isPrevRelevos = (previousHeat.eventId || 'velocidad') === 'relevos';
              const prevTeams = isPrevRelevos ? getRelevosTeamsForHeat(previousHeat) : [];
              const heatStudents = (previousHeat.studentIds || []).map(getStudent).filter((s): s is Student => s !== undefined);
              const resultsMap = new Map((previousHeat.results || []).map(r => [r.studentId, r]));

              return (
                <div className="space-y-4">
                  {/* Event Info Header */}
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-100 uppercase">
                      {evInfo.name} — {previousHeat.gender === 'boy' ? 'Varonil' : 'Femenil'} ({extractBaseGrade(previousHeat.gradeGroup)} Grado)
                    </span>
                    <span className="text-amber-400">Hit #{previousHeat.number}</span>
                  </div>

                  {/* PODIO IMAGE BANNER */}
                  <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800 text-center">
                    <img 
                      src="./podio.png" 
                      alt="Podio Olímpico de Ganadores" 
                      className="max-h-40 md:max-h-48 object-contain mx-auto drop-shadow-lg"
                    />
                    <p className="text-[11px] font-bold text-amber-300 uppercase tracking-widest mt-1">
                      Medallero Oficial del Hit Anterior
                    </p>
                  </div>

                  {/* WINNERS LIST (RELEVOS TEAMS OR INDIVIDUAL ATHLETES) */}
                  <div className="space-y-2">
                    {isPrevRelevos ? (
                      // RELEVOS PODIUM WINNERS
                      prevTeams.map(team => {
                        const sampleStId = team.students[0]?.id;
                        const place = sampleStId ? resultsMap.get(sampleStId)?.place : null;
                        if (!place || place === 'DNS') return null;

                        return (
                          <div 
                            key={team.teamNumber} 
                            className={`p-3.5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg border ${
                              place === 1
                                ? 'bg-gradient-to-r from-amber-500/20 via-yellow-500/10 to-slate-900 border-amber-400/50'
                                : place === 2
                                ? 'bg-gradient-to-r from-slate-300/20 via-slate-400/10 to-slate-900 border-slate-400/50'
                                : 'bg-gradient-to-r from-amber-700/20 via-amber-800/10 to-slate-900 border-amber-700/50'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-xl font-black text-sm flex items-center justify-center shadow-md ${
                                place === 1 ? 'bg-amber-400 text-slate-950' : place === 2 ? 'bg-slate-300 text-slate-950' : 'bg-amber-700 text-white'
                              }`}>
                                {place === 1 ? '🥇 1.º' : place === 2 ? '🥈 2.º' : '🥉 3.er'}
                              </div>
                              <div>
                                <p className="font-black text-white text-sm">Equipo {team.teamNumber} ({team.gradeGroup})</p>
                                <p className="text-[11px] text-slate-300 font-medium">
                                  {team.students.map(s => getCleanStudentFullName(s)).join(', ')}
                                </p>
                              </div>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-black shadow ${
                              place === 1 ? 'bg-amber-400 text-slate-950' : place === 2 ? 'bg-slate-300 text-slate-950' : 'bg-amber-700 text-white'
                            }`}>
                              {place === 1 ? 'Oro 🥇' : place === 2 ? 'Plata 🥈' : 'Bronce 🥉'}
                            </span>
                          </div>
                        );
                      })
                    ) : (
                      // INDIVIDUAL ATHLETES PODIUM WINNERS
                      heatStudents.map(st => {
                        const stRes = resultsMap.get(st.id);
                        const place = stRes?.place;
                        if (!place || place === 'DNS') return null;

                        return (
                          <div 
                            key={st.id} 
                            className={`p-3.5 rounded-2xl flex items-center justify-between shadow-lg border ${
                              place === 1
                                ? 'bg-gradient-to-r from-amber-500/20 via-yellow-500/10 to-slate-900 border-amber-400/50'
                                : place === 2
                                ? 'bg-gradient-to-r from-slate-300/20 via-slate-400/10 to-slate-900 border-slate-400/50'
                                : 'bg-gradient-to-r from-amber-700/20 via-amber-800/10 to-slate-900 border-amber-700/50'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-xl font-black text-sm flex items-center justify-center shadow-md ${
                                place === 1 ? 'bg-amber-400 text-slate-950' : place === 2 ? 'bg-slate-300 text-slate-950' : 'bg-amber-700 text-white'
                              }`}>
                                {place === 1 ? '🥇 1.º' : place === 2 ? '🥈 2.º' : '🥉 3.er'}
                              </div>
                              <div>
                                <p className="font-black text-white text-sm">{getCleanStudentFullName(st)}</p>
                                <p className="text-[11px] font-mono font-bold text-amber-300">
                                  Grupo {st.gradeGroup} {stRes?.timeMark ? `— Marca: ${stRes.timeMark}` : ''}
                                </p>
                              </div>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-black shadow ${
                              place === 1 ? 'bg-amber-400 text-slate-950' : place === 2 ? 'bg-slate-300 text-slate-950' : 'bg-amber-700 text-white'
                            }`}>
                              {place === 1 ? 'Oro 🥇' : place === 2 ? 'Plata 🥈' : 'Bronce 🥉'}
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* 🏅 OFFICIAL PODIUM NOTICE FOR PARENTS */}
                  <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/20 via-amber-400/15 to-amber-600/20 border-2 border-amber-400 text-xs text-amber-200 flex items-center gap-3 font-semibold shadow-lg">
                    <Trophy className="w-6 h-6 shrink-0 text-amber-400 animate-bounce" />
                    <div>
                      <span className="font-extrabold text-amber-300 text-sm block">🏅 ¡Estimados Padres de Familia de los Premiados!</span>
                      <span>Favor de pasar de inmediato a la <strong>Zona del Podio</strong> para premiar y colgar personalmente la medalla a sus hijos.</span>
                    </div>
                  </div>

                </div>
              );
            })()
          )}
        </div>

        {/* SIGUIENTE HIT (UPCOMING SECTION) */}
        <div className="lg:col-span-5 glass-panel p-5 rounded-3xl border border-slate-800 shadow-xl space-y-4 dark-card-fix">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <ChevronRight className="w-5 h-5 text-amber-400" />
                SIGUIENTE HIT — Próximo a Salir
              </h3>
              <p className="text-xs text-slate-300">
                Competidores que deberán presentarse a continuación.
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs font-bold">
              A Continuación
            </span>
          </div>

          {!nextHeat ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              No hay más Hits programados a continuación.
            </div>
          ) : (
            (() => {
              const currentNextEvInfo = OLYMPIC_EVENTS.find(e => e.id === (nextHeat.eventId || 'velocidad')) || OLYMPIC_EVENTS[0];
              const isNextRelevos = (nextHeat.eventId || 'velocidad') === 'relevos';

              const heatStudents = (nextHeat.studentIds || [])
                .map(id => getStudent(id))
                .filter((s): s is Student => s !== undefined);

              const nextRelevosTeams = isNextRelevos ? getRelevosTeamsForHeat(nextHeat) : [];

              return (
                <div className="space-y-4">
                  <div className="flex items-center justify-between bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
                    <div>
                      <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest block mb-0.5">
                        {currentNextEvInfo.name} — {extractBaseGrade(nextHeat.gradeGroup)} Grado
                      </span>
                      <h4 className="text-sm font-black text-white">
                        {isNextRelevos ? `Relevos Hit #${nextHeat.number}` : `Hit #${nextHeat.number}`} ({nextHeat.gender === 'boy' ? 'Niños' : 'Niñas'})
                      </h4>
                    </div>

                    <span className="px-3 py-1 rounded-xl bg-amber-500/20 text-amber-300 font-mono font-bold text-xs border border-amber-500/30">
                      {isNextRelevos ? `${nextRelevosTeams.length} Equipos` : `${heatStudents.length} Alumnos`}
                    </span>
                  </div>

                  {/* Competitor List Table */}
                  <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/80">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-900 text-slate-400 uppercase font-mono text-[10px]">
                        <tr>
                          <th className="py-2.5 px-3">{isNextRelevos ? 'Equipo' : 'Carril'}</th>
                          <th className="py-2.5 px-3">Nombre del Alumno(a)</th>
                          <th className="py-2.5 px-3">Grupo</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/80 font-semibold text-slate-200">
                        {isNextRelevos ? (
                          nextRelevosTeams.map((team) => (
                            <tr key={team.teamNumber} className="hover:bg-slate-900/50">
                              <td className="py-2.5 px-3 font-mono font-bold text-amber-400">#{team.teamNumber}</td>
                              <td className="py-2.5 px-3 font-bold text-white">{team.students.map(s => getCleanStudentFullName(s)).join(', ')}</td>
                              <td className="py-2.5 px-3 font-mono text-slate-300">{team.gradeGroup}</td>
                            </tr>
                          ))
                        ) : (
                          heatStudents.map((st, idx) => (
                            <tr key={st.id} className="hover:bg-slate-900/50">
                              <td className="py-2.5 px-3 font-mono font-bold text-amber-400">#{idx + 1}</td>
                              <td className="py-2.5 px-3 font-bold text-white">{getCleanStudentFullName(st)}</td>
                              <td className="py-2.5 px-3 font-mono text-slate-300">{st.gradeGroup}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-xs text-amber-200 flex items-start gap-2.5 font-medium shadow-md">
                    <Info className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
                    <div>
                      <span className="font-bold text-amber-300 block">🏫 Organización de Pista:</span>
                      <span>Los maestros acompañan y organizan a los alumnos en el carril de salida. Estimados padres de familia, estén atentos al finalizar la carrera para pasar a la <strong>Zona del Podio</strong>.</span>
                    </div>
                  </div>
                </div>
              );
            })()
          )}
        </div>

      </div>

    </div>
  );
};
