import React, { useState, useEffect } from 'react';
import { Lock, X, AlertCircle, Loader2 } from 'lucide-react';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  correctPin: string;
  googleAppsScriptUrl?: string;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  correctPin,
  googleAppsScriptUrl,
}) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPin('');
      setError(false);
      setIsVerifying(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const enteredPin = pin.trim();
    if (!enteredPin) {
      setError(true);
      return;
    }

    if (enteredPin === correctPin) {
      setError(false);
      onSuccess();
      onClose();
      return;
    }

    // Si hay WebApp de Apps Script configurada, validar también contra ADMIN_PASSWORD en Propiedades del Script
    if (googleAppsScriptUrl && googleAppsScriptUrl.trim().length > 0) {
      try {
        setIsVerifying(true);
        const res = await fetch(googleAppsScriptUrl.trim(), {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({ action: 'validarAdmin', password: enteredPin }),
        });
        const data = await res.json();
        if (data && data.success === true) {
          setError(false);
          setIsVerifying(false);
          onSuccess();
          onClose();
          return;
        }
      } catch {
        // Si la red falla o la versión desplegada aún no expone validarAdmin, mostrar error normal
      } finally {
        setIsVerifying(false);
      }
    }

    setError(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs">
      <div className="w-full max-w-sm rounded-3xl bg-white shadow-2xl overflow-hidden p-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-orange-50 text-[#FF6B00]">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="font-extrabold text-lg text-[#0A2540]">Panel de Administrador</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-500 hover:bg-slate-100 cursor-pointer"
            aria-label="Cerrar acceso administrador"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <p className="text-base text-slate-600 leading-relaxed">
            Introduce el código PIN de administración configurado en la peña para acceder a los ajustes y edición de socios.
          </p>

          <div>
            <label className="block text-sm font-bold text-[#0A2540] mb-1.5">
              Código PIN de Acceso
            </label>
            <input
              type="password"
              inputMode="numeric"
              maxLength={24}
              value={pin}
              autoFocus
              onChange={e => {
                setPin(e.target.value);
                setError(false);
              }}
              placeholder="••••••"
              className="w-full rounded-xl border-2 border-slate-300 px-3 min-h-[52px] text-center text-2xl font-mono tracking-widest focus:border-[#0A2540] outline-hidden"
            />
            {error && (
              <p className="mt-2 text-sm text-rose-600 font-semibold flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0" /> PIN de administrador incorrecto.
              </p>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 min-h-[48px] rounded-xl border border-slate-300 text-base font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isVerifying}
              className="flex-1 min-h-[48px] rounded-xl bg-[#0A2540] hover:bg-[#13375B] disabled:opacity-60 text-base font-bold text-white shadow-xs cursor-pointer inline-flex items-center justify-center gap-2"
            >
              {isVerifying ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verificando...</span>
                </>
              ) : (
                'Desbloquear'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
