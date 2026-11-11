/**
 * Servicio de Inteligencia Artificial para la Peña Primitiva Tordueles
 * Utiliza el capability MAJOR_CAPABILITY_SERVER_SIDE_GEMINI_API mediante el endpoint backend /api/extract-ticket
 * para analizar imágenes o documentos PDF de boletos oficiales y extraer automáticamente
 * los números jugados y la jornada correspondiente.
 */

export interface ExtractedTicketData {
  numbers: number[];
  jornada?: number | null;
  reintegro?: number | null;
  cost?: number | null;
  drawDate?: string | null;
  joker?: boolean;
  betType?: string;
  notes?: string;
}

export interface TicketExtractionResponse {
  success: boolean;
  data?: ExtractedTicketData;
  error?: string;
}

/**
 * Convierte un archivo File o Blob a base64 limpio (sin el prefijo data:...;base64,)
 */
export async function fileToBase64(file: File | Blob): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const commaIndex = result.indexOf(',');
      const base64 = commaIndex !== -1 ? result.substring(commaIndex + 1) : result;
      resolve({
        base64,
        mimeType: file.type || 'image/jpeg',
      });
    };
    reader.onerror = () => reject(new Error('Error al leer el archivo'));
    reader.readAsDataURL(file);
  });
}

/**
 * Procesa una imagen o PDF de un boleto mediante la API de Gemini
 * (vía endpoint backend seguro con MAJOR_CAPABILITY_SERVER_SIDE_GEMINI_API)
 * para extraer automáticamente los números jugados y la jornada, devolviendo un objeto JSON
 * para actualizar el estado de la aplicación.
 *
 * @param fileOrBase64 - Archivo File/Blob o string en base64 de la imagen/PDF del resguardo
 * @param customMimeType - Tipo MIME opcional si se pasa directamente un string base64
 * @returns Promesa con TicketExtractionResponse conteniendo { numbers, jornada, ... }
 */
export async function processTicketWithAI(
  fileOrBase64: File | Blob | string,
  customMimeType?: string
): Promise<TicketExtractionResponse> {
  try {
    let base64 = '';
    let mimeType = customMimeType || 'image/jpeg';

    if (typeof fileOrBase64 === 'string') {
      if (fileOrBase64.includes(',')) {
        const parts = fileOrBase64.split(',');
        const mimeMatch = parts[0].match(/:(.*?);/);
        if (mimeMatch && mimeMatch[1]) {
          mimeType = mimeMatch[1];
        }
        base64 = parts[1];
      } else {
        base64 = fileOrBase64;
      }
    } else {
      const converted = await fileToBase64(fileOrBase64);
      base64 = converted.base64;
      mimeType = converted.mimeType;
    }

    const response = await fetch('/api/extract-ticket', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fileBase64: base64,
        mimeType,
      }),
    });

    if (!response.ok) {
      const errJson = await response.json().catch(() => ({}));
      const defaultMsg = response.status === 404
        ? 'El endpoint backend de extracción con IA no está disponible en este servidor estático (GitHub Pages). Introduce los números manualmente o utiliza el servidor Node.js.'
        : `Error en el servidor al procesar con IA (${response.status})`;
      return {
        success: false,
        error: errJson.error || defaultMsg,
      };
    }

    const json = await response.json();
    if (json.success && json.data) {
      return {
        success: true,
        data: json.data as ExtractedTicketData,
      };
    }

    return {
      success: false,
      error: json.error || 'No se pudieron extraer datos del boleto con Gemini.',
    };
  } catch (err: unknown) {
    const errorMsg =
      err instanceof Error ? err.message : 'Error de comunicación con el servicio de IA';
    return {
      success: false,
      error: errorMsg,
    };
  }
}

/**
 * Alias para compatibilidad de nomenclatura
 */
export const extractTicketWithAI = processTicketWithAI;
