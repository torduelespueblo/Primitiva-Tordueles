/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  SyndicateSettings,
  Player,
  WaitingListEntry,
  TicketDraw
} from './types/lottery';
import { storageService } from './services/storage';
import { Navbar } from './components/Navbar';
import { UserDashboard } from './components/UserDashboard';
import { TicketsHistory } from './components/TicketsHistory';
import { MembersAndWaitlist } from './components/MembersAndWaitlist';
import { OfficialRules } from './components/OfficialRules';
import { AdminPanel } from './components/AdminPanel';
import { GoogleWorkspacePanel } from './components/GoogleWorkspacePanel';
import { AdminLoginModal } from './components/AdminLoginModal';
import { ConformityModal } from './components/ConformityModal';
import { OfflineIndicator } from './components/OfflineIndicator';
import { Footer } from './components/Footer';
import { pushNotificationService } from './services/pushNotifications';

export default function App() {
  const [settings, setSettings] = useState<SyndicateSettings>(() => storageService.getSettings());
  const [players, setPlayers] = useState<Player[]>(() => storageService.getPlayers());
  const [waitingList, setWaitingList] = useState<WaitingListEntry[]>(() => storageService.getWaitingList());
  const [tickets, setTickets] = useState<TicketDraw[]>(() => storageService.getTickets());
  const [isConformityAccepted, setIsConformityAccepted] = useState<boolean>(() => storageService.isConformityAccepted());

  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(false);
  const [showAdminLogin, setShowAdminLogin] = useState<boolean>(false);
  const [showConformityReview, setShowConformityReview] = useState<boolean>(false);

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
    setTickets(newTickets);
    storageService.saveTickets(newTickets);
  };

  const handleAcceptConformity = () => {
    setIsConformityAccepted(true);
    storageService.setConformityAccepted(true);
    setShowConformityReview(false);

    // Solicitar permiso de notificaciones push de inmediato tras el gesto del usuario
    if (pushNotificationService.isSupported()) {
      pushNotificationService.subscribeUserToPush().then(result => {
        if (result.token) {
          storageService.savePushToken(result.token);
        }
      });
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

  // Sincronización en segundo plano con Google Apps Script si está configurado
  useEffect(() => {
    if (settings.googleAppsScriptUrl) {
      const url = new URL(settings.googleAppsScriptUrl);
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
              prizeFundBalance: Number(data.bolsaPremios) || prev.prizeFundBalance,
              sendDailyGeneralSummary: Boolean(data.boletinDiarioActivo),
            }));
          }
        })
        .catch(err => {
          // Si el despliegue devuelve 403 o no es JSON aún, se mantiene el estado local
          console.debug('Apps Script Sync Note:', err.message || err);
        });
    }
  }, [settings.googleAppsScriptUrl]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      {/* Offline Status Toast */}
      <OfflineIndicator />

      {/* Condición de Acceso Obligatoria (Modal Bloqueante si no se ha firmado) */}
      <ConformityModal
        isOpen={!isConformityAccepted || showConformityReview}
        onAccept={handleAcceptConformity}
      />

      {/* Admin Login Modal */}
      <AdminLoginModal
        isOpen={showAdminLogin}
        onClose={() => setShowAdminLogin(false)}
        correctPin={storageService.getAdminPin()}
        onSuccess={() => {
          setIsAdminAuthenticated(true);
          setCurrentTab('admin');
        }}
      />

      {/* Header & Navigation */}
      <Navbar
        currentTab={currentTab}
        onTabChange={tab => setCurrentTab(tab)}
        settings={settings}
        isAdminAuthenticated={isAdminAuthenticated}
        onOpenAdminLogin={() => setShowAdminLogin(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {!isConformityAccepted ? (
          <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-8 bg-white rounded-3xl border border-slate-200 shadow-sm">
            <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold text-2xl mb-4">
              🔒
            </div>
            <h2 className="text-xl font-bold font-serif text-[#0d253f]">
              Acceso Restringido por Normativa
            </h2>
            <p className="mt-2 text-sm text-slate-600 max-w-md">
              Para consultar el estado financiero, los resguardos sellados y la lista de socios, debes aceptar la declaración de conformidad oficial y el tratamiento de datos personales.
            </p>
            <button
              onClick={() => setShowConformityReview(true)}
              className="mt-5 px-6 py-2.5 rounded-xl bg-[#0d253f] hover:bg-[#153a61] text-white font-bold text-sm shadow-xs transition"
            >
              Abrir Declaración de Conformidad
            </button>
          </div>
        ) : (
          <>
            {currentTab === 'dashboard' && (
              <UserDashboard
                settings={settings}
                tickets={tickets}
                players={players}
                onNavigateTab={tab => setCurrentTab(tab)}
              />
            )}

            {currentTab === 'tickets' && (
              <TicketsHistory
                tickets={tickets}
                currentCycle={settings.currentCycle}
              />
            )}

            {currentTab === 'members' && (
              <MembersAndWaitlist
                players={players}
                waitingList={waitingList}
                settings={settings}
              />
            )}

            {currentTab === 'rules' && <OfficialRules />}

            {currentTab === 'workspace' && (
              <GoogleWorkspacePanel
                settings={settings}
                onUpdateSettings={handleUpdateSettings}
                players={players}
                onUpdatePlayers={handleUpdatePlayers}
                waitingList={waitingList}
                tickets={tickets}
              />
            )}

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
                onLogoutAdmin={() => {
                  setIsAdminAuthenticated(false);
                  setCurrentTab('dashboard');
                }}
              />
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <Footer
        onOpenRules={() => setCurrentTab('rules')}
        onOpenConformity={() => setShowConformityReview(true)}
        googleFormUrl={settings.googleFormUrl}
      />
    </div>
  );
}
