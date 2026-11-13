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
import { whatsappService } from '../services/whatsappService';
import { pushNotificationService } from '../services/pushNotifications';
import { processTicketWithAI } from '../services/aiService';
import { fetchLiveDailyBulletinFromAppsScript } from '../services/lotteryDailyService';
import { getPublicRegistrationShareUrl } from '../services/registrationService';
import { MAX_STORED_TICKETS } from '../services/storage';
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
  const [liveBulletinText, setLiveBulletinText] = useState<string | null>(null);
  const [isLoadingBulletin, setIsLoadingBulletin] = useState(false);
  const [bulletinSendStatus, setBulletinSendStatus] = useState<string | null>(null);
  const [copiedRegLink, setCopiedRegLink] = useState(false);

  // Formulario nuevo boleto
  const [newTicketJornada, setNewTicketJornada] = useState(settings.currentJornada);
  const [newTicketCost, setNewTicketCost] = useState(14);
  const [newTicketNumbers, setNewTicketNumbers] = useState('');
  const [newTicketReintegro, setNewTicketReintegro] = useState(0);
  const [newTicketImage, setNewTicketImage] = useState('');
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
  const [scrutinyWinning, setScrutinyWinning] = useState('');
  const [scrutinyComp, setScrutinyComp] = useState(1);
  const [scrutinyReintegro, setScrutinyReintegro] = useState(0);
  const [scrutinyResult, setScrutinyResult] = useState<string | null>(null);

  // Interruptores SÍ/NO
  const handleToggleDailySummary = (val: boolean) => {
    onUpdateSettings({ ...settings, sendDailyGeneralSummary: val });
  };

  const handleToggleBulletinPreview = async () => {
    if (showBulletinPreview) {
      setShowBulletinPreview(false);
      return;
    }
    setShowBulletinPreview(true);
    setIsLoadingBulletin(true);
    const res = await fetchLiveDailyBulletinFromAppsScript(settings.googleAppsScriptUrl, false);
    setIsLoadingBulletin(false);
    if (res.success && res.formattedWhatsAppMessage) {
      setLiveBulletinText(res.formattedWhatsAppMessage);
    } else {
      setLiveBulletinText(res.error || 'No hay resultados reales disponibles en este momento.');
    }
  };

  const handleSendDailyBulletin = async () => {
    setBulletinSendStatus('Consultando resultados reales en vivo (ONLAE + ONCE) desde Apps Script...');
    const liveRes = await fetchLiveDailyBulletinFromAppsScript(settings.googleAppsScriptUrl, false);
    if (!liveRes.success || !liveRes.formattedWhatsAppMessage) {
      setBulletinSendStatus(
        liveRes.error || 'No se pudieron obtener resultados reales en vivo todavía. No se enviará un mensaje vacío.'
      );
      return;
    }

    setLiveBulletinText(liveRes.formattedWhatsAppMessage);
    const result = await whatsappService.sendTextMessage(
      liveRes.formattedWhatsAppMessage,
      {
        instanceId: settings.greenApiInstanceId,
        token: settings.greenApiToken,
        chatId: settings.greenApiChatId,
      }
    );
    if (result.success) {
      setBulletinSendStatus('¡Boletín diario real (ONLAE + ONCE) enviado con éxito al grupo!');
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

    onUpdateTickets([newTicket, ...tickets].slice(0, MAX_STORED_TICKETS));
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

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="rounded-3xl bg-[#0A2540] p-6 sm:p-7 text-white shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-sm uppercase font-extrabold tracking-wider text-[#FF6B00] block">
            Acceso Autorizado
          </span>
          <h1 className="text-2xl sm:text-3xl font-black font-serif text-white mt-0.5">
            Panel de Control del Administrador
          </h1>
          <p className="text-base text-slate-300 mt-1">
            Gestión de usuarios, resguardos sellados, WhatsApp Green API y Google Sheets.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setShowAppsScriptModal(true)}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 min-h-[48px] rounded-xl bg-white text-[#0A2540] font-bold text-base hover:bg-slate-100 shadow-xs transition cursor-pointer"
          >
            <FileCode className="w-5 h-5 text-[#FF6B00]" />
            <span>Código Apps Script</span>
          </button>
          <button
            type="button"
            onClick={onLogoutAdmin}
            className="flex-1 sm:flex-none px-4 min-h-[48px] rounded-xl bg-[#FF6B00] hover:bg-[#E55E00] text-base font-bold text-white transition cursor-pointer"
          >
            Cerrar Sesión
          </button>
        </div>
      </div>

      {/* Admin Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {[
          { id: 'CONFIG', label: 'Interruptores & WhatsApp', icon: Settings },
          { id: 'USERS', label: 'Gestión Socios', icon: Users },
          { id: 'TICKET_UPLOAD', label: 'Subir Resguardo', icon: Upload },
          { id: 'WORKSPACE', label: 'Sheets & Drive', icon: HardDrive },
          { id: 'SCRUTINY', label: 'Escrutinio SELAE', icon: Trophy },
          { id: 'MULTIPLE_BETS', label: 'Apuestas Múltiples', icon: Layers },
        ].map(item => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;
          return (
            <button
              type="button"
              key={item.id}
              onClick={() => setActiveSection(item.id as typeof activeSection)}
              className={`flex items-center gap-2 px-4 min-h-[48px] rounded-xl text-base font-bold transition shrink-0 cursor-pointer ${
                isActive
                  ? 'bg-[#0A2540] text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-[#FF6B00]' : 'text-slate-500'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* SECTION 1: CONFIG & WHATSAPP SWITCHES */}
      {activeSection === 'CONFIG' && (
        <div className="space-y-6">
          <div className="rounded-3xl bg-white border border-slate-200 p-5 sm:p-7 shadow-xs space-y-6">
            <div>
              <h2 className="font-extrabold text-xl text-[#0A2540]">
                Interruptores de Automatización (WhatsApp Green API)
              </h2>
              <p className="text-base text-slate-600 mt-1">
                Configura los envíos automáticos según el reglamento oficial.
              </p>
            </div>

            <div className="space-y-5 divide-y divide-slate-200">
              <div className="pt-2 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <strong className="text-base text-[#0A2540] flex items-center gap-2">
                      <Newspaper className="w-5 h-5 text-[#FF6B00] shrink-0" />
                      Envío del Resumen Diario General ONLAE + ONCE
                    </strong>
                    <p className="text-base text-slate-600 mt-1 leading-relaxed">
                      Si está <strong>ACTIVO</strong>, compila y envía cada noche el boletín con todos los sorteos del día (SELAE + ONCE).
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className={`text-sm font-extrabold ${settings.sendDailyGeneralSummary ? 'text-[#0A2540]' : 'text-slate-500'}`}>
                      {settings.sendDailyGeneralSummary ? 'SÍ (ACTIVO)' : 'NO'}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleToggleDailySummary(!settings.sendDailyGeneralSummary)}
                      className={`relative inline-flex h-8 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-hidden ${
                        settings.sendDailyGeneralSummary ? 'bg-[#0A2540]' : 'bg-slate-300'
                      }`}
                      aria-label="Alternar resumen diario"
                    >
                      <span
                        className={`inline-block h-7 w-7 transform rounded-full bg-white shadow-sm transition duration-200 ${
                          settings.sendDailyGeneralSummary ? 'translate-x-6' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <button
                    type="button"
                    onClick={handleToggleBulletinPreview}
                    className="inline-flex items-center gap-2 px-4 min-h-[46px] rounded-xl bg-slate-100 hover:bg-slate-200 text-[#0A2540] text-base font-bold transition cursor-pointer"
                  >
                    <Eye className="w-4 h-4" />
                    <span>{showBulletinPreview ? 'Ocultar Previsualización' : 'Previsualizar Boletín en Vivo'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSendDailyBulletin}
                    className="inline-flex items-center gap-2 px-4 min-h-[46px] rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-base font-bold transition shadow-xs cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                    <span>Enviar Boletín Real Ahora</span>
                  </button>

                  {bulletinSendStatus && (
                    <span className="text-sm sm:text-base font-bold px-3.5 py-2 rounded-xl bg-emerald-50 text-emerald-900 border border-emerald-200">
                      {bulletinSendStatus}
                    </span>
                  )}
                </div>

                {showBulletinPreview && (
                  <div className="rounded-2xl bg-[#0A2540] text-slate-100 p-4 text-sm sm:text-base font-mono whitespace-pre-wrap max-h-80 overflow-y-auto leading-relaxed">
                    {isLoadingBulletin
                      ? 'Consultando resultados reales en vivo (SELAE + JuegosONCE)...'
                      : liveBulletinText || 'Sin datos cargados.'}
                  </div>
                )}
              </div>

              <div className="pt-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <strong className="text-base text-[#0A2540] block">
                    Publicación &amp; Envío del Resguardo Oficial a las 20:35 h
                  </strong>
                  <p className="text-base text-slate-600 mt-1">
                    Envía el resguardo validado por terminal SELAE automáticamente al grupo de WhatsApp a las 20:35 h.
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className={`text-sm font-extrabold ${settings.sendDrawDayTicketAt2035 ? 'text-[#0A2540]' : 'text-slate-500'}`}>
                    {settings.sendDrawDayTicketAt2035 ? 'SÍ' : 'NO'}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleToggle2035(!settings.sendDrawDayTicketAt2035)}
                    className={`relative inline-flex h-8 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-hidden ${
                      settings.sendDrawDayTicketAt2035 ? 'bg-[#0A2540]' : 'bg-slate-300'
                    }`}
                    aria-label="Alternar envío 20:35"
                  >
                    <span
                      className={`inline-block h-7 w-7 transform rounded-full bg-white shadow-sm transition duration-200 ${
                        settings.sendDrawDayTicketAt2035 ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-3xl bg-white border border-slate-200 p-5 sm:p-7 shadow-xs space-y-5">
            <h2 className="font-extrabold text-xl text-[#0A2540] flex items-center gap-2.5">
              <Smartphone className="w-6 h-6 text-emerald-600" />
              Credenciales de Green API (WhatsApp)
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-base">
              <div>
                <label className="font-bold text-[#0A2540] block mb-1.5">ID de Instancia:</label>
                <input
                  type="text"
                  value={settings.greenApiInstanceId}
                  onChange={e => onUpdateSettings({ ...settings, greenApiInstanceId: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-3.5 min-h-[46px] focus:ring-2 focus:ring-[#0A2540] outline-hidden font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-[#0A2540] block mb-1.5">API Token Instance:</label>
                <input
                  type="password"
                  value={settings.greenApiToken}
                  onChange={e => onUpdateSettings({ ...settings, greenApiToken: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-3.5 min-h-[46px] focus:ring-2 focus:ring-[#0A2540] outline-hidden font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-[#0A2540] block mb-1.5">Chat ID del Grupo:</label>
                <input
                  type="text"
                  value={settings.greenApiChatId}
                  onChange={e => onUpdateSettings({ ...settings, greenApiChatId: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-3.5 min-h-[46px] focus:ring-2 focus:ring-[#0A2540] outline-hidden font-mono"
                />
              </div>
            </div>

            <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleTestWhatsApp}
                className="inline-flex items-center gap-2 px-5 min-h-[48px] rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-base shadow-xs transition cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>Enviar Mensaje de Prueba</span>
              </button>

              {testMsgStatus && (
                <span className="text-base text-slate-700 font-semibold">{testMsgStatus}</span>
              )}
            </div>
          </div>

          <div className="rounded-3xl bg-white border border-slate-200 p-5 sm:p-7 shadow-xs space-y-3">
            <h2 className="font-extrabold text-xl text-[#0A2540]">
              Enlace Público de Inscripción (Sin instalar App)
            </h2>
            <p className="text-base text-slate-600">
              Comparte este enlace directo para que cualquier nuevo jugador se apunte a la lista de espera desde el navegador, conectado directamente con tu Google Sheets:
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                readOnly
                value={getPublicRegistrationShareUrl()}
                className="flex-1 rounded-xl border border-slate-300 bg-[#F4F6F9] px-3.5 min-h-[46px] font-mono text-sm sm:text-base text-[#0A2540]"
              />
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(getPublicRegistrationShareUrl());
                  setCopiedRegLink(true);
                  setTimeout(() => setCopiedRegLink(false), 2500);
                }}
                className="px-5 min-h-[46px] rounded-xl bg-[#FF6B00] hover:bg-[#E55E00] text-white font-bold text-base transition cursor-pointer shrink-0"
              >
                {copiedRegLink ? '¡Enlace Copiado!' : 'Copiar Enlace'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: USERS & STATUS MANAGEMENT */}
      {activeSection === 'USERS' && (
        <div className="rounded-3xl bg-white border border-slate-200 p-5 sm:p-7 shadow-xs space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="font-extrabold text-xl text-[#0A2540]">
                Gestión de Estados de Socios
              </h2>
              <p className="text-base text-slate-600 mt-0.5">
                Modifica el estado (Titular, Suplente, Baja) y los pagos del ciclo vigente.
              </p>
            </div>
            <span className="text-base font-bold text-[#0A2540] tabular-nums">
              Total: {players.length}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-base text-slate-800">
              <thead className="bg-[#0A2540] text-white uppercase text-sm tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Socio</th>
                  <th className="py-3.5 px-4">Nombre</th>
                  <th className="py-3.5 px-4">Estado</th>
                  <th className="py-3.5 px-4">Ciclo Pagado</th>
                  <th className="py-3.5 px-4">Renovación</th>
                  <th className="py-3.5 px-4">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {players.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="py-3.5 px-4 font-mono font-extrabold tabular-nums">#{p.memberNumber}</td>
                    <td className="py-3.5 px-4 font-bold text-[#0A2540]">{p.name}</td>
                    <td className="py-3.5 px-4">
                      <select
                        value={p.status}
                        onChange={e => {
                          const updated = players.map(item =>
                            item.id === p.id ? { ...item, status: e.target.value as Player['status'] } : item
                          );
                          onUpdatePlayers(updated);
                        }}
                        className="rounded-xl border border-slate-300 px-3 min-h-[42px] text-sm sm:text-base font-bold bg-white"
                      >
                        <option value="TITULAR">TITULAR</option>
                        <option value="SUPLENTE">SUPLENTE</option>
                        <option value="BAJA">BAJA DEFINITIVA</option>
                      </select>
                    </td>
                    <td className="py-3.5 px-4">
                      <button
                        type="button"
                        onClick={() => {
                          const updated = players.map(item =>
                            item.id === p.id
                              ? { ...item, currentCyclePaid: !item.currentCyclePaid }
                              : item
                          );
                          onUpdatePlayers(updated);
                        }}
                        className={`px-3 min-h-[42px] rounded-xl text-sm sm:text-base font-bold cursor-pointer ${
                          p.currentCyclePaid ? 'bg-emerald-100 text-emerald-900' : 'bg-rose-100 text-rose-900'
                        }`}
                      >
                        {p.currentCyclePaid ? 'SÍ (Pagado)' : 'NO (Pendiente)'}
                      </button>
                    </td>
                    <td className="py-3.5 px-4">
                      <select
                        value={p.renewalStatus}
                        onChange={e => {
                          const updated = players.map(item =>
                            item.id === p.id ? { ...item, renewalStatus: e.target.value as Player['renewalStatus'] } : item
                          );
                          onUpdatePlayers(updated);
                        }}
                        className="rounded-xl border border-slate-300 px-3 min-h-[42px] text-sm sm:text-base bg-white"
                      >
                        <option value="RENOVADO">RENOVADO (Cubierto)</option>
                        <option value="PENDIENTE">PENDIENTE (Avisado)</option>
                        <option value="URGENTE_EXPIRA">URGENTE EXPIRA (J9)</option>
                        <option value="EXCLUIDO">EXCLUIDO (Baja)</option>
                      </select>
                    </td>
                    <td className="py-3.5 px-4">
                      <button
                        type="button"
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
                        className="text-sm sm:text-base font-bold text-[#FF6B00] hover:underline min-h-[42px] cursor-pointer"
                      >
                        Marcar 10 € Abonado
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
        <div className="rounded-3xl bg-white border border-slate-200 p-5 sm:p-7 shadow-xs space-y-6">
          <div>
            <h2 className="font-extrabold text-xl text-[#0A2540] flex items-center gap-2.5">
              <Upload className="w-6 h-6 text-[#FF6B00]" />
              Subir y Publicar Resguardo Oficial Sellado
            </h2>
            <p className="text-base text-slate-600 mt-1">
              Sube la imagen o PDF del boleto sellado para extraer automáticamente los números jugados mediante IA.
            </p>
          </div>

          <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-[#F4F6F9] p-5 sm:p-6 text-center transition hover:border-[#0A2540]">
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
              className="cursor-pointer flex flex-col items-center justify-center gap-3 select-none"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0A2540] text-[#FF6B00] shadow-xs">
                {isScanningAI ? (
                  <Loader2 className="w-7 h-7 animate-spin" />
                ) : (
                  <Sparkles className="w-7 h-7" />
                )}
              </div>
              <div>
                <span className="text-base sm:text-lg font-extrabold text-[#0A2540] block">
                  {isScanningAI
                    ? 'Analizando resguardo con IA...'
                    : selectedFileName
                    ? `Archivo: ${selectedFileName}`
                    : 'Subir Imagen o PDF del Boleto'}
                </span>
                <span className="text-sm sm:text-base text-slate-600 block mt-1">
                  JPG, PNG, WEBP o PDF · Extracción automática de números y reintegro
                </span>
              </div>
              <div className="mt-1 inline-flex items-center gap-2 px-5 min-h-[46px] rounded-xl bg-[#0A2540] hover:bg-[#13375B] text-white text-base font-bold transition shadow-xs">
                <FileUp className="w-5 h-5 text-[#FF6B00]" />
                <span>{selectedFileName ? 'Cambiar Archivo' : 'Seleccionar Archivo'}</span>
              </div>
            </label>

            {isScanningAI && (
              <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-base font-bold text-[#0A2540] border border-slate-200 animate-pulse">
                <Loader2 className="w-5 h-5 animate-spin text-[#FF6B00]" />
                <span>Escaneando números del boleto...</span>
              </div>
            )}

            {scanSuccessMessage && (
              <div className="mt-4 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-base text-emerald-950 flex items-start gap-2.5 text-left">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">Extracción completada</span>
                  <span>{scanSuccessMessage}</span>
                </div>
              </div>
            )}

            {scanError && (
              <div className="mt-4 p-4 rounded-xl bg-orange-50 border border-orange-200 text-base text-[#0A2540] flex items-start gap-2.5 text-left">
                <AlertTriangle className="w-5 h-5 text-[#FF6B00] shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">Aviso del escáner:</span>
                  <span>{scanError}</span>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-base">
            <div className="space-y-4">
              <div>
                <label className="font-bold text-[#0A2540] block mb-1.5">Jornada del Ciclo:</label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={newTicketJornada}
                  onChange={e => setNewTicketJornada(parseInt(e.target.value, 10))}
                  className="w-full rounded-xl border border-slate-300 px-3.5 min-h-[46px] font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-[#0A2540] block mb-1.5">
                  Combinación Jugada:
                </label>
                <input
                  type="text"
                  value={newTicketNumbers}
                  onChange={e => setNewTicketNumbers(e.target.value)}
                  placeholder="07, 13, 22, 34, 49"
                  className="w-full rounded-xl border border-slate-300 px-3.5 min-h-[46px] font-mono font-bold text-[#0A2540]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-[#0A2540] block mb-1.5">Reintegro (0-9):</label>
                  <input
                    type="number"
                    min={0}
                    max={9}
                    value={newTicketReintegro}
                    onChange={e => setNewTicketReintegro(parseInt(e.target.value, 10))}
                    className="w-full rounded-xl border border-slate-300 px-3.5 min-h-[46px] font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-[#0A2540] block mb-1.5">Coste Total (€):</label>
                  <input
                    type="number"
                    value={newTicketCost}
                    onChange={e => setNewTicketCost(parseFloat(e.target.value))}
                    className="w-full rounded-xl border border-slate-300 px-3.5 min-h-[46px] font-mono font-bold text-emerald-800"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-[#0A2540] block mb-1.5">URL o Imagen del Resguardo:</label>
                <input
                  type="text"
                  value={newTicketImage.startsWith('data:') ? 'Imagen digital cargada (Base64)' : newTicketImage}
                  onChange={e => {
                    if (!newTicketImage.startsWith('data:')) {
                      setNewTicketImage(e.target.value);
                    }
                  }}
                  className="w-full rounded-xl border border-slate-300 px-3.5 min-h-[46px] font-mono text-sm sm:text-base"
                />
              </div>

              <button
                type="button"
                onClick={handleSaveTicket}
                className="w-full min-h-[50px] rounded-xl bg-[#FF6B00] hover:bg-[#E55E00] text-white font-bold text-base shadow-xs transition cursor-pointer"
              >
                {ticketSaveSuccess ? '¡Resguardo Guardado y Notificado!' : 'Publicar Resguardo Sellado'}
              </button>
            </div>

            <div className="border border-slate-200 rounded-2xl p-5 bg-[#F4F6F9] flex flex-col justify-between">
              <div>
                <span className="text-sm font-bold text-slate-600 uppercase block mb-2.5">
                  Vista Previa del Resguardo
                </span>
                <div className="relative rounded-xl overflow-hidden border border-slate-300 h-48 bg-slate-200 flex items-center justify-center">
                  {selectedFileName?.endsWith('.pdf') ? (
                    <div className="p-4 text-center">
                      <FileText className="w-12 h-12 text-rose-600 mx-auto mb-1" />
                      <span className="text-base font-bold text-[#0A2540] block truncate max-w-xs">
                        {selectedFileName}
                      </span>
                      <span className="text-sm text-slate-600">Documento PDF del resguardo</span>
                    </div>
                  ) : newTicketImage ? (
                    <>
                      <img
                        src={newTicketImage}
                        alt="Boleto sellado"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center text-white font-bold text-base">
                        Sello Oficial SELAE 20:35 h
                      </div>
                    </>
                  ) : (
                    <div className="p-4 text-center text-slate-600">
                      <Upload className="w-10 h-10 text-slate-400 mx-auto mb-1.5" />
                      <span className="text-sm font-semibold block">
                        Sube la foto o PDF del boleto sellado
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 p-4 bg-white rounded-xl border border-slate-200 text-base space-y-1.5">
                <div><strong>Jornada:</strong> {newTicketJornada}/10</div>
                <div><strong>Combinación:</strong> {newTicketNumbers}</div>
                <div><strong>Reintegro:</strong> [{newTicketReintegro}] · <strong>Coste:</strong> {newTicketCost.toFixed(2)} €</div>
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
        <div className="rounded-3xl bg-white border border-slate-200 p-5 sm:p-7 shadow-xs space-y-5">
          <div>
            <h2 className="font-extrabold text-xl text-[#0A2540] flex items-center gap-2.5">
              <Trophy className="w-6 h-6 text-[#FF6B00]" />
              Escrutinio Oficial SELAE &amp; Cálculo de Aciertos
            </h2>
            <p className="text-base text-slate-600 mt-1">
              Introduce la combinación ganadora oficial para calcular aciertos y repartir según el Art. 5.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-base">
            <div>
              <label className="font-bold text-[#0A2540] block mb-1.5">
                6 Números Ganadores:
              </label>
              <input
                type="text"
                value={scrutinyWinning}
                onChange={e => setScrutinyWinning(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3.5 min-h-[46px] font-mono"
              />
            </div>
            <div>
              <label className="font-bold text-[#0A2540] block mb-1.5">Complementario:</label>
              <input
                type="number"
                value={scrutinyComp}
                onChange={e => setScrutinyComp(parseInt(e.target.value, 10))}
                className="w-full rounded-xl border border-slate-300 px-3.5 min-h-[46px] font-mono"
              />
            </div>
            <div>
              <label className="font-bold text-[#0A2540] block mb-1.5">Reintegro:</label>
              <input
                type="number"
                value={scrutinyReintegro}
                onChange={e => setScrutinyReintegro(parseInt(e.target.value, 10))}
                className="w-full rounded-xl border border-slate-300 px-3.5 min-h-[46px] font-mono"
              />
            </div>
          </div>

          {tickets[0] && (
            <div className="rounded-2xl bg-[#F4F6F9] border border-slate-200 p-4 space-y-2.5 text-base">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-bold text-[#0A2540]">
                  Comprobación en vivo (Jornada {tickets[0].jornadaNumber}):
                </span>
                <span className="font-mono text-slate-600 text-sm font-semibold tabular-nums">
                  Apuesta: [{tickets[0].playedNumbers.join(', ')}] · R: {tickets[0].playedReintegro}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-slate-700 font-medium">Aciertos:</span>
                {(() => {
                  const winNums = scrutinyWinning.split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n));
                  const hits = tickets[0].playedNumbers.filter(n => winNums.includes(n));
                  const reintegroMatch = scrutinyReintegro === tickets[0].playedReintegro;
                  return (
                    <div className="flex flex-wrap items-center gap-2">
                      {hits.length > 0 ? (
                        hits.map(h => (
                          <span key={h} className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-mono font-bold text-sm">
                            {h}
                          </span>
                        ))
                      ) : (
                        <span className="text-slate-600 font-semibold">0 aciertos en combinación</span>
                      )}
                      {reintegroMatch && (
                        <span className="px-2.5 py-1 rounded-lg bg-[#0A2540] text-white font-bold text-sm">
                          Reintegro Acertado ({scrutinyReintegro})
                        </span>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          <div className="pt-2 flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={handleRunScrutiny}
              className="px-6 min-h-[50px] rounded-xl bg-[#FF6B00] hover:bg-[#E55E00] text-white font-bold text-base shadow-xs transition cursor-pointer"
            >
              Ejecutar Escrutinio y Acreditar Bolsa
            </button>
            {scrutinyResult && (
              <span className="text-base font-bold text-emerald-900 bg-emerald-50 px-4 py-2.5 rounded-xl border border-emerald-200">
                {scrutinyResult}
              </span>
            )}
          </div>
        </div>
      )}

      {/* SECTION 5: MULTIPLE BETS GUIDE */}
      {activeSection === 'MULTIPLE_BETS' && (
        <div className="space-y-4">
          <MultipleBetsGuide />
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
