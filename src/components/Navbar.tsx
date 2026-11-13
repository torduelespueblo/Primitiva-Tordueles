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
        'Notificaciones Activadas - Peña Tordueles',
        {
          body: 'Recibirás avisos a las 20:35 con el boleto sellado y al finalizar el escrutinio oficial.',
        }
      );
    }
  };

  const navItems = [
    { id: 'dashboard', shortLabel: 'Jugada', label: 'Mi Jugada', icon: LayoutDashboard },
    { id: 'tickets', shortLabel: 'Boletos', label: 'Historial Boletos', icon: Receipt },
    { id: 'members', shortLabel: 'Socios', label: 'Socios & Espera', icon: Users },
    { id: 'rules', shortLabel: 'Normas', label: 'Reglamento', icon: BookOpen },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
        {/* Top Banner if in renewal period */}
        {isRenewalPeriod && (
          <div className="bg-[#FF6B00] px-4 py-2.5 text-white text-sm sm:text-base font-semibold flex items-center justify-center gap-2.5">
            <AlertTriangle className="w-5 h-5 shrink-0 text-white" />
            <span className="leading-snug text-center">
              <strong>Renovación Activa (Jornada {settings.currentJornada}/10):</strong> Recuerda abonar los 10 € antes de finalizar la jornada 9.
            </span>
          </div>
        )}

        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-2 sm:py-2.5 gap-2">
            {/* Brand & Large Borderless Logo (Zero white box) */}
            <button
              type="button"
              onClick={() => onTabChange('dashboard')}
              className="flex items-center gap-2.5 sm:gap-3.5 text-left cursor-pointer group select-none min-w-0"
            >
              <Logo
                size={68}
                variant="full"
                theme="light"
                className="w-14 h-14 sm:w-[74px] sm:h-[74px] shrink-0 transition-transform group-hover:scale-105"
              />
              <div className="min-w-0">
                <span className="font-serif font-black text-[17px] sm:text-2xl tracking-tight text-[#0A2540] block leading-[1.15]">
                  Primitiva<span className="sm:hidden"> </span>Tordueles
                </span>
                <p className="text-xs sm:text-base font-bold text-[#FF6B00] tabular-nums leading-tight mt-0.5 whitespace-nowrap">
                  Ciclo {settings.currentCycle} · J{settings.currentJornada}/10
                </p>
              </div>
            </button>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1.5">
              {navItems.map(item => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onTabChange(item.id)}
                    className={`flex items-center gap-2 px-4 min-h-[44px] rounded-xl text-base font-bold transition cursor-pointer ${
                      isActive
                        ? 'bg-[#0A2540] text-white shadow-xs'
                        : 'text-slate-700 hover:text-[#0A2540] hover:bg-slate-100'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-[#FF6B00]' : 'text-slate-500'}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* Actions & PWA Install */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Push Notifications trigger */}
              <button
                type="button"
                onClick={handleRequestPush}
                className={`min-w-[44px] min-h-[44px] rounded-xl border transition flex items-center justify-center cursor-pointer ${
                  pushState === 'granted'
                    ? 'border-emerald-300 text-emerald-700 bg-emerald-50'
                    : 'border-slate-300 text-slate-700 hover:bg-slate-100'
                }`}
                title={
                  pushState === 'granted'
                    ? 'Notificaciones activadas (Avisos 20:35h y escrutinio)'
                    : 'Activar avisos de boleto y escrutinio'
                }
                aria-label="Activar notificaciones"
              >
                <Bell className="w-5 h-5" />
              </button>

              {/* PWA Install Button */}
              <PWAInstallButton />

              {/* Admin Panel button */}
              <button
                type="button"
                onClick={() => {
                  if (isAdminAuthenticated) {
                    onTabChange('admin');
                  } else {
                    onOpenAdminLogin();
                  }
                }}
                className={`hidden sm:inline-flex items-center gap-2 px-3.5 min-h-[44px] rounded-xl text-sm sm:text-base font-bold transition border cursor-pointer ${
                  currentTab === 'admin'
                    ? 'bg-[#FF6B00] text-white border-[#E55E00] shadow-xs'
                    : isAdminAuthenticated
                    ? 'bg-orange-50 text-[#0A2540] border-orange-300 hover:bg-orange-100'
                    : 'bg-slate-100 text-[#0A2540] border-slate-300 hover:bg-slate-200'
                }`}
              >
                <Lock className="w-4 h-4 text-[#FF6B00]" />
                <span>Admin</span>
              </button>

              {/* Mobile menu button for Admin/Extras */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden min-w-[44px] min-h-[44px] rounded-xl text-[#0A2540] hover:bg-slate-100 flex items-center justify-center border border-slate-200 cursor-pointer"
                aria-label="Abrir menú"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white border-t border-slate-200 px-4 pt-3 pb-5 space-y-2 shadow-lg">
            <div className="py-2.5 px-3.5 mb-2 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-base">
              <span className="text-slate-600 font-medium">Estado Peña:</span>
              <span className="font-extrabold text-[#0A2540] tabular-nums">
                Ciclo {settings.currentCycle} · J{settings.currentJornada}/10
              </span>
            </div>
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    onTabChange(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 min-h-[48px] rounded-xl text-base font-bold transition cursor-pointer ${
                    isActive
                      ? 'bg-[#0A2540] text-white'
                      : 'text-slate-800 hover:bg-slate-100'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-[#FF6B00]' : 'text-slate-500'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => {
                if (isAdminAuthenticated) {
                  onTabChange('admin');
                } else {
                  onOpenAdminLogin();
                }
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 min-h-[48px] rounded-xl text-base font-bold transition cursor-pointer ${
                currentTab === 'admin'
                  ? 'bg-[#FF6B00] text-white'
                  : 'text-[#0A2540] bg-orange-50 hover:bg-orange-100 border border-orange-200'
              }`}
            >
              <Lock className="w-5 h-5 text-[#FF6B00]" />
              <span>Panel de Administrador {isAdminAuthenticated ? '(Activo)' : ''}</span>
            </button>
          </div>
        )}
      </header>

      {/* Mobile Bottom Thumb Navigation Bar */}
      <nav
        aria-label="Navegación principal móvil"
        className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 pb-safe shadow-[0_-4px_20px_rgba(10,37,64,0.08)]"
      >
        <div className="grid grid-cols-4 gap-1.5 px-2 py-1.5">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onTabChange(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl min-h-[54px] transition cursor-pointer ${
                  isActive
                    ? 'bg-[#0A2540] text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Icon
                  className={`w-5 h-5 mb-0.5 ${isActive ? 'text-[#FF6B00]' : 'text-slate-500'}`}
                />
                <span className="text-[13px] font-bold leading-tight truncate max-w-full">
                  {item.shortLabel}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};
