import React, { useState } from 'react';
import { Player, WaitingListEntry, SyndicateSettings } from '../types/lottery';
import {
  Users,
  Clock,
  ExternalLink,
  ShieldAlert,
  CheckCircle,
  AlertTriangle,
  UserX,
  Timer,
  Calendar,
  HelpCircle
} from 'lucide-react';

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
      <div className="rounded-2xl bg-white border border-slate-200 p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-900" />
            <h2 className="text-lg sm:text-xl font-bold font-serif text-[#0d253f]">
              Censo de Socios & Lista de Espera Oficial
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Gestión transparente vinculada al Formulario de Google con sellos de tiempo inalterables.
          </p>
        </div>

        {/* Google Form Link Button */}
        <a
          href={settings.googleFormUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#0d253f] hover:bg-[#153a61] text-xs font-bold text-white shadow-xs transition"
        >
          <span>Inscribirse en Lista de Espera</span>
          <ExternalLink className="w-4 h-4 text-sky-300" />
        </a>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('MEMBERS')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition ${
            activeTab === 'MEMBERS'
              ? 'bg-[#0d253f] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Socios Titulares Activos ({activePlayers.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('WAITING_LIST')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition ${
            activeTab === 'WAITING_LIST'
              ? 'bg-[#0d253f] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Cola de Espera (Orden Timestamp) ({waitingList.length})</span>
        </button>
      </div>

      {/* TAB 1: MEMBERS */}
      {activeTab === 'MEMBERS' && (
        <div className="space-y-4">
          {/* Renewal Window Reminder */}
          {isRenewalWindow && (
            <div className="rounded-xl bg-amber-50 border border-amber-200 p-3.5 flex items-start gap-3 text-amber-900 text-xs">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong>Aviso de Renovación Oficial (Jornada {settings.currentJornada}/10):</strong> Quienes tengan estado "Pendiente" deben abonar la cuota de 10€ antes del fin de la jornada 9. Al término de la jornada 9, si no se recibe el pago, la jornada 10 será la última y la plaza pasará al primer suplente con 24 horas para ingresar.
              </div>
            </div>
          )}

          <div className="rounded-2xl bg-white border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-[#0d253f] text-white uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Nº Socio</th>
                    <th className="py-3 px-4">Nombre y Apellidos</th>
                    <th className="py-3 px-4 hidden sm:table-cell">Antigüedad (Timestamp)</th>
                    <th className="py-3 px-4">Estado Ciclo {settings.currentCycle}</th>
                    <th className="py-3 px-4">Renovación Ciclo {settings.currentCycle + 1}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {activePlayers.map((player) => (
                    <tr key={player.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4 font-mono font-bold text-blue-900">
                        #{player.memberNumber < 10 ? `0${player.memberNumber}` : player.memberNumber}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        <div>{player.name}</div>
                        {player.notes && (
                          <span className="text-[10px] text-slate-500 font-normal block">{player.notes}</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-500 hidden sm:table-cell">
                        {new Date(player.registrationTimestamp).toLocaleDateString('es-ES', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="py-3 px-4">
                        {player.currentCyclePaid ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                            <CheckCircle className="w-3 h-3 text-emerald-600" /> Al día (Pagado)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800">
                            Pendiente
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {player.renewalStatus === 'RENOVADO' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-100 text-sky-800">
                            <CheckCircle className="w-3 h-3 text-sky-600" /> Cubierto (Ciclo {player.paidUntilCycle})
                          </span>
                        ) : player.renewalStatus === 'URGENTE_EXPIRA' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 animate-pulse">
                            <AlertTriangle className="w-3 h-3 text-rose-600" /> Plazo crítico (Jornada 9)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">
                            Pendiente de abono
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Bajas Definitivas Section */}
          {pastPlayers.length > 0 && (
            <div className="pt-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
                <UserX className="w-4 h-4 text-slate-400" />
                Historial de Bajas Definitivas (Pérdida de Antigüedad)
              </h3>
              <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3 space-y-2 text-xs">
                {pastPlayers.map(p => (
                  <div key={p.id} className="flex items-center justify-between text-slate-600">
                    <div>
                      <span className="font-semibold text-slate-800">{p.name}</span>
                      <span className="text-slate-400 ml-2">({p.notes})</span>
                    </div>
                    <span className="text-[10px] font-bold bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full">
                      Baja Definitiva
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: WAITING LIST */}
      {activeTab === 'WAITING_LIST' && (
        <div className="space-y-4">
          <div className="rounded-xl bg-blue-50 border border-blue-200 p-4 text-xs text-blue-900 space-y-2">
            <h4 className="font-bold flex items-center gap-1.5">
              <Timer className="w-4 h-4 text-blue-700" />
              Regla de Asignación por Antigüedad & 24 Horas
            </h4>
            <p>
              Las vacantes que se produzcan por falta de renovación o baja voluntaria se adjudican por <strong>estricto orden cronológico</strong> del sello de tiempo (timestamp) del Formulario de Google.
            </p>
            <p>
              El primer suplente notificado dispone de <strong>exactamente 24 horas</strong> para abonar los 10€ del ciclo completo. Si no realiza el ingreso en plazo, la vacante pasará inmediatamente al siguiente aspirante de la lista.
            </p>
          </div>

          <div className="rounded-2xl bg-white border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-[#0d253f] text-white uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Orden</th>
                    <th className="py-3 px-4">Aspirante</th>
                    <th className="py-3 px-4">Timestamp Oficial (Google Form)</th>
                    <th className="py-3 px-4">Estado del Turno</th>
                    <th className="py-3 px-4">Plazo Restante</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {waitingList.map((entry, index) => {
                    const isFirst = index === 0;
                    return (
                      <tr
                        key={entry.id}
                        className={isFirst ? 'bg-amber-50/50 font-medium' : 'hover:bg-slate-50'}
                      >
                        <td className="py-3 px-4">
                          <span
                            className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                              isFirst
                                ? 'bg-amber-500 text-white shadow-xs'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {index + 1}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-900">
                          {entry.name}
                          {isFirst && (
                            <span className="text-[10px] font-bold text-amber-700 block">
                              ★ Primer suplente con opción a vacante
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                          {new Date(entry.registrationTimestamp).toLocaleString('es-ES', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          })}
                        </td>
                        <td className="py-3 px-4">
                          {entry.status === 'NOTIFICADO_24H' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 animate-pulse">
                              <Timer className="w-3 h-3 text-amber-600" /> Notificado (Plazo 24h activo)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700">
                              En cola de espera
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {entry.deadline24h ? (
                            <span className="font-mono font-bold text-amber-800 text-[11px]">
                              Expira: {new Date(entry.deadline24h).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })} h
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
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
