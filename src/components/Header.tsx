import React, { useState } from 'react';
import { 
  Users, 
  Layers, 
  Printer, 
  Upload, 
  Cloud, 
  CloudOff,
  Search, 
  Unlock,
  Radio,
  Trophy,
  Baby,
  School,
  GraduationCap,
  Sun,
  Moon,
  FileText
} from 'lucide-react';
import { LaSalleLogo } from './LaSalleLogo';
import type { SchoolLevelId } from '../types/olympics';
import { SCHOOL_LEVELS } from '../types/olympics';

interface HeaderProps {
  activeTab: 'public_live' | 'public_search' | 'teacher_live' | 'students' | 'heats' | 'print' | 'report';
  setActiveTab: (tab: 'public_live' | 'public_search' | 'teacher_live' | 'students' | 'heats' | 'print' | 'report') => void;
  activeLevel: SchoolLevelId;
  onSelectLevel: (level: SchoolLevelId) => void;
  isTeacherUnlocked: boolean;
  onOpenTeacherAuthModal: () => void;
  onLockTeacher: () => void;
  isFirebaseActive: boolean;
  onOpenFirebaseModal: () => void;
  onOpenImportModal: () => void;
  onExportData: () => void;
  onAddStudent: () => void;
  totalStudents: number;
  unassignedCount: number;
  totalHeats: number;
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  activeLevel,
  onSelectLevel,
  isTeacherUnlocked,
  onOpenTeacherAuthModal,
  onLockTeacher,
  isFirebaseActive,
  onOpenFirebaseModal,
  onOpenImportModal,
  onExportData,
  onAddStudent,
  totalStudents,
  unassignedCount,
  totalHeats,
  theme = 'dark',
  onToggleTheme
}) => {
  const [logoTapCount, setLogoTapCount] = useState(0);

  const handleLogoClick = () => {
    if (isTeacherUnlocked) {
      setActiveTab('teacher_live');
    } else {
      const nextCount = logoTapCount + 1;
      setLogoTapCount(nextCount);
      if (nextCount >= 3) {
        setLogoTapCount(0);
        onOpenTeacherAuthModal();
      } else {
        setActiveTab('public_live');
      }
    }
  };

  const renderLevelIcon = (levelId: SchoolLevelId) => {
    switch (levelId) {
      case 'preescolar': return <Baby className="w-3.5 h-3.5" />;
      case 'primaria': return <School className="w-3.5 h-3.5" />;
      case 'secundaria': return <GraduationCap className="w-3.5 h-3.5" />;
    }
  };

  return (
    <header className="no-print sticky top-0 z-40 bg-[#002B66]/95 backdrop-blur-md border-b-2 border-[#D4AF37]/60 shadow-xl px-4 lg:px-8 py-3 transition-colors duration-200">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Official Logo */}
        <div className="flex flex-wrap items-center gap-4">
          <LaSalleLogo size={46} showText={true} onClick={handleLogoClick} />

          {/* 🏫 SCHOOL LEVEL SELECTOR (Visible only to Teacher when Unlocked) */}
          {isTeacherUnlocked && (
            <div className="flex items-center gap-1 bg-[#051930] p-1 rounded-xl border border-amber-500/30">
              {SCHOOL_LEVELS.map(lvl => {
                const isActive = activeLevel === lvl.id;
                return (
                  <button
                    key={lvl.id}
                    onClick={() => onSelectLevel(lvl.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
                      isActive 
                        ? 'bg-amber-400 text-slate-950 shadow-md scale-105'
                        : 'text-slate-300 hover:text-white hover:bg-white/10'
                    }`}
                    title={`Cambiar a ${lvl.name}`}
                  >
                    {renderLevelIcon(lvl.id)}
                    <span>{lvl.shortName}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* PUBLIC MODE (Ultra-Clean, Simplified Header for Parents) */}
        {!isTeacherUnlocked ? (
          <div className="flex flex-wrap items-center gap-2">
            
            {/* Public Search & Student Horarios Tab */}
            <button
              onClick={() => setActiveTab('public_search')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${
                activeTab === 'public_search'
                  ? 'bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/20 scale-105'
                  : 'bg-[#051930] text-slate-200 border border-amber-500/30 hover:bg-[#0d3b7a] hover:border-amber-400'
              }`}
            >
              <Search className="w-4 h-4 text-amber-400" />
              <span>🎓 Buscador de Alumnos</span>
            </button>

            {/* Live Stadium Broadcast Tab */}
            <button
              onClick={() => setActiveTab('public_live')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${
                activeTab === 'public_live'
                  ? 'bg-[#C8102E] text-white shadow-lg shadow-red-600/30 scale-105'
                  : 'bg-red-500/15 text-red-200 border border-red-500/30 hover:bg-red-500/25'
              }`}
            >
              <Radio className="w-4 h-4 text-red-400 animate-pulse" />
              <span>🔴 Transmisión LIVE en Vivo</span>
            </button>

            {/* Theme Toggle Button */}
            <button
              onClick={onToggleTheme}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#051930] text-slate-200 border border-amber-500/30 hover:bg-[#0d3b7a] transition-all shadow-sm ml-1"
              title={theme === 'light' ? 'Cambiar a Modo Oscuro' : 'Cambiar a Modo Claro'}
            >
              {theme === 'light' ? <Moon className="w-4 h-4 text-indigo-400" /> : <Sun className="w-4 h-4 text-amber-400" />}
              <span>{theme === 'light' ? 'Modo Oscuro' : 'Modo Claro'}</span>
            </button>
          </div>
        ) : (
          /* TEACHER MODE UNLOCKED (Shows Full Admin Tabs & Controls) */
          <div className="flex flex-wrap items-center gap-3">
            <nav className="flex flex-wrap items-center gap-1 bg-[#051930] p-1.5 rounded-xl border border-amber-500/30 shadow-inner">
              
              {/* Live Touch Control Console */}
              <button
                onClick={() => setActiveTab('teacher_live')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'teacher_live'
                    ? 'bg-[#C8102E] text-white font-black shadow-md'
                    : 'text-red-300 hover:text-white hover:bg-red-500/20'
                }`}
              >
                <Radio className="w-3.5 h-3.5 animate-pulse" />
                <span>🔴 Consola LIVE</span>
              </button>

              {/* Medallero & Report */}
              <button
                onClick={() => setActiveTab('report')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'report'
                    ? 'bg-amber-400 text-slate-950 font-black shadow-md'
                    : 'text-amber-300 hover:text-white hover:bg-amber-500/20'
                }`}
              >
                <Trophy className="w-3.5 h-3.5" />
                <span>📊 Medallero</span>
              </button>

              <div className="w-px h-5 bg-amber-500/20 mx-1 hidden sm:block"></div>

              {/* Public Live View Preview */}
              <button
                onClick={() => setActiveTab('public_live')}
                className={`flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'public_live' || activeTab === 'public_search'
                    ? 'bg-[#0d3b7a] text-white font-bold border border-amber-500/30'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Search className="w-3.5 h-3.5" />
                <span>Vista Papás</span>
              </button>

              {/* Teacher Tab 1: Students */}
              <button
                onClick={() => setActiveTab('students')}
                className={`flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'students'
                    ? 'bg-[#0d3b7a] text-white font-bold border border-amber-500/30'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>1. Alumnos ({totalStudents})</span>
              </button>

              {/* Teacher Tab 2: Heats */}
              <button
                onClick={() => setActiveTab('heats')}
                className={`flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'heats'
                    ? 'bg-[#0d3b7a] text-white font-bold border border-amber-500/30'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>2. Hits ({totalHeats})</span>
              </button>

              {/* Teacher Tab 3: Print Sheets */}
              <button
                onClick={() => setActiveTab('print')}
                className={`flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'print'
                    ? 'bg-[#0d3b7a] text-white font-bold border border-amber-500/30'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Printer className="w-3.5 h-3.5" />
                <span>3. Impresión</span>
              </button>

              {/* Teacher Tab 4: Executive Report for Directors */}
              <button
                onClick={() => setActiveTab('executive_report')}
                className={`flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'executive_report'
                    ? 'bg-[#0d3b7a] text-white font-bold border border-amber-500/30'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <FileText className="w-3.5 h-3.5 text-amber-400" />
                <span>4. Informe Dirección</span>
              </button>
            </nav>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-2">
              {/* Import Button */}
              <button
                onClick={onOpenImportModal}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-500 shadow-md transition-all"
                title="Importar alumnos desde Excel / CSV"
              >
                <Upload className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Importar</span>
              </button>

              {/* Firebase Cloud Sync Button */}
              <button
                onClick={onOpenFirebaseModal}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                  isFirebaseActive
                    ? 'bg-sky-500/20 text-sky-300 border-sky-500/40 hover:bg-sky-500/30'
                    : 'bg-[#051930] text-slate-300 border-amber-500/30 hover:border-amber-400'
                }`}
                title="Configuración de Sincronización Firebase"
              >
                {isFirebaseActive ? <Cloud className="w-3.5 h-3.5 text-sky-400" /> : <CloudOff className="w-3.5 h-3.5 text-slate-400" />}
                <span className="hidden sm:inline">{isFirebaseActive ? 'Nube Activa' : 'Conectar Nube'}</span>
              </button>

              {/* Theme Toggle Button */}
              <button
                onClick={onToggleTheme}
                className="p-2 rounded-xl bg-[#051930] text-slate-300 border border-amber-500/30 hover:bg-[#0d3b7a] transition-all"
                title={theme === 'light' ? 'Cambiar a Modo Oscuro' : 'Cambiar a Modo Claro'}
              >
                {theme === 'light' ? <Moon className="w-4 h-4 text-indigo-400" /> : <Sun className="w-4 h-4 text-amber-400" />}
              </button>

              {/* Lock Session */}
              <button
                onClick={onLockTeacher}
                className="p-2 rounded-xl bg-[#051930] text-slate-300 border border-amber-500/30 hover:text-white hover:bg-[#0d3b7a] transition-all"
                title="Cerrar sesión de maestro"
              >
                <Unlock className="w-4 h-4 text-emerald-400" />
              </button>
            </div>
          </div>
        )}

      </div>
    </header>
  );
};
