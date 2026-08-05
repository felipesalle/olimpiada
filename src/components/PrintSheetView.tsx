import React, { useState, useMemo } from 'react';
import { OLYMPIC_EVENTS, extractBaseGrade } from '../types/olympics';
import type { 
  Student, 
  Heat, 
  Gender, 
  OlympicEventId 
} from '../types/olympics';
import { Printer, Eye, ArrowDownNarrowWide, Users, Zap, Activity, Target, Layers, Trophy } from 'lucide-react';
import { LaSalleLogo } from './LaSalleLogo';

interface PrintSheetViewProps {
  students: Student[];
  heats: Heat[];
}

// Helper to extract grade number (1..6)
function getGradeNumber(gradeGroup: string): number {
  if (!gradeGroup) return 99;
  const match = gradeGroup.match(/([1-6])/);
  return match ? parseInt(match[1], 10) : 99;
}

// Helper to clean student name from any trailing grade/group strings
function getCleanStudentFullName(st: Student): string {
  if (!st) return '';
  const rawName = `${st.firstName || ''} ${st.lastName || ''}`.trim();
  return rawName
    .replace(/\s*\(?\s*[1-6]º?\s*[RO]*\s*[A-F]?\s*\)?$/i, '')
    .replace(/\s*-\s*[1-6]º?\s*[A-F]?$/i, '')
    .trim();
}

interface RelevosTeamItem {
  teamNumber: number;
  gradeGroup: string;
  students: Student[];
}

interface RelevosCombinedHeat {
  id: string;
  hitNumber: number;
  baseGrade: string;
  gender: Gender;
  teams: RelevosTeamItem[];
}

interface PrintablePage {
  id: string;
  type: 'cover' | 'sheet';
  discGroup: {
    eventId: OlympicEventId;
    eventInfo: any;
    heats: Heat[];
  };
  discIdx: number;
  totalDisciplines: number;
  isRelevosGroup: boolean;
  pageIdx?: number;
  totalPages?: number;
  chunk?: Heat[] | RelevosCombinedHeat[];
}

