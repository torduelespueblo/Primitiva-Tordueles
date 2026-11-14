/**
 * ============================================================================
 * PEÑA PRIMITIVA TORDUELES - SERVICE WORKER DE MENSAJERÍA (FCM)
 * Archivo: firebase-messaging-sw.js (ubicar en la raíz del dominio)
 * ============================================================================
 * Gestiona la recepción de notificaciones Push en segundo plano (cuando la app
 * está cerrada o el móvil bloqueado) y la apertura directa de la WebApp al pulsar.
 */

// 1. Importar scripts oficiales de Firebase (versión compat para Service Workers)
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js');

// 2. Configuración Web de tu proyecto Firebase (pegar aquí tus credenciales)
const firebaseConfig = {
  apiKey: 'AIzaSyDx3JuAZHh5M77DMEWMnpp4GfeXD8DbbCM',
  authDomain: 'primitiva-tordueles.firebaseapp.com',
  projectId: 'primitiva-tordueles',
  storageBucket: 'primitiva-tordueles.firebasestorage.app',
  messagingSenderId: '1062885378437',
  appId: '1:1062885378437:web:7f4f69969fab71d8d75cec',
};

// Ruta oficial de la WebApp que se abrirá al pulsar la notificación
const WEBAPP_URL = self.location.origin + '/';

// Verificar que las credenciales han sido rellenadas antes de inicializar
const credencialesConfiguradas =
  firebaseConfig.apiKey &&
  firebaseConfig.apiKey !== 'TU_API_KEY_AQUI' &&
  firebaseConfig.messagingSenderId !== 'TU_MESSAGING_SENDER_ID';

if (credencialesConfiguradas) {
  firebase.initializeApp(firebaseConfig);

  const messaging = firebase.messaging();

  // 3. Recepción de notificaciones en segundo plano (app cerrada / móvil bloqueado)
  messaging.onBackgroundMessage((payload) => {
    const notificationTitle =
      (payload.notification && payload.notification.title) ||
      (payload.data && payload.data.title) ||
      'Peña Primitiva Tordueles';

    const notificationBody =
      (payload.notification && payload.notification.body) ||
      (payload.data && payload.data.body) ||
      'Tienes un nuevo aviso oficial de la peña.';

    const targetUrl =
      (payload.fcmOptions && payload.fcmOptions.link) ||
      (payload.data && payload.data.url) ||
      WEBAPP_URL;

    const notificationOptions = {
      body: notificationBody,
      icon: 'assets/logo.png',
      badge: 'assets/logo.png',
      tag: (payload.data && payload.data.tag) || 'tordueles-push-' + Date.now(),
      renotify: true,
      requireInteraction: false,
      vibrate: [200, 100, 200],
      data: {
        url: targetUrl,
      },
    };

    return self.registration.showNotification(notificationTitle, notificationOptions);
  });
} else {
  console.info(
    '[FCM SW] Pendiente configurar firebaseConfig en /firebase-messaging-sw.js para activar Push en segundo plano.'
  );
}

// 4. Evento al pulsar la notificación en el móvil: enfocar o abrir la WebApp
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const urlDestino =
    (event.notification && event.notification.data && event.notification.data.url) ||
    WEBAPP_URL;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url.startsWith(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlDestino);
      }
      return undefined;
    })
  );
});
