import React, { useState } from 'react';
import { TicketDraw } from '../types/lottery';
import { TicketCard } from './TicketCard';
import { Receipt, Filter, Trophy, Calendar, Layers } from 'lucide-react';
import { MultipleBetsGuide } from './MultipleBetsGuide';

interface TicketsHistoryProps {
  tickets: TicketDraw[];
  currentCycle: number;
}

export const TicketsHistory: React.FC<TicketsHistoryProps> = ({ tickets, currentCycle }) => {
  const [filter, setFilter] = useState<'ALL' | 'CURRENT_CYCLE' | 'PRIZES_ONLY'>('ALL');
  const [showMultiplesGuide, setShowMultiplesGuide] = useState(false);

  const filteredTickets = tickets.filter(t => {
    if (filter === 'CURRENT_CYCLE') return t.cycleNumber === currentCycle;
    if (filter === 'PRIZES_ONLY') return t.totalPrize > 0;
    return true;
  });

  const totalWonInCycle = tickets
    .filter(t => t.cycleNumber === currentCycle)
    .reduce((sum, t) => sum + (t.totalPrize || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header & Stats Banner */}
      <div className="rounded-2xl bg-white border border-slate-200 p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-blue-900" />
            <h2 className="text-lg sm:text-xl font-bold font-serif text-[#0d253f]">
              Historial de Jornadas & Boletos Sellados
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Consulta los resguardos digitalizados, combinaciones jugadas y resultados oficiales de SELAE.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setShowMultiplesGuide(!showMultiplesGuide)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-900 text-xs font-bold transition cursor-pointer"
          >
            <Layers className="w-4 h-4 text-blue-700" />
            <span>{showMultiplesGuide ? 'Ocultar Opciones Múltiples' : 'Ver Opciones Apuestas Múltiples'}</span>
          </button>
          <div className="rounded-xl bg-slate-50 border border-slate-200 px-4 py-2 text-right">
            <span className="text-[10px] text-slate-500 uppercase font-bold block">Premios Ciclo {currentCycle}</span>
            <span className="text-base font-extrabold text-emerald-700">+{totalWonInCycle.toFixed(2)} €</span>
          </div>
        </div>
      </div>

      {/* Guía desplegable de Apuestas Múltiples */}
      {showMultiplesGuide && (
        <div className="p-1">
          <MultipleBetsGuide />
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setFilter('ALL')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
            filter === 'ALL'
              ? 'bg-[#0d253f] text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <span>Todos los Sorteos</span>
          <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">
            {tickets.length}
          </span>
        </button>

        <button
          onClick={() => setFilter('CURRENT_CYCLE')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
            filter === 'CURRENT_CYCLE'
              ? 'bg-[#0d253f] text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <span>Ciclo Actual ({currentCycle})</span>
          <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">
            {tickets.filter(t => t.cycleNumber === currentCycle).length}
          </span>
        </button>

        <button
          onClick={() => setFilter('PRIZES_ONLY')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
            filter === 'PRIZES_ONLY'
              ? 'bg-[#0d253f] text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <Trophy className="w-3.5 h-3.5 text-amber-500" />
          <span>Solo con Premio</span>
          <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">
            {tickets.filter(t => t.totalPrize > 0).length}
          </span>
        </button>
      </div>

      {/* Grid of Tickets */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredTickets.map(ticket => (
          <TicketCard key={ticket.id} ticket={ticket} />
        ))}
      </div>
    </div>
  );
};
