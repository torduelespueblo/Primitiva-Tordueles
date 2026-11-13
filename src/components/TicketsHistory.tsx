import React, { useState } from 'react';
import { TicketDraw } from '../types/lottery';
import { TicketCard } from './TicketCard';
import { Receipt, Trophy, Layers } from 'lucide-react';
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
      <div className="rounded-3xl bg-white border border-slate-200 p-5 sm:p-7 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <Receipt className="w-6 h-6 text-[#FF6B00] shrink-0" />
            <h1 className="text-2xl sm:text-3xl font-black font-serif text-[#0A2540]">
              Historial de Boletos Sellados
            </h1>
          </div>
          <p className="text-base text-slate-600 mt-1.5 leading-relaxed">
            Consulta los resguardos digitalizados, combinaciones jugadas y escrutinios oficiales.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setShowMultiplesGuide(!showMultiplesGuide)}
            className="inline-flex items-center gap-2 px-4 min-h-[48px] rounded-xl bg-slate-100 hover:bg-slate-200 text-[#0A2540] text-base font-bold transition cursor-pointer"
          >
            <Layers className="w-5 h-5 text-[#FF6B00]" />
            <span>{showMultiplesGuide ? 'Ocultar Múltiples' : 'Opciones Múltiples'}</span>
          </button>
          <div className="rounded-2xl bg-[#0A2540] text-white px-5 py-2.5 text-left sm:text-right">
            <span className="text-xs sm:text-sm text-slate-300 uppercase font-bold block">
              Premios Ciclo {currentCycle}
            </span>
            <span className="text-xl font-black text-emerald-400 tabular-nums">
              +{totalWonInCycle.toFixed(2)} €
            </span>
          </div>
        </div>
      </div>

      {showMultiplesGuide && <MultipleBetsGuide />}

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2.5">
        <button
          type="button"
          onClick={() => setFilter('ALL')}
          className={`px-4 min-h-[48px] rounded-xl text-base font-bold transition flex items-center gap-2 cursor-pointer ${
            filter === 'ALL'
              ? 'bg-[#0A2540] text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
          }`}
        >
          <span>Todos ({tickets.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setFilter('CURRENT_CYCLE')}
          className={`px-4 min-h-[48px] rounded-xl text-base font-bold transition flex items-center gap-2 cursor-pointer ${
            filter === 'CURRENT_CYCLE'
              ? 'bg-[#0A2540] text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
          }`}
        >
          <span>
            Ciclo {currentCycle} ({tickets.filter(t => t.cycleNumber === currentCycle).length})
          </span>
        </button>

        <button
          type="button"
          onClick={() => setFilter('PRIZES_ONLY')}
          className={`px-4 min-h-[48px] rounded-xl text-base font-bold transition flex items-center gap-2 cursor-pointer ${
            filter === 'PRIZES_ONLY'
              ? 'bg-[#0A2540] text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
          }`}
        >
          <Trophy className="w-5 h-5 text-[#FF6B00]" />
          <span>Con Premio ({tickets.filter(t => t.totalPrize > 0).length})</span>
        </button>
      </div>

      {/* Grid of Tickets */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredTickets.map(ticket => (
          <TicketCard key={ticket.id} ticket={ticket} />
        ))}
      </div>
    </div>
  );
};
