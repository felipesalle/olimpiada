import React, { useMemo } from 'react';
import { OLYMPIC_EVENTS, extractBaseGrade } from '../types/olympics';
import type { Student, Heat, Gender, OlympicEventId, SchoolLevelId } from '../types/olympics';
import { Printer, Download, Trophy, Award, FileText } from 'lucide-react';
import { LaSalleLogo } from './LaSalleLogo';
import { StorageService } from '../services/storageService';

interface ExecutiveReportViewProps {
  students: Student[];
  heats: Heat[];
  activeLevel?: SchoolLevelId;
}

function getGradeNumber(gradeGroup: string): number {
  if (!gradeGroup) return 99;
  const match = gradeGroup.match(/([1-6])/);
  return match ? parseInt(match[1], 10) : 99;
}

function getCleanStudentFullName(st: Student | undefined): string {
  if (!st) return '---';
  const rawName = `${st.firstName || ''} ${st.lastName || ''}`.trim();
  return rawName
    .replace(/\s*\(?\s*[1-6]º?\s*[RO]*\s*[A-F]?\s*\)?$/i, '')
    .replace(/\s*-\s*[1-6]º?\s*[A-F]?$/i, '')
    .trim();
}

interface HitWinnersSummary {
  hitNumber: number;
  eventId: OlympicEventId;
  eventName: string;
  baseGrade: string;
  gender: Gender;
  gradeGroup: string;
  goldWinner: string;
  goldGroup: string;
  goldMark: string;
  silverWinner: string;
  silverGroup: string;
  silverMark: string;
  bronzeWinner: string;
  bronzeGroup: string;
  bronzeMark: string;
}

