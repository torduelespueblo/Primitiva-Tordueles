import React, { useState } from 'react';
import { Logo } from './Logo';
import {
  ShieldCheck,
  CheckSquare,
  Square,
  FileText,
  FileDown,
  Check,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { OFFICIAL_RULES_SECTIONS, OFFICIAL_RULES_TITLE } from '../data/officialRules';
import { downloadOfficialRulesPdf } from '../services/pdfService';

interface ConformityModalProps {
  isOpen: boolean;
  onAccept: () => void;
  isReviewMode?: boolean;
}

export const ConformityModal: React.FC<ConformityModalProps> = ({
  isOpen,
  onAccept,
  isReviewMode = false,
}) => {
  const [acceptedRules, setAcceptedRules] = useState(isReviewMode);
  const [acceptedData, setAcceptedData] = useState(isReviewMode);
  const [downloadedPdf, setDownloadedPdf] = useState(false);
  const [showFullRules, setShowFullRules] = useState(isReviewMode);

  if (!isOpen) return null;

  const handleDownloadPdf = () => {
    downloadOfficialRulesPdf();
    setDownloadedPdf(true);
    setTimeout(() => setDownloadedPdf(false), 3500);
  };

  const canProceed = isReviewMode || (acceptedRules && acceptedData);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#061626]/85 p-3 sm:p-4 backdrop-blur-md overflow-y-auto">
      <div className="relative my-auto w-full max-w-2xl rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header with step indicator */}
        <div className="bg-[#0A2540] px-5 sm:px-6 py-5 text-white flex items-center gap-4 shrink-0">
          <Logo
            size={80}
            variant="full"
            theme="dark"
            className="w-16 h-16 sm:w-20 sm:h-20 shrink-0"
          />
          <div className="min-w-0">
            <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-extrabold uppercase tracking-wider text-[#FF6B00]">
              <Sparkles className="w-4 h-4 shrink-0" />
              {isReviewMode ? 'Consulta del Reglamento Oficial' : 'Paso 1 de 2 · Bienvenida y Bases'}
            </span>
            <h2 className="text-xl sm:text-2xl font-black font-serif text-white mt-0.5 leading-tight">
              Normas de la Peña Primitiva Tordueles
            </h2>
            <p className="text-sm text-slate-300 mt-0.5">
              {isReviewMode
                ? 'Puedes leer o descargar el reglamento completo cuando lo necesites.'
                : 'Lee el resumen rápido, acepta las bases y después elige si quieres apuntarte o solo mirar.'}
            </p>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-base text-slate-700 leading-relaxed">
          {/* 4 Claves rápidas para entender cómo funciona sin agobios */}
          <div className="rounded-2xl bg-orange-50/90 border border-orange-200 p-4 sm:p-5 space-y-3">
            <h3 className="font-black text-[#0A2540] text-base sm:text-lg">
              Cómo funciona la peña en 4 puntos:
            </h3>
            <ul className="space-y-2 text-sm sm:text-base text-slate-800">
              <li className="flex items-start gap-2.5">
                <span className="font-black text-[#FF6B00] shrink-0">1.</span>
                <span>
                  <strong>Cuota fija:</strong> 1,00 €/semana en ciclos cerrados de 10 jornadas (10,00 € por ciclo), renovando entre las jornadas 7 y 9.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="font-black text-[#FF6B00] shrink-0">2.</span>
                <span>
                  <strong>Sin compromiso inicial:</strong> apuntarte en la lista de espera ya te da antigüedad oficial, pero no te obliga a pagar hasta que haya vacante o salto de bloque y confirmes tu entrada.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="font-black text-[#FF6B00] shrink-0">3.</span>
                <span>
                  <strong>Avisos y plazo de 48h:</strong> si hay bajas o ampliación de la peña, se avisa en el grupo de WhatsApp y de forma individual por orden de lista, con <strong>48 horas</strong> para abonar la cuota.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="font-black text-[#FF6B00] shrink-0">4.</span>
                <span>
                  <strong>Premios transparentes:</strong> los premios de hasta 2.000 € van a la Bolsa Común y los mayores de 2.000 € se reparten por banco entre los titulares activos.
                </span>
              </li>
            </ul>
          </div>

          {/* Toggle para Reglamento completo + Botón PDF */}
          <div className="rounded-2xl border border-slate-200 bg-[#F4F6F9] overflow-hidden">
            <div className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setShowFullRules(prev => !prev)}
                className="inline-flex items-center justify-between sm:justify-start gap-2 text-left font-extrabold text-[#0A2540] hover:text-[#FF6B00] text-sm sm:text-base cursor-pointer transition"
              >
                <span className="inline-flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[#FF6B00] shrink-0" />
                  <span>{showFullRules ? 'Ocultar reglamento completo' : 'Leer reglamento completo (Artículos 1 al 5)'}</span>
                </span>
                {showFullRules ? (
                  <ChevronUp className="w-5 h-5 shrink-0" />
                ) : (
                  <ChevronDown className="w-5 h-5 shrink-0" />
                )}
              </button>

              <button
                type="button"
                onClick={handleDownloadPdf}
                className="inline-flex items-center justify-center gap-2 px-4 min-h-[40px] rounded-xl border border-[#0A2540] bg-white text-[#0A2540] hover:bg-slate-100 text-sm font-bold transition cursor-pointer shrink-0"
              >
                {downloadedPdf ? (
                  <Check className="w-4 h-4 text-emerald-600" />
                ) : (
                  <FileDown className="w-4 h-4 text-[#FF6B00]" />
                )}
                <span>{downloadedPdf ? '¡PDF Descargado!' : 'Descargar PDF'}</span>
              </button>
            </div>

            {showFullRules && (
              <div className="px-4 sm:px-5 pb-5 pt-2 border-t border-slate-200 space-y-5 text-sm sm:text-base text-slate-700 bg-white">
                <p className="font-black text-[#0A2540] pt-1">{OFFICIAL_RULES_TITLE}</p>
                {OFFICIAL_RULES_SECTIONS.map(section => (
                  <div
                    key={section.articleNumber}
                    className="space-y-2.5 border-b border-slate-200 last:border-b-0 pb-4 last:pb-0"
                  >
                    <h4 className="font-black text-[#0A2540] text-base sm:text-lg">
                      {section.articleNumber}. {section.title}
                    </h4>
                    {section.paragraphs.map((p, idx) => (
                      <div key={idx} className="space-y-2">
                        <p>
                          {p.code && (
                            <strong className="text-[#0A2540]">
                              {p.code} {p.heading}{' '}
                            </strong>
                          )}
                          {p.text}
                        </p>
                        {p.bullets && (
                          <ul className="list-disc pl-5 space-y-1 text-sm sm:text-base">
                            {p.bullets.map((b, bIdx) => (
                              <li key={bIdx}>{b}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Interactive Checkboxes */}
          <div className="space-y-3">
            <label
              onClick={() => setAcceptedRules(!acceptedRules)}
              className={`flex items-start gap-3.5 p-4 rounded-2xl border-2 cursor-pointer select-none transition ${
                acceptedRules
                  ? 'border-emerald-500 bg-emerald-50/50'
                  : 'border-slate-300 hover:bg-slate-50'
              }`}
            >
              <div className="mt-0.5 shrink-0">
                {acceptedRules ? (
                  <CheckSquare className="w-6 h-6 text-emerald-600" />
                ) : (
                  <Square className="w-6 h-6 text-slate-400" />
                )}
              </div>
              <span className="text-sm sm:text-base font-semibold text-[#0A2540] leading-snug">
                He leído el resumen (o el reglamento completo) y <strong>acepto las bases de la Peña Primitiva Tordueles</strong>.
              </span>
            </label>

            <label
              onClick={() => setAcceptedData(!acceptedData)}
              className={`flex items-start gap-3.5 p-4 rounded-2xl border-2 cursor-pointer select-none transition ${
                acceptedData
                  ? 'border-emerald-500 bg-emerald-50/50'
                  : 'border-slate-300 hover:bg-slate-50'
              }`}
            >
              <div className="mt-0.5 shrink-0">
                {acceptedData ? (
                  <CheckSquare className="w-6 h-6 text-emerald-600" />
                ) : (
                  <Square className="w-6 h-6 text-slate-400" />
                )}
              </div>
              <span className="text-sm sm:text-base font-semibold text-[#0A2540] leading-snug">
                Acepto la <strong>Política de Privacidad (RGPD)</strong> para gestionar avisos y premios en caso de participar.
              </span>
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-5 sm:px-6 py-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <p className="text-xs sm:text-sm text-slate-600 text-center sm:text-left">
            {isReviewMode
              ? 'Tu conformidad ya queda guardada en este dispositivo.'
              : 'Siguiente paso: elegir si quieres apuntarte, entrar con tu DNI o solo mirar.'}
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
            <span>{isReviewMode ? 'Confirmar y Volver' : 'Aceptar bases y continuar'}</span>
            {!isReviewMode && <ArrowRight className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </div>
  );
};

