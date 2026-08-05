import React, { useState, useMemo } from 'react';
import { X, FileText, CheckCircle2, AlertTriangle, Sparkles, HelpCircle, ShieldCheck } from 'lucide-react';
import type { Student, Gender } from '../types/olympics';

interface StudentImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingStudents: Student[];
  onImportStudents: (newStudents: Omit<Student, 'id' | 'createdAt'>[]) => void;
}

export const StudentImportModal: React.FC<StudentImportModalProps> = ({
  isOpen,
  onClose,
  existingStudents = [],
  onImportStudents
}) => {
  const [rawText, setRawText] = useState('');
  const [parsedPreview, setParsedPreview] = useState<Omit<Student, 'id' | 'createdAt'>[]>([]);
  const [defaultGrade, setDefaultGrade] = useState('1º A');
  const [isParsed, setIsParsed] = useState(false);
  const [skipDuplicates, setSkipDuplicates] = useState(true);

  // Set of normalized keys of existing students (e.g. "jesúsmigueltipacamúgómez1ºa")
  const existingKeys = useMemo(() => {
    const set = new Set<string>();
    (existingStudents || []).forEach(s => {
      const key = `${s.firstName || ''}${s.lastName || ''}${s.gradeGroup || ''}`.toLowerCase().replace(/\s+/g, '');
      if (key) set.add(key);
    });
    return set;
  }, [existingStudents]);

  // Identify preview items with duplicate status
  const analyzedPreview = useMemo(() => {
    return parsedPreview.map(item => {
      const key = `${item.firstName}${item.lastName}${item.gradeGroup}`.toLowerCase().replace(/\s+/g, '');
      const isDuplicate = existingKeys.has(key);
      return { ...item, isDuplicate };
    });
  }, [parsedPreview, existingKeys]);

  const newToImportCount = useMemo(() => {
    if (skipDuplicates) {
      return analyzedPreview.filter(item => !item.isDuplicate).length;
    }
    return analyzedPreview.length;
  }, [analyzedPreview, skipDuplicates]);

  const duplicateCount = useMemo(() => {
    return analyzedPreview.filter(item => item.isDuplicate).length;
  }, [analyzedPreview]);

  // EARLY RETURN MUST BE AFTER ALL HOOKS!
  if (!isOpen) return null;

  const parseRawText = () => {
    if (!rawText.trim()) return;

    const lines = rawText.split(/\r?\n/).filter(line => line.trim().length > 0);
    const parsed: Omit<Student, 'id' | 'createdAt'>[] = [];

    lines.forEach(line => {
      const cleanLine = line.trim();
      if (!cleanLine) return;

      // Smart delimiter check: comma, semicolon, tab
      let parts = cleanLine.split(/[,;\t]+/).map(p => p.trim());

      let firstName = '';
      let lastName = '';
      let gradeGroup = defaultGrade;
      let gender: Gender = 'boy';

      // Detect gender
      const lineLower = cleanLine.toLowerCase();
      if (lineLower.includes('niña') || lineLower.includes('femenino') || lineLower.includes(' nina') || lineLower.includes('(f)') || lineLower.endsWith(' f')) {
        gender = 'girl';
      } else if (lineLower.includes('niño') || lineLower.includes('masculino') || lineLower.includes(' nino') || lineLower.includes('(m)') || lineLower.endsWith(' m')) {
        gender = 'boy';
      }

      // Detect grade/group pattern e.g. "1ºA", "1RO B", "2º B", "3B", "4-A"
      const gradeMatch = cleanLine.match(/([1-6]º?\s*[RO]*\s*[A-F]?)/i);
      if (gradeMatch) {
        let gStr = gradeMatch[1].toUpperCase().replace(/\s+/g, ' ');
        if (!gStr.includes('º')) {
          gStr = gStr.replace(/([1-6])(RO)?/i, '$1º');
        }
        gradeGroup = gStr;
      }

      if (parts.length >= 3) {
        // Format: [Nombres, Apellidos, Grado] or [Nombre Completo, Grado, Genero]
        const firstPart = parts[0];
        const secondPart = parts[1];
        const thirdPart = parts[2];

        // Check if secondPart looks like grade (e.g. 1º A)
        if (/^[1-6]º?\s*[RO]*\s*[A-F]?$/i.test(secondPart)) {
          // Format: Nombre Completo, Grado, Genero
          const nameTokens = firstPart.split(/\s+/);
          if (nameTokens.length >= 3) {
            firstName = nameTokens.slice(0, nameTokens.length - 2).join(' ');
            lastName = nameTokens.slice(nameTokens.length - 2).join(' ');
          } else if (nameTokens.length === 2) {
            firstName = nameTokens[0];
            lastName = nameTokens[1];
          } else {
            firstName = firstPart;
            lastName = '';
          }
          gradeGroup = secondPart.toUpperCase();
        } else {
          // Format: Nombres, Apellidos (dos apellidos), Grado/Genero
          firstName = firstPart;
          lastName = secondPart;
          if (/^[1-6]º?\s*[RO]*\s*[A-F]?$/i.test(thirdPart)) {
            gradeGroup = thirdPart.toUpperCase();
          }
        }
      } else if (parts.length === 2) {
        // Format: Nombre Completo, Grado or Nombres, Apellidos
        const firstPart = parts[0];
        const secondPart = parts[1];

        if (/^[1-6]º?\s*[RO]*\s*[A-F]?$/i.test(secondPart)) {
          const nameTokens = firstPart.split(/\s+/);
          if (nameTokens.length >= 3) {
            firstName = nameTokens.slice(0, nameTokens.length - 2).join(' ');
            lastName = nameTokens.slice(nameTokens.length - 2).join(' ');
          } else if (nameTokens.length === 2) {
            firstName = nameTokens[0];
            lastName = nameTokens[1];
          } else {
            firstName = firstPart;
            lastName = '';
          }
          gradeGroup = secondPart.toUpperCase();
        } else {
          firstName = firstPart;
          lastName = secondPart;
        }
      } else {
        // Single string without delimiters
        const nameTokens = cleanLine.split(/\s+/).filter(p => {
          const lower = p.toLowerCase();
          return !lower.includes('niño') && 
                 !lower.includes('niña') && 
                 !lower.includes('femenino') && 
                 !lower.includes('masculino') &&
                 !/^[1-6]º?\s*[RO]*\s*[A-F]?$/i.test(p);
        });

        if (nameTokens.length >= 4) {
          firstName = nameTokens.slice(0, 2).join(' ');
          lastName = nameTokens.slice(2).join(' ');
        } else if (nameTokens.length === 3) {
          firstName = nameTokens[0];
          lastName = nameTokens.slice(1).join(' ');
        } else if (nameTokens.length === 2) {
          firstName = nameTokens[0];
          lastName = nameTokens[1];
        } else {
          firstName = cleanLine;
          lastName = '';
        }
      }

      parsed.push({
        firstName,
        lastName,
        gradeGroup,
        gender,
        events: []
      });
    });

    setParsedPreview(parsed);
    setIsParsed(true);
  };

  const handleConfirmImport = () => {
    const toImport = skipDuplicates
      ? analyzedPreview.filter(item => !item.isDuplicate)
      : analyzedPreview;

    if (toImport.length > 0) {
      onImportStudents(toImport);
      setRawText('');
      setParsedPreview([]);
      setIsParsed(false);
      onClose();
    }
  };

  return (
    <div className="no-print fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-bold text-slate-100">Importar Lista (Nombres y Dos Apellidos)</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 text-xs text-amber-300 flex items-start gap-3">
            <HelpCircle className="w-5 h-5 shrink-0 text-amber-400 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-200 mb-1"> Formato con Nombre(s) y Dos Apellidos:</p>
              <p className="text-slate-300">
                Pega a tus alumnos conservando sus dos apellidos. Ejemplos:<br />
                • <code className="bg-slate-950/60 px-1 py-0.5 rounded text-amber-300">Jesús Miguel Tipacamú Gómez, 1º A, Niño</code><br />
                • <code className="bg-slate-950/60 px-1 py-0.5 rounded text-amber-300">Eleno Antonio, Abud Bautista, 1º B, Niño</code><br />
                • <code className="bg-slate-950/60 px-1 py-0.5 rounded text-amber-300">Valentina Guadalupe Capetillo Espinosa, 1º B, Niña</code>
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Grado / Grupo Por Defecto:
              </label>
              <input
                type="text"
                value={defaultGrade}
                onChange={(e) => setDefaultGrade(e.target.value)}
                placeholder="ej: 1º A"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Pega aquí las líneas con tus alumnos (Nombres y dos apellidos):
            </label>
            <textarea
              rows={6}
              value={rawText}
              onChange={(e) => {
                setRawText(e.target.value);
                setIsParsed(false);
              }}
              placeholder={`Ejemplo:\nJesús Miguel Tipacamú Gómez, 1º A, Niño\nEleno Antonio Abud Bautista, 1º B, Niño\nValentina Guadalupe Capetillo Espinosa, 1º A, Niña`}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-sm font-mono text-slate-200 focus:outline-none focus:border-amber-500"
            />
          </div>

          {!isParsed && rawText.trim() && (
            <button
              onClick={parseRawText}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold bg-amber-500 text-slate-950 hover:bg-amber-400 transition-all shadow-lg shadow-amber-500/20"
            >
              <Sparkles className="w-4 h-4" />
              Procesar y Verificar ({rawText.split('\n').filter(l => l.trim()).length} líneas)
            </button>
          )}

          {isParsed && parsedPreview.length > 0 && (
            <div className="space-y-3">
              
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs bg-slate-950 p-3 rounded-xl border border-slate-800">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span className="font-semibold text-slate-200">
                    Se importarán {newToImportCount} alumnos con nombre completo
                  </span>
                  {duplicateCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-bold">
                      {duplicateCount} duplicados
                    </span>
                  )}
                </div>

                <label className="flex items-center gap-1.5 text-xs text-amber-300 font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={skipDuplicates}
                    onChange={(e) => setSkipDuplicates(e.target.checked)}
                    className="rounded text-amber-500 focus:ring-0"
                  />
                  <span>Omitir duplicados</span>
                </label>
              </div>

              <div className="max-h-48 overflow-y-auto bg-slate-950/80 border border-slate-800 rounded-xl divide-y divide-slate-800">
                {analyzedPreview.map((item, idx) => (
                  <div key={idx} className={`p-2.5 flex items-center justify-between text-xs ${
                    item.isDuplicate && skipDuplicates ? 'opacity-50 bg-rose-950/20' : ''
                  }`}>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-100">{item.firstName} {item.lastName}</span>
                      <span className="text-slate-400">({item.gradeGroup})</span>
                      {item.isDuplicate && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                          ⚠️ Ya existe
                        </span>
                      )}
                    </div>

                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      item.gender === 'boy' 
                        ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                        : 'bg-pink-500/20 text-pink-300 border border-pink-500/30'
                    }`}>
                      {item.gender === 'boy' ? '👦 Niño' : '👧 Niña'}
                    </span>
                  </div>
                ))}
              </div>

            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-800 bg-slate-900/50">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-all"
          >
            Cancelar
          </button>
          <button
            disabled={!isParsed || newToImportCount === 0}
            onClick={handleConfirmImport}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
              isParsed && newToImportCount > 0
                ? 'bg-emerald-500 text-slate-950 hover:bg-emerald-400 shadow-lg shadow-emerald-500/20'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            Confirmar e Importar {newToImportCount} Alumnos
          </button>
        </div>

      </div>
    </div>
  );
};
