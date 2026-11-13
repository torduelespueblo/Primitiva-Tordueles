import React from 'react';
import { Logo } from './Logo';
import {
  DollarSign,
  Shuffle,
  Clock,
  UserX,
  Trophy,
  Printer
} from 'lucide-react';
import { MultipleBetsGuide } from './MultipleBetsGuide';
import { OFFICIAL_RULES_SECTIONS, OFFICIAL_RULES_TITLE } from '../data/officialRules';

const SECTION_ICONS = [DollarSign, Shuffle, Clock, UserX, Trophy];

export const OfficialRules: React.FC = () => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header with large borderless Logo */}
      <div className="rounded-3xl bg-[#0A2540] p-6 sm:p-8 text-white shadow-md flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
          <Logo
            size={92}
            variant="full"
            theme="dark"
            className="w-22 h-22 sm:w-24 sm:h-24 shrink-0"
          />
          <div>
            <span className="text-sm uppercase font-extrabold tracking-widest text-[#FF6B00] block">
              Documento Oficial Vinculante
            </span>
            <h1 className="text-2xl sm:text-3xl font-black font-serif text-white mt-1">
              {OFFICIAL_RULES_TITLE}
            </h1>
            <p className="text-base text-slate-300 mt-1">
              Peña de Lotería La Primitiva · Tordueles (Burgos)
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handlePrint}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-5 min-h-[48px] rounded-xl bg-[#FF6B00] hover:bg-[#E55E00] text-base font-bold text-white transition cursor-pointer shrink-0"
        >
          <Printer className="w-5 h-5" />
          <span>Imprimir / Guardar PDF</span>
        </button>
      </div>

      {/* Verbatim Complete Official Rules */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-8 text-slate-800 leading-relaxed text-base">
        {OFFICIAL_RULES_SECTIONS.map((section, idx) => {
          const Icon = SECTION_ICONS[idx] || Trophy;
          const isLast = idx === OFFICIAL_RULES_SECTIONS.length - 1;

          return (
            <section
              key={section.articleNumber}
              className={`space-y-4 ${!isLast ? 'border-b border-slate-200 pb-6' : ''}`}
            >
              <div className="flex items-center gap-3 text-[#0A2540]">
                <Icon className="w-6 h-6 text-[#FF6B00] shrink-0" />
                <h2 className="text-xl sm:text-2xl font-black font-serif">
                  {section.articleNumber}. {section.title}
                </h2>
              </div>

              <div className="space-y-4 text-base sm:text-lg text-slate-700 leading-relaxed">
                {section.paragraphs.map((p, pIdx) => (
                  <div key={pIdx} className="space-y-2.5">
                    <p>
                      {p.code && (
                        <strong className="text-[#0A2540]">
                          {p.code} {p.heading}{' '}
                        </strong>
                      )}
                      {p.text}
                    </p>
                    {p.bullets && (
                      <div className="bg-[#F4F6F9] p-4 sm:p-5 rounded-2xl border border-slate-200 text-base">
                        <ul className="list-disc pl-5 space-y-2 text-slate-800">
                          {p.bullets.map((b, bIdx) => (
                            <li key={bIdx}>{b}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          );
        })}

        {/* ANEXO OFICIAL */}
        <section className="pt-6 border-t border-slate-200">
          <MultipleBetsGuide />
        </section>
      </div>
    </div>
  );
};
