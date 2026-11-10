import React, { useState } from 'react';
import { Logo } from './Logo';
import { PWAInstallButton } from './PWAInstallButton';
import {
  LayoutDashboard,
  Receipt,
  Users,
  BookOpen,
  Lock,
  Bell,
  Menu,
  X,
  AlertTriangle
} from 'lucide-react';
import { SyndicateSettings } from '../types/lottery';
import { pushNotificationService } from '../services/pushNotifications';

interface NavbarProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  settings: SyndicateSettings;
  isAdminAuthenticated: boolean;
  onOpenAdminLogin: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onTabChange,
  settings,
  isAdminAuthenticated,
  onOpenAdminLogin,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [pushState, setPushState] = useState<NotificationPermission>(
    pushNotificationService.getPermission()
  );

  const isRenewalPeriod = settings.currentJornada >= 7 && settings.currentJornada <= 9;

  const handleRequestPush = async () => {
    const perm = await pushNotificationService.requestPermission();
    setPushState(perm);
    if (perm === 'granted') {
      pushNotificationService.sendNotification(
        '🔔 Notificaciones Activadas - Peña Tordueles',
        {
          body: 'Recibirás avisos a las 20:35 con el boleto sellado y al finalizar el escrutinio oficial.',
        }
      );
    }
  };

  const navItems = [
    { id: 'dashboard', label: 'Mi Jugada', icon: LayoutDashboard },
    { id: 'tickets', label: 'Historial Boletos', icon: Receipt },
    { id: 'members', label: 'Socios & Espera', icon: Users },
    { id: 'rules', label: 'Reglamento', icon: BookOpen },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      {/* Top Banner if in renewal period */}
      {isRenewalPeriod && (
        <div className="bg-amber-500 px-4 py-1.5 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-inner">
          <AlertTriangle className="w-4 h-4 shrink-0 text-amber-100" />
          <span>
            <strong>Periodo de Renovación Activo:</strong> Jornada {settings.currentJornada}/10. Recuerda abonar la cuota de 10€ antes de finalizar la jornada 9.
          </span>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-2">
          {/* Brand & Logo */}
          <div
            onClick={() => onTabChange('dashboard')}
            className="flex items-center gap-3 cursor-pointer group select-none"
          >
            <div className="relative rounded-2xl bg-slate-50 p-1 border border-slate-200 shadow-xs group-hover:scale-105 transition">
              <Logo size={46} variant="full" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif font-black text-base sm:text-xl tracking-tight text-[#0d253f]">
                  Primitiva Tordueles
                </span>
                <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                  Ciclo {settings.currentCycle} • J{settings.currentJornada}/10
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                Burgos • 1€ Semanal • Bolsa de Premios Acumulada
              </p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition ${
                    isActive
                      ? 'bg-[#0d253f] text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-sky-300' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Actions & PWA Install */}
          <div className="flex items-center gap-2">
            {/* Push Notifications trigger */}
            <button
              onClick={handleRequestPush}
              className={`p-2 rounded-xl border text-xs font-medium transition flex items-center justify-center ${
                pushState === 'granted'
                  ? 'border-emerald-200 text-emerald-700 bg-emerald-50'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
              title={
                pushState === 'granted'
                  ? 'Notificaciones activadas (Avisos 20:35h y escrutinio)'
                  : 'Activar avisos de boleto y escrutinio'
              }
            >
              <Bell className="w-4 h-4" />
            </button>

            {/* PWA Install Button */}
            <PWAInstallButton />

            {/* Admin Panel button */}
            <button
              onClick={() => {
                if (isAdminAuthenticated) {
                  onTabChange('admin');
                } else {
                  onOpenAdminLogin();
                }
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition border ${
                currentTab === 'admin'
                  ? 'bg-amber-600 text-white border-amber-700 shadow-xs'
                  : isAdminAuthenticated
                  ? 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
                  : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
              }`}
            >
              <Lock className="w-3.5 h-3.5 text-amber-600" />
              <span className="hidden sm:inline">Admin</span>
            </button>

            {/* Mobile menu hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-slate-200 px-4 pt-2 pb-4 space-y-1">
          <div className="py-2 px-3 mb-2 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
            <span className="text-slate-600">Estado de la Peña:</span>
            <span className="font-bold text-[#0d253f]">
              Ciclo {settings.currentCycle} • Jornada {settings.currentJornada}/10
            </span>
          </div>
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onTabChange(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition ${
                  isActive
                    ? 'bg-[#0d253f] text-white'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-sky-300' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
          <button
            onClick={() => {
              if (isAdminAuthenticated) {
                onTabChange('admin');
              } else {
                onOpenAdminLogin();
              }
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition ${
              currentTab === 'admin'
                ? 'bg-amber-600 text-white'
                : 'text-amber-800 bg-amber-50 hover:bg-amber-100'
            }`}
          >
            <Lock className="w-4 h-4" />
            <span>Panel de Administrador {isAdminAuthenticated ? '(Acceso autorizado)' : ''}</span>
          </button>
        </div>
      )}
    </header>
  );
};
