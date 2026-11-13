import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware para recibir imágenes / PDFs en base64
  app.use(express.json({ limit: '30mb' }));

  // Endpoint de extracción de números de boleto mediante IA
  app.post('/api/extract-ticket', async (req, res) => {
    try {
      const { fileBase64, mimeType } = req.body;
      if (!fileBase64 || !mimeType) {
        return res.status(400).json({
          error: 'Faltan datos del archivo. Se requiere fileBase64 y mimeType.',
        });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({
          error: 'La variable GEMINI_API_KEY no está disponible en el servidor.',
        });
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: [
          {
            inlineData: {
              mimeType,
              data: fileBase64,
            },
          },
          {
            text: `Eres un experto digitalizador OCR de resguardos oficiales de Loterías y Apuestas del Estado (SELAE: La Primitiva, Bonoloto, Euromillones, El Gordo).
Analiza detenidamente la imagen o documento PDF del resguardo (puede ser un resguardo impreso de terminal físico en formato horizontal O un resguardo digital vertical de la web/app de Loterías como: "1.\n06\n13\n14\n22\n44\n+\n01\n06").

INSTRUCCIONES CRÍTICAS DE EXTRACCIÓN:
1. "numbers": Extrae ÚNICAMENTE los números principales jugados de la combinación (enteros ordenados de menor a mayor, entre 1 y 49 o 1 y 54).
   - En resguardos digitales verticales (ej. "1. 06 13 14 22 44 + 01 06"), los números principales son los que van justo debajo de "1." y ANTES del símbolo "+" o "R" (en ese ejemplo: [6, 13, 14, 22, 44]). NO incluyas el "1." de número de bloque ni los números posteriores al "+" (estrellas/reintegro).
   - NO confundas NUNCA fechas (ej. "13 NOV 26" -> 13, 26), importes ("2,50 EUR"), ni el código de control/serie inferior ("13283-0702-...") con números jugados.
   - Si hay varias apuestas o es una múltiple (5, 6, 7, 8, 9, 10 u 11 números), extrae la combinación principal completa.
2. "reintegro": Si aparece "R", "REINTEGRO" o un número tras "+" único (0-9) en La Primitiva/Bonoloto, extráelo como entero. En Euromillones, si hay dos estrellas tras "+", pon null en reintegro y menciónalo en notes. Si no aparece, pon null.
3. "jornada": Número de jornada (1 a 10) si aparece explícitamente; si no aparece, null.
4. "cost": Importe total en euros (ej. "2,50 EUR" -> 2.5, "44,00 €" -> 44). Si no se ve, null.
5. "drawDate": Fecha del sorteo en formato YYYY-MM-DD (por ejemplo "13 NOV 26" -> "2026-11-13"). Si no se ve, null.
6. "joker": true si aparece juego JOKER o EL MILLÓN asociado, false en caso contrario.
7. "betType": "MULTIPLE_5", "MULTIPLE_7", "MULTIPLE_8", "MULTIPLE_9", "MULTIPLE_10" o "SIMPLE".
8. "notes": Breve resumen en español de lo leído (ej. "Resguardo digital Euromillones · Estrellas: 01, 06 · Código HKS66933" o "La Primitiva Múltiple 5 números").`,
          },
        ],
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              numbers: {
                type: Type.ARRAY,
                items: { type: Type.INTEGER },
                description: 'Lista ordenada de números principales jugados en la combinación',
              },
              jornada: {
                type: Type.INTEGER,
                nullable: true,
                description: 'Número de jornada o sorteo (1 a 10) o null',
              },
              reintegro: {
                type: Type.INTEGER,
                nullable: true,
                description: 'Número de reintegro oficial (0 a 9) o null',
              },
              cost: {
                type: Type.NUMBER,
                nullable: true,
                description: 'Coste total de la apuesta en euros o null',
              },
              drawDate: {
                type: Type.STRING,
                nullable: true,
                description: 'Fecha del sorteo en formato YYYY-MM-DD o null',
              },
              joker: {
                type: Type.BOOLEAN,
                description: 'Indica si incluye juego adicional',
              },
              betType: {
                type: Type.STRING,
                description: 'Tipo de apuesta múltiple o simple',
              },
              notes: {
                type: Type.STRING,
                description: 'Notas o descripción del escaneo del boleto',
              },
            },
            required: ['numbers'],
          },
        },
      });

      const extractedData = JSON.parse(response.text || '{}');
      return res.json({ success: true, data: extractedData });
    } catch (err: unknown) {
      console.error('Error al procesar el boleto con Gemini API:', err);
      const message = err instanceof Error ? err.message : 'Error desconocido al extraer números con IA';
      return res.status(500).json({ error: message });
    }
  });

  const isProduction = process.env.NODE_ENV === 'production';
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
        watch: null,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor Full-Stack activo en http://0.0.0.0:${PORT}`);
  });

  server.on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`Puerto ${PORT} en uso. Intentando liberar o reconectar...`);
    } else {
      console.error('Error en el servidor HTTP:', err);
    }
  });

  const cleanup = async () => {
    server.close();
    process.exit(0);
  };

  process.on('SIGTERM', cleanup);
  process.on('SIGINT', cleanup);
}

startServer();
