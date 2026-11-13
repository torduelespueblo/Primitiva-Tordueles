/**
 * Servicio de Inteligencia Artificial para la Peña Primitiva Tordueles
 * Utiliza MAJOR_CAPABILITY_SERVER_SIDE_GEMINI_API mediante el endpoint backend /api/extract-ticket
 * para analizar imágenes o documentos PDF de boletos oficiales y extraer automáticamente
 * los números jugados, reintegro, coste y jornada correspondiente.
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
 * Optimiza y redimensiona imágenes grandes del móvil para conservar nitidez OCR
 * sin saturar el límite de almacenamiento local ni el envío al servidor.
 */
export async function optimizeTicketImageToDataUrl(
  file: File,
  maxDimension = 1400,
  quality = 0.86
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('No se pudo leer la imagen seleccionada.'));
    reader.onload = () => {
      const dataUrl = reader.result as string;
      if (!file.type.startsWith('image/')) {
        resolve(dataUrl);
        return;
      }

      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDimension || height > maxDimension) {
          const ratio = Math.min(maxDimension / width, maxDimension / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(dataUrl);
          return;
        }
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  });
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
 * (vía endpoint backend seguro /api/extract-ticket)
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
        ? 'El servicio de lectura con IA no está disponible en alojamiento estático (como GitHub Pages). La imagen del resguardo sí se adjuntará para los jugadores; introduce la combinación manualmente abajo.'
        : `Error en el servidor al analizar con IA (${response.status}).`;
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

export const extractTicketWithAI = processTicketWithAI;
