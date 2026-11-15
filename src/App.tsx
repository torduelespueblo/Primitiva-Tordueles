/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  SyndicateSettings,
  Player,
  WaitingListEntry,
  TicketDraw,
  PrizeHistoryEntry
} from './types/lottery';
import {
  archivePreviousPendingTicketsForNewSchedule,
  capTicketsKeepingPlayed,
  storageService
} from './services/storage';
import { MultipleBetType } from './types/lottery';
import { Navbar } from './components/Navbar';
import { UserDashboard } from './components/UserDashboard';
import { TicketsHistory } from './components/TicketsHistory';
import { MembersAndWaitlist } from './components/MembersAndWaitlist';
import { OfficialRules } from './components/OfficialRules';
import { AdminPanel } from './components/AdminPanel';
import { AdminLoginModal } from './components/AdminLoginModal';
import { ConformityModal } from './components/ConformityModal';
import { PostConformityModal } from './components/PostConformityModal';
import { OfflineIndicator } from './components/OfflineIndicator';
import { Footer } from './components/Footer';
import { DualAccessRegistration } from './components/DualAccessRegistration';
import {
  pushNotificationService,
  solicitarPermisoYRegistrarToken
} from './services/pushNotifications';
import {
  isTicketPublishedNow,
  normalizeReceiptImageUrl
} from './services/ticketPublishService';
import { reportPWAInstallOrVisit } from './services/installTrackingService';
import { MemberAccessResponse, PublicListRow } from './services/registrationService';

function hasRegistrationUrlFlag(): boolean {
  if (typeof window === 'undefined') return false;
  const params = new URLSearchParams(window.location.search);
  return (
    params.get('inscripcion') === '1' ||
    params.get('registro') === '1' ||
    window.location.hash.toLowerCase().includes('inscripcion')
  );
}

