import React, { useState } from 'react';
import { TicketDraw } from '../types/lottery';
import { Trophy, Calendar, CheckCircle2, Eye, Sparkles, X } from 'lucide-react';

interface TicketCardProps {
  ticket: TicketDraw;
}

export const TicketCard: React.FC<TicketCardProps> = ({ ticket }) => {
  const [showModal, setShowModal] = useState(false);

  const isMatched = (num: number) => {
    return ticket.isScrutinized && ticket.winningNumbers?.includes(num);
  };

  const isComplementario = (num: number) => {
    return ticket.isScrutinized && ticket.complementario === num;
  };

  const formattedDate = new Date(ticket.drawDate).toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <>
      <article className="rounded-3xl bg-white border border-slate-200 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition">
        {/* Ticket Header */}
        <div className="bg-[#0A2540] p-5 sm:p-6 text-white flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <span className="text-sm uppercase font-extrabold tracking-wider text-[#FF6B00] block tabular-nums">
              Ciclo {ticket.cycleNumber} · Jornada {ticket.jornadaNumber}/10
            </span>
            <div className="flex items-center gap-2 mt-1.5">
              <Calendar className="w-5 h-5 text-slate-300 shrink-0" />
              <span className="text-base sm:text-lg font-bold text-white capitalize leading-snug">
                {formattedDate}
              </span>
            </div>
          </div>
          <div className="text-left sm:text-right shrink-0">
            <span className="text-sm text-slate-300 font-medium block">Presupuesto</span>
            <span className="text-2xl font-black text-white tabular-nums">
              {ticket.cost.toFixed(2)} €
            </span>
          </div>
        </div>

        {/* Ticket Body */}
        <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between space-y-5 bg-white">
          {/* Apuesta Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-4 border-b border-slate-200 text-base">
            <div>
              <span className="text-sm font-semibold text-slate-500 block">Tipo de Apuesta</span>
              <span className="font-extrabold text-[#0A2540]">
                {ticket.betType === 'MULTIPLE_5'
                  ? 'Múltiple 5 Números (44 apuestas)'
                  : ticket.betType === 'MULTIPLE_9'
                  ? 'Múltiple 9 Números (84 apuestas)'
                  : `Múltiple ${ticket.numbersPlayedCount} números`}
              </span>
            </div>
            <div className="sm:text-right">
              <span className="text-sm font-semibold text-slate-500 block">Socios Activos</span>
              <span className="font-extrabold text-[#0A2540] tabular-nums">
                {ticket.activePlayersCount} (1 €/socio)
              </span>
            </div>
          </div>

          {/* Numbers Played Grid */}
          <div>
            <span className="text-base font-bold text-slate-700 block mb-3">
              Combinación Jugada Oficial
            </span>
            <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
              {ticket.playedNumbers.map((num) => {
                const matched = isMatched(num);
                const comp = isComplementario(num);
                return (
                  <span
                    key={num}
                    className={`flex items-center justify-center w-12 h-12 sm:w-13 sm:h-13 rounded-full font-extrabold text-lg sm:text-xl tabular-nums shadow-sm transition ${
                      matched
                        ? 'bg-emerald-600 text-white ring-4 ring-emerald-200 scale-105'
                        : comp
                        ? 'bg-[#FF6B00] text-white ring-3 ring-orange-200'
                        : 'bg-[#0A2540] text-white'
                    }`}
                  >
                    {num < 10 ? `0${num}` : num}
                  </span>
                );
              })}

              {/* Reintegro */}
              <div className="flex items-center gap-2 pl-3 ml-1 border-l-2 border-slate-200">
                <span className="text-sm font-extrabold uppercase text-slate-500">Reint.</span>
                <span
                  className={`flex items-center justify-center w-12 h-12 rounded-2xl font-black text-lg sm:text-xl tabular-nums ${
                    ticket.isScrutinized && ticket.hasReintegro
                      ? 'bg-emerald-600 text-white ring-4 ring-emerald-200'
                      : 'bg-orange-50 text-[#FF6B00] border-2 border-[#FF6B00]'
                  }`}
                >
                  {ticket.playedReintegro}
                </span>
              </div>
            </div>
          </div>

          {/* Official Scrutiny Results if scrutinized */}
          {ticket.isScrutinized ? (
            <div className="rounded-2xl bg-[#F4F6F9] border border-slate-200 p-4 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-base">
                <span className="font-extrabold text-[#0A2540] flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-[#FF6B00] shrink-0" />
                  Escrutinio Oficial SELAE
                </span>
                <span className="text-sm font-mono font-bold text-slate-700 tabular-nums">
                  {ticket.winningNumbers?.join(' - ')} (C: {ticket.complementario} · R: {ticket.reintegro})
                </span>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                <div>
                  <span className="text-base text-slate-800 font-bold block">
                    {ticket.prizeCategory || 'Resultado'}
                  </span>
                  <span className="text-sm text-slate-600 font-medium">
                    Aciertos: <strong className="text-[#0A2540]">{ticket.hitsCount ?? 0}</strong>{' '}
                    {ticket.hasReintegro ? '+ Reintegro' : ''}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xl sm:text-2xl font-black text-emerald-700 tabular-nums block">
                    {ticket.totalPrize > 0 ? `+${ticket.totalPrize.toFixed(2)} €` : '0,00 €'}
                  </span>
                  <span className="text-sm font-semibold text-slate-600 block">
                    {ticket.prizeType === 'MENOR_BOLSA'
                      ? 'Añadido a Bolsa'
                      : ticket.prizeType === 'MAYOR_BANCO'
                      ? '¡Cobro en Banco!'
                      : 'Sin premio'}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl bg-[#F4F6F9] border border-slate-200 p-4 text-base text-[#0A2540] flex flex-wrap items-center justify-between gap-2">
              <span className="flex items-center gap-2 font-bold">
                <Sparkles className="w-5 h-5 text-[#FF6B00] shrink-0" />
                Sorteo pendiente · Publicación 20:35 h
              </span>
              <span className="text-sm font-extrabold uppercase tracking-wide text-emerald-700">
                En Juego
              </span>
            </div>
          )}

          {/* Action to view sealed official ticket receipt */}
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="w-full inline-flex items-center justify-center gap-2.5 min-h-[48px] px-4 rounded-xl bg-[#0A2540] hover:bg-[#13375B] text-base font-bold text-white transition cursor-pointer shadow-xs"
          >
            <Eye className="w-5 h-5 text-[#FF6B00]" />
            <span>Ver Resguardo Oficial Sellado</span>
          </button>
        </div>
      </article>

      {/* Modal: Full Digital Receipt with SELAE Stamp */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 sm:p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-lg rounded-3xl bg-white shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="bg-[#0A2540] px-5 py-4 text-white flex items-center justify-between">
              <div>
                <h3 className="font-serif font-black text-xl text-white">
                  Resguardo Sellado Oficial
                </h3>
                <p className="text-sm text-slate-300 font-medium tabular-nums">
                  Jornada {ticket.jornadaNumber}/10 · Ciclo {ticket.cycleNumber}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="rounded-xl p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/10 cursor-pointer"
                aria-label="Cerrar resguardo"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Receipt Digital Inspection Card */}
            <div className="p-5 max-h-[75vh] overflow-y-auto space-y-4">
              <div className="border-2 border-dashed border-slate-300 rounded-2xl p-5 bg-amber-50/40 font-mono text-sm sm:text-base text-slate-900 space-y-4 shadow-inner">
                <div className="text-center pb-3 border-b border-slate-300 space-y-1">
                  <div className="text-base sm:text-lg font-black tracking-wider text-[#0A2540]">
                    LOTERÍAS Y APUESTAS DEL ESTADO
                  </div>
                  <div className="text-sm font-bold text-slate-700">
                    LA PRIMITIVA · TERMINAL OFICIAL Nº 28.490
                  </div>
                  <div className="text-sm text-slate-600">
                    RECEPTOR MIXTO BURGOS / TORDUELES
                  </div>
                </div>

                <div className="flex flex-wrap justify-between gap-2 text-sm font-semibold tabular-nums">
                  <span>SORTEO: {ticket.drawDate}</span>
                  <span>HORA: 20:35:12</span>
                </div>

                <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-2.5">
                  <div className="flex justify-between font-bold text-[#0A2540] text-base">
                    <span>APUESTA MÚLTIPLE</span>
                    <span className="tabular-nums">{ticket.cost.toFixed(2)} €</span>
                  </div>
                  <div className="text-sm text-slate-600">
                    Combinación oficial jugada:
                  </div>
                  <div className="text-xl font-black text-[#0A2540] tracking-wider tabular-nums">
                    {ticket.playedNumbers.map(n => (n < 10 ? `0${n}` : n)).join('  ')}
                  </div>
                  <div className="flex justify-between text-sm pt-2 border-t border-slate-100 font-semibold">
                    <span>REINTEGRO: [{ticket.playedReintegro}]</span>
                    <span>JOKER: SÍ (7 dígitos)</span>
                  </div>
                </div>

                <div className="pt-2 flex flex-col items-center gap-2">
                  <div className="h-12 w-full bg-slate-900/10 rounded-lg flex items-center justify-center tracking-widest text-sm text-slate-700 font-bold overflow-hidden">
                    |||||| | |||| |||||| |||| | |||||||| |||
                  </div>
                  <span className="text-xs sm:text-sm text-slate-600 font-semibold text-center">
                    CONTROL CC-84920-SELAE-PRIMITIVA-TORDUELES
                  </span>
                </div>

                <div className="p-3.5 bg-[#0A2540]/5 border border-[#0A2540]/20 rounded-xl text-center text-[#0A2540]">
                  <span className="text-sm font-extrabold uppercase tracking-wider block">
                    Resguardo Custodiado y Validado
                  </span>
                  <span className="text-sm font-semibold text-slate-700">
                    Peña La Primitiva Tordueles · {ticket.activePlayersCount} Socios Activos
                  </span>
                </div>
              </div>

              {ticket.isScrutinized && (
                <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-base text-emerald-950 space-y-1">
                  <div className="font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    Escrutinio validado por SELAE
                  </div>
                  <div>
                    Premio adjudicado: <strong className="tabular-nums">{ticket.totalPrize.toFixed(2)} €</strong> ({ticket.prizeCategory})
                  </div>
                </div>
              )}
            </div>

            <div className="bg-slate-50 px-5 py-4 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="w-full sm:w-auto px-6 min-h-[48px] rounded-xl bg-[#0A2540] hover:bg-[#13375B] text-base font-bold text-white transition cursor-pointer"
              >
                Cerrar Resguardo
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
