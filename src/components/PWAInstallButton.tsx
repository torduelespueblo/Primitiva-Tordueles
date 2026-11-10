import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Smartphone, X, Check } from 'lucide-react';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
        <Check className="w-3.5 h-3.5 text-emerald-600" />
        PWA Instalada
      </span>
    );
  }

  if (isInstallable) {
    return (
      <button
        onClick={install}
        className="inline-flex items-center gap-1.5 rounded-lg bg-[#0d253f] hover:bg-[#153a61] px-3 py-1.5 text-xs sm:text-sm font-semibold text-white shadow-sm transition active:scale-95"
        title="Instalar App en tu pantalla de inicio"
      >
        <Download className="w-4 h-4 text-sky-400" />
        <span>Instalar WebApp</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white/90 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
          title="Instalar en iPhone / iPad"
        >
          <Smartphone className="w-3.5 h-3.5 text-blue-600" />
          <span>Instalar en iOS</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-base font-bold text-[#0d253f]">
                  Instalar en iPhone o iPad
                </h3>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="rounded-full p-1 text-slate-400 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="mt-4 space-y-3 text-xs sm:text-sm text-slate-600">
                <div className="flex items-start gap-2.5">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-bold text-xs">1</span>
                  <p>Abre esta página en el navegador <strong>Safari</strong>.</p>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-bold text-xs">2</span>
                  <p>Toca el botón <strong>Compartir</strong> (icono de cuadrado con flecha hacia arriba) en la barra inferior.</p>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-bold text-xs">3</span>
                  <p>Desplaza hacia abajo y selecciona <strong>Añadir a la pantalla de inicio</strong>.</p>
                </div>
              </div>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full rounded-xl bg-[#0d253f] py-2.5 text-xs font-semibold text-white hover:bg-[#153a61]"
              >
                Entendido
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  // Fallback direct install / pin button
  return (
    <button
      onClick={() => alert('Para añadir la WebApp a tu pantalla de inicio, usa la opción "Añadir a pantalla de inicio" o "Instalar aplicación" desde el menú de tu navegador.')}
      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white/80 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
    >
      <Download className="w-3.5 h-3.5 text-slate-500" />
      <span>Instalar</span>
    </button>
  );
};
