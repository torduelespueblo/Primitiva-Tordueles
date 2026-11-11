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
        model: 'gemini-3.8-flash',
        contents: [
          {
            inlineData: {
              mimeType,
              data: fileBase64,
            },
          },
          {
            text: `Eres un experto clasificador y digitalizador de boletos oficiales de Loterías y Apuestas del Estado de España (SELAE - La Primitiva, Bonoloto).
Analiza detenidamente la imagen o documento PDF adjunto del resguardo o boleto de lotería y extrae con máxima fidelidad la información de la apuesta:
1. "numbers": Lista ordenada de números enteros únicos jugados en la combinación (entre 1 y 49). Si es una apuesta múltiple autorizada, extrae todos los números marcados en el bloque principal (por ejemplo, 5 números para múltiple de 5, 7 números para múltiple de 7, 8 números para múltiple de 8, 9 números para múltiple de 9, o 10 números).
2. "jornada": Número de jornada o sorteo (entero, ej. 1 a 10), o null si no se especifica explícitamente.
3. "reintegro": Número asignado de reintegro oficial (entero entre 0 y 9), o null si no aparece.
4. "cost": Importe en euros pagado por la apuesta (número decimal, ej. 44.00, 84.00, 7.00), o null si no es visible.
5. "drawDate": Fecha del sorteo en formato YYYY-MM-DD si es legible en el boleto, o null.
6. "joker": Valor booleano indicando si incluye juego Joker (true/false).
7. "betType": Tipo de apuesta detectada (ej. "MULTIPLE_5", "MULTIPLE_7", "MULTIPLE_8", "MULTIPLE_9", "MULTIPLE_10", "SIMPLE").
8. "notes": Resumen conciso de lo detectado (ej. "Boleto múltiple de 5 números sellado por terminal oficial").`,
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
                description: 'Lista de números jugados en la combinación',
              },
              jornada: {
                type: Type.INTEGER,
                description: 'Número de jornada o sorteo (ej. 1 a 10)',
              },
              reintegro: {
                type: Type.INTEGER,
                description: 'Número de reintegro oficial (0 a 9)',
              },
              cost: {
                type: Type.NUMBER,
                description: 'Coste total de la apuesta en euros',
              },
              drawDate: {
                type: Type.STRING,
                description: 'Fecha del sorteo en formato YYYY-MM-DD',
              },
              joker: {
                type: Type.BOOLEAN,
                description: 'Indica si se jugó el Joker',
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

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor Full-Stack activo en http://0.0.0.0:${PORT}`);
  });
}

startServer();
