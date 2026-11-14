import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getMessaging, getToken, Messaging, isSupported as isMessagingSupported } from 'firebase/messaging';

// ============================================================================
// CONFIGURACIÓN FIREBASE CLOUD MESSAGING (FCM v9+ MODULAR) Y BACKEND GAS
// ============================================================================

export const firebaseConfig = {
  apiKey: 'TU_API_KEY_AQUI',
  authDomain: 'TU_PROYECTO.firebaseapp.com',
  projectId: 'TU_PROJECT_ID',
  storageBucket: 'TU_PROYECTO.firebasestorage.app',
  messagingSenderId: 'TU_MESSAGING_SENDER_ID',
  appId: 'TU_APP_ID',
};

export const VAPID_KEY = 'TU_CLAVE_VAPID_AQUI';
export const URL_BACKEND_GAS = 'TU_URL_WEBAPP_GOOGLE_APPS_SCRIPT_AQUI';

let firebaseAppInstance: FirebaseApp | null = null;
let messagingInstance: Messaging | null = null;

function tieneCredencialesFirebaseValidas(): boolean {
  return Boolean(
    firebaseConfig.apiKey &&
      firebaseConfig.apiKey !== 'TU_API_KEY_AQUI' &&
      firebaseConfig.projectId &&
      firebaseConfig.projectId !== 'TU_PROJECT_ID' &&
      firebaseConfig.messagingSenderId &&
      firebaseConfig.messagingSenderId !== 'TU_MESSAGING_SENDER_ID' &&
      VAPID_KEY &&
      VAPID_KEY !== 'TU_CLAVE_VAPID_AQUI'
  );
}

function getFirebaseMessaging(): Messaging | null {
  if (typeof window === 'undefined' || !tieneCredencialesFirebaseValidas()) {
    return null;
  }
  if (!firebaseAppInstance) {
    firebaseAppInstance = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);
  }
  if (!messagingInstance) {
    messagingInstance = getMessaging(firebaseAppInstance);
  }
  return messagingInstance;
}

export interface RegistrarTokenResult {
  success: boolean;
  permission: NotificationPermission;
  token?: string;
  syncedToBackend?: boolean;
  message: string;
}

/**
 * Solicita permiso de notificaciones al navegador, registra el Service Worker FCM
 * (firebase-messaging-sw.js), obtiene el Token FCM del dispositivo y lo envía
 * por POST JSON al backend de Google Apps Script.
 */
export async function solicitarPermisoYRegistrarToken(
  dniUsuario: string,
  backendUrlOverride?: string
): Promise<RegistrarTokenResult> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    console.warn('[FCM] Este navegador no soporta notificaciones Web Push.');
    return {
      success: false,
      permission: 'denied',
      message: 'Este navegador no soporta notificaciones Push.',
    };
  }

  try {
    // 1. Registrar el Service Worker en la raíz del dominio
    let swRegistration: ServiceWorkerRegistration | undefined;
    if ('serviceWorker' in navigator) {
      swRegistration = await navigator.serviceWorker.register('./firebase-messaging-sw.js');
    }

    // 2. Pedir permiso de notificaciones al navegador
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.info('[FCM] Permiso de notificaciones no concedido:', permission);
      return {
        success: false,
        permission,
        message:
          permission === 'denied'
            ? 'Has bloqueado los avisos en este navegador. Habilítalos en la configuración del sitio.'
            : 'Permiso de notificaciones pospuesto por el usuario.',
      };
    }

    // 3. Obtener el Token FCM del dispositivo (si Firebase está configurado y soportado)
    const fcmSupported = await isMessagingSupported().catch(() => false);
    if (!fcmSupported || !tieneCredencialesFirebaseValidas()) {
      console.warn(
        '[FCM] Falta configurar firebaseConfig / VAPID_KEY reales en pushNotifications.ts y firebase-messaging-sw.js.'
      );
      return {
        success: false,
        permission,
        message: 'Permiso concedido, pero falta configurar las credenciales de Firebase Messaging.',
      };
    }

    const messaging = getFirebaseMessaging();
    if (!messaging) {
      return {
        success: false,
        permission,
        message: 'No se pudo inicializar Firebase Messaging en este dispositivo.',
      };
    }

    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: swRegistration,
    });

    if (!token) {
      console.warn('[FCM] No se pudo obtener el token de registro del dispositivo.');
      return {
        success: false,
        permission,
        message: 'No se obtuvo token FCM del navegador.',
      };
    }

    localStorage.setItem('primitiva_tordueles_push_token', token);
    localStorage.setItem('primitiva_tordueles_push_subscribed_at', new Date().toISOString());

    // 4. Enviar dniUsuario + token mediante fetch() POST en JSON hacia Google Apps Script
    const endpoint =
      URL_BACKEND_GAS !== 'TU_URL_WEBAPP_GOOGLE_APPS_SCRIPT_AQUI'
        ? URL_BACKEND_GAS
        : backendUrlOverride || '';

    let syncedToBackend = false;
    if (endpoint && endpoint.startsWith('http')) {
      const cleanUrl = endpoint.endsWith('/exe') ? `${endpoint}c` : endpoint;
      const payload = JSON.stringify({
        action: 'registrarTokenFCM',
        dniUsuario: (dniUsuario || '').trim().toUpperCase(),
        token,
        plataforma: navigator.userAgent || 'PWA Web',
      });

      try {
        await fetch(cleanUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'text/plain;charset=utf-8',
          },
          body: payload,
        });
        syncedToBackend = true;
      } catch {
        // Respaldo no-cors para envíos a Google Apps Script desde GitHub Pages / Firebase Hosting
        await fetch(cleanUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: {
            'Content-Type': 'text/plain;charset=utf-8',
          },
          body: payload,
        });
        syncedToBackend = true;
      }
    } else {
      console.warn('[FCM] Token obtenido, pendiente configurar URL_BACKEND_GAS:', token);
    }

    return {
      success: true,
      permission,
      token,
      syncedToBackend,
      message: 'Avisos Push activados en este dispositivo.',
    };
  } catch (error) {
    console.error('[FCM] Error al solicitar permiso o registrar token:', error);
    return {
      success: false,
      permission: Notification.permission || 'default',
      message: 'No se pudieron activar las notificaciones en este dispositivo.',
    };
  }
}

