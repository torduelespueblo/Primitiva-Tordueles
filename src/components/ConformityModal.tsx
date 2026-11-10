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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#071320]/80 p-3 sm:p-4 backdrop-blur-md overflow-y-auto">
      <div className="relative my-auto w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-[#0d253f] px-6 py-5 text-white flex items-center gap-4 shrink-0 border-b border-blue-950">
          <div className="rounded-xl bg-white p-1.5 shadow-sm shrink-0">
            <Logo size={48} variant="full" />
          </div>
          <div>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-sky-300">
              <Lock className="w-3 h-3" /> Condición de Acceso Obligatoria
            </span>
            <h2 className="text-lg sm:text-xl font-bold font-serif text-white">
              Declaración de Conformidad Oficial
            </h2>
            <p className="text-xs text-slate-300">
              Peña de Lotería La Primitiva • Tordueles (Burgos)
            </p>
          </div>
        </div>

        {/* Scrollable Rules Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs sm:text-sm text-slate-700 leading-relaxed">
          <div className="rounded-xl bg-amber-50 border border-amber-200 p-3.5 flex gap-3 text-amber-900">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs font-medium">
              Por imperativo del reglamento y normativa de protección de datos, el acceso a las cuentas financieras, boletos sellados y datos de los miembros está bloqueado hasta la firma de esta declaración.
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="font-bold text-[#0d253f] text-sm sm:text-base flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-800" />
              Bases y Reglamento Interno Aceptados:
            </h3>

            <div className="space-y-2.5 text-xs text-slate-600 pl-1 border-l-2 border-slate-200">
              <div className="pl-3">
                <strong className="text-slate-900">1. Financiación y Ciclos:</strong> La cuota es de 1€ semanal por participante, abonada en bloques cerrados e indivisibles de 10 jornadas (10€). La renovación debe abonarse obligatoriamente entre la jornada 7 y la 9 del ciclo vigente.
              </div>
              <div className="pl-3">
                <strong className="text-slate-900">2. Apuestas Múltiples Adaptables:</strong> El importe de la apuesta se ajusta al número de socios con pago completado (ej. múltiple de 5 números por 44€ para 44 socios; múltiple de 9 para 84 socios). Las combinaciones son siempre automáticas y aleatorias por terminal de Loterías y Apuestas del Estado.
              </div>
              <div className="pl-3">
                <strong className="text-slate-900">3. Bajas y Lista de Espera:</strong> Quien no abone la renovación antes de terminar la jornada 9, jugará la jornada 10 como última y será excluido definitivamente perdiendo antigüedad y número de socio. El primer suplente (por estricto timestamp de Google Form) dispondrá de 24 horas exactas para realizar el ingreso.
              </div>
              <div className="pl-3">
                <strong className="text-slate-900">4. Fallecimiento y No Heredabilidad:</strong> La plaza en la peña no se hereda a familiares. Al finalizar el ciclo abonado pasará al primer suplente. La parte proporcional de cualquier premio obtenido en el ciclo en vigor se liquidará a los herederos legales.
              </div>
              <div className="pl-3">
                <strong className="text-slate-900">5. Reparto de Premios Menores vs Mayores:</strong>
                <ul className="list-disc pl-4 mt-1 space-y-1">
                  <li><strong>Premios Menores (hasta 2.000 €):</strong> Se acumulan íntegramente en el Fondo Común (Bolsa de Premios) separado del presupuesto de apuestas, sin derecho a devolución individual en caso de baja voluntaria o forzosa.</li>
                  <li><strong>Premios Mayores (superiores a 2.000 €):</strong> Se cobrarán obligatoriamente a través de entidad bancaria acreditando el DNI de todos los miembros activos. Se aplicará la retención legal tributaria del 20% sobre el exceso de 40.000 € y se transferirá la cuota neta al IBAN individual de cada socio.</li>
                </ul>
              </div>
            </div>
          </div>

          {/* RGPD / Data Privacy */}
          <div className="rounded-xl bg-slate-50 border border-slate-200 p-3.5 text-xs text-slate-600">
            <strong className="text-slate-800">Protección de Datos Personales (RGPD):</strong> Autorizo el tratamiento de mi nombre, teléfono, correo y DNI con el exclusivo fin de la gestión operativa de la peña, publicación de listados internos y presentación ante entidades financieras para el cobro de premios mayores.
          </div>

          {/* Interactive Checkboxes */}
          <div className="space-y-3 pt-2">
            <label
              onClick={() => setAcceptedRules(!acceptedRules)}
              className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer select-none transition"
            >
              <div className="mt-0.5 text-blue-900 shrink-0">
                {acceptedRules ? (
                  <CheckSquare className="w-5 h-5 text-emerald-600" />
                ) : (
                  <Square className="w-5 h-5 text-slate-400" />
                )}
              </div>
              <span className="text-xs sm:text-sm font-medium text-slate-800">
                He leído, comprendo y <strong>acepto íntegramente el Reglamento Oficial</strong> de la Peña La Primitiva Tordueles (ciclos de 10 jornadas, normas de renovación 7-9, suplentes 24h y reparto de premios).
              </span>
            </label>

            <label
              onClick={() => setAcceptedData(!acceptedData)}
              className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer select-none transition"
            >
              <div className="mt-0.5 text-blue-900 shrink-0">
                {acceptedData ? (
                  <CheckSquare className="w-5 h-5 text-emerald-600" />
                ) : (
                  <Square className="w-5 h-5 text-slate-400" />
                )}
              </div>
              <span className="text-xs sm:text-sm font-medium text-slate-800">
                Doy mi <strong>consentimiento expreso</strong> para el tratamiento de mis datos de contacto e identificación fiscal con los fines exclusivos de la peña.
              </span>
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <p className="text-[11px] text-slate-500 text-center sm:text-left">
            Tu aceptación quedará registrada en este dispositivo para futuras visitas.
          </p>
          <button
            disabled={!canProceed}
            onClick={onAccept}
            className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold shadow-md transition ${
              canProceed
                ? 'bg-[#0d253f] hover:bg-[#153a61] text-white cursor-pointer active:scale-95'
                : 'bg-slate-300 text-slate-500 cursor-not-allowed opacity-70'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Firmar y Acceder a la WebApp</span>
          </button>
        </div>
      </div>
    </div>
  );
};
