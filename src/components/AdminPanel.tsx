import React, { useState, useEffect, useCallback } from 'react';
import {
  Player,
  WaitingListEntry,
  TicketDraw,
  SyndicateSettings,
  MultipleBetType,
  PrizeHistoryEntry,
  ScrutinyCycleResult
} from '../types/lottery';
import {
  calculateMultiTicketScrutiny,
  generateBlockCombinations
} from '../services/lotteryRules';
import { whatsappService } from '../services/whatsappService';
import { pushNotificationService } from '../services/pushNotifications';
import { processTicketWithAI, optimizeTicketImageToDataUrl } from '../services/aiService';
import { fetchLiveDailyBulletinFromAppsScript } from '../services/lotteryDailyService';
import {
  getPublicRegistrationShareUrl,
  validateMemberPaymentByAdmin
} from '../services/registrationService';
import {
  archivePreviousPendingTicketsForNewSchedule,
  capTicketsKeepingPlayed,
  getTicketJornadaKey
} from '../services/storage';
import {
  getNextPrimitivaDrawDate,
  isTicketPublishedNow,
  formatScheduledDateTimeLabel,
  syncTicketWithAppsScript,
  syncJornadaBatchWithAppsScript,
  normalizeReceiptImageUrl,
  getReceiptImageCandidates
} from '../services/ticketPublishService';
import { AppsScriptDeployModal } from './AppsScriptDeployModal';
import { GoogleWorkspacePanel } from './GoogleWorkspacePanel';
import { MultipleBetsGuide } from './MultipleBetsGuide';
import { downloadPlayerListPdf, PlayerPdfOptions, DEFAULT_PLAYER_PDF_OPTIONS } from '../services/pdfService';

import {
  Settings,
  Users,
  Upload,
  HardDrive,
  Send,
  Layers,
  Newspaper,
  Trophy,
  AlertTriangle,
  Sparkles,
  FileCode,
  Smartphone,
  Eye,
  FileUp,
  FileText,
  Loader2,
  CheckCircle2,
  BellRing,
  Trash2,
  Megaphone,
  Wallet,
  RotateCcw,
  CalendarClock,
  Clock,
  Calculator,
  EyeOff,
  Plus,
  LayoutGrid,
  FileDown,
  X
} from 'lucide-react';

interface ModalityPreset {
  key: string;
  label: string;
  betType: MultipleBetType;
  betsCount: number;
  numbersCount: number;
}

const MODALITY_PRESETS: ModalityPreset[] = [
  { key: 'MULTIPLE_5', label: 'Múltiple 44 (5 Fijos)', betType: 'MULTIPLE_5', betsCount: 44, numbersCount: 5 },
  { key: 'MULTIPLE_7', label: 'Múltiple 7', betType: 'MULTIPLE_7', betsCount: 7, numbersCount: 7 },
  { key: 'MULTIPLE_8', label: 'Múltiple 8', betType: 'MULTIPLE_8', betsCount: 28, numbersCount: 8 },
  { key: 'MULTIPLE_9', label: 'Múltiple 9', betType: 'MULTIPLE_9', betsCount: 84, numbersCount: 9 },
  { key: 'MULTIPLE_10', label: 'Múltiple 10', betType: 'MULTIPLE_10', betsCount: 210, numbersCount: 10 },
  { key: 'MULTIPLE_11', label: 'Múltiple 11', betType: 'MULTIPLE_11', betsCount: 462, numbersCount: 11 },
  { key: 'CUSTOM', label: 'Combinación Personalizada', betType: 'COMBINADA', betsCount: 1, numbersCount: 6 },
];

function inferModalityPresetFromCount(count: number): ModalityPreset {
  if (count === 5) return MODALITY_PRESETS[0];
  if (count === 7) return MODALITY_PRESETS[1];
  if (count === 8) return MODALITY_PRESETS[2];
  if (count === 9) return MODALITY_PRESETS[3];
  if (count === 10) return MODALITY_PRESETS[4];
  if (count === 11) return MODALITY_PRESETS[5];
  return MODALITY_PRESETS[6];
}

function parseDraftNumbersList(raw: string): number[] {
  const nums = raw
    .split(/[,;\s-]+/)
    .map(s => parseInt(s.trim(), 10))
    .filter(n => !isNaN(n) && n >= 1 && n <= 49);
  return Array.from(new Set(nums)).sort((a, b) => a - b);
}

function formatDraftNumbers(nums: number[]): string {
  return nums
    .slice()
    .sort((a, b) => a - b)
    .map(n => (n < 10 ? `0${n}` : `${n}`))
    .join(', ');
}

interface TicketDraftItem {
  draftId: string;
  numbers: string;
  reintegro: number;
  cost: number;
  modalityKey: string;
  modalityLabel: string;
  betsCount: number;
  modalityManuallySet: boolean;
  isNumberGridOpen: boolean;
  image: string;
  fileName: string | null;
  isScanningAI: boolean;
  scanError: string | null;
  scanSuccessMessage: string | null;
  previewCandidateIdx: number;
  previewLoadFailed: boolean;
}

