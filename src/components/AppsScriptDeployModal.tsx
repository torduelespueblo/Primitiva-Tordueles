import React, { useState } from 'react';
import { Copy, Check, ExternalLink, Code2, Server, HelpCircle, X } from 'lucide-react';

interface AppsScriptDeployModalProps {
  isOpen: boolean;
  onClose: () => void;
  appsScriptUrl: string;
  onSaveUrl: (url: string) => void;
}

export const AppsScriptDeployModal: React.FC<AppsScriptDeployModalProps> = ({
  isOpen,
  onClose,
  appsScriptUrl,
  onSaveUrl,
}) => {
  const [copied, setCopied] = useState(false);
  const [urlInput, setUrlInput] = useState(appsScriptUrl);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const scriptCode = `/**
 * PEÑA LA PRIMITIVA TORDUELES - BACKEND GOOGLE APPS SCRIPT
 * Pega este código en Extensiones > Apps Script de tu Google Sheet.
 */
var CONFIG = {
  GREEN_API_INSTANCE_ID: '710722795241',
  GREEN_API_TOKEN: 'a1c3c85f04d34a21ae86403c9ebdbdb54854f9d5f94842a1b3',
  GREEN_API_CHAT_ID: '120363430888892480@g.us',
  SHEET_CONFIG: 'Configuracion',
  SHEET_SOCIOS: 'Socios_Activos',
  SHEET_ESPERA: 'Lista_Espera_Formulario',
  SHEET_JORNADAS: 'Historico_Jornadas',
  CUOTA_SEMANAL: 1.0,
  DURACION_CICLO: 10
};

function inicializarEstructuraHojas() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetConfig = ss.getSheetByName(CONFIG.SHEET_CONFIG) || ss.insertSheet(CONFIG.SHEET_CONFIG);
  if (sheetConfig.getLastRow() === 0) {
    sheetConfig.appendRow(['Clave', 'Valor', 'Descripcion']);
    sheetConfig.appendRow(['CICLO_ACTUAL', '3', 'Ciclo vigente']);
    sheetConfig.appendRow(['JORNADA_ACTUAL', '8', 'Jornada actual (1 a 10)']);
    sheetConfig.appendRow(['BOLSA_PREMIOS_MENORES', '384.50', 'Fondo común premios <= 2000€']);
    sheetConfig.appendRow(['ENVIAR_BOLETIN_DIARIO_GENERAL', 'NO', 'Interruptor SI/NO boletín general']);
    sheetConfig.appendRow(['ENVIAR_RESGUARDO_2035', 'SI', 'Enviar resguardo a las 20:35h']);
  }
}

function triggerEnviarResguardo2035() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetConfig = ss.getSheetByName(CONFIG.SHEET_CONFIG);
  var ciclo = sheetConfig.getRange('B2').getValue();
  var jornada = sheetConfig.getRange('B3').getValue();
  enviarMensajeWhatsApp('🌲 *PEÑA PRIMITIVA TORDUELES* 🌲\\n🎟️ Resguardo validado a las 20:35h para la Jornada ' + jornada + '/10 (Ciclo ' + ciclo + '). ¡Mucha suerte!');
}

function enviarMensajeWhatsApp(texto) {
  var url = 'https://api.green-api.com/waInstance' + CONFIG.GREEN_API_INSTANCE_ID + '/sendMessage/' + CONFIG.GREEN_API_TOKEN;
  UrlFetchApp.fetch(url, {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify({ chatId: CONFIG.GREEN_API_CHAT_ID, message: texto }),
    muteHttpExceptions: true
  });
}

function doGet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetConfig = ss.getSheetByName(CONFIG.SHEET_CONFIG);
  var data = {
    ciclo: sheetConfig.getRange('B2').getValue(),
    jornada: sheetConfig.getRange('B3').getValue(),
    bolsaPremios: sheetConfig.getRange('B4').getValue(),
    boletinDiarioActivo: sheetConfig.getRange('B5').getValue() === 'SI'
  };
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(scriptCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSave = () => {
    onSaveUrl(urlInput);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 sm:p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-3xl rounded-2xl bg-white shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-[#0d253f] px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white/10">
              <Server className="w-5 h-5 text-sky-400" />
            </div>
            <div>
              <h3 className="font-bold text-base font-serif">Despliegue Google Apps Script Backend</h3>
              <p className="text-xs text-slate-300">Base de datos 100% gratuita en Google Sheets</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-full p-1 text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs sm:text-sm text-slate-700">
          {/* Steps */}
          <div className="space-y-3">
            <h4 className="font-bold text-[#0d253f] text-sm">Instrucciones de Despliegue en 3 Minutos:</h4>
            <ol className="list-decimal pl-5 space-y-2 text-xs text-slate-600">
              <li>
                Abre tu hoja de cálculo en <strong>Google Sheets</strong> (donde se registran las respuestas del Formulario de Google).
              </li>
              <li>
                En el menú superior, pulsa en <strong>Extensiones &gt; Apps Script</strong>.
              </li>
              <li>
                Borra cualquier código existente y <strong>pega el código oficial</strong> que aparece abajo (o usa el archivo <code>google-apps-script/Code.gs</code>).
              </li>
              <li>
                Ejecuta una vez la función <code>inicializarEstructuraHojas</code> para crear automáticamente las pestañas necesarias.
              </li>
              <li>
                Pulsa en <strong>Implementar &gt; Nueva implementación</strong>, selecciona tipo <em>"Aplicación web"</em>, en <em>"Quién tiene acceso"</em> selecciona <em>"Cualquiera"</em> y copia la URL generada.
              </li>
            </ol>
          </div>

          {/* Code preview & copy button */}
          <div className="relative rounded-xl bg-slate-900 p-4 text-slate-200 font-mono text-xs">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
              <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
                <Code2 className="w-4 h-4 text-sky-400" /> Code.gs (Google Apps Script)
              </span>
              <button
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-sans text-xs font-bold transition"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? '¡Copiado!' : 'Copiar Código Completo'}</span>
              </button>
            </div>
            <pre className="overflow-x-auto max-h-48 text-[11px] leading-relaxed text-slate-300">
              {scriptCode}
            </pre>
          </div>

          {/* Input for WebApp URL */}
          <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 space-y-2">
            <label className="block font-bold text-xs text-slate-800">
              URL de la Aplicación Web (Apps Script WebApp URL):
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                value={urlInput}
                onChange={e => setUrlInput(e.target.value)}
                placeholder="https://script.google.com/macros/s/AKfycb.../exec"
                className="flex-1 rounded-xl border border-slate-300 px-3 py-2 text-xs focus:ring-2 focus:ring-blue-900 outline-hidden"
              />
              <button
                onClick={handleSave}
                className="px-4 py-2 rounded-xl bg-[#0d253f] hover:bg-[#153a61] text-xs font-bold text-white transition"
              >
                {savedSuccess ? '¡Guardada!' : 'Vincular'}
              </button>
            </div>
            <p className="text-[11px] text-slate-500">
              Al guardar la URL, la PWA sincronizará las jornadas y datos directamente con tu Google Sheets en tiempo real.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-xs font-bold text-slate-800 transition"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
