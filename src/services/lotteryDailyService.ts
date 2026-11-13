/**
 * Servicio de consulta en tiempo real del Boletín Diario Oficial de Loterías (SELAE + ONCE)
 * a través del backend de Google Apps Script (sin datos simulados ni estáticos).
 */

export interface LiveBulletinResponse {
  success: boolean;
  dateFormatted: string;
  dayOfWeek: string;
  formattedWhatsAppMessage: string;
  gamesCount: number;
  error?: string;
}

/**
 * Solicita a Google Apps Script la compilación EN VIVO de los resultados reales de hoy
 * (Loterías y Apuestas del Estado + JuegosONCE).
 */
export async function fetchLiveDailyBulletinFromAppsScript(
  appsScriptUrl: string | undefined,
  sendToWhatsApp = false
): Promise<LiveBulletinResponse> {
  if (!appsScriptUrl || !appsScriptUrl.startsWith('http')) {
    return {
      success: false,
      dateFormatted: '',
      dayOfWeek: '',
      formattedWhatsAppMessage: '',
      gamesCount: 0,
      error: 'Configura primero la URL del WebApp de Google Apps Script en el Panel de Administrador.',
    };
  }

  const cleanUrl = appsScriptUrl.endsWith('/exe') ? `${appsScriptUrl}c` : appsScriptUrl;

  try {
    const url = new URL(cleanUrl);
    url.searchParams.set('api', 'true');
    url.searchParams.set('action', sendToWhatsApp ? 'enviarBoletin' : 'boletinDiario');

    const response = await fetch(url.toString(), { method: 'GET' });
    if (!response.ok) {
      return {
        success: false,
        dateFormatted: '',
        dayOfWeek: '',
        formattedWhatsAppMessage: '',
        gamesCount: 0,
        error: `El servidor Apps Script devolvió HTTP ${response.status}. Verifica que esté publicada la nueva versión.`,
      };
    }

    const data = await response.json();
    if (!data || data.success === false || !data.formattedWhatsAppMessage) {
      return {
        success: false,
        dateFormatted: data?.dateFormatted || '',
        dayOfWeek: data?.dayOfWeek || '',
        formattedWhatsAppMessage: data?.formattedWhatsAppMessage || '',
        gamesCount: data?.gamesCount || 0,
        error:
          data?.error ||
          data?.message ||
          'No se pudieron obtener resultados reales en vivo todavía (es posible que los sorteos de hoy aún no se hayan publicado o falte actualizar el código en Apps Script).',
      };
    }

    return {
      success: true,
      dateFormatted: data.dateFormatted || '',
      dayOfWeek: data.dayOfWeek || '',
      formattedWhatsAppMessage: data.formattedWhatsAppMessage,
      gamesCount: Number(data.gamesCount) || 0,
    };
  } catch (err) {
    return {
      success: false,
      dateFormatted: '',
      dayOfWeek: '',
      formattedWhatsAppMessage: '',
      gamesCount: 0,
      error:
        err instanceof Error
          ? `No se pudo conectar con Apps Script (${err.message}). Asegúrate de haber desplegado la última versión de WebApp.gs y Code.gs.`
          : 'Error de conexión al consultar resultados reales en Apps Script.',
    };
  }
}
