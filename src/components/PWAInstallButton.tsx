import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Smartphone, X, Check } from 'lucide-react';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuideModal, setShowGuideModal] = useState(false);

  if (isInstalled) {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 min-h-[44px]">
        <Check className="w-4 h-4 text-emerald-600 shrink-0" />
        <span className="hidden sm:inline">App Instalada</span>
      </span>
    );
  }

  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={install}
        className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#FF6B00] hover:bg-[#E55E00] px-3.5 sm:px-4 min-h-[44px] text-sm sm:text-base font-bold text-white shadow-sm transition active:scale-95 cursor-pointer"
        title="Instalar App en tu pantalla de inicio"
      >
        <Download className="w-4 h-4 shrink-0" />
        <span>Instalar App</span>
      </button>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setShowGuideModal(true)}
        className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#0A2540] hover:bg-[#13375B] px-3.5 min-h-[44px] text-sm font-bold text-white shadow-xs transition active:scale-95 cursor-pointer"
        title={isIOS ? 'Cómo instalar en iPhone o iPad' : 'Cómo instalar la WebApp en tu móvil'}
      >
        {isIOS ? (
          <Smartphone className="w-4 h-4 text-[#FF6B00] shrink-0" />
        ) : (
          <Download className="w-4 h-4 text-[#FF6B00] shrink-0" />
        )}
        <span>Instalar</span>
      </button>

      {showGuideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-lg sm:text-xl font-extrabold text-[#0A2540]">
                {isIOS ? 'Instalar en iPhone o iPad' : 'Instalar en Android o Escritorio'}
              </h3>
              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                className="rounded-xl p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-500 hover:bg-slate-100 cursor-pointer"
                aria-label="Cerrar guía de instalación"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {isIOS ? (
              <div className="mt-4 space-y-4 text-base text-slate-700 leading-relaxed">
                <div className="flex items-start gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#0A2540] text-white font-bold text-sm">
                    1
                  </span>
                  <p>
                    Abre esta web en el navegador <strong>Safari</strong>.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#0A2540] text-white font-bold text-sm">
                    2
                  </span>
                  <p>
                    Pulsa el botón <strong>Compartir</strong> (cuadrado con flecha hacia arriba) en la barra inferior.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#FF6B00] text-white font-bold text-sm">
                    3
                  </span>
                  <p>
                    Selecciona <strong>Añadir a la pantalla de inicio</strong>.
                  </p>
                </div>
              </div>
            ) : (
              <div className="mt-4 space-y-4 text-base text-slate-700 leading-relaxed">
                <p className="text-slate-600">
                  Si el aviso automático aún no ha aparecido, puedes instalarla manualmente desde tu navegador:
                </p>
                <div className="flex items-start gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#0A2540] text-white font-bold text-sm">
                    1
                  </span>
                  <p>
                    Pulsa el menú <strong>⋮</strong> (tres puntos) arriba a la derecha en Google Chrome.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#FF6B00] text-white font-bold text-sm">
                    2
                  </span>
                  <p>
                    Selecciona <strong>Añadir a pantalla de inicio</strong> → <strong>Instalar</strong>.
                  </p>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowGuideModal(false)}
              className="mt-6 w-full rounded-xl bg-[#0A2540] hover:bg-[#13375B] min-h-[48px] text-base font-bold text-white transition cursor-pointer"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </>
  );
};