export const PrintSheetView: React.FC<PrintSheetViewProps> = ({
  students = [],
  heats = []
}) => {
  const [filterEvent, setFilterEvent] = useState<OlympicEventId | 'all'>('all');
  const [filterBaseGrade, setFilterBaseGrade] = useState<string>('all');
  const [filterGender, setFilterGender] = useState<Gender | 'all'>('all');
  const [showJudgeColumns, setShowJudgeColumns] = useState<boolean>(true);
  const [heatsPerPage, setHeatsPerPage] = useState<number | 'auto'>(4);

  // Unique base grades
  const uniqueBaseGrades = useMemo(() => {
    const set = new Set((students || []).map(s => extractBaseGrade(s.gradeGroup)));
    return Array.from(set).sort((a, b) => getGradeNumber(a) - getGradeNumber(b));
  }, [students]);

  // Valid non-empty heats matching filters
  const validHeats = useMemo(() => {
    return (heats || []).filter(h => {
      const validStudents = (h.studentIds || [])
        .map(id => (students || []).find(s => s.id === id))
        .filter((s): s is Student => s !== undefined);

      if (validStudents.length === 0) return false;

      const heatEvent = h.eventId || 'velocidad';
      const matchEvent = filterEvent === 'all' || heatEvent === filterEvent;
      const matchGrade = filterBaseGrade === 'all' || extractBaseGrade(h.gradeGroup) === filterBaseGrade;
      const matchGender = filterGender === 'all' || h.gender === filterGender;
      return matchEvent && matchGrade && matchGender;
    });
  }, [heats, students, filterEvent, filterBaseGrade, filterGender]);

  // Group Heats by Discipline: Relevos -> Velocidad -> Vallas -> Bala
  const disciplineGroups = useMemo(() => {
    const eventsToInclude = filterEvent === 'all' 
      ? (['relevos', 'velocidad', 'vallas', 'bala'] as OlympicEventId[])
      : [filterEvent];

    return eventsToInclude.map(evId => {
      const eventInfo = OLYMPIC_EVENTS.find(e => e.id === evId) || OLYMPIC_EVENTS[0];
      const eventHeats = validHeats.filter(h => (h.eventId || 'velocidad') === evId)
        .sort((a, b) => {
          const gA = getGradeNumber(a.gradeGroup);
          const gB = getGradeNumber(b.gradeGroup);
          if (gA !== gB) return gA - gB;
          if (a.gender !== b.gender) return a.gender === 'boy' ? -1 : 1;
          return a.number - b.number;
        });

      return {
        eventId: evId,
        eventInfo,
        heats: eventHeats
      };
    }).filter(group => group.heats.length > 0);
  }, [validHeats, filterEvent]);

  // Consolidate Relevos Teams into Hits (Hit 1 -> 1º Varonil, Hit 2 -> 1º Femenil, Hit 3 -> 2º Varonil...)
  const getRelevosCombinedHits = (relevosHeats: Heat[]): RelevosCombinedHeat[] => {
    const map = new Map<string, Heat[]>();
    relevosHeats.forEach(h => {
      const key = `${extractBaseGrade(h.gradeGroup)}_${h.gender}`;
      const list = map.get(key) || [];
      list.push(h);
      map.set(key, list);
    });

    const sortedKeys = Array.from(map.keys()).sort((a, b) => {
      const [gA, genA] = a.split('_');
      const [gB, genB] = b.split('_');
      const numA = getGradeNumber(gA);
      const numB = getGradeNumber(gB);
      if (numA !== numB) return numA - numB;
      if (genA !== genB) return genA === 'boy' ? -1 : 1;
      return 0;
    });

    const combined: RelevosCombinedHeat[] = [];
    let globalHitNumber = 1;

    sortedKeys.forEach(key => {
      const teamHeats = map.get(key) || [];
      if (teamHeats.length === 0) return;

      const sample = teamHeats[0];
      const baseGrade = extractBaseGrade(sample.gradeGroup);
      const gender = sample.gender;

      // Collect all student IDs from heats for this baseGrade & gender
      const allStudentIdsSet = new Set<string>();
      teamHeats.forEach(h => (h.studentIds || []).forEach(id => allStudentIdsSet.add(id)));

      const heatStudents = Array.from(allStudentIdsSet)
        .map(id => (students || []).find(s => s.id === id))
        .filter((s): s is Student => s !== undefined);

      // Group students by gradeGroup
      const groupMap = new Map<string, Student[]>();
      heatStudents.forEach(st => {
        const grp = st.gradeGroup || 'Equipo';
        const list = groupMap.get(grp) || [];
        list.push(st);
        groupMap.set(grp, list);
      });

      const teams: RelevosTeamItem[] = [];
      let laneCounter = 1;
      const leftovers: Student[] = [];
      const sortedGroups = Array.from(groupMap.keys()).sort();

      // 1st Pass: Full teams of 4 from same group
      sortedGroups.forEach(grp => {
        const stList = groupMap.get(grp) || [];
        const fullCount = Math.floor(stList.length / 4);
        for (let t = 0; t < fullCount; t++) {
          const chunk = stList.slice(t * 4, (t + 1) * 4);
          const suffix = fullCount > 1 ? ` (Eq. ${t + 1})` : '';
          teams.push({
            teamNumber: laneCounter++,
            gradeGroup: `Equipo ${grp}${suffix}`,
            students: chunk
          });
        }
        leftovers.push(...stList.slice(fullCount * 4));
      });

      // 2nd Pass: Combine leftovers across groups into full Teams of 4!
      for (let i = 0; i + 4 <= leftovers.length; i += 4) {
        const chunk = leftovers.slice(i, i + 4);
        const grpNames = Array.from(new Set(chunk.map(s => s.gradeGroup))).join('+');
        teams.push({
          teamNumber: laneCounter++,
          gradeGroup: `Equipo Comb. (${grpNames})`,
          students: chunk
        });
      }

      if (teams.length > 0) {
        combined.push({
          id: `rel_hit_${key}_${globalHitNumber}`,
          hitNumber: globalHitNumber++,
          baseGrade,
          gender,
          teams
        });
      }
    });

    return combined;
  };

  // Flatten ALL printable pages (Covers + Sheets) sequentially to prevent blank page gaps
  const allPrintPages = useMemo(() => {
    const pages: PrintablePage[] = [];

    disciplineGroups.forEach((discGroup, discIdx) => {
      const isRelevosGroup = discGroup.eventId === 'relevos';
      let pageChunks: Array<Heat[] | RelevosCombinedHeat[]> = [];

      if (isRelevosGroup) {
        const combinedRelevos = getRelevosCombinedHits(discGroup.heats);
        // 1 Relevos Hit per page
        for (let i = 0; i < combinedRelevos.length; i += 1) {
          pageChunks.push(combinedRelevos.slice(i, i + 1));
        }
      } else {
        const chunkLimit = typeof heatsPerPage === 'number' ? heatsPerPage : 4;
        for (let i = 0; i < discGroup.heats.length; i += chunkLimit) {
          pageChunks.push(discGroup.heats.slice(i, i + chunkLimit));
        }
      }

      // 1. Cover Page
      pages.push({
        id: `cover_${discGroup.eventId}`,
        type: 'cover',
        discGroup,
        discIdx,
        totalDisciplines: disciplineGroups.length,
        isRelevosGroup,
        totalPages: pageChunks.length
      });

      // 2. Heat Sheets
      pageChunks.forEach((chunk, pageIdx) => {
        pages.push({
          id: `sheet_${discGroup.eventId}_${pageIdx}`,
          type: 'sheet',
          discGroup,
          discIdx,
          totalDisciplines: disciplineGroups.length,
          isRelevosGroup,
          pageIdx,
          totalPages: pageChunks.length,
          chunk
        });
      });
    });

    return pages;
  }, [disciplineGroups, heatsPerPage, students]);

  const handlePrint = () => {
    window.print();
  };

  const renderDisciplineIcon = (eventId: OlympicEventId) => {
    switch (eventId) {
      case 'relevos': return <Users className="w-8 h-8 text-emerald-600" />;
      case 'velocidad': return <Zap className="w-8 h-8 text-blue-600" />;
      case 'vallas': return <Activity className="w-8 h-8 text-purple-600" />;
      case 'bala': return <Target className="w-8 h-8 text-amber-600" />;
    }
  };

  const selectedEventName = filterEvent === 'all' 
    ? 'Todas las Pruebas' 
    : OLYMPIC_EVENTS.find(e => e.id === filterEvent)?.name || 'Prueba Seleccionada';

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      
      {/* Top Control Panel (Hidden when printing) */}
      <div className="no-print glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
        
        {/* Header Title */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Printer className="w-5 h-5 text-amber-400" />
              Planillas de Impresión y Selección de Pruebas
            </h2>
            <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
              <ArrowDownNarrowWide className="w-3.5 h-3.5 text-amber-400" />
              <span>Puedes imprimir el programa completo (4 Pruebas) o seleccionar 1 sola prueba en específico.</span>
            </p>
          </div>

          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold bg-amber-500 text-slate-950 hover:bg-amber-400 shadow-xl shadow-amber-500/20 transition-all text-sm shrink-0"
          >
            <Printer className="w-5 h-5" />
            <span>Imprimir {filterEvent === 'all' ? 'Todo' : selectedEventName} ({allPrintPages.length} Hojas)</span>
          </button>
        </div>

        {/* 🔘 QUICK DISCIPLINE SELECTOR BUTTONS */}
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-amber-400" /> Selección de Alcance de Impresión:
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilterEvent('all')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                filterEvent === 'all'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'bg-slate-950 text-slate-300 border border-slate-800 hover:border-slate-700'
              }`}
            >
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>Imprimir Todo (4 Pruebas con Portadas)</span>
            </button>

            {OLYMPIC_EVENTS.map(ev => (
              <button
                key={ev.id}
                onClick={() => setFilterEvent(ev.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                  filterEvent === ev.id
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                    : 'bg-slate-950 text-slate-400 border border-slate-800 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                {ev.id === 'relevos' && <Users className="w-3.5 h-3.5 text-emerald-400" />}
                {ev.id === 'velocidad' && <Zap className="w-3.5 h-3.5 text-blue-400" />}
                {ev.id === 'vallas' && <Activity className="w-3.5 h-3.5 text-purple-400" />}
                {ev.id === 'bala' && <Target className="w-3.5 h-3.5 text-amber-400" />}
                <span>Solo {ev.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Secondary Filter Controls */}
        <div className="flex flex-wrap items-center gap-3 pt-1 border-t border-slate-800/60">
          
          {/* Toggle Judge Columns */}
          <button
            onClick={() => setShowJudgeColumns(!showJudgeColumns)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
              showJudgeColumns 
                ? 'bg-blue-900/40 text-blue-300 border-blue-700/50' 
                : 'bg-slate-950 text-slate-400 border-slate-800'
            }`}
            title="Mostrar u ocultar casillas de Lugar y Tiempo"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>{showJudgeColumns ? 'Con Lugar y Tiempo' : 'Solo Lista de Alumnos'}</span>
          </button>

          {/* Heats per Page Selector */}
          <select
            value={heatsPerPage}
            onChange={(e) => setHeatsPerPage(e.target.value === 'auto' ? 'auto' : parseInt(e.target.value, 10))}
            className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
            title="Ajustar la cantidad de Hits distribuidos por hoja impresa"
          >
            <option value={4}>4 Hits por Hoja (Estándar)</option>
            <option value={3}>3 Hits por Hoja (Más Espacioso)</option>
            <option value={2}>2 Hits por Hoja (Letra Grande)</option>
            <option value="auto">Auto Ajuste Inteligente</option>
          </select>

          {/* Grade Selector */}
          <select
            value={filterBaseGrade}
            onChange={(e) => setFilterBaseGrade(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
          >
            <option value="all">Todos los Grados</option>
            {uniqueBaseGrades.map(g => (
              <option key={g} value={g}>{g} Grado</option>
            ))}
          </select>

          {/* Gender Selector */}
          <select
            value={filterGender}
            onChange={(e) => setFilterGender(e.target.value as any)}
            className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
          >
            <option value="all">Todos los Géneros</option>
            <option value="boy">👦 Niños (Varonil)</option>
            <option value="girl">👧 Niñas (Femenil)</option>
          </select>
        </div>

      </div>

      {/* Printable Output Container */}
      {allPrintPages.length === 0 ? (
        <div className="glass-panel p-12 rounded-2xl border border-slate-800 text-center text-slate-500">
          <p className="text-sm font-semibold text-slate-300">No hay Hits válidos creados con los filtros seleccionados.</p>
          <p className="text-xs mt-1">Asigna alumnos a tus Hits en la pestaña <strong>"2. Hits (Drag & Drop)"</strong>.</p>
        </div>
      ) : (
        <div className="space-y-8 print:space-y-0">
          {allPrintPages.map((page, globalIdx) => {
            const isFirst = globalIdx === 0;
            const printBreakClass = isFirst ? '' : 'print-break-before-page';

            if (page.type === 'cover') {
              // 📜 DISCIPLINE COVER PAGE
              return (
                <div 
                  key={page.id} 
                  className={`bg-white text-slate-900 p-8 print:p-6 rounded-3xl print:rounded-none shadow-2xl print:shadow-none border-4 border-blue-950 page-break print-page-container font-sans flex flex-col justify-between min-h-0 md:min-h-[850px] print:min-h-0 print:h-auto print:my-0 text-center ${printBreakClass}`}
                >
                  {/* COVER HEADER */}
                  <div className="border-b-4 border-red-600 pb-4 flex items-center justify-between">
                    <div className="flex items-center gap-4 text-left">
                      <LaSalleLogo size={56} showText={false} />
                      <div>
                        <h1 className="text-xl font-black tracking-tight text-blue-950 uppercase leading-none">
                          COLEGIO LA SALLE DE TUXTLA
                        </h1>
                        <p className="text-xs font-bold text-red-600 tracking-wide uppercase mt-1">
                          MINI / OLIMPIADAS ESCOLARES — PLANILLA OFICIAL DE JUECES DE PISTA
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="bg-blue-950 text-amber-400 px-3 py-1.5 rounded-xl text-xs font-black shadow-md border border-amber-400/40">
                        PRUEBA {page.discIdx + 1} DE {page.totalDisciplines}
                      </span>
                    </div>
                  </div>

                  {/* COVER MAIN CONTENT */}
                  <div className="py-8 space-y-5 my-auto">
                    
                    <div className="w-16 h-16 mx-auto rounded-3xl bg-slate-100 border-2 border-blue-950 flex items-center justify-center shadow-lg">
                      {renderDisciplineIcon(page.discGroup.eventId)}
                    </div>

                    <div>
                      <p className="text-xs font-black uppercase text-red-600 tracking-widest mb-1">
                        SECCIÓN OFICIAL DE COMPETENCIA
                      </p>
                      <h2 className="text-3xl md:text-4xl font-black text-blue-950 uppercase tracking-tight">
                        {page.discGroup.eventInfo.name}
                      </h2>
                      <p className="text-xs text-slate-600 font-semibold max-w-xl mx-auto mt-1.5">
                        {page.discGroup.eventInfo.description}
                      </p>
                    </div>

                    {/* STATS CARDS */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-w-2xl mx-auto pt-2">
                      <div className="p-3 rounded-2xl bg-blue-50 border border-blue-200">
                        <p className="text-[10px] font-bold text-blue-900 uppercase">Total de Hits / Carreras</p>
                        <p className="text-xl font-black text-blue-950">
                          {page.isRelevosGroup ? getRelevosCombinedHits(page.discGroup.heats).length : page.discGroup.heats.length} Hits
                        </p>
                      </div>

                      <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200">
                        <p className="text-[10px] font-bold text-amber-900 uppercase">Hojas de Planilla</p>
                        <p className="text-xl font-black text-amber-950">
                          {page.totalPages} Hoja(s)
                        </p>
                      </div>

                      <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 col-span-2 md:col-span-1">
                        <p className="text-[10px] font-bold text-emerald-900 uppercase">Secuencia de Hits</p>
                        <p className="text-[11px] font-extrabold text-emerald-950 mt-0.5">
                          1º Var ➔ 1º Fem ➔ 2º Var ➔ 2º Fem...
                        </p>
                      </div>
                    </div>

                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-300 max-w-xl mx-auto text-xs text-slate-700 space-y-1 text-left">
                      <p className="font-bold text-blue-950 uppercase text-[11px]">Instrucciones para los Jueces de Pista:</p>
                      <ul className="list-disc list-inside space-y-0.5 text-[10.5px]">
                        <li>Verificar los nombres de los competidores o equipos asignados a cada carril.</li>
                        <li>Registrar los lugares oficiales (1.º, 2.º y 3.er lugar) y los tiempos o marcas.</li>
                        <li>Marcar con <strong>DNS (No se presentó)</strong> a cualquier alumno o equipo ausente.</li>
                        <li>Entregar las planillas firmadas a la mesa central al finalizar cada prueba.</li>
                      </ul>
                    </div>

                  </div>

                  {/* COVER FOOTER SIGNATURES */}
                  <div className="border-t-2 border-slate-300 pt-4 grid grid-cols-2 gap-12 text-center text-xs text-slate-800">
                    <div>
                      <div className="h-8 border-b border-slate-400 mb-1"></div>
                      <p className="font-bold text-blue-950 uppercase text-[11px]">Profesor Juez de la Prueba</p>
                      <p className="text-[10px] text-slate-500">Colegio La Salle Tuxtla</p>
                    </div>
                    <div>
                      <div className="h-8 border-b border-slate-400 mb-1"></div>
                      <p className="font-bold text-blue-950 uppercase text-[11px]">Coordinación de Deportes</p>
                      <p className="text-[10px] text-slate-500">Colegio La Salle Tuxtla</p>
                    </div>
                  </div>

                </div>
              );
            }

            // 🏃 DISCIPLINE HEAT SHEET PAGE
            return (
              <div 
                key={page.id} 
                className={`bg-white text-slate-900 p-5 print:p-2 rounded-2xl print:rounded-none shadow-xl print:shadow-none border border-slate-300 print:border-none page-break print-page-container font-sans flex flex-col justify-between min-h-0 md:min-h-[850px] print:min-h-0 print:h-auto print:my-0 ${printBreakClass}`}
              >
                
                {/* PAGE HEADER */}
                <div className="border-b-2 border-red-600 pb-1.5 mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <LaSalleLogo size={38} showText={false} />
                    <div>
                      <h1 className="text-base font-black tracking-tight text-blue-950 uppercase leading-none">
                        COLEGIO LA SALLE DE TUXTLA
                      </h1>
                      <p className="text-[10.5px] font-bold text-red-600 tracking-wide uppercase mt-0.5">
                        PLANILLA DE COMPETENCIA — {page.discGroup.eventInfo.name.toUpperCase()}
                      </p>
                    </div>
                  </div>

                  <div className="text-right text-[10.5px] font-bold text-slate-700">
                    <span className="bg-blue-950 text-amber-400 px-2 py-0.5 rounded text-xs shadow-sm uppercase">
                      {page.discGroup.eventInfo.shortName} — HOJA {(page.pageIdx || 0) + 1} DE {page.totalPages}
                    </span>
                  </div>
                </div>

                {/* CONTENT FOR RELEVOS VS STANDARD HITS */}
                <div className="space-y-2.5 flex-1">
                  {page.isRelevosGroup ? (
                    // RELEVOS SPECIAL LAYOUT: Hit 1 (1º Varonil), Hit 2 (1º Femenil)...
                    ((page.chunk || []) as RelevosCombinedHeat[]).map(relHit => (
                      <div 
                        key={relHit.id}
                        className="hit-card-print border-2 border-emerald-800/40 rounded-xl overflow-hidden bg-emerald-50/20 print:bg-white shadow-sm print:shadow-none space-y-2 p-2 print:p-1.5"
                      >
                        <div className="bg-emerald-950 text-white px-3 py-1 font-bold text-xs flex items-center justify-between rounded-lg">
                          <span className="text-emerald-300 font-extrabold uppercase text-xs">
                            RELEVO HIT {relHit.hitNumber} — {relHit.baseGrade} GRADO ({relHit.gender === 'boy' ? 'RAMA VARONIL' : 'RAMA FEMENIL'})
                          </span>
                          <span className="text-[10.5px] text-slate-300 font-semibold">
                            {relHit.teams.length} Equipos en Pista (Carriles 1 a {relHit.teams.length})
                          </span>
                        </div>

                        {/* TEAMS GRID IN THIS RELEVOS HIT */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 print:gap-1.5">
                          {relHit.teams.map(team => (
                            <div key={team.teamNumber} className="border border-slate-400 rounded-lg overflow-hidden bg-white shadow-sm">
                              <div className="bg-blue-950 text-amber-300 px-2.5 py-0.5 font-bold text-[10.5px] flex items-center justify-between">
                                <span>Carril {team.teamNumber}: {team.gradeGroup}</span>
                                <span className="text-[9.5px] text-white">{team.students.length} Integrantes</span>
                              </div>

                              <table className="w-full border-collapse text-left text-[11px] print:text-[10px]">
                                <thead>
                                  <tr className="bg-slate-200 text-blue-950 font-black text-[9.5px] uppercase border-b border-slate-400">
                                    <th className="py-0.5 px-1.5 border-r border-slate-300 text-center w-8">Pos</th>
                                    <th className="py-0.5 px-1.5 border-r border-slate-300">Alumno (a)</th>
                                    <th className="py-0.5 px-1.5 border-r border-slate-300 text-center w-14">Salón</th>
                                    {showJudgeColumns && (
                                      <>
                                        <th className="py-0.5 px-1 border-r border-slate-300 text-center w-12">Lugar</th>
                                        <th className="py-0.5 px-1 text-center w-14">Tiempo</th>
                                      </>
                                    )}
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-300 font-semibold text-slate-900">
                                  {team.students.map((st, sIdx) => (
                                    <tr key={st.id}>
                                      <td className="py-0.5 px-1.5 border-r border-slate-300 text-center font-bold text-blue-950 bg-slate-100">{sIdx + 1}</td>
                                      <td className="py-0.5 px-1.5 border-r border-slate-300 font-bold uppercase text-[10px] text-slate-900">{getCleanStudentFullName(st)}</td>
                                      <td className="py-0.5 px-1.5 border-r border-slate-300 text-center font-mono font-extrabold text-blue-900 text-[9.5px]">{st.gradeGroup}</td>
                                      {showJudgeColumns && (
                                        <>
                                          <td className="py-0.5 px-1 border-r border-slate-300 text-center"><div className="h-3.5 border border-slate-300 rounded bg-white"></div></td>
                                          <td className="py-0.5 px-1 text-center"><div className="h-3.5 border border-slate-300 rounded bg-white"></div></td>
                                        </>
                                      )}
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                  ) : (
                    // STANDARD LAYOUT FOR VELOCIDAD, VALLAS & BALA
                    ((page.chunk || []) as Heat[]).map(heat => {
                      const isHeatBala = (heat.eventId || page.discGroup.eventId) === 'bala';
                      const genderLabel = heat.gender === 'boy' ? 'Rama Varonil' : 'Rama Femenil';
                      const heatStudents = (heat.studentIds || [])
                        .map(id => (students || []).find(s => s.id === id))
                        .filter((s): s is Student => s !== undefined);

                      return (
                        <div 
                          key={heat.id} 
                          className="hit-card-print border border-slate-400 rounded-lg overflow-hidden bg-slate-50/50 print:bg-white shadow-sm print:shadow-none"
                        >
                          <div className="bg-blue-950 text-white px-3 py-1 font-bold text-xs flex items-center justify-between border-b border-slate-400">
                            <span className="text-amber-300 font-extrabold uppercase">
                              {isHeatBala ? `Hit Único ${page.discGroup.eventInfo.name}` : `Hit ${heat.number} ${page.discGroup.eventInfo.name}`} — {extractBaseGrade(heat.gradeGroup)} Grado {genderLabel}
                            </span>
                            <span className="text-[10px] text-slate-300">
                              {heatStudents.length} competidores
                            </span>
                          </div>

                          <table className="w-full border-collapse text-left text-xs">
                            <thead>
                              <tr className="bg-slate-200 text-blue-950 font-black text-[10.5px] uppercase border-b border-slate-400">
                                <th className="py-0.5 px-2.5 border-r border-slate-300 text-center w-14">Carril</th>
                                <th className="py-0.5 px-2.5 border-r border-slate-300">Alumno (a)</th>
                                <th className="py-0.5 px-2.5 border-r border-slate-300 text-center w-32">Grado y Grupo</th>
                                {showJudgeColumns && (
                                  <>
                                    <th className="py-0.5 px-2 border-r border-slate-300 text-center w-16">Lugar</th>
                                    <th className="py-0.5 px-2 text-center w-24">Tiempo</th>
                                  </>
                                )}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-300 font-semibold text-slate-900">
                              {heatStudents.map((st, idx) => (
                                <tr key={st.id} className="hover:bg-slate-100">
                                  <td className="py-0.5 px-2.5 border-r border-slate-300 text-center font-bold text-blue-950 bg-slate-100/60">{idx + 1}</td>
                                  <td className="py-0.5 px-2.5 border-r border-slate-300 font-bold uppercase text-[11px] text-slate-900">{getCleanStudentFullName(st)}</td>
                                  <td className="py-0.5 px-2.5 border-r border-slate-300 text-center font-mono font-extrabold text-blue-900">{st.gradeGroup}</td>
                                  {showJudgeColumns && (
                                    <>
                                      <td className="py-0.5 px-2 border-r border-slate-300 text-center"><div className="h-4 border border-slate-300 rounded bg-white"></div></td>
                                      <td className="py-0.5 px-2 text-center"><div className="h-4 border border-slate-300 rounded bg-white"></div></td>
                                    </>
                                  )}
                                </tr>
                              ))}
                              {!isHeatBala && Array.from({ length: Math.max(0, 4 - heatStudents.length) }).map((_, emptyIdx) => (
                                <tr key={`empty_${emptyIdx}`} className="opacity-40">
                                  <td className="py-0.5 px-2.5 border-r border-slate-200 text-center font-bold">{heatStudents.length + emptyIdx + 1}</td>
                                  <td className="py-0.5 px-2.5 border-r border-slate-200 italic text-slate-400">---</td>
                                  <td className="py-0.5 px-2.5 border-r border-slate-200 text-center">---</td>
                                  {showJudgeColumns && (
                                    <>
                                      <td className="py-0.5 px-2 border-r border-slate-200"></td>
                                      <td className="py-0.5 px-2"></td>
                                    </>
                                  )}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* PAGE FOOTER */}
                <div className="border-t border-slate-300 pt-1 mt-1 text-[9.5px] text-slate-500 flex items-center justify-between">
                  <span>{page.discGroup.eventInfo.name} — Colegio La Salle de Tuxtla</span>
                  <span>Hoja {(page.pageIdx || 0) + 1} de {page.totalPages}</span>
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
