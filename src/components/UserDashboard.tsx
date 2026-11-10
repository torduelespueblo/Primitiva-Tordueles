import React from 'react';
import { SyndicateSettings, TicketDraw, Player } from '../types/lottery';
import { TicketCard } from './TicketCard';
import {
  Wallet,
  Clock,
  AlertCircle,
  Users,
  Trophy,
  ArrowRight,
  Send,
  Sparkles,
  ShieldAlert,
  Info
} from 'lucide-react';

interface UserDashboardProps {
  settings: SyndicateSettings;
  tickets: TicketDraw[];
  players: Player[];
  onNavigateTab: (tab: string) => void;
}

export const UserDashboard: React.FC<UserDashboardProps> = ({
  settings,
  tickets,
  players,
  onNavigateTab,
}) => {
  const activePlayers = players.filter(p => p.status === 'TITULAR');
  const paidCount = activePlayers.filter(p => p.currentCyclePaid).length;
  const pendingRenewalCount = activePlayers.filter(
    p => p.renewalStatus === 'PENDIENTE' || p.renewalStatus === 'URGENTE_EXPIRA'
  ).length;

  // Boleto más reciente
  const currentTicket = tickets[0];
  const lastScrutinized = tickets.find(t => t.isScrutinized);

  const isRenewalWindow = settings.currentJornada >= 7 && settings.currentJornada <= 9;
  const isFinalDeadline = settings.currentJornada === 9;

  return (
    <div className="space-y-6">
      {/* Top Hero Cards: Bolsa de Premios & Ciclo Actual */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        {/* Card 1: Saldo en Bolsa de Premios Menores */}
        <div className="rounded-2xl bg-gradient-to-br from-[#0d253f] to-[#173e67] p-5 sm:p-6 text-white shadow-md relative overflow-hidden flex flex-col justify-between">
          <div className="absolute -right-4 -bottom-4 w-28 h-28 bg-white/5 rounded-full blur-xl pointer-events-none" />
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-sky-300 flex items-center gap-1.5">
                <Wallet className="w-4 h-4 text-sky-400" />
                Bolsa de Premios Menores
              </span>
              <span className="text-[10px] bg-sky-950/60 border border-sky-400/30 px-2 py-0.5 rounded-full text-sky-200">
                Fondo Común
              </span>
            </div>
            <div className="mt-3">
              <div className="text-3xl sm:text-4xl font-extrabold tracking-tight font-serif text-white">
                {settings.prizeFundBalance.toFixed(2)} €
              </div>
              <p className="mt-1 text-xs text-slate-300">
                Acumulado de premios menores (&le; 2.000 €). Separado de la cuota de apuestas.
              </p>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-white/10 text-[11px] text-sky-200/90 flex items-center justify-between">
            <span>Sin devolución en caso de baja</span>
            <button
              onClick={() => onNavigateTab('rules')}
              className="text-white underline hover:text-sky-300 text-xs font-semibold"
            >
              Ver Art. 5
            </button>
          </div>
        </div>

        {/* Card 2: Estado del Ciclo Vigente */}
        <div className="rounded-2xl bg-white border border-slate-200 p-5 sm:p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-blue-700" />
                Ciclo de Juego #{settings.currentCycle}
              </span>
              <span
                className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                  isRenewalWindow
                    ? 'bg-amber-100 text-amber-800 border border-amber-300 animate-pulse'
                    : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                {isRenewalWindow ? 'PLAZO RENOVACIÓN' : 'CICLO EN CURSO'}
              </span>
            </div>

            <div className="mt-3">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-extrabold text-[#0d253f]">
                  Jornada {settings.currentJornada}
                </span>
                <span className="text-sm font-semibold text-slate-500">
                  / {settings.cycleLength}
                </span>
              </div>

              {/* Progress bar */}
              <div className="mt-3 w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <div
                  className={`h-2.5 rounded-full transition-all duration-500 ${
                    isRenewalWindow ? 'bg-amber-500' : 'bg-[#0d253f]'
                  }`}
                  style={{ width: `${(settings.currentJornada / settings.cycleLength) * 100}%` }}
                />
              </div>

              <p className="mt-2 text-xs text-slate-600">
                Bloques indivisibles de 10 jornadas a <strong>1€/semana (10€/ciclo)</strong>.
              </p>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-xs flex items-center justify-between">
            <span className="text-slate-500">Renovaciones pendientes:</span>
            <span className={`font-bold ${pendingRenewalCount > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
              {pendingRenewalCount} socios
            </span>
          </div>
        </div>

        {/* Card 3: Socios Activos y Apuesta Adaptable */}
        <div className="rounded-2xl bg-white border border-slate-200 p-5 sm:p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-blue-800" />
                Socios & Presupuesto
              </span>
              <span className="text-xs font-bold text-slate-700">
                {activePlayers.length} Titulares
              </span>
            </div>

            <div className="mt-3">
              <div className="text-3xl sm:text-4xl font-extrabold text-[#0d253f]">
                {activePlayers.length * settings.weeklyFee} €
              </div>
              <p className="mt-1 text-xs text-slate-600">
                Presupuesto por jornada ajustado exactamente a los {activePlayers.length} socios al corriente.
              </p>

              <div className="mt-2.5 rounded-xl bg-slate-50 p-2.5 border border-slate-200 text-xs text-slate-700">
                <strong>Apuesta de hoy:</strong> Múltiple de 5 números ({activePlayers.length} apuestas oficiales SELAE).
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
            <button
              onClick={() => onNavigateTab('members')}
              className="text-xs font-bold text-blue-900 hover:text-blue-700 flex items-center gap-1"
            >
              <span>Ver listado de socios</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <span className="text-[10px] text-slate-400">100% Transparente</span>
          </div>
        </div>
      </div>

      {/* Renewal Deadline Urgent Alert if Jornadas 7-9 */}
      {isRenewalWindow && (
        <div className="rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 p-4 sm:p-5 text-white shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-white/20 shrink-0">
              <ShieldAlert className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base">
                {isFinalDeadline
                  ? '¡Última llamada de renovación! Fin de Jornada 9'
                  : `Periodo oficial de renovación abierto (Jornada ${settings.currentJornada} de 10)`}
              </h3>
              <p className="text-xs text-amber-100 mt-0.5">
                Según el Reglamento Oficial (Art. 3), quien no abone los 10€ del próximo ciclo antes del cierre de la jornada 9, jugará la jornada 10 como última y causará baja definitiva, perdiendo número de socio y antigüedad.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('members')}
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-white text-amber-900 font-bold text-xs hover:bg-amber-50 shadow-sm shrink-0"
          >
            Consultar Mi Estado de Pago
          </button>
        </div>
      )}

      {/* Current Active Ticket in Play */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-lg sm:text-xl font-bold font-serif text-[#0d253f] flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              Boleto Sellado de la Jornada en Curso
            </h2>
            <p className="text-xs text-slate-500">
              Validado por terminal oficial y publicado automáticamente a las 20:35 horas el día del sorteo.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
              <Send className="w-3 h-3 text-emerald-600" />
              Enviado a WhatsApp Peña
            </span>
          </div>
        </div>

        {currentTicket ? (
          <div className="max-w-xl">
            <TicketCard ticket={currentTicket} />
          </div>
        ) : (
          <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-500">
            No hay boletos activos registrados para la jornada actual.
          </div>
        )}
      </div>

      {/* Last Scrutiny Summary & Transparency Highlight */}
      {lastScrutinized && (
        <div className="rounded-2xl bg-white border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm sm:text-base text-slate-800 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-500" />
              Último Escrutinio Oficial (Jornada {lastScrutinized.jornadaNumber})
            </h3>
            <span className="text-xs text-slate-500">{lastScrutinized.drawDate}</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[11px] text-slate-500 block">Combinación Ganadora</span>
              <span className="text-xs sm:text-sm font-bold text-slate-800">
                {lastScrutinized.winningNumbers?.join(' · ')}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[11px] text-slate-500 block">Comp. / Reintegro</span>
              <span className="text-xs sm:text-sm font-bold text-slate-800">
                C: {lastScrutinized.complementario} | R: {lastScrutinized.reintegro}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[11px] text-slate-500 block">Aciertos Peña</span>
              <span className="text-xs sm:text-sm font-bold text-blue-900">
                {lastScrutinized.hitsCount} aciertos
              </span>
            </div>
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100">
              <span className="text-[11px] text-emerald-700 block">Premio Añadido</span>
              <span className="text-xs sm:text-sm font-extrabold text-emerald-800">
                +{lastScrutinized.totalPrize.toFixed(2)} €
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 text-xs text-slate-500">
            <span>Resultados comprobados con los escrutinios oficiales de SELAE.</span>
            <button
              onClick={() => onNavigateTab('tickets')}
              className="font-bold text-blue-900 hover:text-blue-700 flex items-center gap-1"
            >
              <span>Ver histórico completo</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Legal & Operational Notice */}
      <div className="rounded-2xl bg-slate-100 border border-slate-200 p-4 text-xs text-slate-600 flex items-start gap-3">
        <Info className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
        <div>
          <strong>Norma de Transparencia de Tordueles:</strong> Todos los resguardos se sellan y publican antes del sorteo en la app y en WhatsApp. Ninguna combinación es fija: se generan aleatoriamente en el terminal oficial de loterías para garantizar igualdad de oportunidades y máxima imparcialidad.
        </div>
      </div>
    </div>
  );
};
