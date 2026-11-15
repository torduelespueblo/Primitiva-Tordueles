import { createWorker, PSM } from 'tesseract.js';

/**
 * Servicio híbrido de extracción OCR + IA para la Peña Primitiva Tordueles.
 * Combina preprocesamiento en Canvas (escala de grises, contraste +40% y binarizado),
 * Tesseract.js configurado con lista blanca numérica ('0123456789 ') y respaldo /api/extract-ticket.
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
 * Convierte un File, Blob o DataURL a DataURL utilizable por <img>.
 */
async function resolveImageDataUrl(source: File | Blob | string): Promise<string> {
  if (typeof source === 'string') {
    if (source.startsWith('data:') || source.startsWith('http') || source.startsWith('blob:')) {
      return source;
    }
    return `data:image/jpeg;base64,${source}`;
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('No se pudo leer la imagen para OCR.'));
    reader.readAsDataURL(source);
  });
}

/**
 * Preprocesa la imagen en un <canvas> oculto antes de enviarla al motor OCR:
 * 1. Escala de grises
 * 2. Aumento de contraste (+40 %)
 * 3. Binarización / umbralizado (Otsu) para eliminar sombras y reflejos del papel térmico
 */
export async function preprocessTicketImageForOCR(
  imageSource: File | Blob | string
): Promise<string> {
  const dataUrl = await resolveImageDataUrl(imageSource);

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const targetMax = 1600;
      const targetMin = 1000;
      let width = img.naturalWidth || img.width || 1000;
      let height = img.naturalHeight || img.height || 1000;

      const longest = Math.max(width, height);
      if (longest > targetMax) {
        const ratio = targetMax / longest;
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      } else if (longest < targetMin && longest > 0) {
        const ratio = Math.min(2, targetMin / longest);
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

      const imageData = ctx.getImageData(0, 0, width, height);
      const data = imageData.data;
      const totalPixels = width * height;
      const grayValues = new Uint8ClampedArray(totalPixels);
      const histogram = new Uint32Array(256);

      // 1. Escala de grises + 2. Aumento de contraste (+40%)
      const contrastFactor = 1.4;
      for (let i = 0, p = 0; i < data.length; i += 4, p++) {
        const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        const contrasted = (gray - 128) * contrastFactor + 128;
        const clamped = contrasted < 0 ? 0 : contrasted > 255 ? 255 : Math.round(contrasted);
        grayValues[p] = clamped;
        histogram[clamped]++;
      }

      // 3. Cálculo automático del umbral óptimo (Otsu) + Binarización
      let sumTotal = 0;
      for (let t = 0; t < 256; t++) {
        sumTotal += t * histogram[t];
      }

      let sumBg = 0;
      let weightBg = 0;
      let maxVariance = -1;
      let threshold = 128;

      for (let t = 0; t < 256; t++) {
        weightBg += histogram[t];
        if (weightBg === 0) continue;
        const weightFg = totalPixels - weightBg;
        if (weightFg === 0) break;

        sumBg += t * histogram[t];
        const meanBg = sumBg / weightBg;
        const meanFg = (sumTotal - sumBg) / weightFg;
        const varianceBetween = weightBg * weightFg * (meanBg - meanFg) * (meanBg - meanFg);
        if (varianceBetween > maxVariance) {
          maxVariance = varianceBetween;
          threshold = t;
        }
      }

      // Sesgo ligero para proteger trazos finos de impresora térmica
      const finalThreshold = Math.min(220, Math.max(60, threshold - 6));

      for (let i = 0, p = 0; i < data.length; i += 4, p++) {
        const bin = grayValues[p] >= finalThreshold ? 255 : 0;
        data[i] = bin;
        data[i + 1] = bin;
        data[i + 2] = bin;
        data[i + 3] = 255;
      }

      ctx.putImageData(imageData, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => reject(new Error('No se pudo cargar la imagen en Canvas para preprocesado OCR.'));
    img.src = dataUrl;
  });
}

/**
 * Filtra el texto devuelto por Tesseract extrayendo exclusivamente números válidos
 * de La Primitiva (01 al 49), descartando fechas, importes o códigos de barras,
 * y devolviéndolos ordenados de menor a mayor sin duplicados.
 */
