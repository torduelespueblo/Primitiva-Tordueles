import React from 'react';
import { Logo } from './Logo';
import { ExternalLink, ShieldCheck, UserPlus } from 'lucide-react';

interface FooterProps {
  onOpenRules: () => void;
  onOpenConformity: () => void;
  onOpenRegistration: () => void;
  googleFormUrl: string;
}

export const Footer: React.FC<FooterProps> = ({
  onOpenRules,
  onOpenConformity,
  onOpenRegistration,
  googleFormUrl,
}) => {
  const hasExternalForm = Boolean(googleFormUrl && googleFormUrl.startsWith('http'));

  return (
    <footer className="mt-16 bg-[#071A2E] text-slate-300 text-base border-t border-slate-800 pb-24 lg:pb-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
            <Logo
              size={88}
              variant="full"
              theme="dark"
              className="w-22 h-22 sm:w-24 sm:h-24 shrink-0"
            />
            <div>
              <span className="font-serif font-black text-white text-xl sm:text-2xl block">
                Peña La Primitiva · Tordueles
              </span>
              <p className="text-base text-slate-300 mt-1">
                Provincia de Burgos · 1 € Semanal · Bloques de 10 Jornadas
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-5 text-base font-semibold">
            <button
              type="button"
              onClick={onOpenRules}
              className="text-white hover:text-[#FF6B00] underline underline-offset-4 min-h-[44px] px-2 cursor-pointer transition"
            >
              Reglamento Oficial
            </button>
            <button
              type="button"
              onClick={onOpenConformity}
              className="text-white hover:text-[#FF6B00] underline underline-offset-4 min-h-[44px] px-2 cursor-pointer flex items-center gap-2 transition"
            >
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>Declaración de Conformidad</span>
            </button>
            {hasExternalForm ? (
              <a
                href={googleFormUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white hover:text-[#FF6B00] underline underline-offset-4 min-h-[44px] px-2 inline-flex items-center gap-2 transition"
              >
                <span>Formulario de Inscripción</span>
                <ExternalLink className="w-4 h-4 text-[#FF6B00] shrink-0" />
              </a>
            ) : (
              <button
                type="button"
                onClick={onOpenRegistration}
                className="text-white hover:text-[#FF6B00] underline underline-offset-4 min-h-[44px] px-2 inline-flex items-center gap-2 cursor-pointer transition"
              >
                <UserPlus className="w-4 h-4 text-[#FF6B00] shrink-0" />
                <span>Formulario de Inscripción</span>
              </button>
            )}
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-800/90 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm sm:text-base text-slate-400 text-center sm:text-left">
          <p>
            WebApp PWA oficial desarrollada para la Peña de Lotería de Tordueles.
          </p>
          <p>
            Imparcialidad garantizada por terminal SELAE &amp; Google Workspace
          </p>
        </div>
      </div>
    </footer>
  );
};
