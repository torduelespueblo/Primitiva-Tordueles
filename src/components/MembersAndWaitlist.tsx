import React, { useState } from 'react';
import { Player, WaitingListEntry, SyndicateSettings } from '../types/lottery';
import {
  Users,
  Clock,
  ExternalLink,
  Calendar
} from 'lucide-react';
import { formatTimestampWithCentiseconds } from '../utils/dateFormat';

interface MembersAndWaitlistProps {
  players: Player[];
  waitingList: WaitingListEntry[];
  settings: SyndicateSettings;
}

export const MembersAndWaitlist: React.FC<MembersAndWaitlistProps> = ({
  players,
  waitingList,
  settings,
}) => {
  const [activeTab, setActiveTab] = useState<'MEMBERS' | 'WAITING_LIST'>('MEMBERS');

  const activePlayers = players.filter(p => p.status === 'TITULAR');

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-3xl bg-white border border-slate-200 p-5 sm:p-7 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <Users className="w-6 h-6 text-[#FF6B00] shrink-0" />
            <h1 className="text-2xl sm:text-3xl font-black font-serif text-[#0A2540]">
              Socios &amp; Lista de Espera
            </h1>
          </div>
          <p className="text-base text-slate-600 mt-1.5 leading-relaxed">
            Listado público por orden de inscripción. Por privacidad, solo se muestra el nombre y la fecha exacta de alta.
          </p>
        </div>

        <a
          href={settings.googleFormUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2.5 px-5 min-h-[48px] rounded-xl bg-[#FF6B00] hover:bg-[#E55E00] text-base font-bold text-white shadow-xs transition shrink-0"
        >
          <span>Inscribirse en Lista de Espera</span>
          <ExternalLink className="w-5 h-5" />
        </a>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => setActiveTab('MEMBERS')}
          className={`flex items-center justify-center gap-2.5 px-5 min-h-[52px] rounded-2xl text-base font-bold transition cursor-pointer ${
            activeTab === 'MEMBERS'
              ? 'bg-[#0A2540] text-white shadow-sm'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
          }`}
        >
          <Users className="w-5 h-5 text-[#FF6B00]" />
          <span>Socios Titulares ({activePlayers.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('WAITING_LIST')}
          className={`flex items-center justify-center gap-2.5 px-5 min-h-[52px] rounded-2xl text-base font-bold transition cursor-pointer ${
            activeTab === 'WAITING_LIST'
              ? 'bg-[#0A2540] text-white shadow-sm'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
          }`}
        >
          <Clock className="w-5 h-5 text-[#FF6B00]" />
          <span>Lista de Espera ({waitingList.length})</span>
        </button>
      </div>

      {/* TAB 1: MEMBERS (Solo Nombre y Fecha de inscripción) */}
      {activeTab === 'MEMBERS' && (
        <div className="space-y-4">
          {/* Mobile Card View (< md) */}
          <div className="md:hidden space-y-3">
            {activePlayers.map((player) => (
              <div
                key={player.id}
                className="rounded-2xl bg-white border border-slate-200 p-4 sm:p-5 shadow-xs space-y-2"
              >
                <h3 className="text-lg font-extrabold text-[#0A2540]">
                  {player.name}
                </h3>
                <div className="flex items-center gap-2 text-sm sm:text-base font-mono text-slate-600 tabular-nums">
                  <Calendar className="w-4 h-4 text-[#FF6B00] shrink-0" />
                  <span>Alta: {formatTimestampWithCentiseconds(player.registrationTimestamp)}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table View (>= md) */}
          <div className="hidden md:block rounded-3xl bg-white border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-base text-slate-800">
                <thead className="bg-[#0A2540] text-white uppercase text-sm tracking-wider">
                  <tr>
                    <th className="py-4 px-6">Nombre y Apellidos</th>
                    <th className="py-4 px-6">Fecha de Inscripción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {activePlayers.map((player) => (
                    <tr key={player.id} className="hover:bg-slate-50 transition">
                      <td className="py-4 px-6 font-bold text-[#0A2540]">
                        {player.name}
                      </td>
                      <td className="py-4 px-6 text-slate-600 font-mono text-base tabular-nums">
                        {formatTimestampWithCentiseconds(player.registrationTimestamp)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: WAITING LIST (Solo Nombre y Fecha de inscripción) */}
      {activeTab === 'WAITING_LIST' && (
        <div className="space-y-4">
          {/* Mobile Cards for Waiting List */}
          <div className="md:hidden space-y-3">
            {waitingList.map((entry) => (
              <div
                key={entry.id}
                className="rounded-2xl bg-white border border-slate-200 p-4 sm:p-5 shadow-xs space-y-2"
              >
                <h4 className="text-lg font-extrabold text-[#0A2540]">
                  {entry.name}
                </h4>
                <div className="flex items-center gap-2 text-sm sm:text-base font-mono text-slate-600 tabular-nums">
                  <Calendar className="w-4 h-4 text-[#FF6B00] shrink-0" />
                  <span>Alta: {formatTimestampWithCentiseconds(entry.registrationTimestamp)}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block rounded-3xl bg-white border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-base text-slate-800">
                <thead className="bg-[#0A2540] text-white uppercase text-sm tracking-wider">
                  <tr>
                    <th className="py-4 px-6">Nombre y Apellidos</th>
                    <th className="py-4 px-6">Fecha de Inscripción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {waitingList.map((entry) => (
                    <tr key={entry.id} className="hover:bg-slate-50 transition">
                      <td className="py-4 px-6 font-bold text-[#0A2540]">
                        {entry.name}
                      </td>
                      <td className="py-4 px-6 font-mono text-base text-slate-600 tabular-nums">
                        {formatTimestampWithCentiseconds(entry.registrationTimestamp)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
