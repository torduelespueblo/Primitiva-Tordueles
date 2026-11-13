import React, { useState } from 'react';
import { Player, WaitingListEntry, SyndicateSettings } from '../types/lottery';
import {
  Users,
  Clock,
  ExternalLink,
  CheckCircle,
  AlertTriangle,
  UserX,
  Timer
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
  const pastPlayers = players.filter(p => p.status === 'BAJA');

  const isRenewalWindow = settings.currentJornada >= 7 && settings.currentJornada <= 9;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-3xl bg-white border border-slate-200 p-5 sm:p-7 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <Users className="w-6 h-6 text-[#FF6B00] shrink-0" />
            <h1 className="text-2xl sm:text-3xl font-black font-serif text-[#0A2540]">
              Censo de Socios &amp; Lista de Espera
            </h1>
          </div>
          <p className="text-base text-slate-600 mt-1.5 leading-relaxed">
            Gestión transparente vinculada al Formulario de Google con sellos de tiempo exactos.
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
          <span>Cola de Espera ({waitingList.length})</span>
        </button>
      </div>

      {/* TAB 1: MEMBERS */}
      {activeTab === 'MEMBERS' && (
        <div className="space-y-5">
          {isRenewalWindow && (
            <div className="rounded-2xl bg-orange-50 border border-orange-200 p-4 sm:p-5 flex items-start gap-3.5 text-[#0A2540] text-base">
              <AlertTriangle className="w-6 h-6 text-[#FF6B00] shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <strong>Aviso de Renovación (Jornada {settings.currentJornada}/10):</strong> Quienes figuren como Pendientes deben abonar los 10 € antes del fin de la jornada 9. Si no se recibe el pago, la jornada 10 será la última y la plaza pasará al primer suplente con 24 horas para ingresar.
              </div>
            </div>
          )}

          {/* Mobile Card View (< md) */}
          <div className="md:hidden space-y-3">
            {activePlayers.map((player) => (
              <div
                key={player.id}
                className="rounded-2xl bg-white border border-slate-200 p-4 sm:p-5 shadow-xs space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="font-mono text-sm font-extrabold text-[#FF6B00] tabular-nums">
                      Socio #{player.memberNumber < 10 ? `0${player.memberNumber}` : player.memberNumber}
                    </span>
                    <h3 className="text-lg font-extrabold text-[#0A2540]">
                      {player.name}
                    </h3>
                    {player.notes && (
                      <p className="text-sm text-slate-600 mt-0.5">{player.notes}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100 text-sm">
                  <div>
                    <span className="text-slate-500 block font-medium">Ciclo {settings.currentCycle}</span>
                    <span
                      className={`font-extrabold ${
                        player.currentCyclePaid ? 'text-emerald-700' : 'text-rose-700'
                      }`}
                    >
                      {player.currentCyclePaid ? 'Pagado al día' : 'Pendiente'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block font-medium">
                      Renovación C{settings.currentCycle + 1}
                    </span>
                    <span
                      className={`font-extrabold ${
                        player.renewalStatus === 'RENOVADO'
                          ? 'text-[#0A2540]'
                          : player.renewalStatus === 'URGENTE_EXPIRA'
                          ? 'text-rose-700'
                          : 'text-[#FF6B00]'
                      }`}
                    >
                      {player.renewalStatus === 'RENOVADO'
                        ? `Cubierto (C${player.paidUntilCycle})`
                        : player.renewalStatus === 'URGENTE_EXPIRA'
                        ? 'Plazo crítico (J9)'
                        : 'Pendiente abono'}
                    </span>
                  </div>
                </div>

                <div className="text-sm font-mono text-slate-500 pt-1 tabular-nums">
                  Alta: {formatTimestampWithCentiseconds(player.registrationTimestamp)}
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
                    <th className="py-4 px-5">Nº Socio</th>
                    <th className="py-4 px-5">Nombre y Apellidos</th>
                    <th className="py-4 px-5">Antigüedad (Timestamp)</th>
                    <th className="py-4 px-5">Ciclo {settings.currentCycle}</th>
                    <th className="py-4 px-5">Renovación Ciclo {settings.currentCycle + 1}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {activePlayers.map((player) => (
                    <tr key={player.id} className="hover:bg-slate-50 transition">
                      <td className="py-4 px-5 font-mono font-extrabold text-[#0A2540] tabular-nums">
                        #{player.memberNumber < 10 ? `0${player.memberNumber}` : player.memberNumber}
                      </td>
                      <td className="py-4 px-5 font-bold text-[#0A2540]">
                        <div>{player.name}</div>
                        {player.notes && (
                          <span className="text-sm text-slate-500 font-normal block">{player.notes}</span>
                        )}
                      </td>
                      <td className="py-4 px-5 text-slate-600 font-mono text-sm tabular-nums">
                        {formatTimestampWithCentiseconds(player.registrationTimestamp)}
                      </td>
                      <td className="py-4 px-5">
                        {player.currentCyclePaid ? (
                          <span className="inline-flex items-center gap-1.5 text-sm font-bold text-emerald-700">
                            <CheckCircle className="w-4 h-4 shrink-0" /> Al día
                          </span>
                        ) : (
                          <span className="text-sm font-bold text-rose-700">Pendiente</span>
                        )}
                      </td>
                      <td className="py-4 px-5">
                        {player.renewalStatus === 'RENOVADO' ? (
                          <span className="inline-flex items-center gap-1.5 text-sm font-bold text-[#0A2540]">
                            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" /> Cubierto (Ciclo {player.paidUntilCycle})
                          </span>
                        ) : player.renewalStatus === 'URGENTE_EXPIRA' ? (
                          <span className="inline-flex items-center gap-1.5 text-sm font-bold text-rose-700">
                            <AlertTriangle className="w-4 h-4 shrink-0" /> Plazo crítico (J9)
                          </span>
                        ) : (
                          <span className="text-sm font-bold text-[#FF6B00]">Pendiente de abono</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Bajas Definitivas */}
          {pastPlayers.length > 0 && (
            <div className="pt-2">
              <h3 className="text-base font-bold uppercase tracking-wider text-slate-600 mb-3 flex items-center gap-2">
                <UserX className="w-5 h-5 text-slate-500" />
                Historial de Bajas Definitivas (Pérdida de Antigüedad)
              </h3>
              <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-2.5 text-base">
                {pastPlayers.map(p => (
                  <div key={p.id} className="flex flex-wrap items-center justify-between gap-2 text-slate-700">
                    <div>
                      <span className="font-bold text-[#0A2540]">{p.name}</span>
                      {p.notes && <span className="text-slate-500 ml-2 text-sm">({p.notes})</span>}
                    </div>
                    <span className="text-sm font-bold text-slate-500">Baja Definitiva</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: WAITING LIST */}
      {activeTab === 'WAITING_LIST' && (
        <div className="space-y-5">
          <div className="rounded-2xl bg-white border border-slate-200 p-5 text-base text-slate-700 space-y-2.5 leading-relaxed">
            <h3 className="font-extrabold text-lg text-[#0A2540] flex items-center gap-2">
              <Timer className="w-5 h-5 text-[#FF6B00] shrink-0" />
              Regla de Asignación por Antigüedad &amp; 24 Horas
            </h3>
            <p>
              Las vacantes se adjudican por <strong>estricto orden cronológico</strong> según el sello de tiempo con milisegundos del Formulario de inscripción.
            </p>
            <p>
              El primer suplente notificado dispone de <strong>24 horas exactas</strong> para abonar los 10 € del ciclo. Si no ingresa en plazo, la vacante pasa al siguiente aspirante.
            </p>
          </div>

          {/* Mobile Cards for Waiting List */}
          <div className="md:hidden space-y-3">
            {waitingList.map((entry, index) => {
              const isFirst = index === 0;
              return (
                <div
                  key={entry.id}
                  className={`rounded-2xl border p-4 sm:p-5 space-y-2.5 ${
                    isFirst ? 'bg-orange-50/70 border-[#FF6B00]' : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span
                        className={`flex items-center justify-center w-9 h-9 rounded-full text-base font-black tabular-nums ${
                          isFirst ? 'bg-[#FF6B00] text-white' : 'bg-[#0A2540] text-white'
                        }`}
                      >
                        {index + 1}
                      </span>
                      <div>
                        <h4 className="text-lg font-extrabold text-[#0A2540]">{entry.name}</h4>
                        {isFirst && (
                          <span className="text-sm font-bold text-[#FF6B00] block">
                            Primer suplente con opción a vacante
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-sm font-mono text-slate-700 tabular-nums">
                    Registro: {formatTimestampWithCentiseconds(entry.registrationTimestamp)}
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200/80 text-sm font-bold">
                    <span className={entry.status === 'NOTIFICADO_24H' ? 'text-[#FF6B00]' : 'text-slate-600'}>
                      {entry.status === 'NOTIFICADO_24H' ? 'Notificado (Plazo 24h)' : 'En cola de espera'}
                    </span>
                    {entry.deadline24h && (
                      <span className="font-mono text-[#0A2540] tabular-nums">
                        Expira: {new Date(entry.deadline24h).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })} h
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block rounded-3xl bg-white border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-base text-slate-800">
                <thead className="bg-[#0A2540] text-white uppercase text-sm tracking-wider">
                  <tr>
                    <th className="py-4 px-5">Orden</th>
                    <th className="py-4 px-5">Aspirante</th>
                    <th className="py-4 px-5">Marca Temporal (Seg. y Cent.)</th>
                    <th className="py-4 px-5">Estado del Turno</th>
                    <th className="py-4 px-5">Plazo Restante</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {waitingList.map((entry, index) => {
                    const isFirst = index === 0;
                    return (
                      <tr key={entry.id} className={isFirst ? 'bg-orange-50/50' : 'hover:bg-slate-50'}>
                        <td className="py-4 px-5">
                          <span
                            className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-black tabular-nums ${
                              isFirst ? 'bg-[#FF6B00] text-white' : 'bg-slate-200 text-[#0A2540]'
                            }`}
                          >
                            {index + 1}
                          </span>
                        </td>
                        <td className="py-4 px-5 font-bold text-[#0A2540]">
                          {entry.name}
                          {isFirst && (
                            <span className="text-sm font-bold text-[#FF6B00] block">
                              Primer suplente con opción a vacante
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-5 font-mono text-sm text-slate-700 tabular-nums">
                          {formatTimestampWithCentiseconds(entry.registrationTimestamp)}
                        </td>
                        <td className="py-4 px-5 font-bold text-sm">
                          {entry.status === 'NOTIFICADO_24H' ? (
                            <span className="text-[#FF6B00] inline-flex items-center gap-1.5">
                              <Timer className="w-4 h-4" /> Notificado (Plazo 24h)
                            </span>
                          ) : (
                            <span className="text-slate-600">En cola de espera</span>
                          )}
                        </td>
                        <td className="py-4 px-5 font-mono text-sm font-bold tabular-nums">
                          {entry.deadline24h
                            ? `Expira: ${new Date(entry.deadline24h).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })} h`
                            : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
