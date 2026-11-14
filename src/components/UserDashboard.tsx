import React from 'react';
import { SyndicateSettings, TicketDraw, Player, PrizeHistoryEntry } from '../types/lottery';
import { TicketCard } from './TicketCard';
import {
  isTicketPublishedNow,
  formatScheduledDateTimeLabel
} from '../services/ticketPublishService';
import {
  Wallet,
  Clock,
  Trophy,
  ArrowRight,
  Info,
  MessageCircle,
  CheckCircle2,
  Receipt,
  CalendarClock,
  BellRing,
  UserPlus,
  KeyRound,
  Lock,
  Clover,
  Users,
  LogOut
} from 'lucide-react';
import { solicitarPermisoYRegistrarToken } from '../services/pushNotifications';

interface UserDashboardProps {
  settings: SyndicateSettings;
  tickets: TicketDraw[];
  players: Player[];
  prizeHistory: PrizeHistoryEntry[];
  playerDni?: string;
  accessLevel?: 'VISITOR' | 'SUPLENTE' | 'TITULAR';
  memberName?: string;
  titularesCount?: number;
  suplentesCount?: number;
  ticketSummary?: {
    hayBoleto: boolean;
    programado: boolean;
    jornada?: number;
    fecha?: string;
  };
  googleAppsScriptUrl?: string;
  onNavigateTab: (tab: string) => void;
  onOpenRegister?: () => void;
  onOpenLogin?: () => void;
  onLogoutMember?: () => void;
}

