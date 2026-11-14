import React, { useState, useEffect } from 'react';
import { Logo } from './Logo';
import {
  ArrowRight,
  ShieldAlert,
  FileDown,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  UserPlus,
  Check
} from 'lucide-react';
import { Player } from '../types/lottery';
import { OFFICIAL_RULES_SECTIONS, OFFICIAL_RULES_TITLE } from '../data/officialRules';
import {
  submitRegistrationToSheet,
  validateMemberAccess,
  MemberAccessResponse,
  PublicListRow
} from '../services/registrationService';
import { downloadOfficialRulesPdf } from '../services/pdfService';

interface DualAccessRegistrationProps {
  initialMode?: 'ACCESS' | 'REGISTER';
  googleAppsScriptUrl?: string;
  onAuthenticatedPlayer?: (player: Player, accessData?: MemberAccessResponse) => void;
  onRegisteredNewPlayer?: (newPlayer: {
    name: string;
    phone: string;
    timestamp: string;
    listaPublica?: PublicListRow[];
    conteoTitulares?: number;
    conteoSuplentes?: number;
  }) => void;
  existingPlayers?: Player[];
  onOpenRulesModal?: () => void;
  onBackToApp?: () => void;
}

export const DualAccessRegistration: React.FC<DualAccessRegistrationProps> = ({
  initialMode = 'ACCESS',
  googleAppsScriptUrl,
  onAuthenticatedPlayer,
  onRegisteredNewPlayer,
  existingPlayers = [],
  onBackToApp,
}) => {
  const [screenMode, setScreenMode] = useState<'ACCESS' | 'REGISTER' | 'SUCCESS'>(initialMode);

  useEffect(() => {
    setScreenMode(initialMode);
  }, [initialMode]);

  const [dniInput, setDniInput] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [accessError, setAccessError] = useState<string | null>(null);

  const [regName, setRegName] = useState('');
  const [regSurname, setRegSurname] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regRulesAccepted, setRegRulesAccepted] = useState(false);
  const [isSubmittingRegister, setIsSubmittingRegister] = useState(false);
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [pdfDownloadMsg, setPdfDownloadMsg] = useState<string | null>(null);
  const [registrationData, setRegistrationData] = useState<{
    name: string;
    phone: string;
    timestamp: string;
    syncedToSheet: boolean;
  } | null>(null);

  const handleCheckDni = async (e: React.FormEvent) => {
    e.preventDefault();
    const rawInput = dniInput.trim();
    const cleanDni = rawInput.toUpperCase().replace(/[\s-]/g, '');
    const digitsOnly = rawInput.replace(/\D/g, '');

    if (!cleanDni || (cleanDni.length < 5 && digitsOnly.length < 9)) {
      setAccessError('Introduce un DNI/NIE o un número de teléfono móvil válido.');
      return;
    }

    setAccessError(null);
    setIsSearching(true);

    const res = await validateMemberAccess(googleAppsScriptUrl, rawInput);
    setIsSearching(false);

    if (res.success && res.user) {
      const roleStatus: Player['status'] =
        res.rol === 'TITULAR' ? 'TITULAR' : 'SUPLENTE';
      const playerObj: Player = {
        id: `sheet-auth-${res.user.filaIndex || Date.now()}`,
        memberNumber: 0,
        name: res.user.nombreCompleto || `${res.user.nombre} ${res.user.apellidos}`.trim(),
        firstName: res.user.nombre,
        lastName: res.user.apellidos,
        email: '',
        phone: res.user.telefono || '',
        dni: res.user.dni || '',
        registrationTimestamp: '',
        status: roleStatus,
        currentCyclePaid: res.user.estadoPago?.toLowerCase() === 'pagado',
        paidUntilCycle: res.user.cicloActual || 1,
        renewalStatus:
          res.user.estadoPago?.toLowerCase() === 'pagado' ? 'RENOVADO' : 'PENDIENTE',
      };

      if (onAuthenticatedPlayer) {
        onAuthenticatedPlayer(playerObj, res);
      }
      return;
    }

    if (res.networkError) {
      const phoneTail = digitsOnly.length >= 9 ? digitsOnly.slice(-9) : '';
      const foundLocal = existingPlayers.find(p => {
        const pDni = (p.dni || '').trim().toUpperCase().replace(/[\s-]/g, '');
        const pTel = (p.phone || '').replace(/\D/g, '');
        const pTelTail = pTel.length >= 9 ? pTel.slice(-9) : '';
        return (pDni && pDni === cleanDni) || (phoneTail && pTelTail === phoneTail);
      });

      if (foundLocal && onAuthenticatedPlayer) {
        onAuthenticatedPlayer(foundLocal);
        return;
      }
    }

    setAccessError(
      res.message ||
        'No encontramos ningún socio activo con ese DNI o teléfono. Verifica los datos o apúntate en la lista de espera.'
    );
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regRulesAccepted) return;

    setRegisterError(null);
    setIsSubmittingRegister(true);

    const response = await submitRegistrationToSheet(googleAppsScriptUrl, {
      nombre: regName,
      apellidos: regSurname,
      telefono: regPhone,
      reglamentoAceptado: regRulesAccepted,
    });

    setIsSubmittingRegister(false);

    if (!response.success) {
      setRegisterError(response.message || 'No se pudo registrar la solicitud.');
      return;
    }

    const newRegistration = {
      name: response.nombre,
      phone: regPhone.trim(),
      timestamp: response.timestamp,
      syncedToSheet: response.syncedToSheet,
    };

    setRegistrationData(newRegistration);
    setScreenMode('SUCCESS');

    if (onRegisteredNewPlayer) {
      onRegisteredNewPlayer({
        name: newRegistration.name,
        phone: newRegistration.phone,
        timestamp: newRegistration.timestamp,
        listaPublica: response.listaPublica,
        conteoTitulares: response.conteoTitulares,
        conteoSuplentes: response.conteoSuplentes,
      });
    }
  };

  const handleDownloadPdf = () => {
    const res = downloadOfficialRulesPdf();
    setPdfDownloadMsg(`¡Descargado! (${res.pages} páginas · ${res.filename})`);
    setTimeout(() => setPdfDownloadMsg(null), 4000);
  };

  const isFormValid =
    regName.trim().length > 0 &&
    regSurname.trim().length > 0 &&
    regPhone.trim().length >= 6 &&
    regRulesAccepted;

  return (
    <div className="w-full max-w-xl mx-auto">
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
            {onBackToApp && (
              <button
                type="button"
                onClick={onBackToApp}
                className="inline-flex items-center gap-2 text-base font-bold text-[#0A2540] hover:text-[#FF6B00] min-h-[44px] cursor-pointer"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Volver a la WebApp</span>
              </button>
            )}

            <div className="text-center">
              <h3 className="text-xl font-extrabold text-[#0A2540]">
                Acceso al Área de Socios
              </h3>
              <p className="text-base text-slate-600 mt-1.5 leading-relaxed">
                Introduce tu <strong>DNI / NIE</strong> (si eres Titular) o tu <strong>Teléfono Móvil</strong> (si estás en Lista de Espera).
              </p>
            </div>

            {accessError && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-800 text-sm sm:text-base flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <span>{accessError}</span>
              </div>
            )}

            <form onSubmit={handleCheckDni} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 uppercase tracking-wider mb-2">
                  DNI / NIE o Teléfono Móvil
                </label>
                <input
                  type="text"
                  value={dniInput}
                  onChange={e => setDniInput(e.target.value)}
                  placeholder="Ej. 12345678Z o 612345678"
                  maxLength={18}
                  className="w-full px-4 min-h-[54px] rounded-xl border-2 border-slate-300 focus:border-[#0A2540] text-xl font-mono font-bold tracking-wider uppercase text-slate-900 transition outline-hidden"
                  autoFocus
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isSearching}
                className="w-full min-h-[54px] rounded-xl bg-[#0A2540] hover:bg-[#13375B] active:scale-[0.99] text-white font-bold text-base shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {isSearching ? (
                  <span>Comprobando tu ficha...</span>
                ) : (
                  <>
                    <span>Entrar a Mi Área</span>
                    <ArrowRight className="w-5 h-5 text-[#FF6B00]" />
                  </>
                )}
              </button>
            </form>

            <div className="bg-[#F4F6F9] border border-slate-200 rounded-2xl p-4 text-center space-y-3">
              <p className="text-base text-slate-700 leading-relaxed">
                <strong>¿Aún no estás apuntado?</strong> Registrarte no te obliga a jugar todavía, pero ya te otorga antigüedad oficial en la lista de espera.
              </p>
              <button
                type="button"
                onClick={() => setScreenMode('REGISTER')}
                className="w-full min-h-[48px] rounded-xl bg-[#FF6B00] hover:bg-[#E55E00] text-white font-bold text-base shadow-sm transition inline-flex items-center justify-center gap-2 cursor-pointer"
              >
                <UserPlus className="w-5 h-5" />
                <span>Apuntarme en Lista de Espera</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FASE 2: FORMULARIO DE INSCRIPCIÓN DIRECTO (SIN INSTALAR APP Y CONECTADO A SHEETS) */}
      {screenMode === 'REGISTER' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden">
          <div className="bg-[#0A2540] p-6 text-white flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Logo size={76} variant="full" theme="dark" className="w-18 h-18 shrink-0" />
              <div>
                <span className="text-sm font-extrabold uppercase tracking-wider text-[#FF6B00] block">
                  Inscripción Oficial · Lista de Espera
                </span>
                <h2 className="text-xl sm:text-2xl font-black font-serif text-white">
                  Inscripción - Peña Primitiva Tordueles
                </h2>
              </div>
            </div>
          </div>

          <div className="p-5 sm:p-7 space-y-5">
            {onBackToApp && (
              <button
                type="button"
                onClick={onBackToApp}
                className="inline-flex items-center gap-2 text-base font-bold text-[#0A2540] hover:text-[#FF6B00] min-h-[44px] cursor-pointer"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Volver a la WebApp</span>
              </button>
            )}

            <div className="rounded-2xl bg-[#F4F6F9] border border-slate-200 p-4 text-base text-slate-700 flex items-start gap-3">
              <ShieldAlert className="w-6 h-6 text-[#FF6B00] shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <strong className="block text-[#0A2540] font-bold mb-0.5">
                  Privacidad en el Alta Inicial (Art. 3.1):
                </strong>
                Por privacidad y seguridad, <strong>NO solicitamos DNI ni IBAN</strong> de entrada. Estos solo se pedirán en caso de cobro de premios mayores a 2.000 €. Tus datos quedarán guardados en el registro oficial por estricto orden de inscripción.
              </div>
            </div>

            {registerError && (
              <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-base flex items-center gap-2.5">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>{registerError}</span>
              </div>
            )}

            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div>
                <label className="block text-base font-bold text-[#0A2540] mb-1.5">
                  Nombre <span className="text-red-500">*</span>
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
                  Apellidos <span className="text-red-500">*</span>
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
                  Teléfono Móvil <span className="text-red-500">*</span>
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
                  Necesario para el grupo de WhatsApp y avisos individuales de vacante con plazo de 48 horas para pagar.
                </span>
              </div>

              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-base font-bold text-[#0A2540]">
                    Reglamento Oficial Íntegro:
                  </span>
                  <span className="text-sm font-semibold text-slate-600">
                    Desliza para leer ↓
                  </span>
                </div>

                <div className="h-80 overflow-y-auto bg-[#F4F6F9] border-2 border-slate-300 rounded-2xl p-4 sm:p-5 text-base leading-relaxed text-slate-800 space-y-5 shadow-inner">
                  <h3 className="text-lg font-black text-[#0A2540] border-b border-slate-300 pb-2">
                    {OFFICIAL_RULES_TITLE}
                  </h3>

                  {OFFICIAL_RULES_SECTIONS.map(section => (
                    <div key={section.articleNumber} className="space-y-2.5">
                      <h4 className="font-black text-[#0A2540] text-base sm:text-lg">
                        {section.articleNumber}. {section.title}
                      </h4>
                      {section.paragraphs.map((p, idx) => (
                        <div key={idx} className="space-y-1.5">
                          <p>
                            {p.code && (
                              <strong className="text-[#0A2540]">
                                {p.code} {p.heading}{' '}
                              </strong>
                            )}
                            {p.text}
                          </p>
                          {p.bullets && (
                            <ul className="list-disc pl-5 space-y-1">
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
                {pdfDownloadMsg ? (
                  <Check className="w-5 h-5 text-emerald-600 shrink-0" />
                ) : (
                  <FileDown className="w-5 h-5 text-[#FF6B00] shrink-0" />
                )}
                <span>{pdfDownloadMsg || 'Descargar Reglamento en PDF'}</span>
              </button>

              <button
                type="submit"
                disabled={!isFormValid || isSubmittingRegister}
                className="w-full min-h-[54px] rounded-xl bg-[#FF6B00] hover:bg-[#E55E00] text-white font-bold text-base shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmittingRegister ? (
                  <span>Guardando inscripción en Google Sheets...</span>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Confirmar Inscripción en Lista de Espera</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setScreenMode('ACCESS')}
                className="w-full min-h-[44px] text-center text-base font-semibold text-slate-600 hover:text-[#0A2540] underline transition cursor-pointer"
              >
                ← Ya soy socio / Acceder con DNI
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
              {registrationData.syncedToSheet
                ? 'Tus datos han sido enviados a la base de datos oficial en Google Sheets como Suplente.'
                : 'Has quedado registrado en la lista de espera oficial.'}
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
              {pdfDownloadMsg ? (
                <Check className="w-5 h-5 text-emerald-600 shrink-0" />
              ) : (
                <FileDown className="w-5 h-5 text-[#FF6B00] shrink-0" />
              )}
              <span>{pdfDownloadMsg || 'Descargar Copia del Reglamento (PDF)'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (onBackToApp) {
                  onBackToApp();
                } else {
                  setScreenMode('ACCESS');
                }
              }}
              className="w-full min-h-[48px] px-4 rounded-xl bg-[#0A2540] hover:bg-[#13375B] text-white font-bold text-base transition cursor-pointer"
            >
              {onBackToApp ? 'Volver al Portal de la Peña' : 'Volver a la Pantalla de Acceso'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
