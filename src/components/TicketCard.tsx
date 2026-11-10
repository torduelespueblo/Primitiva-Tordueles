import React, { useState } from 'react';
import { TicketDraw } from '../types/lottery';
import { Trophy, Calendar, CheckCircle2, ZoomIn, Eye, Sparkles, Award } from 'lucide-react';

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

  return (
    <>
      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition">
        {/* Ticket Header */}
        <div className="bg-[#0d253f] p-4 text-white flex items-center justify-between border-b border-blue-950">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-sky-300">
              Ciclo {ticket.cycleNumber} • Jornada {ticket.jornadaNumber}/10
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              <Calendar className="w-3.5 h-3.5 text-slate-300" />
              <span className="text-xs font-semibold text-slate-100">
                Sorteo: {new Date(ticket.drawDate).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-slate-300 block">Presupuesto</span>
            <span className="text-sm font-bold text-sky-400">{ticket.cost.toFixed(2)} €</span>
          </div>
        </div>

        {/* Ticket Body: Simulated SELAE Boleto */}
        <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-4 bg-gradient-to-b from-amber-50/20 to-white">
          {/* Apuesta Info */}
          <div className="flex items-center justify-between text-xs pb-3 border-b border-dashed border-slate-200">
            <div>
              <span className="text-slate-500 block">Tipo de Apuesta:</span>
              <span className="font-bold text-slate-800">
                {ticket.betType === 'MULTIPLE_5'
                  ? 'Múltiple 5 Números (44 apuestas)'
                  : ticket.betType === 'MULTIPLE_9'
                  ? 'Múltiple 9 Números (84 apuestas)'
                  : `Múltiple ${ticket.numbersPlayedCount} números`}
              </span>
            </div>
            <div className="text-right">
              <span className="text-slate-500 block">Socios activos:</span>
              <span className="font-bold text-slate-800">{ticket.activePlayersCount} (1€/socio)</span>
            </div>
          </div>

          {/* Numbers Played Grid */}
          <div>
            <span className="text-xs font-semibold text-slate-600 block mb-2">
              Combinación Jugada Oficial:
            </span>
            <div className="flex flex-wrap items-center gap-2">
              {ticket.playedNumbers.map((num) => {
                const matched = isMatched(num);
                const comp = isComplementario(num);
                return (
                  <span
                    key={num}
                    className={`flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full font-bold text-sm shadow-xs transition ${
                      matched
                        ? 'bg-emerald-600 text-white ring-3 ring-emerald-300 scale-105 animate-pulse'
                        : comp
                        ? 'bg-amber-500 text-white ring-2 ring-amber-300'
                        : 'bg-[#0d253f] text-white'
                    }`}
                  >
                    {num < 10 ? `0${num}` : num}
                  </span>
                );
              })}

              {/* Reintegro */}
              <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200">
                <span className="text-[10px] font-bold text-slate-500">R:</span>
                <span
                  className={`flex items-center justify-center w-8 h-8 rounded-lg font-bold text-xs ${
                    ticket.isScrutinized && ticket.hasReintegro
                      ? 'bg-emerald-500 text-white ring-2 ring-emerald-300'
                      : 'bg-sky-100 text-sky-900 border border-sky-300'
                  }`}
                >
                  {ticket.playedReintegro}
                </span>
              </div>
            </div>
          </div>

          {/* Official Scrutiny Results if scrutinized */}
          {ticket.isScrutinized ? (
            <div className="rounded-xl bg-slate-50 border border-slate-200 p-3.5 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700 flex items-center gap-1.5">
                  <Trophy className="w-4 h-4 text-amber-500" />
                  Escrutinio Oficial SELAE:
                </span>
                <span className="text-[11px] text-slate-500">
                  {ticket.winningNumbers?.join(' - ')} (C: {ticket.complementario} • R: {ticket.reintegro})
                </span>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                <div>
                  <span className="text-xs text-slate-600 font-medium block">
                    {ticket.prizeCategory || 'Resultado'}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Aciertos: <strong>{ticket.hitsCount ?? 0}</strong> {ticket.hasReintegro ? '+ Reintegro' : ''}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-sm sm:text-base font-extrabold text-emerald-700">
                    {ticket.totalPrize > 0 ? `+${ticket.totalPrize.toFixed(2)} €` : '0,00 €'}
                  </span>
                  <span className="text-[10px] block text-slate-500">
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
            <div className="rounded-xl bg-blue-50 border border-blue-200 p-3 text-xs text-blue-900 flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-medium">
                <Sparkles className="w-4 h-4 text-blue-600 animate-spin" />
                Sorteo pendiente • Publicación 20:35 h
              </span>
              <span className="text-[11px] font-bold bg-white px-2 py-0.5 rounded-full border border-blue-200 text-blue-700">
                En Juego
              </span>
            </div>
          )}

          {/* Action to view / zoom sealed official ticket receipt */}
          <button
            onClick={() => setShowModal(true)}
            className="w-full inline-flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition"
          >
            <Eye className="w-3.5 h-3.5 text-blue-800" />
            <span>Ver Resguardo Oficial Sellado</span>
          </button>
        </div>
      </div>

      {/* Modal: Full Digital Receipt with SELAE Stamp */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 sm:p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="bg-[#0d253f] px-5 py-4 text-white flex items-center justify-between">
              <div>
                <h3 className="font-serif font-bold text-base text-white">
                  Resguardo Sellado Oficial
                </h3>
                <p className="text-xs text-slate-300">
                  Jornada {ticket.jornadaNumber}/10 • Ciclo {ticket.cycleNumber}
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="rounded-full p-1 text-slate-400 hover:text-white hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            {/* Receipt Digital Inspection Card */}
            <div className="p-5 max-h-[75vh] overflow-y-auto space-y-4">
              <div className="border-2 border-dashed border-slate-300 rounded-xl p-5 bg-amber-50/30 font-mono text-xs text-slate-800 space-y-3 shadow-inner">
                {/* Simulated Official Ticket Header */}
                <div className="text-center pb-3 border-b border-slate-300 space-y-1">
                  <div className="text-sm font-black tracking-widest text-[#0d253f]">
                    LOTERÍAS Y APUESTAS DEL ESTADO
                  </div>
                  <div className="text-[11px] font-bold text-slate-600">
                    LA PRIMITIVA • TERMINAL OFICIAL Nº 28.490
                  </div>
                  <div className="text-[10px] text-slate-500">
                    RECEPTOR MIXTO BURGOS / TORDUELES
                  </div>
                </div>

                <div className="flex justify-between text-[11px]">
                  <span>SORTEO: {ticket.drawDate}</span>
                  <span>HORA SELLADO: 20:35:12</span>
                </div>

                <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-2">
                  <div className="flex justify-between font-bold text-slate-900">
                    <span>APUESTA MÚLTIPLE:</span>
                    <span>{ticket.cost.toFixed(2)} €</span>
                  </div>
                  <div className="text-[11px] text-slate-600">
                    Combinación oficial jugada:
                  </div>
                  <div className="text-base font-extrabold text-blue-900 tracking-wider">
                    {ticket.playedNumbers.map(n => (n < 10 ? `0${n}` : n)).join('  ')}
                  </div>
                  <div className="flex justify-between text-[11px] pt-1 border-t border-slate-100">
                    <span>REINTEGRO: [{ticket.playedReintegro}]</span>
                    <span>JOKER: SI (7 dígitos)</span>
                  </div>
                </div>

                {/* Simulated Official Barcode & Seal Stamp */}
                <div className="pt-2 flex flex-col items-center gap-2">
                  <div className="h-10 w-full bg-slate-900/10 rounded flex items-center justify-center tracking-widest text-[10px] text-slate-600 font-bold">
                    |||||| | |||| |||||| |||| | |||||||| ||| ||||
                  </div>
                  <span className="text-[9px] text-slate-500">
                    CONTROL CC-84920-SELAE-PRIMITIVA-TORDUELES
                  </span>
                </div>

                {/* Official Sello de la Peña */}
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-center text-blue-900">
                  <span className="text-[10px] font-bold uppercase tracking-wider block text-blue-700">
                    Resguardo Custodiado y Validado
                  </span>
                  <span className="text-xs font-semibold">
                    Peña La Primitiva Tordueles • {ticket.activePlayersCount} Socios Activos
                  </span>
                </div>
              </div>

              {ticket.isScrutinized && (
                <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3.5 text-xs text-emerald-900 space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Escrutinio validado por SELAE
                  </div>
                  <div>
                    Premio adjudicado: <strong>{ticket.totalPrize.toFixed(2)} €</strong> ({ticket.prizeCategory})
                  </div>
                </div>
              )}
            </div>

            <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-xl bg-[#0d253f] hover:bg-[#153a61] text-xs font-bold text-white transition"
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
