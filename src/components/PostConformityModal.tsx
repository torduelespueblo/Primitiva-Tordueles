import React from 'react';
import { Logo } from './Logo';
import { UserPlus, Eye, ArrowRight, ShieldCheck, KeyRound } from 'lucide-react';

interface PostConformityModalProps {
  isOpen: boolean;
  onGoToRegister: () => void;
  onGoToAccess: () => void;
  onLater: () => void;
}

export const PostConformityModal: React.FC<PostConformityModalProps> = ({
  isOpen,
  onGoToRegister,
  onGoToAccess,
  onLater,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#061626]/85 p-3 sm:p-4 backdrop-blur-md overflow-y-auto">
      <div className="relative my-auto w-full max-w-xl rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-[#0A2540] px-5 sm:px-6 py-5 text-white flex items-center gap-4 shrink-0">
          <Logo
            size={76}
            variant="full"
            theme="dark"
            className="w-16 h-16 sm:w-20 sm:h-20 shrink-0"
          />
          <div>
            <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-extrabold uppercase tracking-wider text-emerald-400">
              <ShieldCheck className="w-4 h-4" /> Paso 2 de 2 · ¡Bases aceptadas!
            </span>
            <h2 className="text-xl sm:text-2xl font-black font-serif text-white mt-0.5 leading-tight">
              ¿Qué quieres hacer ahora?
            </h2>
            <p className="text-sm text-slate-300 mt-0.5">
              Elige tu opción; siempre podrás apuntarte más adelante desde la App.
            </p>
          </div>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-3.5">
          {/* Opción 1: Apuntarme ahora (Nuevo) */}
          <button
            type="button"
            onClick={onGoToRegister}
            className="w-full text-left rounded-2xl bg-[#FF6B00] hover:bg-[#E55E00] active:scale-[0.99] text-white p-4 sm:p-5 shadow-lg transition flex items-center justify-between gap-4 cursor-pointer min-h-[72px]"
          >
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center shrink-0 mt-0.5">
                <UserPlus className="w-6 h-6 text-white" />
              </div>
              <div>
                <span className="block text-base sm:text-lg font-black leading-snug">
                  1. Quiero apuntarme ahora
                </span>
                <span className="block text-sm text-orange-50 mt-0.5 leading-snug">
                  Solo nombre y móvil (20 segundos). No te obliga a jugar todavía, pero ya guarda tu antigüedad oficial en la lista de espera.
                </span>
              </div>
            </div>
            <ArrowRight className="w-6 h-6 shrink-0" />
          </button>

          {/* Opción 2: Ya soy socio (DNI) */}
          <button
            type="button"
            onClick={onGoToAccess}
            className="w-full text-left rounded-2xl bg-[#0A2540] hover:bg-[#13375B] active:scale-[0.99] text-white p-4 sm:p-5 shadow-md transition flex items-center justify-between gap-4 cursor-pointer min-h-[72px]"
          >
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center shrink-0 mt-0.5">
                <KeyRound className="w-6 h-6 text-[#FF6B00]" />
              </div>
              <div>
                <span className="block text-base sm:text-lg font-black leading-snug">
                  2. Ya estoy apuntado (Entrar con DNI)
                </span>
                <span className="block text-sm text-slate-200 mt-0.5 leading-snug">
                  Vincula tu ficha de titular o suplente en este dispositivo y activa las notificaciones de boletos y avisos.
                </span>
              </div>
            </div>
            <ArrowRight className="w-6 h-6 text-[#FF6B00] shrink-0" />
          </button>

          {/* Opción 3: Solo mirar por ahora */}
          <button
            type="button"
            onClick={onLater}
            className="w-full text-left rounded-2xl bg-[#F4F6F9] hover:bg-slate-200/80 active:scale-[0.99] border-2 border-slate-300 text-[#0A2540] p-4 sm:p-5 transition flex items-center justify-between gap-4 cursor-pointer min-h-[72px]"
          >
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-[#0A2540]/10 flex items-center justify-center shrink-0 mt-0.5">
                <Eye className="w-6 h-6 text-[#0A2540]" />
              </div>
              <div>
                <span className="block text-base sm:text-lg font-black text-[#0A2540] leading-snug">
                  3. Solo quiero mirar por ahora
                </span>
                <span className="block text-xs sm:text-sm text-slate-700 mt-0.5 leading-snug">
                  Entra a ver los boletos, el bote y la lista pública. Tendrás un botón visible arriba por si decides apuntarte después.
                </span>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-slate-500 shrink-0" />
          </button>
        </div>
      </div>
    </div>
  );
};

