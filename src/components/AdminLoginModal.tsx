import React, { useState } from 'react';
import { Lock, KeyRound, X, AlertCircle } from 'lucide-react';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  correctPin: string;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  correctPin,
}) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === correctPin || pin === '1234') {
      setError(false);
      onSuccess();
      onClose();
    } else {
      setError(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs">
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl overflow-hidden p-6 animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-50 text-amber-700">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-[#0d253f]">Panel de Administrador</h3>
          </div>
          <button onClick={onClose} className="rounded-full p-1 text-slate-400 hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <p className="text-xs text-slate-600">
            Introduce el código PIN de gestión de la peña para acceder a los interruptores y edición de socios.
          </p>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Código PIN de Acceso:
            </label>
            <input
              type="password"
              maxLength={8}
              value={pin}
              autoFocus
              onChange={e => {
                setPin(e.target.value);
                setError(false);
              }}
              placeholder="••••"
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-center text-xl font-mono tracking-widest focus:ring-2 focus:ring-amber-500 outline-hidden"
            />
            {error && (
              <p className="mt-1 text-xs text-rose-600 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> PIN incorrecto.
              </p>
            )}
          </div>

          <div className="rounded-xl bg-slate-50 border border-slate-200 p-2.5 text-[11px] text-slate-500 text-center">
            PIN por defecto de demostración: <strong className="text-slate-800">1234</strong>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-2 rounded-xl bg-[#0d253f] hover:bg-[#153a61] text-xs font-bold text-white shadow-xs"
            >
              Desbloquear
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
