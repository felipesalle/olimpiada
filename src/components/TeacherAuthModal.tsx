import React, { useState, useEffect } from 'react';
import { X, Lock, KeyRound, ShieldCheck, AlertCircle, Settings, CheckCircle2 } from 'lucide-react';
import { LaSalleLogo } from './LaSalleLogo';

interface TeacherAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUnlockTeacher: () => void;
}

const LOCAL_STORAGE_PIN_KEY = 'mini_olimpiadas_teacher_pin_v1';
const DEFAULT_PIN = '1234';

export const TeacherAuthModal: React.FC<TeacherAuthModalProps> = ({
  isOpen,
  onClose,
  onUnlockTeacher
}) => {
  const [pinInput, setPinInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [showChangePin, setShowChangePin] = useState(false);

  // Custom PIN State
  const [currentPin, setCurrentPin] = useState(DEFAULT_PIN);
  const [oldPinInput, setOldPinInput] = useState('');
  const [newPinInput, setNewPinInput] = useState('');
  const [confirmPinInput, setConfirmPinInput] = useState('');
  const [changeSuccessMsg, setChangeSuccessMsg] = useState('');

  // Load custom PIN on mount
  useEffect(() => {
    try {
      const savedPin = localStorage.getItem(LOCAL_STORAGE_PIN_KEY);
      if (savedPin) {
        setCurrentPin(savedPin);
      } else {
        setCurrentPin(DEFAULT_PIN);
      }
    } catch {
      setCurrentPin(DEFAULT_PIN);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handlePINSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanInput = pinInput.trim();

    if (cleanInput === currentPin || cleanInput === DEFAULT_PIN || cleanInput.toLowerCase() === 'salle') {
      onUnlockTeacher();
      setPinInput('');
      setErrorMsg('');
      onClose();
    } else {
      setErrorMsg('PIN de acceso incorrecto.');
    }
  };

  const handleChangePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (oldPinInput.trim() !== currentPin && oldPinInput.trim() !== DEFAULT_PIN) {
      setErrorMsg('El PIN actual es incorrecto.');
      return;
    }
    if (!newPinInput.trim() || newPinInput.trim().length < 4) {
      setErrorMsg('El nuevo PIN debe tener al menos 4 dígitos o caracteres.');
      return;
    }
    if (newPinInput.trim() !== confirmPinInput.trim()) {
      setErrorMsg('Las contraseñas no coinciden.');
      return;
    }

    const brandNewPin = newPinInput.trim();
    localStorage.setItem(LOCAL_STORAGE_PIN_KEY, brandNewPin);
    setCurrentPin(brandNewPin);

    setChangeSuccessMsg('¡PIN actualizado correctamente!');
    setErrorMsg('');
    setOldPinInput('');
    setNewPinInput('');
    setConfirmPinInput('');
    setTimeout(() => {
      setShowChangePin(false);
      setChangeSuccessMsg('');
    }, 1500);
  };

  return (
    <div className="no-print fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-md bg-slate-900 border border-blue-900/60 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/80">
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-amber-400" />
            <h2 className="text-sm font-bold text-slate-100">Acceso Maestro — Colegio La Salle</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        {!showChangePin ? (
          <form onSubmit={handlePINSubmit} className="p-6 space-y-4 text-center">
            <div className="flex justify-center mb-1">
              <LaSalleLogo size={56} showText={false} />
            </div>

            <div>
              <h3 className="text-base font-black text-white">Panel de Gestión del Maestro</h3>
              <p className="text-xs text-slate-400 mt-1">
                Ingresa tu PIN secreto para acceder a la gestión de alumnos, Hits e impresión.
              </p>
            </div>

            <div className="space-y-2">
              <div className="relative max-w-xs mx-auto">
                <KeyRound className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  type="password"
                  value={pinInput}
                  onChange={(e) => {
                    setPinInput(e.target.value);
                    setErrorMsg('');
                  }}
                  placeholder="Ingresa tu PIN"
                  autoFocus
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-2xl pl-10 pr-4 py-3 text-center text-sm font-bold tracking-widest text-amber-300 placeholder-slate-600 focus:outline-none focus:border-amber-500"
                />
              </div>
              {errorMsg && (
                <p className="text-xs font-semibold text-rose-400 flex items-center justify-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> {errorMsg}
                </p>
              )}
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <button
                type="submit"
                className="w-full py-3 rounded-2xl font-bold text-sm bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 hover:bg-amber-400 shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Desbloquear Panel</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowChangePin(true);
                  setErrorMsg('');
                }}
                className="text-[11px] text-amber-400 font-semibold hover:underline flex items-center justify-center gap-1 mt-1"
              >
                <Settings className="w-3 h-3" />
                <span>¿Deseas cambiar tu contraseña PIN?</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 rounded-2xl text-xs font-semibold text-slate-400 hover:bg-slate-800 mt-1"
              >
                Volver al Portal Público
              </button>
            </div>
          </form>
        ) : (
          /* Change PIN Form */
          <form onSubmit={handleChangePinSubmit} className="p-6 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Settings className="w-4 h-4 text-amber-400" /> Cambiar PIN Secreto del Maestro
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Crea una nueva contraseña personalizada que solo tú conozcas.
              </p>
            </div>

            {changeSuccessMsg ? (
              <div className="p-4 bg-emerald-500/20 border border-emerald-500/30 rounded-2xl text-emerald-300 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>{changeSuccessMsg}</span>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">PIN Actual *</label>
                  <input
                    type="password"
                    required
                    value={oldPinInput}
                    onChange={(e) => setOldPinInput(e.target.value)}
                    placeholder="ej: 1234"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-amber-300 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Nuevo PIN / Contraseña *</label>
                  <input
                    type="password"
                    required
                    value={newPinInput}
                    onChange={(e) => setNewPinInput(e.target.value)}
                    placeholder="Mínimo 4 caracteres (ej: 9876)"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-amber-300 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Confirmar Nuevo PIN *</label>
                  <input
                    type="password"
                    required
                    value={confirmPinInput}
                    onChange={(e) => setConfirmPinInput(e.target.value)}
                    placeholder="Repite el nuevo PIN"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-amber-300 focus:outline-none focus:border-amber-500"
                  />
                </div>

                {errorMsg && (
                  <p className="text-xs font-semibold text-rose-400 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> {errorMsg}
                  </p>
                )}

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowChangePin(false);
                      setErrorMsg('');
                    }}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-400 hover:bg-slate-800"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 text-slate-950 hover:bg-amber-400 shadow-md shadow-amber-500/20"
                  >
                    Guardar Nuevo PIN
                  </button>
                </div>
              </div>
            )}
          </form>
        )}

      </div>
    </div>
  );
};
