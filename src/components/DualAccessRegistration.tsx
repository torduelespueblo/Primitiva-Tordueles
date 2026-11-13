import React, { useState } from 'react';
import { Logo } from './Logo';
import {
  ArrowRight,
  ShieldAlert,
  FileDown,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Player } from '../types/lottery';

interface DualAccessRegistrationProps {
  onAuthenticatedPlayer?: (player: Player) => void;
  onRegisteredNewPlayer?: (newPlayer: { name: string; phone: string; timestamp: string }) => void;
  existingPlayers?: Player[];
  onOpenRulesModal?: () => void;
}

export const DualAccessRegistration: React.FC<DualAccessRegistrationProps> = ({
  onAuthenticatedPlayer,
  onRegisteredNewPlayer,
  existingPlayers = [],
}) => {
  const [screenMode, setScreenMode] = useState<'ACCESS' | 'REGISTER' | 'SUCCESS'>('ACCESS');

  const [dniInput, setDniInput] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [accessError, setAccessError] = useState<string | null>(null);

  const [regName, setRegName] = useState('');
  const [regSurname, setRegSurname] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regRulesAccepted, setRegRulesAccepted] = useState(false);
  const [isSubmittingRegister, setIsSubmittingRegister] = useState(false);
  const [registrationData, setRegistrationData] = useState<{
    name: string;
    phone: string;
    timestamp: string;
  } | null>(null);

  const handleCheckDni = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanDni = dniInput.trim().toUpperCase().replace(/[\s-]/g, '');

    if (!cleanDni) {
      setAccessError('Por favor, introduce tu DNI o NIE.');
      return;
    }

    setAccessError(null);
    setIsSearching(true);

    setTimeout(() => {
      setIsSearching(false);
      const found = existingPlayers.find(
        p => p.dni && p.dni.trim().toUpperCase().replace(/[\s-]/g, '') === cleanDni
      );

      if (found) {
        if (onAuthenticatedPlayer) {
          onAuthenticatedPlayer(found);
        }
      } else {
        setScreenMode('REGISTER');
      }
    }, 500);
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regRulesAccepted) return;

    setIsSubmittingRegister(true);

    setTimeout(() => {
      setIsSubmittingRegister(false);

      const now = new Date();
      const pad = (n: number, len = 2) => String(n).padStart(len, '0');
      const timestampMs = `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}.${pad(now.getMilliseconds(), 3)}`;

      const newRegistration = {
        name: `${regName.trim()} ${regSurname.trim()}`,
        phone: regPhone.trim(),
        timestamp: timestampMs,
      };

      setRegistrationData(newRegistration);
      setScreenMode('SUCCESS');

      if (onRegisteredNewPlayer) {
        onRegisteredNewPlayer(newRegistration);
      }
    }, 600);
  };

  const handleDownloadPdf = () => {
    const printableElement = document.getElementById('pdf-rules-printable-container');
    if (!printableElement) {
      window.print();
      return;
    }

    const win = window as unknown as { html2pdf?: () => { set: (o: unknown) => { from: (el: HTMLElement) => { save: () => Promise<void> } } } };
    if (typeof win.html2pdf === 'function') {
      printableElement.style.display = 'block';
      const opt = {
        margin: [10, 10, 10, 10],
        filename: 'Reglamento_Oficial_Pena_Primitiva_Tordueles.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, letterRendering: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      };

      win
        .html2pdf()
        .set(opt)
        .from(printableElement)
        .save()
        .then(() => {
          printableElement.style.display = 'none';
        })
        .catch(() => {
          printableElement.style.display = 'none';
          window.print();
        });
    } else {
      window.print();
    }
  };

  const isFormValid =
    regName.trim().length > 0 &&
    regSurname.trim().length > 0 &&
    regPhone.trim().length >= 6 &&
    regRulesAccepted;

  return (
    <div className="w-full max-w-lg mx-auto">
      {/* FASE 1: ACCESO */}
      {screenMode === 'ACCESS' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
          <div className="bg-[#0A2540] p-6 sm:p-7 text-white text-center">
            <div className="flex justify-center mb-3">
              <Logo size={96} variant="full" theme="dark" className="w-24 h-24" />
            </div>
            <h2 className="text-2xl font-black font-serif text-white tracking-tight">
              Peña Primitiva Tordueles
            </h2>
            <p className="text-sm text-[#FF6B00] mt-1 uppercase tracking-wider font-extrabold">
              Portal Oficial del Jugador
            </p>
          </div>

          <div className="p-6 sm:p-8 space-y-6">
            <div className="text-center">
              <h3 className="text-xl font-extrabold text-[#0A2540]">
                Acceso al Área de Socios
              </h3>
              <p className="text-base text-slate-600 mt-1.5 leading-relaxed">
                Introduce tu DNI o NIE para consultar tu ficha, boleto activo y saldo en la bolsa.
              </p>
            </div>

            {accessError && (
              <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-base flex items-center gap-2.5">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>{accessError}</span>
              </div>
            )}

            <form onSubmit={handleCheckDni} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 uppercase tracking-wider mb-2">
                  DNI o NIE del Titular
                </label>
                <input
                  type="text"
                  value={dniInput}
                  onChange={e => setDniInput(e.target.value)}
                  placeholder="12345678Z"
                  maxLength={10}
                  className="w-full px-4 min-h-[54px] rounded-xl border-2 border-slate-300 focus:border-[#0A2540] text-xl font-mono font-bold tracking-wider uppercase text-slate-900 transition outline-hidden"
                  autoFocus
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isSearching}
                className="w-full min-h-[54px] rounded-xl bg-[#FF6B00] hover:bg-[#E55E00] active:scale-[0.99] text-white font-bold text-base shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {isSearching ? (
                  <span>Consultando base de datos...</span>
                ) : (
                  <>
                    <span>Entrar a Mi Área</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>

            <div className="bg-[#F4F6F9] border border-slate-200 rounded-2xl p-4 text-center">
              <p className="text-base text-slate-700 leading-relaxed">
                <strong>¿Nuevo en la peña?</strong> Si tu DNI no está registrado, se abrirá el formulario de inscripción en lista de espera.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* FASE 2: REGISTRO */}
      {screenMode === 'REGISTER' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden">
          <div className="bg-[#0A2540] p-6 text-white">
            <div className="flex items-center gap-4">
              <Logo size={76} variant="full" theme="dark" className="w-18 h-18 shrink-0" />
              <div>
                <span className="text-sm font-extrabold uppercase tracking-wider text-[#FF6B00] block">
                  Nuevo Aspirante
                </span>
                <h2 className="text-xl sm:text-2xl font-black font-serif text-white">
                  Inscripción en la Peña
                </h2>
              </div>
            </div>
          </div>

          <div className="p-5 sm:p-7 space-y-5">
            <div className="rounded-2xl bg-[#F4F6F9] border border-slate-200 p-4 text-base text-slate-700 flex items-start gap-3">
              <ShieldAlert className="w-6 h-6 text-[#FF6B00] shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <strong className="block text-[#0A2540] font-bold mb-0.5">
                  Privacidad en el Alta Inicial:
                </strong>
                En este registro <strong>NO solicitamos DNI ni IBAN</strong>. Solo se pedirán en caso de cobro de premios mayores a 2.000 € (Art. 5.2).
              </div>
            </div>

            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div>
                <label className="block text-base font-bold text-[#0A2540] mb-1.5">
                  Nombre de Pila <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={regName}
                  onChange={e => setRegName(e.target.value)}
                  placeholder="Ej. Carlos"
                  className="w-full px-4 min-h-[48px] rounded-xl border border-slate-300 focus:border-[#0A2540] text-base text-slate-900 outline-hidden"
                  required
                />
              </div>

              <div>
                <label className="block text-base font-bold text-[#0A2540] mb-1.5">
                  Apellidos Completos <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={regSurname}
                  onChange={e => setRegSurname(e.target.value)}
                  placeholder="Ej. González Ruiz"
                  className="w-full px-4 min-h-[48px] rounded-xl border border-slate-300 focus:border-[#0A2540] text-base text-slate-900 outline-hidden"
                  required
                />
              </div>

              <div>
                <label className="block text-base font-bold text-[#0A2540] mb-1.5">
                  Teléfono Móvil (WhatsApp) <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={regPhone}
                  onChange={e => setRegPhone(e.target.value)}
                  placeholder="Ej. 612 345 678"
                  className="w-full px-4 min-h-[48px] rounded-xl border border-slate-300 focus:border-[#0A2540] text-base text-slate-900 outline-hidden"
                  required
                />
                <span className="text-sm text-slate-600 block mt-1.5">
                  Necesario para envío de resguardos y avisos de vacante de 24 horas.
                </span>
              </div>

              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-base font-bold text-[#0A2540]">
                    Reglamento Oficial Vinculante:
                  </span>
                  <span className="text-sm font-semibold text-slate-600">
                    Desliza para leer ↓
                  </span>
                </div>

                <div className="h-72 overflow-y-auto bg-[#F4F6F9] border-2 border-slate-300 rounded-2xl p-4 sm:p-5 text-base sm:text-lg leading-relaxed text-slate-800 space-y-5 shadow-inner">
                  <h3 className="text-lg font-black text-[#0A2540] border-b border-slate-300 pb-2">
                    Reglamento Oficial de la Peña Primitiva Tordueles
                  </h3>

                  <div>
                    <h4 className="font-bold text-[#0A2540] mb-1">
                      Artículo 1. Financiación, Cuotas y Ciclos de Juego
                    </h4>
                    <ul className="list-disc pl-5 space-y-1.5">
                      <li><strong>1.1. Cuota:</strong> 1,00 € semanal por jugador.</li>
                      <li><strong>1.2. Bloques:</strong> Pagos indivisibles de 10 jornadas (10,00 € por ciclo).</li>
                      <li><strong>1.3. Renovación:</strong> Obligatoria entre la jornada 7 y la jornada 9.</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-bold text-[#0A2540] mb-1">
                      Artículo 2. Apuestas Múltiples e Imparcialidad
                    </h4>
                    <p className="mb-2">
                      <strong>2.1. Escalado:</strong> El tamaño de la apuesta múltiple se ajusta al cupo exacto de socios (7→7€, 8→28€, 5→44€, 9→84€, 10→210€, 11→462€).
                    </p>
                    <p>
                      <strong>2.2. Aleatoriedad:</strong> Combinaciones aleatorias emitidas por terminal oficial SELAE cada semana.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-bold text-[#0A2540] mb-1">
                      Artículo 3. Lista de Espera y Plazos
                    </h4>
                    <ul className="list-disc pl-5 space-y-1.5">
                      <li><strong>3.1. Privacidad:</strong> Alta sin DNI ni IBAN; obligatorios solo en premios mayores a 2.000 €.</li>
                      <li><strong>3.2. Antigüedad:</strong> Orden cronológico por sello temporal con milisegundos.</li>
                      <li><strong>3.3. Bajas:</strong> Impago en J9 supone exclusión tras la jornada 10.</li>
                      <li><strong>3.4. Plazo 24h:</strong> El primer suplente dispone de 24 horas exactas para ingresar los 10 €.</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-bold text-[#0A2540] mb-1">
                      Artículo 4. Bajas y Fallecimiento
                    </h4>
                    <ul className="list-disc pl-5 space-y-1.5">
                      <li><strong>4.1.</strong> La baja extingue derechos y antigüedad.</li>
                      <li><strong>4.2.</strong> La plaza no se hereda; los premios del ciclo vigente se liquidan a herederos legales.</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-bold text-[#0A2540] mb-1">
                      Artículo 5. Premios Menores vs Mayores
                    </h4>
                    <ul className="list-disc pl-5 space-y-1.5">
                      <li><strong>5.1. Menores (&le; 2.000 €):</strong> Al Fondo Común de la peña.</li>
                      <li><strong>5.2. Mayores (&gt; 2.000 €):</strong> Tramitación bancaria con DNI de todos los socios, retención legal del 20% sobre exceso de 40.000 € y abono al IBAN descontando posibles gastos bancarios individuales.</li>
                    </ul>
                  </div>
                </div>
              </div>

              <label className="flex items-start gap-3.5 p-4 rounded-xl border border-slate-300 bg-slate-50 hover:bg-slate-100 transition cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={regRulesAccepted}
                  onChange={e => setRegRulesAccepted(e.target.checked)}
                  className="w-6 h-6 mt-0.5 rounded-md accent-[#FF6B00] cursor-pointer shrink-0"
                  required
                />
                <span className="text-base font-bold text-[#0A2540] leading-snug">
                  He leído y acepto el Reglamento Oficial de la Peña Primitiva Tordueles
                </span>
              </label>

              <button
                type="button"
                onClick={handleDownloadPdf}
                className="w-full min-h-[50px] px-4 rounded-xl border-2 border-[#0A2540] text-[#0A2540] hover:bg-slate-100 font-bold text-base transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <FileDown className="w-5 h-5 text-[#FF6B00]" />
                <span>Descargar Reglamento en PDF</span>
              </button>

              <button
                type="submit"
                disabled={!isFormValid || isSubmittingRegister}
                className="w-full min-h-[54px] rounded-xl bg-[#FF6B00] hover:bg-[#E55E00] text-white font-bold text-base shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmittingRegister ? (
                  <span>Registrando en lista de espera...</span>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Confirmar Inscripción</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setScreenMode('ACCESS')}
                className="w-full min-h-[44px] text-center text-base font-semibold text-slate-600 hover:text-[#0A2540] underline transition cursor-pointer"
              >
                ← Volver a comprobar otro DNI
              </button>
            </form>
          </div>
        </div>
      )}

      {/* FASE 3: CONFIRMACIÓN */}
      {screenMode === 'SUCCESS' && registrationData && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xl text-center space-y-5">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div>
            <span className="text-sm font-extrabold uppercase tracking-wider text-emerald-700 block">
              Inscripción Formalizada
            </span>
            <h3 className="text-2xl font-black font-serif text-[#0A2540] mt-2">
              ¡Bienvenido a la Peña, {registrationData.name}!
            </h3>
            <p className="text-base text-slate-600 mt-1.5">
              Has quedado registrado en la lista de espera oficial.
            </p>
          </div>

          <div className="bg-[#F4F6F9] rounded-2xl border border-slate-200 p-4 text-left text-base space-y-2.5">
            <div className="flex flex-wrap justify-between gap-2">
              <span className="text-slate-600">Sello Temporal:</span>
              <strong className="font-mono text-[#0A2540] tabular-nums">{registrationData.timestamp}</strong>
            </div>
            <div className="flex flex-wrap justify-between gap-2">
              <span className="text-slate-600">Condición:</span>
              <strong className="text-[#FF6B00]">Suplente (Lista de Espera)</strong>
            </div>
            <div className="flex flex-wrap justify-between gap-2">
              <span className="text-slate-600">Teléfono:</span>
              <strong className="font-mono text-[#0A2540]">{registrationData.phone}</strong>
            </div>
          </div>

          <div className="space-y-3">
            <button
              type="button"
              onClick={handleDownloadPdf}
              className="w-full min-h-[48px] px-4 rounded-xl border border-slate-300 text-[#0A2540] hover:bg-slate-50 font-bold text-base transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <FileDown className="w-5 h-5 text-[#FF6B00]" />
              <span>Descargar Copia del Reglamento (PDF)</span>
            </button>

            <button
              type="button"
              onClick={() => setScreenMode('ACCESS')}
              className="w-full min-h-[48px] px-4 rounded-xl bg-[#0A2540] hover:bg-[#13375B] text-white font-bold text-base transition cursor-pointer"
            >
              Volver a la Pantalla de Acceso
            </button>
          </div>
        </div>
      )}

      {/* PLANTILLA OCULTA PDF */}
      <div id="pdf-rules-printable-container" className="hidden p-8 bg-white text-slate-900 font-sans">
        <div className="flex items-center gap-4 border-b-2 border-[#0A2540] pb-4 mb-4">
          <Logo size={72} variant="full" theme="light" />
          <div>
            <h1 className="text-xl font-bold text-[#0A2540]">Peña La Primitiva Tordueles</h1>
            <h2 className="text-sm uppercase tracking-wider text-[#FF6B00] font-bold">
              Reglamento Oficial y Estatutos Vinculantes
            </h2>
            <p className="text-xs text-slate-500">Tordueles (Burgos) · Documento Certificado</p>
          </div>
        </div>
        <div className="space-y-3 text-sm leading-relaxed text-slate-700">
          <p><strong>Artículo 1:</strong> Cuota fija de 1,00 €/semana en bloques indivisibles de 10 jornadas (10,00 €). Renovación entre J7 y J9.</p>
          <p><strong>Artículo 2:</strong> Ajuste automático al presupuesto (7→7€, 8→28€, 5→44€, 9→84€, 10→210€, 11→462€) y combinaciones aleatorias SELAE.</p>
          <p><strong>Artículo 3:</strong> Alta sin DNI ni IBAN; orden cronológico por sello de tiempo con milisegundos; 24h para abonar vacantes.</p>
          <p><strong>Artículo 4:</strong> La baja extingue antigüedad. La plaza no se hereda; liquidación proporcional a herederos.</p>
          <p><strong>Artículo 5:</strong> Premios &le; 2.000 € al Fondo Común; &gt; 2.000 € mediante entidad bancaria con DNI e IBAN.</p>
        </div>
      </div>
    </div>
  );
};