export const ExecutiveReportView: React.FC<ExecutiveReportViewProps> = ({
  students = [],
  heats = [],
  activeLevel = 'primaria'
}) => {
  const getStudent = (id: string) => (students || []).find(s => s.id === id);

  // Group Medal Standings
  const groupStandings = useMemo(() => {
    const map = new Map<string, { groupName: string; gold: number; silver: number; bronze: number; total: number; points: number }>();

    (heats || []).forEach(h => {
      const results = h.results || [];
      results.forEach(res => {
        const st = getStudent(res.studentId);
        if (!st || !st.gradeGroup) return;

        const grp = st.gradeGroup;
        const current = map.get(grp) || { groupName: grp, gold: 0, silver: 0, bronze: 0, total: 0, points: 0 };

        if (res.place === 1) {
          current.gold += 1;
          current.total += 1;
          current.points += 3;
        } else if (res.place === 2) {
          current.silver += 1;
          current.total += 1;
          current.points += 2;
        } else if (res.place === 3) {
          current.bronze += 1;
          current.total += 1;
          current.points += 1;
        }

        map.set(grp, current);
      });
    });

    return Array.from(map.values()).sort((a, b) => {
      if (a.gold !== b.gold) return b.gold - a.gold;
      if (a.silver !== b.silver) return b.silver - a.silver;
      if (a.bronze !== b.bronze) return b.bronze - a.bronze;
      return b.points - a.points;
    });
  }, [students, heats]);

  // Breakdown of Winners per Discipline and Hit
  const winnersByDiscipline = useMemo(() => {
    const events: OlympicEventId[] = ['relevos', 'velocidad', 'vallas', 'bala'];
    
    return events.map(evId => {
      const evInfo = OLYMPIC_EVENTS.find(e => e.id === evId) || OLYMPIC_EVENTS[0];
      const evHeats = (heats || [])
        .filter(h => (h.eventId || 'velocidad') === evId && (h.studentIds || []).length > 0)
        .sort((a, b) => {
          const gA = getGradeNumber(a.gradeGroup);
          const gB = getGradeNumber(b.gradeGroup);
          if (gA !== gB) return gA - gB;
          if (a.gender !== b.gender) return a.gender === 'boy' ? -1 : 1;
          return a.number - b.number;
        });

      const summaries: HitWinnersSummary[] = evHeats.map((h, idx) => {
        const results = h.results || [];
        const goldRes = results.find(r => r.place === 1);
        const silverRes = results.find(r => r.place === 2);
        const bronzeRes = results.find(r => r.place === 3);

        const goldSt = goldRes ? getStudent(goldRes.studentId) : undefined;
        const silverSt = silverRes ? getStudent(silverRes.studentId) : undefined;
        const bronzeSt = bronzeRes ? getStudent(bronzeRes.studentId) : undefined;

        return {
          hitNumber: idx + 1,
          eventId: evId,
          eventName: evInfo.name,
          baseGrade: extractBaseGrade(h.gradeGroup),
          gender: h.gender,
          gradeGroup: h.gradeGroup,
          goldWinner: getCleanStudentFullName(goldSt),
          goldGroup: goldSt?.gradeGroup || '---',
          goldMark: goldRes?.timeMark || '---',
          silverWinner: getCleanStudentFullName(silverSt),
          silverGroup: silverSt?.gradeGroup || '---',
          silverMark: silverRes?.timeMark || '---',
          bronzeWinner: getCleanStudentFullName(bronzeSt),
          bronzeGroup: bronzeSt?.gradeGroup || '---',
          bronzeMark: bronzeRes?.timeMark || '---',
        };
      });

      return {
        eventId: evId,
        evInfo,
        summaries
      };
    }).filter(d => d.summaries.length > 0);
  }, [heats, students]);

  const handlePrint = () => {
    window.print();
  };

  const levelLabel = activeLevel === 'preescolar' ? 'Preescolar' : activeLevel === 'secundaria' ? 'Secundaria' : 'Primaria';

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      
      {/* Top Controls (Hidden when printing) */}
      <div className="no-print glass-panel p-5 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <FileText className="w-5 h-5 text-amber-400" />
            Informe Ejecutivo de Resultados para la Dirección
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Memoria oficial completa con la lista de ganadores por Hit, marcas y Medallero Institucional.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => StorageService.exportEventJSON(students, heats, activeLevel)}
            className="px-4 py-2.5 rounded-xl font-bold bg-slate-900 text-amber-300 border border-amber-500/40 hover:bg-slate-800 transition-all text-xs flex items-center gap-1.5 shadow-md"
          >
            <Download className="w-4 h-4" />
            <span>Exportar Respaldo JSON</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-5 py-2.5 rounded-xl font-black bg-amber-500 text-slate-950 hover:bg-amber-400 transition-all text-xs flex items-center gap-1.5 shadow-xl shadow-amber-500/20"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir Informe Oficial</span>
          </button>
        </div>
      </div>

      {/* PRINTABLE EXECUTIVE REPORT PAPER */}
      <div className="bg-white text-slate-900 p-8 print:p-4 rounded-3xl print:rounded-none shadow-2xl print:shadow-none border-4 border-blue-950 font-sans space-y-6 max-w-5xl mx-auto print:max-w-none print:w-full print:m-0 print:border-none">
        
        {/* HEADER REPORT INSTITUTIONAL */}
        <div className="border-b-4 border-red-600 pb-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <LaSalleLogo size={60} showText={false} />
            <div>
              <h1 className="text-xl md:text-2xl font-black tracking-tight text-blue-950 uppercase leading-none">
                COLEGIO LA SALLE DE TUXTLA
              </h1>
              <p className="text-xs font-bold text-red-600 tracking-wide uppercase mt-1">
                COORDINACIÓN DE EDUCACIÓN FÍSICA Y DEPORTES — MEMORIA OFICIAL
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="bg-blue-950 text-amber-400 px-3 py-1 rounded-xl text-xs font-black uppercase shadow-sm">
              NIVEL {levelLabel.toUpperCase()}
            </span>
            <p className="text-[10px] text-slate-500 font-bold mt-1">
              FECHA: {new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>

        {/* DOCUMENT TITLE */}
        <div className="text-center space-y-1 bg-slate-50 p-4 rounded-2xl border border-slate-200">
          <h2 className="text-xl font-black text-blue-950 uppercase tracking-tight">
            INFORME EJECUTIVO DE RESULTADOS — MINI / OLIMPIADAS ESCOLARES
          </h2>
          <p className="text-xs text-slate-600 font-medium">
            Resumen Oficial de Ganadores, Cuadro de Honor y Medallero por Salones
          </p>
        </div>

        {/* GENERAL STATS SUMMARY CARDS */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-2xl">
            <p className="text-[10px] font-bold text-blue-900 uppercase">Total de Atletas Participantes</p>
            <p className="text-xl font-black text-blue-950">{students.length} Alumnos</p>
          </div>

          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl">
            <p className="text-[10px] font-bold text-emerald-900 uppercase">Hits Competidos</p>
            <p className="text-xl font-black text-emerald-950">{heats.length} Hits</p>
          </div>

          <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl">
            <p className="text-[10px] font-bold text-amber-900 uppercase">Medallas Entregadas</p>
            <p className="text-xl font-black text-amber-950">
              {groupStandings.reduce((acc, g) => acc + g.total, 0)} Medallas
            </p>
          </div>
        </div>

        {/* SECTION 1: MEDALLERO GENERAL POR GRUPOS */}
        <div className="space-y-2">
          <h3 className="text-sm font-black text-blue-950 uppercase tracking-wider flex items-center gap-2 border-b-2 border-blue-950 pb-1">
            <Trophy className="w-4 h-4 text-amber-500" />
            1. Medallero Institucional por Salón y Puntuación General
          </h3>

          <table className="w-full text-left text-xs border-collapse border border-slate-300 rounded-xl overflow-hidden">
            <thead className="bg-blue-950 text-white font-black uppercase text-[10px]">
              <tr>
                <th className="p-2 border-r border-blue-900 text-center w-12">Lugar</th>
                <th className="p-2 border-r border-blue-900">Salón / Grupo</th>
                <th className="p-2 border-r border-blue-900 text-center text-amber-300">🥇 Oro</th>
                <th className="p-2 border-r border-blue-900 text-center text-slate-300">🥈 Plata</th>
                <th className="p-2 border-r border-blue-900 text-center text-amber-600">🥉 Bronce</th>
                <th className="p-2 border-r border-blue-900 text-center">Total Medallas</th>
                <th className="p-2 text-center text-amber-300">Puntos Totales</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-semibold text-slate-900">
              {groupStandings.map((g, idx) => (
                <tr key={g.groupName} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                  <td className="p-2 text-center font-bold font-mono text-blue-950">{idx + 1}.º</td>
                  <td className="p-2 font-black text-blue-950">{g.groupName}</td>
                  <td className="p-2 text-center font-bold text-amber-700 bg-amber-50">{g.gold}</td>
                  <td className="p-2 text-center font-bold text-slate-700 bg-slate-100">{g.silver}</td>
                  <td className="p-2 text-center font-bold text-amber-800 bg-amber-100/50">{g.bronze}</td>
                  <td className="p-2 text-center font-black">{g.total}</td>
                  <td className="p-2 text-center font-black text-blue-950 bg-blue-50/50">{g.points} pts</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* SECTION 2: MEMORIA DETALLADA DE GANADORES POR HITS */}
        <div className="space-y-5">
          <h3 className="text-sm font-black text-blue-950 uppercase tracking-wider flex items-center gap-2 border-b-2 border-blue-950 pb-1">
            <Award className="w-4 h-4 text-emerald-600" />
            2. Memoria de Ganadores por Prueba y Hit
          </h3>

          {winnersByDiscipline.map(discipline => (
            <div key={discipline.eventId} className="space-y-2">
              <div className="bg-slate-100 p-2 rounded-lg border border-slate-300 font-bold text-xs text-blue-950 uppercase flex items-center justify-between">
                <span>DISCIPLINA: {discipline.evInfo.name}</span>
                <span className="text-[10px] text-slate-600">{discipline.summaries.length} Hits Computados</span>
              </div>

              <table className="w-full text-left text-[11px] print:text-[10px] border-collapse border border-slate-300 rounded-xl overflow-hidden">
                <thead className="bg-slate-800 text-white font-black uppercase text-[9.5px]">
                  <tr>
                    <th className="p-1.5 border-r border-slate-700 text-center w-10">Hit #</th>
                    <th className="p-1.5 border-r border-slate-700 w-24">Categoría</th>
                    <th className="p-1.5 border-r border-slate-700">🥇 1.º Lugar (Oro)</th>
                    <th className="p-1.5 border-r border-slate-700">🥈 2.º Lugar (Plata)</th>
                    <th className="p-1.5 border-r border-slate-700">🥉 3.er Lugar (Bronce)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-medium text-slate-900">
                  {discipline.summaries.map(s => (
                    <tr key={s.hitNumber} className="hover:bg-slate-50">
                      <td className="p-1.5 text-center font-bold text-blue-950 bg-slate-100">#{s.hitNumber}</td>
                      <td className="p-1.5 font-bold text-slate-800">{s.baseGrade} Grado ({s.gender === 'boy' ? 'Var' : 'Fem'})</td>
                      <td className="p-1.5 border-r border-slate-200">
                        <div className="font-bold text-amber-900">{s.goldWinner}</div>
                        <div className="text-[9.5px] text-slate-500 font-mono">{s.goldGroup} {s.goldMark !== '---' && `• ${s.goldMark}`}</div>
                      </td>
                      <td className="p-1.5 border-r border-slate-200">
                        <div className="font-bold text-slate-800">{s.silverWinner}</div>
                        <div className="text-[9.5px] text-slate-500 font-mono">{s.silverGroup} {s.silverMark !== '---' && `• ${s.silverMark}`}</div>
                      </td>
                      <td className="p-1.5">
                        <div className="font-bold text-amber-800">{s.bronzeWinner}</div>
                        <div className="text-[9.5px] text-slate-500 font-mono">{s.bronzeGroup} {s.bronzeMark !== '---' && `• ${s.bronzeMark}`}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>

        {/* SECTION 3: SIGNATURES FOR DIRECTORS */}
        <div className="border-t-2 border-slate-300 pt-8 mt-8 grid grid-cols-2 gap-16 text-center text-xs text-slate-800">
          <div>
            <div className="h-12 border-b border-slate-400 mb-2"></div>
            <p className="font-black text-blue-950 uppercase">Coordinador de Educación Física</p>
            <p className="text-[10px] text-slate-500">Colegio La Salle de Tuxtla</p>
          </div>

          <div>
            <div className="h-12 border-b border-slate-400 mb-2"></div>
            <p className="font-black text-blue-950 uppercase">Director del Colegio La Salle</p>
            <p className="text-[10px] text-slate-500">Colegio La Salle de Tuxtla</p>
          </div>
        </div>

      </div>

    </div>
  );
};
