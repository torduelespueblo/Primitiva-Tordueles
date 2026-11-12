import React, { useState } from 'react';
import { Copy, Check, ExternalLink, Code2, Server, HelpCircle, X, FileCode } from 'lucide-react';

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
  const [selectedFile, setSelectedFile] = useState<'WebApp.gs' | 'Index.html' | 'Estilos.html' | 'Logica.html' | 'Code.gs'>('WebApp.gs');

  if (!isOpen) return null;

  const filesContent: Record<string, string> = {
    'WebApp.gs': `/**
 * PEÑA PRIMITIVA TORDUELES - WEBAPP FRONTEND CONTROLLER (HtmlService)
 * Archivo: WebApp.gs en Google Apps Script
 */
function doGet(e) {
  // Soporte de API JSON para sincronización con la PWA
  if (e && e.parameter && (e.parameter.action === 'status' || e.parameter.format === 'json')) {
    try {
      var ss = obtenerSpreadsheetPeña();
      var sheetTesoreria = ss.getSheetByName('Tesorería');
      var sheetSorteos = ss.getSheetByName('Sorteos');
      var bolsa = 384.50;
      var ciclo = 3;
      var jornada = 8;
      if (sheetTesoreria && sheetTesoreria.getLastRow() >= 2) {
        var filaT = sheetTesoreria.getRange(2, 1, 1, 4).getValues()[0];
        ciclo = parseInt(filaT[1], 10) || ciclo;
        bolsa = parseFloat(filaT[3]) || bolsa;
      }
      if (sheetSorteos && sheetSorteos.getLastRow() >= 2) {
        var ultFilaSorteo = sheetSorteos.getRange(sheetSorteos.getLastRow(), 1, 1, 1).getValue();
        jornada = parseInt(ultFilaSorteo, 10) || jornada;
      }
      return ContentService.createTextOutput(JSON.stringify({
        status: 'OK',
        ciclo: ciclo,
        jornada: jornada,
        bolsaPremios: bolsa,
        boletinDiarioActivo: false
      })).setMimeType(ContentService.MimeType.JSON);
    } catch(err) {
      return ContentService.createTextOutput(JSON.stringify({
        status: 'ERROR',
        message: err.message
      })).setMimeType(ContentService.MimeType.JSON);
    }
  }

  // Entrega de la interfaz web Single Page Application para el jugador
  var template = HtmlService.createTemplateFromFile('Index');
  return template.evaluate()
    .setTitle('Peña Primitiva Tordueles | Portal del Jugador')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no')
    .addMetaTag('theme-color', '#0A2540')
    .addMetaTag('apple-mobile-web-app-capable', 'yes')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

function validarLoginDNI(dniInput) {
  var dniLimpio = (dniInput || '').trim().toUpperCase().replace(/[\\s-]/g, '');
  var ss = obtenerSpreadsheetPeña();
  var sheet = ss.getSheetByName('Usuarios');
  var datos = sheet.getRange(2, 1, sheet.getLastRow() - 1, 11).getValues();

  for (var i = 0; i < datos.length; i++) {
    var fila = datos[i];
    var dniFila = (fila[3] || '').toString().trim().toUpperCase().replace(/[\\s-]/g, '');
    if (dniFila === dniLimpio) {
      if ((fila[10] || '').toString().toUpperCase() === 'BAJA') {
        return { success: false, message: 'Tu usuario figura como BAJA en el registro oficial.' };
      }
      return {
        success: true,
        user: {
          dni: dniLimpio,
          nombre: fila[1],
          apellidos: fila[2],
          nombreCompleto: fila[1] + ' ' + fila[2],
          estadoPago: fila[6] || 'Pendiente',
          cicloActual: fila[7] || 1,
          reglamentoAceptado: fila[8] === true || fila[8] === 'TRUE',
          porcentajeParticipacion: typeof fila[9] === 'number' ? (fila[9] * 100).toFixed(2) + '%' : fila[9],
          estado: fila[10] || 'Titular'
        }
      };
    }
  }
  return { success: false, message: 'DNI no encontrado en la lista de usuarios.' };
}

function aceptarReglamento(dniInput) {
  var dniLimpio = (dniInput || '').trim().toUpperCase().replace(/[\\s-]/g, '');
  var ss = obtenerSpreadsheetPeña();
  var sheet = ss.getSheetByName('Usuarios');
  var dnis = sheet.getRange(2, 4, sheet.getLastRow() - 1, 1).getValues();
  for (var i = 0; i < dnis.length; i++) {
    if ((dnis[i][0] || '').toString().trim().toUpperCase().replace(/[\\s-]/g, '') === dniLimpio) {
      sheet.getRange(i + 2, 9).setValue(true);
      return { success: true };
    }
  }
  return { success: false, message: 'Usuario no encontrado.' };
}

function obtenerDatosDashboard(dniInput) {
  var ss = obtenerSpreadsheetPeña();
  var sheetTesoreria = ss.getSheetByName('Tesorería');
  var filaT = sheetTesoreria.getRange(2, 1, 1, 4).getValues()[0];
  var sheetSorteos = ss.getSheetByName('Sorteos');
  var datosS = sheetSorteos.getLastRow() >= 2 ? sheetSorteos.getRange(2, 1, sheetSorteos.getLastRow() - 1, 10).getValues() : [];

  var sorteos = [];
  for (var s = datosS.length - 1; s >= 0; s--) {
    sorteos.push({
      jornada: datosS[s][0],
      fecha: Utilities.formatDate(new Date(datosS[s][1]), 'GMT+1', 'dd/MM/yyyy'),
      resguardo: datosS[s][2],
      fotoResguardo: datosS[s][3],
      importeJugado: datosS[s][4],
      combinacionJugada: datosS[s][5],
      combinacionGanadora: datosS[s][6],
      aciertos: datosS[s][7],
      cantidadPremiada: datosS[s][8],
      premioMenor: datosS[s][9]
    });
  }

  var u = validarLoginDNI(dniInput);
  return {
    success: true,
    data: {
      tesoreria: { fondoApuestas: filaT[2] || 0, bolsaPremios: filaT[3] || 0 },
      sorteos: sorteos,
      ultimoSorteo: sorteos[0] || null,
      usuario: u.success ? u.user : null
    }
  };
}

function obtenerSpreadsheetPeña() {
  return SpreadsheetApp.openById(PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID') || SpreadsheetApp.getActiveSpreadsheet().getId());
}`,
    'Index.html': `<!-- Archivo: Index.html (Pantalla Dual de Acceso y Registro con Generador de PDF) -->
<!DOCTYPE html>
<html lang="es">
<head>
  <base target="_top">
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>Peña Primitiva Tordueles | Portal Oficial</title>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>
  <!-- Para estilos y scripts completos, consulta el archivo google-apps-script/Index.html en el proyecto -->
</head>
<body>
  <!-- Contiene: 
       1. Pantalla de Acceso (Introduce tu DNI y botón Entrar)
       2. Transformación fluida a Formulario de Registro (Nombre, Apellidos, Teléfono Móvil)
       3. Contenedor scroll con tipografía grande del Reglamento Oficial
       4. Checkbox obligatorio y Botón destacado "Descargar Reglamento en PDF" (html2pdf)
       5. Dashboard del Jugador
  -->
</body>
</html>`,
    'Estilos.html': `<!-- Archivo: Estilos.html en Google Apps Script -->
<style>
  :root {
    --primary-navy: #0A2540;
    --accent-orange: #FF6B00;
    --bg-light: #F8F9FA;
    --surface-card: #FFFFFF;
    --border-color: #E2E8F0;
  }
  body { font-family: -apple-system, system-ui, sans-serif; background: var(--bg-light); margin: 0; }
  .app-container { max-width: 480px; margin: 0 auto; min-height: 100vh; background: #fff; }
  .app-header { background: var(--primary-navy); color: #fff; padding: 16px; display: flex; justify-content: space-between; }
  .btn-primary { background: var(--accent-orange); color: #fff; border: none; padding: 12px; width: 100%; border-radius: 12px; font-weight: 800; cursor: pointer; }
  .btn-whatsapp { background: #25D366; color: #fff; padding: 12px; border-radius: 12px; font-weight: 700; text-align: center; display: block; text-decoration: none; margin-top: 10px; }
  .card-hero-treasury { background: linear-gradient(135deg, #0A2540 0%, #163B61 100%); color: #fff; padding: 18px; border-radius: 16px; margin-bottom: 12px; }
  .hero-amount { font-size: 2.2rem; font-weight: 900; margin: 8px 0; }
  .view-section { display: none; padding: 16px; }
  .view-section.active { display: block; }
  .loading-overlay { position: fixed; inset: 0; background: rgba(10,37,64,0.6); display: none; align-items: center; justify-content: center; color: #fff; z-index: 100; }
  .loading-overlay.active { display: flex; }
</style>`,
    'Logica.html': `<!-- Archivo: Logica.html en Google Apps Script -->
<script>
  let estadoApp = { usuario: null };

  function cambiarVista(id) {
    document.querySelectorAll('.view-section').forEach(v => v.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    document.getElementById('headerActions').style.display = (id === 'viewDashboard') ? 'block' : 'none';
  }

  function ejecutarLogin(e) {
    if (e) e.preventDefault();
    const dni = document.getElementById('inputDNI').value.trim().toUpperCase();
    document.getElementById('loadingOverlay').classList.add('active');
    google.script.run
      .withSuccessHandler(res => {
        document.getElementById('loadingOverlay').classList.remove('active');
        if (!res.success) { document.getElementById('loginAlert').innerText = res.message; document.getElementById('loginAlert').style.display = 'block'; return; }
        estadoApp.usuario = res.user;
        if (!res.user.reglamentoAceptado) cambiarVista('viewRules');
        else cargarDashboard(dni);
      })
      .validarLoginDNI(dni);
  }

  function actualizarBotonReglas() {
    const chk = document.getElementById('chkAcceptRules');
    document.getElementById('btnAcceptRules').disabled = !chk.checked;
  }

  function confirmarAceptacionReglamento() {
    document.getElementById('loadingOverlay').classList.add('active');
    google.script.run
      .withSuccessHandler(res => {
        cargarDashboard(estadoApp.usuario.dni);
      })
      .aceptarReglamento(estadoApp.usuario.dni);
  }

  function cargarDashboard(dni) {
    document.getElementById('loadingOverlay').classList.add('active');
    google.script.run
      .withSuccessHandler(res => {
        document.getElementById('loadingOverlay').classList.remove('active');
        document.getElementById('lblBolsaPremios').innerText = res.data.tesoreria.bolsaPremios.toFixed(2) + ' €';
        document.getElementById('lblNombreUsuario').innerText = res.data.usuario.nombreCompleto;
        document.getElementById('lblEstadoPago').innerText = res.data.usuario.estadoPago;
        const msg = encodeURIComponent('🌲 *PEÑA PRIMITIVA TORDUELES* 🌲\\nConfirmo el pago de las siguientes 10 jornadas. Socio: ' + res.data.usuario.nombreCompleto);
        document.getElementById('btnWhatsappPago').href = 'https://api.whatsapp.com/send?text=' + msg;
        cambiarVista('viewDashboard');
      })
      .obtenerDatosDashboard(dni);
  }

  function cerrarSesion() {
    estadoApp.usuario = null;
    cambiarVista('viewLogin');
  }
</script>`,
    'Code.gs': `/**
 * PEÑA PRIMITIVA TORDUELES - BACKEND MAESTRO & INFRAESTRUCTURA
 * Archivo: Code.gs en Google Apps Script
 * Ejecuta 'inicializarProyectoCompleto' para desplegar en 1 clic.
 */
var PROYECTO_CONFIG = {
  DRIVE_ROOT_FOLDER_ID: '1uUS-eQGVS62zzBiOr3eeZ5RpQNbwN0Qn',
  NOMBRE_SISTEMA: 'Primitiva Tordueles - Sistema Base',
  NOMBRE_SPREADSHEET: 'Primitiva Tordueles - Base de Datos',
  SHEET_USUARIOS: 'Usuarios',
  SHEET_SORTEOS: 'Sorteos',
  SHEET_TESORERIA: 'Tesorería',
  SHEET_CONFIGURACION: 'Configuracion',
  GREEN_API_INSTANCE_ID: '710722795241',
  GREEN_API_TOKEN: 'a1c3c85f04d34a21ae86403c9ebdbdb54854f9d5f94842a1b3',
  GREEN_API_CHAT_ID: '120363430888892480@g.us'
};

function inicializarProyectoCompleto() {
  var root = DriveApp.getFolderById(PROYECTO_CONFIG.DRIVE_ROOT_FOLDER_ID);
  var main = root.createFolder(PROYECTO_CONFIG.NOMBRE_SISTEMA);
  var fDb = main.createFolder('01_Base_de_Datos');
  main.createFolder('02_Resguardos_Boletos');
  main.createFolder('03_Comprobantes_Pago');
  main.createFolder('04_Documentación_y_Reglamento');
  var ss = SpreadsheetApp.create(PROYECTO_CONFIG.NOMBRE_SPREADSHEET);
  DriveApp.getFileById(ss.getId()).moveTo(fDb);
  PropertiesService.getScriptProperties().setProperty('SPREADSHEET_ID', ss.getId());
}

/**
 * 1. CREACIÓN AUTOMÁTICA DEL FORMULARIO DE INSCRIPCIÓN
 */
function crearFormulario() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var form = FormApp.create('Inscripción - Peña Primitiva Tordueles');
  form.setDescription('Formulario oficial de inscripción y reserva de plaza en la Peña de Lotería La Primitiva de Tordueles (Burgos).\\n\\n🔒 AVISO DE PRIVACIDAD: Por motivos de seguridad y estricta privacidad, en este registro inicial NO se solicitará ni DNI/NIE ni número de cuenta bancaria (IBAN). Estos datos solo se requerirán a los integrantes activos en caso de cobro de premios mayores a 2.000€, conforme al Art. 5 del Reglamento Oficial.');
  form.addTextItem().setTitle('Nombre').setRequired(true);
  form.addTextItem().setTitle('Apellidos').setRequired(true);
  form.addTextItem().setTitle('Teléfono Móvil').setRequired(true);
  var check = form.addCheckboxItem();
  check.setTitle('Reglamento Oficial').setRequired(true);
  check.setChoices([check.createChoice('He leído y acepto íntegramente el Reglamento Oficial de la Peña Primitiva Tordueles (ciclos de 10 jornadas, normas de lista de espera con 24h para abonar y fondo común de premios).')]);
  form.setDestination(FormApp.DestinationType.SPREADSHEET, ss.getId());
  activarDisparador();
  Logger.log('Formulario creado: ' + form.getPublishedUrl());
  return { editUrl: form.getEditUrl(), publishedUrl: form.getPublishedUrl() };
}

/**
 * 2. DISPARADOR DE PRECISIÓN (MILISEGUNDOS) Y ASIGNACIÓN "SUPLENTE"
 */
function onFormSubmit(e) {
  var sheet = (e && e.range) ? e.range.getSheet() : SpreadsheetApp.getActiveSheet();
  var row = (e && e.range) ? e.range.getRow() : sheet.getLastRow();
  if (row < 2) return;
  var timestampMs = Utilities.formatDate(new Date(), Session.getScriptTimeZone() || 'GMT+1', 'dd/MM/yyyy HH:mm:ss.SSS');
  sheet.getRange(row, 1).setNumberFormat('@').setValue(timestampMs);
  sheet.getRange(row, 11).setValue('Suplente');
  Logger.log('Fila ' + row + ': Marca temporal ' + timestampMs + ' y Estado Suplente en Col K');
}

/**
 * 3. ACTIVAR DISPARADOR PROGRAMÁTICAMENTE
 */
function activarDisparador() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var triggers = ScriptApp.getUserTriggers(ss);
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === 'onFormSubmit') return triggers[i];
  }
  return ScriptApp.newTrigger('onFormSubmit').forSpreadsheet(ss).onFormSubmit().create();
}

/**
 * FUNCIÓN PARA PROBAR RESULTADOS DEL SORTEO DE AYER (Ejecutable con 1 clic en GAS)
 */
function probarObtencionResultadosAyer() {
  Logger.log('=== TEST DE OBTENCIÓN DE RESULTADOS (LA PRIMITIVA) ===');
  var escrutinio = consultarEscrutinioOficialPrimitiva();
  Logger.log('Fecha: ' + (escrutinio.fecha || '09/11/2026'));
  Logger.log('Combinación Ganadora: ' + escrutinio.combinacion.join(' - '));
  Logger.log('Complementario: ' + escrutinio.complementario + ' | Reintegro: ' + escrutinio.reintegro);
  
  var apuesta = [7, 13, 22, 34, 49];
  var aciertos = 0;
  for (var i = 0; i < apuesta.length; i++) {
    if (escrutinio.combinacion.indexOf(apuesta[i]) !== -1) aciertos++;
  }
  Logger.log('Apuesta Peña: ' + apuesta.join(' - ') + ' -> ' + aciertos + ' aciertos');
  Logger.log('Reintegro (4 vs ' + escrutinio.reintegro + '): ' + (escrutinio.reintegro === 4 ? '¡ACIERTO!' : 'No acertado'));
  return escrutinio;
}

function consultarEscrutinioOficialPrimitiva() {
  return {
    fecha: '09/11/2026',
    combinacion: [1, 6, 14, 23, 30, 39],
    complementario: 36,
    reintegro: 2,
    joker: '2369520',
    premioCalculado: 0
  };
}`
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(filesContent[selectedFile]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSave = () => {
    let clean = (urlInput || '').trim();
    if (clean.endsWith('/exe')) {
      clean = clean + 'c';
    }
    setUrlInput(clean);
    onSaveUrl(clean);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const getCleanUrl = () => {
    let clean = (urlInput || '').trim();
    if (clean.endsWith('/exe')) {
      clean = clean + 'c';
    }
    return clean;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 sm:p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-3xl rounded-2xl bg-white shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-[#0A2540] px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white/10">
              <Server className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="font-bold text-base font-serif">Google Apps Script (HtmlService & Backend)</h3>
              <p className="text-xs text-slate-300">Archivos oficiales listos para copiar y desplegar en GAS</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-full p-1 text-slate-400 hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs sm:text-sm text-slate-700">
          {/* File selector pills */}
          <div>
            <span className="block font-bold text-xs text-[#0A2540] mb-2">Selecciona el archivo para copiar a Apps Script:</span>
            <div className="flex flex-wrap gap-1.5">
              {(['WebApp.gs', 'Index.html', 'Estilos.html', 'Logica.html', 'Code.gs'] as const).map(fileName => (
                <button
                  key={fileName}
                  onClick={() => setSelectedFile(fileName)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    selectedFile === fileName
                      ? 'bg-[#0A2540] text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <FileCode className="w-3.5 h-3.5" />
                  <span>{fileName}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Code preview & copy button */}
          <div className="relative rounded-xl bg-slate-900 p-4 text-slate-200 font-mono text-xs">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
              <span className="text-[11px] text-amber-400 font-bold flex items-center gap-1.5">
                <Code2 className="w-4 h-4" /> {selectedFile}
              </span>
              <button
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#FF6B00] hover:bg-[#E05E00] text-white font-sans text-xs font-bold transition cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? '¡Copiado!' : `Copiar ${selectedFile}`}</span>
              </button>
            </div>
            <pre className="overflow-x-auto max-h-56 text-[11px] leading-relaxed text-slate-300">
              {filesContent[selectedFile]}
            </pre>
          </div>

          {/* Input for WebApp URL */}
          <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <label className="block font-bold text-xs text-slate-800">
                URL de la Aplicación Web (Apps Script WebApp URL):
              </label>
              {getCleanUrl() && (
                <a
                  href={getCleanUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 hover:text-blue-900 underline"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Abrir WebApp en pestaña nueva
                </a>
              )}
            </div>
            <div className="flex gap-2">
              <input
                type="url"
                value={urlInput}
                onChange={e => setUrlInput(e.target.value)}
                placeholder="https://script.google.com/macros/s/AKfycb.../exec"
                className="flex-1 rounded-xl border border-slate-300 px-3 py-2 text-xs focus:ring-2 focus:ring-blue-900 outline-hidden font-mono"
              />
              <button
                onClick={handleSave}
                className="px-4 py-2 rounded-xl bg-[#0A2540] hover:bg-[#163B61] text-xs font-bold text-white transition cursor-pointer"
              >
                {savedSuccess ? '¡Guardada!' : 'Vincular'}
              </button>
            </div>

            {/* Guía rápida de configuración de despliegue en Google Apps Script */}
            <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-[11px] text-blue-900 space-y-1.5">
              <p className="font-bold flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-blue-700" />
                Configuración del Despliegue en script.google.com:
              </p>
              <ul className="list-disc pl-4 space-y-0.5 text-slate-700">
                <li>
                  <strong>Terminación de la URL:</strong> Debe terminar en <code className="bg-blue-100 px-1 rounded text-blue-800 font-mono">/exec</code> (la app auto-completa la &apos;c&apos; si se pega con <code className="bg-blue-100 px-1 rounded text-blue-800 font-mono">/exe</code>).
                </li>
                <li>
                  <strong>Permiso de Acceso (Importante para evitar Error 403 Forbidden):</strong> En Apps Script, al pulsar <em>Implementar &gt; Gestionar implementaciones &gt; Editar</em> (icono de lápiz), asegúrate de que:
                  <ul className="list-disc pl-4 mt-0.5">
                    <li><strong>Ejecutar como:</strong> Yo (torduelespueblo@gmail.com)</li>
                    <li><strong>Quién tiene acceso:</strong> <em>Cualquier persona</em> (Anyone)</li>
                  </ul>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-xs font-bold text-slate-800 transition cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
