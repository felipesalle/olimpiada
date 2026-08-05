import React, { useState, useMemo } from 'react';
import { 
  OLYMPIC_EVENTS, 
  extractBaseGrade 
} from '../types/olympics';
import type { 
  Student, 
  Heat, 
  Gender, 
  OlympicEventId 
} from '../types/olympics';
import { 
  Search, 
  UserCheck, 
  Calendar, 
  Sparkles,
  Award
} from 'lucide-react';
import { LaSalleLogo } from './LaSalleLogo';
import { SeoulOlympicIcon } from './SeoulOlympicIcons';

interface PublicPortalViewProps {
  students: Student[];
  heats: Heat[];
}

export const PublicPortalView: React.FC<PublicPortalViewProps> = ({
  students = [],
  heats = []
}) => {
  const [parentSearchQuery, setParentSearchQuery] = useState('');
  const [selectedEventId, setSelectedEventId] = useState<OlympicEventId>('velocidad');
  const [selectedGender, setSelectedGender] = useState<Gender>('boy');

  // Unique Base Grades sorted logically
  const uniqueBaseGrades = useMemo(() => {
    const set = new Set((students || []).map(s => extractBaseGrade(s.gradeGroup)));
    const sorted = Array.from(set).sort();
    return sorted.length > 0 ? sorted : ['1º'];
  }, [students]);

  const [selectedBaseGrade, setSelectedBaseGrade] = useState<string>(uniqueBaseGrades[0] || '1º');

  // Sync selectedBaseGrade if uniqueBaseGrades updates
  React.useEffect(() => {
    if (!uniqueBaseGrades.includes(selectedBaseGrade) && uniqueBaseGrades.length > 0) {
      setSelectedBaseGrade(uniqueBaseGrades[0]);
    }
  }, [uniqueBaseGrades, selectedBaseGrade]);

  // Parent Student Search Results
  const parentSearchResults = useMemo(() => {
    const q = parentSearchQuery.trim().toLowerCase();
    if (!q) return [];

    return (students || []).filter(student => {
      const fullName = `${student.firstName || ''} ${student.lastName || ''}`.toLowerCase();
      const gradeStr = (student.gradeGroup || '').toLowerCase();
      return fullName.includes(q) || gradeStr.includes(q);
    });
  }, [students, parentSearchQuery]);

  // Map of student assigned heat cards for instant detail lookup
  const getStudentHeatDetails = (studentId: string) => {
    const studentHeats: Array<{ eventInfo: typeof OLYMPIC_EVENTS[0]; heat: Heat; laneNumber: number }> = [];

    (heats || []).forEach(h => {
      const ids = h.studentIds || [];
      const index = ids.indexOf(studentId);
      if (index !== -1) {
        const evId = h.eventId || 'velocidad';
        const evInfo = OLYMPIC_EVENTS.find(e => e.id === evId) || OLYMPIC_EVENTS[0];
        studentHeats.push({
          eventInfo: evInfo,
          heat: h,
          laneNumber: index + 1
        });
      }
    });

    return studentHeats;
  };

  // Filtered Public Heats for selected discipline, grade and gender
  const publicFilteredHeats = useMemo(() => {
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

  const renderEventIcon = (eventId: OlympicEventId, isSelected = false) => {
    return (
      <SeoulOlympicIcon 
        eventId={eventId} 
        size={24} 
        className={isSelected ? 'text-amber-300' : 'text-[#002B66] dark:text-amber-400'} 
      />
    );
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      
      {/* HERO BANNER FOR PARENTS AND STUDENTS (With dark-card-fix) */}
      <div className="dark-card-fix relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#051930] via-[#002B66] to-[#7f1d1d] border-2 border-amber-500/40 p-6 md:p-8 shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4 text-center md:text-left">
            <LaSalleLogo size={64} showText={false} />
            <div>
              <span className="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-amber-400/20 text-amber-300 border border-amber-400/40 inline-block mb-1">
                Portal Público de Consulta
              </span>
              <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
                Mini / Olimpiadas Escolares
              </h1>
              <p className="text-xs md:text-sm text-slate-200 font-medium mt-1">
                Colegio La Salle de Tuxtla — Programa Oficial de Carreras y Hits
              </p>
            </div>
          </div>

          <div className="bg-[#051930]/90 backdrop-blur-md p-4 rounded-2xl border border-amber-500/30 text-xs text-slate-200 space-y-1 shrink-0 max-w-xs shadow-lg">
            <p className="font-bold text-amber-300 flex items-center gap-1.5 text-sm">
              <Sparkles className="w-4 h-4 text-amber-400" /> Información en Vivo
            </p>
            <p className="text-[11px] text-slate-300">
              Busca a tu hijo/a por su nombre para consultar exactamente sus pruebas, Hits y carriles de salida.
            </p>
          </div>
        </div>
      </div>

      {/* SECTION 1: SEARCH BAR FOR PARENTS */}
      <div className="glass-panel p-6 rounded-3xl border border-amber-500/30 shadow-xl space-y-4">
        <div>
          <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Search className="w-5 h-5 text-amber-500 dark:text-amber-400" />
            Buscador para Padres de Familia ("¿En qué prueba participa mi hijo/a?")
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Escribe el nombre o apellido de tu hijo/a para consultar su ficha personalizada de competencias:
          </p>
        </div>

        <div className="relative">
          <Search className="w-5 h-5 absolute left-4 top-3.5 text-slate-400" />
          <input
            type="text"
            value={parentSearchQuery}
            onChange={(e) => setParentSearchQuery(e.target.value)}
            placeholder="Ejemplo: Jesús Miguel, Sophia, Tipacamú, 1º A..."
            className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700/80 rounded-2xl pl-12 pr-4 py-3.5 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-amber-500 shadow-inner transition-all font-medium"
          />
        </div>

        {/* SEARCH RESULTS DISPLAY */}
        {parentSearchQuery.trim() !== '' && (
          <div className="space-y-4 pt-2">
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1">
              <UserCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Se encontraron {parentSearchResults.length} estudiante(s):
            </p>

            {parentSearchResults.length === 0 ? (
              <div className="p-6 bg-slate-100 dark:bg-slate-950/60 border border-slate-300 dark:border-slate-800 rounded-2xl text-center text-slate-600 dark:text-slate-400 text-xs">
                No se encontró ningún alumno registrado con ese nombre. Intenta escribir solo el primer nombre o apellido.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {parentSearchResults.map((student) => {
                  const studentHeats = getStudentHeatDetails(student.id);

                  return (
                    <div 
                      key={student.id} 
                      className="bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 hover:border-amber-500/50 rounded-2xl p-5 shadow-md space-y-4 transition-all"
                    >
                      {/* Student Card Header */}
                      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-[#002B66] border border-amber-400 flex items-center justify-center font-black text-amber-300 text-sm shadow-sm">
                            {student.firstName[0]}
                          </div>
                          <div>
                            <h3 className="text-sm font-black text-slate-900 dark:text-white">
                              {student.firstName} {student.lastName}
                            </h3>
                            <span className="text-xs text-amber-600 dark:text-amber-400 font-bold font-mono">
                              {student.gradeGroup} — {student.gender === 'boy' ? '👦 Niño' : '👧 Niña'}
                            </span>
                          </div>
                        </div>

                        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                          {studentHeats.length} prueba(s) asignada(s)
                        </span>
                      </div>

                      {/* Asigned Heats Breakdown */}
                      <div className="space-y-2.5">
                        {studentHeats.length === 0 ? (
                          <p className="text-xs text-slate-500 italic p-2 bg-white dark:bg-slate-950 rounded-xl text-center">
                            Aún no se han asignado los Hits de competencia para este alumno.
                          </p>
                        ) : (
                          studentHeats.map(({ eventInfo, heat, laneNumber }) => (
                            <div 
                              key={heat.id} 
                              className="p-3 bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs shadow-sm"
                            >
                              <div className="flex items-center gap-2.5">
                                <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                                  {renderEventIcon(eventInfo.id, false)}
                                </div>
                                <div>
                                  <p className="font-bold text-slate-900 dark:text-slate-100">{eventInfo.name}</p>
                                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                                    {eventInfo.id === 'bala' ? 'Hit Único (Lanzamiento de Bala)' : eventInfo.id === 'relevos' ? `Equipo de Relevos #${heat.number}` : `Hit #${heat.number}`}
                                  </p>
                                </div>
                              </div>

                              <div className="text-right">
                                <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-800 dark:text-amber-300 font-bold text-xs border border-amber-500/40">
                                  {eventInfo.id === 'relevos' ? `Posición #${laneNumber}` : eventInfo.id === 'bala' ? 'Participante' : `Carril #${laneNumber}`}
                                </span>
                              </div>
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
        )}
      </div>

      {/* SECTION 2: PUBLIC HITS DIRECTORY */}
      <div className="space-y-4">
        
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-amber-500 dark:text-amber-400" />
              Programa Oficial de Hits de Competencia
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Consulta las series completas de salida organizadas por prueba, grado escolar y categoría.
            </p>
          </div>
        </div>

        {/* 1. DISCIPLINE SELECTOR TABS (With Seoul 1988 Pictograms & Light Mode High Contrast) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {OLYMPIC_EVENTS.map(ev => {
            const isSelected = selectedEventId === ev.id;
            return (
              <button
                key={ev.id}
                onClick={() => setSelectedEventId(ev.id)}
                className={`flex items-center gap-3 p-3.5 rounded-2xl border text-left transition-all ${
                  isSelected
                    ? 'bg-[#002B66] text-white border-amber-400 shadow-xl shadow-amber-500/10 scale-[1.02]'
                    : 'bg-white dark:bg-slate-950/60 border-slate-300 dark:border-slate-800 hover:border-amber-400 text-slate-800 dark:text-slate-300 shadow-sm'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  isSelected ? 'bg-amber-400/20 border border-amber-400/40' : 'bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800'
                }`}>
                  {renderEventIcon(ev.id, isSelected)}
                </div>
                <div>
                  <p className={`text-xs font-black ${isSelected ? 'text-white' : 'text-slate-900 dark:text-slate-100'}`}>
                    {ev.name}
                  </p>
                  <p className={`text-[10px] ${isSelected ? 'text-amber-300' : 'text-slate-500 dark:text-slate-400'}`}>
                    {ev.id === 'bala' ? 'Hit Único' : ev.id === 'relevos' ? 'Equipos de 4' : 'Hits de 4 competidores'}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* 2. BASE GRADE & GENDER SELECTOR */}
        <div className="glass-panel p-4 rounded-2xl border border-slate-300 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
          
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
            <span className="text-xs font-black text-slate-700 dark:text-slate-400 uppercase tracking-wider mr-2 shrink-0">
              Grado:
            </span>
            {uniqueBaseGrades.map(baseG => (
              <button
                key={baseG}
                onClick={() => setSelectedBaseGrade(baseG)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all shrink-0 ${
                  selectedBaseGrade === baseG
                    ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20 scale-105'
                    : 'bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-300 border border-slate-300 dark:border-slate-800 hover:border-amber-400'
                }`}
              >
                {baseG} Grado
              </button>
            ))}
          </div>

          <div className="flex items-center bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl p-1 w-full md:w-auto justify-center shadow-inner">
            <button
              onClick={() => setSelectedGender('boy')}
              className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all ${
                selectedGender === 'boy'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              👦 Rama Varonil (Niños)
            </button>
            <button
              onClick={() => setSelectedGender('girl')}
              className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all ${
                selectedGender === 'girl'
                  ? 'bg-pink-600 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              👧 Rama Femenil (Niñas)
            </button>
          </div>

        </div>

        {/* 3. PUBLIC HITS GRID DISPLAY */}
        {publicFilteredHeats.length === 0 ? (
          <div className="glass-panel p-12 rounded-2xl border border-slate-800 text-center text-slate-500">
            <p className="text-sm font-semibold text-slate-300">
              No hay Hits registrados para esta categoría todavía.
            </p>
            <p className="text-xs mt-1">Selecciona otra prueba o grado escolar arriba.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {publicFilteredHeats.map((heat) => {
              const currentEvInfo = OLYMPIC_EVENTS.find(e => e.id === (heat.eventId || 'velocidad')) || OLYMPIC_EVENTS[0];
              const isRelevos = (heat.eventId || 'velocidad') === 'relevos';
              const isBala = (heat.eventId || 'velocidad') === 'bala';

              const heatStudents = (heat.studentIds || [])
                .map(id => (students || []).find(s => s.id === id))
                .filter((s): s is Student => s !== undefined);

              return (
                <div 
                  key={heat.id}
                  className="glass-panel p-5 rounded-2xl border border-slate-300 dark:border-slate-800 space-y-3 shadow-md"
                >
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                    <div className="flex items-center gap-2.5">
                      <span className="w-8 h-8 rounded-xl bg-amber-400/20 text-amber-900 dark:text-amber-300 border border-amber-400/40 flex items-center justify-center font-black text-xs shadow-sm">
                        #{heat.number}
                      </span>
                      <div>
                        <h3 className="text-sm font-black text-slate-900 dark:text-white">
                          {isBala ? 'Hit Único - Lanzamiento de Bala' : isRelevos ? `Carrera de Relevos (${selectedBaseGrade} Grado)` : `Hit #${heat.number}`}
                        </h3>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                          {currentEvInfo.name} — {selectedBaseGrade} Grado ({heat.gender === 'boy' ? 'Rama Varonil' : 'Rama Femenil'})
                        </p>
                      </div>
                    </div>

                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-800 dark:text-blue-300 border border-blue-500/30">
                      {isRelevos ? `${Math.ceil(heatStudents.length / 4)} Equipos` : `${heatStudents.length} competidores`}
                    </span>
                  </div>

                  {/* Competitor List Table / Relevos Team Display */}
                  <div className="space-y-2 bg-slate-50 dark:bg-slate-950/80 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800/80">
                    {isRelevos ? (
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
                          const grpNames = Array.from(new Set(chunk.map(s => s.gradeGroup))).join(' + ');
                          teams.push({
                            laneNumber: laneCounter++,
                            label: `Equipo Combinado (${grpNames})`,
                            students: chunk
                          });
                        }

                        return teams.map((team) => (
                          <div key={`${team.label}-${team.laneNumber}`} className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1.5 shadow-sm">
                            <div className="flex items-center justify-between text-xs font-bold border-b border-slate-100 dark:border-slate-800 pb-1">
                              <span className="text-amber-600 dark:text-amber-300 flex items-center gap-1">
                                <span>🏃‍♂️ Carril {team.laneNumber}:</span>
                                <span>{team.label}</span>
                              </span>
                              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-[10px] font-mono font-bold">
                                {team.students.length} / 4 integrantes
                              </span>
                            </div>

                            <div className="space-y-1">
                              {team.students.map((st, idx) => (
                                <div key={st.id} className="flex items-center justify-between text-xs px-2 py-1 bg-slate-50 dark:bg-slate-950 rounded-lg">
                                  <div className="flex items-center gap-2">
                                    <span className="w-4 h-4 rounded-full bg-[#002B66] text-amber-300 font-mono text-[9px] font-bold flex items-center justify-center">
                                      #{idx + 1}
                                    </span>
                                    <span className="font-semibold text-slate-800 dark:text-slate-100">{st.firstName} {st.lastName}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ));
                      })()
                    ) : (
                      heatStudents.map((st, idx) => (
                        <div 
                          key={st.id} 
                          className="p-2.5 bg-white dark:bg-slate-900 rounded-lg flex items-center justify-between text-xs border border-slate-200 dark:border-slate-800/60 shadow-sm"
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="w-5 h-5 rounded-full bg-[#002B66] text-amber-300 font-mono text-[10px] font-bold flex items-center justify-center shadow-sm">
                              #{idx + 1}
                            </span>
                            <span className="font-bold text-slate-900 dark:text-slate-100">{st.firstName} {st.lastName}</span>
                          </div>

                          <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-mono font-bold text-slate-900 dark:text-amber-300 border border-slate-300 dark:border-amber-500/20">
                            {st.gradeGroup}
                          </span>
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
  );
};
