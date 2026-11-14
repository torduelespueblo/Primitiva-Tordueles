import { TicketDraw } from '../types/lottery';

/**
 * Calcula la fecha más próxima de sorteo de La Primitiva (Lunes=1, Jueves=4, Sábado=6)
 * en formato YYYY-MM-DD (hora local).
 */
export function getNextPrimitivaDrawDate(fromDate: Date = new Date()): string {
  const candidate = new Date(fromDate);
  // Si hoy es día de sorteo pero ya pasaron las 21:30, pasar al siguiente día
  const hour = candidate.getHours();
  const minute = candidate.getMinutes();
  const currentDay = candidate.getDay();
  const isDrawDay = currentDay === 1 || currentDay === 4 || currentDay === 6;

  if (isDrawDay && (hour > 21 || (hour === 21 && minute >= 30))) {
    candidate.setDate(candidate.getDate() + 1);
  }

  for (let i = 0; i < 7; i++) {
    const day = candidate.getDay();
    if (day === 1 || day === 4 || day === 6) {
      const y = candidate.getFullYear();
      const m = String(candidate.getMonth() + 1).padStart(2, '0');
      const d = String(candidate.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
    candidate.setDate(candidate.getDate() + 1);
  }

  const y = fromDate.getFullYear();
  const m = String(fromDate.getMonth() + 1).padStart(2, '0');
  const d = String(fromDate.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Determina si un boleto ya debe mostrarse a los socios en la App.
 * Si tiene programación futura (publishStatus === 'PROGRAMADO' y ahora < publishAt), devuelve false.
 */
export function isTicketPublishedNow(ticket: TicketDraw, now: Date = new Date()): boolean {
  if (ticket.isScrutinized) return true;

  if (ticket.publishAt) {
    const publishDate = new Date(ticket.publishAt);
    if (!isNaN(publishDate.getTime())) {
      return now.getTime() >= publishDate.getTime();
    }
  }

  return ticket.publishStatus !== 'PROGRAMADO';
}

export function formatScheduledDateTimeLabel(publishAt?: string, fallbackDate?: string): string {
  if (publishAt) {
    const dt = new Date(publishAt);
    if (!isNaN(dt.getTime())) {
      const datePart = dt.toLocaleDateString('es-ES', {
        weekday: 'long',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
      const timePart = dt.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
      });
      return `${datePart.charAt(0).toUpperCase() + datePart.slice(1)} a las ${timePart} h`;
    }
  }
  return fallbackDate || 'Día del sorteo a las 20:35 h';
}

export interface ScheduleTicketAppsScriptPayload {
  id: string;
  ciclo: number;
  jornada: number;
  fechaSorteo: string; // YYYY-MM-DD
  horaPublicacion: string; // HH:mm
  publicarAhora: boolean;
  combinacion: string;
  reintegro: number;
  importe: number;
  jugadoresActivos: number;
  imagenBase64?: string;
  imagenUrl?: string;
  fileName?: string;
}

export async function syncTicketWithAppsScript(
  googleAppsScriptUrl: string | undefined,
  payload: ScheduleTicketAppsScriptPayload
): Promise<{ success: boolean; synced: boolean; driveImageUrl?: string; message?: string }> {
  const endpoint = (googleAppsScriptUrl || '').trim();
  if (!endpoint) {
    return {
      success: false,
      synced: false,
      message: 'Falta la URL de Google Apps Script en Ajustes.',
    };
  }

  const cleanEndpoint = endpoint.endsWith('/exe') ? `${endpoint}c` : endpoint;

  try {
    const res = await fetch(cleanEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify({
        action: 'programarBoleto',
        datos: payload,
      }),
    });

    if (!res.ok) {
      return {
        success: false,
        synced: false,
        message: `Apps Script devolvió HTTP ${res.status}`,
      };
    }

    const text = await res.text();
    try {
      const json = JSON.parse(text);
      return {
        success: Boolean(json.success),
        synced: Boolean(json.success),
        driveImageUrl: json.driveImageUrl,
        message: json.message,
      };
    } catch {
      return {
        success: true,
        synced: true,
        message: 'Sincronizado con Google Apps Script.',
      };
    }
  } catch (err) {
    return {
      success: false,
      synced: false,
      message: err instanceof Error ? err.message : 'No se pudo conectar con Apps Script.',
    };
  }
}

/**
 * Extrae el ID de archivo de cualquier URL de Google Drive
 * (uc?export=view, uc?export=download, /file/d/ID/view, open?id=, thumbnail?id=, lh3/d/ID).
 */
export function extractGoogleDriveFileId(rawUrl: string | undefined | null): string | null {
  const url = String(rawUrl || '').trim();
  if (!url || url.startsWith('data:')) return null;

  const isDriveOrGoogleUser =
    /drive\.google\.com|drive\.usercontent\.google\.com|lh\d+\.googleusercontent\.com/i.test(url);
  if (!isDriveOrGoogleUser) return null;

  const matchPath = url.match(/\/(?:file\/)?d\/([a-zA-Z0-9_-]{10,})/);
  if (matchPath && matchPath[1]) return matchPath[1];

  const matchQuery = url.match(/[?&]id=([a-zA-Z0-9_-]{10,})/);
  if (matchQuery && matchQuery[1]) return matchQuery[1];

  return null;
}

/**
 * Convierte enlaces antiguos o de vista de Google Drive (/uc?export=view, /file/d/.../view)
 * a una URL directa compatible con <img> en navegadores móviles modernos.
 */
export function normalizeReceiptImageUrl(rawUrl: string | undefined | null): string {
  const url = String(rawUrl || '').trim();
  if (!url) return '';
  if (url.startsWith('data:')) return url;

  const fileId = extractGoogleDriveFileId(url);
  if (fileId) {
    return `https://drive.google.com/thumbnail?id=${fileId}&sz=w1600`;
  }
  return url;
}

/**
 * Devuelve la lista ordenada de URLs candidatas para cargar un resguardo alojado en Google Drive.
 */
export function getReceiptImageCandidates(rawUrl: string | undefined | null): string[] {
  const url = String(rawUrl || '').trim();
  if (!url) return [];
  if (url.startsWith('data:')) return [url];

  const fileId = extractGoogleDriveFileId(url);
  if (!fileId) return [url];

  const candidates = [
    `https://drive.google.com/thumbnail?id=${fileId}&sz=w1600`,
    `https://lh3.googleusercontent.com/d/${fileId}=w1600`,
    `https://drive.usercontent.google.com/download?id=${fileId}&export=view`,
    `https://drive.google.com/uc?export=view&id=${fileId}`,
    url,
  ];

  return Array.from(new Set(candidates));
}

export function getGoogleDriveViewerUrl(rawUrl: string | undefined | null): string {
  const url = String(rawUrl || '').trim();
  const fileId = extractGoogleDriveFileId(url);
  if (fileId) {
    return `https://drive.google.com/file/d/${fileId}/view`;
  }
  return url;
}

/**
 * Solicita al backend de Apps Script el data URI Base64 de un resguardo en Drive
 * como último respaldo si el navegador bloquea la carga directa desde googleusercontent/drive.
 */
export async function fetchReceiptImageViaAppsScript(
  googleAppsScriptUrl: string | undefined,
  fileId: string
): Promise<string | null> {
  const endpoint = (googleAppsScriptUrl || '').trim();
  if (!endpoint || !fileId) return null;
  const cleanEndpoint = endpoint.endsWith('/exe') ? `${endpoint}c` : endpoint;

  try {
    const url = new URL(cleanEndpoint);
    url.searchParams.set('api', 'true');
    url.searchParams.set('action', 'imagenResguardo');
    url.searchParams.set('id', fileId);

    const res = await fetch(url.toString());
    if (!res.ok) return null;
    const json = await res.json();
    if (json && json.success && typeof json.dataUrl === 'string' && json.dataUrl.startsWith('data:')) {
      return json.dataUrl;
    }
    return null;
  } catch {
    return null;
  }
}

