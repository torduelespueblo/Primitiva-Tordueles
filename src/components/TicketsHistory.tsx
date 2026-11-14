import React, { useState } from 'react';
import { TicketDraw, PrizeHistoryEntry } from '../types/lottery';
import { TicketCard } from './TicketCard';
import { Receipt, Trophy, Layers, ArrowUpDown, Calendar, Lock, UserPlus, KeyRound } from 'lucide-react';
import { MultipleBetsGuide } from './MultipleBetsGuide';
import { MAX_STORED_TICKETS } from '../services/storage';

interface TicketsHistoryProps {
  tickets: TicketDraw[];
  prizeHistory: PrizeHistoryEntry[];
  currentCycle: number;
  prizeFundBalance?: number;
  accessLevel?: 'VISITOR' | 'SUPLENTE' | 'TITULAR';
  googleAppsScriptUrl?: string;
  onOpenRegister?: () => void;
  onOpenLogin?: () => void;
}

export const TicketsHistory: React.FC<TicketsHistoryProps> = ({
  tickets,
  prizeHistory,
  currentCycle,
  prizeFundBalance = 0,
  accessLevel = 'VISITOR',
  googleAppsScriptUrl,
  onOpenRegister,
  onOpenLogin,
}) => {
  const [filter, setFilter] = useState<'ALL' | 'CURRENT_CYCLE' | 'PRIZES_ONLY'>('ALL');
  const [showMultiplesGuide, setShowMultiplesGuide] = useState(false);
  const [prizeSortOrder, setPrizeSortOrder] = useState<'DESC' | 'ASC'>('DESC');

  const isTitular = accessLevel === 'TITULAR';

  // Solo los últimos 4 boletos ya jugados/escrutados (excluye el boleto pendiente de «Mi Jugada»)
  const playedTickets = isTitular
    ? tickets
        .filter(t => t.isScrutinized)
        .sort((a, b) => new Date(b.drawDate).getTime() - new Date(a.drawDate).getTime())
        .slice(0, MAX_STORED_TICKETS)
    : [];

  const filteredTickets = playedTickets.filter(t => {
    if (filter === 'CURRENT_CYCLE') return t.cycleNumber === currentCycle;
    if (filter === 'PRIZES_ONLY') return t.totalPrize > 0;
    return true;
  });

  // Histórico completo de premios obtenidos ordenado por fecha del sorteo
  const sortedPrizes = isTitular
    ? [...prizeHistory].sort((a, b) => {
        const timeA = new Date(a.drawDate).getTime();
        const timeB = new Date(b.drawDate).getTime();
        return prizeSortOrder === 'DESC' ? timeB - timeA : timeA - timeB;
      })
    : [];

  const totalPrizesAllTime =
    sortedPrizes.length > 0
      ? sortedPrizes.reduce((sum, p) => sum + (p.prizeAmount || 0), 0)
      : prizeFundBalance;

  return (
    <div className="space-y-6">
      {/* Header & Stats Banner */}
      <div className="rounded-3xl bg-white border border-slate-200 p-5 sm:p-7 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <Receipt className="w-6 h-6 text-[#FF6B00] shrink-0" />
            <h1 className="text-2xl sm:text-3xl font-black font-serif text-[#0A2540]">
              Historial de Boletos Jugados
            </h1>
          </div>
          <p className="text-base text-slate-600 mt-1.5 leading-relaxed">
            Se conservan los últimos {MAX_STORED_TICKETS} boletos ya jugados y escrutados. El boleto pendiente del próximo sorteo se muestra en «Mi Jugada».
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
              Total Premios
            </span>
            <span className="text-xl font-black text-emerald-400 tabular-nums">
              +{totalPrizesAllTime.toFixed(2)} €
            </span>
          </div>
        </div>
      </div>

      {showMultiplesGuide && <MultipleBetsGuide />}

      {!isTitular ? (
        <div className="rounded-3xl bg-white border-2 border-slate-200 p-7 sm:p-10 text-center shadow-xs space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-[#0A2540] text-white mx-auto flex items-center justify-center shadow-md">
            <Lock className="w-8 h-8 text-[#FF6B00]" />
          </div>
          <div className="space-y-2 max-w-xl mx-auto">
            <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-extrabold uppercase tracking-wider text-[#FF6B00]">
              {accessLevel === 'SUPLENTE'
                ? 'Acceso exclusivo para Socios Titulares'
                : 'Contenido Protegido'}
            </span>
            <h2 className="text-xl sm:text-2xl font-black font-serif text-[#0A2540]">
              Boletos y resguardos reservados a Titulares
            </h2>
            <p className="text-base text-slate-600 leading-relaxed">
              {accessLevel === 'SUPLENTE'
                ? 'Tu ficha consta como Suplente en lista de espera. Las combinaciones jugadas, imágenes de resguardos y escrutinios detallados están reservados a los Titulares activos de la peña.'
                : 'Para consultar los resguardos sellados, combinaciones jugadas y detalle de sorteos es necesario ser Socio Titular activo de la peña.'}
            </p>
          </div>
          {accessLevel === 'VISITOR' && (onOpenRegister || onOpenLogin) && (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-1">
              {onOpenRegister && (
                <button
                  type="button"
                  onClick={onOpenRegister}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 min-h-[48px] rounded-xl bg-[#FF6B00] hover:bg-[#E55E00] text-white font-extrabold text-base shadow-sm transition cursor-pointer"
                >
                  <UserPlus className="w-5 h-5" />
                  <span>Apuntarme en Lista de Espera</span>
                </button>
              )}
              {onOpenLogin && (
                <button
                  type="button"
                  onClick={onOpenLogin}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 min-h-[48px] rounded-xl bg-[#0A2540] hover:bg-[#13375B] text-white font-bold text-base shadow-sm transition cursor-pointer"
                >
                  <KeyRound className="w-5 h-5 text-[#FF6B00]" />
                  <span>Ya soy Titular (Entrar con DNI)</span>
                </button>
              )}
            </div>
          )}
        </div>
      ) : (
        <>
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
          <span>Últimos Jugados ({playedTickets.length}/{MAX_STORED_TICKETS})</span>
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
            Ciclo {currentCycle} ({playedTickets.filter(t => t.cycleNumber === currentCycle).length})
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
          <span>Con Premio ({playedTickets.filter(t => t.totalPrize > 0).length})</span>
        </button>
      </div>

      {/* Grid of Last 4 Played Tickets */}
      {filteredTickets.length === 0 ? (
        <div className="rounded-3xl bg-white border border-slate-200 p-8 sm:p-10 text-center space-y-2.5 shadow-xs">
          <Receipt className="w-10 h-10 text-slate-400 mx-auto" />
          <h2 className="text-lg font-extrabold text-[#0A2540]">
            No hay boletos jugados todavía
          </h2>
          <p className="text-base text-slate-600 max-w-lg mx-auto">
            {playedTickets.length === 0
              ? `Cuando finalice un sorteo y se realice el escrutinio oficial, el boleto pasará aquí automáticamente (máximo los últimos ${MAX_STORED_TICKETS} jugados). El boleto pendiente de sortearse se consulta en «Mi Jugada».`
              : 'No hay boletos jugados que coincidan con este filtro.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredTickets.map(ticket => (
            <TicketCard
              key={ticket.id}
              ticket={ticket}
              googleAppsScriptUrl={googleAppsScriptUrl}
            />
          ))}
        </div>
      )}

      {/* Histórico de Premios Obtenidos ordenado por fecha del sorteo */}
      <section className="rounded-3xl bg-white border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 sm:p-7 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-black font-serif text-[#0A2540] flex items-center gap-2.5">
              <Trophy className="w-6 h-6 text-[#FF6B00] shrink-0" />
              Histórico de Premios Obtenidos
            </h2>
            <p className="text-base text-slate-600 mt-1">
              Registro completo de premios conseguidos por la peña, ordenado por la fecha de cada sorteo.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setPrizeSortOrder(prev => (prev === 'DESC' ? 'ASC' : 'DESC'))}
            className="inline-flex items-center justify-center gap-2 px-4 min-h-[44px] rounded-xl border border-slate-300 bg-[#F4F6F9] hover:bg-slate-200 text-sm sm:text-base font-bold text-[#0A2540] transition cursor-pointer shrink-0"
          >
            <ArrowUpDown className="w-4 h-4 text-[#FF6B00]" />
            <span>
              {prizeSortOrder === 'DESC' ? 'Fecha: Más recientes primero' : 'Fecha: Más antiguos primero'}
            </span>
          </button>
        </div>

        {sortedPrizes.length === 0 ? (
          <div className="p-8 text-center text-slate-600 space-y-2">
            <Calendar className="w-9 h-9 text-slate-300 mx-auto" />
            <p className="text-base font-bold text-[#0A2540]">
              Aún no hay premios registrados en el histórico
            </p>
            <p className="text-sm sm:text-base text-slate-600 max-w-md mx-auto">
              Cada vez que un escrutinio oficial obtenga premio, quedará anotado aquí de forma permanente con la fecha del sorteo.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-base text-slate-800">
              <thead className="bg-[#0A2540] text-white uppercase text-sm tracking-wider">
                <tr>
                  <th className="py-3.5 px-4 sm:px-6">Fecha del Sorteo</th>
                  <th className="py-3.5 px-4">Ciclo / Jornada</th>
                  <th className="py-3.5 px-4">Categoría / Aciertos</th>
                  <th className="py-3.5 px-4">Destino</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Importe</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sortedPrizes.map(entry => {
                  const dateLabel = new Date(entry.drawDate).toLocaleDateString('es-ES', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  });
                  return (
                    <tr key={entry.id} className="hover:bg-slate-50">
                      <td className="py-3.5 px-4 sm:px-6 font-bold text-[#0A2540] tabular-nums whitespace-nowrap">
                        {dateLabel}
                      </td>
                      <td className="py-3.5 px-4 font-semibold tabular-nums whitespace-nowrap">
                        Ciclo {entry.cycleNumber} · J{entry.jornadaNumber}/10
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-[#0A2540] block">
                          {entry.prizeCategory}
                        </span>
                        <span className="text-sm text-slate-600">
                          {entry.hitsCount} aciertos{entry.hasReintegro ? ' + Reintegro' : ''}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex px-2.5 py-1 rounded-lg text-xs sm:text-sm font-bold ${
                            entry.prizeType === 'MAYOR_BANCO'
                              ? 'bg-amber-100 text-amber-900'
                              : 'bg-emerald-50 text-emerald-800'
                          }`}
                        >
                          {entry.prizeType === 'MAYOR_BANCO' ? 'Cobro Bancario' : 'Bolsa Común'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 sm:px-6 text-right font-black text-emerald-700 tabular-nums whitespace-nowrap">
                        +{entry.prizeAmount.toFixed(2)} €
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-[#F4F6F9] border-t-2 border-slate-200">
                <tr>
                  <td colSpan={4} className="py-4 px-4 sm:px-6 font-extrabold text-[#0A2540]">
                    Total Histórico de Premios Obtenidos ({sortedPrizes.length})
                  </td>
                  <td className="py-4 px-4 sm:px-6 text-right font-black text-lg text-emerald-700 tabular-nums whitespace-nowrap">
                    +{totalPrizesAllTime.toFixed(2)} €
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </section>
        </>
      )}
    </div>
  );
};
