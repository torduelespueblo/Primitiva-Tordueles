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

  async subscribeUserToPush(): Promise<{ success: boolean; token?: string; permission: NotificationPermission }> {
    if (!this.isSupported()) {
      return { success: false, permission: 'denied' };
    }

    try {
      const permission = await this.requestPermission();
      if (permission !== 'granted') {
        return { success: false, permission };
      }

      // Generar o recuperar token persistente de suscripción push del dispositivo
      let token = localStorage.getItem('primitiva_tordueles_push_token');
      if (!token) {
        token = `tordueles_push_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
        localStorage.setItem('primitiva_tordueles_push_token', token);
        localStorage.setItem('primitiva_tordueles_push_subscribed_at', new Date().toISOString());
      }

      // Notificación de confirmación de suscripción exitosa
      this.sendNotification('🔔 Suscripción Activada - Peña Tordueles', {
        body: 'Has quedado suscrito a las alertas oficiales de los sorteos y resguardos sellados de La Primitiva.',
        icon: './pwa-192x192.png',
      });

      return { success: true, token, permission };
    } catch {
      return { success: false, permission: 'denied' };
    }
  },

  sendNotification(title: string, options?: NotificationOptions): boolean {
    if (!this.isSupported() || Notification.permission !== 'granted') {
      return false;
    }

    try {
      const defaultOptions: NotificationOptions = {
        icon: './pwa-192x192.png',
        badge: './pwa-192x192.png',
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
      icon: './pwa-192x192.png',
      badge: './pwa-192x192.png',
    });
  },

  notifyTicketValidated(jornada: number, numbers: number[]): void {
    this.sendNotification(
      `🎟️ Boleto Sellado (Jornada ${jornada})`,
      {
        body: `El resguardo oficial ha sido validado a las 20:35h. Números jugados: ${numbers.join(', ')}. ¡Mucha suerte!`,
        icon: './pwa-192x192.png',
      }
    );
  },

  notifyScrutinyCompleted(jornada: number, hits: number, prize: number): void {
    this.sendNotification(
      `🏆 Escrutinio Finalizado (Jornada ${jornada})`,
      {
        body: `Aciertos: ${hits}. Premio obtenido: ${prize.toFixed(2)} €. Consulta el desglose completo en la app.`,
        icon: './pwa-192x192.png',
      }
    );
  },
};
