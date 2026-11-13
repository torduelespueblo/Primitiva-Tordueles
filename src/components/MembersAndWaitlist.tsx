import React, { useState } from 'react';
import { Player, WaitingListEntry, SyndicateSettings } from '../types/lottery';
import {
  Users,
  Clock,
  ExternalLink,
  Calendar,
  Copy,
  Check,
  UserPlus,
  Link2
} from 'lucide-react';
import { formatTimestampWithCentiseconds } from '../utils/dateFormat';
import { getPublicRegistrationShareUrl } from '../services/registrationService';

interface MembersAndWaitlistProps {
  players: Player[];
  waitingList: WaitingListEntry[];
  settings: SyndicateSettings;
  onOpenRegistration: () => void;
}

export const MembersAndWaitlist: React.FC<MembersAndWaitlistProps> = ({
  players,
  waitingList,
  settings,
  onOpenRegistration,
}) => {
  const [activeTab, setActiveTab] = useState<'MEMBERS' | 'WAITING_LIST'>('MEMBERS');
  const [copiedLink, setCopiedLink] = useState(false);

  const activePlayers = players.filter(p => p.status === 'TITULAR');
  const hasExternalForm = Boolean(settings.googleFormUrl && settings.googleFormUrl.startsWith('http'));
  const shareUrl = getPublicRegistrationShareUrl();

  const handleCopyShareLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-3xl bg-white border border-slate-200 p-5 sm:p-7 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
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

          {hasExternalForm ? (
            <a
              href={settings.googleFormUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2.5 px-5 min-h-[48px] rounded-xl bg-[#FF6B00] hover:bg-[#E55E00] text-base font-bold text-white shadow-xs transition shrink-0"
            >
              <span>Inscribirse en Lista de Espera</span>
              <ExternalLink className="w-5 h-5" />
            </a>
          ) : (
            <button
              type="button"
              onClick={onOpenRegistration}
              className="inline-flex items-center justify-center gap-2.5 px-5 min-h-[48px] rounded-xl bg-[#FF6B00] hover:bg-[#E55E00] text-base font-bold text-white shadow-xs transition shrink-0 cursor-pointer"
            >
              <UserPlus className="w-5 h-5" />
              <span>Inscribirse en Lista de Espera</span>
            </button>
          )}
        </div>

        {/* Enlace directo para compartir con jugadores que no quieran instalar la app */}
        <div className="rounded-2xl bg-[#F4F6F9] border border-slate-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="min-w-0">
            <span className="text-sm font-extrabold text-[#0A2540] flex items-center gap-1.5">
              <Link2 className="w-4 h-4 text-[#FF6B00] shrink-0" />
              Enlace directo de inscripción (sin instalar la App):
            </span>
            <p className="text-sm font-mono text-slate-600 truncate mt-0.5">
              {shareUrl}
            </p>
          </div>
          <button
            type="button"
            onClick={handleCopyShareLink}
            className="inline-flex items-center justify-center gap-2 px-4 min-h-[44px] rounded-xl bg-[#0A2540] hover:bg-[#13375B] text-white text-sm font-bold transition shrink-0 cursor-pointer"
          >
            {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-[#FF6B00]" />}
            <span>{copiedLink ? '¡Enlace copiado!' : 'Copiar enlace'}</span>
          </button>
        </div>
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
          {activePlayers.length === 0 ? (
            <div className="rounded-2xl bg-white border border-slate-200 p-8 text-center text-base text-slate-600">
              No hay socios titulares registrados actualmente en la pestaña «Usuarios».
            </div>
          ) : (
            <>
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
            </>
          )}
        </div>
      )}

      {/* TAB 2: WAITING LIST (Solo Nombre y Fecha de inscripción) */}
      {activeTab === 'WAITING_LIST' && (
        <div className="space-y-4">
          {waitingList.length === 0 ? (
            <div className="rounded-2xl bg-white border border-slate-200 p-8 text-center text-base text-slate-600">
              No hay aspirantes registrados actualmente en la lista de espera.
            </div>
          ) : (
            <>
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
            </>
          )}
        </div>
      )}
    </div>
  );
};
