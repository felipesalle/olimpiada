import React, { useState, useMemo } from 'react';
import { 
  OLYMPIC_EVENTS, 
  MIN_EVENTS_PER_STUDENT 
} from '../types/olympics';
import type { 
  Student, 
  Heat,
  OlympicEventId, 
  Gender 
} from '../types/olympics';
import { 
  Search, 
  UserPlus, 
  CheckCircle2, 
  AlertTriangle, 
  Zap, 
  Activity, 
  Users, 
  Target,
  Trash2,
  Plus,
  Layers,
  ArrowRight,
  ShieldAlert,
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { SeoulOlympicIcon } from './SeoulOlympicIcons';

interface StudentsViewProps {
  students: Student[];
  heats: Heat[];
  onAddStudent: (student: Omit<Student, 'id' | 'createdAt'>) => void;
  onDeleteStudent: (studentId: string) => void;
  onRemoveDuplicates: () => void;
  onClearAllStudents: () => void;
  onGoToHeatBuilder: () => void;
  onLoadPreescolarSimulation?: () => void;
}

export const StudentsView: React.FC<StudentsViewProps> = ({
  students = [],
  heats = [],
  onAddStudent,
  onDeleteStudent,
  onRemoveDuplicates,
  onClearAllStudents,
  onGoToHeatBuilder,
  onLoadPreescolarSimulation
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGrade, setSelectedGrade] = useState<string>('all');
  const [selectedGender, setSelectedGender] = useState<Gender | 'all'>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'all' | 'compliant' | 'missing'>('all');
  const [showAddForm, setShowAddForm] = useState(false);

  // New Student Form State
  const [newFirstName, setNewFirstName] = useState('');
  const [newLastName, setNewLastName] = useState('');
  const [newGradeGroup, setNewGradeGroup] = useState('1º A');
  const [newGender, setNewGender] = useState<Gender>('boy');

  // Detect duplicate count in current list
  const duplicateCountInList = useMemo(() => {
    const seen = new Set<string>();
    let dupes = 0;
    (students || []).forEach(s => {
      const key = `${s.firstName || ''}${s.lastName || ''}${s.gradeGroup || ''}`.toLowerCase().replace(/\s+/g, '');
      if (seen.has(key)) dupes++;
      else seen.add(key);
    });
    return dupes;
  }, [students]);

  // Compute actual assigned events for each student based on the Heats they are in
  const studentAssignedEventsMap = useMemo(() => {
    const map = new Map<string, Set<OlympicEventId>>();
    (students || []).forEach(s => map.set(s.id, new Set<OlympicEventId>()));

    (heats || []).forEach(h => {
      const eventId = h.eventId || 'velocidad';
      const studentIds = h.studentIds || [];
      studentIds.forEach(stId => {
        const set = map.get(stId);
        if (set) set.add(eventId);
      });
    });

    return map;
  }, [students, heats]);

  // Extract unique Grade Groups sorted logically
  const uniqueGrades = useMemo(() => {
    const gradesSet = new Set((students || []).map(s => s.gradeGroup).filter(Boolean));
    return Array.from(gradesSet).sort();
  }, [students]);

  // Filter students
  const filteredStudents = useMemo(() => {
    return (students || []).filter(student => {
      const nameStr = `${student.firstName || ''} ${student.lastName || ''}`.toLowerCase();
      const matchesSearch = nameStr.includes(searchTerm.toLowerCase());
      const matchesGrade = selectedGrade === 'all' || student.gradeGroup === selectedGrade;
      const matchesGender = selectedGender === 'all' || student.gender === selectedGender;
      
      const assignedEvents = studentAssignedEventsMap.get(student.id) || new Set();
      const count = assignedEvents.size;
      const isCompliant = count >= MIN_EVENTS_PER_STUDENT;

      const matchesStatus = 
        selectedStatusFilter === 'all' ||
        (selectedStatusFilter === 'compliant' && isCompliant) ||
        (selectedStatusFilter === 'missing' && !isCompliant);

      return matchesSearch && matchesGrade && matchesGender && matchesStatus;
    });
  }, [students, searchTerm, selectedGrade, selectedGender, selectedStatusFilter, studentAssignedEventsMap]);

  // Stats calculation
  const totalCount = (students || []).length;
  const compliantCount = (students || []).filter(s => (studentAssignedEventsMap.get(s.id)?.size || 0) >= MIN_EVENTS_PER_STUDENT).length;
  const missingCount = totalCount - compliantCount;

  const handleCreateStudentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFirstName.trim()) return;

    onAddStudent({
      firstName: newFirstName.trim(),
      lastName: newLastName.trim() || '',
      gradeGroup: newGradeGroup.trim(),
      gender: newGender,
      events: []
    });

    setNewFirstName('');
    setNewLastName('');
    setShowAddForm(false);
  };

  const renderEventIcon = (eventId: OlympicEventId) => {
    return <SeoulOlympicIcon eventId={eventId} size={15} className="shrink-0" />;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Explanation Banner */}
      <div className="bg-[#002B66] dark:bg-slate-900/90 border border-amber-500/30 p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 text-white shadow-lg">
        <div>
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Users className="w-4 h-4 text-amber-300" />
            Directorio de Alumnos/as y Control de Participación
          </h2>
          <p className="text-xs text-slate-200 mt-1">
            Aquí registras a tus alumnos. Las 4 pruebas se marcarán <strong>automáticamente</strong> al ir asignando cada alumno a los Hits en la pestaña <strong>"2. Hits (Drag & Drop)"</strong>.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onLoadPreescolarSimulation && (
            <button
              onClick={onLoadPreescolarSimulation}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black bg-pink-500/20 text-pink-300 border border-pink-500/40 hover:bg-pink-500/30 transition-all shrink-0 shadow-md shadow-pink-500/10"
              title="Cargar simulación completa para Preescolar & Maternal con alumnos, hits y resultados"
            >
              <Sparkles className="w-4 h-4 text-pink-400 animate-pulse" />
              <span>⚡ Simulación Preescolar</span>
            </button>
          )}

          {duplicateCountInList > 0 && (
            <button
              onClick={onRemoveDuplicates}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:bg-rose-500/30 transition-all shrink-0"
              title="Eliminar registros duplicados de la lista"
            >
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              <span>Limpiar {duplicateCountInList} Duplicados</span>
            </button>
          )}

          {totalCount > 0 && (
            <button
              onClick={onClearAllStudents}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-rose-950/60 text-rose-300 border border-rose-800/80 hover:bg-rose-900/80 transition-all shrink-0"
              title="Vaciar todos los alumnos para importar una lista completamente nueva"
            >
              <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
              <span>Vaciar Alumnos</span>
            </button>
          )}

          <button
            onClick={onGoToHeatBuilder}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-amber-400 text-slate-950 hover:bg-amber-300 shadow-md shadow-amber-500/20 transition-all shrink-0 font-black"
          >
            <Layers className="w-4 h-4" />
            <span>Ir a Armar Hits (Drag & Drop)</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Top Banner & Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        <div className="glass-panel p-4 rounded-2xl border border-slate-300 dark:border-slate-800 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs font-bold text-slate-600 dark:text-slate-400">Total Alumnos Registrados</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white">{totalCount}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div 
          onClick={() => setSelectedStatusFilter('compliant')}
          className={`glass-panel p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between shadow-sm ${
            selectedStatusFilter === 'compliant' ? 'border-emerald-500 bg-emerald-500/10' : 'border-slate-300 dark:border-slate-800 hover:border-slate-400'
          }`}
        >
          <div>
            <p className="text-xs font-bold text-slate-600 dark:text-slate-400">Inscritos en Mín. 2 Pruebas</p>
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{compliantCount}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div 
          onClick={() => setSelectedStatusFilter('missing')}
          className={`glass-panel p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between shadow-sm ${
            selectedStatusFilter === 'missing' ? 'border-amber-500 bg-amber-500/10' : 'border-slate-300 dark:border-slate-800 hover:border-slate-400'
          }`}
        >
          <div>
            <p className="text-xs font-bold text-slate-600 dark:text-slate-400">Falta Asignación (&lt; 2 Pruebas)</p>
            <p className="text-2xl font-black text-amber-600 dark:text-amber-400">{missingCount}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* Filter Bar & Controls */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-300 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
        
        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nombre o apellido..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700/80 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-amber-500 font-medium transition-all"
          />
        </div>

        {/* Filters & Add Button */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          
          {/* Status Filter */}
          <select
            value={selectedStatusFilter}
            onChange={(e) => setSelectedStatusFilter(e.target.value as any)}
            className="bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-amber-500 font-medium"
          >
            <option value="all">Todos los estados ({totalCount})</option>
            <option value="compliant">🟢 Cumplen (2+ pruebas)</option>
            <option value="missing">⚠️ Incompletos (&lt; 2 pruebas)</option>
          </select>

          {/* Grade Selector */}
          <select
            value={selectedGrade}
            onChange={(e) => setSelectedGrade(e.target.value)}
            className="bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-amber-500 font-medium"
          >
            <option value="all">Todos los Salones</option>
            {uniqueGrades.map(grade => (
              <option key={grade} value={grade}>{grade}</option>
            ))}
          </select>

          {/* Gender Selector */}
          <div className="flex items-center bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700/80 rounded-xl p-1 shadow-inner">
            <button
              onClick={() => setSelectedGender('all')}
              className={`px-3 py-1 rounded-lg text-xs font-black transition-all ${
                selectedGender === 'all' ? 'bg-[#002B66] text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setSelectedGender('boy')}
              className={`px-3 py-1 rounded-lg text-xs font-black transition-all ${
                selectedGender === 'boy' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              👦 Niños
            </button>
            <button
              onClick={() => setSelectedGender('girl')}
              className={`px-3 py-1 rounded-lg text-xs font-black transition-all ${
                selectedGender === 'girl' ? 'bg-pink-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              👧 Niñas
            </button>
          </div>

          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black bg-amber-400 text-slate-950 hover:bg-amber-300 shadow-md shadow-amber-500/20 transition-all ml-auto md:ml-0"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Alumno</span>
          </button>

        </div>
      </div>

      {/* Inline Form to Add New Student */}
      {showAddForm && (
        <form onSubmit={handleCreateStudentSubmit} className="glass-panel p-5 rounded-2xl border border-amber-500/30 space-y-4 animate-fade-in">
          <h3 className="text-sm font-bold text-amber-400 flex items-center gap-2">
            <UserPlus className="w-4 h-4" /> Agregar Nuevo Estudiante (Nombres y Apellidos)
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">Nombre(s) *</label>
              <input
                type="text"
                required
                value={newFirstName}
                onChange={(e) => setNewFirstName(e.target.value)}
                placeholder="ej: Jesús Miguel"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">Apellidos Completo</label>
              <input
                type="text"
                value={newLastName}
                onChange={(e) => setNewLastName(e.target.value)}
                placeholder="ej: Tipacamú Gómez"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">Grado / Grupo *</label>
              <input
                type="text"
                required
                value={newGradeGroup}
                onChange={(e) => setNewGradeGroup(e.target.value)}
                placeholder="ej: 1º A"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">Género *</label>
              <select
                value={newGender}
                onChange={(e) => setNewGender(e.target.value as Gender)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
              >
                <option value="boy">👦 Niño</option>
                <option value="girl">👧 Niña</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:bg-slate-800"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg text-xs font-bold bg-emerald-500 text-slate-950 hover:bg-emerald-400 shadow-md shadow-emerald-500/20"
            >
              Guardar Alumno
            </button>
          </div>
        </form>
      )}

      {/* Main Student List Table */}
      <div className="glass-panel rounded-2xl border border-slate-300 dark:border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            
            {/* Table Header */}
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-900/80 border-b border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-400 font-bold uppercase tracking-wider">
                <th className="py-3.5 px-4">Alumno/a (Nombre Completo)</th>
                <th className="py-3.5 px-3">Grado/Grupo</th>
                <th className="py-3.5 px-3">Género</th>
                <th className="py-3.5 px-4 text-center">Pruebas en las que está en Hit (Se marcan al armar Hits)</th>
                <th className="py-3.5 px-3 text-center">Estado (Mín. 2 Pruebas)</th>
                <th className="py-3.5 px-4 text-right">Acciones</th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 font-medium">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500 dark:text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                        {students.length === 0
                          ? 'La lista de alumnos de este nivel está vacía.'
                          : 'No se encontraron alumnos con los filtros seleccionados.'}
                      </p>
                      {students.length === 0 && onLoadPreescolarSimulation && (
                        <button
                          onClick={onLoadPreescolarSimulation}
                          className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs bg-pink-500 text-slate-950 hover:bg-pink-400 shadow-lg shadow-pink-500/20 transition-all"
                        >
                          <Sparkles className="w-4 h-4" />
                          <span>⚡ Cargar Simulación Completa de Preescolar (24 Alumnos + Hits + Medallero)</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredStudents.map(student => {
                  const assignedEventsSet = studentAssignedEventsMap.get(student.id) || new Set<OlympicEventId>();
                  const eventCount = assignedEventsSet.size;
                  const isCompliant = eventCount >= MIN_EVENTS_PER_STUDENT;

                  return (
                    <tr key={student.id} className="hover:bg-slate-100 dark:hover:bg-slate-800/40 transition-colors">
                      
                      {/* Name - Crisp Dark Blue in Light Mode, Soft White in Dark Mode */}
                      <td className="py-3 px-4 font-black text-slate-900 dark:text-slate-100 text-sm">
                        {student.firstName} {student.lastName}
                      </td>

                      {/* Grade Group */}
                      <td className="py-3 px-3">
                        <span className="px-2 py-1 rounded-md bg-[#002B66] text-white border border-amber-400/40 font-mono text-[11px] font-bold shadow-sm">
                          {student.gradeGroup}
                        </span>
                      </td>

                      {/* Gender */}
                      <td className="py-3 px-3">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          student.gender === 'boy'
                            ? 'bg-blue-500/15 text-blue-800 dark:text-blue-300 border border-blue-500/30'
                            : 'bg-pink-500/15 text-pink-800 dark:text-pink-300 border border-pink-500/30'
                        }`}>
                          {student.gender === 'boy' ? '👦 Niño' : '👧 Niña'}
                        </span>
                      </td>

                      {/* 4 Events Automatic Matrix Status */}
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-1.5 flex-wrap">
                          {OLYMPIC_EVENTS.map(ev => {
                            const isAssigned = assignedEventsSet.has(ev.id);
                            return (
                              <span
                                key={ev.id}
                                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all ${
                                  isAssigned
                                    ? ev.badgeBg + ' font-black shadow-sm'
                                    : 'bg-slate-100 dark:bg-slate-950/40 text-slate-400 dark:text-slate-600 border-slate-300 dark:border-slate-800/60'
                                }`}
                                title={isAssigned ? `Asignado en Hit de ${ev.name}` : `Sin asignar en Hit de ${ev.name}`}
                              >
                                {renderEventIcon(ev.id)}
                                <span>{ev.shortName}</span>
                              </span>
                            );
                          })}
                        </div>
                      </td>

                      {/* Compliance Status Badge */}
                      <td className="py-3 px-3 text-center">
                        {isCompliant ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-500/40 text-[10px] font-bold">
                            <CheckCircle2 className="w-3 h-3" /> Inscrito ({eventCount}/2+ pruebas)
                          </span>
                        ) : (
                          <button
                            onClick={onGoToHeatBuilder}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-900 dark:text-amber-400 border border-amber-500/40 hover:bg-amber-500/30 text-[10px] font-bold transition-all"
                            title="Ir a asignar a otro Hit"
                          >
                            <AlertTriangle className="w-3 h-3" /> Falta ({eventCount}/2 mín) ➔
                          </button>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => onDeleteStudent(student.id)}
                          className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all"
                          title="Eliminar Estudiante"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