export const UserDashboard: React.FC<UserDashboardProps> = ({
  settings,
  tickets,
  players,
  prizeHistory,
  playerDni = '',
  accessLevel = 'VISITOR',
  memberName = '',
  titularesCount,
  suplentesCount,
  ticketSummary,
  googleAppsScriptUrl,
  onNavigateTab,
  onOpenRegister,
  onOpenLogin,
  onLogoutMember,
}) => {
  const [pushActivating, setPushActivating] = React.useState(false);
  const [pushStatusMsg, setPushStatusMsg] = React.useState<string | null>(null);

  const isTitular = accessLevel === 'TITULAR';
  const displayTitulares =
    typeof titularesCount === 'number'
      ? titularesCount
      : players.filter(p => p.status === 'TITULAR').length;
  const displaySuplentes =
    typeof suplentesCount === 'number' ? suplentesCount : 0;

  const handleActivateMobilePush = async () => {
    setPushActivating(true);
    setPushStatusMsg(null);
    const res = await solicitarPermisoYRegistrarToken(playerDni, googleAppsScriptUrl);
    setPushActivating(false);
    setPushStatusMsg(res.message);
  };
  const pendingTicket = tickets.find(t => !t.isScrutinized && isTicketPublishedNow(t));
  const scheduledTicket = tickets.find(t => !t.isScrutinized && !isTicketPublishedNow(t));
  const lastScrutinized = tickets.find(t => t.isScrutinized);

  const isRenewalWindow = settings.currentJornada >= 7 && settings.currentJornada <= 9;
  const isFinalDeadline = settings.currentJornada === 9;

  const whatsappNotificationText = encodeURIComponent(
    `COMUNICACIÓN DE PAGO - PEÑA PRIMITIVA TORDUELES\n\nHola Administrador, confirmo que he realizado el pago de la cuota de 10 € para la renovación del próximo Ciclo de 10 jornadas.\n\nFecha: ${new Date().toLocaleDateString('es-ES')}`
  );
  const whatsappUrl = `https://api.whatsapp.com/send?text=${whatsappNotificationText}`;

  return (
    <div className="space-y-8">
      {/* AVISO DISCRETO PARA VISITANTES O FICHA DE IDENTIFICACIÓN ACTIVA */}
      {accessLevel === 'VISITOR' && (onOpenRegister || onOpenLogin) ? (
        <div className="rounded-2xl bg-gradient-to-r from-[#0A2540] to-[#13375B] p-4 sm:p-5 text-white shadow-sm border border-[#0A2540] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-[#FF6B00]">
              Modo Visitante · Acceso restringido
            </span>
            <p className="text-sm sm:text-base text-slate-100 leading-snug">
              Por privacidad de la peña, los números jugados y las listas están ocultos. Apúntate o entra con tu ficha para desbloquear tu acceso.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {onOpenRegister && (
              <button
                type="button"
                onClick={onOpenRegister}
                className="inline-flex items-center justify-center gap-2 px-4 min-h-[44px] rounded-xl bg-[#FF6B00] hover:bg-[#E55E00] text-white text-sm font-extrabold shadow-xs transition cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>Apuntarme ahora</span>
              </button>
            )}
            {onOpenLogin && (
              <button
                type="button"
                onClick={onOpenLogin}
                className="inline-flex items-center justify-center gap-2 px-4 min-h-[44px] rounded-xl bg-white/15 hover:bg-white/25 text-white text-sm font-bold transition cursor-pointer"
              >
                <KeyRound className="w-4 h-4 text-[#FF6B00]" />
                <span>Ya estoy registrado</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="rounded-2xl bg-white border border-slate-200 px-4 py-3 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-2.5 text-sm sm:text-base">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="text-slate-700">
              Conectado como{' '}
              <strong className="text-[#0A2540]">{memberName || 'Socio'}</strong>{' '}
              <span
                className={`ml-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-extrabold ${
                  isTitular
                    ? 'bg-emerald-100 text-emerald-900'
                    : 'bg-orange-100 text-[#FF6B00]'
                }`}
              >
                {isTitular ? 'Titular' : 'Suplente (Lista de Espera)'}
              </span>
            </span>
          </div>
          {onLogoutMember && (
            <button
              type="button"
              onClick={onLogoutMember}
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-slate-500 hover:text-[#0A2540] cursor-pointer px-2.5 py-1.5 rounded-lg hover:bg-slate-100 transition"
            >
              <LogOut className="w-4 h-4" />
              <span>Cambiar / Salir</span>
            </button>
          )}
        </div>
      )}

      {/* 1. LO PRIMERO: LA APUESTA QUE SE VA A JUGAR (SOLO VISIBLE PARA TITULARES) */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <p className="text-sm font-extrabold uppercase tracking-wider text-[#FF6B00] tabular-nums">
              Sorteo en Curso · Jornada {(isTitular ? pendingTicket?.jornadaNumber : ticketSummary?.jornada) || settings.currentJornada} de {settings.cycleLength}
            </p>
            <h1 className="text-2xl sm:text-3xl font-black font-serif text-[#0A2540] mt-1">
              Apuesta Oficial de la Peña
            </h1>
            <p className="text-base text-slate-600 mt-1 max-w-2xl leading-relaxed">
              {isTitular
                ? 'Combinación múltiple sellada por terminal oficial de SELAE pendiente de sorteo para todos los socios activos.'
                : 'Combinación múltiple oficial de La Primitiva sellada por terminal de SELAE para los socios titulares del ciclo.'}
            </p>
          </div>
        </div>

        {!isTitular ? (
          /* TARJETA OCULTA CON ICONO DE LA PRIMITIVA PARA VISITANTES Y SUPLENTES */
          <div className="max-w-2xl rounded-3xl bg-white border-2 border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div className="flex items-center gap-3.5">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center shrink-0">
                  <Clover className="w-8 h-8" />
                </div>
                <div>
                  <span className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-[#FF6B00]">
                    <Lock className="w-3.5 h-3.5" /> Combinación Reservada
                  </span>
                  <h2 className="text-lg sm:text-xl font-black font-serif text-[#0A2540]">
                    {ticketSummary?.hayBoleto
                      ? ticketSummary.programado
                        ? `Resguardo Programado · Jornada ${ticketSummary.jornada || settings.currentJornada}`
                        : `Boleto Oficial Sellado · Jornada ${ticketSummary.jornada || settings.currentJornada}`
                      : `Próximo Sorteo · Jornada ${settings.currentJornada}/${settings.cycleLength}`}
                  </h2>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 self-start sm:self-center px-3 py-1.5 rounded-full bg-slate-100 text-slate-700 text-xs font-bold">
                <Lock className="w-3.5 h-3.5 text-[#FF6B00]" />
                Solo Titulares
              </span>
            </div>

            {/* Bolas ocultas con ? representando el juego de La Primitiva */}
            <div className="rounded-2xl bg-[#F4F6F9] border border-slate-200 p-5 text-center space-y-3">
              <p className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                Números y Resguardo Protegidos
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3">
                {[1, 2, 3, 4, 5, 6].map(slot => (
                  <div
                    key={`masked-ball-${slot}`}
                    className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-[#0A2540] text-white font-black text-lg flex items-center justify-center shadow-xs border-2 border-white"
                  >
                    ?
                  </div>
                ))}
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-[#FF6B00] text-white font-black text-base flex items-center justify-center shadow-xs border-2 border-white ml-1">
                  R?
                </div>
              </div>
            </div>

            <p className="text-sm sm:text-base text-slate-600 leading-relaxed text-center">
              {accessLevel === 'SUPLENTE'
                ? 'Estás apuntado en la lista de espera como Suplente. Los números jugados cada semana y la imagen del resguardo están reservados exclusivamente a los Socios Titulares activos.'
                : 'Por privacidad, los números que se juegan cada semana y la foto del resguardo solo son visibles para los Socios Titulares. Puedes apuntarte en la lista de espera o entrar con tu ficha.'}
            </p>

            {accessLevel === 'VISITOR' && (onOpenRegister || onOpenLogin) && (
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-1">
                {onOpenRegister && (
                  <button
                    type="button"
                    onClick={onOpenRegister}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 min-h-[46px] rounded-xl bg-[#FF6B00] hover:bg-[#E55E00] text-white font-extrabold text-sm sm:text-base shadow-sm transition cursor-pointer"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Apuntarme en Lista</span>
                  </button>
                )}
                {onOpenLogin && (
                  <button
                    type="button"
                    onClick={onOpenLogin}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 min-h-[46px] rounded-xl bg-[#0A2540] hover:bg-[#13375B] text-white font-bold text-sm sm:text-base shadow-sm transition cursor-pointer"
                  >
                    <KeyRound className="w-4 h-4 text-[#FF6B00]" />
                    <span>Ya soy socio (DNI / Móvil)</span>
                  </button>
                )}
              </div>
            )}
          </div>
        ) : pendingTicket ? (
          <div className="max-w-2xl">
            <TicketCard ticket={pendingTicket} googleAppsScriptUrl={googleAppsScriptUrl} />
          </div>
        ) : scheduledTicket ? (
          <div className="p-7 sm:p-8 text-center bg-white rounded-3xl border border-amber-200 text-slate-700 space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 text-[#FF6B00] mx-auto flex items-center justify-center">
              <CalendarClock className="w-8 h-8" />
            </div>
            <p className="text-lg sm:text-xl font-extrabold text-[#0A2540]">
              Resguardo programado para el día del sorteo
            </p>
            <p className="text-base text-slate-600 max-w-xl mx-auto leading-relaxed">
              El resguardo oficial ya ha sido validado y programado por administración. Se publicará automáticamente en la App y en el grupo de WhatsApp el{' '}
              <strong className="text-[#0A2540]">
                {formatScheduledDateTimeLabel(scheduledTicket.publishAt, scheduledTicket.drawDate)}
              </strong>.
            </p>
            {lastScrutinized && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => onNavigateTab('tickets')}
                  className="inline-flex items-center gap-2 px-4 min-h-[44px] rounded-xl bg-[#0A2540] hover:bg-[#13375B] text-white text-sm sm:text-base font-bold transition cursor-pointer"
                >
                  <span>Ver últimos boletos jugados</span>
                  <ArrowRight className="w-4 h-4 text-[#FF6B00]" />
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 text-slate-600 space-y-3">
            <Receipt className="w-12 h-12 text-slate-300 mx-auto" />
            <p className="text-lg font-bold text-[#0A2540]">
              Pendiente de publicar el boleto del próximo sorteo
            </p>
            <p className="text-base text-slate-600 max-w-xl mx-auto">
              Cuando el administrador suba el resguardo oficial sellado en el terminal de SELAE para la próxima jornada, aparecerá aquí. Los boletos ya jugados están en «Boletos».
            </p>
            {lastScrutinized && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => onNavigateTab('tickets')}
                  className="inline-flex items-center gap-2 px-4 min-h-[44px] rounded-xl bg-[#0A2540] hover:bg-[#13375B] text-white text-sm sm:text-base font-bold transition cursor-pointer"
                >
                  <span>Ver últimos boletos jugados</span>
                  <ArrowRight className="w-4 h-4 text-[#FF6B00]" />
                </button>
              </div>
            )}
          </div>
        )}
      </section>

      {/* 2. SECCIÓN DEL CICLO DE JUEGO */}
      <section className="rounded-3xl bg-white border border-slate-200 p-5 sm:p-7 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#0A2540] text-white flex items-center justify-center shrink-0">
              <Clock className="w-6 h-6 text-[#FF6B00]" />
            </div>
            <div>
              <span className="text-sm font-bold uppercase tracking-wider text-slate-500 block">
                Ciclo de Juego Actual
              </span>
              <h2 className="text-2xl font-black font-serif text-[#0A2540] tabular-nums">
                Ciclo #{settings.currentCycle}
              </h2>
            </div>
          </div>

          <span
            className={`text-sm sm:text-base font-extrabold uppercase tracking-wide ${
              isRenewalWindow ? 'text-[#FF6B00]' : 'text-emerald-700'
            }`}
          >
            {isRenewalWindow
              ? isFinalDeadline
                ? 'Último día de renovación (J9)'
                : `Ventana de renovación (J${settings.currentJornada}/10)`
              : 'Ciclo en curso'}
          </span>
        </div>

        {/* Progreso del Ciclo de 10 Jornadas */}
        <div className="space-y-2.5">
          <div className="flex flex-wrap items-baseline justify-between gap-2 text-base">
            <span className="text-slate-700 font-semibold">
              Progreso (1 €/semana · 10 € por ciclo)
            </span>
            <span className="font-black text-[#0A2540] tabular-nums">
              Jornada {settings.currentJornada} de {settings.cycleLength}
            </span>
          </div>

          <div className="w-full bg-slate-200 rounded-full h-4 overflow-hidden">
            <div
              className={`h-4 rounded-full transition-all duration-500 ${
                isRenewalWindow ? 'bg-[#FF6B00]' : 'bg-[#0A2540]'
              }`}
              style={{ width: `${(settings.currentJornada / settings.cycleLength) * 100}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-sm text-slate-600 font-medium pt-0.5">
            <span>Inicio (J1)</span>
            <span className={isRenewalWindow ? 'font-extrabold text-[#FF6B00]' : ''}>
              Renovación (J7 – J9)
            </span>
            <span>Cierre (J10)</span>
          </div>
        </div>

        {/* Cifras globales de jugadores (sin nombres) */}
        <div className="grid grid-cols-2 gap-3 pt-1 tabular-nums">
          <div className="rounded-2xl bg-[#F4F6F9] border border-slate-200 p-3.5 sm:p-4 flex items-center gap-3">
            <Users className="w-5 h-5 text-[#0A2540] shrink-0" />
            <div>
              <span className="text-xs font-bold uppercase text-slate-500 block">
                Titulares Activos
              </span>
              <span className="text-lg sm:text-xl font-black text-[#0A2540]">
                {displayTitulares}
              </span>
            </div>
          </div>
          <div className="rounded-2xl bg-orange-50/70 border border-orange-200 p-3.5 sm:p-4 flex items-center gap-3">
            <Clock className="w-5 h-5 text-[#FF6B00] shrink-0" />
            <div>
              <span className="text-xs font-bold uppercase text-slate-600 block">
                Lista de Espera
              </span>
              <span className="text-lg sm:text-xl font-black text-[#0A2540]">
                {displaySuplentes}
              </span>
            </div>
          </div>
        </div>

        {/* Aviso de renovación & WhatsApp */}
        <div className="pt-4 border-t border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <p className="text-base text-slate-700 max-w-xl leading-relaxed">
            {isRenewalWindow ? (
              <span className="text-[#0A2540] font-semibold">
                El pago del nuevo bloque debe realizarse entre las jornadas 7 y 9 para conservar tu plaza y antigüedad.
              </span>
            ) : (
              <span>
                Cada ciclo cubre 10 semanas indivisibles. La renovación se abona entre la jornada 7 y la 9.
              </span>
            )}
          </p>

          {isTitular && (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2.5 px-5 min-h-[52px] rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-base shadow-sm transition text-center shrink-0"
              title="Avisar al administrador tras realizar el ingreso o Bizum"
            >
              <MessageCircle className="w-5 h-5 text-white shrink-0" />
              <span>Comunicar pago por WhatsApp</span>
            </a>
          )}
        </div>
      </section>

      {/* 3. ÚLTIMO ESCRUTINIO OFICIAL (SOLO PARA TITULARES) */}
      {isTitular && lastScrutinized && (
        <section className="rounded-3xl bg-white border border-slate-200 p-5 sm:p-7 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-orange-50 text-[#FF6B00] flex items-center justify-center shrink-0">
                <Trophy className="w-6 h-6" />
              </div>
              <div>
                <h2 className="font-serif font-black text-xl text-[#0A2540]">
                  Último Escrutinio Oficial SELAE
                </h2>
                <p className="text-sm sm:text-base text-slate-600 font-medium tabular-nums">
                  Jornada {lastScrutinized.jornadaNumber} · {lastScrutinized.drawDate}
                </p>
              </div>
            </div>

            <div className="inline-flex items-center gap-2 px-4 min-h-[44px] rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-base font-extrabold tabular-nums">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>Premio: {lastScrutinized.totalPrize.toFixed(2)} €</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div className="p-4 rounded-2xl bg-[#F4F6F9] border border-slate-200">
              <span className="text-sm font-semibold text-slate-500 block">Combinación Ganadora</span>
              <span className="text-base sm:text-lg font-extrabold text-[#0A2540] tabular-nums mt-1 block">
                {lastScrutinized.winningNumbers?.join(' · ') || 'En revisión'}
              </span>
            </div>
            <div className="p-4 rounded-2xl bg-[#F4F6F9] border border-slate-200">
              <span className="text-sm font-semibold text-slate-500 block">Comp. / Reintegro</span>
              <span className="text-base sm:text-lg font-extrabold text-[#0A2540] tabular-nums mt-1 block">
                C: {lastScrutinized.complementario ?? '-'} · R: {lastScrutinized.reintegro ?? '-'}
              </span>
            </div>
            <div className="p-4 rounded-2xl bg-[#F4F6F9] border border-slate-200">
              <span className="text-sm font-semibold text-slate-500 block">Aciertos Peña</span>
              <span className="text-base sm:text-lg font-extrabold text-[#0A2540] tabular-nums mt-1 block">
                {lastScrutinized.hitsCount ?? 0} aciertos
              </span>
            </div>
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
              <span className="text-sm font-semibold text-emerald-800 block">Destino del Premio</span>
              <span className="text-base sm:text-lg font-extrabold text-emerald-900 mt-1 block">
                {lastScrutinized.totalPrize > 2000 ? 'Reparto Bancario' : 'Bolsa Común'}
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 text-base text-slate-600">
            <span>Resultados certificados contra escrutinios oficiales de SELAE.</span>
            <button
              type="button"
              onClick={() => onNavigateTab('tickets')}
              className="font-extrabold text-[#0A2540] hover:text-[#FF6B00] inline-flex items-center gap-2 min-h-[44px] cursor-pointer transition"
            >
              <span>Ver últimos 4 boletos</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </section>
      )}

      {/* 4. BOTE TOTAL DE PREMIOS OBTENIDOS */}
      <section className="rounded-3xl bg-[#0A2540] p-6 sm:p-8 text-white shadow-md relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <span className="text-sm font-extrabold uppercase tracking-wider text-[#FF6B00] flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              Bote Total de Premios Obtenidos
            </span>
            <div className="mt-2 text-4xl sm:text-5xl font-black tracking-tight font-serif text-emerald-400 tabular-nums">
              {settings.prizeFundBalance.toFixed(2)} €
            </div>
            <p className="mt-2.5 text-base text-slate-200 max-w-2xl leading-relaxed">
              Importe total acumulado de los premios obtenidos por la peña ({prizeHistory.length}{' '}
              {prizeHistory.length === 1 ? 'premio registrado' : 'premios registrados'}). Separado estrictamente de las cuotas semanales.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row md:flex-col items-stretch sm:items-center md:items-end gap-3 shrink-0">
            <button
              type="button"
              onClick={() => onNavigateTab('tickets')}
              className="inline-flex items-center justify-center gap-2 px-5 min-h-[46px] rounded-xl bg-white/15 hover:bg-white/25 text-base font-bold text-white transition cursor-pointer"
            >
              <span>Histórico de Premios</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onNavigateTab('rules')}
              className="inline-flex items-center justify-center gap-2 px-5 min-h-[46px] rounded-xl bg-[#FF6B00] hover:bg-[#E55E00] text-base font-bold text-white transition cursor-pointer"
            >
              <span>Reglamento Art. 5</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>

      {/* Nota de Transparencia de la Peña + Activación Discreta de Avisos Push */}
      <div className="rounded-2xl bg-white border border-slate-200 p-5 text-base text-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <Info className="w-6 h-6 text-[#0A2540] shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="leading-relaxed">
              <strong className="text-[#0A2540]">Transparencia Primitiva Tordueles:</strong> Todos los resguardos se sellan por terminal aleatorio y se publican automáticamente antes de cada sorteo.
            </p>
            {pushStatusMsg && (
              <p className="text-sm font-semibold text-[#0A2540]">{pushStatusMsg}</p>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={handleActivateMobilePush}
          disabled={pushActivating}
          className="inline-flex items-center justify-center gap-2 px-4 min-h-[42px] rounded-xl border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-[#0A2540] text-sm font-bold transition cursor-pointer shrink-0 disabled:opacity-60"
        >
          <BellRing className="w-4 h-4 text-[#FF6B00]" />
          <span>{pushActivating ? 'Activando...' : 'Activar Avisos en este Móvil'}</span>
        </button>
      </div>
    </div>
  );
};
