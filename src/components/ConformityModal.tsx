import React, { useState } from 'react';
import { Logo } from './Logo';
import { ShieldCheck, AlertCircle, CheckSquare, Square, FileText, Lock } from 'lucide-react';

interface ConformityModalProps {
  isOpen: boolean;
  onAccept: () => void;
}

export const ConformityModal: React.FC<ConformityModalProps> = ({ isOpen, onAccept }) => {
  const [acceptedRules, setAcceptedRules] = useState(false);
  const [acceptedData, setAcceptedData] = useState(false);

  if (!isOpen) return null;

  const canProceed = acceptedRules && acceptedData;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#061626]/85 p-3 sm:p-4 backdrop-blur-md overflow-y-auto">
      <div className="relative my-auto w-full max-w-2xl rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header with large borderless dark-theme Logo */}
        <div className="bg-[#0A2540] px-5 sm:px-6 py-5 text-white flex items-center gap-4 shrink-0">
          <Logo
            size={80}
            variant="full"
            theme="dark"
            className="w-18 h-18 sm:w-20 sm:h-20 shrink-0"
          />
          <div>
            <span className="inline-flex items-center gap-1.5 text-sm font-extrabold uppercase tracking-wider text-[#FF6B00]">
              <Lock className="w-4 h-4" /> Condición de Acceso Obligatoria
            </span>
            <h2 className="text-xl sm:text-2xl font-black font-serif text-white mt-0.5">
              Declaración de Conformidad
            </h2>
            <p className="text-sm sm:text-base text-slate-300">
              Peña La Primitiva · Tordueles (Burgos)
            </p>
          </div>
        </div>

        {/* Scrollable Rules Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-base text-slate-700 leading-relaxed">
          <div className="rounded-2xl bg-orange-50 border border-orange-200 p-4 flex gap-3 text-[#0A2540]">
            <AlertCircle className="w-6 h-6 text-[#FF6B00] shrink-0 mt-0.5" />
            <p className="text-base font-medium leading-relaxed">
              Para consultar las cuentas, boletos sellados y datos de los miembros es obligatorio aceptar previamente las bases de la peña.
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="font-black text-[#0A2540] text-lg sm:text-xl flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#FF6B00] shrink-0" />
              Bases y Reglamento Interno:
            </h3>

            <div className="space-y-3 text-base text-slate-700 pl-2">
              <div>
                <strong className="text-[#0A2540]">1. Financiación y Ciclos:</strong> Cuota de 1 €/semana en bloques indivisibles de 10 jornadas (10 €). Renovación obligatoria entre las jornadas 7 y 9.
              </div>
              <div>
                <strong className="text-[#0A2540]">2. Apuestas Múltiples:</strong> El tamaño de la apuesta se ajusta al número de socios pagados (ej. múltiple de 5 por 44 € para 44 socios). Combinaciones siempre aleatorias por terminal SELAE.
              </div>
              <div>
                <strong className="text-[#0A2540]">3. Bajas y Lista de Espera:</strong> El impago en J9 supone exclusión tras la jornada 10. El primer suplente dispone de 24 horas exactas para ingresar.
              </div>
              <div>
                <strong className="text-[#0A2540]">4. Fallecimiento:</strong> La plaza no se hereda; al finalizar el ciclo pasa al primer suplente y los premios pendientes se liquidan a herederos legales.
              </div>
              <div>
                <strong className="text-[#0A2540]">5. Premios Menores vs Mayores:</strong> Premios &le; 2.000 € al Fondo Común. Premios &gt; 2.000 € en banco con DNI de todos los miembros, retención legal 20% sobre exceso de 40.000 € y transferencia a IBAN individual.
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-[#F4F6F9] border border-slate-200 p-4 text-base text-slate-700">
            <strong className="text-[#0A2540]">Protección de Datos (RGPD):</strong> Autorizo el tratamiento de mis datos exclusivamente para la gestión operativa de la peña y tramitación bancaria de premios.
          </div>

          {/* Interactive Checkboxes */}
          <div className="space-y-3 pt-1">
            <label
              onClick={() => setAcceptedRules(!acceptedRules)}
              className="flex items-start gap-3.5 p-4 rounded-2xl border border-slate-300 hover:bg-slate-50 cursor-pointer select-none transition"
            >
              <div className="mt-0.5 shrink-0">
                {acceptedRules ? (
                  <CheckSquare className="w-6 h-6 text-emerald-600" />
                ) : (
                  <Square className="w-6 h-6 text-slate-400" />
                )}
              </div>
              <span className="text-base font-semibold text-[#0A2540] leading-snug">
                He leído y <strong>acepto íntegramente el Reglamento Oficial</strong> de la Peña La Primitiva Tordueles.
              </span>
            </label>

            <label
              onClick={() => setAcceptedData(!acceptedData)}
              className="flex items-start gap-3.5 p-4 rounded-2xl border border-slate-300 hover:bg-slate-50 cursor-pointer select-none transition"
            >
              <div className="mt-0.5 shrink-0">
                {acceptedData ? (
                  <CheckSquare className="w-6 h-6 text-emerald-600" />
                ) : (
                  <Square className="w-6 h-6 text-slate-400" />
                )}
              </div>
              <span className="text-base font-semibold text-[#0A2540] leading-snug">
                Doy mi <strong>consentimiento expreso</strong> para el tratamiento de datos con los fines exclusivos de la peña.
              </span>
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <p className="text-sm text-slate-600 text-center sm:text-left">
            Tu aceptación se guardará en este dispositivo.
          </p>
          <button
            type="button"
            disabled={!canProceed}
            onClick={onAccept}
            className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 min-h-[50px] rounded-xl text-base font-bold shadow-md transition ${
              canProceed
                ? 'bg-[#FF6B00] hover:bg-[#E55E00] text-white cursor-pointer active:scale-95'
                : 'bg-slate-300 text-slate-500 cursor-not-allowed opacity-70'
            }`}
          >
            <ShieldCheck className="w-5 h-5" />
            <span>Firmar y Acceder</span>
          </button>
        </div>
      </div>
    </div>
  );
};
