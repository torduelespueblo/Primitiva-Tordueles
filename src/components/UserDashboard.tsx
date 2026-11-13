import React from 'react';
import { SyndicateSettings, TicketDraw, Player, PrizeHistoryEntry } from '../types/lottery';
import { TicketCard } from './TicketCard';
import {
  Wallet,
  Clock,
  Trophy,
  ArrowRight,
  Info,
  MessageCircle,
  CheckCircle2,
  Receipt
} from 'lucide-react';

interface UserDashboardProps {
  settings: SyndicateSettings;
  tickets: TicketDraw[];
  players: Player[];
  prizeHistory: PrizeHistoryEntry[];
  onNavigateTab: (tab: string) => void;
}

export const UserDashboard: React.FC<UserDashboardProps> = ({
  settings,
  tickets,
  prizeHistory,
  onNavigateTab,
}) => {
  const pendingTicket = tickets.find(t => !t.isScrutinized);
  const lastScrutinized = tickets.find(t => t.isScrutinized);

  const isRenewalWindow = settings.currentJornada >= 7 && settings.currentJornada <= 9;
  const isFinalDeadline = settings.currentJornada === 9;

  const whatsappNotificationText = encodeURIComponent(
    `COMUNICACIÓN DE PAGO - PEÑA PRIMITIVA TORDUELES\n\nHola Administrador, confirmo que he realizado el pago de la cuota de 10 € para la renovación del próximo Ciclo de 10 jornadas.\n\nFecha: ${new Date().toLocaleDateString('es-ES')}`
  );
  const whatsappUrl = `https://api.whatsapp.com/send?text=${whatsappNotificationText}`;

  return (
    <div className="space-y-8">
      {/* 1. LO PRIMERO: LA APUESTA QUE SE VA A JUGAR (SOLO PENDIENTE) */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <p className="text-sm font-extrabold uppercase tracking-wider text-[#FF6B00] tabular-nums">
              Sorteo en Curso · Jornada {pendingTicket?.jornadaNumber || settings.currentJornada} de {settings.cycleLength}
            </p>
            <h1 className="text-2xl sm:text-3xl font-black font-serif text-[#0A2540] mt-1">
              Apuesta Oficial de la Peña
            </h1>
            <p className="text-base text-slate-600 mt-1 max-w-2xl leading-relaxed">
              Combinación múltiple sellada por terminal oficial de SELAE pendiente de sorteo para todos los socios activos.
            </p>
          </div>
        </div>

        {pendingTicket ? (
          <div className="max-w-2xl">
            <TicketCard ticket={pendingTicket} />
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
        </div>
      </section>

      {/* 3. ÚLTIMO ESCRUTINIO OFICIAL (SOLO SI EXISTE UN SORTEO REAL ESCRUTADO) */}
      {lastScrutinized && (
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

      {/* Nota de Transparencia de la Peña */}
      <div className="rounded-2xl bg-white border border-slate-200 p-5 text-base text-slate-700 flex items-start gap-3.5">
        <Info className="w-6 h-6 text-[#0A2540] shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong className="text-[#0A2540]">Transparencia Primitiva Tordueles:</strong> Todos los resguardos se sellan por terminal aleatorio y se publican automáticamente antes de cada sorteo.
        </p>
      </div>
    </div>
  );
};
