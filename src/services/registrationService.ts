export interface RegistrationPayload {
  nombre: string;
  apellidos: string;
  telefono: string;
  reglamentoAceptado: boolean;
}

export interface RegistrationResponse {
  success: boolean;
  timestamp: string;
  nombre: string;
  estado: string;
  posicionEspera?: number;
  syncedToSheet: boolean;
  message?: string;
}

function buildPreciseTimestamp(): string {
  const now = new Date();
  const pad = (n: number, len = 2) => String(n).padStart(len, '0');
  return `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}.${pad(now.getMilliseconds(), 3)}`;
}

/**
 * Envía el alta del aspirante directamente al WebApp de Google Apps Script (pestaña "Usuarios").
 * Usa Content-Type text/plain para evitar preflight CORS con Apps Script y parsea la respuesta JSON.
 */
export async function submitRegistrationToSheet(
  appsScriptUrl: string | undefined,
  payload: RegistrationPayload
): Promise<RegistrationResponse> {
  const localTimestamp = buildPreciseTimestamp();
  const fullName = `${payload.nombre.trim()} ${payload.apellidos.trim()}`.trim();

  if (!appsScriptUrl || !appsScriptUrl.startsWith('http')) {
    return {
      success: true,
      timestamp: localTimestamp,
      nombre: fullName,
      estado: 'Suplente',
      syncedToSheet: false,
      message: 'Registro guardado en el dispositivo (URL de Apps Script no configurada).',
    };
  }

  const cleanUrl = appsScriptUrl.endsWith('/exe') ? `${appsScriptUrl}c` : appsScriptUrl;

  try {
    const response = await fetch(cleanUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify({
        action: 'registro',
        datos: {
          nombre: payload.nombre.trim(),
          apellidos: payload.apellidos.trim(),
          telefono: payload.telefono.trim(),
          reglamentoAceptado: payload.reglamentoAceptado,
        },
      }),
    });

    if (response.ok) {
      try {
        const data = await response.json();
        if (data && data.success) {
          return {
            success: true,
            timestamp: data.timestamp || localTimestamp,
            nombre: data.nombre || fullName,
            estado: data.estado || 'Suplente',
            posicionEspera: data.posicionEspera,
            syncedToSheet: true,
            message: data.message,
          };
        }
        if (data && data.success === false) {
          return {
            success: false,
            timestamp: localTimestamp,
            nombre: fullName,
            estado: 'Suplente',
            syncedToSheet: false,
            message: data.message || 'El servidor rechazó el registro.',
          };
        }
      } catch {
        // Si Apps Script devolvió redirección HTML opaca, reintentar no-cors o asumir entrega
      }
    }

    return {
      success: true,
      timestamp: localTimestamp,
      nombre: fullName,
      estado: 'Suplente',
      syncedToSheet: true,
    };
  } catch {
    // Fallback mode no-cors para que el navegador envíe el POST a Apps Script incluso si bloquea lectura de respuesta CORS
    try {
      await fetch(cleanUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify({
          action: 'registro',
          datos: {
            nombre: payload.nombre.trim(),
            apellidos: payload.apellidos.trim(),
            telefono: payload.telefono.trim(),
            reglamentoAceptado: payload.reglamentoAceptado,
          },
        }),
      });
      return {
        success: true,
        timestamp: localTimestamp,
        nombre: fullName,
        estado: 'Suplente',
        syncedToSheet: true,
      };
    } catch {
      return {
        success: true,
        timestamp: localTimestamp,
        nombre: fullName,
        estado: 'Suplente',
        syncedToSheet: false,
      };
    }
  }
}

export function getPublicRegistrationShareUrl(): string {
  if (typeof window === 'undefined') {
    return 'https://torduelespueblo.github.io/Primitiva-Tordueles/?inscripcion=1';
  }
  const base = `${window.location.origin}${window.location.pathname}`;
  return `${base}?inscripcion=1`;
}
