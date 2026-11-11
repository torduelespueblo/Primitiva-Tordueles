import React from 'react';
import { SyndicateSettings, TicketDraw, Player } from '../types/lottery';
import { TicketCard } from './TicketCard';
import {
  Wallet,
  Clock,
  Trophy,
  ArrowRight,
  Send,
  Sparkles,
  ShieldAlert,
  Info,
  MessageCircle,
  CheckCircle2,
  Receipt
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

  // Boleto de la jornada en curso (primero de la lista)
  const currentTicket = tickets[0];
  // Último sorteo escrutado
  const lastScrutinized = tickets.find(t => t.isScrutinized);

  const isRenewalWindow = settings.currentJornada >= 7 && settings.currentJornada <= 9;
  const isFinalDeadline = settings.currentJornada === 9;

  // Enlace a WhatsApp para comunicar el pago del nuevo bloque de 10 jornadas
  const whatsappNotificationText = encodeURIComponent(
    `🌲 *COMUNICACIÓN DE PAGO - PEÑA PRIMITIVA TORDUELES* 🌲\n\nHola Administrador, confirmo que he realizado el pago de la cuota de 10 € para la renovación del próximo Ciclo de 10 jornadas.\n\n*Fecha:* ${new Date().toLocaleDateString('es-ES')}`
  );
  const whatsappUrl = `https://api.whatsapp.com/send?text=${whatsappNotificationText}`;

  return (
    <div className="space-y-6">
      {/* 1. LO PRIMERO: LA APUESTA QUE SE VA A JUGAR */}
      <section className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200">
                Prioridad Nº 1
              </span>
              <span className="text-xs text-slate-500 font-medium">
                Jornada {currentTicket?.jornadaNumber || settings.currentJornada} de 10
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black font-serif text-[#0d253f] flex items-center gap-2 mt-1">
              <Sparkles className="w-5 h-5 text-amber-500" />
              Apuesta Oficial de la Peña
            </h1>
            <p className="text-xs text-slate-500">
              Combinación múltiple validada por terminal oficial y publicada automáticamente para los miembros activos.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
              <Send className="w-3 h-3 text-emerald-600" />
              Resguardo Oficial SELAE
            </span>
          </div>
        </div>

        {currentTicket ? (
          <div className="max-w-xl">
            <TicketCard ticket={currentTicket} />
          </div>
        ) : (
          <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 space-y-2">
            <Receipt className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-sm font-semibold text-slate-700">
              Boleto de la Jornada {settings.currentJornada} en proceso de sellado
            </p>
            <p className="text-xs text-slate-500">
              El administrador validará la combinación en el terminal oficial y se publicará a las 20:35 h.
            </p>
          </div>
        )}
      </section>

      {/* 2. DEBAJO: SECCIÓN DEL CICLO DE JUEGO */}
      <section className="rounded-2xl bg-white border border-slate-200 p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-800 flex items-center justify-center font-bold">
              <Clock className="w-5 h-5 text-blue-700" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Ciclo de Juego Actual
              </span>
              <h2 className="text-lg font-bold text-[#0d253f]">
                Ciclo #{settings.currentCycle}
              </h2>
            </div>
          </div>

          <span
            className={`self-start sm:self-auto text-xs font-bold px-3 py-1 rounded-full border ${
              isRenewalWindow
                ? 'bg-amber-50 text-amber-800 border-amber-300 animate-pulse'
                : 'bg-emerald-50 text-emerald-800 border-emerald-200'
            }`}
          >
            {isRenewalWindow
              ? isFinalDeadline
                ? '¡ÚLTIMO DÍA RENOVACIÓN (J9)!'
                : `VENTANA DE RENOVACIÓN (J${settings.currentJornada}/10)`
              : 'CICLO EN CURSO'}
          </span>
        </div>

        {/* Progreso del Ciclo de 10 Jornadas */}
        <div className="space-y-2">
          <div className="flex items-baseline justify-between text-xs">
            <span className="text-slate-600 font-medium">
              Evolución del ciclo (1€/semana = 10€ por bloque)
            </span>
            <span className="font-extrabold text-[#0d253f]">
              Jornada {settings.currentJornada} de {settings.cycleLength}
            </span>
          </div>

          <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
            <div
              className={`h-3 rounded-full transition-all duration-500 ${
                isRenewalWindow ? 'bg-amber-500' : 'bg-[#0d253f]'
              }`}
              style={{ width: `${(settings.currentJornada / settings.cycleLength) * 100}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
            <span>Inicio del Ciclo (J1)</span>
            <span className={isRenewalWindow ? 'font-bold text-amber-700' : ''}>
              Plazo Renovación (J7 - J9)
            </span>
            <span>Cierre Ciclo (J10)</span>
          </div>
        </div>

        {/* Aviso de renovación & BOTÓN PARA COMUNICAR PAGO AL ADMIN POR WHATSAPP */}
        <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p className="text-xs text-slate-600 max-w-md">
            {isRenewalWindow ? (
              <span className="text-amber-900 font-semibold">
                ⚠️ Recuerda que el pago de la cuota del nuevo bloque debe realizarse entre las jornadas 7 y 9 para no causar baja y conservar la antigüedad.
              </span>
            ) : (
              <span>
                Cada ciclo cubre 10 semanas de apuestas indivisibles. La renovación se abona obligatoriamente entre la jornada 7 y 9.
              </span>
            )}
          </p>

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition text-center sm:text-left"
            title="Avisar al administrador tras realizar el ingreso o Bizum"
          >
            <MessageCircle className="w-4 h-4 text-emerald-100 shrink-0" />
            <span>Enviar WhatsApp al admin una vez hecho el pago de las siguientes 10 jornadas</span>
          </a>
        </div>
      </section>

      {/* 3. COMBINACIÓN PENDIENTE DE JUGARSE Y ÚLTIMO ESCRUTINIO CON POSIBLE PREMIO */}
      {lastScrutinized && (
        <section className="rounded-2xl bg-white border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <Trophy className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  Último Escrutinio Oficial SELAE
                </h3>
                <p className="text-xs text-slate-500">
                  Jornada {lastScrutinized.jornadaNumber} • {lastScrutinized.drawDate}
                </p>
              </div>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Premio: {lastScrutinized.totalPrize.toFixed(2)} €</span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[11px] text-slate-500 block">Combinación Ganadora</span>
              <span className="text-xs sm:text-sm font-bold text-slate-800">
                {lastScrutinized.winningNumbers?.join(' · ') || 'En revisión'}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[11px] text-slate-500 block">Comp. / Reintegro</span>
              <span className="text-xs sm:text-sm font-bold text-slate-800">
                C: {lastScrutinized.complementario ?? '-'} | R: {lastScrutinized.reintegro ?? '-'}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[11px] text-slate-500 block">Aciertos Peña</span>
              <span className="text-xs sm:text-sm font-bold text-blue-900">
                {lastScrutinized.hitsCount ?? 0} aciertos
              </span>
            </div>
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100">
              <span className="text-[11px] text-emerald-700 block">Destino del Premio</span>
              <span className="text-xs sm:text-sm font-extrabold text-emerald-800">
                {lastScrutinized.totalPrize > 2000 ? 'Reparto Bancario' : 'Bolsa Común'}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1 text-xs text-slate-500">
            <span>Resultados certificados contra los escrutinios oficiales de SELAE.</span>
            <button
              onClick={() => onNavigateTab('tickets')}
              className="font-bold text-blue-900 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
            >
              <span>Ver histórico completo</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </section>
      )}

      {/* 4. DE MOMENTO LO ÚLTIMO: LA BOLSA DE PREMIOS MENORES */}
      <section className="rounded-2xl bg-gradient-to-br from-[#0d253f] to-[#173e67] p-5 sm:p-6 text-white shadow-md relative overflow-hidden">
        <div className="absolute -right-4 -bottom-4 w-36 h-36 bg-white/5 rounded-full blur-xl pointer-events-none" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-sky-300 flex items-center gap-1.5">
                <Wallet className="w-4 h-4 text-sky-400" />
                Bolsa de Premios Menores
              </span>
              <span className="text-[10px] bg-sky-950/60 border border-sky-400/30 px-2 py-0.5 rounded-full text-sky-200">
                Fondo Común Acumulado
              </span>
            </div>
            <div className="mt-2 text-3xl sm:text-4xl font-extrabold tracking-tight font-serif text-white">
              {settings.prizeFundBalance.toFixed(2)} €
            </div>
            <p className="mt-1 text-xs text-slate-300 max-w-xl">
              Fondo acumulado de todos los premios menores o iguales a 2.000 € obtenidos por la peña. Separado estrictamente de las cuotas de apuestas periódicas.
            </p>
          </div>

          <div className="sm:text-right shrink-0">
            <button
              onClick={() => onNavigateTab('rules')}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-semibold text-white transition"
            >
              <span>Reglamento Art. 5</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <p className="text-[10px] text-sky-200/80 mt-1.5">
              Sin derecho a devolución en caso de baja
            </p>
          </div>
        </div>
      </section>

      {/* Nota de Transparencia de la Peña */}
      <div className="rounded-2xl bg-slate-100 border border-slate-200 p-4 text-xs text-slate-600 flex items-start gap-3">
        <Info className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
        <div>
          <strong>Transparencia Primitiva Tordueles:</strong> Todos los resguardos se sellan por terminal aleatorio y se publican automáticamente antes de cada sorteo.
        </div>
      </div>
    </div>
  );
};
