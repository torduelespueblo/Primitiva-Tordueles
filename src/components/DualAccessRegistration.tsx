import React, { useState } from 'react';
import { Logo } from './Logo';
import {
  Lock,
  ArrowRight,
  UserCheck,
  UserPlus,
  ShieldAlert,
  FileDown,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Printer
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
  // Estado de la pantalla: 'ACCESS' o 'REGISTER' o 'SUCCESS'
  const [screenMode, setScreenMode] = useState<'ACCESS' | 'REGISTER' | 'SUCCESS'>('ACCESS');

  // Input de DNI/NIE para la consulta
  const [dniInput, setDniInput] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [accessError, setAccessError] = useState<string | null>(null);

  // Campos del Formulario de Registro (Sin DNI ni IBAN)
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

  // Manejo de la consulta del DNI
  const handleCheckDni = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanDni = dniInput.trim().toUpperCase().replace(/[\s-]/g, '');

    if (!cleanDni) {
      setAccessError('Por favor, introduce tu DNI o NIE.');
      return;
    }

    setAccessError(null);
    setIsSearching(true);

    // Simulación de llamada a backend / búsqueda en base de datos
    setTimeout(() => {
      setIsSearching(false);
      const found = existingPlayers.find(
        p => p.dni && p.dni.trim().toUpperCase().replace(/[\s-]/g, '') === cleanDni
      );

      if (found) {
        // Socio encontrado -> Acceso directo al panel
        if (onAuthenticatedPlayer) {
          onAuthenticatedPlayer(found);
        }
      } else {
        // DNI NO encontrado -> Transformación fluida a la pantalla de Registro
        setScreenMode('REGISTER');
      }
    }, 600);
  };

  // Manejo del envío del formulario de registro
  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regRulesAccepted) return;

    setIsSubmittingRegister(true);

    setTimeout(() => {
      setIsSubmittingRegister(false);

      // Generar sello de tiempo de alta precisión con milisegundos
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
    }, 750);
  };

  // Generación e impresión o descarga del PDF Oficial con html2pdf.js o print
  const handleDownloadPdf = () => {
    const printableElement = document.getElementById('pdf-rules-printable-container');
    if (!printableElement) {
      window.print();
      return;
    }

    // Verificar si html2pdf está disponible en el entorno global
    const win = window as any;
    if (typeof win.html2pdf === 'function') {
      printableElement.style.display = 'block';
      const opt = {
        margin: [10, 10, 10, 10],
        filename: 'Reglamento_Oficial_Pena_Primitiva_Tordueles.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, letterRendering: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      };

      win.html2pdf().set(opt).from(printableElement).save().then(() => {
        printableElement.style.display = 'none';
      }).catch(() => {
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
      {/* ======================================================== */}
      {/* FASE 1: PANTALLA DE ACCESO (SOLO DNI Y ENTRAR)            */}
      {/* ======================================================== */}
      {screenMode === 'ACCESS' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden transition-all duration-300">
          {/* Header con Emblema Circular */}
          <div className="bg-gradient-to-br from-[#0A2540] to-[#163B61] p-6 text-white text-center border-b-4 border-[#FF6B00]">
            <div className="flex justify-center mb-3">
              <div className="bg-white p-2 rounded-full shadow-lg">
                <Logo size={68} variant="full" />
              </div>
            </div>
            <h2 className="text-xl font-bold font-serif text-white tracking-tight">
              Peña Primitiva Tordueles
            </h2>
            <p className="text-xs text-sky-200 mt-0.5 uppercase tracking-wider font-semibold">
              Portal Oficial del Jugador
            </p>
          </div>

          <div className="p-6 sm:p-8 space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-bold text-[#0A2540]">
                Acceso al Área de Socios
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Introduce tu DNI o NIE para consultar tu ficha, boleto activo y saldo en la bolsa.
              </p>
            </div>

            {accessError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{accessError}</span>
              </div>
            )}

            <form onSubmit={handleCheckDni} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  DNI o NIE del Titular:
                </label>
                <input
                  type="text"
                  value={dniInput}
                  onChange={e => setDniInput(e.target.value)}
                  placeholder="12345678Z"
                  maxLength={10}
                  className="w-full px-4 py-3.5 rounded-xl border-2 border-slate-200 focus:border-[#0A2540] focus:ring-4 focus:ring-blue-900/10 text-lg font-mono font-bold tracking-wider uppercase text-slate-900 transition outline-hidden"
                  autoFocus
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isSearching}
                className="w-full py-4 rounded-xl bg-[#FF6B00] hover:bg-[#e55e00] active:scale-[0.99] text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {isSearching ? (
                  <span>Consultando base de datos...</span>
                ) : (
                  <>
                    <span>Entrar a Mi Área</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-center">
              <p className="text-xs text-slate-600">
                🔒 <strong>¿Nuevo en la peña?</strong> Si tu DNI aún no está registrado, el sistema te mostrará automáticamente el formulario para solicitar plaza en la lista de espera oficial.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* FASE 2: FORMULARIO DE REGISTRO INTELIGENTE                */}
      {/* ======================================================== */}
      {screenMode === 'REGISTER' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden transition-all duration-300">
          {/* Header */}
          <div className="bg-gradient-to-br from-[#0A2540] to-[#163B61] p-6 text-white border-b-4 border-[#FF6B00]">
            <div className="flex items-center gap-3">
              <div className="bg-white p-1.5 rounded-2xl shadow-sm shrink-0">
                <Logo size={48} variant="full" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#FF6B00] bg-orange-950/40 px-2 py-0.5 rounded-md inline-block">
                  Nuevo Aspirante
                </span>
                <h2 className="text-base sm:text-lg font-bold font-serif text-white">
                  Inscripción en la Peña Primitiva
                </h2>
              </div>
            </div>
          </div>

          <div className="p-5 sm:p-7 space-y-5">
            {/* Aviso de privacidad (Sin DNI ni IBAN en alta) */}
            <div className="rounded-2xl bg-sky-50 border border-sky-200 p-4 text-xs text-sky-900 flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-sky-700 shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <strong className="block text-sky-950 font-bold mb-0.5">
                  Protección y Privacidad de Entrada:
                </strong>
                En este registro inicial <strong>NO solicitamos ni DNI ni número de cuenta bancaria (IBAN)</strong>. Estos datos solo se requerirán a los integrantes activos en caso de cobro de premios mayores a 2.000€ (Art. 5.2).
              </div>
            </div>

            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Nombre de Pila <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={regName}
                  onChange={e => setRegName(e.target.value)}
                  placeholder="Ej. Carlos"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-[#0A2540] text-sm text-slate-800 outline-hidden"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Apellidos Completos <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={regSurname}
                  onChange={e => setRegSurname(e.target.value)}
                  placeholder="Ej. González Ruiz"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-[#0A2540] text-sm text-slate-800 outline-hidden"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Teléfono Móvil (WhatsApp) <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={regPhone}
                  onChange={e => setRegPhone(e.target.value)}
                  placeholder="Ej. 612 345 678"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-[#0A2540] text-sm text-slate-800 outline-hidden"
                  required
                />
                <span className="text-[11px] text-slate-500 block mt-1">
                  Necesario para el envío de los resguardos y avisos de vacantes de 24 horas.
                </span>
              </div>

              {/* CONTENEDOR VISUAL CON SCROLL DEL REGLAMENTO OFICIAL (TIPOGRAFÍA GRANDE MÓVIL) */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-slate-900">
                    Bases Oficiales y Estatutos Vinculantes:
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Desliza para leer ↓
                  </span>
                </div>

                <div className="h-64 overflow-y-auto bg-slate-50 border-2 border-slate-200 rounded-2xl p-4 text-[15px] sm:text-[16px] leading-relaxed text-slate-800 space-y-4 shadow-inner">
                  <h3 className="text-base font-bold text-[#0A2540] border-b border-slate-200 pb-2">
                    Reglamento Oficial de la Peña Primitiva Tordueles
                  </h3>

                  {/* Art 1 */}
                  <div>
                    <h4 className="font-bold text-[#0A2540] text-sm mb-1">
                      Artículo 1. Financiación, Cuotas y Ciclos de Juego
                    </h4>
                    <ul className="list-disc pl-5 space-y-1 text-xs sm:text-sm">
                      <li><strong>1.1. Cuota Unitaria:</strong> La participación en la peña tiene una cuota fija de <strong>1,00 € semanal por jugador</strong>.</li>
                      <li><strong>1.2. Bloques Indivisibles:</strong> Los pagos se realizarán por adelantado en bloques cerrados e indivisibles de <strong>10 jornadas (10,00 € por jugador y ciclo)</strong>. No se admiten pagos fraccionados ni semanas sueltas.</li>
                      <li><strong>1.3. Plazo Obligatorio de Renovación:</strong> La renovación de la cuota para el siguiente ciclo debe abonarse obligatoriamente entre la <strong>jornada 7 y la jornada 9</strong> del ciclo vigente.</li>
                    </ul>
                  </div>

                  {/* Art 2 */}
                  <div>
                    <h4 className="font-bold text-[#0A2540] text-sm mb-1">
                      Artículo 2. Apuestas Múltiples Adaptables e Imparcialidad
                    </h4>
                    <p className="text-xs sm:text-sm mb-2">
                      <strong>2.1. Ajuste Automático al Presupuesto y Escalado de Jugadores:</strong> El importe y tamaño de la apuesta múltiple oficial se adaptará automáticamente al número exacto de jugadores que hayan completado el pago en cada ciclo. Dado que cada jugador aporta 1,00 € por sorteo, para aumentar el tamaño de la peña y jugar una combinación mayor, el número total de participantes deberá coincidir siempre con el número exacto de apuestas directas que exige cada bloque múltiple oficial. No se admitirán cifras intermedias de jugadores.
                    </p>
                    <div className="bg-white p-2.5 rounded-xl border border-slate-200 text-xs text-slate-700">
                      <strong>Opciones de apuestas múltiples de La Primitiva y cupos exactos requeridos:</strong>
                      <ul className="list-disc pl-4 mt-1 space-y-0.5">
                        <li>Múltiple de 7 números: 7 apuestas (requiere 7 jugadores por 7,00 €).</li>
                        <li>Múltiple de 8 números: 28 apuestas (requiere 28 jugadores por 28,00 €).</li>
                        <li>Múltiple de 5 números (fijo): 44 apuestas (requiere 44 jugadores por 44,00 €).</li>
                        <li>Múltiple de 9 números: 84 apuestas (requiere 84 jugadores por 84,00 €).</li>
                        <li>Múltiple de 10 números: 210 apuestas (requiere 210 jugadores por 210,00 €).</li>
                        <li>Múltiple de 11 números: 462 apuestas (requiere 462 jugadores por 462,00 €).</li>
                      </ul>
                    </div>
                    <p className="text-xs sm:text-sm mt-2">
                      <strong>2.2. Combinaciones Aleatorias de Terminal:</strong> Las combinaciones jugadas <strong>nunca serán fijas</strong>. Se generarán de forma automática y aleatoria mediante el terminal oficial de Loterías y Apuestas del Estado.
                    </p>
                  </div>

                  {/* Art 3 */}
                  <div>
                    <h4 className="font-bold text-[#0A2540] text-sm mb-1">
                      Artículo 3. Control de Lista de Espera, Inscripción y Plazos
                    </h4>
                    <ul className="list-disc pl-5 space-y-1 text-xs sm:text-sm">
                      <li><strong>3.1. Requisitos de Inscripción y Aceptación de Bases:</strong> Para formalizar la inscripción en la peña, es obligatoria la recopilación de Nombre, Apellidos, Teléfono Móvil y marcar la casilla de Aceptación del Reglamento. Por motivos de privacidad, no se exigirá el DNI ni el IBAN en el alta inicial. No obstante, todo socio acepta expresamente que, en caso de resultar agraciado con un premio que requiera dichos datos, estará obligado a facilitar su DNI/NIF y su número de cuenta (IBAN).</li>
                      <li><strong>3.2. Orden Cronológico Inalterable:</strong> Las vacantes se asignarán por estricto orden de antigüedad basado en el sello de tiempo registrado al completar la inscripción.</li>
                      <li><strong>3.3. Exclusión por Falta de Pago:</strong> Si un integrante titular no abona la cuota antes de finalizar la jornada 9, será excluido de la peña.</li>
                      <li><strong>3.4. Plazo Estricto de 24 Horas para Suplentes:</strong> El aspirante notificado dispondrá de <strong>24 horas exactas</strong> para abonar los 10,00 € correspondientes al nuevo ciclo.</li>
                      <li><strong>3.5. Ampliación de la Peña y Salto de Nivel:</strong> Si la lista de espera ("Suplentes") crece lo suficiente como para alcanzar el siguiente bloque oficial, el ascenso de categoría no se realizará de forma automática. El Administrador deberá evaluar y aprobar manualmente este salto de nivel antes de finalizar el ciclo vigente. Tras la confirmación de los pagos, la peña al completo pasará a jugar el nuevo bloque en el siguiente ciclo.</li>
                    </ul>
                  </div>

                  {/* Art 4 */}
                  <div>
                    <h4 className="font-bold text-[#0A2540] text-sm mb-1">
                      Artículo 4. Bajas, Pérdida de Antigüedad y Régimen de Fallecimiento
                    </h4>
                    <ul className="list-disc pl-5 space-y-1 text-xs sm:text-sm">
                      <li><strong>4.1. Pérdida de Derechos por Baja:</strong> Toda persona que cause baja perderá su condición de socio. Si desea reingresar, deberá situarse al final de la cola.</li>
                      <li><strong>4.2. No Heredabilidad de la Plaza:</strong> En caso de fallecimiento, <strong>la plaza no se hereda</strong>.</li>
                      <li><strong>4.3. Liquidación a Herederos Legales:</strong> La plaza vacante pasará al primer suplente tras finalizar el ciclo abonado. La parte neta de cualquier premio obtenido en dicho ciclo se entregará a sus herederos legales.</li>
                    </ul>
                  </div>

                  {/* Art 5 */}
                  <div>
                    <h4 className="font-bold text-[#0A2540] text-sm mb-1">
                      Artículo 5. Reparto de Premios Menores vs Mayores
                    </h4>
                    <ul className="list-disc pl-5 space-y-1 text-xs sm:text-sm">
                      <li><strong>5.1. Premios Menores (hasta 2.000,00 €):</strong> Se acumularán íntegramente en el <strong>Fondo Común de la peña</strong>.</li>
                      <li><strong>5.2. Premios Mayores (superiores a 2.000,00 €):</strong> Obligan legalmente a la tramitación presentando el DNI de la totalidad de los miembros. La entidad bancaria retendrá automáticamente el 20% en concepto de gravamen especial sobre el importe que exceda de 40.000,00 €. Posteriormente, se transferirá la parte líquida neta al IBAN individual. Al tratarse de transferencias bancarias para el reparto de estas cantidades (mayores de 2.000,00 € y de 40.000,00 €), cada jugador asumirá de forma individual los posibles gastos o comisiones por transferencia que aplique la entidad bancaria, descontándose dichas comisiones directamente del importe a percibir.</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* CHECKBOX OBLIGATORIO */}
              <label className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={regRulesAccepted}
                  onChange={e => setRegRulesAccepted(e.target.checked)}
                  className="w-5 h-5 mt-0.5 rounded-md accent-[#FF6B00] cursor-pointer shrink-0"
                  required
                />
                <span className="text-xs sm:text-sm font-semibold text-slate-900 leading-snug">
                  He leído y acepto el Reglamento Oficial de la Peña Primitiva Tordueles
                </span>
              </label>

              {/* BOTÓN DESTACADO: DESCARGAR REGLAMENTO EN PDF */}
              <button
                type="button"
                onClick={handleDownloadPdf}
                className="w-full py-3 px-4 rounded-xl border-2 border-[#0A2540] text-[#0A2540] hover:bg-blue-50 font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                <FileDown className="w-4 h-4 text-[#FF6B00]" />
                <span>Descargar Reglamento en PDF</span>
              </button>

              {/* BOTÓN FINAL DE CONFIRMACIÓN */}
              <button
                type="submit"
                disabled={!isFormValid || isSubmittingRegister}
                className="w-full py-3.5 rounded-xl bg-[#0A2540] hover:bg-[#163B61] text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmittingRegister ? (
                  <span>Registrando en lista de espera...</span>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Confirmar Inscripción y Reservar Plaza</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setScreenMode('ACCESS')}
                className="w-full py-1 text-center text-xs text-slate-500 hover:text-slate-800 underline transition cursor-pointer"
              >
                ← Volver a comprobar otro DNI
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* FASE 3: CONFIRMACIÓN EXITOSA TRAS EL REGISTRO            */}
      {/* ======================================================== */}
      {screenMode === 'SUCCESS' && registrationData && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xl text-center space-y-5">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              Inscripción Formalizada
            </span>
            <h3 className="text-xl font-bold font-serif text-[#0A2540] mt-3">
              ¡Bienvenido a la Peña, {registrationData.name}!
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Has sido incorporado con éxito a la lista de espera oficial de la Peña Primitiva Tordueles.
            </p>
          </div>

          <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 text-left text-xs space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-500">Sello Temporal Oficial:</span>
              <strong className="font-mono text-slate-900">{registrationData.timestamp}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Condición Inicial:</span>
              <strong className="text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md">Suplente (Lista de Espera)</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Teléfono Registrado:</span>
              <strong className="font-mono text-slate-900">{registrationData.phone}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Reglamento Aceptado:</span>
              <strong className="text-emerald-700">✓ SÍ (Estatutos Art. 1-5)</strong>
            </div>
          </div>

          <div className="space-y-2">
            <button
              onClick={handleDownloadPdf}
              className="w-full py-3 px-4 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <FileDown className="w-4 h-4 text-[#FF6B00]" />
              <span>Descargar Copia del Reglamento (PDF)</span>
            </button>

            <button
              onClick={() => setScreenMode('ACCESS')}
              className="w-full py-3 px-4 rounded-xl bg-[#0A2540] hover:bg-[#163B61] text-white font-bold text-xs transition cursor-pointer"
            >
              Volver a la Pantalla de Acceso
            </button>
          </div>
        </div>
      )}

      {/* PLANTILLA OCULTA PARA IMPRESIÓN/PDF */}
      <div id="pdf-rules-printable-container" className="hidden p-8 bg-white text-slate-900 font-sans">
        <div className="flex items-center gap-4 border-b-2 border-[#0A2540] pb-4 mb-4">
          <Logo size={64} variant="full" />
          <div>
            <h1 className="text-xl font-bold text-[#0A2540]">Peña La Primitiva Tordueles</h1>
            <h2 className="text-xs uppercase tracking-wider text-[#FF6B00] font-bold">Reglamento Oficial y Estatutos Vinculantes</h2>
            <p className="text-[10px] text-slate-500">Tordueles (Burgos) • Documento Certificado para Socios</p>
          </div>
        </div>

        <div className="space-y-3 text-xs leading-relaxed text-slate-700">
          <p><strong>Artículo 1. Financiación, Cuotas y Ciclos de Juego:</strong> Cuota fija de 1,00 € semanal por jugador en bloques cerrados e indivisibles de 10 jornadas (10,00 € por ciclo). Renovación obligatoria entre jornada 7 y 9.</p>
          <p><strong>Artículo 2. Apuestas Múltiples Adaptables e Imparcialidad:</strong> Ajuste automático al presupuesto (7 núms: 7€, 8 núms: 28€, 5 núms: 44€, 9 núms: 84€, 10 núms: 210€, 11 núms: 462€). Combinaciones aleatorias de terminal oficial SELAE.</p>
          <p><strong>Artículo 3. Control de Lista de Espera, Inscripción y Plazos:</strong> Recopilación inicial de Nombre, Apellidos y Teléfono sin DNI ni IBAN por privacidad. Asignación por orden cronológico estricto. Plazo de 24 horas para suplentes para abonar. Ampliación y salto de nivel sujeto a evaluación manual del Administrador.</p>
          <p><strong>Artículo 4. Bajas, Pérdida de Antigüedad y Régimen de Fallecimiento:</strong> La baja extingue los derechos y la antigüedad. La plaza no se hereda; finalizado el ciclo abonado pasará al primer suplente y se liquidará formalmente a los herederos legales la parte proporcional neta de premios del ciclo.</p>
          <p><strong>Artículo 5. Reparto de Premios Menores vs Mayores:</strong> Premios &le; 2.000 € se integran íntegramente en el Fondo Común de la peña. Premios &gt; 2.000 € se tramitan en entidad bancaria con DNI de todos los socios activos, aplicando el 20% sobre el exceso de 40.000 € y deduciendo individualmente posibles gastos de transferencia.</p>
        </div>
      </div>
    </div>
  );
};