const createEmptyDraft = (defaultCost = 44): TicketDraftItem => ({
  draftId: `draft-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  numbers: '',
  reintegro: 0,
  cost: defaultCost,
  modalityKey: 'MULTIPLE_5',
  modalityLabel: 'Múltiple 44 (5 Fijos)',
  betsCount: 44,
  modalityManuallySet: false,
  isNumberGridOpen: false,
  image: '',
  fileName: null,
  isScanningAI: false,
  scanError: null,
  scanSuccessMessage: null,
  previewCandidateIdx: 0,
  previewLoadFailed: false,
});

interface AppInstallationEntry {
  deviceId: string;
  primeraVisita: string;
  ultimoAcceso: string;
  modo: string;
  plataforma: string;
  dni: string;
  nombre: string;
}

interface AdminPanelProps {
  settings: SyndicateSettings;
  onUpdateSettings: (newSettings: SyndicateSettings) => void;
  players: Player[];
  onUpdatePlayers: (newPlayers: Player[]) => void;
  waitingList: WaitingListEntry[];
  onUpdateWaitingList: (newList: WaitingListEntry[]) => void;
  tickets: TicketDraw[];
  onUpdateTickets: (newTickets: TicketDraw[]) => void;
  prizeHistory: PrizeHistoryEntry[];
  onUpdatePrizeHistory: (entries: PrizeHistoryEntry[]) => void;
  adminPassword?: string;
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
  prizeHistory,
  onUpdatePrizeHistory,
  adminPassword,
  onLogoutAdmin,
}) => {
  const [activeSection, setActiveSection] = useState<
    'CONFIG' | 'USERS' | 'TICKET_UPLOAD' | 'PUSH_ALERTS' | 'WORKSPACE' | 'MULTIPLE_BETS' | 'SCRUTINY'
  >('CONFIG');

  const [showAppsScriptModal, setShowAppsScriptModal] = useState(false);
  const [testMsgStatus, setTestMsgStatus] = useState<string | null>(null);
  const [showBulletinPreview, setShowBulletinPreview] = useState(false);
  const [liveBulletinText, setLiveBulletinText] = useState<string | null>(null);
  const [isLoadingBulletin, setIsLoadingBulletin] = useState(false);
  const [bulletinSendStatus, setBulletinSendStatus] = useState<string | null>(null);
  const [copiedRegLink, setCopiedRegLink] = useState(false);
  const [confirmResetFund, setConfirmResetFund] = useState(false);
  const [resetFundFeedback, setResetFundFeedback] = useState<string | null>(null);

  // Estados de gestión uncensored desde pestaña "Usuarios"
  const [isLoadingAdminUsers, setIsLoadingAdminUsers] = useState(false);
  const [adminUsersFeedback, setAdminUsersFeedback] = useState<string | null>(null);
  const [validatingPaymentId, setValidatingPaymentId] = useState<string | null>(null);

  // Estados de seguimiento de Instalaciones PWA ("Instalaciones App")
  const [installations, setInstallations] = useState<AppInstallationEntry[]>([]);
  const [installStats, setInstallStats] = useState<{
    totalDispositivos: number;
    totalInstaladas: number;
    identificadas: number;
  }>({ totalDispositivos: 0, totalInstaladas: 0, identificadas: 0 });
  const [isLoadingInstallations, setIsLoadingInstallations] = useState(false);
  const [installationsFeedback, setInstallationsFeedback] = useState<string | null>(null);

  // Estados de "Escrutinio del Ciclo" automático y premio manual
  const [cycleScrutiny, setCycleScrutiny] = useState<ScrutinyCycleResult | null>(null);
  const [isLoadingCycleScrutiny, setIsLoadingCycleScrutiny] = useState(false);
  const [manualPrizeInput, setManualPrizeInput] = useState<string>('');
  const [isSavingManualPrize, setIsSavingManualPrize] = useState(false);
  const [manualPrizeFeedback, setManualPrizeFeedback] = useState<string | null>(null);

  // Estados de "Gestión del Bote de Premios" (Ganancia Semanal + Bote General)
  const [weeklyPrizeInput, setWeeklyPrizeInput] = useState<string>(() =>
    (settings.weeklyPrizeGain || 0).toFixed(2)
  );
  const [prizeFundInput, setPrizeFundInput] = useState<string>(() =>
    settings.prizeFundBalance.toFixed(2)
  );
  const [isSavingPrizeFund, setIsSavingPrizeFund] = useState(false);
  const [prizeFundFeedback, setPrizeFundFeedback] = useState<string | null>(null);

  // Modo Captación Inicial y Calculadora de Combinaciones
  const [isSavingRecruitmentMode, setIsSavingRecruitmentMode] = useState(false);
  const [recruitmentModeFeedback, setRecruitmentModeFeedback] = useState<string | null>(null);
  const [showAllCombinations, setShowAllCombinations] = useState(false);

  // Estados del Modal de Configuración de Exportación PDF
  const [showPdfExportModal, setShowPdfExportModal] = useState(false);
  const [pdfExportListType, setPdfExportListType] = useState<'TITULAR' | 'SUPLENTE' | 'BAJA' | 'ALL'>('TITULAR');
  const [pdfExportOptions, setPdfExportOptions] = useState<PlayerPdfOptions>(DEFAULT_PLAYER_PDF_OPTIONS);

  const handleOpenPdfExportModal = (type: 'TITULAR' | 'SUPLENTE' | 'BAJA' | 'ALL') => {
    setPdfExportListType(type);
    setPdfExportOptions(DEFAULT_PLAYER_PDF_OPTIONS);
    setShowPdfExportModal(true);
  };

  useEffect(() => {
    setPrizeFundInput(settings.prizeFundBalance.toFixed(2));
  }, [settings.prizeFundBalance]);

  useEffect(() => {
    setWeeklyPrizeInput((settings.weeklyPrizeGain || 0).toFixed(2));
  }, [settings.weeklyPrizeGain]);

  const getCleanGasUrl = useCallback(() => {
    const raw = (settings.googleAppsScriptUrl || '').trim();
    if (!raw) return '';
    return raw.endsWith('/exe') ? `${raw}c` : raw;
  }, [settings.googleAppsScriptUrl]);

  const parseTimestampMs = (ts?: string, preMs?: number): number => {
    if (typeof preMs === 'number' && !isNaN(preMs)) return preMs;
    const str = String(ts || '').trim();
    if (!str) return Number.MAX_SAFE_INTEGER;
    const m = str.match(/^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,3}))?/);
    if (m) {
      const ms = m[7] ? parseInt((m[7] + '000').slice(0, 3), 10) : 0;
      return new Date(
        parseInt(m[3], 10),
        parseInt(m[2], 10) - 1,
        parseInt(m[1], 10),
        parseInt(m[4], 10),
        parseInt(m[5], 10),
        parseInt(m[6], 10),
        ms
      ).getTime();
    }
    const parsed = Date.parse(str);
    return isNaN(parsed) ? Number.MAX_SAFE_INTEGER : parsed;
  };

  const fetchUncensoredAdminUsers = useCallback(async () => {
    const endpoint = getCleanGasUrl();
    const pass = (adminPassword || '').trim();
    if (!endpoint || !pass) return;

    setIsLoadingAdminUsers(true);
    setAdminUsersFeedback(null);
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'adminJugadores', password: pass }),
      });
      const data = await res.json();
      if (data && data.success && Array.isArray(data.jugadores)) {
        const mapped: Player[] = data.jugadores.map((j: Record<string, unknown>, idx: number) => {
          const firstName = String(j.nombre || '').trim();
          const lastName = String(j.apellidos || '').trim();
          const rawEstado = String(j.estado || 'Suplente').trim().toUpperCase();
          const status: Player['status'] =
            rawEstado === 'TITULAR'
              ? 'TITULAR'
              : rawEstado.includes('BAJA')
              ? 'BAJA'
              : 'SUPLENTE';
          const rawPago = String(j.pago || 'Pendiente').trim();
          const rawPagoLower = rawPago.toLowerCase();
          const paid = rawPagoLower === 'pagado';
          const notified = rawPagoLower.startsWith('notificado');
          const ts = String(j.timestamp || '').trim();
          const tsMs = typeof j.timestampMs === 'number' ? j.timestampMs : undefined;

          return {
            id: `sheet-row-${j.fila || idx + 2}`,
            memberNumber: idx + 1,
            name: `${firstName} ${lastName}`.trim(),
            firstName,
            lastName,
            email: '',
            phone: String(j.telefono || '').trim(),
            dni: String(j.dni || '').trim(),
            iban: String(j.iban || '').trim(),
            sheetRow: typeof j.fila === 'number' ? j.fila : Number(j.fila) || undefined,
            timestampMs: tsMs,
            registrationTimestamp: ts,
            status,
            currentCyclePaid: paid,
            paidUntilCycle: Number(j.ciclo) || settings.currentCycle,
            renewalStatus: paid
              ? 'RENOVADO'
              : notified
              ? 'NOTIFICADO'
              : status === 'BAJA'
              ? 'EXCLUIDO'
              : 'PENDIENTE',
            paymentStatusLabel: rawPago,
            paymentNotifiedAt: String(j.fechaAvisoPago || '').trim(),
          };
        });
        onUpdatePlayers(mapped);
        setAdminUsersFeedback(`Sincronizado desde "Usuarios" (${mapped.length} registros).`);
      } else {
        setAdminUsersFeedback(data?.error || 'No se pudo autenticar la descarga de Usuarios.');
      }
    } catch {
      setAdminUsersFeedback('No se pudo conectar con Google Apps Script para leer "Usuarios".');
    } finally {
      setIsLoadingAdminUsers(false);
    }
  }, [adminPassword, getCleanGasUrl, onUpdatePlayers, settings.currentCycle]);

  const fetchCycleScrutiny = useCallback(async () => {
    const endpoint = getCleanGasUrl();
    if (!endpoint) return;
    setIsLoadingCycleScrutiny(true);
    try {
      const url = new URL(endpoint);
      url.searchParams.set('api', 'true');
      url.searchParams.set('action', 'escrutinioCiclo');
      const res = await fetch(url.toString());
      const data = await res.json();
      if (data && typeof data === 'object') {
        setCycleScrutiny(data as ScrutinyCycleResult);
      }
    } catch {
      setCycleScrutiny({
        success: false,
        consensoDisponible: false,
        textoAciertos: 'No se pudo conectar con el motor de escrutinio automático.',
      });
    } finally {
      setIsLoadingCycleScrutiny(false);
    }
  }, [getCleanGasUrl]);

  const fetchAdminInstallations = useCallback(async () => {
    const endpoint = getCleanGasUrl();
    const pass = (adminPassword || '').trim();
    if (!endpoint || !pass) return;

    setIsLoadingInstallations(true);
    setInstallationsFeedback(null);
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'adminInstalaciones', password: pass }),
      });
      const data = await res.json();
      if (data && data.success && Array.isArray(data.instalaciones)) {
        const list = data.instalaciones as AppInstallationEntry[];
        setInstallations(list);
        setInstallStats({
          totalDispositivos: Number(data.totalDispositivos) || list.length,
          totalInstaladas: Number(data.totalInstaladas) || 0,
          identificadas: Number(data.identificadas) || 0,
        });
      } else {
        setInstallationsFeedback(
          data?.error || 'No se pudo cargar la pestaña "Instalaciones App".'
        );
      }
    } catch {
      setInstallationsFeedback(
        'No se pudo conectar con Google Apps Script para leer "Instalaciones App".'
      );
    } finally {
      setIsLoadingInstallations(false);
    }
  }, [adminPassword, getCleanGasUrl]);

  useEffect(() => {
    if (adminPassword) {
      fetchUncensoredAdminUsers();
    }
  }, [adminPassword, fetchUncensoredAdminUsers]);

  useEffect(() => {
    if (activeSection === 'USERS' && adminPassword) {
      fetchUncensoredAdminUsers();
      fetchAdminInstallations();
    }
    if (activeSection === 'SCRUTINY') {
      fetchCycleScrutiny();
    }
  }, [activeSection, adminPassword, fetchUncensoredAdminUsers, fetchAdminInstallations, fetchCycleScrutiny]);

  const pendingPaymentNotices = players.filter(p => {
    const lbl = (p.paymentStatusLabel || '').trim().toLowerCase();
    return p.renewalStatus === 'NOTIFICADO' || lbl.startsWith('notificado');
  });

  const handleValidatePaymentOneClick = async (
    p: Player,
    nuevoEstado: 'Pagado' | 'Pendiente'
  ) => {
    setValidatingPaymentId(p.id);
    const res = await validateMemberPaymentByAdmin(getCleanGasUrl(), {
      fila: p.sheetRow,
      dni: p.dni || p.phone,
      nuevoEstado,
      password: adminPassword || '',
    });
    setValidatingPaymentId(null);

    if (res.success) {
      const isPaid = nuevoEstado === 'Pagado';
      const updated = players.map(item =>
        item.id === p.id
          ? {
              ...item,
              currentCyclePaid: isPaid,
              renewalStatus: isPaid ? ('RENOVADO' as const) : ('PENDIENTE' as const),
              paymentStatusLabel: nuevoEstado,
              paymentNotifiedAt: isPaid ? item.paymentNotifiedAt : '',
            }
          : item
      );
      onUpdatePlayers(updated);
      setAdminUsersFeedback(
        isPaid
          ? `✅ Ingreso confirmado (Pagado) para ${p.name}.`
          : `❌ Aviso rechazado para ${p.name} (vuelve a Pendiente).`
      );
    } else {
      setAdminUsersFeedback(res.message || 'No se pudo actualizar el estado del pago.');
    }
  };

  // Estados de Notificaciones Push Preprogramadas
  const [pushTitle, setPushTitle] = useState(
    `🎟️ Boleto Sellado · Jornada ${settings.currentJornada}/10`
  );
  const [pushBody, setPushBody] = useState(
    `Ya está disponible en la App la imagen real del resguardo oficial sellado de la Jornada ${settings.currentJornada}. ¡Mucha suerte a todos!`
  );
  const [pushPermission, setPushPermission] = useState<NotificationPermission>(
    pushNotificationService.getPermission()
  );
  const [pushSendFeedback, setPushSendFeedback] = useState<string | null>(null);
  const [sentAlertsLog, setSentAlertsLog] = useState<
    Array<{ id: string; title: string; body: string; channel: string; date: string }>
  >(() => {
    try {
      const raw = localStorage.getItem('primitiva_tordueles_sent_alerts');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  // Formulario multi-boleto y programación para el día del sorteo
  const [selectedLotteryGame, setSelectedLotteryGame] = useState<'La Primitiva' | 'Euromillones'>('La Primitiva');
  const [newTicketJornada, setNewTicketJornada] = useState(settings.currentJornada);

  useEffect(() => {
    setNewTicketJornada(settings.currentJornada);
  }, [settings.currentJornada]);

  const [newTicketDrawDate, setNewTicketDrawDate] = useState(() => getNextPrimitivaDrawDate());
  const [newTicketPublishMode, setNewTicketPublishMode] = useState<'PROGRAMADO' | 'AHORA'>('PROGRAMADO');
  const [newTicketPublishTime, setNewTicketPublishTime] = useState('20:35');
  const [ticketDrafts, setTicketDrafts] = useState<TicketDraftItem[]>(() => [createEmptyDraft(44)]);
  const [isSavingTicket, setIsSavingTicket] = useState(false);
  const [ticketSaveSuccess, setTicketSaveSuccess] = useState(false);
  const [ticketSyncFeedback, setTicketSyncFeedback] = useState<string | null>(null);
  const [batchSaveError, setBatchSaveError] = useState<string | null>(null);

  const updateDraft = (draftId: string, updater: (prev: TicketDraftItem) => TicketDraftItem) => {
    setTicketDrafts(prev => prev.map(d => (d.draftId === draftId ? updater(d) : d)));
  };

  const applyNumbersToDraft = (draft: TicketDraftItem, nextNums: number[]): TicketDraftItem => {
    const clean = Array.from(new Set(nextNums.filter(n => !isNaN(n) && n >= 1 && n <= 49))).sort(
      (a, b) => a - b
    );
    const formatted = formatDraftNumbers(clean);
    if (!draft.modalityManuallySet && [5, 7, 8, 9, 10, 11].includes(clean.length)) {
      const preset = inferModalityPresetFromCount(clean.length);
      return {
        ...draft,
        numbers: formatted,
        modalityKey: preset.key,
        modalityLabel: preset.label,
        betsCount: preset.betsCount,
        cost: preset.betsCount,
      };
    }
    return {
      ...draft,
      numbers: formatted,
    };
  };

  const toggleDraftGridNumber = (draftId: string, num: number) => {
    updateDraft(draftId, d => {
      const current = parseDraftNumbersList(d.numbers);
      const next = current.includes(num) ? current.filter(n => n !== num) : [...current, num];
      return applyNumbersToDraft(d, next);
    });
  };

  const handleSelectModalityPreset = (draftId: string, presetKey: string) => {
    const preset = MODALITY_PRESETS.find(p => p.key === presetKey) || MODALITY_PRESETS[6];
    updateDraft(draftId, d => ({
      ...d,
      modalityKey: preset.key,
      modalityLabel: preset.label,
      betsCount: preset.key === 'CUSTOM' ? Math.max(1, d.betsCount || 1) : preset.betsCount,
      cost: preset.key === 'CUSTOM' ? d.cost : preset.betsCount,
      modalityManuallySet: true,
    }));
  };

  const scanFileIntoDraft = async (draftId: string, file: File, syncJornadaFromFirst = false) => {
    updateDraft(draftId, d => ({
      ...d,
      fileName: file.name,
      isScanningAI: true,
      scanError: null,
      scanSuccessMessage: null,
      previewCandidateIdx: 0,
      previewLoadFailed: false,
    }));

    let optimizedPayload: File | string = file;
    try {
      const dataUrl = await optimizeTicketImageToDataUrl(file);
      updateDraft(draftId, d => ({
        ...d,
        image: dataUrl,
        previewCandidateIdx: 0,
        previewLoadFailed: false,
      }));
      if (file.type.startsWith('image/')) {
        optimizedPayload = dataUrl;
      }
    } catch {
      // Si falla la optimización local, continuar con archivo original
    }

    const result = await processTicketWithAI(optimizedPayload, file.type);

    if (result.success && result.data) {
      const data = result.data;
      if (
        syncJornadaFromFirst &&
        typeof data.jornada === 'number' &&
        !isNaN(data.jornada) &&
        data.jornada >= 1 &&
        data.jornada <= 10
      ) {
        setNewTicketJornada(data.jornada);
      }

      const detectedNums = Array.isArray(data.numbers)
        ? Array.from(new Set(data.numbers.filter(n => !isNaN(n) && n >= 1 && n <= 49))).sort(
            (a, b) => a - b
          )
        : [];

      updateDraft(draftId, d => {
        const withNums =
          detectedNums.length > 0 ? applyNumbersToDraft(d, detectedNums) : { ...d };
        return {
          ...withNums,
          isScanningAI: false,
          reintegro:
            typeof data.reintegro === 'number' && !isNaN(data.reintegro)
              ? data.reintegro
              : withNums.reintegro,
          cost:
            typeof data.cost === 'number' && !isNaN(data.cost) && data.cost > 0
              ? data.cost
              : withNums.cost,
          scanSuccessMessage: `¡Lectura OCR completada! ${detectedNums.length} números detectados${
            data.reintegro !== undefined && data.reintegro !== null
              ? `, Reintegro [${data.reintegro}]`
              : ''
          }${data.cost ? `, importe ${data.cost} €` : ''}. ${data.notes || ''}`,
        };
      });
    } else {
      updateDraft(draftId, d => ({
        ...d,
        isScanningAI: false,
        isNumberGridOpen: true,
        scanError:
          result.error ||
          'No se pudieron extraer los números automáticamente. La imagen real sí queda cargada para los jugadores; marca los números en la cuadrícula 1-49.',
      }));
    }
  };

  const handleMultipleFilesUploadAndScan = async (fileList: FileList | File[]) => {
    const files = Array.from(fileList);
    if (files.length === 0) return;
    setBatchSaveError(null);
    setTicketSyncFeedback(null);

    const firstIsPristine =
      ticketDrafts.length === 1 &&
      !ticketDrafts[0].image &&
      !ticketDrafts[0].numbers.trim() &&
      !ticketDrafts[0].fileName;

    const assignedPairs: Array<{ draftId: string; file: File; isFirst: boolean }> = [];

    if (firstIsPristine) {
      assignedPairs.push({ draftId: ticketDrafts[0].draftId, file: files[0], isFirst: true });
      const extraDrafts = files.slice(1).map((f, i) => {
        const nd = createEmptyDraft(7);
        assignedPairs.push({ draftId: nd.draftId, file: f, isFirst: i === -1 });
        return nd;
      });
      if (extraDrafts.length > 0) {
        setTicketDrafts(prev => [...prev, ...extraDrafts]);
      }
    } else {
      const addedDrafts = files.map(f => {
        const nd = createEmptyDraft(7);
        assignedPairs.push({ draftId: nd.draftId, file: f, isFirst: false });
        return nd;
      });
      setTicketDrafts(prev => [...prev, ...addedDrafts]);
    }

    await Promise.all(
      assignedPairs.map(pair => scanFileIntoDraft(pair.draftId, pair.file, pair.isFirst))
    );
  };

  const handleAddDraftSlot = () => {
    setBatchSaveError(null);
    setTicketDrafts(prev => [...prev, createEmptyDraft(7)]);
  };

  const handleRemoveDraftSlot = (draftId: string) => {
    setBatchSaveError(null);
    setTicketDrafts(prev =>
      prev.length > 1 ? prev.filter(d => d.draftId !== draftId) : [createEmptyDraft(44)]
    );
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

  const handleToggleInitialRecruitment = async (val: boolean) => {
    onUpdateSettings({ ...settings, initialRecruitmentMode: val });
    setRecruitmentModeFeedback(null);
    const endpoint = getCleanGasUrl();
    if (!endpoint || !adminPassword) {
      setRecruitmentModeFeedback(
        val
          ? 'Modo Captación Inicial activado en local.'
          : 'Modo Captación Inicial desactivado en local.'
      );
      return;
    }

    setIsSavingRecruitmentMode(true);
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'actualizarModoCaptacion',
          password: adminPassword,
          activo: val,
        }),
      });
      const data = await res.json();
      if (data && data.success) {
        setRecruitmentModeFeedback(
          val
            ? 'Modo Captación Inicial ACTIVADO y guardado en "Configuracion" de Google Sheets.'
            : 'Modo Captación Inicial DESACTIVADO: listado público visible por orden cronológico.'
        );
      } else {
        setRecruitmentModeFeedback(
          data?.error || 'Guardado en local (verifica despliegue de Apps Script para guardar en Sheets).'
        );
      }
    } catch {
      setRecruitmentModeFeedback('Guardado en local (sin conexión con Apps Script).');
    } finally {
      setIsSavingRecruitmentMode(false);
      setTimeout(() => setRecruitmentModeFeedback(null), 6000);
    }
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

  const handleSaveTicket = async () => {
    const parsedBatch: Array<{
      draft: TicketDraftItem;
      nums: number[];
      betType: MultipleBetType;
      modalityLabel: string;
      betsCount: number;
    }> = [];

    for (let i = 0; i < ticketDrafts.length; i++) {
      const draft = ticketDrafts[i];
      const nums = parseDraftNumbersList(draft.numbers);

      if (nums.length === 0) {
        setBatchSaveError(
          `El Resguardo #${i + 1} no tiene números válidos (1-49). Marca sus números en la cuadrícula 1-49 o quita ese bloque antes de guardar.`
        );
        return;
      }

      const preset =
        MODALITY_PRESETS.find(p => p.key === draft.modalityKey) ||
        inferModalityPresetFromCount(nums.length);
      const rawModality = draft.modalityLabel?.trim() || preset.label;
      const modalityLabel = `${selectedLotteryGame} — ${rawModality}`;
      const betsCount =
        draft.betsCount > 0 ? draft.betsCount : preset.betsCount;

      parsedBatch.push({
        draft,
        nums,
        betType: preset.betType,
        modalityLabel,
        betsCount,
      });
    }

    const drawDateClean = newTicketDrawDate || getNextPrimitivaDrawDate();
    const publishTimeClean = newTicketPublishTime || '20:35';
    const publishAtIso = `${drawDateClean}T${publishTimeClean}`;
    const publishAtDate = new Date(publishAtIso);
    const shouldPublishImmediately =
      newTicketPublishMode === 'AHORA' ||
      isNaN(publishAtDate.getTime()) ||
      publishAtDate.getTime() <= Date.now();

    const activePlayersCount = players.filter(p => p.status === 'TITULAR').length;

    setIsSavingTicket(true);
    setBatchSaveError(null);
    setTicketSyncFeedback(null);

    const baseTs = Date.now();
    let updatedTicketsList = [...tickets];
    let syncedCount = 0;
    const savedBatchTickets: Array<{ ticket: TicketDraw; alreadySentWaByGas: boolean }> = [];

    const batchPayloadItems = parsedBatch.map((item, idx) => {
      const { draft, nums, modalityLabel, betsCount } = item;
      const normalizedInputImage = normalizeReceiptImageUrl(draft.image);
      const safeCost = isNaN(draft.cost) || draft.cost < 0 ? 0 : draft.cost;
      const safeReintegro = isNaN(draft.reintegro) ? 0 : draft.reintegro;
      const ticketId = `t-${baseTs}-${idx + 1}`;
      return {
        ticketId,
        item,
        normalizedInputImage,
        safeCost,
        safeReintegro,
        gasPayload: {
          id: ticketId,
          modalidad: modalityLabel,
          apuestas: betsCount,
          numeros: nums,
          combinacion: formatDraftNumbers(nums),
          reintegro: safeReintegro,
          importe: safeCost,
          imagenBase64: draft.image.startsWith('data:') ? draft.image : undefined,
          imagenUrl: !draft.image.startsWith('data:') ? normalizedInputImage : undefined,
          fileName:
            draft.fileName || `resguardo_j${newTicketJornada}_b${idx + 1}_${drawDateClean}.jpg`,
        },
      };
    });

    // Envío en lote único a Google Apps Script (action: 'programarJornadaMultiple')
    const batchRes = await syncJornadaBatchWithAppsScript(settings.googleAppsScriptUrl, {
      ciclo: settings.currentCycle,
      jornada: newTicketJornada,
      fechaSorteo: drawDateClean,
      horaPublicacion: publishTimeClean,
      publicarAhora: shouldPublishImmediately,
      jugadoresActivos: activePlayersCount,
      boletos: batchPayloadItems.map(b => b.gasPayload),
    });

    if (batchRes.synced) {
      syncedCount = batchPayloadItems.length;
    }

    for (let idx = 0; idx < batchPayloadItems.length; idx++) {
      const { ticketId, item, normalizedInputImage, safeCost, safeReintegro, gasPayload } =
        batchPayloadItems[idx];
      const { nums, betType, modalityLabel } = item;

      let driveImageUrl: string | undefined;
      let alreadySentWaByGas = Boolean(batchRes.whatsappEnviadoAhora);

      if (batchRes.synced && Array.isArray(batchRes.results)) {
        const matchedResult =
          batchRes.results.find(r => r.id === ticketId) || batchRes.results[idx];
        driveImageUrl = matchedResult?.driveImageUrl;
        if (matchedResult && typeof matchedResult.whatsappEnviadoAhora === 'boolean') {
          alreadySentWaByGas = matchedResult.whatsappEnviadoAhora;
        }
      } else if (!batchRes.synced && settings.googleAppsScriptUrl?.trim()) {
        // Respaldo individual por compatibilidad con despliegues anteriores
        const singleRes = await syncTicketWithAppsScript(settings.googleAppsScriptUrl, {
          id: ticketId,
          ciclo: settings.currentCycle,
          jornada: newTicketJornada,
          fechaSorteo: drawDateClean,
          horaPublicacion: publishTimeClean,
          publicarAhora: shouldPublishImmediately,
          modalidad: modalityLabel,
          combinacion: gasPayload.combinacion,
          reintegro: safeReintegro,
          importe: safeCost,
          jugadoresActivos: activePlayersCount,
          imagenBase64: gasPayload.imagenBase64,
          imagenUrl: gasPayload.imagenUrl,
          fileName: gasPayload.fileName,
        });
        if (singleRes.synced) syncedCount++;
        driveImageUrl = singleRes.driveImageUrl;
        alreadySentWaByGas = Boolean(singleRes.whatsappEnviadoAhora);
      }

      const ticketToStore: TicketDraw = {
        id: ticketId,
        cycleNumber: settings.currentCycle,
        jornadaNumber: newTicketJornada,
        drawDate: drawDateClean,
        receiptImageUrl: normalizeReceiptImageUrl(driveImageUrl || normalizedInputImage),
        betType,
        modalityLabel,
        numbersPlayedCount: nums.length,
        cost: safeCost,
        activePlayersCount,
        costPerPlayer: 1.0,
        playedNumbers: nums,
        playedReintegro: safeReintegro,
        jokerPlayed: true,
        isScrutinized: false,
        totalPrize: 0,
        prizeType: 'NINGUNO',
        publishStatus: shouldPublishImmediately ? 'PUBLICADO' : 'PROGRAMADO',
        publishAt: publishAtIso,
        scheduledNotificationSent: shouldPublishImmediately,
      };

      updatedTicketsList = archivePreviousPendingTicketsForNewSchedule(
        updatedTicketsList,
        ticketToStore
      );
      savedBatchTickets.push({
        ticket: ticketToStore,
        alreadySentWaByGas,
      });
    }

    onUpdateTickets(updatedTicketsList);
    setIsSavingTicket(false);
    setTicketSaveSuccess(true);
    setTicketDrafts([createEmptyDraft(44)]);

    const totalBoletos = savedBatchTickets.length;

    if (shouldPublishImmediately) {
      if (savedBatchTickets.length > 0) {
        pushNotificationService.notifyTicketValidated(
          newTicketJornada,
          savedBatchTickets[0].ticket.playedNumbers
        );
      }

      if (settings.sendDrawDayTicketAt2035) {
        for (let idx = 0; idx < savedBatchTickets.length; idx++) {
          const item = savedBatchTickets[idx];
          if (item.alreadySentWaByGas) continue;
          await whatsappService.sendTicketReceipt(
            {
              jornada: item.ticket.jornadaNumber,
              cycle: item.ticket.cycleNumber,
              numbers: item.ticket.playedNumbers,
              reintegro: item.ticket.playedReintegro,
              players: activePlayersCount,
              cost: item.ticket.cost,
              receiptImageUrl: item.ticket.receiptImageUrl,
              drawDate: drawDateClean,
              ticketIndex: idx + 1,
              totalTickets: totalBoletos,
            },
            {
              instanceId: settings.greenApiInstanceId,
              token: settings.greenApiToken,
              chatId: settings.greenApiChatId,
            }
          );
        }
      }

      setTicketSyncFeedback(
        syncedCount === totalBoletos
          ? `${totalBoletos} ${totalBoletos === 1 ? 'resguardo publicado' : 'resguardos publicados'} en «Mi Jugada», guardados en Drive/Sheets y notificados al grupo.`
          : `${totalBoletos} ${totalBoletos === 1 ? 'resguardo publicado' : 'resguardos publicados'} localmente (${syncedCount}/${totalBoletos} sincronizados en Apps Script).`
      );
    } else {
      const label = formatScheduledDateTimeLabel(publishAtIso, drawDateClean);
      setTicketSyncFeedback(
        syncedCount === totalBoletos
          ? `${totalBoletos} ${totalBoletos === 1 ? 'resguardo programado' : 'resguardos programados'} para el ${label}. Se publicarán y enviarán por WhatsApp ese día a las ${publishTimeClean} h.`
          : `${totalBoletos} ${totalBoletos === 1 ? 'resguardo programado' : 'resguardos programados'} localmente para el ${label} (${syncedCount}/${totalBoletos} en Apps Script).`
      );
    }

    // Avance automático de jornada y ciclo
    const maxJor = settings.cycleLength || 10;
    let nextJor = newTicketJornada + 1;
    let nextCyc = settings.currentCycle;
    if (nextJor > maxJor) {
      nextCyc += 1;
      nextJor = 1;
    }
    onUpdateSettings({
      ...settings,
      currentCycle: nextCyc,
      currentJornada: nextJor,
    });

    setTimeout(() => setTicketSaveSuccess(false), 4000);
  };

  const handlePublishScheduledNow = async (ticket: TicketDraw) => {
    const updated = tickets.map(t =>
      t.id === ticket.id
        ? {
            ...t,
            publishStatus: 'PUBLICADO' as const,
            publishAt: new Date().toISOString().slice(0, 16),
            scheduledNotificationSent: true,
          }
        : t
    );
    onUpdateTickets(updated);

    const syncRes = await syncTicketWithAppsScript(settings.googleAppsScriptUrl, {
      id: ticket.id,
      ciclo: ticket.cycleNumber,
      jornada: ticket.jornadaNumber,
      fechaSorteo: ticket.drawDate,
      horaPublicacion: new Date().toTimeString().slice(0, 5),
      publicarAhora: true,
      combinacion: ticket.playedNumbers.map(n => (n < 10 ? `0${n}` : `${n}`)).join(', '),
      reintegro: ticket.playedReintegro,
      importe: ticket.cost,
      jugadoresActivos: ticket.activePlayersCount,
      imagenUrl: ticket.receiptImageUrl,
    });

    pushNotificationService.notifyTicketValidated(ticket.jornadaNumber, ticket.playedNumbers);
    if (settings.sendDrawDayTicketAt2035 && !syncRes.whatsappEnviadoAhora) {
      await whatsappService.sendTicketReceipt(
        {
          jornada: ticket.jornadaNumber,
          cycle: ticket.cycleNumber,
          numbers: ticket.playedNumbers,
          reintegro: ticket.playedReintegro,
          players: ticket.activePlayersCount,
          cost: ticket.cost,
          receiptImageUrl: ticket.receiptImageUrl,
          drawDate: ticket.drawDate,
        },
        {
          instanceId: settings.greenApiInstanceId,
          token: settings.greenApiToken,
          chatId: settings.greenApiChatId,
        }
      );
    }
    setTicketSyncFeedback(`Resguardo de la Jornada ${ticket.jornadaNumber} publicado y notificado ahora.`);
  };

  const handleDeleteScheduledTicket = async (ticketId: string) => {
    onUpdateTickets(tickets.filter(t => t.id !== ticketId));
    const endpoint = getCleanGasUrl();
    if (endpoint && adminPassword) {
      try {
        await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({
            action: 'eliminarBoletoActivo',
            id: ticketId,
            password: adminPassword,
          }),
        });
      } catch {
        // Silencioso; ya eliminado localmente
      }
    }
    setTicketSyncFeedback('Resguardo eliminado correctamente de «Mi Jugada» y de la base de datos.');
  };

  const syncPrizeFundToBackend = async (
    cantidad: number,
    gananciaSemanal?: number
  ): Promise<{ synced: boolean; bolsaPremios?: number; gananciaSemanal?: number }> => {
    const endpoint = getCleanGasUrl();
    if (!endpoint || !adminPassword) {
      return { synced: false };
    }
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'actualizarBotePremios',
          password: adminPassword,
          cantidad,
          gananciaSemanal,
        }),
      });
      const data = await res.json();
      if (data && data.success) {
        return {
          synced: true,
          bolsaPremios:
            typeof data.bolsaPremios === 'number' && !isNaN(data.bolsaPremios)
              ? data.bolsaPremios
              : cantidad,
          gananciaSemanal:
            typeof data.gananciaSemanal === 'number' && !isNaN(data.gananciaSemanal)
              ? data.gananciaSemanal
              : gananciaSemanal,
        };
      }
    } catch {
      // Fallback al estado local si no hay conexión
    }
    return { synced: false };
  };

  const syncWeeklyGainToBackend = async (
    cantidad: number,
    modo: 'sumar' | 'solo_semanal'
  ): Promise<{ synced: boolean; bolsaPremios?: number; gananciaSemanal?: number }> => {
    const endpoint = getCleanGasUrl();
    if (!endpoint || !adminPassword) {
      return { synced: false };
    }
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'sumarGananciaSemanal',
          password: adminPassword,
          cantidad,
          modo,
        }),
      });
      const data = await res.json();
      if (data && data.success) {
        return {
          synced: true,
          bolsaPremios:
            typeof data.bolsaPremios === 'number' && !isNaN(data.bolsaPremios)
              ? data.bolsaPremios
              : undefined,
          gananciaSemanal:
            typeof data.gananciaSemanal === 'number' && !isNaN(data.gananciaSemanal)
              ? data.gananciaSemanal
              : cantidad,
        };
      }
    } catch {
      // Fallback al estado local
    }
    return { synced: false };
  };

  const handleWeeklyGainAction = async (modo: 'sumar' | 'solo_semanal') => {
    const raw = weeklyPrizeInput.trim();
    if (!raw) {
      setPrizeFundFeedback('Introduce el importe de la ganancia semanal en euros.');
      return;
    }
    const cantidad = Math.round(parseFloat(raw.replace(',', '.')) * 100) / 100;
    if (isNaN(cantidad) || cantidad < 0) {
      setPrizeFundFeedback('Introduce una ganancia semanal numérica válida (>= 0).');
      return;
    }

    setIsSavingPrizeFund(true);
    setPrizeFundFeedback(null);
    const { synced, bolsaPremios, gananciaSemanal } = await syncWeeklyGainToBackend(cantidad, modo);

    const nextWeekly = typeof gananciaSemanal === 'number' ? gananciaSemanal : cantidad;
    const nextGeneral =
      typeof bolsaPremios === 'number'
        ? bolsaPremios
        : modo === 'sumar'
        ? Math.round((settings.prizeFundBalance + cantidad) * 100) / 100
        : settings.prizeFundBalance;

    onUpdateSettings({
      ...settings,
      prizeFundBalance: nextGeneral,
      weeklyPrizeGain: nextWeekly,
    });
    setWeeklyPrizeInput(nextWeekly.toFixed(2));
    setPrizeFundInput(nextGeneral.toFixed(2));
    setIsSavingPrizeFund(false);
    setPrizeFundFeedback(
      modo === 'sumar'
        ? synced
          ? `¡Ganancia semanal de +${nextWeekly.toFixed(2)} € sumada al Bote General (${nextGeneral.toFixed(2)} €) en Tesorería!`
          : `Ganancia semanal de +${nextWeekly.toFixed(2)} € sumada localmente al Bote General (${nextGeneral.toFixed(2)} €).`
        : synced
        ? `¡Ganancia semanal actualizada a ${nextWeekly.toFixed(2)} € en Tesorería!`
        : `Ganancia semanal actualizada localmente a ${nextWeekly.toFixed(2)} €.`
    );
    setTimeout(() => setPrizeFundFeedback(null), 6000);
  };

  const handleSavePrizeFund = async () => {
    const raw = prizeFundInput.trim();
    if (!raw) {
      setPrizeFundFeedback('Introduce el importe acumulado del bote general en euros.');
      return;
    }
    const cantidad = Math.round(parseFloat(raw.replace(',', '.')) * 100) / 100;
    if (isNaN(cantidad) || cantidad < 0) {
      setPrizeFundFeedback('Introduce un importe numérico válido (>= 0).');
      return;
    }

    const parsedWeekly = Math.round(parseFloat(weeklyPrizeInput.trim().replace(',', '.')) * 100) / 100;
    const weeklyToSync =
      !isNaN(parsedWeekly) && parsedWeekly >= 0 ? parsedWeekly : settings.weeklyPrizeGain || 0;

    setIsSavingPrizeFund(true);
    setPrizeFundFeedback(null);
    const { synced, bolsaPremios, gananciaSemanal } = await syncPrizeFundToBackend(cantidad, weeklyToSync);
    const finalAmount = typeof bolsaPremios === 'number' ? bolsaPremios : cantidad;
    const finalWeekly =
      typeof gananciaSemanal === 'number' ? gananciaSemanal : weeklyToSync;

    onUpdateSettings({
      ...settings,
      prizeFundBalance: finalAmount,
      weeklyPrizeGain: finalWeekly,
    });
    setPrizeFundInput(finalAmount.toFixed(2));
    setWeeklyPrizeInput(finalWeekly.toFixed(2));
    setIsSavingPrizeFund(false);
    setPrizeFundFeedback(
      synced
        ? `¡Bote General actualizado a ${finalAmount.toFixed(2)} € en Tesorería y visible para todos los socios!`
        : `Bote General actualizado localmente a ${finalAmount.toFixed(2)} € (despliega la última versión de Apps Script para guardarlo en Tesorería).`
    );
    setTimeout(() => setPrizeFundFeedback(null), 6000);
  };

  const handleResetPrizeFund = async () => {
    setIsSavingPrizeFund(true);
    const { synced } = await syncPrizeFundToBackend(0, 0);
    onUpdateSettings({
      ...settings,
      prizeFundBalance: 0,
      weeklyPrizeGain: 0,
    });
    setPrizeFundInput('0.00');
    setWeeklyPrizeInput('0.00');
    setIsSavingPrizeFund(false);
    setConfirmResetFund(false);
    setResetFundFeedback(
      synced
        ? 'Bote General y ganancia semanal reseteados a 0,00 € en Tesorería.'
        : 'Bote General y ganancia semanal reseteados localmente a 0,00 €.'
    );
    setTimeout(() => setResetFundFeedback(null), 5000);
  };

  const handleRunScrutiny = () => {
    const winNums = scrutinyWinning
      .split(/[,;\s-]+/)
      .map(s => parseInt(s.trim(), 10))
      .filter(n => !isNaN(n) && n >= 1 && n <= 49);

    if (winNums.length !== 6) {
      setScrutinyResult('Introduce los 6 números ganadores oficiales (del 1 al 49) antes de ejecutar el escrutinio.');
      return;
    }

    const refTicket =
      tickets.find(t => !t.isScrutinized && isTicketPublishedNow(t)) ||
      tickets.find(t => t.isScrutinized && (!t.winningNumbers || t.winningNumbers.length === 0)) ||
      tickets.find(t => !t.isScrutinized) ||
      tickets[0];
    if (!refTicket) {
      setScrutinyResult('No hay ningún boleto publicado para escrutar.');
      return;
    }

    const refKey = getTicketJornadaKey(refTicket);
    const targetJornadaTickets = tickets.filter(t => {
      if (getTicketJornadaKey(t) !== refKey) return false;
      if (!refTicket.isScrutinized) return !t.isScrutinized;
      return !t.winningNumbers || t.winningNumbers.length === 0;
    });

    const ticketsToEvaluate =
      targetJornadaTickets.length > 0 ? targetJornadaTickets : [refTicket];

    const summary = calculateMultiTicketScrutiny(
      ticketsToEvaluate,
      winNums,
      scrutinyComp,
      scrutinyReintegro,
      refTicket.activePlayersCount || 44
    );

    const resultById = new Map(summary.items.map(item => [item.ticketId, item.result]));

    const updated = tickets.map(t => {
      const res = resultById.get(t.id);
      if (!res) return t;
      return {
        ...t,
        isScrutinized: true,
        receiptImageUrl: '',
        winningNumbers: winNums,
        complementario: scrutinyComp,
        reintegro: scrutinyReintegro,
        hitsCount: res.hits,
        hasReintegro: res.reintegroHit,
        prizeCategory: res.category,
        totalPrize: res.prizeAmount,
        prizeType: res.isMayor
          ? ('MAYOR_BANCO' as const)
          : res.prizeAmount > 0
          ? ('MENOR_BOLSA' as const)
          : ('NINGUNO' as const),
      };
    });

    onUpdateTickets(capTicketsKeepingPlayed(updated));

    // Registrar en el histórico permanente de premios obtenidos si hay premio > 0
    if (summary.totalPrizeAmount > 0) {
      const entryId = `prize-j${refTicket.cycleNumber}-${refTicket.jornadaNumber}-${refTicket.drawDate}`;
      const entry: PrizeHistoryEntry = {
        id: entryId,
        ticketId: refTicket.id,
        cycleNumber: refTicket.cycleNumber,
        jornadaNumber: refTicket.jornadaNumber,
        drawDate: refTicket.drawDate,
        hitsCount: summary.totalHits,
        hasReintegro: summary.anyReintegroHit,
        prizeCategory: summary.combinedCategory,
        prizeAmount: summary.totalPrizeAmount,
        prizeType: summary.isMayor ? 'MAYOR_BANCO' : 'MENOR_BOLSA',
      };
      const evaluatedIds = new Set(ticketsToEvaluate.map(t => t.id));
      const withoutDuplicate = prizeHistory.filter(
        p => p.id !== entryId && !evaluatedIds.has(p.ticketId)
      );
      onUpdatePrizeHistory([entry, ...withoutDuplicate]);
    }

    // Acumular al Bote Total de Premios si hay premio obtenido
    if (summary.totalPrizeAmount > 0) {
      onUpdateSettings({
        ...settings,
        prizeFundBalance: settings.prizeFundBalance + summary.totalPrizeAmount,
      });
    }

    setScrutinyResult(
      ticketsToEvaluate.length > 1
        ? `Escrutinio de ${ticketsToEvaluate.length} boletos completado: ${summary.totalHits} aciertos totales sumados. Premio total: ${summary.totalPrizeAmount.toFixed(2)} € (${summary.combinedCategory}).`
        : `Escrutinio completado: ${summary.totalHits} aciertos. Premio: ${summary.totalPrizeAmount.toFixed(2)} € (${summary.combinedCategory}).`
    );

    // Enviar push y WhatsApp mediante Green API
    pushNotificationService.notifyScrutinyCompleted(
      refTicket.jornadaNumber,
      summary.totalHits,
      summary.totalPrizeAmount
    );

    if (settings.sendScrutinyAlert) {
      const matchedNums = refTicket.playedNumbers
        .filter(n => winNums.includes(n))
        .sort((a, b) => a - b);

      whatsappService.sendScrutinyResult(
        {
          jornada: refTicket.jornadaNumber,
          cycle: refTicket.cycleNumber,
          winningNumbers: winNums,
          complementario: scrutinyComp,
          reintegro: scrutinyReintegro,
          hits: summary.totalHits,
          prize: summary.totalPrizeAmount,
          category: summary.combinedCategory,
          isMayor: summary.isMayor,
          activePlayersCount: refTicket.activePlayersCount,
          playedNumbers: refTicket.playedNumbers,
          playedReintegro: refTicket.playedReintegro,
          matchedNumbers: matchedNums,
          reintegroMatched: summary.anyReintegroHit,
          complementarioMatched: summary.anyComplementarioHit,
          prizeFundBalance: settings.prizeFundBalance + summary.totalPrizeAmount,
          drawDate: refTicket.drawDate,
          ticketBreakdowns: summary.items.map(item => ({
            playedNumbers: item.ticket.playedNumbers,
            playedReintegro: item.ticket.playedReintegro,
            matchedNumbers: item.matchedNumbers,
            hits: item.result.hits,
            complementarioMatched: item.result.complementarioHit,
            reintegroMatched: item.result.reintegroHit,
            prize: item.result.prizeAmount,
          })),
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
          {
            id: 'USERS',
            label: 'Gestión Socios',
            icon: Users,
            badge: pendingPaymentNotices.length > 0 ? pendingPaymentNotices.length : undefined,
          },
          { id: 'TICKET_UPLOAD', label: 'Subir Resguardo', icon: Upload },
          { id: 'PUSH_ALERTS', label: 'Push & Avisos', icon: BellRing },
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
              {item.badge !== undefined && (
                <span className="ml-1 inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5 rounded-full bg-[#FF6B00] text-white text-xs font-black tabular-nums">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* BANDEJA GLOBAL RÁPIDA: AVISOS DE PAGO PENDIENTES DE VERIFICAR */}
      {pendingPaymentNotices.length > 0 && activeSection !== 'USERS' && (
        <div className="rounded-3xl bg-amber-50/90 border-2 border-amber-300 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-[#FF6B00] text-white flex items-center justify-center shrink-0">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <h2 className="font-extrabold text-lg sm:text-xl text-[#0A2540]">
                  Avisos de Pago Pendientes de Verificar ({pendingPaymentNotices.length})
                </h2>
                <p className="text-sm text-amber-950/90">
                  Socios que han pulsado «Ya he realizado el pago ({settings.cycleLength || 10} €)» mediante Bizum o Transferencia.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={fetchUncensoredAdminUsers}
              disabled={isLoadingAdminUsers}
              className="px-3.5 min-h-[40px] rounded-xl bg-white border border-amber-300 text-xs sm:text-sm font-bold text-[#0A2540] hover:bg-amber-100 cursor-pointer shrink-0"
            >
              {isLoadingAdminUsers ? 'Actualizando...' : 'Actualizar avisos'}
            </button>
          </div>

          <div className="space-y-2.5">
            {pendingPaymentNotices.map(p => {
              const rawLbl = p.paymentStatusLabel || 'Notificado';
              const methodMatch = rawLbl.match(/\(([^)]+)\)/);
              const methodName = methodMatch ? methodMatch[1] : rawLbl;
              const isBusy = validatingPaymentId === p.id;
              return (
                <div
                  key={`global-pay-${p.id}`}
                  className="rounded-2xl bg-white border border-amber-200 p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3 shadow-2xs"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-black text-base text-[#0A2540]">{p.name}</span>
                      <span className="px-2.5 py-0.5 rounded-lg bg-amber-100 text-amber-950 text-xs font-extrabold">
                        {methodName}
                      </span>
                      {p.paymentNotifiedAt && (
                        <span className="text-xs font-mono font-bold text-slate-600 tabular-nums">
                          🕒 {p.paymentNotifiedAt}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500">
                      {p.status} · {p.dni ? `DNI: ${p.dni}` : `Tel: ${p.phone || '—'}`}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => handleValidatePaymentOneClick(p, 'Pagado')}
                      className="px-3.5 min-h-[40px] rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-xs sm:text-sm font-extrabold cursor-pointer"
                    >
                      {isBusy ? 'Procesando...' : '✅ Confirmar Ingreso (Pagado)'}
                    </button>
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => handleValidatePaymentOneClick(p, 'Pendiente')}
                      className="px-3.5 min-h-[40px] rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 disabled:opacity-60 text-rose-800 text-xs sm:text-sm font-bold cursor-pointer"
                    >
                      ❌ No recibido (Rechazar)
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

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

              <div className="pt-5 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <strong className="text-base text-[#0A2540] flex items-center gap-2">
                      <EyeOff className="w-5 h-5 text-[#FF6B00] shrink-0" />
                      Modo Captación Inicial (Ocultar listado y orden de socios)
                    </strong>
                    <p className="text-base text-slate-600 mt-1 leading-relaxed">
                      Cuando está <strong>ACTIVO</strong>, la pestaña «Socios» oculta temporalmente la lista ordenada y las etiquetas <em>Titular/Suplente</em>, mostrando únicamente el total de inscritos mientras se cierra el cupo inicial (Art. 3.2).
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className={`text-sm font-extrabold ${settings.initialRecruitmentMode ? 'text-[#FF6B00]' : 'text-slate-500'}`}>
                      {settings.initialRecruitmentMode ? 'ACTIVO' : 'INACTIVO'}
                    </span>
                    <button
                      type="button"
                      disabled={isSavingRecruitmentMode}
                      onClick={() => handleToggleInitialRecruitment(!settings.initialRecruitmentMode)}
                      className={`relative inline-flex h-8 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-hidden disabled:opacity-60 ${
                        settings.initialRecruitmentMode ? 'bg-[#FF6B00]' : 'bg-slate-300'
                      }`}
                      aria-label="Alternar Modo Captación Inicial"
                    >
                      <span
                        className={`inline-block h-7 w-7 transform rounded-full bg-white shadow-sm transition duration-200 ${
                          settings.initialRecruitmentMode ? 'translate-x-6' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>
                {recruitmentModeFeedback && (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-sm font-bold text-emerald-950">
                    {recruitmentModeFeedback}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Calculadora Dinámica de Combinaciones y Cupos */}
          {(() => {
            const adminTitulares = players.filter(p => p.status === 'TITULAR').length;
            const adminSuplentes = players.some(p => p.sheetRow !== undefined)
              ? players.filter(p => p.status === 'SUPLENTE').length
              : waitingList.length;
            const totalEnrolled = adminTitulares + adminSuplentes;
            const allCombos = generateBlockCombinations(totalEnrolled);
            const suggestedCombos = allCombos.filter(
              c => c.status === 'READY' || c.status === 'CLOSE' || c.blocks.length === 1
            );
            const displayedCombos = showAllCombinations
              ? allCombos
              : suggestedCombos.length > 0
              ? suggestedCombos
              : allCombos.slice(0, 14);

            return (
              <div className="rounded-3xl bg-white border-2 border-[#0A2540]/15 p-5 sm:p-7 shadow-xs space-y-5">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div>
                    <h2 className="font-extrabold text-xl text-[#0A2540] flex items-center gap-2.5">
                      <Calculator className="w-6 h-6 text-[#FF6B00]" />
                      Calculadora de Combinaciones y Cupos
                    </h2>
                    <p className="text-base text-slate-600 mt-1">
                      Bloques oficiales de La Primitiva (7, 28, 44, 84, 210, 462 apuestas a 1 €/apuesta) combinados para aprovechar al máximo los inscritos actuales.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5 shrink-0 tabular-nums">
                    <div className="rounded-2xl bg-[#0A2540] text-white px-4 py-2.5">
                      <span className="text-xs uppercase font-bold text-slate-300 block">
                        Inscritos Activos
                      </span>
                      <span className="text-xl font-black text-[#FF6B00]">
                        {totalEnrolled} ({adminTitulares}T + {adminSuplentes}S)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowAllCombinations(prev => !prev)}
                      className="px-4 min-h-[46px] rounded-xl border border-slate-300 bg-[#F4F6F9] hover:bg-slate-200 text-sm font-bold text-[#0A2540] transition cursor-pointer"
                    >
                      {showAllCombinations
                        ? `Ver sugeridas (${suggestedCombos.length})`
                        : `Ver todas (${allCombos.length})`}
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto rounded-2xl border border-slate-200 max-h-96 overflow-y-auto">
                  <table className="w-full text-left text-sm sm:text-base text-slate-800">
                    <thead className="bg-[#0A2540] text-white uppercase text-xs tracking-wider sticky top-0 z-10">
                      <tr>
                        <th className="py-3.5 px-4">Descripción de boletos</th>
                        <th className="py-3.5 px-4">Jugadores necesarios</th>
                        <th className="py-3.5 px-4">Faltan / Sobran</th>
                        <th className="py-3.5 px-4">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 tabular-nums">
                      {displayedCombos.map(combo => (
                        <tr
                          key={combo.id}
                          className={
                            combo.diffFromEnrolled === 0
                              ? 'bg-emerald-50/90 font-semibold'
                              : combo.status === 'READY'
                              ? 'bg-emerald-50/35 hover:bg-emerald-50/60'
                              : combo.status === 'CLOSE'
                              ? 'bg-amber-50/40 hover:bg-amber-50/70'
                              : 'hover:bg-slate-50'
                          }
                        >
                          <td className="py-3 px-4 font-extrabold text-[#0A2540]">
                            <span>{combo.description}</span>
                            <span className="block text-xs font-medium text-slate-500">
                              {combo.ticketsCount}{' '}
                              {combo.ticketsCount === 1 ? 'resguardo' : 'resguardos'} ·{' '}
                              {combo.totalCost.toFixed(2)} €
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono font-black text-[#0A2540]">
                            {combo.totalPlayers} jugadores
                          </td>
                          <td className="py-3 px-4 font-semibold text-slate-700">
                            {combo.gapLabel}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap font-bold">
                            <span
                              className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs sm:text-sm font-extrabold ${
                                combo.status === 'READY'
                                  ? 'bg-emerald-100 text-emerald-900'
                                  : combo.status === 'CLOSE'
                                  ? 'bg-amber-100 text-amber-900'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {combo.statusLabel}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })()}

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

          {/* Gestión del Bote de Premios */}
          <div className="rounded-3xl bg-white border-2 border-[#0A2540]/15 p-5 sm:p-7 shadow-xs space-y-5">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <h2 className="font-extrabold text-xl text-[#0A2540] flex items-center gap-2.5">
                  <Wallet className="w-6 h-6 text-[#FF6B00]" />
                  Gestión del Bote de Premios
                </h2>
                <p className="text-base text-slate-600 mt-1">
                  Introduce la <strong>Ganancia Semanal</strong> para sumarla al <strong>Bote General</strong>, o edita libremente ambas cantidades en cualquier momento. Se guardan en la pestaña <span className="font-mono text-sm">Tesorería</span> de Google Sheets.
                </p>
              </div>
              <div className="flex flex-wrap items-stretch gap-3 shrink-0">
                <div className="rounded-2xl bg-orange-50 border border-orange-200 px-4 py-2.5 text-left sm:text-right">
                  <span className="text-xs uppercase font-bold text-[#FF6B00] block">
                    Ganancia Semanal
                  </span>
                  <span className="text-xl font-black text-[#0A2540] tabular-nums">
                    {(settings.weeklyPrizeGain || 0).toFixed(2)} €
                  </span>
                </div>
                <div className="rounded-2xl bg-[#0A2540] text-white px-5 py-2.5 text-left sm:text-right">
                  <span className="text-xs uppercase font-bold text-slate-300 block">
                    Bote General Acumulado
                  </span>
                  <span className="text-2xl font-black text-emerald-400 tabular-nums">
                    {settings.prizeFundBalance.toFixed(2)} €
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Bloque 1: Ganancia Semanal (suma al bote general) */}
              <div className="rounded-2xl bg-orange-50/60 border border-orange-200 p-4 sm:p-5 space-y-3">
                <div>
                  <label
                    htmlFor="admin-weekly-gain-input"
                    className="font-extrabold text-[#0A2540] block text-base"
                  >
                    1. Ganancia Semanal (€)
                  </label>
                  <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                    Pulsa <strong>Sumar al Bote General</strong> para acumular este premio semanal, o edita la cifra semanal directamente.
                  </p>
                </div>

                <input
                  id="admin-weekly-gain-input"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={weeklyPrizeInput}
                  onChange={e => {
                    setWeeklyPrizeInput(e.target.value);
                    setPrizeFundFeedback(null);
                  }}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 min-h-[48px] font-mono text-lg font-bold text-[#0A2540] tabular-nums focus:ring-2 focus:ring-[#FF6B00] outline-hidden"
                />

                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    disabled={isSavingPrizeFund}
                    onClick={() => handleWeeklyGainAction('sumar')}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 min-h-[46px] rounded-xl bg-[#FF6B00] hover:bg-[#E55E00] disabled:opacity-60 text-white font-bold text-sm sm:text-base shadow-xs transition cursor-pointer"
                  >
                    {isSavingPrizeFund && <Loader2 className="w-4 h-4 animate-spin" />}
                    <span>Sumar al Bote General</span>
                  </button>
                  <button
                    type="button"
                    disabled={isSavingPrizeFund}
                    onClick={() => handleWeeklyGainAction('solo_semanal')}
                    className="inline-flex items-center justify-center gap-1.5 px-4 min-h-[46px] rounded-xl bg-white border border-slate-300 hover:bg-slate-100 disabled:opacity-60 text-[#0A2540] font-bold text-sm transition cursor-pointer"
                    title="Edita el importe guardado de la ganancia semanal sin volver a sumarlo al bote"
                  >
                    <span>Guardar Semanal</span>
                  </button>
                </div>
              </div>

              {/* Bloque 2: Bote General Total (editable en cualquier momento) */}
              <div className="rounded-2xl bg-[#F4F6F9] border border-slate-200 p-4 sm:p-5 space-y-3">
                <div>
                  <label
                    htmlFor="admin-prize-fund-input"
                    className="font-extrabold text-[#0A2540] block text-base"
                  >
                    2. Bote General de Premios (€)
                  </label>
                  <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                    Total mostrado en la pantalla principal de los socios. Editable en cualquier momento.
                  </p>
                </div>

                <input
                  id="admin-prize-fund-input"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={prizeFundInput}
                  onChange={e => {
                    setPrizeFundInput(e.target.value);
                    setPrizeFundFeedback(null);
                  }}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 min-h-[48px] font-mono text-lg font-bold text-[#0A2540] tabular-nums focus:ring-2 focus:ring-[#0A2540] outline-hidden"
                />

                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    disabled={isSavingPrizeFund}
                    onClick={handleSavePrizeFund}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-5 min-h-[46px] rounded-xl bg-[#0A2540] hover:bg-[#13375B] disabled:opacity-60 text-white font-bold text-sm sm:text-base shadow-xs transition cursor-pointer"
                  >
                    {isSavingPrizeFund && <Loader2 className="w-4 h-4 animate-spin" />}
                    <span>Guardar Bote</span>
                  </button>
                </div>
              </div>
            </div>

            {prizeFundFeedback && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-sm sm:text-base font-bold text-emerald-950">
                {prizeFundFeedback}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3 pt-1">
              {!confirmResetFund ? (
                <button
                  type="button"
                  onClick={() => setConfirmResetFund(true)}
                  disabled={
                    (settings.prizeFundBalance === 0 && (settings.weeklyPrizeGain || 0) === 0) ||
                    isSavingPrizeFund
                  }
                  className="inline-flex items-center gap-2 px-5 min-h-[48px] rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-45 text-white font-bold text-base transition cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Resetear Bote a 0,00 €</span>
                </button>
              ) : (
                <div className="flex flex-wrap items-center gap-3 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 w-full">
                  <span className="text-sm sm:text-base font-bold text-rose-950">
                    ¿Confirmas poner a 0,00 € el bote actual ({settings.prizeFundBalance.toFixed(2)} €)?
                  </span>
                  <div className="flex items-center gap-2 ml-auto">
                    <button
                      type="button"
                      onClick={() => setConfirmResetFund(false)}
                      className="px-4 min-h-[42px] rounded-xl border border-slate-300 bg-white text-slate-700 font-bold text-sm cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      disabled={isSavingPrizeFund}
                      onClick={handleResetPrizeFund}
                      className="px-4 min-h-[42px] rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm cursor-pointer"
                    >
                      Confirmar Reset
                    </button>
                  </div>
                </div>
              )}

              {resetFundFeedback && (
                <span className="text-sm sm:text-base font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3.5 py-2 rounded-xl">
                  {resetFundFeedback}
                </span>
              )}
            </div>
          </div>

          {/* Gestión de Ciclos y Jornadas */}
          <div className="rounded-3xl bg-white border-2 border-[#0A2540]/15 p-5 sm:p-7 shadow-xs space-y-5">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <h2 className="font-extrabold text-xl text-[#0A2540] flex items-center gap-2.5">
                  <CalendarClock className="w-6 h-6 text-[#FF6B00]" />
                  Gestión de Ciclos y Jornadas
                </h2>
                <p className="text-base text-slate-600 mt-1">
                  Configura la duración de cada ciclo (por defecto 10 jornadas), el ciclo actual y la jornada activa, o resetea los contadores para pruebas.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3 shrink-0 tabular-nums">
                <div className="rounded-2xl bg-[#0A2540] text-white px-4 py-2.5">
                  <span className="text-xs uppercase font-bold text-slate-300 block">Estado Actual</span>
                  <span className="text-xl font-black text-[#FF6B00]">
                    Ciclo {settings.currentCycle} · J{settings.currentJornada}/{settings.cycleLength || 10}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="font-bold text-[#0A2540] block mb-1.5">Jornadas por Ciclo:</label>
                <input
                  type="number"
                  min={1}
                  max={52}
                  value={settings.cycleLength || 10}
                  onChange={e => {
                    const len = parseInt(e.target.value, 10) || 10;
                    onUpdateSettings({ ...settings, cycleLength: len });
                  }}
                  className="w-full rounded-xl border border-slate-300 px-3.5 min-h-[46px] font-mono font-bold text-[#0A2540]"
                />
              </div>
              <div>
                <label className="font-bold text-[#0A2540] block mb-1.5">Ciclo Actual:</label>
                <input
                  type="number"
                  min={1}
                  value={settings.currentCycle}
                  onChange={e => {
                    const cyc = parseInt(e.target.value, 10) || 1;
                    onUpdateSettings({ ...settings, currentCycle: cyc });
                  }}
                  className="w-full rounded-xl border border-slate-300 px-3.5 min-h-[46px] font-mono font-bold text-[#0A2540]"
                />
              </div>
              <div>
                <label className="font-bold text-[#0A2540] block mb-1.5">Jornada Actual:</label>
                <input
                  type="number"
                  min={1}
                  max={settings.cycleLength || 10}
                  value={settings.currentJornada}
                  onChange={e => {
                    const jor = parseInt(e.target.value, 10) || 1;
                    onUpdateSettings({ ...settings, currentJornada: jor });
                  }}
                  className="w-full rounded-xl border border-slate-300 px-3.5 min-h-[46px] font-mono font-bold text-[#0A2540]"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  onUpdateSettings({
                    ...settings,
                    currentCycle: 1,
                    currentJornada: 1,
                  });
                }}
                className="inline-flex items-center gap-2 px-4 min-h-[44px] rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-800 font-bold text-sm cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Resetear Ciclo y Jornada a (1 / 1)</span>
              </button>
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

      {/* SECTION 2: USERS & STATUS MANAGEMENT (3 LISTAS SEPARADAS DESDE "USUARIOS") */}
      {activeSection === 'USERS' && (() => {
        const titulares = players.filter(p => p.status === 'TITULAR');
        const suplentes = players
          .filter(p => p.status === 'SUPLENTE')
          .slice()
          .sort((a, b) => parseTimestampMs(a.registrationTimestamp, a.timestampMs) - parseTimestampMs(b.registrationTimestamp, b.timestampMs));
        const bajas = players.filter(p => p.status === 'BAJA');

        const handleTogglePayment = async (p: Player) => {
          const nextPaid = !p.currentCyclePaid;
          const nextLabel = nextPaid ? 'Pagado' : 'Pendiente';
          const updated = players.map(item =>
            item.id === p.id
              ? {
                  ...item,
                  currentCyclePaid: nextPaid,
                  renewalStatus: nextPaid ? ('RENOVADO' as const) : ('PENDIENTE' as const),
                  paymentStatusLabel: nextLabel,
                  paymentNotifiedAt: nextPaid ? item.paymentNotifiedAt : '',
                }
              : item
          );
          onUpdatePlayers(updated);

          const endpoint = getCleanGasUrl();
          if (endpoint && adminPassword && p.sheetRow) {
            try {
              await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify({
                  action: 'actualizarPagoAdmin',
                  fila: p.sheetRow,
                  nuevoEstado: nextLabel,
                  password: adminPassword,
                }),
              });
            } catch {
              // Silencioso; estado local ya actualizado
            }
          }
        };

        const handleChangeStatus = async (p: Player, newStatus: Player['status']) => {
          const updated = players.map(item =>
            item.id === p.id ? { ...item, status: newStatus } : item
          );
          onUpdatePlayers(updated);

          const endpoint = getCleanGasUrl();
          if (endpoint && adminPassword && p.sheetRow) {
            try {
              await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify({
                  action: 'actualizarEstadoUsuarioAdmin',
                  fila: p.sheetRow,
                  nuevoEstado: newStatus === 'TITULAR' ? 'Titular' : newStatus === 'BAJA' ? 'Baja' : 'Suplente',
                  password: adminPassword,
                }),
              });
            } catch {
              // Silencioso
            }
          }
        };

        const renderUserTable = (
          title: string,
          badgeClass: string,
          list: Player[],
          showTimestampCol: boolean,
          emptyText: string
        ) => (
          <div className="space-y-3 pt-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-lg font-extrabold text-[#0A2540]">{title}</h3>
              <span className={`px-3 py-1 rounded-full text-sm font-extrabold tabular-nums ${badgeClass}`}>
                {list.length} {list.length === 1 ? 'registro' : 'registros'}
              </span>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-left text-sm sm:text-base text-slate-800">
                <thead className="bg-[#0A2540] text-white uppercase text-xs sm:text-sm tracking-wider">
                  <tr>
                    {showTimestampCol && <th className="py-3.5 px-4">Marca Temporal</th>}
                    <th className="py-3.5 px-4">Nombre</th>
                    <th className="py-3.5 px-4">Apellidos</th>
                    <th className="py-3.5 px-4">DNI</th>
                    <th className="py-3.5 px-4">Teléfono</th>
                    <th className="py-3.5 px-4">IBAN</th>
                    <th className="py-3.5 px-4">Estado de Pago</th>
                    <th className="py-3.5 px-4">Lista / Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {list.length === 0 ? (
                    <tr>
                      <td colSpan={showTimestampCol ? 8 : 7} className="py-6 px-4 text-center text-slate-500">
                        {emptyText}
                      </td>
                    </tr>
                  ) : (
                    list.map(p => {
                      const firstName = p.firstName || p.name.split(' ')[0] || p.name;
                      const lastName = p.lastName ?? p.name.split(' ').slice(1).join(' ');
                      const payLabel = p.paymentStatusLabel || (p.currentCyclePaid ? 'Pagado' : 'Pendiente');
                      const isNotifiedRow =
                        p.renewalStatus === 'NOTIFICADO' ||
                        payLabel.toLowerCase().startsWith('notificado');
                      return (
                        <tr key={p.id} className="hover:bg-slate-50">
                          {showTimestampCol && (
                            <td className="py-3.5 px-4 font-mono text-xs sm:text-sm text-slate-600 tabular-nums whitespace-nowrap">
                              {p.registrationTimestamp || '—'}
                            </td>
                          )}
                          <td className="py-3.5 px-4 font-bold text-[#0A2540]">{firstName || '—'}</td>
                          <td className="py-3.5 px-4 font-semibold text-slate-800">{lastName || '—'}</td>
                          <td className="py-3.5 px-4 font-mono tabular-nums">{p.dni || '—'}</td>
                          <td className="py-3.5 px-4 font-mono tabular-nums whitespace-nowrap">{p.phone || '—'}</td>
                          <td className="py-3.5 px-4 font-mono text-xs sm:text-sm tabular-nums">{p.iban || '—'}</td>
                          <td className="py-3.5 px-4">
                            <button
                              type="button"
                              onClick={() => handleTogglePayment(p)}
                              className={`px-3 min-h-[40px] rounded-xl text-xs sm:text-sm font-bold cursor-pointer whitespace-nowrap ${
                                p.currentCyclePaid
                                  ? 'bg-emerald-100 text-emerald-900'
                                  : isNotifiedRow
                                  ? 'bg-amber-100 text-amber-950 border border-amber-300'
                                  : 'bg-rose-100 text-rose-900'
                              }`}
                            >
                              {payLabel}
                            </button>
                          </td>
                          <td className="py-3.5 px-4">
                            <select
                              value={p.status}
                              onChange={e => handleChangeStatus(p, e.target.value as Player['status'])}
                              className="rounded-xl border border-slate-300 px-2.5 min-h-[40px] text-xs sm:text-sm font-bold bg-white"
                            >
                              <option value="TITULAR">Titular</option>
                              <option value="SUPLENTE">Suplente</option>
                              <option value="BAJA">Baja definitiva</option>
                            </select>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );

        return (
          <div className="space-y-6">
            {/* BANDEJA DE VALIDACIÓN RÁPIDA EN 1 CLIC */}
            <div className="rounded-3xl bg-white border-2 border-amber-300 p-5 sm:p-7 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-amber-100 text-[#FF6B00] flex items-center justify-center shrink-0">
                    <Clock className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="font-extrabold text-xl text-[#0A2540]">
                      Avisos de Pago Pendientes de Verificar ({pendingPaymentNotices.length})
                    </h2>
                    <p className="text-sm sm:text-base text-slate-600 mt-0.5">
                      Socios que han notificado su Bizum o Transferencia de 10 € desde la app. Valida en 1 clic tras comprobar el extracto.
                    </p>
                  </div>
                </div>
                <span
                  className={`px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-extrabold tabular-nums shrink-0 ${
                    pendingPaymentNotices.length > 0
                      ? 'bg-[#FF6B00] text-white'
                      : 'bg-emerald-100 text-emerald-900'
                  }`}
                >
                  {pendingPaymentNotices.length > 0
                    ? `${pendingPaymentNotices.length} pendiente(s)`
                    : 'Todo al día'}
                </span>
              </div>

              {pendingPaymentNotices.length === 0 ? (
                <div className="rounded-2xl bg-[#F4F6F9] border border-slate-200 p-4 text-sm font-semibold text-slate-600 text-center">
                  No hay avisos de pago pendientes de verificar en este momento.
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingPaymentNotices.map(p => {
                    const rawLbl = p.paymentStatusLabel || 'Notificado';
                    const methodMatch = rawLbl.match(/\(([^)]+)\)/);
                    const methodName = methodMatch ? methodMatch[1] : rawLbl;
                    const isBusy = validatingPaymentId === p.id;
                    return (
                      <div
                        key={`users-pay-${p.id}`}
                        className="rounded-2xl bg-amber-50/70 border border-amber-200 p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3"
                      >
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-black text-base text-[#0A2540]">{p.name}</span>
                            <span className="px-2.5 py-0.5 rounded-lg bg-white border border-amber-300 text-[#0A2540] text-xs font-extrabold">
                              Método: {methodName}
                            </span>
                            {p.paymentNotifiedAt && (
                              <span className="text-xs font-mono font-bold text-slate-700 tabular-nums">
                                🕒 Aviso: {p.paymentNotifiedAt}
                              </span>
                            )}
                          </div>
                          <p className="text-xs sm:text-sm text-slate-600">
                            {p.status} · {p.dni ? `DNI: ${p.dni}` : `Teléfono: ${p.phone || '—'}`}
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 shrink-0">
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => handleValidatePaymentOneClick(p, 'Pagado')}
                            className="px-4 min-h-[42px] rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-xs sm:text-sm font-extrabold shadow-2xs cursor-pointer"
                          >
                            {isBusy ? 'Guardando...' : '✅ Confirmar Ingreso (Pagado)'}
                          </button>
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => handleValidatePaymentOneClick(p, 'Pendiente')}
                            className="px-4 min-h-[42px] rounded-xl bg-white hover:bg-rose-50 border border-rose-300 disabled:opacity-60 text-rose-800 text-xs sm:text-sm font-bold cursor-pointer"
                          >
                            ❌ No recibido (Rechazar)
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="rounded-3xl bg-white border border-slate-200 p-5 sm:p-7 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="font-extrabold text-xl text-[#0A2540]">
                    Gestión de Socios desde «Usuarios» (3 Listas Separadas)
                  </h2>
                  <p className="text-base text-slate-600 mt-0.5">
                    Titulares, Suplentes (ordenados estrictamente por marca temporal) y Bajas definitivas con datos completos.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleOpenPdfExportModal('TITULAR')}
                    className="inline-flex items-center gap-2 px-3.5 min-h-[44px] rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-[#0A2540] text-sm font-bold cursor-pointer"
                    title="Exportar listado de Titulares a PDF"
                  >
                    <FileDown className="w-4 h-4 text-[#FF6B00]" />
                    <span>PDF Titulares</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenPdfExportModal('SUPLENTE')}
                    className="inline-flex items-center gap-2 px-3.5 min-h-[44px] rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-[#0A2540] text-sm font-bold cursor-pointer"
                    title="Exportar listado de Suplentes a PDF"
                  >
                    <FileDown className="w-4 h-4 text-[#FF6B00]" />
                    <span>PDF Suplentes</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenPdfExportModal('BAJA')}
                    className="inline-flex items-center gap-2 px-3.5 min-h-[44px] rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-[#0A2540] text-sm font-bold cursor-pointer"
                    title="Exportar listado de Bajas a PDF"
                  >
                    <FileDown className="w-4 h-4 text-[#FF6B00]" />
                    <span>PDF Bajas</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenPdfExportModal('ALL')}
                    className="inline-flex items-center gap-2 px-3.5 min-h-[44px] rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-[#0A2540] text-sm font-bold cursor-pointer"
                    title="Exportar listado completo a PDF"
                  >
                    <FileDown className="w-4 h-4 text-[#FF6B00]" />
                    <span>PDF General</span>
                  </button>
                  <button
                    type="button"
                    onClick={fetchUncensoredAdminUsers}
                    disabled={isLoadingAdminUsers}
                    className="inline-flex items-center gap-2 px-4 min-h-[44px] rounded-xl bg-[#0A2540] hover:bg-[#13375B] disabled:opacity-60 text-white text-sm font-bold cursor-pointer"
                  >
                    {isLoadingAdminUsers && <Loader2 className="w-4 h-4 animate-spin" />}
                    <span>{isLoadingAdminUsers ? 'Sincronizando...' : 'Actualizar desde Usuarios'}</span>
                  </button>
                </div>
              </div>

              {adminUsersFeedback && (
                <div className="p-3 rounded-xl bg-[#F4F6F9] border border-slate-200 text-sm font-semibold text-[#0A2540]">
                  {adminUsersFeedback}
                </div>
              )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 tabular-nums">
              <div className="p-4 rounded-2xl bg-[#F4F6F9] border border-slate-200">
                <span className="text-xs font-bold uppercase text-slate-500 block">1. Titulares</span>
                <span className="text-2xl font-black text-[#0A2540]">{titulares.length}</span>
              </div>
              <div className="p-4 rounded-2xl bg-orange-50 border border-orange-200">
                <span className="text-xs font-bold uppercase text-[#FF6B00] block">2. Suplentes (Cola)</span>
                <span className="text-2xl font-black text-[#0A2540]">{suplentes.length}</span>
              </div>
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200">
                <span className="text-xs font-bold uppercase text-rose-700 block">3. Bajas Definitivas</span>
                <span className="text-2xl font-black text-rose-950">{bajas.length}</span>
              </div>
            </div>

            {renderUserTable(
              '1. Titulares',
              'bg-blue-50 text-[#0A2540] border border-blue-200',
              titulares,
              false,
              'No hay socios titulares registrados actualmente en la pestaña "Usuarios".'
            )}

            {renderUserTable(
              '2. Suplentes (Ordenados por Marca Temporal)',
              'bg-orange-50 text-[#FF6B00] border border-orange-200',
              suplentes,
              true,
              'No hay suplentes en lista de espera actualmente en la pestaña "Usuarios".'
            )}

            {renderUserTable(
              '3. Bajas definitivas',
              'bg-rose-50 text-rose-800 border border-rose-200',
              bajas,
              false,
              'No hay bajas definitivas registradas en la pestaña "Usuarios".'
            )}

            {/* BLOQUE DE SEGUIMIENTO DE INSTALACIONES PWA */}
            <div className="pt-6 mt-6 border-t border-slate-200 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-extrabold text-lg sm:text-xl text-[#0A2540] flex items-center gap-2">
                    <Smartphone className="w-5 h-5 text-[#FF6B00]" />
                    Instalaciones de la App
                  </h3>
                  <p className="text-sm text-slate-600 mt-0.5">
                    Dispositivos con la App instalada (PWA) o acceso web, vinculados al socio cuando inicia sesión.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={fetchAdminInstallations}
                  disabled={isLoadingInstallations}
                  className="inline-flex items-center gap-2 px-4 min-h-[44px] rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-60 text-[#0A2540] text-sm font-bold cursor-pointer self-start sm:self-auto"
                >
                  {isLoadingInstallations && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{isLoadingInstallations ? 'Cargando...' : 'Actualizar instalaciones'}</span>
                </button>
              </div>

              {installationsFeedback && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-sm font-semibold text-amber-900">
                  {installationsFeedback}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 tabular-nums">
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
                  <span className="text-xs font-bold uppercase text-emerald-800 block">
                    Apps Instaladas (PWA)
                  </span>
                  <span className="text-2xl font-black text-emerald-950">
                    {installStats.totalInstaladas}
                  </span>
                </div>
                <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200">
                  <span className="text-xs font-bold uppercase text-[#0A2540] block">
                    Socios Identificados
                  </span>
                  <span className="text-2xl font-black text-[#0A2540]">
                    {installStats.identificadas}
                  </span>
                </div>
                <div className="p-4 rounded-2xl bg-[#F4F6F9] border border-slate-200">
                  <span className="text-xs font-bold uppercase text-slate-600 block">
                    Total Dispositivos
                  </span>
                  <span className="text-2xl font-black text-[#0A2540]">
                    {installStats.totalDispositivos}
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full text-left text-sm sm:text-base text-slate-800">
                  <thead className="bg-[#0A2540] text-white uppercase text-xs sm:text-sm tracking-wider">
                    <tr>
                      <th className="py-3.5 px-4">Nombre / DNI</th>
                      <th className="py-3.5 px-4">Modo</th>
                      <th className="py-3.5 px-4">Dispositivo</th>
                      <th className="py-3.5 px-4">Último Acceso</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {installations.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-6 px-4 text-center text-slate-500">
                          {isLoadingInstallations
                            ? 'Cargando registros desde "Instalaciones App"...'
                            : 'Todavía no hay dispositivos registrados en la pestaña "Instalaciones App".'}
                        </td>
                      </tr>
                    ) : (
                      installations.map(item => {
                        const isPwa = item.modo === 'App Instalada (PWA)';
                        return (
                          <tr key={item.deviceId} className="hover:bg-slate-50">
                            <td className="py-3.5 px-4">
                              {item.nombre || item.dni ? (
                                <div>
                                  <div className="font-bold text-[#0A2540]">
                                    {item.nombre || 'Socio identificado'}
                                  </div>
                                  {item.dni && (
                                    <div className="text-xs font-mono text-slate-500 tabular-nums">
                                      {item.dni}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <span className="text-slate-500 italic">Anónimo (sin iniciar sesión)</span>
                              )}
                            </td>
                            <td className="py-3.5 px-4">
                              <span
                                className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap ${
                                  isPwa
                                    ? 'bg-emerald-100 text-emerald-900'
                                    : 'bg-slate-100 text-slate-700'
                                }`}
                              >
                                {item.modo}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-slate-700 whitespace-nowrap">
                              {item.plataforma || '—'}
                            </td>
                            <td className="py-3.5 px-4 font-mono text-xs sm:text-sm text-slate-600 tabular-nums whitespace-nowrap">
                              {item.ultimoAcceso || item.primeraVisita || '—'}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            </div>
          </div>
        );
      })()}

      {/* SECTION 3: TICKET UPLOAD (SOPORTE MULTI-BOLETO E IMÁGENES MÚLTIPLES) */}
      {activeSection === 'TICKET_UPLOAD' && (
        <div className="rounded-3xl bg-white border border-slate-200 p-5 sm:p-7 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-extrabold text-xl text-[#0A2540] flex items-center gap-2.5">
                <Upload className="w-6 h-6 text-[#FF6B00]" />
                Subir y Publicar Resguardos Oficiales Sellados
              </h2>
              <p className="text-base text-slate-600 mt-1">
                Sube <strong>una o varias fotos/PDF</strong> a la vez para extraer sus números con IA, o pulsa <strong>«+ Añadir otro boleto»</strong> para escribir múltiples combinaciones manualmente en la misma jornada.
              </p>
            </div>
            <div className="rounded-2xl bg-[#0A2540] text-white px-4 py-2.5 shrink-0 tabular-nums">
              <span className="text-xs uppercase font-bold text-slate-300 block">En preparación</span>
              <span className="text-lg font-black text-[#FF6B00]">
                {ticketDrafts.length} {ticketDrafts.length === 1 ? 'boleto' : 'boletos'} ·{' '}
                {ticketDrafts.reduce((s, d) => s + (isNaN(d.cost) ? 0 : d.cost), 0).toFixed(2)} €
              </span>
            </div>
          </div>

          {/* Zona de subida múltiple de imágenes/PDF */}
          <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-[#F4F6F9] p-5 sm:p-6 text-center transition hover:border-[#0A2540]">
            <input
              type="file"
              id="ticket-file-input"
              multiple
              accept="image/*,application/pdf"
              className="hidden"
              onChange={e => {
                if (e.target.files && e.target.files.length > 0) {
                  handleMultipleFilesUploadAndScan(e.target.files);
                  e.target.value = '';
                }
              }}
            />
            <label
              htmlFor="ticket-file-input"
              className="cursor-pointer flex flex-col items-center justify-center gap-3 select-none"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0A2540] text-[#FF6B00] shadow-xs">
                {ticketDrafts.some(d => d.isScanningAI) ? (
                  <Loader2 className="w-7 h-7 animate-spin" />
                ) : (
                  <Sparkles className="w-7 h-7" />
                )}
              </div>
              <div>
                <span className="text-base sm:text-lg font-extrabold text-[#0A2540] block">
                  {ticketDrafts.some(d => d.isScanningAI)
                    ? 'Analizando resguardos con IA...'
                    : 'Subir 1 o Varias Imágenes / PDF de Boletos'}
                </span>
                <span className="text-sm sm:text-base text-slate-600 block mt-1">
                  Puedes seleccionar varios resguardos de la galería a la vez · Cada archivo crea su propia ficha con extracción automática de números
                </span>
              </div>
              <div className="mt-1 inline-flex items-center gap-2 px-5 min-h-[46px] rounded-xl bg-[#0A2540] hover:bg-[#13375B] text-white text-base font-bold transition shadow-xs">
                <FileUp className="w-5 h-5 text-[#FF6B00]" />
                <span>Seleccionar Imágenes / PDF</span>
              </div>
            </label>
          </div>

          {/* Datos comunes de la Jornada y Programación */}
          <div className="rounded-2xl border border-slate-200 bg-[#F4F6F9] p-4 sm:p-5 space-y-4 text-base">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="font-bold text-[#0A2540] block mb-1.5">Juego de Lotería:</label>
                <select
                  value={selectedLotteryGame}
                  onChange={e => {
                    const game = e.target.value as 'La Primitiva' | 'Euromillones';
                    setSelectedLotteryGame(game);
                    if (game === 'Euromillones') {
                      setNewTicketPublishTime('20:30');
                    } else {
                      setNewTicketPublishTime('21:15');
                    }
                  }}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 min-h-[46px] font-bold text-[#0A2540]"
                >
                  <option value="La Primitiva">La Primitiva (L/J/S · Cierre 21:15 h)</option>
                  <option value="Euromillones">Euromillones (M/V · Cierre 20:30 h)</option>
                </select>
              </div>
              <div>
                <label className="font-bold text-[#0A2540] block mb-1.5">Jornada del Ciclo:</label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={newTicketJornada}
                  onChange={e => setNewTicketJornada(parseInt(e.target.value, 10) || 1)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 min-h-[46px] font-mono font-bold text-[#0A2540]"
                />
              </div>
              <div>
                <label className="font-bold text-[#0A2540] block mb-1.5">Fecha del Sorteo:</label>
                <input
                  type="date"
                  value={newTicketDrawDate}
                  onChange={e => setNewTicketDrawDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 min-h-[46px] font-mono font-bold text-[#0A2540]"
                />
              </div>
              <div>
                <label className="font-bold text-[#0A2540] block mb-1.5">Hora de Publicación:</label>
                <input
                  type="time"
                  value={newTicketPublishTime}
                  disabled={newTicketPublishMode === 'AHORA'}
                  onChange={e => setNewTicketPublishTime(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 min-h-[46px] font-mono font-bold text-[#0A2540] disabled:bg-slate-100 disabled:text-slate-400"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setNewTicketPublishMode('PROGRAMADO')}
                className={`p-3 rounded-xl border-2 text-left transition cursor-pointer ${
                  newTicketPublishMode === 'PROGRAMADO'
                    ? 'border-[#FF6B00] bg-orange-50 text-[#0A2540]'
                    : 'border-slate-200 bg-white text-slate-600'
                }`}
              >
                <span className="font-extrabold text-sm flex items-center gap-1.5">
                  <CalendarClock className="w-4 h-4 text-[#FF6B00] shrink-0" />
                  Programar todos al día del sorteo
                </span>
                <span className="text-xs text-slate-600 block mt-1">
                  Se guardan ocultos y se publican + envían por WhatsApp el día elegido ({newTicketPublishTime} h).
                </span>
              </button>

              <button
                type="button"
                onClick={() => setNewTicketPublishMode('AHORA')}
                className={`p-3 rounded-xl border-2 text-left transition cursor-pointer ${
                  newTicketPublishMode === 'AHORA'
                    ? 'border-[#0A2540] bg-slate-100 text-[#0A2540]'
                    : 'border-slate-200 bg-white text-slate-600'
                }`}
              >
                <span className="font-extrabold text-sm flex items-center gap-1.5">
                  <Send className="w-4 h-4 text-[#0A2540] shrink-0" />
                  Publicar y avisar todos ahora
                </span>
                <span className="text-xs text-slate-600 block mt-1">
                  Visibles al instante en «Mi Jugada» y envía WhatsApp + Push ahora mismo.
                </span>
              </button>
            </div>
          </div>

          {/* Tarjetas individuales por cada Boleto / Resguardo de la Jornada */}
          <div className="space-y-4">
            {ticketDrafts.map((draft, idx) => {
              const draftCandidates = getReceiptImageCandidates(draft.image);
              const draftPreviewSrc =
                draftCandidates[draft.previewCandidateIdx] || normalizeReceiptImageUrl(draft.image);
              const individualInputId = `ticket-file-single-${draft.draftId}`;
              const selectedNums = parseDraftNumbersList(draft.numbers);

              return (
                <div
                  key={draft.draftId}
                  className="rounded-2xl border-2 border-slate-200 bg-white p-4 sm:p-5 space-y-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="px-3 py-1 rounded-xl bg-[#0A2540] text-white text-sm font-black">
                        Resguardo #{idx + 1}
                      </span>
                      <span className="px-2.5 py-1 rounded-lg bg-orange-50 border border-orange-200 text-[#FF6B00] text-xs font-extrabold">
                        {draft.modalityLabel}
                      </span>
                      {draft.fileName && (
                        <span className="text-xs sm:text-sm font-mono text-slate-600 truncate max-w-[200px]">
                          {draft.fileName}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        type="file"
                        id={individualInputId}
                        accept="image/*,application/pdf"
                        className="hidden"
                        onChange={e => {
                          const file = e.target.files?.[0];
                          if (file) {
                            scanFileIntoDraft(draft.draftId, file, idx === 0);
                            e.target.value = '';
                          }
                        }}
                      />
                      <label
                        htmlFor={individualInputId}
                        className="inline-flex items-center gap-1.5 px-3.5 min-h-[40px] rounded-xl bg-[#0A2540] hover:bg-[#13375B] text-white text-xs sm:text-sm font-bold cursor-pointer transition"
                      >
                        <FileUp className="w-4 h-4 text-[#FF6B00]" />
                        <span>{draft.image ? 'Cambiar foto' : 'Subir foto boleto'}</span>
                      </label>

                      {ticketDrafts.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveDraftSlot(draft.draftId)}
                          className="inline-flex items-center gap-1 px-3 min-h-[40px] rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs sm:text-sm font-bold cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>Quitar</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {draft.isScanningAI && (
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-50 text-sm font-bold text-[#0A2540] border border-blue-200 animate-pulse">
                      <Loader2 className="w-4 h-4 animate-spin text-[#FF6B00]" />
                      <span>Preprocesando imagen y escaneando números con OCR...</span>
                    </div>
                  )}

                  {draft.scanSuccessMessage && (
                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-sm text-emerald-950 flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{draft.scanSuccessMessage}</span>
                    </div>
                  )}

                  {draft.scanError && (
                    <div className="p-3 rounded-xl bg-orange-50 border border-orange-200 text-sm text-[#0A2540] flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-[#FF6B00] shrink-0 mt-0.5" />
                      <span>{draft.scanError}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-base">
                    <div className="space-y-3.5">
                      <div>
                        <label className="font-bold text-[#0A2540] block mb-1.5">
                          Modalidad / Apuestas (Resguardo #{idx + 1}):
                        </label>
                        <select
                          value={draft.modalityKey}
                          onChange={e => handleSelectModalityPreset(draft.draftId, e.target.value)}
                          className="w-full rounded-xl border border-slate-300 bg-white px-3.5 min-h-[46px] font-bold text-[#0A2540]"
                        >
                          {MODALITY_PRESETS.map(p => (
                            <option key={p.key} value={p.key}>
                              {p.key === 'CUSTOM'
                                ? p.label
                                : `${p.label} — ${p.betsCount} apuestas (${p.betsCount} €)`}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="font-bold text-[#0A2540] block mb-1.5">
                          Combinación Jugada (01–49):
                        </label>
                        <input
                          type="text"
                          value={draft.numbers}
                          onChange={e =>
                            updateDraft(draft.draftId, d => ({ ...d, numbers: e.target.value }))
                          }
                          placeholder="07, 13, 22, 34, 41, 45, 49"
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
                            value={draft.reintegro}
                            onChange={e =>
                              updateDraft(draft.draftId, d => ({
                                ...d,
                                reintegro: parseInt(e.target.value, 10) || 0,
                              }))
                            }
                            className="w-full rounded-xl border border-slate-300 px-3.5 min-h-[46px] font-mono font-bold"
                          />
                        </div>
                        <div>
                          <label className="font-bold text-[#0A2540] block mb-1.5">Coste Boleto (€):</label>
                          <input
                            type="number"
                            step="0.01"
                            min={0}
                            value={draft.cost}
                            onChange={e => {
                              const nextCost = parseFloat(e.target.value) || 0;
                              updateDraft(draft.draftId, d => ({
                                ...d,
                                cost: nextCost,
                                betsCount: Math.round(nextCost) || d.betsCount,
                              }));
                            }}
                            className="w-full rounded-xl border border-slate-300 px-3.5 min-h-[46px] font-mono font-bold text-emerald-800"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="font-bold text-[#0A2540] block mb-1.5">
                          URL o Imagen del Resguardo #{idx + 1}:
                        </label>
                        <input
                          type="text"
                          value={
                            draft.image.startsWith('data:')
                              ? 'Imagen digital cargada (Base64)'
                              : draft.image
                          }
                          onChange={e => {
                            if (!draft.image.startsWith('data:')) {
                              const nextVal = e.target.value;
                              updateDraft(draft.draftId, d => ({
                                ...d,
                                image: nextVal,
                                previewCandidateIdx: 0,
                                previewLoadFailed: false,
                              }));
                            }
                          }}
                          placeholder="Se rellena al subir foto o pega una URL"
                          className="w-full rounded-xl border border-slate-300 px-3.5 min-h-[46px] font-mono text-sm"
                        />
                      </div>
                    </div>

                    <div className="border border-slate-200 rounded-2xl p-4 bg-[#F4F6F9] flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-slate-600 uppercase">
                            Vista Previa Resguardo #{idx + 1}
                          </span>
                          {draft.image && (
                            <button
                              type="button"
                              onClick={() =>
                                updateDraft(draft.draftId, d => ({
                                  ...d,
                                  image: '',
                                  fileName: null,
                                  previewCandidateIdx: 0,
                                  previewLoadFailed: false,
                                }))
                              }
                              className="inline-flex items-center gap-1 text-xs font-bold text-rose-700 hover:underline cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Quitar foto</span>
                            </button>
                          )}
                        </div>
                        <div className="relative rounded-xl overflow-hidden border border-slate-300 min-h-44 max-h-60 bg-white flex items-center justify-center p-2">
                          {draft.fileName?.toLowerCase().endsWith('.pdf') ||
                          draft.image.startsWith('data:application/pdf') ? (
                            <div className="p-4 text-center">
                              <FileText className="w-10 h-10 text-rose-600 mx-auto mb-1" />
                              <span className="text-sm font-bold text-[#0A2540] block truncate max-w-xs">
                                {draft.fileName || 'resguardo.pdf'}
                              </span>
                              <span className="text-xs text-slate-600">PDF listo para publicar</span>
                            </div>
                          ) : draft.image && !draft.previewLoadFailed ? (
                            <img
                              src={draftPreviewSrc}
                              alt={`Resguardo ${idx + 1}`}
                              referrerPolicy="no-referrer"
                              className="max-h-56 w-auto max-w-full object-contain"
                              onError={() => {
                                if (draft.previewCandidateIdx + 1 < draftCandidates.length) {
                                  updateDraft(draft.draftId, d => ({
                                    ...d,
                                    previewCandidateIdx: d.previewCandidateIdx + 1,
                                  }));
                                } else {
                                  updateDraft(draft.draftId, d => ({
                                    ...d,
                                    previewLoadFailed: true,
                                  }));
                                }
                              }}
                            />
                          ) : draft.image ? (
                            <div className="p-3 text-center text-slate-600 space-y-1">
                              <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto" />
                              <span className="text-xs font-bold text-[#0A2540] block">
                                Imagen guardada (vista previa bloqueada por el navegador)
                              </span>
                            </div>
                          ) : (
                            <label
                              htmlFor={individualInputId}
                              className="p-4 text-center text-slate-500 cursor-pointer hover:text-[#0A2540] transition"
                            >
                              <Upload className="w-8 h-8 text-slate-400 mx-auto mb-1" />
                              <span className="text-xs sm:text-sm font-semibold block">
                                Pulsa aquí para subir la imagen del Resguardo #{idx + 1}
                              </span>
                            </label>
                          )}
                        </div>
                      </div>

                      <div className="mt-3 p-3 bg-white rounded-xl border border-slate-200 text-xs sm:text-sm space-y-1">
                        <div>
                          <strong>Modalidad:</strong> {draft.modalityLabel} ({draft.betsCount} apuestas)
                        </div>
                        <div>
                          <strong>Combinación:</strong> {draft.numbers || 'Pendiente de marcar'}
                        </div>
                        <div>
                          <strong>Reintegro:</strong> [{draft.reintegro}] · <strong>Coste:</strong>{' '}
                          {(isNaN(draft.cost) ? 0 : draft.cost).toFixed(2)} €
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Chips editables de números detectados + Botón & Cuadrícula táctil 1-49 */}
                  <div className="rounded-2xl border border-slate-200 bg-[#F4F6F9] p-4 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                      <div>
                        <span className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-[#0A2540] block">
                          Números Detectados / Marcados ({selectedNums.length})
                        </span>
                        <span className="text-xs text-slate-600">
                          Pulsa la «×» de cualquier etiqueta para quitar un número erróneo o abre la cuadrícula rápida del 1 al 49.
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          updateDraft(draft.draftId, d => ({
                            ...d,
                            isNumberGridOpen: !d.isNumberGridOpen,
                          }))
                        }
                        className={`inline-flex items-center justify-center gap-2 px-4 min-h-[42px] rounded-xl text-xs sm:text-sm font-extrabold transition cursor-pointer shrink-0 ${
                          draft.isNumberGridOpen
                            ? 'bg-[#FF6B00] text-white shadow-xs'
                            : 'bg-[#0A2540] hover:bg-[#13375B] text-white'
                        }`}
                      >
                        <LayoutGrid className="w-4 h-4" />
                        <span>
                          {draft.isNumberGridOpen
                            ? 'Ocultar cuadrícula 1-49'
                            : 'Editar / Marcar números manualmente'}
                        </span>
                      </button>
                    </div>

                    {/* Etiquetas / Chips editables */}
                    <div className="flex flex-wrap items-center gap-2">
                      {selectedNums.length > 0 ? (
                        selectedNums.map(num => (
                          <button
                            key={`chip-${draft.draftId}-${num}`}
                            type="button"
                            onClick={() => toggleDraftGridNumber(draft.draftId, num)}
                            title={`Quitar número ${num < 10 ? `0${num}` : num}`}
                            className="inline-flex items-center gap-1.5 pl-3 pr-2 py-1.5 rounded-xl bg-[#0A2540] hover:bg-rose-700 text-white font-mono font-extrabold text-sm shadow-2xs transition cursor-pointer tabular-nums"
                          >
                            <span>{num < 10 ? `0${num}` : num}</span>
                            <X className="w-3.5 h-3.5 text-[#FF6B00]" />
                          </button>
                        ))
                      ) : (
                        <span className="text-xs sm:text-sm text-slate-500 italic">
                          Sin números marcados todavía. Sube una foto o pulsa «Editar / Marcar números manualmente».
                        </span>
                      )}
                    </div>

                    {/* Cuadrícula Táctil Compacta del 1 al 49 (estilo boleto oficial) */}
                    {draft.isNumberGridOpen && (
                      <div className="rounded-xl bg-white border-2 border-[#0A2540]/15 p-3 sm:p-4 space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-xs sm:text-sm font-extrabold text-[#0A2540]">
                            Selector Táctil La Primitiva (01 – 49) · Marcados: {selectedNums.length}
                          </span>
                          {selectedNums.length > 0 && (
                            <button
                              type="button"
                              onClick={() =>
                                updateDraft(draft.draftId, d => ({ ...d, numbers: '' }))
                              }
                              className="text-xs font-bold text-rose-700 hover:underline cursor-pointer"
                            >
                              Limpiar selección
                            </button>
                          )}
                        </div>
                        <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
                          {Array.from({ length: 49 }, (_, i) => i + 1).map(num => {
                            const isSelected = selectedNums.includes(num);
                            return (
                              <button
                                key={`grid-${draft.draftId}-${num}`}
                                type="button"
                                onClick={() => toggleDraftGridNumber(draft.draftId, num)}
                                className={`min-h-[38px] sm:min-h-[42px] rounded-lg border font-mono font-extrabold text-sm sm:text-base tabular-nums transition cursor-pointer ${
                                  isSelected
                                    ? 'bg-[#FF6B00] border-[#FF6B00] text-white shadow-xs scale-[1.03]'
                                    : 'bg-[#F4F6F9] border-slate-200 text-[#0A2540] hover:border-[#FF6B00] hover:bg-orange-50'
                                }`}
                              >
                                {num < 10 ? `0${num}` : num}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {batchSaveError && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-sm sm:text-base text-rose-900 font-bold flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <span>{batchSaveError}</span>
            </div>
          )}

          {/* Botones Añadir otro resguardo + Guardar / Programar Jornada */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={handleAddDraftSlot}
              className="sm:w-auto inline-flex items-center justify-center gap-2 px-5 min-h-[50px] rounded-xl border-2 border-[#0A2540] bg-white hover:bg-slate-100 text-[#0A2540] font-extrabold text-base transition cursor-pointer shrink-0"
            >
              <Plus className="w-5 h-5 text-[#FF6B00]" />
              <span>+ Añadir otro resguardo a esta jornada</span>
            </button>

            <button
              type="button"
              disabled={isSavingTicket || ticketDrafts.some(d => d.isScanningAI)}
              onClick={handleSaveTicket}
              className="flex-1 min-h-[50px] rounded-xl bg-[#FF6B00] hover:bg-[#E55E00] disabled:opacity-60 text-white font-bold text-base shadow-xs transition cursor-pointer flex items-center justify-center gap-2 px-5"
            >
              {isSavingTicket ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Guardando {ticketDrafts.length} {ticketDrafts.length === 1 ? 'resguardo' : 'resguardos'}...</span>
                </>
              ) : ticketSaveSuccess ? (
                <span>
                  {newTicketPublishMode === 'PROGRAMADO'
                    ? '¡Jornada Programada Correctamente!'
                    : '¡Jornada Publicada y Notificada!'}
                </span>
              ) : (
                <span>
                  {newTicketPublishMode === 'PROGRAMADO'
                    ? `Guardar / Programar Jornada (${ticketDrafts.length} ${ticketDrafts.length === 1 ? 'resguardo' : 'resguardos'} · ${newTicketDrawDate} ${newTicketPublishTime} h)`
                    : `Guardar / Publicar Jornada Ahora (${ticketDrafts.length} ${ticketDrafts.length === 1 ? 'resguardo' : 'resguardos'})`}
                </span>
              )}
            </button>
          </div>

          {ticketSyncFeedback && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-sm text-emerald-950 font-semibold leading-relaxed">
              {ticketSyncFeedback}
            </div>
          )}

          {/* Resguardos ya publicados en la jornada actual */}
          {(() => {
            const publishedActiveTickets = tickets.filter(
              t => !t.isScrutinized && isTicketPublishedNow(t)
            );
            if (publishedActiveTickets.length === 0) return null;
            return (
              <div className="rounded-2xl border-2 border-emerald-200 bg-emerald-50/60 p-4 sm:p-5 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 text-[#0A2540]">
                  <h3 className="font-extrabold text-base sm:text-lg flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <span>
                      Resguardos Activos en «Mi Jugada» ({publishedActiveTickets.length})
                    </span>
                  </h3>
                  <span className="text-sm font-black text-emerald-900 tabular-nums">
                    Total sellado: {publishedActiveTickets.reduce((s, t) => s + (t.cost || 0), 0).toFixed(2)} €
                  </span>
                </div>
                <p className="text-sm text-slate-700">
                  Puedes subir más resguardos para esta misma jornada arriba (se añadirán juntos) o subir un resguardo con distinta jornada/fecha para archivar esta jornada en «Últimos Jugados».
                </p>
                <div className="space-y-2.5">
                  {publishedActiveTickets.map((pt, idx) => (
                    <div
                      key={pt.id}
                      className="rounded-xl bg-white border border-emerald-200 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        {pt.receiptImageUrl && (
                          <img
                            src={normalizeReceiptImageUrl(pt.receiptImageUrl)}
                            alt={`Miniatura boleto ${idx + 1}`}
                            referrerPolicy="no-referrer"
                            className="w-14 h-14 rounded-lg object-cover border border-slate-200 shrink-0"
                          />
                        )}
                        <div className="space-y-1">
                          <div className="font-extrabold text-[#0A2540] text-sm sm:text-base">
                            Resguardo #{idx + 1}{pt.modalityLabel ? ` — ${pt.modalityLabel}` : ''} · Jornada {pt.jornadaNumber}/10 · {pt.drawDate}
                          </div>
                          <div className="text-sm font-mono text-slate-700">
                            [{pt.playedNumbers.map(n => (n < 10 ? `0${n}` : n)).join(', ')}] · R: {pt.playedReintegro} · {pt.cost.toFixed(2)} €
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteScheduledTicket(pt.id)}
                        className="px-3 min-h-[40px] rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs sm:text-sm font-bold cursor-pointer shrink-0"
                      >
                        Quitar resguardo
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* Boletos Programados (solo visibles para el Administrador hasta el día del sorteo) */}
          {(() => {
            const scheduledTickets = tickets.filter(t => !t.isScrutinized && !isTicketPublishedNow(t));
            if (scheduledTickets.length === 0) return null;
            return (
              <div className="rounded-2xl border-2 border-amber-300 bg-amber-50/70 p-4 sm:p-5 space-y-3">
                <div className="flex items-center gap-2 text-[#0A2540]">
                  <CalendarClock className="w-5 h-5 text-[#FF6B00] shrink-0" />
                  <h3 className="font-extrabold text-base sm:text-lg">
                    Resguardos Programados Pendientes de Publicar ({scheduledTickets.length})
                  </h3>
                </div>
                <p className="text-sm text-slate-700">
                  Los socios todavía no ven estos boletos ni han recibido avisos. Se publicarán automáticamente en la fecha y hora indicadas.
                </p>
                <div className="space-y-2.5">
                  {scheduledTickets.map((st, idx) => (
                    <div
                      key={st.id}
                      className="rounded-xl bg-white border border-amber-200 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        {st.receiptImageUrl && (
                          <img
                            src={normalizeReceiptImageUrl(st.receiptImageUrl)}
                            alt={`Miniatura programado ${idx + 1}`}
                            referrerPolicy="no-referrer"
                            className="w-14 h-14 rounded-lg object-cover border border-slate-200 shrink-0"
                          />
                        )}
                        <div className="space-y-1">
                          <div className="font-extrabold text-[#0A2540] text-sm sm:text-base">
                            Resguardo #{idx + 1}{st.modalityLabel ? ` — ${st.modalityLabel}` : ''} · Jornada {st.jornadaNumber}/10 · {formatScheduledDateTimeLabel(st.publishAt, st.drawDate)}
                          </div>
                          <div className="text-sm font-mono text-slate-700">
                            [{st.playedNumbers.map(n => (n < 10 ? `0${n}` : n)).join(', ')}] · R: {st.playedReintegro} · {st.cost.toFixed(2)} €
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handlePublishScheduledNow(st)}
                          className="px-3.5 min-h-[40px] rounded-xl bg-[#0A2540] hover:bg-[#13375B] text-white text-xs sm:text-sm font-bold cursor-pointer"
                        >
                          Publicar y Notificar Ahora
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteScheduledTicket(st.id)}
                          className="px-3 min-h-[40px] rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs sm:text-sm font-bold cursor-pointer"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* SECTION: PRE-PROGRAMMED PUSH NOTIFICATIONS & ALERTS */}
      {activeSection === 'PUSH_ALERTS' && (() => {
        const PRESET_PUSH_TEMPLATES = [
          {
            id: 'boleto-sellado',
            tag: 'Día de Sorteo · 20:35 h',
            title: `🎟️ Boleto Sellado · Jornada ${settings.currentJornada}/10`,
            body: `Ya está publicada la imagen real del resguardo oficial sellado de la Jornada ${settings.currentJornada} (Ciclo ${settings.currentCycle}). Entra en «Mi Jugada» para verlo. ¡Mucha suerte!`,
          },
          {
            id: 'inicio-renovacion',
            tag: 'Jornada 7 · Cobros',
            title: `⏳ Plazo de Renovación Abierto (Ciclo ${settings.currentCycle + 1})`,
            body: `Estamos en la Jornada ${settings.currentJornada}/10. Recuerda abonar los 10,00 € de renovación entre las jornadas 7 y 9 para conservar tu plaza de Titular.`,
          },
          {
            id: 'ultimo-aviso-j9',
            tag: 'Jornada 9 · Urgente',
            title: '🚨 Último Día de Renovación (Jornada 9)',
            body: 'Hoy finaliza el plazo obligatorio para abonar los 10,00 € del próximo ciclo. Quien no haya confirmado el pago causará baja tras la Jornada 10 según el Art. 3.3.',
          },
          {
            id: 'vacante-48h',
            tag: 'Lista de Espera · 48h',
            title: '🔔 Aviso de Bajas · Plazo 48 horas',
            body: 'Se avisa en el grupo de WhatsApp a los suplentes de que va a haber una o varias bajas. Se contactará de forma individual con quien corresponda según la lista de suplentes, disponiendo de 48 horas para abonar los 10,00 €.',
          },
          {
            id: 'escrutinio-premio',
            tag: 'Post-Sorteo',
            title: `🏆 Escrutinio Oficial · Jornada ${settings.currentJornada}`,
            body: `Resultados oficiales SELAE comprobados. Bolsa Común acumulada: ${settings.prizeFundBalance.toFixed(2)} €. Consulta los aciertos en tu panel de socio.`,
          },
          {
            id: 'salto-nivel',
            tag: 'Ampliación Múltiple',
            title: '🚀 Aviso de Ampliación de Bloque Múltiple',
            body: 'La lista de espera ha alcanzado el cupo exacto para subir al siguiente bloque de apuesta múltiple. Revisa el apartado «Socios» para conocer las nuevas altas aprobadas.',
          },
          {
            id: 'bote-especial',
            tag: 'Sorteo Extra',
            title: '💰 ¡Bote Especial en La Primitiva!',
            body: 'Esta semana jugamos un bote extraordinario de La Primitiva. Comprueba tu participación activa y el resguardo sellado en la WebApp.',
          },
          {
            id: 'comunicado-libre',
            tag: 'Aviso General',
            title: '📢 Comunicado Oficial · Peña Tordueles',
            body: 'Aviso importante de la administración: entra en la WebApp para consultar la última actualización de la peña.',
          },
        ];

        const recordSentAlert = (channel: string) => {
          const entry = {
            id: `alert-${Date.now()}`,
            title: pushTitle.trim(),
            body: pushBody.trim(),
            channel,
            date: new Date().toLocaleString('es-ES'),
          };
          const next = [entry, ...sentAlertsLog].slice(0, 10);
          setSentAlertsLog(next);
          try {
            localStorage.setItem('primitiva_tordueles_sent_alerts', JSON.stringify(next));
          } catch {
            // ignorar
          }
        };

        const handleEnablePushHere = async () => {
          const perm = await pushNotificationService.requestPermission();
          setPushPermission(perm);
          if (perm === 'granted') {
            setPushSendFeedback('Notificaciones Push activadas en este dispositivo.');
          } else {
            setPushSendFeedback('Permiso de notificaciones denegado o bloqueado en este navegador.');
          }
          setTimeout(() => setPushSendFeedback(null), 4000);
        };

        const handleSendPushOnly = async () => {
          if (!pushTitle.trim() || !pushBody.trim()) return;
          let perm = pushNotificationService.getPermission();
          if (perm === 'default') {
            perm = await pushNotificationService.requestPermission();
            setPushPermission(perm);
          }
          const ok = pushNotificationService.sendCustomAlert(pushTitle.trim(), pushBody.trim());
          if (ok) {
            recordSentAlert('Push Web / PWA');
            setPushSendFeedback('¡Notificación Push enviada al dispositivo suscrito!');
          } else {
            setPushSendFeedback('No se pudo emitir la notificación Push local (revisa los permisos del navegador).');
          }
          setTimeout(() => setPushSendFeedback(null), 5000);
        };

        const handleSendWhatsAppOnly = async () => {
          if (!pushTitle.trim() || !pushBody.trim()) return;
          setPushSendFeedback('Enviando aviso al grupo de WhatsApp...');
          const formatted = `*${pushTitle.trim()}*\n\n${pushBody.trim()}\n\n🍀 _Peña Primitiva Tordueles_`;
          const res = await whatsappService.sendTextMessage(formatted, {
            instanceId: settings.greenApiInstanceId,
            token: settings.greenApiToken,
            chatId: settings.greenApiChatId,
          });
          if (res.success) {
            recordSentAlert('WhatsApp Grupo');
            setPushSendFeedback('¡Aviso enviado al grupo de WhatsApp con éxito!');
          } else {
            setPushSendFeedback(`Error al enviar por WhatsApp: ${res.error}`);
          }
          setTimeout(() => setPushSendFeedback(null), 5000);
        };

        const handleSendPushAndWhatsApp = async () => {
          if (!pushTitle.trim() || !pushBody.trim()) return;
          let perm = pushNotificationService.getPermission();
          if (perm === 'default') {
            perm = await pushNotificationService.requestPermission();
            setPushPermission(perm);
          }
          const pushOk = pushNotificationService.sendCustomAlert(pushTitle.trim(), pushBody.trim());
          const formatted = `*${pushTitle.trim()}*\n\n${pushBody.trim()}\n\n🍀 _Peña Primitiva Tordueles_`;
          const waRes = await whatsappService.sendTextMessage(formatted, {
            instanceId: settings.greenApiInstanceId,
            token: settings.greenApiToken,
            chatId: settings.greenApiChatId,
          });

          recordSentAlert(pushOk && waRes.success ? 'Push + WhatsApp' : waRes.success ? 'WhatsApp' : 'Push');
          if (pushOk && waRes.success) {
            setPushSendFeedback('¡Enviado por Notificación Push y WhatsApp simultáneamente!');
          } else if (waRes.success) {
            setPushSendFeedback('Enviado al grupo de WhatsApp (Push local no autorizado en este navegador).');
          } else if (pushOk) {
            setPushSendFeedback(`Push enviada; error en WhatsApp: ${waRes.error}`);
          } else {
            setPushSendFeedback('No se pudo completar el envío. Revisa permisos Push y credenciales Green API.');
          }
          setTimeout(() => setPushSendFeedback(null), 6000);
        };

        return (
          <div className="space-y-6">
            <div className="rounded-3xl bg-white border border-slate-200 p-5 sm:p-7 shadow-xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="font-extrabold text-xl text-[#0A2540] flex items-center gap-2.5">
                    <Megaphone className="w-6 h-6 text-[#FF6B00]" />
                    Mensajes Preprogramados (Push PWA &amp; WhatsApp)
                  </h2>
                  <p className="text-base text-slate-600 mt-1">
                    Elige una plantilla oficial, personaliza el texto si lo necesitas y lánzala con un toque.
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`px-3 py-1.5 rounded-xl text-sm font-bold ${
                      pushPermission === 'granted'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-amber-50 text-amber-800 border border-amber-200'
                    }`}
                  >
                    Push: {pushPermission === 'granted' ? 'Activas' : pushPermission === 'denied' ? 'Bloqueadas' : 'Pendientes'}
                  </span>
                  {pushPermission !== 'granted' && (
                    <button
                      type="button"
                      onClick={handleEnablePushHere}
                      className="px-3.5 min-h-[40px] rounded-xl bg-[#0A2540] text-white text-sm font-bold cursor-pointer"
                    >
                      Activar
                    </button>
                  )}
                </div>
              </div>

              {/* Plantillas Preprogramadas */}
              <div>
                <span className="text-sm font-extrabold uppercase tracking-wider text-slate-500 block mb-3">
                  Plantillas rápidas listas para usar
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {PRESET_PUSH_TEMPLATES.map(tpl => (
                    <button
                      key={tpl.id}
                      type="button"
                      onClick={() => {
                        setPushTitle(tpl.title);
                        setPushBody(tpl.body);
                      }}
                      className="text-left rounded-2xl border border-slate-200 bg-[#F4F6F9] hover:bg-white hover:border-[#FF6B00] p-3.5 transition cursor-pointer flex flex-col justify-between gap-2"
                    >
                      <span className="text-xs font-extrabold uppercase tracking-wider text-[#FF6B00]">
                        {tpl.tag}
                      </span>
                      <span className="text-sm font-extrabold text-[#0A2540] leading-snug">
                        {tpl.title}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Editor y Envío */}
              <div className="rounded-2xl border border-slate-200 bg-[#F4F6F9] p-4 sm:p-5 space-y-4">
                <div>
                  <label className="block text-sm font-bold text-[#0A2540] mb-1.5">
                    Título de la Notificación Push / Encabezado
                  </label>
                  <input
                    type="text"
                    value={pushTitle}
                    onChange={e => setPushTitle(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 min-h-[46px] text-base font-bold text-[#0A2540]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-[#0A2540] mb-1.5">
                    Mensaje para los Jugadores
                  </label>
                  <textarea
                    rows={3}
                    value={pushBody}
                    onChange={e => setPushBody(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white p-3.5 text-base text-slate-800 leading-relaxed"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <button
                    type="button"
                    onClick={handleSendPushOnly}
                    className="inline-flex items-center justify-center gap-2 px-4 min-h-[48px] rounded-xl bg-[#0A2540] hover:bg-[#13375B] text-white font-bold text-base cursor-pointer"
                  >
                    <BellRing className="w-5 h-5 text-[#FF6B00]" />
                    <span>Enviar Push</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSendWhatsAppOnly}
                    className="inline-flex items-center justify-center gap-2 px-4 min-h-[48px] rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-base cursor-pointer"
                  >
                    <Send className="w-5 h-5" />
                    <span>Enviar WhatsApp</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSendPushAndWhatsApp}
                    className="inline-flex items-center justify-center gap-2 px-5 min-h-[48px] rounded-xl bg-[#FF6B00] hover:bg-[#E55E00] text-white font-bold text-base shadow-xs cursor-pointer"
                  >
                    <Megaphone className="w-5 h-5" />
                    <span>Enviar Push + WhatsApp</span>
                  </button>
                </div>

                {pushSendFeedback && (
                  <div className="p-3.5 rounded-xl bg-white border border-slate-200 text-base font-bold text-[#0A2540]">
                    {pushSendFeedback}
                  </div>
                )}

                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  <strong>Nota técnica:</strong> las notificaciones Push nativas del navegador se muestran en los dispositivos con sesión abierta o PWA activa; el envío simultáneo por WhatsApp (Green API) garantiza que el aviso llegue al instante al 100 % del grupo aunque tengan la app cerrada.
                </p>
              </div>
            </div>

            {sentAlertsLog.length > 0 && (
              <div className="rounded-3xl bg-white border border-slate-200 p-5 sm:p-6 shadow-xs space-y-3">
                <h3 className="font-extrabold text-lg text-[#0A2540]">
                  Últimos avisos enviados
                </h3>
                <div className="divide-y divide-slate-100">
                  {sentAlertsLog.map(item => (
                    <div key={item.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="font-bold text-[#0A2540] text-base">{item.title}</div>
                        <div className="text-sm text-slate-600">{item.body}</div>
                      </div>
                      <div className="text-left sm:text-right shrink-0">
                        <span className="text-xs font-extrabold uppercase text-[#FF6B00] block">
                          {item.channel}
                        </span>
                        <span className="text-xs text-slate-500 tabular-nums">{item.date}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })()}

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

      {/* SECTION 4: ESCRUTINIO DEL CICLO AUTOMÁTICO Y SCRUTINY */}
      {activeSection === 'SCRUTINY' && (
        <div className="space-y-6">
          {/* Bloque Visual: Escrutinio del Ciclo (Auto-poblado desde Apps Script + Guardar Premio manual) */}
          <div className="rounded-3xl bg-white border-2 border-[#FF6B00]/30 p-5 sm:p-7 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="font-extrabold text-xl sm:text-2xl text-[#0A2540] flex items-center gap-2.5">
                  <Trophy className="w-6 h-6 text-[#FF6B00]" />
                  Escrutinio del Ciclo
                </h2>
                <p className="text-sm sm:text-base text-slate-600 mt-1">
                  {cycleScrutiny
                    ? `${cycleScrutiny.nombreSorteo || 'La Primitiva'} · Fecha: ${cycleScrutiny.fechaSorteo || '-'} · Ciclo ${cycleScrutiny.ciclo || settings.currentCycle} (Jornada ${cycleScrutiny.jornada || settings.currentJornada})`
                    : 'Cruce automático entre la apuesta activa de la peña y la combinación oficial por consenso.'}
                </p>
              </div>
              <button
                type="button"
                onClick={fetchCycleScrutiny}
                disabled={isLoadingCycleScrutiny}
                className="inline-flex items-center justify-center gap-2 px-4 min-h-[44px] rounded-xl bg-[#0A2540] hover:bg-[#13375B] disabled:opacity-60 text-white text-sm font-bold cursor-pointer shrink-0"
              >
                {isLoadingCycleScrutiny && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>{isLoadingCycleScrutiny ? 'Consultando...' : 'Actualizar Escrutinio'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-2xl bg-[#F4F6F9] border border-slate-200 p-4 space-y-2.5">
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500 block">
                  Combinación Ganadora del Día
                </span>
                {cycleScrutiny?.consensoDisponible && cycleScrutiny.combinacionGanadora?.length === 6 ? (
                  <>
                    <div className="flex flex-wrap gap-2">
                      {cycleScrutiny.combinacionGanadora.map((n, idx) => (
                        <span
                          key={`win-${n}-${idx}`}
                          className="w-10 h-10 rounded-full bg-[#0A2540] border-2 border-[#FF6B00] text-white font-mono font-extrabold text-base flex items-center justify-center tabular-nums"
                        >
                          {n < 10 ? `0${n}` : n}
                        </span>
                      ))}
                    </div>
                    <p className="text-sm text-slate-600 font-semibold">
                      Comp: {cycleScrutiny.complementario ?? '-'} · Reintegro: {cycleScrutiny.reintegroGanador ?? '-'}
                      {cycleScrutiny.fuentesConsenso?.length ? ` (${cycleScrutiny.fuentesConsenso.join(' + ')})` : ''}
                    </p>
                  </>
                ) : (
                  <p className="text-sm sm:text-base font-semibold text-slate-600 py-2">
                    {cycleScrutiny?.mensajeConsenso || 'Pendiente de combinación ganadora oficial por consenso.'}
                  </p>
                )}
              </div>

              <div className="rounded-2xl bg-[#F4F6F9] border border-slate-200 p-4 space-y-2.5">
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500 block">
                  Apuesta Activa de la Peña
                </span>
                {cycleScrutiny?.detalleBoletos && cycleScrutiny.detalleBoletos.length > 1 ? (
                  <div className="space-y-2.5">
                    {cycleScrutiny.detalleBoletos.map(det => (
                      <div
                        key={`det-${det.indice}`}
                        className="rounded-xl bg-white border border-slate-200 p-2.5 space-y-1.5"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-extrabold text-[#0A2540]">
                          <span>
                            Resguardo #{det.indice}
                            {det.modalidad ? ` — ${det.modalidad}` : ''}
                          </span>
                          <span className="text-emerald-700">{det.textoAciertos || `${det.cantidadAciertos} aciertos`}</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {(det.apuestaPena || []).map((n, nIdx) => {
                            const isHit = det.aciertosNumeros?.includes(n);
                            return (
                              <span
                                key={`det-${det.indice}-${n}-${nIdx}`}
                                className={`w-8 h-8 rounded-full border font-mono font-extrabold text-xs flex items-center justify-center tabular-nums ${
                                  isHit
                                    ? 'bg-emerald-700 border-emerald-400 text-white'
                                    : 'bg-slate-50 border-slate-300 text-[#0A2540]'
                                }`}
                              >
                                {n < 10 ? `0${n}` : n}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : cycleScrutiny?.apuestaPena && cycleScrutiny.apuestaPena.length > 0 ? (
                  <>
                    <div className="flex flex-wrap gap-2">
                      {cycleScrutiny.apuestaPena.map((n, idx) => {
                        const isHit = cycleScrutiny.aciertosNumeros?.includes(n);
                        return (
                          <span
                            key={`pena-${n}-${idx}`}
                            className={`w-10 h-10 rounded-full border-2 font-mono font-extrabold text-base flex items-center justify-center tabular-nums ${
                              isHit
                                ? 'bg-emerald-700 border-emerald-400 text-white'
                                : 'bg-white border-slate-300 text-[#0A2540]'
                            }`}
                          >
                            {n < 10 ? `0${n}` : n}
                          </span>
                        );
                      })}
                    </div>
                    <p className="text-sm text-slate-600 font-semibold">
                      Reintegro jugado: {cycleScrutiny.reintegroJugado ?? 'N/A'} · Origen: {cycleScrutiny.origenApuesta || 'Sheets'}
                    </p>
                  </>
                ) : (
                  <p className="text-sm sm:text-base text-slate-600 py-2">
                    No hay apuesta activa cargada en «Apuestas Activas» ni «Sorteos».
                  </p>
                )}
              </div>
            </div>

            <div className="rounded-2xl bg-blue-50 border border-blue-200 px-4 py-3.5 flex flex-wrap items-center justify-between gap-2">
              <span className="text-base sm:text-lg font-extrabold text-[#0A2540]">
                {cycleScrutiny?.textoAciertos || 'Calculando aciertos del ciclo...'}
              </span>
              {cycleScrutiny?.premioGuardado !== null && cycleScrutiny?.premioGuardado !== undefined && (
                <span className="text-sm font-extrabold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-lg tabular-nums">
                  Premio en BD: {Number(cycleScrutiny.premioGuardado).toFixed(2)} €
                </span>
              )}
            </div>

            <div className="pt-2 border-t border-slate-200 flex flex-col sm:flex-row sm:items-end gap-3">
              <div className="flex-1">
                <label className="font-bold text-[#0A2540] block mb-1.5 text-sm sm:text-base">
                  Importe Oficial del Premio (€):
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={manualPrizeInput}
                  onChange={e => {
                    setManualPrizeInput(e.target.value);
                    setManualPrizeFeedback(null);
                  }}
                  placeholder="0.00"
                  className="w-full rounded-xl border border-slate-300 px-3.5 min-h-[48px] font-mono text-lg font-bold text-[#0A2540] tabular-nums"
                />
              </div>
              <button
                type="button"
                disabled={isSavingManualPrize}
                onClick={async () => {
                  const raw = manualPrizeInput.trim();
                  if (!raw) {
                    setManualPrizeFeedback('Introduce el importe oficial del premio en euros.');
                    return;
                  }
                  const cantidad = parseFloat(raw.replace(',', '.'));
                  if (isNaN(cantidad) || cantidad < 0) {
                    setManualPrizeFeedback('Introduce un importe numérico válido (>= 0).');
                    return;
                  }
                  setIsSavingManualPrize(true);
                  setManualPrizeFeedback(null);

                  const endpoint = getCleanGasUrl();
                  let backendBolsa: number | null = null;
                  let syncedBackend = false;

                  if (endpoint && adminPassword) {
                    try {
                      const res = await fetch(endpoint, {
                        method: 'POST',
                        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                        body: JSON.stringify({
                          action: 'guardarPremioManual',
                          password: adminPassword,
                          cantidad,
                          datos: cycleScrutiny,
                        }),
                      });
                      const data = await res.json();
                      if (data && data.success) {
                        syncedBackend = true;
                        if (typeof data.bolsaPremios === 'number' && !isNaN(data.bolsaPremios)) {
                          backendBolsa = data.bolsaPremios;
                        }
                      }
                    } catch {
                      // Fallback al estado local
                    }
                  }

                  onUpdateSettings({
                    ...settings,
                    prizeFundBalance:
                      backendBolsa !== null
                        ? backendBolsa
                        : settings.prizeFundBalance + cantidad,
                  });

                  if (cantidad > 0) {
                    const entryId = `manual-prize-${cycleScrutiny?.fechaSorteo || Date.now()}`;
                    const entry: PrizeHistoryEntry = {
                      id: entryId,
                      ticketId: `cycle-${cycleScrutiny?.ciclo || settings.currentCycle}-j${cycleScrutiny?.jornada || settings.currentJornada}`,
                      cycleNumber: cycleScrutiny?.ciclo || settings.currentCycle,
                      jornadaNumber: cycleScrutiny?.jornada || settings.currentJornada,
                      drawDate: cycleScrutiny?.fechaSorteo || new Date().toISOString().slice(0, 10),
                      hitsCount: cycleScrutiny?.cantidadAciertos ?? 0,
                      hasReintegro: Boolean(cycleScrutiny?.reintegroAcertado),
                      prizeCategory: cycleScrutiny?.textoAciertos || 'Premio Oficial SELAE',
                      prizeAmount: cantidad,
                      prizeType: cantidad > 2000 ? 'MAYOR_BANCO' : 'MENOR_BOLSA',
                    };
                    onUpdatePrizeHistory([entry, ...prizeHistory.filter(p => p.id !== entryId)]);
                  }

                  if (cycleScrutiny) {
                    const updatedTickets = tickets.map(t => {
                      const matchesDraw =
                        (cycleScrutiny.fechaSorteo && t.drawDate === cycleScrutiny.fechaSorteo) ||
                        (cycleScrutiny.jornada && t.jornadaNumber === cycleScrutiny.jornada);
                      if (!matchesDraw) return t;
                      return {
                        ...t,
                        winningNumbers:
                          cycleScrutiny.combinacionGanadora && cycleScrutiny.combinacionGanadora.length === 6
                            ? cycleScrutiny.combinacionGanadora
                            : t.winningNumbers,
                        complementario: cycleScrutiny.complementario ?? t.complementario,
                        reintegro: cycleScrutiny.reintegroGanador ?? t.reintegro,
                        hitsCount:
                          typeof cycleScrutiny.cantidadAciertos === 'number'
                            ? cycleScrutiny.cantidadAciertos
                            : t.hitsCount,
                        hasReintegro:
                          typeof cycleScrutiny.reintegroAcertado === 'boolean'
                            ? cycleScrutiny.reintegroAcertado
                            : t.hasReintegro,
                        prizeCategory: cycleScrutiny.textoAciertos || t.prizeCategory,
                        totalPrize: cantidad,
                        prizeType:
                          cantidad > 2000
                            ? ('MAYOR_BANCO' as const)
                            : cantidad > 0
                            ? ('MENOR_BOLSA' as const)
                            : ('NINGUNO' as const),
                      };
                    });
                    onUpdateTickets(capTicketsKeepingPlayed(updatedTickets));
                  }

                  setIsSavingManualPrize(false);
                  setManualPrizeInput('');
                  setManualPrizeFeedback(
                    syncedBackend
                      ? `¡Premio de ${cantidad.toFixed(2)} € guardado en Google Sheets y acreditado!`
                      : `Premio de ${cantidad.toFixed(2)} € registrado localmente.`
                  );
                }}
                className="px-6 min-h-[48px] rounded-xl bg-[#FF6B00] hover:bg-[#E55E00] disabled:opacity-60 text-white font-bold text-base shadow-xs transition cursor-pointer inline-flex items-center justify-center gap-2 shrink-0"
              >
                {isSavingManualPrize && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>Guardar Premio</span>
              </button>
            </div>

            {manualPrizeFeedback && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-sm sm:text-base font-bold text-emerald-950">
                {manualPrizeFeedback}
              </div>
            )}
          </div>

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

          {(() => {
            const refTicket =
              tickets.find(t => !t.isScrutinized && isTicketPublishedNow(t)) ||
              tickets.find(t => t.isScrutinized && (!t.winningNumbers || t.winningNumbers.length === 0)) ||
              tickets.find(t => !t.isScrutinized) ||
              tickets[0];
            if (!refTicket) return null;

            const refKey = getTicketJornadaKey(refTicket);
            const targetJornadaTickets = tickets.filter(t => {
              if (getTicketJornadaKey(t) !== refKey) return false;
              if (!refTicket.isScrutinized) return !t.isScrutinized;
              return !t.winningNumbers || t.winningNumbers.length === 0;
            });
            const listToCheck =
              targetJornadaTickets.length > 0 ? targetJornadaTickets : [refTicket];
            const winNums = scrutinyWinning
              .split(/[,;\s-]+/)
              .map(s => parseInt(s.trim(), 10))
              .filter(n => !isNaN(n));
            const liveSummary =
              winNums.length === 6
                ? calculateMultiTicketScrutiny(
                    listToCheck,
                    winNums,
                    scrutinyComp,
                    scrutinyReintegro,
                    refTicket.activePlayersCount || 44
                  )
                : null;

            return (
              <div className="rounded-2xl bg-[#F4F6F9] border border-slate-200 p-4 space-y-3 text-base">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-bold text-[#0A2540]">
                    Comprobación en vivo (Jornada {refTicket.jornadaNumber} · {listToCheck.length}{' '}
                    {listToCheck.length === 1 ? 'resguardo' : 'resguardos'}):
                  </span>
                  {liveSummary && (
                    <span className="px-3 py-1 rounded-xl bg-[#0A2540] text-white text-xs sm:text-sm font-extrabold tabular-nums">
                      Total sumado: {liveSummary.totalHits} aciertos · {liveSummary.totalPrizeAmount.toFixed(2)} €
                    </span>
                  )}
                </div>

                <div className="space-y-2.5">
                  {listToCheck.map((tk, idx) => {
                    const hits = tk.playedNumbers.filter(n => winNums.includes(n));
                    const reintegroMatch = scrutinyReintegro === tk.playedReintegro;
                    const itemResult = liveSummary?.items[idx]?.result;
                    return (
                      <div
                        key={tk.id}
                        className="rounded-xl bg-white border border-slate-200 p-3 space-y-1.5"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                          <span className="font-extrabold text-[#0A2540]">
                            Resguardo #{idx + 1}
                            {tk.modalityLabel ? ` — ${tk.modalityLabel}` : ''} ({tk.cost.toFixed(2)} €)
                          </span>
                          <span className="font-mono text-slate-600 font-semibold tabular-nums">
                            [{tk.playedNumbers.join(', ')}] · R: {tk.playedReintegro}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-slate-700 text-sm font-medium">Aciertos:</span>
                            {hits.length > 0 ? (
                              hits.map((h, hIdx) => (
                                <span
                                  key={`hit-${tk.id}-${h}-${hIdx}`}
                                  className="px-2.5 py-0.5 rounded-lg bg-emerald-600 text-white font-mono font-bold text-xs sm:text-sm"
                                >
                                  {h}
                                </span>
                              ))
                            ) : (
                              <span className="text-slate-600 text-sm font-semibold">
                                0 aciertos en combinación
                              </span>
                            )}
                            {reintegroMatch && (
                              <span className="px-2.5 py-0.5 rounded-lg bg-[#0A2540] text-white font-bold text-xs sm:text-sm">
                                Reintegro Acertado ({scrutinyReintegro})
                              </span>
                            )}
                          </div>
                          {itemResult && (
                            <span className="text-xs sm:text-sm font-extrabold text-emerald-800 tabular-nums">
                              Premio boleto: {itemResult.prizeAmount.toFixed(2)} €
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          <div className="pt-2 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
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

            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm sm:text-base font-bold text-[#0A2540] tabular-nums">
                Bolsa actual: {settings.prizeFundBalance.toFixed(2)} €
              </span>
              {!confirmResetFund ? (
                <button
                  type="button"
                  onClick={() => setConfirmResetFund(true)}
                  disabled={settings.prizeFundBalance === 0}
                  className="inline-flex items-center gap-1.5 px-4 min-h-[44px] rounded-xl border border-rose-300 bg-rose-50 hover:bg-rose-100 disabled:opacity-45 text-rose-800 font-bold text-sm transition cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Resetear Bolsa</span>
                </button>
              ) : (
                <div className="inline-flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setConfirmResetFund(false)}
                    className="px-3 min-h-[40px] rounded-xl border border-slate-300 bg-white text-slate-700 font-bold text-xs cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleResetPrizeFund}
                    className="px-3 min-h-[40px] rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs cursor-pointer"
                  >
                    Confirmar 0,00 €
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        </div>
      )}

      {/* SECTION 5: MULTIPLE BETS GUIDE */}
      {activeSection === 'MULTIPLE_BETS' && (
        <div className="space-y-4">
          <MultipleBetsGuide />
        </div>
      )}

      {/* Modal de Configuración de Datos para PDF */}
      {showPdfExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 sm:p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-lg rounded-3xl bg-white shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-[#0A2540] px-5 py-4 text-white flex items-center justify-between shrink-0">
              <div>
                <h3 className="font-serif font-black text-xl text-white">
                  Configurar Datos del Listado en PDF
                </h3>
                <p className="text-sm text-slate-300 font-medium">
                  {pdfExportListType === 'TITULAR'
                    ? 'Exportar Socios Titulares'
                    : pdfExportListType === 'SUPLENTE'
                    ? 'Exportar Lista de Espera / Suplentes'
                    : pdfExportListType === 'BAJA'
                    ? 'Exportar Bajas Definitivas'
                    : 'Exportar Listado General Completo'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowPdfExportModal(false)}
                className="rounded-xl p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/10 cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4">
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                Selecciona qué campos deseas que aparezcan en el PDF. El teléfono y el IBAN son datos privados que no tienen por qué saber los demás usuarios, por lo que vienen desmarcados por defecto, pero todos los campos son completamente editables.
              </p>

              <div className="space-y-3 rounded-2xl bg-[#F4F6F9] border border-slate-200 p-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(pdfExportOptions.includeMemberNumber)}
                    onChange={e =>
                      setPdfExportOptions(prev => ({ ...prev, includeMemberNumber: e.target.checked }))
                    }
                    className="w-5 h-5 rounded text-[#FF6B00] focus:ring-[#FF6B00]"
                  />
                  <span className="text-sm sm:text-base font-bold text-[#0A2540]">
                    Número de socio (N.º)
                  </span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(pdfExportOptions.includeName)}
                    onChange={e =>
                      setPdfExportOptions(prev => ({ ...prev, includeName: e.target.checked }))
                    }
                    className="w-5 h-5 rounded text-[#FF6B00] focus:ring-[#FF6B00]"
                  />
                  <span className="text-sm sm:text-base font-bold text-[#0A2540]">
                    Nombre y Apellidos
                  </span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(pdfExportOptions.includeDni)}
                    onChange={e =>
                      setPdfExportOptions(prev => ({ ...prev, includeDni: e.target.checked }))
                    }
                    className="w-5 h-5 rounded text-[#FF6B00] focus:ring-[#FF6B00]"
                  />
                  <span className="text-sm sm:text-base font-bold text-[#0A2540]">
                    DNI / NIF
                  </span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(pdfExportOptions.includePhone)}
                    onChange={e =>
                      setPdfExportOptions(prev => ({ ...prev, includePhone: e.target.checked }))
                    }
                    className="w-5 h-5 rounded text-[#FF6B00] focus:ring-[#FF6B00]"
                  />
                  <div className="flex flex-col">
                    <span className="text-sm sm:text-base font-bold text-[#0A2540]">
                      Teléfono de contacto
                    </span>
                    <span className="text-xs font-semibold text-rose-700">
                      (Dato privado — desmarcado por defecto)
                    </span>
                  </div>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(pdfExportOptions.includeIban)}
                    onChange={e =>
                      setPdfExportOptions(prev => ({ ...prev, includeIban: e.target.checked }))
                    }
                    className="w-5 h-5 rounded text-[#FF6B00] focus:ring-[#FF6B00]"
                  />
                  <div className="flex flex-col">
                    <span className="text-sm sm:text-base font-bold text-[#0A2540]">
                      IBAN bancario
                    </span>
                    <span className="text-xs font-semibold text-rose-700">
                      (Dato privado — desmarcado por defecto)
                    </span>
                  </div>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(pdfExportOptions.includeEmail)}
                    onChange={e =>
                      setPdfExportOptions(prev => ({ ...prev, includeEmail: e.target.checked }))
                    }
                    className="w-5 h-5 rounded text-[#FF6B00] focus:ring-[#FF6B00]"
                  />
                  <span className="text-sm sm:text-base font-bold text-[#0A2540]">
                    Correo electrónico (Email)
                  </span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(pdfExportOptions.includeStatus)}
                    onChange={e =>
                      setPdfExportOptions(prev => ({ ...prev, includeStatus: e.target.checked }))
                    }
                    className="w-5 h-5 rounded text-[#FF6B00] focus:ring-[#FF6B00]"
                  />
                  <span className="text-sm sm:text-base font-bold text-[#0A2540]">
                    Categoría (Titular / Suplente / Baja)
                  </span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(pdfExportOptions.includePaymentStatus)}
                    onChange={e =>
                      setPdfExportOptions(prev => ({ ...prev, includePaymentStatus: e.target.checked }))
                    }
                    className="w-5 h-5 rounded text-[#FF6B00] focus:ring-[#FF6B00]"
                  />
                  <span className="text-sm sm:text-base font-bold text-[#0A2540]">
                    Estado de pago / Cuota
                  </span>
                </label>
              </div>
            </div>

            <div className="bg-slate-50 px-5 py-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setShowPdfExportModal(false)}
                className="px-5 min-h-[46px] rounded-xl border border-slate-300 bg-white text-slate-700 font-bold text-sm sm:text-base cursor-pointer hover:bg-slate-100 transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  downloadPlayerListPdf(pdfExportListType, players, settings.currentCycle, pdfExportOptions);
                  setShowPdfExportModal(false);
                }}
                className="inline-flex items-center gap-2 px-6 min-h-[46px] rounded-xl bg-[#FF6B00] hover:bg-[#E55E00] text-white font-extrabold text-sm sm:text-base shadow-sm transition cursor-pointer"
              >
                <FileDown className="w-5 h-5" />
                <span>Descargar PDF Configurado</span>
              </button>
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
