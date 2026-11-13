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
import { capTicketsKeepingPlayed, storageService } from './services/storage';
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
import { pushNotificationService } from './services/pushNotifications';
import { isTicketPublishedNow } from './services/ticketPublishService';

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
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(false);
  const [adminPassword, setAdminPassword] = useState<string>('');
  const [showAdminLogin, setShowAdminLogin] = useState<boolean>(false);
  const [showConformityReview, setShowConformityReview] = useState<boolean>(false);
  const [showPostConformityPrompt, setShowPostConformityPrompt] = useState<boolean>(false);
  const [registrationInitialMode, setRegistrationInitialMode] = useState<'ACCESS' | 'REGISTER'>('REGISTER');
  const [showStandaloneRegistration, setShowStandaloneRegistration] = useState<boolean>(() =>
    hasRegistrationUrlFlag()
  );

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
      pushNotificationService.subscribeUserToPush().then(result => {
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
      fetch(url.toString())
        .then(res => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.json();
        })
        .then(data => {
          if (data && data.status === 'OK') {
            setSettings(prev => ({
              ...prev,
              currentCycle: Number(data.ciclo) || prev.currentCycle,
              currentJornada: Number(data.jornada) || prev.currentJornada,
              prizeFundBalance:
                data.bolsaPremios !== undefined && !isNaN(Number(data.bolsaPremios))
                  ? Number(data.bolsaPremios)
                  : prev.prizeFundBalance,
              sendDailyGeneralSummary:
                data.boletinDiarioActivo !== undefined
                  ? Boolean(data.boletinDiarioActivo)
                  : prev.sendDailyGeneralSummary,
            }));

            if (Array.isArray(data.listaPublica)) {
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

              data.listaPublica.forEach((u: Record<string, unknown>, idx: number) => {
                const firstName = String(u.nombre || '').trim();
                const lastName = String(u.apellidos || '').trim();
                const fullName = `${firstName} ${lastName}`.trim();
                if (!fullName) return;
                const rawEstado = String(u.estado || 'Suplente').trim().toUpperCase();
                const ts = String(u.timestamp || '').trim();
                const tsMs = parseTsMs(ts, typeof u.timestampMs === 'number' ? u.timestampMs : undefined);

                if (rawEstado === 'TITULAR') {
                  syncedPlayers.push({
                    id: `sheet-u-${u.id || idx + 1}`,
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
                    paidUntilCycle: Number(data.ciclo) || 1,
                    renewalStatus: 'RENOVADO',
                  });
                } else if (rawEstado === 'SUPLENTE') {
                  syncedWaiting.push({
                    id: `sheet-w-${u.id || idx + 1}`,
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
                // Conservar datos completos si ya se cargaron como administrador en esta sesión
                if (prev.some(p => p.sheetRow !== undefined)) return prev;
                storageService.savePlayers(syncedPlayers);
                return syncedPlayers;
              });
              setWaitingList(syncedWaiting);
              storageService.saveWaitingList(syncedWaiting);
            }

            if (data.boletoActivo && data.boletoActivo.combinacionJugada) {
              const b = data.boletoActivo;
              const nums = String(b.combinacionJugada)
                .split(/[,;\s-]+/)
                .map((s: string) => parseInt(s.trim(), 10))
                .filter((n: number) => !isNaN(n) && n >= 1 && n <= 49);

              if (nums.length > 0) {
                setTickets(prev => {
                  const alreadyExists = prev.some(
                    t =>
                      !t.isScrutinized &&
                      t.jornadaNumber === Number(b.jornada) &&
                      t.drawDate === String(b.fecha)
                  );
                  if (alreadyExists) return prev;

                  const syncedTicket: TicketDraw = {
                    id: `gas-${b.fecha}-${b.jornada}`,
                    cycleNumber: Number(b.ciclo) || 1,
                    jornadaNumber: Number(b.jornada) || 1,
                    drawDate: String(b.fecha),
                    receiptImageUrl: String(b.fotoResguardo || ''),
                    betType:
                      nums.length === 5
                        ? 'MULTIPLE_5'
                        : nums.length === 7
                        ? 'MULTIPLE_7'
                        : nums.length === 8
                        ? 'MULTIPLE_8'
                        : nums.length === 9
                        ? 'MULTIPLE_9'
                        : nums.length === 10
                        ? 'MULTIPLE_10'
                        : 'COMBINADA',
                    numbersPlayedCount: nums.length,
                    cost: Number(b.importeJugado) || 0,
                    activePlayersCount: Number(b.jugadoresActivos) || 0,
                    costPerPlayer: 1.0,
                    playedNumbers: nums,
                    playedReintegro: Number(b.reintegro) || 0,
                    jokerPlayed: true,
                    isScrutinized: false,
                    totalPrize: 0,
                    prizeType: 'NINGUNO',
                    publishStatus: 'PUBLICADO',
                    scheduledNotificationSent: true,
                  };
                  const next = capTicketsKeepingPlayed([syncedTicket, ...prev]);
                  storageService.saveTickets(next);
                  return next;
                });
              }
            }
          }
        })
        .catch(err => {
          // Si el despliegue devuelve 403 o no es JSON aún, se mantiene el estado local
          console.debug('Apps Script Sync Note:', err.message || err);
        });
    }
  }, [settings.googleAppsScriptUrl]);

  return (
    <div className="min-h-screen flex flex-col bg-[#F4F6F9] text-slate-900">
      {/* Offline Status Toast */}
      <OfflineIndicator />

      {/* Condición de Acceso Obligatoria (Modal Bloqueante si no está abierto el enlace directo de inscripción) */}
      <ConformityModal
        isOpen={(!showStandaloneRegistration && !isConformityAccepted) || showConformityReview}
        onAccept={handleAcceptConformity}
      />

      {/* Ventana posterior a la primera aceptación del reglamento */}
      <PostConformityModal
        isOpen={showPostConformityPrompt}
        onGoToRegistration={() => {
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
              onAuthenticatedPlayer={() => {
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
                handleUpdateWaitingList([...waitingList, newEntry]);
                setIsConformityAccepted(true);
                storageService.setConformityAccepted(true);
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
              onAuthenticatedPlayer={() => {
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
                handleUpdateWaitingList([...waitingList, newEntry]);
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
                onNavigateTab={tab => setCurrentTab(tab)}
              />
            )}

            {currentTab === 'tickets' && (
              <TicketsHistory
                tickets={tickets}
                prizeHistory={prizeHistory}
                currentCycle={settings.currentCycle}
              />
            )}

            {currentTab === 'members' && (
              <MembersAndWaitlist
                players={players}
                waitingList={waitingList}
                settings={settings}
                onOpenRegistration={() => {
                  setRegistrationInitialMode('REGISTER');
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
