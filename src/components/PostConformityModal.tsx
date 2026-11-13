import React from 'react';
import { Logo } from './Logo';
import { UserPlus, Clock, Info, ArrowRight, ShieldCheck } from 'lucide-react';

interface PostConformityModalProps {
  isOpen: boolean;
  onGoToRegistration: () => void;
  onLater: () => void;
}

export const PostConformityModal: React.FC<PostConformityModalProps> = ({
  isOpen,
  onGoToRegistration,
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
              <ShieldCheck className="w-4 h-4" /> Reglamento Aceptado
            </span>
            <h2 className="text-xl sm:text-2xl font-black font-serif text-white mt-0.5 leading-tight">
              ¿Deseas registrarte ahora?
            </h2>
            <p className="text-sm text-slate-300 mt-0.5">
              Peña La Primitiva · Tordueles (Burgos)
            </p>
          </div>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
          <div className="rounded-2xl bg-amber-50 border-2 border-amber-300 p-4 flex gap-3.5 text-[#0A2540]">
            <Info className="w-6 h-6 text-[#FF6B00] shrink-0 mt-0.5" />
            <div className="text-sm sm:text-base leading-relaxed space-y-1.5">
              <p className="font-extrabold text-[#0A2540]">
                Sin compromiso de participación inmediata
              </p>
              <p className="text-slate-700">
                El registro <strong>NO implica la participación obligatoria</strong> hasta que se decida la lista definitiva, pero <strong>ya te otorga antigüedad oficial en la lista de espera</strong> por si deseas esperar antes de decidir participar desde el comienzo.
              </p>
            </div>
          </div>

          <div className="space-y-3.5">
            {/* Botón 1: Menú de Registro */}
            <button
              type="button"
              onClick={onGoToRegistration}
              className="w-full text-left rounded-2xl bg-[#FF6B00] hover:bg-[#E55E00] active:scale-[0.99] text-white p-4 sm:p-5 shadow-lg transition flex items-center justify-between gap-4 cursor-pointer min-h-[68px]"
            >
              <div className="flex items-start gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center shrink-0 mt-0.5">
                  <UserPlus className="w-6 h-6 text-white" />
                </div>
                <div>
                  <span className="block text-base sm:text-lg font-black leading-snug">
                    Ir al Menú de Registro
                  </span>
                  <span className="block text-sm text-orange-50 mt-0.5 leading-snug">
                    Accede con tu DNI o regístrate ahora para asegurar tu antigüedad en la lista de espera.
                  </span>
                </div>
              </div>
              <ArrowRight className="w-6 h-6 shrink-0" />
            </button>

            {/* Botón 2: Hacerlo más adelante con aviso integrado */}
            <button
              type="button"
              onClick={onLater}
              className="w-full text-left rounded-2xl bg-[#F4F6F9] hover:bg-slate-200/80 active:scale-[0.99] border-2 border-slate-300 text-[#0A2540] p-4 sm:p-5 transition flex items-start gap-3.5 cursor-pointer min-h-[68px]"
            >
              <div className="w-11 h-11 rounded-xl bg-[#0A2540]/10 flex items-center justify-center shrink-0 mt-0.5">
                <Clock className="w-6 h-6 text-[#0A2540]" />
              </div>
              <div className="space-y-1">
                <span className="block text-base sm:text-lg font-black text-[#0A2540] leading-snug">
                  Hacerlo más adelante
                </span>
                <span className="block text-xs sm:text-sm text-slate-700 leading-relaxed">
                  <strong>Aviso:</strong> registrarse no implica participación obligatoria hasta decidir la lista definitiva, pero te da ya antigüedad en la lista de espera si prefieres esperar antes de participar desde el comienzo.
                </span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
