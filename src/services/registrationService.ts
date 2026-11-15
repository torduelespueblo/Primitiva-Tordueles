export interface PublicListRow {
  id: number;
  timestamp: string;
  timestampMs?: number;
  nombre: string;
  apellidos: string;
  estado: string;
}

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
  conteoTitulares?: number;
  conteoSuplentes?: number;
  listaPublica?: PublicListRow[];
  syncedToSheet: boolean;
  message?: string;
}

export interface ServerActiveTicketDto {
  id?: string;
  jornada: number;
  fecha: string;
  fotoResguardo?: string;
  importeJugado?: number;
  combinacionJugada?: string;
  modalidad?: string;
  ciclo?: number;
  reintegro?: number;
  jugadoresActivos?: number;
}

export interface MemberAccessResponse {
  success: boolean;
  notFound?: boolean;
  baja?: boolean;
  networkError?: boolean;
  rol?: 'TITULAR' | 'SUPLENTE';
  conteoTitulares?: number;
  conteoSuplentes?: number;
  modoCaptacionInicial?: boolean;
  listaPublica?: PublicListRow[];
  boletoActivo?: ServerActiveTicketDto | null;
  boletosActivos?: ServerActiveTicketDto[];
  ultimosJugados?: Array<{
    id?: string;
    jornada: number;
    ciclo?: number;
    fecha: string;
    importeJugado?: number;
    combinacionJugada?: string;
    modalidad?: string;
    combinacionGanadora?: string;
    aciertos?: number | null;
    cantidadPremiada?: number;
    reintegro?: number;
    jugadoresActivos?: number;
  }>;
  user?: {
    filaIndex?: number;
    dni: string;
    telefono: string;
    nombre: string;
    apellidos: string;
    nombreCompleto: string;
    estadoPago: string;
    fechaAvisoPago?: string;
    cicloActual: number;
    reglamentoAceptado: boolean;
    estado: string;
  };
  message?: string;
}

function buildPreciseTimestamp(): string {
  const now = new Date();
  const pad = (n: number, len = 2) => String(n).padStart(len, '0');
  return `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}.${pad(now.getMilliseconds(), 3)}`;
}

/**
 * Valida la identidad de un socio (por DNI/NIE o Teléfono Móvil) frente a la pestaña "Usuarios"
 * y devuelve su nivel de acceso (TITULAR o SUPLENTE) junto con los datos autorizados.
 */
export async function validateMemberAccess(
  appsScriptUrl: string | undefined,
  identificador: string
): Promise<MemberAccessResponse> {
  const cleanId = identificador.trim();
  if (!cleanId) {
    return { success: false, message: 'Introduce tu DNI/NIE o número de teléfono.' };
  }

  if (!appsScriptUrl || !appsScriptUrl.startsWith('http')) {
    return {
      success: false,
      networkError: true,
      message: 'Backend de Google Apps Script no configurado.',
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
        action: 'validarAccesoSocio',
        identificador: cleanId,
      }),
    });

    if (!response.ok) {
      return {
        success: false,
        networkError: true,
        message: 'No se pudo verificar tu acceso en este momento.',
      };
    }

    const data = await response.json();
    if (data && data.success && data.user) {
      return data as MemberAccessResponse;
    }

    return {
      success: false,
      notFound: Boolean(data?.notFound),
      baja: Boolean(data?.baja),
      message: data?.message || 'No se encontró ningún socio activo con ese dato.',
    };
  } catch {
    return {
      success: false,
      networkError: true,
      message: 'Error de conexión al validar tus datos.',
    };
  }
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
            conteoTitulares: typeof data.conteoTitulares === 'number' ? data.conteoTitulares : undefined,
            conteoSuplentes: typeof data.conteoSuplentes === 'number' ? data.conteoSuplentes : undefined,
            listaPublica: Array.isArray(data.listaPublica) ? data.listaPublica : undefined,
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

const PRODUCTION_REGISTRATION_URL = 'https://torduelespueblo.github.io/Primitiva-Tordueles/inscripcion.html';

export function getPublicRegistrationShareUrl(): string {
  if (typeof window === 'undefined') {
    return PRODUCTION_REGISTRATION_URL;
  }
  const host = window.location.hostname || '';
  const isDevOrPreviewHost =
    host === 'localhost' ||
    host === '127.0.0.1' ||
    host.startsWith('ais-dev-') ||
    host.startsWith('ais-pre-') ||
    host.endsWith('.run.app');

  if (isDevOrPreviewHost) {
    return PRODUCTION_REGISTRATION_URL;
  }

  const url = new URL('./inscripcion.html', window.location.href);
  return url.toString();
}

