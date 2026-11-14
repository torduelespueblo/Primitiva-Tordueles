const DEVICE_ID_KEY = 'primitiva_tordueles_device_id';
const PWA_INSTALLED_KEY = 'primitiva_tordueles_pwa_installed';
const SESSION_PING_KEY = 'primitiva_tordueles_install_ping_v1';

export function getOrCreateDeviceId(): string {
  if (typeof window === 'undefined') return '';
  try {
    let id = localStorage.getItem(DEVICE_ID_KEY);
    if (!id) {
      id =
        typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
          ? `dev_${crypto.randomUUID()}`
          : `dev_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
      localStorage.setItem(DEVICE_ID_KEY, id);
    }
    return id;
  } catch {
    return '';
  }
}

export function detectDevicePlatform(): string {
  if (typeof navigator === 'undefined') return 'Desconocido';
  const ua = navigator.userAgent || '';
  if (/iphone|ipad|ipod/i.test(ua)) return 'iPhone / iPad (iOS)';
  if (/android/i.test(ua)) return 'Android';
  if (/windows/i.test(ua)) return 'Windows PC';
  if (/macintosh|mac os/i.test(ua)) return 'Mac';
  if (/linux/i.test(ua)) return 'Linux';
  return 'Web Móvil / PC';
}

export function isRunningInstalledPWA(): boolean {
  if (typeof window === 'undefined') return false;
  const standaloneMedia = window.matchMedia?.('(display-mode: standalone)').matches;
  const iosStandalone = (window.navigator as unknown as { standalone?: boolean }).standalone === true;
  let storedInstalled = false;
  try {
    storedInstalled = localStorage.getItem(PWA_INSTALLED_KEY) === 'true';
  } catch {
    storedInstalled = false;
  }
  return Boolean(standaloneMedia || iosStandalone || storedInstalled);
}

export function markPWAAsInstalled(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(PWA_INSTALLED_KEY, 'true');
  } catch {
    // ignore
  }
}

/**
 * Envía de forma silenciosa el registro del dispositivo / instalación PWA a la hoja "Instalaciones App".
 */
export async function reportPWAInstallOrVisit(
  appsScriptUrl: string | undefined,
  options?: { installedNow?: boolean; dni?: string; nombre?: string }
): Promise<void> {
  if (typeof window === 'undefined' || !appsScriptUrl || !appsScriptUrl.startsWith('http')) {
    return;
  }

  if (options?.installedNow) {
    markPWAAsInstalled();
  }

  const deviceId = getOrCreateDeviceId();
  if (!deviceId) return;

  const isInstalled = Boolean(options?.installedNow || isRunningInstalledPWA());
  const modo = isInstalled ? 'App Instalada (PWA)' : 'Navegador Web';
  const dni = (options?.dni || '').trim().toUpperCase();
  const nombre = (options?.nombre || '').trim();

  // Evitar repetir envíos idénticos en la misma sesión salvo que acabe de instalar o se identifique con DNI/nombre
  const fingerprint = `${modo}|${dni}|${nombre}`;
  try {
    const lastFingerprint = sessionStorage.getItem(SESSION_PING_KEY);
    if (!options?.installedNow && lastFingerprint === fingerprint) {
      return;
    }
    sessionStorage.setItem(SESSION_PING_KEY, fingerprint);
  } catch {
    // ignore sessionStorage limits
  }

  const cleanUrl = appsScriptUrl.endsWith('/exe') ? `${appsScriptUrl}c` : appsScriptUrl;
  const body = JSON.stringify({
    action: 'registrarInstalacionPWA',
    deviceId,
    modo,
    plataforma: detectDevicePlatform(),
    dni,
    nombre,
  });

  try {
    await fetch(cleanUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body,
    });
  } catch {
    try {
      await fetch(cleanUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body,
      });
    } catch {
      // Fallo silencioso sin afectar la interfaz
    }
  }
}