export function extractPrimitivaNumbersFromOcrText(rawText: string): number[] {
  const lines = String(rawText || '')
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(Boolean);

  const lineCandidates: number[][] = [];

  for (const rawLine of lines) {
    // Descartar líneas que contienen años (2020-2039) o códigos de barras largos (>= 5 dígitos)
    if (/\b20[2-3]\d\b/.test(rawLine) || /\b\d{5,}\b/.test(rawLine)) {
      continue;
    }

    // Eliminar importes decimales (ej. "44 00" o "14 00") y números de >=3 cifras (sorteo, año, serie)
    let cleaned = rawLine
      .replace(/\b\d{1,3}[,\.]\d{2}\b/g, ' ')
      .replace(/\b\d+\s+00\b/g, ' ')
      .replace(/\b\d{3,}\b/g, ' ');

    const tokens = cleaned.match(/\b\d{1,2}\b/g) || [];
    const validOnLine: number[] = [];
    for (const tok of tokens) {
      const n = parseInt(tok, 10);
      if (!isNaN(n) && n >= 1 && n <= 49) {
        validOnLine.push(n);
      }
    }

    if (validOnLine.length > 0) {
      lineCandidates.push(validOnLine);
    }
  }

  // Priorizar bloques de líneas que contengan entre 5 y 11 números (típica línea múltiple SELAE)
  let bestWindow: number[] = [];
  for (let i = 0; i < lineCandidates.length; i++) {
    const single = Array.from(new Set(lineCandidates[i]));
    if (single.length >= 5 && single.length <= 11 && single.length > bestWindow.length) {
      bestWindow = single;
    }
    if (i + 1 < lineCandidates.length) {
      const paired = Array.from(new Set([...lineCandidates[i], ...lineCandidates[i + 1]]));
      if (paired.length >= 5 && paired.length <= 11 && paired.length > bestWindow.length) {
        bestWindow = paired;
      }
    }
  }

  if (bestWindow.length >= 5) {
    return bestWindow.sort((a, b) => a - b);
  }

  // Respaldo: unir todos los números válidos 01–49 detectados en líneas limpias
  const allValid = new Set<number>();
  for (const group of lineCandidates) {
    for (const n of group) {
      allValid.add(n);
    }
  }

  return Array.from(allValid).sort((a, b) => a - b);
}

/**
 * Ejecuta Tesseract.js sobre la imagen preprocesada en Canvas con whitelist estricta '0123456789 '.
 */
export async function runPreprocessedTesseractOCR(
  imageSource: File | Blob | string
): Promise<{ numbers: number[]; rawText: string }> {
  const preprocessedDataUrl = await preprocessTicketImageForOCR(imageSource);
  const worker = await createWorker('eng');
  try {
    await worker.setParameters({
      tessedit_char_whitelist: '0123456789 ',
      tessedit_pageseg_mode: PSM.SINGLE_BLOCK,
    });
    const result = await worker.recognize(preprocessedDataUrl);
    const rawText = result?.data?.text || '';
    const numbers = extractPrimitivaNumbersFromOcrText(rawText);
    return { numbers, rawText };
  } finally {
    await worker.terminate();
  }
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
 * Procesa una imagen o PDF de un boleto:
 * - Si hay servidor /api/extract-ticket operativo, intenta extracción completa con IA.
 * - Si no está disponible (p.ej. GitHub Pages / estático) o devuelve vacío, aplica
 *   Canvas preprocesado (escala de grises + contraste +40% + binarización) + Tesseract.js.
 */
export async function processTicketWithAI(
  fileOrBase64: File | Blob | string,
  customMimeType?: string
): Promise<TicketExtractionResponse> {
  let base64 = '';
  let mimeType = customMimeType || 'image/jpeg';

  try {
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

    const isPdf = mimeType.toLowerCase().includes('pdf');

    // 1. Intento opcional contra endpoint servidor si está activo
    try {
      const controller = new AbortController();
      const timer = window.setTimeout(() => controller.abort(), 5000);
      const response = await fetch('/api/extract-ticket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileBase64: base64, mimeType }),
        signal: controller.signal,
      });
      window.clearTimeout(timer);

      if (response.ok) {
        const json = await response.json();
        if (json.success && json.data && Array.isArray(json.data.numbers) && json.data.numbers.length > 0) {
          const cleanNums = Array.from(
            new Set(
              (json.data.numbers as number[])
                .map(n => Number(n))
                .filter(n => !isNaN(n) && n >= 1 && n <= 49)
            )
          ).sort((a, b) => a - b);

          if (cleanNums.length > 0) {
            return {
              success: true,
              data: {
                ...(json.data as ExtractedTicketData),
                numbers: cleanNums,
              },
            };
          }
        }
      }
    } catch {
      // Continuar al motor OCR local Tesseract.js
    }

    if (isPdf) {
      return {
        success: false,
        error:
          'El archivo PDF se adjuntará para los jugadores; marca o introduce los números en la cuadrícula 1-49.',
      };
    }

    // 2. Motor OCR local con Canvas preprocesado + Tesseract.js
    const imageInput = typeof fileOrBase64 === 'string' ? fileOrBase64 : `data:${mimeType};base64,${base64}`;
    const ocrResult = await runPreprocessedTesseractOCR(imageInput);

    if (ocrResult.numbers.length > 0) {
      return {
        success: true,
        data: {
          numbers: ocrResult.numbers,
          notes:
            'Lectura OCR aplicada con preprocesado térmico (grises, +40% contraste y binarización). Verifica los chips o ajusta en la cuadrícula 1-49.',
        },
      };
    }

    return {
      success: false,
      error:
        'No se detectaron números claros del 01 al 49 en la imagen. La foto sí queda adjunta; marca los números al instante con el selector táctil 1-49.',
    };
  } catch (err: unknown) {
    const errorMsg =
      err instanceof Error ? err.message : 'Error al procesar la lectura OCR del resguardo.';
    return {
      success: false,
      error: `${errorMsg} La imagen sí queda cargada; puedes marcar los números manualmente con la cuadrícula 1-49.`,
    };
  }
}

export const extractTicketWithAI = processTicketWithAI;
