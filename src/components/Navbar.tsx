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
  AlertTriangle,
  CheckCircle2,
  Clock,
  CreditCard,
  Smartphone,
  Building2,
  Loader2,
  Sun,
  Moon,
  Sparkles
} from 'lucide-react';
import { SyndicateSettings } from '../types/lottery';
import { pushNotificationService } from '../services/pushNotifications';
import { notifyMemberPaymentToSheet } from '../services/registrationService';
import { ThemeMode } from '../services/themeService';

interface NavbarProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  settings: SyndicateSettings;
  isAdminAuthenticated: boolean;
  onOpenAdminLogin: () => void;
  memberRole?: 'TITULAR' | 'SUPLENTE' | '';
  memberName?: string;
  memberIdentifier?: string;
  memberPaymentStatus?: string;
  memberPaymentNotifiedAt?: string;
  onMemberPaymentNotified?: (newStatus: string, notifiedAt: string) => void;
  themeMode?: ThemeMode;
  onToggleTheme?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onTabChange,
  settings,
  isAdminAuthenticated,
  onOpenAdminLogin,
  memberRole = '',
  memberName = '',
  memberIdentifier = '',
  memberPaymentStatus = '',
  memberPaymentNotifiedAt = '',
  onMemberPaymentNotified,
  themeMode = 'auto',
  onToggleTheme,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [pushState, setPushState] = useState<NotificationPermission>(
    pushNotificationService.getPermission()
  );

  // Modal de notificación de pago (Bizum / Transferencia)
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedPayMethod, setSelectedPayMethod] = useState<'Bizum' | 'Transferencia'>('Bizum');
  const [isSubmittingPay, setIsSubmittingPay] = useState(false);
  const [payModalError, setPayModalError] = useState<string | null>(null);

  const isRenewalPeriod = settings.currentJornada >= 7 && settings.currentJornada <= 9;
  const isAuthenticatedMember = Boolean(
    memberIdentifier && (memberRole === 'TITULAR' || memberRole === 'SUPLENTE')
  );
  const payStatusLower = (memberPaymentStatus || '').trim().toLowerCase();
  const isPaymentConfirmed = payStatusLower === 'pagado';
  const isPaymentNotified = payStatusLower.startsWith('notificado');
  const isPaymentPending =
    isAuthenticatedMember &&
    !isPaymentConfirmed &&
    !isPaymentNotified &&
    (payStatusLower === 'pendiente' || memberRole === 'SUPLENTE' || isRenewalPeriod);

  const showRenewalOrPaymentBanner =
    isRenewalPeriod || isPaymentNotified || isPaymentPending;

  const handleConfirmNotifyPayment = async () => {
    if (!memberIdentifier) {
      setPayModalError('Debes iniciar sesión con tu DNI o Teléfono antes de notificar el pago.');
      return;
    }
    setPayModalError(null);
    setIsSubmittingPay(true);

    const res = await notifyMemberPaymentToSheet(settings.googleAppsScriptUrl, {
      identificador: memberIdentifier,
      metodo: selectedPayMethod,
    });

    setIsSubmittingPay(false);
    if (!res.success) {
      setPayModalError(res.message || 'No se pudo enviar el aviso de pago. Inténtalo de nuevo.');
      return;
    }

    const nextStatus = res.estadoPago || `Notificado (${selectedPayMethod})`;
    const nextAt = res.fechaAvisoPago || '';
    if (onMemberPaymentNotified) {
      onMemberPaymentNotified(nextStatus, nextAt);
    }
    setShowPayModal(false);
  };

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
        {/* Top Banner de Renovación y Notificación de Pagos */}
        {showRenewalOrPaymentBanner &&
          (isAuthenticatedMember && isPaymentConfirmed ? (
            <div className="bg-emerald-50 border-b border-emerald-200 px-4 py-2 text-emerald-900 text-sm sm:text-base font-bold flex items-center justify-center gap-2">
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
              <span className="leading-snug text-center">
                ✅ Renovación confirmada para el próximo ciclo
              </span>
            </div>
          ) : (
            <div className="bg-[#FF6B00] px-4 py-2.5 text-white text-sm sm:text-base font-semibold">
              <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-2.5 sm:gap-4">
                <div className="flex items-center gap-2 text-center sm:text-left">
                  <AlertTriangle className="w-5 h-5 shrink-0 text-white" />
                  <span className="leading-snug">
                    {isRenewalPeriod ? (
                      <>
                        <strong>Renovación Activa (Jornada {settings.currentJornada}/10):</strong>{' '}
                        Recuerda abonar los 10 € antes de finalizar la jornada 9.
                      </>
                    ) : (
                      <>
                        <strong>Cuota de Participación Pendiente (10 €):</strong>{' '}
                        Avisa aquí al Administrador una vez realizado el ingreso.
                      </>
                    )}
                  </span>
                </div>

                {isAuthenticatedMember && (
                  <div className="shrink-0">
                    {isPaymentNotified ? (
                      <div
                        className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-50 border border-amber-300 text-[#0A2540] text-xs sm:text-sm font-extrabold shadow-xs select-none"
                        role="status"
                      >
                        <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>
                          ⏳ Pago notificado — Pendiente de verificación por el Administrador
                          {memberPaymentNotifiedAt ? ` (${memberPaymentNotifiedAt})` : ''}
                        </span>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setPayModalError(null);
                          setShowPayModal(true);
                        }}
                        className="inline-flex items-center justify-center gap-2 px-4 min-h-[40px] rounded-xl bg-white hover:bg-orange-50 text-[#0A2540] text-xs sm:text-sm font-extrabold shadow-sm border border-white/80 transition cursor-pointer"
                      >
                        <CreditCard className="w-4 h-4 text-[#FF6B00] shrink-0" />
                        <span>Ya he realizado el pago (10 €)</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}

        {/* Modal de Confirmación de Método de Pago (Bizum / Transferencia) */}
        {showPayModal && (
          <div
            className="fixed inset-0 z-50 bg-[#0A2540]/70 backdrop-blur-xs flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="pay-notify-modal-title"
          >
            <div className="bg-white rounded-3xl border border-slate-200 max-w-md w-full shadow-2xl overflow-hidden text-slate-900">
              <div className="bg-[#0A2540] px-5 py-4 text-white flex items-center justify-between gap-3">
                <div>
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#FF6B00] block">
                    Renovación / Cuota · 10,00 €
                  </span>
                  <h2 id="pay-notify-modal-title" className="text-lg font-black font-serif">
                    Notificar Pago Realizado
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPayModal(false)}
                  className="p-2 rounded-xl hover:bg-white/10 text-slate-200 cursor-pointer"
                  aria-label="Cerrar"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 sm:p-6 space-y-4">
                {memberName && (
                  <p className="text-sm font-bold text-[#0A2540]">
                    Socio: <span className="text-[#FF6B00]">{memberName}</span>
                  </p>
                )}

                <div>
                  <label className="block text-sm font-extrabold text-[#0A2540] mb-2">
                    Selecciona el método de pago utilizado:
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setSelectedPayMethod('Bizum')}
                      className={`flex flex-col items-center justify-center gap-1.5 p-3.5 rounded-2xl border-2 text-sm font-extrabold transition cursor-pointer ${
                        selectedPayMethod === 'Bizum'
                          ? 'border-[#FF6B00] bg-orange-50 text-[#0A2540] shadow-xs'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <Smartphone
                        className={`w-6 h-6 ${
                          selectedPayMethod === 'Bizum' ? 'text-[#FF6B00]' : 'text-slate-400'
                        }`}
                      />
                      <span>Bizum</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedPayMethod('Transferencia')}
                      className={`flex flex-col items-center justify-center gap-1.5 p-3.5 rounded-2xl border-2 text-sm font-extrabold transition cursor-pointer ${
                        selectedPayMethod === 'Transferencia'
                          ? 'border-[#FF6B00] bg-orange-50 text-[#0A2540] shadow-xs'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <Building2
                        className={`w-6 h-6 ${
                          selectedPayMethod === 'Transferencia' ? 'text-[#FF6B00]' : 'text-slate-400'
                        }`}
                      />
                      <span>Transferencia</span>
                    </button>
                  </div>
                </div>

                <div className="rounded-2xl bg-amber-50 border border-amber-200 p-3.5 text-sm text-amber-950 font-semibold leading-snug">
                  💡 Recuerda: <strong>Asegúrate de haber indicado tu Nombre y Apellidos en el concepto</strong> para que el Administrador localice tu ingreso rápidamente.
                </div>

                {payModalError && (
                  <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-sm font-semibold text-red-700">
                    {payModalError}
                  </div>
                )}

                <div className="flex gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowPayModal(false)}
                    className="flex-1 min-h-[46px] rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-sm font-bold text-[#0A2540] cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    disabled={isSubmittingPay}
                    onClick={handleConfirmNotifyPayment}
                    className="flex-1 min-h-[46px] rounded-xl bg-[#FF6B00] hover:bg-[#E55E00] disabled:opacity-60 text-sm font-extrabold text-white shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isSubmittingPay && <Loader2 className="w-4 h-4 animate-spin" />}
                    <span>{isSubmittingPay ? 'Enviando aviso...' : `Confirmar (${selectedPayMethod})`}</span>
                  </button>
                </div>
              </div>
            </div>
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

              {/* Theme Mode Toggle (Auto / Light / Dark) */}
              {onToggleTheme && (
                <button
                  type="button"
                  onClick={onToggleTheme}
                  className="min-w-[44px] min-h-[44px] rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 transition flex items-center justify-center cursor-pointer"
                  title={`Tema actual: ${themeMode === 'auto' ? 'Automático (Día/Noche)' : themeMode === 'light' ? 'Modo Día' : 'Modo Noche'}. Haz clic para cambiar.`}
                  aria-label="Cambiar tema día/noche"
                >
                  {themeMode === 'dark' ? (
                    <Moon className="w-5 h-5 text-[#FF6B00]" />
                  ) : themeMode === 'light' ? (
                    <Sun className="w-5 h-5 text-amber-500" />
                  ) : (
                    <Sparkles className="w-5 h-5 text-[#0A2540]" />
                  )}
                </button>
              )}

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