export const pushNotificationService = {
  isSupported(): boolean {
    return typeof window !== 'undefined' && 'Notification' in window;
  },

  getPermission(): NotificationPermission {
    if (!this.isSupported()) return 'denied';
    return Notification.permission;
  },

  async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported()) return 'denied';
    try {
      const permission = await Notification.requestPermission();
      return permission;
    } catch {
      return 'denied';
    }
  },

  async subscribeUserToPush(
    dniUsuario = '',
    backendUrlOverride?: string
  ): Promise<{ success: boolean; token?: string; permission: NotificationPermission }> {
    if (!this.isSupported()) {
      return { success: false, permission: 'denied' };
    }

    try {
      // Intentar flujo completo FCM si las credenciales ya están configuradas
      if (tieneCredencialesFirebaseValidas()) {
        const resFcm = await solicitarPermisoYRegistrarToken(dniUsuario, backendUrlOverride);
        if (resFcm.success) {
          this.sendNotification('🔔 Suscripción Activada - Peña Tordueles', {
            body: 'Recibirás los avisos de boletos sellados y resultados incluso con la app cerrada.',
            icon: './assets/logo.png',
            badge: './assets/logo.png',
          });
          return { success: true, token: resFcm.token, permission: resFcm.permission };
        }
      }

      const permission = await this.requestPermission();
      if (permission !== 'granted') {
        return { success: false, permission };
      }

      let token = localStorage.getItem('primitiva_tordueles_push_token');
      if (!token) {
        token = `tordueles_push_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
        localStorage.setItem('primitiva_tordueles_push_token', token);
        localStorage.setItem('primitiva_tordueles_push_subscribed_at', new Date().toISOString());
      }

      this.sendNotification('🔔 Suscripción Activada - Peña Tordueles', {
        body: 'Has quedado suscrito a las alertas oficiales de los sorteos y resguardos sellados de La Primitiva.',
        icon: './assets/logo.png',
        badge: './assets/logo.png',
      });

      return { success: true, token, permission };
    } catch (err) {
      console.error('[Push] Error en subscribeUserToPush:', err);
      return { success: false, permission: 'denied' };
    }
  },

  sendNotification(title: string, options?: NotificationOptions): boolean {
    if (!this.isSupported() || Notification.permission !== 'granted') {
      return false;
    }

    try {
      const defaultOptions: NotificationOptions = {
        icon: './assets/logo.png',
        badge: './assets/logo.png',
        tag: `primitiva-tordueles-${Date.now()}`,
        ...options,
      };

      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.ready.then(reg => {
          reg.showNotification(title, defaultOptions);
        });
      } else {
        new Notification(title, defaultOptions);
      }
      return true;
    } catch {
      return false;
    }
  },

  sendCustomAlert(title: string, body: string): boolean {
    return this.sendNotification(title, {
      body,
      icon: './assets/logo.png',
      badge: './assets/logo.png',
    });
  },

  notifyTicketValidated(jornada: number, numbers: number[]): void {
    this.sendNotification(`🎟️ Boleto Sellado (Jornada ${jornada})`, {
      body: `El resguardo oficial ha sido validado a las 20:35h. Números jugados: ${numbers.join(', ')}. ¡Mucha suerte!`,
      icon: './assets/logo.png',
      badge: './assets/logo.png',
    });
  },

  notifyScrutinyCompleted(jornada: number, hits: number, prize: number): void {
    this.sendNotification(`🏆 Escrutinio Finalizado (Jornada ${jornada})`, {
      body: `Aciertos: ${hits}. Premio obtenido: ${prize.toFixed(2)} €. Consulta el desglose completo en la app.`,
      icon: './assets/logo.png',
      badge: './assets/logo.png',
    });
  },
};
