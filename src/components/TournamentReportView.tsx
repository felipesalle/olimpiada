import React, { useMemo } from 'react';
import { OLYMPIC_EVENTS, extractBaseGrade } from '../types/olympics';
import type { 
  Student, 
  Heat 
} from '../types/olympics';
import { 
  Trophy, 
  Award, 
  Printer, 
  Download, 
  BarChart3, 
  Users, 
  CheckCircle2, 
  UserX,
  FileSpreadsheet
} from 'lucide-react';
import { LaSalleLogo } from './LaSalleLogo';

interface TournamentReportViewProps {
  students: Student[];
  heats: Heat[];
}

interface GroupMedalStats {
  groupName: string;
  gold: number;
  silver: number;
  bronze: number;
  totalMedals: number;
  totalPoints: number; // 3 pts Gold, 2 pts Silver, 1 pt Bronze
}

export const TournamentReportView: React.FC<TournamentReportViewProps> = ({
  students = [],
  heats = []
}) => {
  const getStudent = (id: string) => (students || []).find(s => s.id === id);

  // Group Medal Standings Calculation
  const groupStandings = useMemo(() => {
    const map = new Map<string, GroupMedalStats>();

    (heats || []).forEach(h => {
      const results = h.results || [];
      results.forEach(res => {
        const st = getStudent(res.studentId);
        if (!st || !st.gradeGroup) return;

        const grp = st.gradeGroup;
        const current = map.get(grp) || {
          groupName: grp,
          gold: 0,
          silver: 0,
          bronze: 0,
          totalMedals: 0,
          totalPoints: 0
        };

        if (res.place === 1) {
          current.gold += 1;
          current.totalMedals += 1;
          current.totalPoints += 3;
        } else if (res.place === 2) {
          current.silver += 1;
          current.totalMedals += 1;
          current.totalPoints += 2;
        } else if (res.place === 3) {
          current.bronze += 1;
          current.totalMedals += 1;
          current.totalPoints += 1;
        }

        map.set(grp, current);
      });
    });

    const list = Array.from(map.values());
    // Sort by Gold -> Silver -> Bronze -> Total Points
    list.sort((a, b) => {
      if (a.gold !== b.gold) return b.gold - a.gold;
      if (a.silver !== b.silver) return b.silver - a.silver;
      if (a.bronze !== b.bronze) return b.bronze - a.bronze;
      return b.totalPoints - a.totalPoints;
    });

    return list;
  }, [students, heats]);

  // General Attendance Stats
  const attendanceStats = useMemo(() => {
    let totalAssignedRuns = 0;
    let totalDNS = 0;

    (heats || []).forEach(h => {
      const results = h.results || [];
      results.forEach(r => {
        totalAssignedRuns++;
        if (r.place === 'DNS') totalDNS++;
      });
    });

    return {
      totalAssignedRuns,
      totalDNS,
      attendancePercentage: totalAssignedRuns > 0 ? Math.round(((totalAssignedRuns - totalDNS) / totalAssignedRuns) * 100) : 100
    };
  }, [heats]);

  const handlePrintReport = () => {
    window.print();
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12 font-sans">
      
      {/* Top Action Bar (Hidden when printing) */}
      <div className="no-print glass-panel p-5 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            Informe Oficial de Resultados y Medallero Institucional
          </h2>
          <p className="text-xs text-slate-400">
            Resumen del torneo listo para imprimir y entregar a los Directores del Colegio La Salle de Tuxtla.
          </p>
        </div>

        <button
          onClick={handlePrintReport}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold bg-amber-500 text-slate-950 hover:bg-amber-400 shadow-lg shadow-amber-500/20 transition-all"
        >
          <Printer className="w-4 h-4" />
          <span>Imprimir Informe para Directores</span>
        </button>
      </div>

      {/* PRINTABLE DOCUMENT CONTAINER */}
      <div className="bg-white text-slate-900 p-8 rounded-3xl shadow-2xl border border-slate-300 space-y-8 print:p-0 print:border-none print:shadow-none font-sans">
        
        {/* HEADER LETTERHEAD */}
        <div className="border-b-2 border-red-600 pb-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <LaSalleLogo size={56} showText={false} />
            <div>
              <h1 className="text-xl font-black text-blue-950 uppercase tracking-tight leading-none">
                COLEGIO LA SALLE DE TUXTLA
              </h1>
              <p className="text-xs font-bold text-red-600 tracking-wide uppercase mt-1">
                INFORME GENERAL DE RESULTADOS — MINI / OLIMPIADAS ESCOLARES
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Coordinación de Educación Física y Deportes
              </p>
            </div>
          </div>

          <div className="text-right text-xs text-slate-700">
            <p className="font-bold text-blue-950">Fecha: {new Date().toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            <p className="text-[10px] text-slate-500">Tuxtla Gutiérrez, Chiapas</p>
          </div>
        </div>

        {/* STATS OVERVIEW CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-950 text-amber-400 flex items-center justify-center font-bold">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-blue-900 uppercase">Atletas Registrados</p>
              <p className="text-lg font-black text-blue-950">{students.length} Alumnos</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-amber-900 uppercase">Medallas Entregadas</p>
              <p className="text-lg font-black text-amber-950">
                {groupStandings.reduce((sum, g) => sum + g.totalMedals, 0)} Medallas
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-bold">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-emerald-900 uppercase">Asistencia Atletas</p>
              <p className="text-lg font-black text-emerald-950">
                {attendanceStats.attendancePercentage}% Asistencia
              </p>
            </div>
          </div>
        </div>

        {/* SECTION 1: MEDALLERO GENERAL POR GRUPO/SALÓN */}
        <div className="space-y-3">
          <h2 className="text-base font-black text-blue-950 border-b border-slate-300 pb-1.5 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            1. Medallero General por Salón y Grupo
          </h2>

          {groupStandings.length === 0 ? (
            <p className="text-xs text-slate-500 italic py-4 text-center">
              Aún no se han registrado resultados de medallas en los Hits.
            </p>
          ) : (
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="bg-blue-950 text-white font-black uppercase text-[11px]">
                  <th className="py-2.5 px-3 border-r border-blue-900 text-center w-12">Pos</th>
                  <th className="py-2.5 px-4 border-r border-blue-900">Grado y Grupo</th>
                  <th className="py-2.5 px-3 border-r border-blue-900 text-center text-amber-300">🥇 Oro</th>
                  <th className="py-2.5 px-3 border-r border-blue-900 text-center text-slate-300">🥈 Plata</th>
                  <th className="py-2.5 px-3 border-r border-blue-900 text-center text-amber-400">🥉 Bronce</th>
                  <th className="py-2.5 px-3 border-r border-blue-900 text-center">Total Medallas</th>
                  <th className="py-2.5 px-3 text-center">Puntos Totales</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300 font-semibold text-slate-900">
                {groupStandings.map((grp, idx) => (
                  <tr key={grp.groupName} className={idx < 3 ? 'bg-amber-50/60 font-bold' : 'hover:bg-slate-50'}>
                    <td className="py-2.5 px-3 text-center border-r border-slate-300 font-extrabold text-blue-950">
                      {idx + 1}º
                    </td>
                    <td className="py-2.5 px-4 border-r border-slate-300 font-black text-blue-950 text-sm">
                      {grp.groupName}
                    </td>
                    <td className="py-2.5 px-3 text-center border-r border-slate-300 font-extrabold text-amber-600 bg-amber-100/50">
                      {grp.gold}
                    </td>
                    <td className="py-2.5 px-3 text-center border-r border-slate-300 font-extrabold text-slate-700 bg-slate-100">
                      {grp.silver}
                    </td>
                    <td className="py-2.5 px-3 text-center border-r border-slate-300 font-extrabold text-amber-800 bg-amber-200/40">
                      {grp.bronze}
                    </td>
                    <td className="py-2.5 px-3 text-center border-r border-slate-300 font-black text-blue-950">
                      {grp.totalMedals}
                    </td>
                    <td className="py-2.5 px-3 text-center font-black text-red-700 text-sm">
                      {grp.totalPoints} pts
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* FOOTER SIGNATURE BLOCK FOR DIRECTORS */}
        <div className="pt-12 border-t border-slate-300 grid grid-cols-2 gap-12 text-center text-xs text-slate-700">
          <div>
            <div className="h-12 border-b border-slate-400 mb-2"></div>
            <p className="font-bold text-blue-950">Prof. de Educación Física</p>
            <p className="text-[10px] text-slate-500">Coordinador del Evento Deportivo</p>
          </div>
          <div>
            <div className="h-12 border-b border-slate-400 mb-2"></div>
            <p className="font-bold text-blue-950">Dirección General</p>
            <p className="text-[10px] text-slate-500">Colegio La Salle de Tuxtla</p>
          </div>
        </div>

      </div>

    </div>
  );
};
