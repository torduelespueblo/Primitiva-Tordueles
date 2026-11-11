import React, { useState } from 'react';
import {
  Player,
  WaitingListEntry,
  TicketDraw,
  SyndicateSettings,
  MultipleBetType
} from '../types/lottery';
import {
  calculateScrutiny
} from '../services/lotteryRules';
import { greenApiService } from '../services/greenApi';
import { whatsappService } from '../services/whatsappService';
import { pushNotificationService } from '../services/pushNotifications';
import { processTicketWithAI } from '../services/aiService';
import { generateDailyLotteryBulletin } from '../services/lotteryDailyService';
import { AppsScriptDeployModal } from './AppsScriptDeployModal';
import { GoogleWorkspacePanel } from './GoogleWorkspacePanel';
import { MultipleBetsGuide } from './MultipleBetsGuide';

import {
  Settings,
  Users,
  Upload,
  HardDrive,
  Send,
  Layers,
  Newspaper,
  Trophy,
  Check,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  FileCode,
  Smartphone,
  Eye,
  Plus,
  FileUp,
  FileText,
  Loader2,
  CheckCircle2
} from 'lucide-react';

interface AdminPanelProps {
  settings: SyndicateSettings;
  onUpdateSettings: (newSettings: SyndicateSettings) => void;
  players: Player[];
  onUpdatePlayers: (newPlayers: Player[]) => void;
  waitingList: WaitingListEntry[];
  onUpdateWaitingList: (newList: WaitingListEntry[]) => void;
  tickets: TicketDraw[];
  onUpdateTickets: (newTickets: TicketDraw[]) => void;
  onLogoutAdmin: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  settings,
  onUpdateSettings,
  players,
  onUpdatePlayers,
  waitingList,
  onUpdateWaitingList,
  tickets,
  onUpdateTickets,
  onLogoutAdmin,
}) => {
  const [activeSection, setActiveSection] = useState<
    'CONFIG' | 'USERS' | 'TICKET_UPLOAD' | 'WORKSPACE' | 'MULTIPLE_BETS' | 'SCRUTINY'
  >('CONFIG');

  const [showAppsScriptModal, setShowAppsScriptModal] = useState(false);
  const [testMsgStatus, setTestMsgStatus] = useState<string | null>(null);
  const [showBulletinPreview, setShowBulletinPreview] = useState(false);
  const [bulletinSendStatus, setBulletinSendStatus] = useState<string | null>(null);

  // Formulario nuevo boleto
  const [newTicketJornada, setNewTicketJornada] = useState(settings.currentJornada);
  const [newTicketCost, setNewTicketCost] = useState(44);
  const [newTicketNumbers, setNewTicketNumbers] = useState('07, 13, 22, 34, 49');
  const [newTicketReintegro, setNewTicketReintegro] = useState(4);
  const [newTicketImage, setNewTicketImage] = useState(
    'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?auto=format&fit=crop&w=800&q=80'
  );
  const [ticketSaveSuccess, setTicketSaveSuccess] = useState(false);

  // Estados para escaneo de boleto mediante IA
  const [isScanningAI, setIsScanningAI] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [scanSuccessMessage, setScanSuccessMessage] = useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);

  const handleFileUploadAndScan = async (file: File) => {
    setSelectedFileName(file.name);
    setScanError(null);
    setScanSuccessMessage(null);

    // Si es imagen, generar vista previa directa en base64
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setNewTicketImage(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }

    // Iniciar extracción mediante IA en el backend
    setIsScanningAI(true);
    const result = await processTicketWithAI(file);
    setIsScanningAI(false);

    if (result.success && result.data) {
      const data = result.data;
      if (data.numbers && data.numbers.length > 0) {
        setNewTicketNumbers(data.numbers.map(n => (n < 10 ? `0${n}` : `${n}`)).join(', '));
      }
      if (typeof data.jornada === 'number' && !isNaN(data.jornada) && data.jornada >= 1 && data.jornada <= 10) {
        setNewTicketJornada(data.jornada);
      }
      if (typeof data.reintegro === 'number' && !isNaN(data.reintegro)) {
        setNewTicketReintegro(data.reintegro);
      }
      if (typeof data.cost === 'number' && !isNaN(data.cost) && data.cost > 0) {
        setNewTicketCost(data.cost);
      }
      setScanSuccessMessage(
        `¡Boleto analizado con IA! Se han detectado ${data.numbers?.length || 0} números${data.jornada ? `, Jornada ${data.jornada}` : ''}${data.reintegro !== undefined && data.reintegro !== null ? `, Reintegro [${data.reintegro}]` : ''}${data.cost ? ` y coste ${data.cost}€` : ''}. ${data.notes || ''}`
      );
    } else {
      setScanError(
        result.error || 'No se pudieron extraer los números automáticamente. Puedes revisarlos o introducirlos manualmente.'
      );
    }
  };

  // Formulario de escrutinio manual
  const [scrutinyWinning, setScrutinyWinning] = useState('07, 13, 22, 30, 38, 45');
  const [scrutinyComp, setScrutinyComp] = useState(19);
  const [scrutinyReintegro, setScrutinyReintegro] = useState(4);
  const [scrutinyResult, setScrutinyResult] = useState<string | null>(null);

  // Interruptores SÍ/NO
  const handleToggleDailySummary = (val: boolean) => {
    onUpdateSettings({ ...settings, sendDailyGeneralSummary: val });
  };

  const handleSendDailyBulletin = async () => {
    setBulletinSendStatus('Enviando boletín diario completo (ONLAE + ONCE) vía Green API...');
    const bulletin = generateDailyLotteryBulletin();
    const result = await whatsappService.sendTextMessage(
      bulletin.formattedWhatsAppMessage,
      {
        instanceId: settings.greenApiInstanceId,
        token: settings.greenApiToken,
        chatId: settings.greenApiChatId,
      }
    );
    if (result.success) {
      setBulletinSendStatus('¡Boletín diario oficial (ONLAE + ONCE) enviado con éxito al grupo!');
    } else {
      setBulletinSendStatus(`Error al enviar: ${result.error}`);
    }
    setTimeout(() => setBulletinSendStatus(null), 6000);
  };

  const handleToggle2035 = (val: boolean) => {
    onUpdateSettings({ ...settings, sendDrawDayTicketAt2035: val });
  };

  const handleTestWhatsApp = async () => {
    setTestMsgStatus('Enviando mensaje de prueba vía Green API...');
    const result = await whatsappService.sendTextMessage(
      `🌲 *PRUEBA DE CONEXIÓN GREEN API - PEÑA TORDUELES* 🌲\n\nConexión exitosa desde el Panel de Administrador.\nEl envío automático a las 20:35h y alertas están listos.`,
      {
        instanceId: settings.greenApiInstanceId,
        token: settings.greenApiToken,
        chatId: settings.greenApiChatId,
      }
    );

    if (result.success) {
      setTestMsgStatus('¡Mensaje enviado con éxito al grupo de WhatsApp!');
    } else {
      setTestMsgStatus(`Error: ${result.error}`);
    }
  };

  const handleSaveTicket = () => {
    const nums = newTicketNumbers
      .split(',')
      .map(s => parseInt(s.trim(), 10))
      .filter(n => !isNaN(n));

    const newTicket: TicketDraw = {
      id: `t-${Date.now()}`,
      cycleNumber: settings.currentCycle,
      jornadaNumber: newTicketJornada,
      drawDate: new Date().toISOString().split('T')[0],
      receiptImageUrl: newTicketImage,
      betType: 'MULTIPLE_5',
      numbersPlayedCount: nums.length,
      cost: newTicketCost,
      activePlayersCount: players.filter(p => p.status === 'TITULAR').length,
      costPerPlayer: 1.0,
      playedNumbers: nums,
      playedReintegro: newTicketReintegro,
      jokerPlayed: true,
      isScrutinized: false,
      totalPrize: 0,
      prizeType: 'NINGUNO',
    };

    onUpdateTickets([newTicket, ...tickets]);
    setTicketSaveSuccess(true);

    // Enviar notificación push
    pushNotificationService.notifyTicketValidated(newTicketJornada, nums);

    // Enviar aviso y resguardo oficial sellado a WhatsApp mediante whatsappService
    if (settings.sendDrawDayTicketAt2035) {
      whatsappService.sendTicketReceipt(
        {
          jornada: newTicketJornada,
          cycle: settings.currentCycle,
          numbers: nums,
          reintegro: newTicketReintegro,
          players: newTicket.activePlayersCount,
          cost: newTicket.cost,
          receiptImageUrl: newTicket.receiptImageUrl,
          drawDate: newTicket.drawDate,
        },
        {
          instanceId: settings.greenApiInstanceId,
          token: settings.greenApiToken,
          chatId: settings.greenApiChatId,
        }
      );
    }

    setTimeout(() => setTicketSaveSuccess(false), 3000);
  };

  const handleRunScrutiny = () => {
    const winNums = scrutinyWinning
      .split(',')
      .map(s => parseInt(s.trim(), 10))
      .filter(n => !isNaN(n));

    const targetTicket = tickets[0];
    if (!targetTicket) return;

    const result = calculateScrutiny(
      targetTicket.playedNumbers,
      targetTicket.playedReintegro,
      winNums,
      scrutinyComp,
      scrutinyReintegro,
      targetTicket.betType,
      targetTicket.activePlayersCount
    );

    const updated = tickets.map((t, i) => {
      if (i === 0) {
        return {
          ...t,
          isScrutinized: true,
          winningNumbers: winNums,
          complementario: scrutinyComp,
          reintegro: scrutinyReintegro,
          hitsCount: result.hits,
          hasReintegro: result.reintegroHit,
          prizeCategory: result.category,
          totalPrize: result.prizeAmount,
          prizeType: result.isMayor ? ('MAYOR_BANCO' as const) : result.prizeAmount > 0 ? ('MENOR_BOLSA' as const) : ('NINGUNO' as const),
        };
      }
      return t;
    });

    onUpdateTickets(updated);

    // Si es menor <=2000 se suma a la bolsa
    if (!result.isMayor && result.prizeAmount > 0) {
      onUpdateSettings({
        ...settings,
        prizeFundBalance: settings.prizeFundBalance + result.prizeAmount,
      });
    }

    setScrutinyResult(
      `Escrutinio completado: ${result.hits} aciertos. Premio: ${result.prizeAmount.toFixed(2)} € (${result.category}).`
    );

    // Enviar push y WhatsApp mediante Green API
    pushNotificationService.notifyScrutinyCompleted(
      targetTicket.jornadaNumber,
      result.hits,
      result.prizeAmount
    );

    if (settings.sendScrutinyAlert) {
      whatsappService.sendScrutinyResult(
        {
          jornada: targetTicket.jornadaNumber,
          cycle: targetTicket.cycleNumber,
          winningNumbers: winNums,
          complementario: scrutinyComp,
          reintegro: scrutinyReintegro,
          hits: result.hits,
          prize: result.prizeAmount,
          category: result.category,
          isMayor: result.isMayor,
          activePlayersCount: targetTicket.activePlayersCount,
        },
        {
          instanceId: settings.greenApiInstanceId,
          token: settings.greenApiToken,
          chatId: settings.greenApiChatId,
        }
      );
    }
  };

  const recommended = getRecommendedBet(calcPlayers);

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="rounded-2xl bg-amber-600 p-5 sm:p-6 text-white shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase font-bold tracking-wider text-amber-200 block">
            Acceso Autorizado
          </span>
          <h2 className="text-xl sm:text-2xl font-bold font-serif text-white">
            Panel de Control del Administrador
          </h2>
          <p className="text-xs text-amber-100 mt-0.5">
            Gestión de usuarios, resguardos sellados, interruptores WhatsApp Green API y Google Sheets.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAppsScriptModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white text-amber-900 font-bold text-xs hover:bg-amber-50 shadow-xs transition"
          >
            <FileCode className="w-4 h-4 text-amber-700" />
            <span>Código Apps Script</span>
          </button>
          <button
            onClick={onLogoutAdmin}
            className="px-3.5 py-2 rounded-xl bg-amber-800/80 hover:bg-amber-900 text-xs font-semibold text-white transition"
          >
            Cerrar Sesión
          </button>
        </div>
      </div>

      {/* Admin Navigation Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {[
          { id: 'CONFIG', label: 'Interruptores & WhatsApp', icon: Settings },
          { id: 'USERS', label: 'Gestión de Estados Socios', icon: Users },
          { id: 'TICKET_UPLOAD', label: 'Subir Resguardo Sellado', icon: Upload },
          { id: 'WORKSPACE', label: 'Google Sheets & Drive', icon: HardDrive },
          { id: 'SCRUTINY', label: 'Escrutinio Oficial SELAE', icon: Trophy },
          { id: 'CALCULATOR', label: 'Calculadora Apuestas Múltiples', icon: Calculator },
        ].map(item => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id as typeof activeSection)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition shrink-0 ${
                isActive
                  ? 'bg-[#0d253f] text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* SECTION 1: CONFIG & WHATSAPP SWITCHES */}
      {activeSection === 'CONFIG' && (
        <div className="space-y-6">
          {/* Switches Card */}
          <div className="rounded-2xl bg-white border border-slate-200 p-5 sm:p-6 shadow-xs space-y-6">
            <div>
              <h3 className="font-bold text-base text-[#0d253f]">
                Interruptores de Automatización (WhatsApp Green API)
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Configura los envíos automáticos según la especificación del reglamento.
              </p>
            </div>

            <div className="space-y-4 divide-y divide-slate-100">
              {/* Switch 1: Boletín Diario General */}
              <div className="pt-2 flex items-center justify-between gap-4">
                <div>
                  <strong className="text-sm text-slate-800 block">
                    Envío del Resumen Diario General (SÍ / NO)
                  </strong>
                  <p className="text-xs text-slate-500">
                    Si está <strong>ACTIVO (SÍ)</strong>, el sistema compila y envía un boletín diario con todos los sorteos (Primitiva + ONCE). Si está en <strong>NO</strong>, se limita exclusivamente a procesar el sorteo en el que participa la peña.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold ${settings.sendDailyGeneralSummary ? 'text-blue-900' : 'text-slate-400'}`}>
                    {settings.sendDailyGeneralSummary ? 'SÍ (ACTIVO)' : 'NO (DESACTIVADO)'}
                  </span>
                  <button
                    onClick={() => handleToggleDailySummary(!settings.sendDailyGeneralSummary)}
                    className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                      settings.sendDailyGeneralSummary ? 'bg-blue-900' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                        settings.sendDailyGeneralSummary ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Switch 2: Resguardo 20:35h */}
              <div className="pt-4 flex items-center justify-between gap-4">
                <div>
                  <strong className="text-sm text-slate-800 block">
                    Publicación & Envío del Resguardo Oficial a las 20:35 h
                  </strong>
                  <p className="text-xs text-slate-500">
                    Envía el resguardo validado por terminal SELAE automáticamente al grupo de WhatsApp a las 20:35 horas del sorteo.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold ${settings.sendDrawDayTicketAt2035 ? 'text-blue-900' : 'text-slate-400'}`}>
                    {settings.sendDrawDayTicketAt2035 ? 'SÍ' : 'NO'}
                  </span>
                  <button
                    onClick={() => handleToggle2035(!settings.sendDrawDayTicketAt2035)}
                    className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                      settings.sendDrawDayTicketAt2035 ? 'bg-blue-900' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                        settings.sendDrawDayTicketAt2035 ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Green API Credentials Card */}
          <div className="rounded-2xl bg-white border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
            <h3 className="font-bold text-base text-[#0d253f] flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-emerald-600" />
              Credenciales de Green API (WhatsApp)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">ID de Instancia (Instance ID):</label>
                <input
                  type="text"
                  value={settings.greenApiInstanceId}
                  onChange={e => onUpdateSettings({ ...settings, greenApiInstanceId: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-blue-900 outline-hidden font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">API Token Instance:</label>
                <input
                  type="password"
                  value={settings.greenApiToken}
                  onChange={e => onUpdateSettings({ ...settings, greenApiToken: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-blue-900 outline-hidden font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Chat ID del Grupo WhatsApp:</label>
                <input
                  type="text"
                  value={settings.greenApiChatId}
                  onChange={e => onUpdateSettings({ ...settings, greenApiChatId: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-blue-900 outline-hidden font-mono"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <button
                onClick={handleTestWhatsApp}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Enviar Mensaje de Prueba al Grupo</span>
              </button>

              {testMsgStatus && (
                <span className="text-xs text-slate-600 font-medium">{testMsgStatus}</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: USERS & STATUS MANAGEMENT */}
      {activeSection === 'USERS' && (
        <div className="rounded-2xl bg-white border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base text-[#0d253f]">
                Gestión de Estados de Usuarios (Titular, Suplente, Baja)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Modifica el estado de los socios y los pagos del ciclo vigente.
              </p>
            </div>
            <span className="text-xs font-bold text-slate-500">
              Total: {players.length} registros
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-[#0d253f] text-white uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-2.5 px-3">Socio</th>
                  <th className="py-2.5 px-3">Nombre</th>
                  <th className="py-2.5 px-3">Estado</th>
                  <th className="py-2.5 px-3">Ciclo Pagado</th>
                  <th className="py-2.5 px-3">Renovación</th>
                  <th className="py-2.5 px-3">Acciones Rápidas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {players.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-mono font-bold">#{p.memberNumber}</td>
                    <td className="py-2.5 px-3 font-semibold">{p.name}</td>
                    <td className="py-2.5 px-3">
                      <select
                        value={p.status}
                        onChange={e => {
                          const updated = players.map(item =>
                            item.id === p.id ? { ...item, status: e.target.value as any } : item
                          );
                          onUpdatePlayers(updated);
                        }}
                        className="rounded-lg border border-slate-200 px-2 py-1 text-xs font-bold"
                      >
                        <option value="TITULAR">TITULAR</option>
                        <option value="SUPLENTE">SUPLENTE</option>
                        <option value="BAJA">BAJA DEFINITIVA</option>
                      </select>
                    </td>
                    <td className="py-2.5 px-3">
                      <button
                        onClick={() => {
                          const updated = players.map(item =>
                            item.id === p.id
                              ? { ...item, currentCyclePaid: !item.currentCyclePaid }
                              : item
                          );
                          onUpdatePlayers(updated);
                        }}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-bold ${
                          p.currentCyclePaid ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {p.currentCyclePaid ? 'SI (Pagado)' : 'NO (Pendiente)'}
                      </button>
                    </td>
                    <td className="py-2.5 px-3">
                      <select
                        value={p.renewalStatus}
                        onChange={e => {
                          const updated = players.map(item =>
                            item.id === p.id ? { ...item, renewalStatus: e.target.value as any } : item
                          );
                          onUpdatePlayers(updated);
                        }}
                        className="rounded-lg border border-slate-200 px-2 py-1 text-xs"
                      >
                        <option value="RENOVADO">RENOVADO (Cubierto)</option>
                        <option value="PENDIENTE">PENDIENTE (Avisado)</option>
                        <option value="URGENTE_EXPIRA">URGENTE EXPIRA (J9)</option>
                        <option value="EXCLUIDO">EXCLUIDO (Baja)</option>
                      </select>
                    </td>
                    <td className="py-2.5 px-3">
                      <button
                        onClick={() => {
                          const updated = players.map(item =>
                            item.id === p.id
                              ? {
                                  ...item,
                                  renewalStatus: 'RENOVADO' as const,
                                  currentCyclePaid: true,
                                  paidUntilCycle: settings.currentCycle + 1,
                                }
                              : item
                          );
                          onUpdatePlayers(updated);
                        }}
                        className="text-[11px] font-bold text-blue-900 hover:underline"
                      >
                        Marcar 10€ Abonado
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SECTION 3: TICKET UPLOAD */}
      {activeSection === 'TICKET_UPLOAD' && (
        <div className="rounded-2xl bg-white border border-slate-200 p-5 sm:p-6 shadow-xs space-y-5">
          <div>
            <h3 className="font-bold text-base text-[#0d253f] flex items-center gap-2">
              <Upload className="w-5 h-5 text-blue-900" />
              Subir y Publicar Resguardo Oficial Sellado
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Sube la imagen o PDF del boleto sellado y extrae automáticamente los números jugados mediante Inteligencia Artificial (Gemini).
            </p>
          </div>

          {/* AI Scanner File Upload Box */}
          <div className="rounded-2xl border-2 border-dashed border-sky-300 bg-sky-50/50 p-4 sm:p-5 text-center transition hover:border-sky-400">
            <input
              type="file"
              id="ticket-file-input"
              accept="image/*,application/pdf"
              className="hidden"
              onChange={e => {
                const file = e.target.files?.[0];
                if (file) {
                  handleFileUploadAndScan(file);
                }
              }}
            />
            <label
              htmlFor="ticket-file-input"
              className="cursor-pointer flex flex-col items-center justify-center gap-2 select-none"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-100 text-sky-800 shadow-xs">
                {isScanningAI ? (
                  <Loader2 className="w-6 h-6 animate-spin text-sky-600" />
                ) : (
                  <Sparkles className="w-6 h-6 text-sky-600" />
                )}
              </div>
              <div>
                <span className="text-xs sm:text-sm font-bold text-sky-950 block">
                  {isScanningAI
                    ? 'Analizando resguardo con IA (Gemini 3.8)...'
                    : selectedFileName
                    ? `Archivo seleccionado: ${selectedFileName}`
                    : 'Subir Imagen o PDF del Boleto'}
                </span>
                <span className="text-[11px] text-sky-700/80 block mt-0.5">
                  Formatos admitidos: JPG, PNG, WEBP o PDF • Extracción automática de números y reintegro
                </span>
              </div>
              <div className="mt-1 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0d253f] hover:bg-[#153a61] text-white text-xs font-bold transition shadow-xs">
                <FileUp className="w-3.5 h-3.5 text-sky-300" />
                <span>{selectedFileName ? 'Cambiar Imagen o PDF' : 'Seleccionar Archivo'}</span>
              </div>
            </label>

            {/* AI Scan Feedback Messages */}
            {isScanningAI && (
              <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white text-xs font-semibold text-sky-900 border border-sky-200 animate-pulse">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-sky-600" />
                <span>Escaneando números de la apuesta con IA...</span>
              </div>
            )}

            {scanSuccessMessage && (
              <div className="mt-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-start gap-2 text-left">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block text-emerald-950">¡Extracción completada con éxito!</span>
                  <span>{scanSuccessMessage}</span>
                  <span className="block text-[10px] text-emerald-700 mt-0.5">
                    Revisa los datos rellenados abajo antes de publicar el resguardo oficial.
                  </span>
                </div>
              </div>
            )}

            {scanError && (
              <div className="mt-3 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2 text-left">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block text-amber-950">Aviso del escáner:</span>
                  <span>{scanError}</span>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
            <div className="space-y-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Jornada del Ciclo:</label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={newTicketJornada}
                  onChange={e => setNewTicketJornada(parseInt(e.target.value, 10))}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Combinación Jugada (extraída por IA o editable):
                </label>
                <input
                  type="text"
                  value={newTicketNumbers}
                  onChange={e => setNewTicketNumbers(e.target.value)}
                  placeholder="07, 13, 22, 34, 49"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 font-mono font-bold text-blue-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Reintegro (0-9):</label>
                  <input
                    type="number"
                    min={0}
                    max={9}
                    value={newTicketReintegro}
                    onChange={e => setNewTicketReintegro(parseInt(e.target.value, 10))}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Coste Total Apuesta (€):</label>
                  <input
                    type="number"
                    value={newTicketCost}
                    onChange={e => setNewTicketCost(parseFloat(e.target.value))}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 font-mono font-bold text-emerald-800"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">URL o Imagen del Resguardo:</label>
                <input
                  type="text"
                  value={newTicketImage.startsWith('data:') ? 'Imagen digital cargada (Base64)' : newTicketImage}
                  onChange={e => {
                    if (!newTicketImage.startsWith('data:')) {
                      setNewTicketImage(e.target.value);
                    }
                  }}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 font-mono text-[11px]"
                />
              </div>

              <button
                onClick={handleSaveTicket}
                className="w-full py-2.5 rounded-xl bg-[#0d253f] hover:bg-[#153a61] text-white font-bold text-xs shadow-xs transition cursor-pointer"
              >
                {ticketSaveSuccess ? '¡Resguardo Guardado y Notificado!' : 'Publicar Resguardo Sellado'}
              </button>
            </div>

            {/* Live Preview Card */}
            <div className="border rounded-2xl p-4 bg-slate-50 flex flex-col justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase block mb-2">
                  Vista Previa del Resguardo:
                </span>
                <div className="relative rounded-xl overflow-hidden border border-slate-300 h-44 bg-slate-200 flex items-center justify-center">
                  {selectedFileName?.endsWith('.pdf') ? (
                    <div className="p-4 text-center">
                      <FileText className="w-12 h-12 text-rose-600 mx-auto mb-1" />
                      <span className="text-xs font-bold text-slate-800 block truncate max-w-xs">
                        {selectedFileName}
                      </span>
                      <span className="text-[10px] text-slate-500">Documento PDF del resguardo</span>
                    </div>
                  ) : (
                    <>
                      <img
                        src={newTicketImage}
                        alt="Boleto sellado"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/25 flex items-center justify-center text-white font-bold text-xs">
                        Sello Oficial SELAE 20:35 h
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="mt-4 p-3 bg-white rounded-xl border border-slate-200 text-[11px] space-y-1">
                <div><strong>Jornada:</strong> {newTicketJornada}/10</div>
                <div><strong>Combinación detectada:</strong> {newTicketNumbers}</div>
                <div><strong>Reintegro:</strong> [{newTicketReintegro}] • <strong>Coste:</strong> {newTicketCost.toFixed(2)} €</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION: GOOGLE WORKSPACE (DRIVE & SHEETS) */}
      {activeSection === 'WORKSPACE' && (
        <GoogleWorkspacePanel
          settings={settings}
          onUpdateSettings={onUpdateSettings}
          players={players}
          onUpdatePlayers={onUpdatePlayers}
          waitingList={waitingList}
          tickets={tickets}
        />
      )}

      {/* SECTION 4: SCRUTINY SIMULATOR */}
      {activeSection === 'SCRUTINY' && (
        <div className="rounded-2xl bg-white border border-slate-200 p-5 sm:p-6 shadow-xs space-y-5">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="font-bold text-base text-[#0d253f] flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-amber-500" />
                  Escrutinio Oficial SELAE & Cálculo de Aciertos
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Prueba o introduce la combinación ganadora oficial para calcular aciertos y aplicar el reparto según el Art. 5 (Menores a Bolsa, Mayores a Banco).
                </p>
              </div>
            </div>

            {/* Presets de sorteos reales para pruebas inmediatas */}
            <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-3">
              <span className="block text-[11px] font-bold text-amber-900 mb-1.5">
                Probar con sorteos reales oficiales recientes:
              </span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setScrutinyWinning('1, 6, 14, 23, 30, 39');
                    setScrutinyComp(36);
                    setScrutinyReintegro(2);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-white border border-amber-300 hover:bg-amber-100 text-[11px] font-semibold text-amber-900 transition cursor-pointer shadow-2xs"
                >
                  📅 Lunes 9 Nov (Ayer): 01-06-14-23-30-39 (C:36, R:2)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setScrutinyWinning('9, 13, 19, 25, 26, 30');
                    setScrutinyComp(34);
                    setScrutinyReintegro(4);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-white border border-amber-300 hover:bg-amber-100 text-[11px] font-semibold text-amber-900 transition cursor-pointer shadow-2xs"
                >
                  📅 Sábado 7 Nov: 09-13-19-25-26-30 (C:34, R:4)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setScrutinyWinning('4, 8, 9, 15, 31, 32');
                    setScrutinyComp(2);
                    setScrutinyReintegro(3);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-white border border-amber-300 hover:bg-amber-100 text-[11px] font-semibold text-amber-900 transition cursor-pointer shadow-2xs"
                >
                  📅 Jueves 5 Nov: 04-08-09-15-31-32 (C:2, R:3)
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                6 Números Ganadores (separados por comas):
              </label>
              <input
                type="text"
                value={scrutinyWinning}
                onChange={e => setScrutinyWinning(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 font-mono"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Número Complementario:</label>
              <input
                type="number"
                value={scrutinyComp}
                onChange={e => setScrutinyComp(parseInt(e.target.value, 10))}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 font-mono"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Reintegro:</label>
              <input
                type="number"
                value={scrutinyReintegro}
                onChange={e => setScrutinyReintegro(parseInt(e.target.value, 10))}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 font-mono"
              />
            </div>
          </div>

          {/* Comparativa visual en tiempo real contra la apuesta activa de la peña */}
          {tickets[0] && (
            <div className="rounded-xl bg-slate-50 border border-slate-200 p-3.5 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800">
                  Comprobación en vivo contra la apuesta activa (Jornada {tickets[0].jornadaNumber}):
                </span>
                <span className="font-mono text-slate-500 text-[11px]">
                  Apuesta: [{tickets[0].playedNumbers.join(', ')}] | Reintegro jugado: {tickets[0].playedReintegro}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-slate-600">Aciertos detectados:</span>
                {(() => {
                  const winNums = scrutinyWinning.split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n));
                  const hits = tickets[0].playedNumbers.filter(n => winNums.includes(n));
                  const reintegroMatch = scrutinyReintegro === tickets[0].playedReintegro;
                  return (
                    <div className="flex flex-wrap items-center gap-1.5">
                      {hits.length > 0 ? (
                        hits.map(h => (
                          <span key={h} className="px-2 py-0.5 rounded-md bg-emerald-600 text-white font-mono font-bold text-xs">
                            ✓ {h}
                          </span>
                        ))
                      ) : (
                        <span className="text-slate-500 italic">0 aciertos en combinación</span>
                      )}
                      {reintegroMatch && (
                        <span className="px-2 py-0.5 rounded-md bg-blue-600 text-white font-bold text-xs">
                          ★ Reintegro Acertado ({scrutinyReintegro})
                        </span>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          <div className="pt-2 flex items-center gap-4">
            <button
              onClick={handleRunScrutiny}
              className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs transition cursor-pointer"
            >
              Ejecutar Escrutinio y Acreditar Bolsa
            </button>
            {scrutinyResult && (
              <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                {scrutinyResult}
              </span>
            )}
          </div>
        </div>
      )}

      {/* SECTION 5: CALCULATOR */}
      {activeSection === 'CALCULATOR' && (
        <div className="rounded-2xl bg-white border border-slate-200 p-5 sm:p-6 shadow-xs space-y-5">
          <div>
            <h3 className="font-bold text-base text-[#0d253f] flex items-center gap-2">
              <Calculator className="w-5 h-5 text-blue-900" />
              Calculadora de Apuestas Múltiples Adaptables
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Simula la apuesta óptima de SELAE según el número de participantes que han pagado la cuota de 1€.
            </p>
          </div>

          <div className="max-w-xs">
            <label className="font-bold text-xs text-slate-700 block mb-1">
              Número de Jugadores con Pago Completado:
            </label>
            <input
              type="number"
              min={1}
              value={calcPlayers}
              onChange={e => setCalcPlayers(parseInt(e.target.value, 10) || 1)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 font-mono text-base font-bold text-blue-900"
            />
          </div>

          {/* Recommended Option */}
          <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-blue-950 text-sm">
                Apuesta Óptima Recomendada: {recommended.label}
              </span>
              <span className="font-extrabold text-blue-900 text-sm">
                Coste: {recommended.totalCost.toFixed(2)} €
              </span>
            </div>
            <p className="text-blue-800">{recommended.description}</p>
            <div className="text-[11px] text-blue-700">
              Presupuesto recaudado: {calcPlayers * settings.weeklyFee} € (Cuota: 1€/semana por socio).
            </div>
          </div>

          {/* Table of SELAE Official Multiples */}
          <div className="pt-2">
            <h4 className="font-bold text-xs text-slate-700 mb-2">Tabla Oficial de Apuestas Múltiples de La Primitiva:</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {OFFICIAL_MULTIPLE_BETS.map(b => (
                <div
                  key={b.type}
                  className={`p-3 rounded-xl border text-xs ${
                    b.totalCost === calcPlayers
                      ? 'border-blue-800 bg-blue-50/50 ring-2 ring-blue-300'
                      : 'border-slate-200 bg-white'
                  }`}
                >
                  <div className="font-bold text-slate-900">{b.label}</div>
                  <div className="text-slate-500 mt-0.5">{b.betsGenerated} apuestas ({b.totalCost} €)</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Apps Script Deploy Modal */}
      <AppsScriptDeployModal
        isOpen={showAppsScriptModal}
        onClose={() => setShowAppsScriptModal(false)}
        appsScriptUrl={settings.googleAppsScriptUrl}
        onSaveUrl={url => onUpdateSettings({ ...settings, googleAppsScriptUrl: url })}
      />
    </div>
  );
};