export default function App() {
  const [settings, setSettings] = useState<SyndicateSettings>(() => storageService.getSettings());
  const [players, setPlayers] = useState<Player[]>(() => storageService.getPlayers());
  const [waitingList, setWaitingList] = useState<WaitingListEntry[]>(() => storageService.getWaitingList());
  const [tickets, setTickets] = useState<TicketDraw[]>(() => storageService.getTickets());
  const [prizeHistory, setPrizeHistory] = useState<PrizeHistoryEntry[]>(() => storageService.getPrizeHistory());
  const [isConformityAccepted, setIsConformityAccepted] = useState<boolean>(() => storageService.isConformityAccepted());

  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [playerDni, setPlayerDni] = useState<string>(() => {
    try {
      return localStorage.getItem('primitiva_tordueles_player_dni') || '';
    } catch {
      return '';
    }
  });
  const [memberIdentifier, setMemberIdentifier] = useState<string>(() => {
    try {
      return (
        localStorage.getItem('primitiva_tordueles_member_id') ||
        localStorage.getItem('primitiva_tordueles_player_dni') ||
        ''
      );
    } catch {
      return '';
    }
  });
  const [memberRole, setMemberRole] = useState<'TITULAR' | 'SUPLENTE' | ''>(() => {
    try {
      const savedRole = localStorage.getItem('primitiva_tordueles_member_role');
      if (savedRole === 'TITULAR' || savedRole === 'SUPLENTE') return savedRole;
      if (localStorage.getItem('primitiva_tordueles_player_dni')) return 'TITULAR';
      if (localStorage.getItem('primitiva_tordueles_visitor_registered') === 'true') return 'SUPLENTE';
      return '';
    } catch {
      return '';
    }
  });
  const [memberName, setMemberName] = useState<string>(() => {
    try {
      return localStorage.getItem('primitiva_tordueles_member_name') || '';
    } catch {
      return '';
    }
  });
  const [hasRegisteredOnDevice, setHasRegisteredOnDevice] = useState<boolean>(() => {
    try {
      return localStorage.getItem('primitiva_tordueles_visitor_registered') === 'true';
    } catch {
      return false;
    }
  });
  const [counts, setCounts] = useState<{ titulares?: number; suplentes?: number }>({});
  const [ticketSummary, setTicketSummary] = useState<{
    hayBoleto: boolean;
    programado: boolean;
    jornada?: number;
    fecha?: string;
    fechaHoraPublicacion?: string;
  }>();
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(false);
  const [adminPassword, setAdminPassword] = useState<string>('');
  const [showAdminLogin, setShowAdminLogin] = useState<boolean>(false);
  const [showConformityReview, setShowConformityReview] = useState<boolean>(false);
  const [showPostConformityPrompt, setShowPostConformityPrompt] = useState<boolean>(false);
  const [registrationInitialMode, setRegistrationInitialMode] = useState<'ACCESS' | 'REGISTER'>('REGISTER');
  const [showStandaloneRegistration, setShowStandaloneRegistration] = useState<boolean>(() =>
    hasRegistrationUrlFlag()
  );

  const effectiveAccessLevel: 'VISITOR' | 'SUPLENTE' | 'TITULAR' =
    isAdminAuthenticated || memberRole === 'TITULAR'
      ? 'TITULAR'
      : memberRole === 'SUPLENTE' || hasRegisteredOnDevice
      ? 'SUPLENTE'
      : 'VISITOR';

  // Guardar en almacenamiento cada vez que cambien
  const handleUpdateSettings = (newSettings: SyndicateSettings) => {
    setSettings(newSettings);
    storageService.saveSettings(newSettings);
  };

  const handleUpdatePlayers = (newPlayers: Player[]) => {
    setPlayers(newPlayers);
    storageService.savePlayers(newPlayers);
  };

  const handleUpdateWaitingList = (newList: WaitingListEntry[]) => {
    setWaitingList(newList);
    storageService.saveWaitingList(newList);
  };

  const handleUpdateTickets = (newTickets: TicketDraw[]) => {
    const capped = capTicketsKeepingPlayed(newTickets);
    setTickets(capped);
    storageService.saveTickets(capped);
  };

  const handleUpdatePrizeHistory = (newEntries: PrizeHistoryEntry[]) => {
    setPrizeHistory(newEntries);
    storageService.savePrizeHistory(newEntries);
  };

  const handleAcceptConformity = () => {
    const isFirstTimeAcceptance = !isConformityAccepted;
    setIsConformityAccepted(true);
    storageService.setConformityAccepted(true);
    setShowConformityReview(false);

    if (isFirstTimeAcceptance && !showStandaloneRegistration) {
      setShowPostConformityPrompt(true);
    }

    // Solicitar permiso de notificaciones push de inmediato tras el gesto del usuario
    if (pushNotificationService.isSupported()) {
      pushNotificationService.subscribeUserToPush(playerDni, settings.googleAppsScriptUrl).then(result => {
        if (result.token) {
          storageService.savePushToken(result.token);
        }
      });
    }
  };

  const handleCloseStandaloneRegistration = () => {
    setShowStandaloneRegistration(false);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.delete('inscripcion');
      url.searchParams.delete('registro');
      if (url.hash.toLowerCase().includes('inscripcion')) {
        url.hash = '';
      }
      window.history.replaceState({}, '', url.toString());
    }
  };

  const applyPublicListFromServer = (rows: PublicListRow[], cicloNum: number) => {
    const parseTsMs = (rawTs: string, rawMs?: number) => {
      if (typeof rawMs === 'number' && !isNaN(rawMs)) return rawMs;
      const str = String(rawTs || '').trim();
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

    const syncedPlayers: Player[] = [];
    const syncedWaiting: WaitingListEntry[] = [];

    rows.forEach((u, idx) => {
      const firstName = String(u.nombre || '').trim();
      const lastName = String(u.apellidos || '').trim();
      const fullName = `${firstName} ${lastName}`.trim();
      if (!fullName) return;
      const rawEstado = String(u.estado || 'Suplente').trim().toUpperCase();
      const ts = String(u.timestamp || '').trim();
      const tsMs = parseTsMs(ts, typeof u.timestampMs === 'number' ? u.timestampMs : undefined);

      if (rawEstado === 'TITULAR') {
        syncedPlayers.push({
          id: `sheet-u-${idx}-${u.id || idx + 1}`,
          memberNumber: syncedPlayers.length + 1,
          name: fullName,
          firstName,
          lastName,
          email: '',
          phone: '',
          registrationTimestamp: ts,
          timestampMs: tsMs,
          status: 'TITULAR',
          currentCyclePaid: true,
          paidUntilCycle: cicloNum || 1,
          renewalStatus: 'RENOVADO',
        });
      } else if (rawEstado === 'SUPLENTE') {
        syncedWaiting.push({
          id: `sheet-w-${idx}-${u.id || idx + 1}`,
          name: fullName,
          email: '',
          phone: '',
          registrationTimestamp: ts,
          status: 'ESPERANDO',
        });
      }
    });

    syncedWaiting.sort((a, b) => parseTsMs(a.registrationTimestamp) - parseTsMs(b.registrationTimestamp));

    setPlayers(prev => {
      if (prev.some(p => p.sheetRow !== undefined)) return prev;
      storageService.savePlayers(syncedPlayers);
      return syncedPlayers;
    });
    setWaitingList(syncedWaiting);
    storageService.saveWaitingList(syncedWaiting);
    setCounts({ titulares: syncedPlayers.length, suplentes: syncedWaiting.length });
  };

  const inferBetTypeFromCount = (count: number): MultipleBetType =>
    count === 5
      ? 'MULTIPLE_5'
      : count === 7
      ? 'MULTIPLE_7'
      : count === 8
      ? 'MULTIPLE_8'
      : count === 9
      ? 'MULTIPLE_9'
      : count === 10
      ? 'MULTIPLE_10'
      : count === 11
      ? 'MULTIPLE_11'
      : 'COMBINADA';

  const parseNumbersList = (raw: string | undefined): number[] =>
    String(raw || '')
      .split(/[,;\s-]+/)
      .map(s => parseInt(s.trim(), 10))
      .filter(n => !isNaN(n) && n >= 1 && n <= 49);

  const applyServerTicketsState = (params: {
    boletoActivo?: MemberAccessResponse['boletoActivo'];
    boletosActivos?: MemberAccessResponse['boletosActivos'];
    ultimosJugados?: MemberAccessResponse['ultimosJugados'];
    boletoResumen?: {
      hayBoleto: boolean;
      programado: boolean;
      jornada?: number;
      ciclo?: number;
      fecha?: string;
      fechaHoraPublicacion?: string;
    };
  }) => {
    const { boletoActivo, boletosActivos, ultimosJugados, boletoResumen } = params;
    const serverPlayedTickets: TicketDraw[] = Array.isArray(ultimosJugados)
      ? ultimosJugados
          .map((item, idx): TicketDraw | null => {
            const nums = parseNumbersList(item.combinacionJugada);
            if (nums.length === 0) return null;
            const winNums = parseNumbersList(item.combinacionGanadora);
            const prizeAmount = Number(item.cantidadPremiada) || 0;
            const hasHits = typeof item.aciertos === 'number' && !isNaN(item.aciertos);
            return {
              id: item.id || `gas-hist-${item.fecha}-${item.jornada}-${idx + 1}`,
              cycleNumber: Number(item.ciclo) || 1,
              jornadaNumber: Number(item.jornada) || 1,
              drawDate: String(item.fecha || ''),
              receiptImageUrl: '', // Solo datos numéricos, sin imagen
              betType: inferBetTypeFromCount(nums.length),
              modalityLabel: item.modalidad ? String(item.modalidad) : undefined,
              numbersPlayedCount: nums.length,
              cost: Number(item.importeJugado) || 0,
              activePlayersCount: Number(item.jugadoresActivos) || 0,
              costPerPlayer: 1.0,
              playedNumbers: nums,
              playedReintegro: Number(item.reintegro) || 0,
              jokerPlayed: true,
              isScrutinized: true,
              winningNumbers: winNums.length > 0 ? winNums : undefined,
              hitsCount: hasHits ? Number(item.aciertos) : undefined,
              totalPrize: prizeAmount,
              prizeCategory:
                prizeAmount > 0
                  ? 'Premio SELAE'
                  : winNums.length > 0 || hasHits
                  ? 'Sin premio'
                  : 'Jugada finalizada',
              prizeType:
                prizeAmount > 2000
                  ? 'MAYOR_BANCO'
                  : prizeAmount > 0
                  ? 'MENOR_BOLSA'
                  : 'NINGUNO',
              publishStatus: 'PUBLICADO',
            };
          })
          .filter((x): x is TicketDraw => x !== null)
      : [];

    setTickets(prev => {
      let working = [...prev];

      // Integrar los últimos boletos jugados del servidor (agrupando múltiples boletos de una misma jornada por ID o combinación)
      if (serverPlayedTickets.length > 0) {
        const mergedById = new Map<string, TicketDraw>();
        for (const t of working) {
          if (t.isScrutinized) {
            mergedById.set(t.id, { ...t, receiptImageUrl: '' });
          }
        }
        for (const st of serverPlayedTickets) {
          const existingById =
            mergedById.get(st.id) ||
            Array.from(mergedById.values()).find(
              t =>
                t.cycleNumber === st.cycleNumber &&
                t.jornadaNumber === st.jornadaNumber &&
                t.drawDate === st.drawDate &&
                t.playedNumbers.join(',') === st.playedNumbers.join(',')
            );
          if (existingById) {
            mergedById.set(existingById.id, {
              ...st,
              id: existingById.id,
              winningNumbers:
                st.winningNumbers && st.winningNumbers.length > 0
                  ? st.winningNumbers
                  : existingById.winningNumbers,
              complementario: existingById.complementario,
              reintegro: existingById.reintegro,
              hitsCount: st.hitsCount !== undefined ? st.hitsCount : existingById.hitsCount,
              hasReintegro: existingById.hasReintegro,
              totalPrize: st.totalPrize > 0 ? st.totalPrize : existingById.totalPrize,
              prizeCategory:
                existingById.prizeCategory && existingById.prizeCategory !== 'Jugada finalizada'
                  ? existingById.prizeCategory
                  : st.prizeCategory,
              prizeType: st.totalPrize > 0 ? st.prizeType : existingById.prizeType,
              receiptImageUrl: '',
            });
          } else {
            mergedById.set(st.id, st);
          }
        }
        const pendingOnly = working.filter(t => !t.isScrutinized);
        working = [...pendingOnly, ...Array.from(mergedById.values())];
      }

      const activeServerList =
        Array.isArray(boletosActivos) && boletosActivos.length > 0
          ? boletosActivos
          : boletoActivo
          ? [boletoActivo]
          : [];

      // Caso 1: El servidor indica que la nueva jornada está PROGRAMADA para más adelante -> retirar imagen del boleto anterior
      if (activeServerList.length === 0 && boletoResumen?.hayBoleto && boletoResumen?.programado) {
        working = working.map(t => {
          if (t.isScrutinized) return t;
          const isSameScheduled =
            boletoResumen.jornada !== undefined &&
            t.jornadaNumber === Number(boletoResumen.jornada) &&
            (!boletoResumen.fecha || t.drawDate === String(boletoResumen.fecha));
          if (isSameScheduled) return t;
          return {
            ...t,
            isScrutinized: true,
            receiptImageUrl: '',
            prizeCategory: t.prizeCategory || 'Jugada finalizada',
          };
        });
        const next = capTicketsKeepingPlayed(working);
        storageService.saveTickets(next);
        return next;
      }

      // Caso 2: Hay 1 o varios boletos activos publicados desde el servidor
      if (activeServerList.length > 0) {
        let nextTickets = [...working];
        activeServerList.forEach((srv, idx) => {
          if (!srv || !srv.combinacionJugada) return;
          const nums = parseNumbersList(srv.combinacionJugada);
          if (nums.length === 0) return;
          const normalizedImg = normalizeReceiptImageUrl(String(srv.fotoResguardo || ''));
          const numsKey = nums.join(',');

          const existingMatch = nextTickets.find(
            t =>
              !t.isScrutinized &&
              ((srv.id && t.id === srv.id) ||
                (t.jornadaNumber === Number(srv.jornada) &&
                  t.drawDate === String(srv.fecha) &&
                  t.playedNumbers.join(',') === numsKey))
          );

          if (existingMatch) {
            const nextImg =
              normalizedImg && !existingMatch.receiptImageUrl.startsWith('data:')
                ? normalizedImg
                : normalizeReceiptImageUrl(existingMatch.receiptImageUrl);
            nextTickets = nextTickets.map(t =>
              t.id === existingMatch.id
                ? {
                    ...t,
                    receiptImageUrl: nextImg,
                    modalityLabel: srv.modalidad ? String(srv.modalidad) : t.modalityLabel,
                  }
                : t
            );
            return;
          }

          const syncedTicket: TicketDraw = {
            id: srv.id || `gas-${srv.fecha}-${srv.jornada}-${idx + 1}`,
            cycleNumber: Number(srv.ciclo) || 1,
            jornadaNumber: Number(srv.jornada) || 1,
            drawDate: String(srv.fecha),
            receiptImageUrl: normalizedImg,
            betType: inferBetTypeFromCount(nums.length),
            modalityLabel: srv.modalidad ? String(srv.modalidad) : undefined,
            numbersPlayedCount: nums.length,
            cost: Number(srv.importeJugado) || 0,
            activePlayersCount: Number(srv.jugadoresActivos) || 0,
            costPerPlayer: 1.0,
            playedNumbers: nums,
            playedReintegro: Number(srv.reintegro) || 0,
            jokerPlayed: true,
            isScrutinized: false,
            totalPrize: 0,
            prizeType: 'NINGUNO',
            publishStatus: 'PUBLICADO',
            scheduledNotificationSent: true,
          };

          nextTickets = archivePreviousPendingTicketsForNewSchedule(nextTickets, syncedTicket);
        });

        const next = capTicketsKeepingPlayed(nextTickets);
        storageService.saveTickets(next);
        return next;
      }

      const next = capTicketsKeepingPlayed(working);
      storageService.saveTickets(next);
      return next;
    });
  };

  const handleLogoutMember = () => {
    setPlayerDni('');
    setMemberIdentifier('');
    setMemberRole('');
    setMemberName('');
    setHasRegisteredOnDevice(false);
    setPlayers([]);
    setWaitingList([]);
    setTickets([]);
    storageService.savePlayers([]);
    storageService.saveWaitingList([]);
    storageService.saveTickets([]);
    try {
      localStorage.removeItem('primitiva_tordueles_player_dni');
      localStorage.removeItem('primitiva_tordueles_member_id');
      localStorage.removeItem('primitiva_tordueles_member_role');
      localStorage.removeItem('primitiva_tordueles_member_name');
      localStorage.removeItem('primitiva_tordueles_visitor_registered');
    } catch {
      // ignore
    }
  };

  const handleMemberAuthenticated = (player: Player, accessData?: MemberAccessResponse) => {
    const dni = (player.dni || '').trim().toUpperCase();
    const idUsed = dni || (player.phone || '').replace(/\s+/g, '');
    const resolvedRole: 'TITULAR' | 'SUPLENTE' =
      accessData?.rol === 'TITULAR' || player.status === 'TITULAR'
        ? 'TITULAR'
        : 'SUPLENTE';

    if (dni) {
      setPlayerDni(dni);
      try {
        localStorage.setItem('primitiva_tordueles_player_dni', dni);
      } catch {
        // ignore storage errors
      }
      void solicitarPermisoYRegistrarToken(dni, settings.googleAppsScriptUrl);
    }

    if (idUsed) {
      setMemberIdentifier(idUsed);
      try {
        localStorage.setItem('primitiva_tordueles_member_id', idUsed);
      } catch {
        // ignore
      }
    }

    setMemberRole(resolvedRole);
    setMemberName(player.name);
    try {
      localStorage.setItem('primitiva_tordueles_member_role', resolvedRole);
      localStorage.setItem('primitiva_tordueles_member_name', player.name);
    } catch {
      // ignore
    }

    if (typeof accessData?.conteoTitulares === 'number' || typeof accessData?.conteoSuplentes === 'number') {
      setCounts({
        titulares: accessData.conteoTitulares,
        suplentes: accessData.conteoSuplentes,
      });
    }
    if (typeof accessData?.modoCaptacionInicial === 'boolean') {
      const nextSettings = {
        ...settings,
        initialRecruitmentMode: accessData.modoCaptacionInicial,
      };
      setSettings(nextSettings);
      storageService.saveSettings(nextSettings);
    }
    if (Array.isArray(accessData?.listaPublica)) {
      applyPublicListFromServer(accessData.listaPublica, settings.currentCycle);
    }
    if (resolvedRole === 'TITULAR') {
      if (
        accessData?.boletoActivo ||
        (accessData?.boletosActivos && accessData.boletosActivos.length > 0) ||
        (accessData?.ultimosJugados && accessData.ultimosJugados.length > 0)
      ) {
        applyServerTicketsState({
          boletoActivo: accessData?.boletoActivo,
          boletosActivos: accessData?.boletosActivos,
          ultimosJugados: accessData?.ultimosJugados,
        });
      }
    } else if (resolvedRole === 'SUPLENTE') {
      setTickets([]);
      storageService.saveTickets([]);
    }

    void reportPWAInstallOrVisit(settings.googleAppsScriptUrl, {
      dni: dni || undefined,
      nombre: player.name,
    });
  };

  // Servicio de suscripción de notificaciones push en el useEffect principal al aceptar la conformidad
  useEffect(() => {
    if (isConformityAccepted) {
      const existingToken = storageService.getPushToken();
      if (!existingToken && pushNotificationService.isSupported()) {
        pushNotificationService.subscribeUserToPush().then(result => {
          if (result.token) {
            storageService.savePushToken(result.token);
          }
        });
      }
    }
  }, [isConformityAccepted]);

  // Registro automático de dispositivos e instalaciones PWA en Google Sheets ("Instalaciones App")
  useEffect(() => {
    void reportPWAInstallOrVisit(settings.googleAppsScriptUrl, {
      dni: playerDni || undefined,
    });

    const handleAppInstalled = () => {
      void reportPWAInstallOrVisit(settings.googleAppsScriptUrl, {
        installedNow: true,
        dni: playerDni || undefined,
      });
    };

    window.addEventListener('appinstalled', handleAppInstalled);
    return () => {
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [settings.googleAppsScriptUrl, playerDni]);

  // Comprobación automática de boletos programados (al abrir o cada 30s)
  useEffect(() => {
    const checkDueScheduledTickets = () => {
      const now = new Date();
      let changed = false;
      const nextTickets = tickets.map(t => {
        if (!t.isScrutinized && t.publishStatus === 'PROGRAMADO' && isTicketPublishedNow(t, now)) {
          changed = true;
          if (!t.scheduledNotificationSent) {
            pushNotificationService.notifyTicketValidated(t.jornadaNumber, t.playedNumbers);
          }
          return {
            ...t,
            publishStatus: 'PUBLICADO' as const,
            scheduledNotificationSent: true,
          };
        }
        return t;
      });

      if (changed) {
        const capped = capTicketsKeepingPlayed(nextTickets);
        setTickets(capped);
        storageService.saveTickets(capped);
      }
    };

    checkDueScheduledTickets();
    const timer = window.setInterval(checkDueScheduledTickets, 30000);
    return () => window.clearInterval(timer);
  }, [tickets]);

  // Sincronización en segundo plano con Google Apps Script si está configurado
  useEffect(() => {
    if (settings.googleAppsScriptUrl) {
      const cleanEndpoint = settings.googleAppsScriptUrl.endsWith('/exe')
        ? `${settings.googleAppsScriptUrl}c`
        : settings.googleAppsScriptUrl;
      const url = new URL(cleanEndpoint);
      if (!url.searchParams.has('format')) {
        url.searchParams.set('format', 'json');
      }
      if (memberIdentifier) {
        url.searchParams.set('identificador', memberIdentifier);
      }
      fetch(url.toString())
        .then(res => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.json();
        })
        .then(data => {
          if (data && data.status === 'OK') {
            const cicloNum = Number(data.ciclo) || settings.currentCycle;
            setSettings(prev => {
              const updatedSettings: SyndicateSettings = {
                ...prev,
                currentCycle: Number(data.ciclo) || prev.currentCycle,
                currentJornada: Number(data.jornada) || prev.currentJornada,
                prizeFundBalance:
                  data.bolsaPremios !== undefined && !isNaN(Number(data.bolsaPremios))
                    ? Number(data.bolsaPremios)
                    : prev.prizeFundBalance,
                weeklyPrizeGain:
                  data.gananciaSemanal !== undefined && !isNaN(Number(data.gananciaSemanal))
                    ? Number(data.gananciaSemanal)
                    : prev.weeklyPrizeGain ?? 0,
                sendDailyGeneralSummary:
                  data.boletinDiarioActivo !== undefined
                    ? Boolean(data.boletinDiarioActivo)
                    : prev.sendDailyGeneralSummary,
                initialRecruitmentMode:
                  data.modoCaptacionInicial !== undefined
                    ? Boolean(data.modoCaptacionInicial)
                    : prev.initialRecruitmentMode,
              };
              storageService.saveSettings(updatedSettings);
              return updatedSettings;
            });

            if (
              typeof data.conteoTitulares === 'number' ||
              typeof data.conteoSuplentes === 'number'
            ) {
              setCounts({
                titulares: data.conteoTitulares,
                suplentes: data.conteoSuplentes,
              });
            }

            if (data.boletoResumen && typeof data.boletoResumen === 'object') {
              setTicketSummary(data.boletoResumen);
            }

            const serverAuthorized = Boolean(data.acceso?.autorizado);
            const serverRole = data.acceso?.rol as 'TITULAR' | 'SUPLENTE' | undefined;

            if (serverAuthorized && serverRole) {
              setMemberRole(serverRole);
              const fullName = String(data.acceso?.user?.nombreCompleto || '').trim();
              if (fullName) {
                setMemberName(fullName);
              }
              try {
                localStorage.setItem('primitiva_tordueles_member_role', serverRole);
                if (fullName) {
                  localStorage.setItem('primitiva_tordueles_member_name', fullName);
                }
              } catch {
                // ignore
              }
            }

            const canHydrateLists =
              serverAuthorized ||
              isAdminAuthenticated ||
              hasRegisteredOnDevice ||
              memberRole === 'TITULAR' ||
              memberRole === 'SUPLENTE';

            if (canHydrateLists && Array.isArray(data.listaPublica) && data.listaPublica.length > 0) {
              applyPublicListFromServer(data.listaPublica as PublicListRow[], cicloNum);
            }

            const canHydrateTicket =
              serverRole === 'TITULAR' || (!data.acceso && memberRole === 'TITULAR');

            if (
              canHydrateTicket &&
              (data.boletoActivo ||
                (Array.isArray(data.boletosActivos) && data.boletosActivos.length > 0) ||
                (Array.isArray(data.ultimosJugados) && data.ultimosJugados.length > 0) ||
                data.boletoResumen?.programado)
            ) {
              applyServerTicketsState({
                boletoActivo: data.boletoActivo,
                boletosActivos: data.boletosActivos,
                ultimosJugados: data.ultimosJugados,
                boletoResumen: data.boletoResumen,
              });
            }
          }
        })
        .catch(err => {
          // Si el despliegue devuelve 403 o no es JSON aún, se mantiene el estado local
          console.debug('Apps Script Sync Note:', err.message || err);
        });
    }
  }, [settings.googleAppsScriptUrl, memberIdentifier, isAdminAuthenticated, hasRegisteredOnDevice, memberRole]);

  return (
    <div className="min-h-screen flex flex-col bg-[#F4F6F9] text-slate-900">
      {/* Offline Status Toast */}
      <OfflineIndicator />

      {/* Condición de Acceso Obligatoria (Modal Bloqueante si no está abierto el enlace directo de inscripción) */}
      <ConformityModal
        isOpen={(!showStandaloneRegistration && !isConformityAccepted) || showConformityReview}
        isReviewMode={isConformityAccepted}
        onAccept={handleAcceptConformity}
      />

      {/* Ventana Paso 2 de 2 posterior a la primera aceptación del reglamento */}
      <PostConformityModal
        isOpen={showPostConformityPrompt}
        onGoToRegister={() => {
          setShowPostConformityPrompt(false);
          setRegistrationInitialMode('REGISTER');
          setShowStandaloneRegistration(true);
        }}
        onGoToAccess={() => {
          setShowPostConformityPrompt(false);
          setRegistrationInitialMode('ACCESS');
          setShowStandaloneRegistration(true);
        }}
        onLater={() => {
          setShowPostConformityPrompt(false);
          setCurrentTab('dashboard');
        }}
      />

      {/* Admin Login Modal */}
      <AdminLoginModal
        isOpen={showAdminLogin}
        onClose={() => setShowAdminLogin(false)}
        correctPin={storageService.getAdminPin()}
        googleAppsScriptUrl={settings.googleAppsScriptUrl}
        onSuccess={pin => {
          setAdminPassword(pin);
          setIsAdminAuthenticated(true);
          setCurrentTab('admin');
        }}
      />

      {/* Header & Navigation */}
      <Navbar
        currentTab={currentTab}
        onTabChange={tab => {
          if (showStandaloneRegistration) {
            handleCloseStandaloneRegistration();
          }
          setCurrentTab(tab);
        }}
        settings={settings}
        isAdminAuthenticated={isAdminAuthenticated}
        onOpenAdminLogin={() => setShowAdminLogin(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {showStandaloneRegistration ? (
          <div className="py-2 sm:py-4">
            <DualAccessRegistration
              initialMode={registrationInitialMode}
              googleAppsScriptUrl={settings.googleAppsScriptUrl}
              existingPlayers={players}
              onAuthenticatedPlayer={(player, accessData) => {
                handleMemberAuthenticated(player, accessData);
                handleCloseStandaloneRegistration();
                setCurrentTab('dashboard');
              }}
              onRegisteredNewPlayer={newReg => {
                const newEntry: WaitingListEntry = {
                  id: `w-${Date.now()}`,
                  name: newReg.name,
                  email: '',
                  phone: newReg.phone,
                  registrationTimestamp: newReg.timestamp,
                  status: 'ESPERANDO',
                };
                if (Array.isArray(newReg.listaPublica)) {
                  applyPublicListFromServer(newReg.listaPublica, settings.currentCycle);
                } else {
                  handleUpdateWaitingList([...waitingList, newEntry]);
                }
                setIsConformityAccepted(true);
                storageService.setConformityAccepted(true);
                setHasRegisteredOnDevice(true);
                setMemberRole('SUPLENTE');
                setMemberName(newReg.name);
                if (newReg.phone) {
                  setMemberIdentifier(newReg.phone.replace(/\s+/g, ''));
                }
                try {
                  localStorage.setItem('primitiva_tordueles_visitor_registered', 'true');
                  localStorage.setItem('primitiva_tordueles_member_role', 'SUPLENTE');
                  localStorage.setItem('primitiva_tordueles_member_name', newReg.name);
                  if (newReg.phone) {
                    localStorage.setItem('primitiva_tordueles_member_id', newReg.phone.replace(/\s+/g, ''));
                  }
                } catch {
                  // ignore storage errors
                }
                void reportPWAInstallOrVisit(settings.googleAppsScriptUrl, {
                  nombre: newReg.name,
                });
              }}
              onBackToApp={() => {
                handleCloseStandaloneRegistration();
                setCurrentTab('members');
              }}
            />
          </div>
        ) : !isConformityAccepted ? (
          <div className="py-4">
            <DualAccessRegistration
              googleAppsScriptUrl={settings.googleAppsScriptUrl}
              existingPlayers={players}
              onAuthenticatedPlayer={(player, accessData) => {
                handleMemberAuthenticated(player, accessData);
                handleAcceptConformity();
              }}
              onRegisteredNewPlayer={newReg => {
                const newEntry: WaitingListEntry = {
                  id: `w-${Date.now()}`,
                  name: newReg.name,
                  email: '',
                  phone: newReg.phone,
                  registrationTimestamp: newReg.timestamp,
                  status: 'ESPERANDO',
                };
                if (Array.isArray(newReg.listaPublica)) {
                  applyPublicListFromServer(newReg.listaPublica, settings.currentCycle);
                } else {
                  handleUpdateWaitingList([...waitingList, newEntry]);
                }
                setHasRegisteredOnDevice(true);
                setMemberRole('SUPLENTE');
                setMemberName(newReg.name);
                if (newReg.phone) {
                  setMemberIdentifier(newReg.phone.replace(/\s+/g, ''));
                }
                try {
                  localStorage.setItem('primitiva_tordueles_visitor_registered', 'true');
                  localStorage.setItem('primitiva_tordueles_member_role', 'SUPLENTE');
                  localStorage.setItem('primitiva_tordueles_member_name', newReg.name);
                  if (newReg.phone) {
                    localStorage.setItem('primitiva_tordueles_member_id', newReg.phone.replace(/\s+/g, ''));
                  }
                } catch {
                  // ignore storage errors
                }
                void reportPWAInstallOrVisit(settings.googleAppsScriptUrl, {
                  nombre: newReg.name,
                });
                handleAcceptConformity();
              }}
              onOpenRulesModal={() => setShowConformityReview(true)}
            />
            <div className="text-center mt-5">
              <button
                type="button"
                onClick={() => setShowConformityReview(true)}
                className="text-base font-semibold text-slate-600 hover:text-[#0A2540] underline min-h-[44px] px-3 transition cursor-pointer"
              >
                ¿Acceso directo con Declaración de Conformidad rápida?
              </button>
            </div>
          </div>
        ) : (
          <>
            {currentTab === 'dashboard' && (
              <UserDashboard
                settings={settings}
                tickets={tickets}
                players={players}
                prizeHistory={prizeHistory}
                playerDni={playerDni}
                accessLevel={effectiveAccessLevel}
                memberName={memberName}
                titularesCount={counts.titulares}
                suplentesCount={counts.suplentes}
                ticketSummary={ticketSummary}
                googleAppsScriptUrl={settings.googleAppsScriptUrl}
                onNavigateTab={tab => setCurrentTab(tab)}
                onOpenRegister={() => {
                  setRegistrationInitialMode('REGISTER');
                  setShowStandaloneRegistration(true);
                }}
                onOpenLogin={() => {
                  setRegistrationInitialMode('ACCESS');
                  setShowStandaloneRegistration(true);
                }}
                onLogoutMember={handleLogoutMember}
              />
            )}

            {currentTab === 'tickets' && (
              <TicketsHistory
                tickets={tickets}
                prizeHistory={prizeHistory}
                currentCycle={settings.currentCycle}
                prizeFundBalance={settings.prizeFundBalance}
                accessLevel={effectiveAccessLevel}
                googleAppsScriptUrl={settings.googleAppsScriptUrl}
                onOpenRegister={() => {
                  setRegistrationInitialMode('REGISTER');
                  setShowStandaloneRegistration(true);
                }}
                onOpenLogin={() => {
                  setRegistrationInitialMode('ACCESS');
                  setShowStandaloneRegistration(true);
                }}
              />
            )}

            {currentTab === 'members' && (
              <MembersAndWaitlist
                players={players}
                waitingList={waitingList}
                settings={settings}
                accessLevel={effectiveAccessLevel}
                titularesCount={counts.titulares}
                suplentesCount={counts.suplentes}
                onOpenRegistration={() => {
                  setRegistrationInitialMode('REGISTER');
                  setShowStandaloneRegistration(true);
                }}
                onOpenLogin={() => {
                  setRegistrationInitialMode('ACCESS');
                  setShowStandaloneRegistration(true);
                }}
              />
            )}

            {currentTab === 'rules' && <OfficialRules />}

            {currentTab === 'admin' && (
              <AdminPanel
                settings={settings}
                onUpdateSettings={handleUpdateSettings}
                players={players}
                onUpdatePlayers={handleUpdatePlayers}
                waitingList={waitingList}
                onUpdateWaitingList={handleUpdateWaitingList}
                tickets={tickets}
                onUpdateTickets={handleUpdateTickets}
                prizeHistory={prizeHistory}
                onUpdatePrizeHistory={handleUpdatePrizeHistory}
                adminPassword={adminPassword}
                onLogoutAdmin={() => {
                  setIsAdminAuthenticated(false);
                  setAdminPassword('');
                  setCurrentTab('dashboard');
                }}
              />
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <Footer
        onOpenRules={() => {
          if (showStandaloneRegistration) {
            handleCloseStandaloneRegistration();
          }
          setCurrentTab('rules');
        }}
        onOpenConformity={() => setShowConformityReview(true)}
        onOpenRegistration={() => {
          setRegistrationInitialMode('REGISTER');
          setShowStandaloneRegistration(true);
        }}
        googleFormUrl={settings.googleFormUrl}
      />
    </div>
  );
}