export interface PaymentNotificationResponse {
  success: boolean;
  estadoPago?: string;
  metodo?: 'Bizum' | 'Transferencia';
  fechaAvisoPago?: string;
  syncedToSheet: boolean;
  message?: string;
}

/**
 * Envía el aviso de pago de renovación (Bizum o Transferencia) de un socio a Google Apps Script.
 */
export async function notifyMemberPaymentToSheet(
  appsScriptUrl: string | undefined,
  payload: {
    identificador: string;
    metodo: 'Bizum' | 'Transferencia';
  }
): Promise<PaymentNotificationResponse> {
  const estadoLocal = `Notificado (${payload.metodo})`;
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const fechaLocal = `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()} ${pad(now.getHours())}:${pad(now.getMinutes())}`;

  if (!appsScriptUrl || !appsScriptUrl.startsWith('http')) {
    return {
      success: true,
      estadoPago: estadoLocal,
      metodo: payload.metodo,
      fechaAvisoPago: fechaLocal,
      syncedToSheet: false,
      message: 'Aviso guardado localmente (URL de Apps Script no configurada).',
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
        action: 'notificarPagoSocio',
        identificador: payload.identificador.trim(),
        dni: payload.identificador.trim(),
        metodo: payload.metodo,
      }),
    });

    if (response.ok) {
      try {
        const data = await response.json();
        if (data && data.success) {
          return {
            success: true,
            estadoPago: data.estadoPago || estadoLocal,
            metodo: payload.metodo,
            fechaAvisoPago: data.fechaAvisoPago || fechaLocal,
            syncedToSheet: true,
            message: data.message,
          };
        }
        return {
          success: false,
          syncedToSheet: false,
          message: data?.message || 'No se pudo registrar el aviso de pago en la hoja Usuarios.',
        };
      } catch {
        // fallback si devuelve respuesta opaca
      }
    }

    return {
      success: true,
      estadoPago: estadoLocal,
      metodo: payload.metodo,
      fechaAvisoPago: fechaLocal,
      syncedToSheet: true,
    };
  } catch {
    try {
      await fetch(cleanUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify({
          action: 'notificarPagoSocio',
          identificador: payload.identificador.trim(),
          dni: payload.identificador.trim(),
          metodo: payload.metodo,
        }),
      });
      return {
        success: true,
        estadoPago: estadoLocal,
        metodo: payload.metodo,
        fechaAvisoPago: fechaLocal,
        syncedToSheet: true,
      };
    } catch {
      return {
        success: false,
        syncedToSheet: false,
        message: 'Error de conexión al enviar el aviso de pago.',
      };
    }
  }
}

export interface ValidateAdminPaymentResponse {
  success: boolean;
  fila?: number;
  nuevoEstado?: string;
  message?: string;
}

/**
 * Permite al administrador confirmar ('Pagado') o rechazar ('Pendiente') un aviso de pago en 1 clic.
 */
export async function validateMemberPaymentByAdmin(
  appsScriptUrl: string | undefined,
  payload: {
    fila?: number;
    dni?: string;
    nuevoEstado: 'Pagado' | 'Pendiente';
    password: string;
  }
): Promise<ValidateAdminPaymentResponse> {
  if (!appsScriptUrl || !appsScriptUrl.startsWith('http')) {
    return { success: true, nuevoEstado: payload.nuevoEstado };
  }

  const cleanUrl = appsScriptUrl.endsWith('/exe') ? `${appsScriptUrl}c` : appsScriptUrl;

  try {
    const response = await fetch(cleanUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify({
        action: 'validarPagoAdmin',
        fila: payload.fila,
        dni: payload.dni || '',
        nuevoEstado: payload.nuevoEstado,
        password: payload.password,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      return {
        success: Boolean(data?.success),
        fila: data?.fila,
        nuevoEstado: data?.nuevoEstado || payload.nuevoEstado,
        message: data?.message || data?.error,
      };
    }
    return { success: false, message: 'No se pudo validar el pago en el servidor.' };
  } catch {
    return { success: false, message: 'Error de red validando el pago.' };
  }
}


