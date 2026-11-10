import React from 'react';
import { Logo } from './Logo';
import { ExternalLink, ShieldCheck, Heart } from 'lucide-react';

interface FooterProps {
  onOpenRules: () => void;
  onOpenConformity: () => void;
  googleFormUrl: string;
}

export const Footer: React.FC<FooterProps> = ({
  onOpenRules,
  onOpenConformity,
  googleFormUrl,
}) => {
  return (
    <footer className="mt-16 bg-[#091829] text-slate-400 text-xs border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3 text-center md:text-left">
            <div className="bg-white/10 p-1.5 rounded-xl shrink-0">
              <Logo size={42} variant="full" />
            </div>
            <div>
              <span className="font-serif font-bold text-white text-sm block">
                Peña La Primitiva • Tordueles
              </span>
              <p className="text-[11px] text-slate-400">
                Provincia de Burgos • 1€ Semanal • Bloques Indivisibles de 10 Jornadas
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-xs">
            <button
              onClick={onOpenRules}
              className="text-slate-300 hover:text-white underline cursor-pointer"
            >
              Reglamento Oficial
            </button>
            <button
              onClick={onOpenConformity}
              className="text-slate-300 hover:text-white underline cursor-pointer flex items-center gap-1"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Declaración de Conformidad</span>
            </button>
            <a
              href={googleFormUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-300 hover:text-white underline inline-flex items-center gap-1"
            >
              <span>Formulario de Inscripción</span>
              <ExternalLink className="w-3 h-3 text-sky-400" />
            </a>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500">
          <p>
            WebApp PWA gratuita y escalable desarrollada para la Peña de Lotería de Tordueles.
          </p>
          <p className="flex items-center gap-1">
            Imparcialidad garantizada por terminal SELAE & Google Workspace
          </p>
        </div>
      </div>
    </footer>
  );
};
