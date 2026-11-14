/**
 * ============================================================================
 * PEÑA LA PRIMITIVA TORDUELES - INFRAESTRUCTURA Y BACKEND GOOGLE APPS SCRIPT
 * Archivo: Code.gs
 * ============================================================================
 *
 * Script maestro de Google Drive, Google Sheets, Formulario de Inscripción,
 * WhatsApp (Green API), Motor de Consenso (La Primitiva) y Boletín Diario en Vivo
 * (Loterías y Apuestas del Estado + JuegosONCE).
 */

// ============================================================================
// 1. CONFIGURACIÓN GLOBAL DEL PROYECTO
// ============================================================================
var PROYECTO_CONFIG = {
  DRIVE_ROOT_FOLDER_ID: '1uUS-eQGVS62zzBiOr3eeZ5RpQNbwN0Qn',
  DEFAULT_SPREADSHEET_ID: '18R_F67pOt4pYBD5VqzBln12H-VMxUx-qmoeCewwz8qw',
  NOMBRE_SISTEMA: 'Primitiva Tordueles - Sistema Base',
  NOMBRE_SPREADSHEET: 'Primitiva Tordueles - Base de Datos',

  SUBFOLDERS: [
    '01_Base_de_Datos',
    '02_Resguardos_Boletos',
    '03_Comprobantes_Pago',
    '04_Documentación_y_Reglamento'
  ],

  SHEET_USUARIOS: 'Usuarios',
  SHEET_SORTEOS: 'Sorteos',
  SHEET_TESORERIA: 'Tesorería',
  SHEET_CONFIGURACION: 'Configuracion',
  SHEET_APUESTAS_ACTIVAS: 'Apuestas Activas',

  COLOR_HEADER_NAVY: '#0A2540',
  COLOR_HEADER_TEXT: '#FFFFFF',

  GREEN_API_INSTANCE_ID: '710722795241',
  GREEN_API_TOKEN: 'a1c3c85f04d34a21ae86403c9ebdbdb54854f9d5f94842a1b3',
  GREEN_API_CHAT_ID: '120363430888892480@g.us',

  TIMEZONE: 'Europe/Madrid',
  CUOTA_SEMANAL: 1.0,
  JORNADAS_POR_CICLO: 10
};

var ALERTA_CONFIG = {
  EMAIL_ADMIN: 'torduelespueblo@gmail.com',
  TELEGRAM_BOT_TOKEN: '',
  TELEGRAM_CHAT_ID: '',
  ACTIVAR_TELEGRAM: false
};

// ============================================================================
// 2. FUNCIÓN MAESTRA DE INSTALACIÓN EN 1 CLIC
// ============================================================================
function inicializarProyectoCompleto() {
  Logger.log('Iniciando instalación de la infraestructura Primitiva Tordueles...');

  var rootFolder;
  try {
    rootFolder = DriveApp.getFolderById(PROYECTO_CONFIG.DRIVE_ROOT_FOLDER_ID);
  } catch (e) {
    throw new Error('No se pudo acceder a la carpeta raíz con ID: ' + PROYECTO_CONFIG.DRIVE_ROOT_FOLDER_ID + '. Verifica los permisos.');
  }

  var mainFolder = obtenerOCrearCarpeta(rootFolder, PROYECTO_CONFIG.NOMBRE_SISTEMA);

  var carpetasCreadas = {};
  for (var i = 0; i < PROYECTO_CONFIG.SUBFOLDERS.length; i++) {
    var subNombre = PROYECTO_CONFIG.SUBFOLDERS[i];
    carpetasCreadas[subNombre] = obtenerOCrearCarpeta(mainFolder, subNombre);
  }

  var dbFolder = carpetasCreadas['01_Base_de_Datos'];
  var spreadsheet = obtenerOCrearSpreadsheet(dbFolder, PROYECTO_CONFIG.NOMBRE_SPREADSHEET);

  configurarPestanaUsuarios(spreadsheet);
  configurarPestanaSorteos(spreadsheet);
  configurarPestanaTesoreria(spreadsheet);
  configurarPestanaConfiguracion(spreadsheet);
  configurarPestanaApuestasActivas(spreadsheet);
  eliminarHojasSobrantes(spreadsheet);

  PropertiesService.getScriptProperties().setProperty('SPREADSHEET_ID', spreadsheet.getId());
  PropertiesService.getScriptProperties().setProperty('RESGUARDOS_FOLDER_ID', carpetasCreadas['02_Resguardos_Boletos'].getId());

  return {
    success: true,
    spreadsheetUrl: spreadsheet.getUrl(),
    spreadsheetId: spreadsheet.getId(),
    mainFolderUrl: mainFolder.getUrl()
  };
}

// ============================================================================
// 3. ESTRUCTURACIÓN DE LAS 4 PESTAÑAS DE GOOGLE SHEETS
// ============================================================================

function configurarPestanaUsuarios(ss) {
  var sheet = ss.getSheetByName(PROYECTO_CONFIG.SHEET_USUARIOS) || ss.insertSheet(PROYECTO_CONFIG.SHEET_USUARIOS);
  sheet.clear();

  var headers = [
    'Marca temporal',
    'Nombre',
    'Apellidos',
    'DNI',
    'Teléfono',
    'IBAN',
    'Estado de Pago',
    'Ciclo Actual',
    'Reglamento Aceptado',
    '% Participación',
    'Estado'
  ];

  var headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setValues([headers]);
  aplicarEstiloEncabezado(headerRange);
  sheet.setFrozenRows(1);

  var reglaEstado = SpreadsheetApp.newDataValidation()
    .requireValueInList(['Titular', 'Suplente', 'Baja'], true)
    .setAllowInvalid(false)
    .build();
  sheet.getRange('K2:K200').setDataValidation(reglaEstado);

  var reglaPago = SpreadsheetApp.newDataValidation()
    .requireValueInList(['Pagado', 'Pendiente'], true)
    .setAllowInvalid(false)
    .build();
  sheet.getRange('G2:G200').setDataValidation(reglaPago);

  var reglaCheckbox = SpreadsheetApp.newDataValidation()
    .requireCheckbox()
    .build();
  sheet.getRange('I2:I200').setDataValidation(reglaCheckbox);

  sheet.getRange('D2:F200').setNumberFormat('@');
  sheet.getRange('A2:A200').setNumberFormat('dd/MM/yyyy HH:mm:ss.000');
  sheet.getRange('J2:J200').setNumberFormat('0.00%');

  for (var r = 2; r <= 30; r++) {
    sheet.getRange(r, 10).setFormula('=IF(K' + r + '="Titular", IFERROR(1 / COUNTIF($K$2:$K, "Titular"), 0), 0)');
  }

  sheet.autoResizeColumns(1, headers.length);
  return sheet;
}

function configurarPestanaSorteos(ss) {
  var sheet = ss.getSheetByName(PROYECTO_CONFIG.SHEET_SORTEOS) || ss.insertSheet(PROYECTO_CONFIG.SHEET_SORTEOS);
  sheet.clear();

  var headers = [
    'Jornada',
    'Fecha',
    'Resguardo',
    'Foto Resguardo',
    'Importe Jugado',
    'Combinación Jugada',
    'Combinación Ganadora',
    'Aciertos',
    'Cantidad Premiada',
    'Premio Menor'
  ];

  var headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setValues([headers]);
  aplicarEstiloEncabezado(headerRange);
  sheet.setFrozenRows(1);

  sheet.getRange('B2:B100').setNumberFormat('yyyy-mm-dd');
  sheet.getRange('E2:E100').setNumberFormat('#,##0.00 €');
  sheet.getRange('I2:I100').setNumberFormat('#,##0.00 €');
  sheet.getRange('J2:J100').setNumberFormat('#,##0.00 €');

  sheet.autoResizeColumns(1, headers.length);
  return sheet;
}

function configurarPestanaTesoreria(ss) {
  var sheet = ss.getSheetByName(PROYECTO_CONFIG.SHEET_TESORERIA) || ss.insertSheet(PROYECTO_CONFIG.SHEET_TESORERIA);
  sheet.clear();

  var headers = ['ID', 'Ciclo', 'Fondo de Apuestas', 'Bolsa de Premios'];
  var headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setValues([headers]);
  aplicarEstiloEncabezado(headerRange);
  sheet.setFrozenRows(1);

  sheet.getRange('A2').setValue(1);
  sheet.getRange('B2').setValue('Ciclo 1');
  sheet.getRange('C2').setFormula('=COUNTIF(Usuarios!K:K, "Titular")*10 - SUM(Sorteos!E:E)');
  sheet.getRange('D2').setFormula('=SUM(Sorteos!J:J)');

  sheet.getRange('C2:D2').setNumberFormat('#,##0.00 €');
  sheet.getRange('C2:D2').setFontWeight('bold');
  sheet.autoResizeColumns(1, headers.length);
  return sheet;
}

function configurarPestanaConfiguracion(ss) {
  var sheet = ss.getSheetByName(PROYECTO_CONFIG.SHEET_CONFIGURACION) || ss.insertSheet(PROYECTO_CONFIG.SHEET_CONFIGURACION);
  sheet.clear();

  var headers = ['ModoResumen', 'NotificarTodos'];
  var headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setValues([headers]);
  aplicarEstiloEncabezado(headerRange);
  sheet.setFrozenRows(1);

  // Activado por defecto para enviar el Boletín Diario Real ONLAE + ONCE cada noche
  sheet.getRange('A2').setValue('SÍ');
  sheet.getRange('B2').setValue('NO');

  var reglaSiNo = SpreadsheetApp.newDataValidation()
    .requireValueInList(['SÍ', 'NO'], true)
    .setAllowInvalid(false)
    .build();
  sheet.getRange('A2:B2').setDataValidation(reglaSiNo);

  sheet.autoResizeColumns(1, headers.length);
  return sheet;
}

function configurarPestanaApuestasActivas(ss) {
  var sheet = ss.getSheetByName(PROYECTO_CONFIG.SHEET_APUESTAS_ACTIVAS) || ss.insertSheet(PROYECTO_CONFIG.SHEET_APUESTAS_ACTIVAS);
  sheet.clear();

  var headers = [
    'Día / Sorteo',
    'Fecha Sorteo',
    'Ciclo',
    'Jornada',
    'Combinación Jugada',
    'Reintegro Jugado',
    'Activa'
  ];

  var headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setValues([headers]);
  aplicarEstiloEncabezado(headerRange);
  sheet.setFrozenRows(1);

  sheet.getRange('B2:B50').setNumberFormat('yyyy-mm-dd');
  var reglaActiva = SpreadsheetApp.newDataValidation()
    .requireValueInList(['SÍ', 'NO'], true)
    .setAllowInvalid(false)
    .build();
  sheet.getRange('G2:G50').setDataValidation(reglaActiva);

  sheet.autoResizeColumns(1, headers.length);
  return sheet;
}

// ============================================================================
// 3.B. FORMULARIO OFICIAL DE INSCRIPCIÓN Y DISPARADOR DE PRECISIÓN (MILISEGUNDOS)
// ============================================================================

function crearFormulario() {
  Logger.log('Creando Formulario Oficial de Inscripción...');

  var ss = SpreadsheetApp.getActiveSpreadsheet() || obtenerSpreadsheetConfigurado();
  if (!ss) {
    throw new Error('No se ha podido localizar la hoja de cálculo activa de la Peña.');
  }

  var form = FormApp.create('Inscripción - Peña Primitiva Tordueles');
  form.setDescription(
    'Formulario oficial de inscripción en la Peña Primitiva Tordueles.\n\n' +
    'POLÍTICA DE PRIVACIDAD: Por seguridad y privacidad, en este paso NO se solicitará DNI ni número de cuenta (IBAN). ' +
    'Estos datos solo se pedirán de forma obligatoria en caso de cobro de premios mayores a 2.000€.'
  );

  form.setAllowResponseEdits(false);
  form.setLimitOneResponsePerUser(false);
  form.setCollectEmail(false);
  form.setShowLinkToRespondAgain(true);

  form.addTextItem().setTitle('Nombre').setRequired(true);
  form.addTextItem().setTitle('Apellidos').setRequired(true);
  form.addTextItem().setTitle('Teléfono Móvil').setRequired(true);

  var itemReglamento = form.addCheckboxItem();
  itemReglamento.setTitle('Reglamento Oficial').setRequired(true);
  itemReglamento.setChoices([
    itemReglamento.createChoice('He leído y acepto el Reglamento Oficial de la Peña Primitiva Tordueles.')
  ]);

  form.setDestination(FormApp.DestinationType.SPREADSHEET, ss.getId());
  SpreadsheetApp.flush();

  var hojas = ss.getSheets();
  for (var h = 0; h < hojas.length; h++) {
    var hoja = hojas[h];
    if (hoja.getFormUrl() && hoja.getName() !== PROYECTO_CONFIG.SHEET_USUARIOS) {
      try {
        hoja.hideSheet();
      } catch (eHide) {}
    }
  }

  try {
    PropertiesService.getScriptProperties().setProperty('FORMULARIO_URL', form.getPublishedUrl());
    PropertiesService.getScriptProperties().setProperty('FORMULARIO_ID', form.getId());
  } catch (eConfig) {}

  activarDisparador();

  Logger.log('Formulario creado: ' + form.getPublishedUrl());
  return {
    success: true,
    formId: form.getId(),
    editUrl: form.getEditUrl(),
    publishedUrl: form.getPublishedUrl(),
    spreadsheetUrl: ss.getUrl()
  };
}

function onFormSubmit(e) {
  var ahora = new Date();
  var zonaHoraria = Session.getScriptTimeZone() || PROYECTO_CONFIG.TIMEZONE;
  var timestampMilisegundos = Utilities.formatDate(ahora, zonaHoraria, 'dd/MM/yyyy HH:mm:ss.SSS');

  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet() || obtenerSpreadsheetConfigurado();
    var sheetOrigen = (e && e.range) ? e.range.getSheet() : ss.getActiveSheet();
    var rowOrigen = (e && e.range) ? e.range.getRow() : sheetOrigen.getLastRow();

    if (!sheetOrigen || rowOrigen < 2) {
      return;
    }

    sheetOrigen.getRange(rowOrigen, 1).setNumberFormat('@').setValue(timestampMilisegundos);
    var celdaKOrigen = sheetOrigen.getRange(rowOrigen, 11);
    celdaKOrigen.clearDataValidations();
    celdaKOrigen.setValue('Suplente');

    var sheetUsuarios = ss.getSheetByName(PROYECTO_CONFIG.SHEET_USUARIOS);
    if (sheetUsuarios && sheetOrigen.getName() !== PROYECTO_CONFIG.SHEET_USUARIOS) {
      sincronizarRespuestaEnPestanaUsuarios(sheetOrigen, rowOrigen, sheetUsuarios, timestampMilisegundos, e);
      if (!sheetOrigen.isSheetHidden()) {
        try {
          sheetOrigen.hideSheet();
        } catch (eHide) {}
      }
    }

    Logger.log('onFormSubmit completado -> ' + timestampMilisegundos + ' | Estado: Suplente');
  } catch (error) {
    Logger.log('Error en onFormSubmit: ' + error.message);
  }
}

function obtenerPrimeraFilaLibreUsuarios(sheetUsuarios) {
  var lastRow = sheetUsuarios.getLastRow();
  if (lastRow < 2) return 2;

  var rangoAB = sheetUsuarios.getRange(2, 1, lastRow - 1, 2).getValues();
  for (var i = 0; i < rangoAB.length; i++) {
    var ts = String(rangoAB[i][0] || '').trim();
    var nombre = String(rangoAB[i][1] || '').trim();
    if (!ts && !nombre) {
      return i + 2;
    }
  }
  return lastRow + 1;
}

function sincronizarRespuestaEnPestanaUsuarios(sheetRespuestas, rowRespuestas, sheetUsuarios, timestampMs, e) {
  var nombre = '';
  var apellidos = '';
  var telefono = '';

  if (e && e.namedValues) {
    nombre = e.namedValues['Nombre'] ? String(e.namedValues['Nombre'][0] || '').trim() : '';
    apellidos = e.namedValues['Apellidos'] ? String(e.namedValues['Apellidos'][0] || '').trim() : '';
    telefono = e.namedValues['Teléfono Móvil'] ? String(e.namedValues['Teléfono Móvil'][0] || '').trim() : '';
  }

  if (!nombre && !apellidos) {
    var valoresResp = sheetRespuestas.getRange(rowRespuestas, 1, 1, sheetRespuestas.getLastColumn()).getValues()[0];
    nombre = String(valoresResp[1] || '').trim();
    apellidos = String(valoresResp[2] || '').trim();
    telefono = String(valoresResp[3] || '').trim();
  }

  var filaDestino = obtenerPrimeraFilaLibreUsuarios(sheetUsuarios);

  sheetUsuarios.getRange(filaDestino, 1).setNumberFormat('@').setValue(timestampMs);
  sheetUsuarios.getRange(filaDestino, 2).setValue(nombre);
  sheetUsuarios.getRange(filaDestino, 3).setValue(apellidos);
  sheetUsuarios.getRange(filaDestino, 5).setNumberFormat('@').setValue(telefono);
  sheetUsuarios.getRange(filaDestino, 9).setValue(true);

  var celdaEstado = sheetUsuarios.getRange(filaDestino, 11);
  celdaEstado.clearDataValidations();
  celdaEstado.setValue('Suplente');
}

function activarDisparador() {
  var ss = SpreadsheetApp.getActiveSpreadsheet() || obtenerSpreadsheetConfigurado();
  if (!ss) {
    throw new Error('No se pudo acceder a la hoja de cálculo para instalar el disparador.');
  }

  var triggers = ScriptApp.getUserTriggers(ss);
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === 'onFormSubmit' &&
        triggers[i].getEventType() === ScriptApp.EventType.ON_FORM_SUBMIT) {
      return triggers[i];
    }
  }

  return ScriptApp.newTrigger('onFormSubmit')
    .forSpreadsheet(ss)
    .onFormSubmit()
    .create();
}

function probarDisparadorMilisegundos() {
  var ss = obtenerSpreadsheetConfigurado();
  var sheet = ss.getSheetByName(PROYECTO_CONFIG.SHEET_USUARIOS) || ss.getActiveSheet();
  var row = sheet.getLastRow();
  if (row < 2) return;

  var ahora = new Date();
  var timestampMs = Utilities.formatDate(ahora, PROYECTO_CONFIG.TIMEZONE, 'dd/MM/yyyy HH:mm:ss.SSS');
  sheet.getRange(row, 1).setNumberFormat('@').setValue(timestampMs);
  sheet.getRange(row, 11).setValue('Suplente');
}

// ============================================================================
// 4. AUTOMATIZACIONES WHATSAPP (RESGUARDO 20:35) Y SCRUTINIO DE LA PRIMITIVA
// ============================================================================

function enviarBoletoWhatsApp() {
  var ss = obtenerSpreadsheetConfigurado();
  var sheetSorteos = ss.getSheetByName(PROYECTO_CONFIG.SHEET_SORTEOS);
  if (!sheetSorteos || sheetSorteos.getLastRow() < 2) {
    Logger.log('No hay sorteos registrados en la hoja.');
    return;
  }

  var ahora = new Date();
  var hoyYMD = Utilities.formatDate(ahora, PROYECTO_CONFIG.TIMEZONE, 'yyyy-MM-dd');
  var lastRow = sheetSorteos.getLastRow();
  var numCols = Math.max(16, sheetSorteos.getLastColumn());
  var rows = sheetSorteos.getRange(2, 1, lastRow - 1, numCols).getValues();
  var enviados = 0;

  for (var i = 0; i < rows.length; i++) {
    var r = rows[i];
    var rowNum = i + 2;
    var combinacion = String(r[5] || '').trim();
    if (!combinacion) continue;

    var fechaVal = r[1];
    var fechaYMD = fechaVal instanceof Date
      ? Utilities.formatDate(fechaVal, PROYECTO_CONFIG.TIMEZONE, 'yyyy-MM-dd')
      : normalizarFechaAYMD(String(fechaVal || ''));

    var whatsappEnviado = String(r[12] || '').trim().toUpperCase();
    var estadoPub = String(r[10] || '').trim().toUpperCase();

    // Solo publicar y enviar si la fecha del sorteo coincide con HOY y no se ha enviado aún
    if (fechaYMD === hoyYMD && whatsappEnviado !== 'SÍ' && whatsappEnviado !== 'SI') {
      enviarBoletoDeFilaPorWhatsApp(sheetSorteos, rowNum);
      sheetSorteos.getRange(rowNum, 11).setValue('PUBLICADO');
      sheetSorteos.getRange(rowNum, 13).setValue('SÍ');
      enviados++;
    } else if (estadoPub === 'PROGRAMADO') {
      Logger.log('Boleto fila ' + rowNum + ' programado para ' + fechaYMD + ' (hoy es ' + hoyYMD + '). En espera.');
    }
  }

  Logger.log('Revisión 20:35 completada. Boletos publicados/enviados hoy: ' + enviados);
}

function normalizarFechaAYMD(fechaTexto) {
  var s = String(fechaTexto || '').trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  var m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (m) return m[3] + '-' + m[2] + '-' + m[1];
  return s;
}

function enviarBoletoDeFilaPorWhatsApp(sheetSorteos, rowNum) {
  var numCols = Math.max(16, sheetSorteos.getLastColumn());
  var fila = sheetSorteos.getRange(rowNum, 1, 1, numCols).getValues()[0];
  var jornada = fila[0];
  var fecha = fila[1] instanceof Date
    ? Utilities.formatDate(fila[1], PROYECTO_CONFIG.TIMEZONE, 'dd/MM/yyyy')
    : String(fila[1] || '');
  var fotoUrl = String(fila[3] || '').trim();
  var importe = fila[4];
  var combinacion = String(fila[5] || '').trim();
  var ciclo = fila[13] || 1;
  var reintegro = (fila[14] !== '' && fila[14] !== undefined) ? fila[14] : 0;
  var jugadores = fila[15] || 14;

  if (!combinacion) return;

  var mensaje = '🌲 *PEÑA LA PRIMITIVA TORDUELES* 🌲\n' +
    '📅 *Jornada ' + jornada + '/10 (Ciclo ' + ciclo + ') · Sorteo ' + fecha + '*\n' +
    '⏰ *Publicación oficial: 20:35 h*\n\n' +
    '🎟️ *Resguardo Sellado Oficial Validado:*\n' +
    '• Jugadores Activos: ' + jugadores + ' socios (1€/semana)\n' +
    '• Importe Jugado: ' + importe + ' €\n' +
    '• Combinación Jugada: ' + combinacion + '\n' +
    '• Reintegro: [ ' + reintegro + ' ]\n\n' +
    '🍀 *¡Mucha suerte a todos los socios de Tordueles!*\n' +
    '📱 Consulta el resguardo oficial completo en la WebApp.';

  if (fotoUrl && fotoUrl.indexOf('http') === 0) {
    var enviadoConFoto = enviarImagenGreenApi(fotoUrl, 'resguardo_jornada_' + jornada + '.jpg', mensaje);
    if (enviadoConFoto) return;
  }

  enviarMensajeGreenApi(mensaje);
}

/**
 * Configura el disparador diario a las 20:35 CET para publicar y enviar por WhatsApp
 * únicamente los boletos cuya fecha de sorteo coincida con el día actual.
 */
function configurarTriggerBoletos2035() {
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === 'enviarBoletoWhatsApp') {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }

  var trigger2035 = ScriptApp.newTrigger('enviarBoletoWhatsApp')
    .timeBased()
    .everyDays(1)
    .atHour(20)
    .nearMinute(35)
    .create();

  Logger.log('Disparador diario 20:35 CET para boletos programados instalado. ID: ' + trigger2035.getUniqueId());
  return trigger2035;
}

// ============================================================================
// 5. MOTOR EN VIVO DE RESULTADOS SELAE + JUEGOSONCE & CONSENSO CRUZADO
// ============================================================================

function obtenerTextoUrlSeguro(url) {
  var response = UrlFetchApp.fetch(url, {
    method: 'get',
    muteHttpExceptions: true,
    followRedirects: true,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Accept': 'application/json, text/html, application/xhtml+xml, application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'es-ES,es;q=0.9'
    }
  });
  var code = response.getResponseCode();
  var body = response.getContentText('UTF-8');
  return { code: code, body: body };
}

function pad2Num(n) {
  var num = parseInt(n, 10);
  if (isNaN(num)) return String(n || '');
  return (num < 10 ? '0' : '') + num;
}

function limpiarHtmlATexto(html) {
  return String(html || '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&aacute;/gi, 'á')
    .replace(/&eacute;/gi, 'é')
    .replace(/&iacute;/gi, 'í')
    .replace(/&oacute;/gi, 'ó')
    .replace(/&uacute;/gi, 'ú')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Consulta la API JSON oficial de SELAE para una fecha concreta (YYYYMMDD) y game_id.
 * game_id válidos: 'LAPR' (Primitiva), 'BONO' (Bonoloto), 'EMIL' (Euromillones), 'ELGR' (El Gordo), 'LNAC' (Lotería Nacional)
 */
function consultarSELAEJson(gameId, fechaReferencia) {
  var fecha = fechaReferencia || new Date();
  var ymd = Utilities.formatDate(fecha, PROYECTO_CONFIG.TIMEZONE, 'yyyyMMdd');
  var url = 'https://www.loteriasyapuestas.es/servicios/buscadorSorteos?game_id=' +
    encodeURIComponent(gameId) +
    '&celebrados=true&fechaInicioInclusiva=' + ymd +
    '&fechaFinInclusiva=' + ymd;

  var res = obtenerTextoUrlSeguro(url);
  if (res.code !== 200 || !res.body || res.body.charAt(0) === '<') {
    return null;
  }

  try {
    var lista = JSON.parse(res.body);
    if (!Array.isArray(lista) || lista.length === 0) {
      return null;
    }

    var sorteo = lista[0];
    var combTexto = String(sorteo.combinacion || '');

    if (gameId === 'LNAC') {
      var p1 = sorteo.primerPremio && sorteo.primerPremio.decimo ? sorteo.primerPremio.decimo : '';
      var p2 = sorteo.segundoPremio && sorteo.segundoPremio.decimo ? sorteo.segundoPremio.decimo : '';
      var reintLnac = Array.isArray(sorteo.reintegros) ? sorteo.reintegros.join(', ') : '';
      if (!p1) return null;
      return {
        fuente: 'SELAE',
        fecha: ymd,
        primerPremio: p1,
        segundoPremio: p2,
        reintegros: reintLnac
      };
    }

    // Extraer números principales
    var partePrincipal = combTexto.split(/C\(|R\(|E\(/i)[0];
    var matches = partePrincipal.match(/\d{1,2}/g) || [];
    var nums = matches.map(function(n) { return parseInt(n, 10); }).filter(function(n) { return !isNaN(n); });

    if (gameId === 'EMIL') {
      // En Euromillones SELAE suele traer 5 números + 2 estrellas en la cadena o en estrellas
      var estrellas = [];
      if (nums.length >= 7) {
        estrellas = nums.slice(5, 7);
        nums = nums.slice(0, 5);
      } else {
        var mEst = combTexto.match(/E\(\s*(\d{1,2})\s*[-,\s]+\s*(\d{1,2})\s*\)/i);
        if (mEst) {
          estrellas = [parseInt(mEst[1], 10), parseInt(mEst[2], 10)];
        }
      }
      if (nums.length === 5) {
        return {
          fuente: 'SELAE',
          fecha: ymd,
          combinacion: nums,
          estrellas: estrellas
        };
      }
      return null;
    }

    if (gameId === 'ELGR') {
      var mClave = combTexto.match(/R\(\s*(\d{1,2})\s*\)/i) || combTexto.match(/C\(\s*(\d{1,2})\s*\)/i);
      var clave = sorteo.clave !== undefined ? parseInt(sorteo.clave, 10) : (mClave ? parseInt(mClave[1], 10) : null);
      if (nums.length === 5) {
        return {
          fuente: 'SELAE',
          fecha: ymd,
          combinacion: nums,
          clave: clave
        };
      }
      return null;
    }

    // Primitiva y Bonoloto (6 números + Complementario + Reintegro)
    if (nums.length === 6) {
      var mComp = combTexto.match(/C\(\s*(\d{1,2})\s*\)/i);
      var mReint = combTexto.match(/R\(\s*(\d{1,2})\s*\)/i);
      var comp = mComp ? parseInt(mComp[1], 10) : (sorteo.complementario !== undefined ? parseInt(sorteo.complementario, 10) : null);
      var reint = mReint ? parseInt(mReint[1], 10) : (sorteo.reintegro !== undefined ? parseInt(sorteo.reintegro, 10) : null);

      if (comp !== null && reint !== null) {
        nums.sort(function(a, b) { return a - b; });
        return {
          fuente: 'SELAE Oficial',
          fecha: Utilities.formatDate(fecha, PROYECTO_CONFIG.TIMEZONE, 'dd/MM/yyyy'),
          combinacion: nums,
          complementario: comp,
          reintegro: reint
        };
      }
    }
  } catch (e) {
    Logger.log('Error parseando SELAE ' + gameId + ': ' + e.message);
  }
  return null;
}

function verificarFechaEnTexto(texto, fechaReferencia) {
  var fecha = fechaReferencia || new Date();
  var dd = Utilities.formatDate(fecha, PROYECTO_CONFIG.TIMEZONE, 'dd');
  var mm = Utilities.formatDate(fecha, PROYECTO_CONFIG.TIMEZONE, 'MM');
  var yyyy = Utilities.formatDate(fecha, PROYECTO_CONFIG.TIMEZONE, 'yyyy');
  var meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  var mesNombre = meses[parseInt(mm, 10) - 1];
  var diaSinCero = String(parseInt(dd, 10));

  var t = texto.toLowerCase();
  return (
    t.indexOf(dd + '/' + mm + '/' + yyyy) !== -1 ||
    t.indexOf(dd + '-' + mm + '-' + yyyy) !== -1 ||
    t.indexOf(diaSinCero + ' de ' + mesNombre + ' de ' + yyyy) !== -1 ||
    t.indexOf(dd + ' de ' + mesNombre + ' de ' + yyyy) !== -1
  );
}

function escaparRegex(str) {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function construirRegexFechaDDMMYYYY(fechaReferencia) {
  var fecha = fechaReferencia || new Date();
  return escaparRegex(Utilities.formatDate(fecha, PROYECTO_CONFIG.TIMEZONE, 'dd/MM/yyyy'));
}

function construirRegexFechaLarga(fechaReferencia) {
  var fecha = fechaReferencia || new Date();
  var dd = Utilities.formatDate(fecha, PROYECTO_CONFIG.TIMEZONE, 'dd');
  var mm = Utilities.formatDate(fecha, PROYECTO_CONFIG.TIMEZONE, 'MM');
  var yyyy = Utilities.formatDate(fecha, PROYECTO_CONFIG.TIMEZONE, 'yyyy');
  var meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  var mesNombre = meses[parseInt(mm, 10) - 1];
  var diaSinCero = String(parseInt(dd, 10));
  return '(?:' + diaSinCero + '|' + dd + ')\\s+de\\s+' + mesNombre + '\\s+de\\s+' + yyyy;
}

/**
 * Fuente pública RTVE / El País resumen (La Primitiva) con verificación estricta de fecha actual
 */
function consultarFuenteRTVE(fechaReferencia) {
  var urls = [
    'https://www.rtve.es/loterias/primitiva/',
    'https://www.rtve.es/noticias/loteria-primitiva/rss/'
  ];
  for (var u = 0; u < urls.length; u++) {
    try {
      var res = obtenerTextoUrlSeguro(urls[u]);
      if (res.code === 200 && res.body) {
        var limpio = limpiarHtmlATexto(res.body);
        if (verificarFechaEnTexto(limpio, fechaReferencia)) {
          var parsed = extraerCombinacionDeTexto(limpio);
          if (parsed && parsed.combinacion.length === 6) {
            parsed.fuente = 'RTVE';
            parsed.fecha = Utilities.formatDate(fechaReferencia || new Date(), PROYECTO_CONFIG.TIMEZONE, 'dd/MM/yyyy');
            return parsed;
          }
        }
      }
    } catch (e) {}
  }

  // Respaldo verificado desde la portada de sorteos de El País
  try {
    var fechaStr = construirRegexFechaDDMMYYYY(fechaReferencia);
    var resIdx = obtenerTextoUrlSeguro('https://servicios.elpais.com/sorteos/');
    if (resIdx.code === 200 && resIdx.body) {
      var txtIdx = limpiarHtmlATexto(resIdx.body);
      var reIdx = new RegExp(
        'La\\s+Primitiva\\s+[^\\d]{0,20}' + fechaStr +
        '\\s+Combinaci[oó]n\\s+ganadora\\s+(\\d{1,2})\\s+(\\d{1,2})\\s+(\\d{1,2})\\s+(\\d{1,2})\\s+(\\d{1,2})\\s+(\\d{1,2})' +
        '\\s+Complementario\\s+(\\d{1,2})\\s+Reintegro\\s+(\\d{1,2})',
        'i'
      );
      var m = txtIdx.match(reIdx);
      if (m) {
        return {
          fuente: 'El País Portada',
          fecha: Utilities.formatDate(fechaReferencia || new Date(), PROYECTO_CONFIG.TIMEZONE, 'dd/MM/yyyy'),
          combinacion: [1, 2, 3, 4, 5, 6].map(function(i) { return parseInt(m[i], 10); }).sort(function(a, b) { return a - b; }),
          complementario: parseInt(m[7], 10),
          reintegro: parseInt(m[8], 10)
        };
      }
    }
  } catch (e2) {}

  return null;
}

/**
 * Fuente pública Prensa (El País) para Primitiva, Bonoloto, Euromillones, Gordo
 * Anclada estrictamente a la fecha DD/MM/YYYY del bloque del sorteo.
 */
function consultarPrensaElPais(slug, fechaReferencia, minVal, maxVal, expectedCount) {
  var slugNormalizado = slug;
  if (slug === 'loteria-primitiva') slugNormalizado = 'primitiva';
  if (slug === 'el-gordo-primitiva') slugNormalizado = 'el-gordo';

  var url = 'https://servicios.elpais.com/sorteos/' + slugNormalizado + '/';
  var res = obtenerTextoUrlSeguro(url);
  if (res.code !== 200 || !res.body) return null;

  var limpio = limpiarHtmlATexto(res.body);
  var fechaRegex = construirRegexFechaDDMMYYYY(fechaReferencia);
  var fechaDisplay = Utilities.formatDate(fechaReferencia || new Date(), PROYECTO_CONFIG.TIMEZONE, 'dd/MM/yyyy');

  if (expectedCount === 6) {
    var re6 = new RegExp(
      fechaRegex + '\\s+Combinaci[oó]n\\s+ganadora\\s+' +
      '(\\d{1,2})\\s+(\\d{1,2})\\s+(\\d{1,2})\\s+(\\d{1,2})\\s+(\\d{1,2})\\s+(\\d{1,2})' +
      '\\s+Complementario\\s+(\\d{1,2})(?:\\s+Reintegro\\s+(\\d{1,2}))?',
      'i'
    );
    var m6 = limpio.match(re6);
    if (m6) {
      var nums6 = [1, 2, 3, 4, 5, 6].map(function(i) { return parseInt(m6[i], 10); }).sort(function(a, b) { return a - b; });
      return {
        fuente: 'El País Prensa',
        fecha: fechaDisplay,
        combinacion: nums6,
        complementario: parseInt(m6[7], 10),
        reintegro: m6[8] !== undefined ? parseInt(m6[8], 10) : '-'
      };
    }
  } else if (expectedCount === 5 && slugNormalizado === 'euromillones') {
    var reEmil = new RegExp(
      fechaRegex + '\\s+Combinaci[oó]n\\s+ganadora\\s+' +
      '(\\d{1,2})\\s+(\\d{1,2})\\s+(\\d{1,2})\\s+(\\d{1,2})\\s+(\\d{1,2})' +
      '\\s+Estrellas\\s+(\\d{1,2})\\s+(\\d{1,2})',
      'i'
    );
    var mEm = limpio.match(reEmil);
    if (mEm) {
      return {
        fuente: 'El País Prensa',
        fecha: fechaDisplay,
        combinacion: [1, 2, 3, 4, 5].map(function(i) { return parseInt(mEm[i], 10); }),
        estrellas: [parseInt(mEm[6], 10), parseInt(mEm[7], 10)]
      };
    }
  } else if (expectedCount === 5 && slugNormalizado === 'el-gordo') {
    var reGordo = new RegExp(
      fechaRegex + '\\s+Combinaci[oó]n\\s+ganadora\\s+' +
      '(\\d{1,2})\\s+(\\d{1,2})\\s+(\\d{1,2})\\s+(\\d{1,2})\\s+(\\d{1,2})' +
      '\\s+Clave\\s+(\\d{1,2})',
      'i'
    );
    var mG = limpio.match(reGordo);
    if (mG) {
      return {
        fuente: 'El País Prensa',
        fecha: fechaDisplay,
        combinacion: [1, 2, 3, 4, 5].map(function(i) { return parseInt(mG[i], 10); }),
        clave: parseInt(mG[6], 10)
      };
    }
  }
  return null;
}

function consultarLoteriaNacionalElPais(fechaReferencia) {
  try {
    var res = obtenerTextoUrlSeguro('https://servicios.elpais.com/sorteos/loteria-nacional/');
    if (res.code !== 200 || !res.body) return null;
    var limpio = limpiarHtmlATexto(res.body);
    var fechaRegex = construirRegexFechaDDMMYYYY(fechaReferencia);
    var reLn = new RegExp(
      fechaRegex + '\\s+Primer\\s+premio\\s+(\\d{5})\\s+Segundo\\s+premio\\s+(\\d{5})' +
      '(?:\\s+Reintegros\\s+([\\d\\s]{1,12}))?',
      'i'
    );
    var m = limpio.match(reLn);
    if (!m) return null;
    var reints = m[3] ? m[3].trim().split(/\s+/).join(', ') : '';
    return {
      fuente: 'El País Prensa',
      fecha: Utilities.formatDate(fechaReferencia || new Date(), PROYECTO_CONFIG.TIMEZONE, 'dd/MM/yyyy'),
      primerPremio: m[1],
      segundoPremio: m[2],
      reintegros: reints
    };
  } catch (e) {
    return null;
  }
}

function consultarFuentePrensa(fechaReferencia) {
  return consultarPrensaElPais('primitiva', fechaReferencia, 1, 49, 6);
}

function extraerCombinacionDeTexto(texto) {
  var limpio = String(texto || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ');
  var nums = [];
  var comp = null;
  var reintegro = null;

  var matchComb = limpio.match(/\b(\d{1,2})[,\s·-]+(\d{1,2})[,\s·-]+(\d{1,2})[,\s·-]+(\d{1,2})[,\s·-]+(\d{1,2})[,\s·-]+(\d{1,2})\b/);
  if (matchComb) {
    for (var i = 1; i <= 6; i++) {
      var n = parseInt(matchComb[i], 10);
      if (n >= 1 && n <= 49 && nums.indexOf(n) === -1) nums.push(n);
    }
  }

  var matchComp = limpio.match(/complementario[:\s]+(\d{1,2})/i) || limpio.match(/\bC[:\s]+(\d{1,2})\b/i);
  if (matchComp) comp = parseInt(matchComp[1], 10);

  var matchR = limpio.match(/reintegro[:\s]+(\d{1,2})/i) || limpio.match(/\bR[:\s]+(\d{1,2})\b/i);
  if (matchR) reintegro = parseInt(matchR[1], 10);

  if (nums.length === 6 && comp !== null && reintegro !== null) {
    nums.sort(function(a, b) { return a - b; });
    return {
      combinacion: nums,
      complementario: comp,
      reintegro: reintegro
    };
  }
  return null;
}

/**
 * Consulta JuegosONCE en vivo (páginas oficiales JuegosONCE + respaldo El País ONCE)
 * Anclado estrictamente a "celebrado el <día>, <fecha>" o DD/MM/YYYY para no mezclar sorteos de otros días.
 */
function consultarJuegosONCEEnVivo(fechaReferencia) {
  var fecha = fechaReferencia || new Date();
  var diaSemana = fecha.getDay(); // 0 Dom, 1..4 Diario, 5 Viernes Cuponazo, 6 Sáb Sueldazo
  var fechaLargaRegex = construirRegexFechaLarga(fecha);
  var fechaDDMMRegex = construirRegexFechaDDMMYYYY(fecha);
  var resultado = { cupon: null, eurojackpot: null, superOnce: null };

  // 1. Cupón (Diario L-J, Cuponazo V, Sueldazo S-D)
  var tituloCupon = diaSemana === 5
    ? 'CUPONAZO ONCE'
    : (diaSemana === 0 || diaSemana === 6 ? 'SUELDAZO FIN DE SEMANA ONCE' : 'CUPÓN DIARIO ONCE');
  var urlCupon = diaSemana === 5
    ? 'https://www.juegosonce.es/resultados-cuponazo'
    : (diaSemana === 0 || diaSemana === 6
      ? 'https://www.juegosonce.es/resultados-sueldazo-fin-de-semana'
      : 'https://www.juegosonce.es/resultados-cupon-diario');

  try {
    var resCupon = obtenerTextoUrlSeguro(urlCupon);
    if (resCupon.code === 200 && resCupon.body) {
      var textoCupon = limpiarHtmlATexto(resCupon.body);
      var reCuponOnce = new RegExp(
        'celebrado\\s+el\\s+[^,]+,\\s*' + fechaLargaRegex +
        '[\\s\\S]{0,260}?N[úu]mero[:\\s]+(\\d{5}),?\\s*serie[:\\s]+(\\d{1,3})',
        'i'
      );
      var mNum = textoCupon.match(reCuponOnce);
      if (mNum) {
        resultado.cupon = {
          titulo: tituloCupon,
          numero: mNum[1],
          serie: mNum[2].length < 3 ? ('000' + mNum[2]).slice(-3) : mNum[2]
        };
      }
    }
  } catch (eC) {}

  // Respaldo Cupón ONCE desde El País (/sorteos/once/)
  if (!resultado.cupon) {
    try {
      var resOnceEp = obtenerTextoUrlSeguro('https://servicios.elpais.com/sorteos/once/');
      if (resOnceEp.code === 200 && resOnceEp.body) {
        var txtEp = limpiarHtmlATexto(resOnceEp.body);
        var reEpOnce = new RegExp(
          '(Cup[óo]n\\s+Diario|El\\s+Cuponazo|Sueldazo\\s+Fin\\s+de\\s+semana)\\s+[^\\d]{0,20}' + fechaDDMMRegex +
          '\\s+N[úu]mero\\s+([\\d\\s]{5,12})\\s+Serie\\s+(\\d{1,3})',
          'i'
        );
        var mEp = txtEp.match(reEpOnce);
        if (mEp) {
          var numLimpio = mEp[2].replace(/\s+/g, '');
          var serLimpia = mEp[3].trim();
          resultado.cupon = {
            titulo: tituloCupon,
            numero: numLimpio,
            serie: serLimpia.length < 3 ? ('000' + serLimpia).slice(-3) : serLimpia
          };
        }
      }
    } catch (eEp) {}
  }

  // 2. Eurojackpot (Martes 2 y Viernes 5)
  if (diaSemana === 2 || diaSemana === 5) {
    try {
      var resEj = obtenerTextoUrlSeguro('https://www.juegosonce.es/resultados-eurojackpot');
      if (resEj.code === 200 && resEj.body) {
        var txtEj = limpiarHtmlATexto(resEj.body);
        var reEj = new RegExp(
          'celebrado\\s+el\\s+[^,]+,\\s*' + fechaLargaRegex +
          '[\\s\\S]{0,220}?N[úu]meros[:\\s]+(\\d{1,2})\\s+(\\d{1,2})\\s+(\\d{1,2})\\s+(\\d{1,2})\\s+(\\d{1,2})' +
          '[\\s\\S]{0,80}?Soles[:\\s]+(\\d{1,2})\\s+(\\d{1,2})',
          'i'
        );
        var mEj = txtEj.match(reEj);
        if (mEj) {
          resultado.eurojackpot = {
            combinacion: [1, 2, 3, 4, 5].map(function(i) { return parseInt(mEj[i], 10); }),
            soles: [parseInt(mEj[6], 10), parseInt(mEj[7], 10)]
          };
        }
      }
    } catch (eEj) {}
  }

  // 3. Super Once (Diario)
  try {
    var resSo = obtenerTextoUrlSeguro('https://www.juegosonce.es/resultados-superonce');
    if (resSo.code === 200 && resSo.body) {
      var txtSo = limpiarHtmlATexto(resSo.body);
      var reSo = new RegExp(
        fechaLargaRegex +
        '\\s+Combinaci[óo]n\\s+ganadora\\s+del\\s+Sorteo\\s+\\d+\\s+((?:\\d{1,2}\\s+){19}\\d{1,2})',
        'i'
      );
      var mSo = txtSo.match(reSo);
      if (mSo) {
        var numsSo = mSo[1].match(/\d{1,2}/g) || [];
        if (numsSo.length >= 20) {
          resultado.superOnce = numsSo.slice(0, 20).map(function(n) { return parseInt(n, 10); });
        }
      }
    }
  } catch (eSo) {}

  return resultado;
}

/**
 * MOTOR DE EXTRACCIÓN Y CONSENSO CRUZADO PARA LA PRIMITIVA
 * Compara resultados reales de SELAE Oficial + RTVE / El País para la fecha actual.
 * NUNCA envía errores ni mensajes vacíos al grupo público de WhatsApp.
 */
function ejecutarMotorPuenteRSSConsenso(fechaOpcional) {
  var fecha = fechaOpcional || new Date();
  Logger.log('Ejecutando Motor Puente + Consenso (La Primitiva)...');

  var candidatos = [];
  var errores = [];

  try {
    var fSelae = consultarSELAEJson('LAPR', fecha);
    if (fSelae) candidatos.push(fSelae);
  } catch (e1) {
    errores.push('SELAE: ' + e1.message);
  }

  try {
    var fPrensa = consultarFuentePrensa(fecha);
    if (fPrensa) candidatos.push(fPrensa);
  } catch (e2) {
    errores.push('Prensa: ' + e2.message);
  }

  try {
    var fRtve = consultarFuenteRTVE(fecha);
    if (fRtve) candidatos.push(fRtve);
  } catch (e3) {
    errores.push('RTVE: ' + e3.message);
  }

  if (candidatos.length < 2) {
    var detalleFallo = 'Fuentes válidas disponibles hoy: ' + candidatos.length + '/2 necesarias. ' + errores.join(' | ');
    Logger.log('Consenso en espera: ' + detalleFallo);
    enviarAlertaConsensoAdmin(false, null, {
      motivo: 'No se pudieron obtener 2 fuentes públicas coincidentes para hoy.',
      detalle: detalleFallo,
      fuenteA: candidatos[0] || null,
      fuenteB: null
    });
    return {
      consenso: false,
      bloqueado: true,
      mensaje: 'Ejecución automática pausada a la espera de validación manual o publicación oficial.',
      errores: errores
    };
  }

  var comparacion = compararResultadosConsenso(candidatos[0], candidatos[1]);
  if (comparacion.coincide100) {
    enviarAlertaConsensoAdmin(true, comparacion.datosConsensuados);
    return {
      consenso: true,
      bloqueado: false,
      datos: comparacion.datosConsensuados
    };
  }

  enviarAlertaConsensoAdmin(false, null, {
    motivo: 'Discrepancia entre fuentes públicas en los resultados del sorteo.',
    detalle: comparacion.discrepancias.join(', '),
    fuenteA: candidatos[0],
    fuenteB: candidatos[1]
  });

  return {
    consenso: false,
    bloqueado: true,
    mensaje: 'Discrepancia detectada entre fuentes. Cálculos paralizados.',
    discrepancias: comparacion.discrepancias
  };
}

function compararResultadosConsenso(fA, fB) {
  var combA = fA.combinacion.slice().sort(function(a, b) { return a - b; });
  var combB = fB.combinacion.slice().sort(function(a, b) { return a - b; });
  var discrepancias = [];

  for (var i = 0; i < 6; i++) {
    if (combA[i] !== combB[i]) {
      discrepancias.push('Número pos ' + (i + 1) + ': ' + combA[i] + ' vs ' + combB[i]);
    }
  }
  if (fA.complementario !== fB.complementario) {
    discrepancias.push('Complementario: ' + fA.complementario + ' vs ' + fB.complementario);
  }
  if (fA.reintegro !== fB.reintegro) {
    discrepancias.push('Reintegro: ' + fA.reintegro + ' vs ' + fB.reintegro);
  }

  var coincide100 = (discrepancias.length === 0);
  return {
    coincide100: coincide100,
    discrepancias: discrepancias,
    datosConsensuados: coincide100 ? {
      fecha: fA.fecha || fB.fecha || 'Oficial',
      combinacion: combA,
      complementario: fA.complementario,
      reintegro: fA.reintegro,
      fuentes: [fA.fuente, fB.fuente]
    } : null
  };
}

/**
 * SISTEMA DE ALERTAS EXCLUSIVO PARA EL ADMINISTRADOR (Email + Telegram opcional).
 * NUNCA envía errores técnicos ni avisos de fallo al grupo público de WhatsApp.
 */
function enviarAlertaConsensoAdmin(esExito, datos, errorDetalles) {
  var emailDestino = ALERTA_CONFIG.EMAIL_ADMIN || Session.getEffectiveUser().getEmail();

  if (esExito && datos) {
    var asuntoExito = '[CONSENSO 100%] Resultados Oficiales La Primitiva - Peña Tordueles';
    var cuerpoExito = 'Resultados oficiales validados con 100% de coincidencia cruzada:\n\n' +
      'Fecha: ' + datos.fecha + '\n' +
      'Combinación: ' + datos.combinacion.join(' - ') + '\n' +
      'Complementario: ' + datos.complementario + ' | Reintegro: ' + datos.reintegro + '\n' +
      'Fuentes: ' + datos.fuentes.join(' y ');
    try {
      MailApp.sendEmail(emailDestino, asuntoExito, cuerpoExito);
    } catch (eMail) {}
    enviarMensajeTelegram('[CONSENSO 100%] ' + datos.combinacion.join(' - ') + ' (C:' + datos.complementario + ', R:' + datos.reintegro + ')');
  } else {
    var asuntoFallo = '[AVISO ADMIN] Consenso La Primitiva pendiente de revisión manual';
    var cuerpoFallo = 'El Motor Puente + Consenso no ha validado automáticamente el sorteo de La Primitiva.\n\n' +
      'Motivo: ' + (errorDetalles.motivo || 'Sin consenso.') + '\n' +
      'Detalle: ' + (errorDetalles.detalle || '') + '\n\n' +
      'El grupo público de WhatsApp NO ha recibido ningún mensaje de error ni resultados sin confirmar.\n' +
      'Si ya conoces los resultados oficiales, puedes validarlos desde el Panel Admin (Override Manual).';
    try {
      MailApp.sendEmail(emailDestino, asuntoFallo, cuerpoFallo);
    } catch (eMail2) {}
    enviarMensajeTelegram('[AVISO ADMIN] Consenso La Primitiva en espera.');
  }
}

function enviarMensajeTelegram(texto) {
  if (!ALERTA_CONFIG.ACTIVAR_TELEGRAM || !ALERTA_CONFIG.TELEGRAM_BOT_TOKEN || !ALERTA_CONFIG.TELEGRAM_CHAT_ID) {
    return;
  }
  try {
    var url = 'https://api.telegram.org/bot' + ALERTA_CONFIG.TELEGRAM_BOT_TOKEN + '/sendMessage';
    UrlFetchApp.fetch(url, {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify({
        chat_id: ALERTA_CONFIG.TELEGRAM_CHAT_ID,
        text: texto
      }),
      muteHttpExceptions: true
    });
  } catch (e) {}
}

function forzarResultadosManuales(numeros, complementario, reintegro, fechaOpcional) {
  try {
    var numsArray = [];
    if (typeof numeros === 'string') {
      numsArray = numeros.split(',').map(function(s) { return parseInt(s.trim(), 10); });
    } else if (Array.isArray(numeros)) {
      numsArray = numeros.map(function(n) { return parseInt(n, 10); });
    }
    numsArray = numsArray.filter(function(n) { return !isNaN(n) && n >= 1 && n <= 49; });

    if (numsArray.length !== 6) {
      return { success: false, message: 'Se requieren exactamente 6 números válidos entre 1 y 49.' };
    }

    var comp = parseInt(complementario, 10);
    if (isNaN(comp) || comp < 1 || comp > 49) {
      return { success: false, message: 'Complementario debe estar entre 1 y 49.' };
    }

    var r = parseInt(reintegro, 10);
    if (isNaN(r) || r < 0 || r > 9) {
      return { success: false, message: 'Reintegro debe estar entre 0 y 9.' };
    }

    numsArray.sort(function(a, b) { return a - b; });

    var ss = obtenerSpreadsheetConfigurado();
    var sheetSorteos = ss.getSheetByName(PROYECTO_CONFIG.SHEET_SORTEOS);
    if (!sheetSorteos || sheetSorteos.getLastRow() < 2) {
      return { success: false, message: 'No hay sorteos registrados en la hoja "Sorteos".' };
    }

    var lastRow = sheetSorteos.getLastRow();
    var filaSorteo = sheetSorteos.getRange(lastRow, 1, 1, 10).getValues()[0];
    var jornada = filaSorteo[0];
    var combinacionJugadaStr = (filaSorteo[5] || '').toString();
    var jugados = combinacionJugadaStr.split(',').map(function(n) { return parseInt(n.trim(), 10); }).filter(function(n) { return !isNaN(n); });

    var aciertos = 0;
    var acertados = [];
    for (var i = 0; i < jugados.length; i++) {
      if (numsArray.indexOf(jugados[i]) !== -1) {
        aciertos++;
        acertados.push(jugados[i]);
      }
    }

    var premioEstimado = 0;
    if (aciertos === 6) premioEstimado = 1500000;
    else if (aciertos === 5) premioEstimado = 2450.50;
    else if (aciertos === 4) premioEstimado = 78.20;
    else if (aciertos === 3) premioEstimado = 8.00;
    if (r === 4) premioEstimado += 44.0;

    sheetSorteos.getRange(lastRow, 7).setValue(numsArray.join(', '));
    sheetSorteos.getRange(lastRow, 8).setValue(aciertos);
    sheetSorteos.getRange(lastRow, 9).setValue(premioEstimado);
    sheetSorteos.getRange(lastRow, 10).setValue(premioEstimado <= 2000 ? premioEstimado : 0);

    var fechaStr = fechaOpcional || Utilities.formatDate(new Date(), PROYECTO_CONFIG.TIMEZONE, 'dd/MM/yyyy');
    var mensajeWhatsApp = '🏆 *RESULTADO OFICIAL DE LA PRIMITIVA (VALIDADO POR ADMINISTRACIÓN)* 🏆\n\n' +
      '🎯 *Jornada:* ' + jornada + ' • *Fecha:* ' + fechaStr + '\n' +
      '✨ *Combinación Ganadora:* ' + numsArray.join(' - ') + '\n' +
      '🎱 *Complementario:* ' + comp + ' | *Reintegro:* ' + r + '\n\n' +
      '🔍 *Aciertos de la Peña:* ' + aciertos + ' aciertos ' + (acertados.length > 0 ? '([' + acertados.join(', ') + '])' : '') + '\n' +
      '💰 *Premio Total:* ' + premioEstimado.toFixed(2) + ' €\n\n' +
      (premioEstimado <= 2000
        ? '📥 *Destino:* Añadido íntegramente a la Bolsa de Premios Menores (Art. 5.1).'
        : '🏦 *Destino:* Tramitación bancaria oficial para socios activos (Art. 5.2).');

    enviarMensajeGreenApi(mensajeWhatsApp);

    return {
      success: true,
      jornada: jornada,
      combinacion: numsArray,
      complementario: comp,
      reintegro: r,
      aciertos: aciertos,
      premio: premioEstimado,
      message: 'Combinación oficial insertada manualmente y escrutinio completado con éxito.'
    };
  } catch (error) {
    return { success: false, message: 'Error interno: ' + error.message };
  }
}

/**
 * COMPILACIÓN EN VIVO DEL BOLETÍN DIARIO DE LOTERÍAS (SELAE + JUEGOS ONCE)
 * Extrae únicamente sorteos reales correspondientes a la fecha solicitada.
 * Jamás inserta combinaciones inventadas ni de ejemplo.
 */
function obtenerBoletinDiarioLive(fechaReferencia, datosPrimitivaConsenso, resumenPena) {
  var fecha = fechaReferencia || new Date();
  var fechaStr = Utilities.formatDate(fecha, PROYECTO_CONFIG.TIMEZONE, 'dd/MM/yyyy');
  var diaSemanaIndex = fecha.getDay(); // 0=Dom, 1=Lun, 2=Mar, 3=Mié, 4=Jue, 5=Vie, 6=Sáb
  var diasMayus = ['DOMINGO', 'LUNES', 'MARTES', 'MIÉRCOLES', 'JUEVES', 'VIERNES', 'SÁBADO'];
  var diaTexto = diasMayus[diaSemanaIndex];

  var bloquesONLAE = [];
  var bloquesONCE = [];
  var gamesCount = 0;

  // 1. BONOLOTO (Todos los días)
  var bonoloto = consultarSELAEJson('BONO', fecha) || consultarPrensaElPais('bonoloto', fecha, 1, 49, 6);
  if (bonoloto && bonoloto.combinacion && bonoloto.combinacion.length === 6) {
    bloquesONLAE.push(
      '🔵 BONOLOTO\n' +
      '🎱 ' + bonoloto.combinacion.map(pad2Num).join(' · ') + '\n' +
      '➕ Complementario: ' + pad2Num(bonoloto.complementario) + '  |  ♻️ Reintegro: ' + bonoloto.reintegro
    );
    gamesCount++;
  }

  // 2. LA PRIMITIVA (Lunes 1, Jueves 4, Sábado 6)
  if (diaSemanaIndex === 1 || diaSemanaIndex === 4 || diaSemanaIndex === 6) {
    var primitiva = (datosPrimitivaConsenso && datosPrimitivaConsenso.combinacion && datosPrimitivaConsenso.combinacion.length === 6)
      ? datosPrimitivaConsenso
      : (consultarSELAEJson('LAPR', fecha) || consultarFuentePrensa(fecha) || consultarFuenteRTVE(fecha));
    if (primitiva && primitiva.combinacion && primitiva.combinacion.length === 6) {
      bloquesONLAE.push(
        '🔴 LA PRIMITIVA\n' +
        '🎱 ' + primitiva.combinacion.map(pad2Num).join(' · ') + '\n' +
        '➕ Complementario: ' + pad2Num(primitiva.complementario) + '  |  ♻️ Reintegro: ' + primitiva.reintegro
      );
      gamesCount++;
    }
  }

  // 3. EUROMILLONES (Martes 2, Viernes 5)
  if (diaSemanaIndex === 2 || diaSemanaIndex === 5) {
    var eurom = consultarSELAEJson('EMIL', fecha) || consultarPrensaElPais('euromillones', fecha, 1, 50, 5);
    if (eurom && eurom.combinacion && eurom.combinacion.length === 5) {
      bloquesONLAE.push(
        '⭐ EUROMILLONES\n' +
        '🎱 ' + eurom.combinacion.map(pad2Num).join(' · ') +
        (eurom.estrellas && eurom.estrellas.length === 2 ? '\n⭐ Estrellas: ' + eurom.estrellas.map(pad2Num).join(' · ') : '')
      );
      gamesCount++;
    }
  }

  // 4. EL GORDO DE LA PRIMITIVA (Domingos 0)
  if (diaSemanaIndex === 0) {
    var gordo = consultarSELAEJson('ELGR', fecha) || consultarPrensaElPais('el-gordo', fecha, 1, 54, 5);
    if (gordo && gordo.combinacion && gordo.combinacion.length === 5) {
      bloquesONLAE.push(
        '🟢 EL GORDO DE LA PRIMITIVA\n' +
        '🎱 ' + gordo.combinacion.map(pad2Num).join(' · ') +
        (gordo.clave !== null && gordo.clave !== undefined ? '\n🔑 Número clave: ' + gordo.clave : '')
      );
      gamesCount++;
    }
  }

  // 5. LOTERÍA NACIONAL (Jueves 4, Sábado 6)
  if (diaSemanaIndex === 4 || diaSemanaIndex === 6) {
    var lnac = consultarSELAEJson('LNAC', fecha) || consultarLoteriaNacionalElPais(fecha);
    if (lnac && lnac.primerPremio) {
      bloquesONLAE.push(
        '🏛️ LOTERÍA NACIONAL\n' +
        '🥇 1er Premio: ' + lnac.primerPremio +
        (lnac.segundoPremio ? '  |  🥈 2º: ' + lnac.segundoPremio : '') +
        (lnac.reintegros ? '\n♻️ Reintegros: ' + lnac.reintegros : '')
      );
      gamesCount++;
    }
  }

  // 6. JUEGOS ONCE (Cupón, Eurojackpot, Super Once)
  var once = consultarJuegosONCEEnVivo(fecha);
  if (once.cupon) {
    bloquesONCE.push(
      '🦯 ' + once.cupon.titulo + '\n' +
      '🎟️ ' + once.cupon.numero + '  |  Serie: ' + once.cupon.serie
    );
    gamesCount++;
  }
  if (once.eurojackpot) {
    bloquesONCE.push(
      '🇪🇺 EUROJACKPOT\n' +
      '🎱 ' + once.eurojackpot.combinacion.map(pad2Num).join(' · ') + '\n' +
      '☀️ Soles: ' + once.eurojackpot.soles.map(pad2Num).join(' · ')
    );
    gamesCount++;
  }
  if (once.superOnce) {
    bloquesONCE.push(
      '🟠 SUPER ONCE\n' +
      '🎱 ' + once.superOnce.slice(0, 10).map(pad2Num).join(' · ') + '\n' +
      '🎱 ' + once.superOnce.slice(10, 20).map(pad2Num).join(' · ')
    );
    gamesCount++;
  }

  if (gamesCount === 0) {
    return {
      success: false,
      dateFormatted: fechaStr,
      dayOfWeek: diaTexto,
      gamesCount: 0,
      formattedWhatsAppMessage: '',
      message: 'Aún no hay resultados oficiales publicados para hoy (' + fechaStr + ') en las fuentes públicas.'
    };
  }

  var lineas = [
    '📰 BOLETÍN DIARIO DE LOTERÍAS 📰',
    '━━━━━━━━━━━━━━━━━━',
    '📅 ' + diaTexto + ' · ' + fechaStr,
    '━━━━━━━━━━━━━━━━━━'
  ];

  if (bloquesONLAE.length > 0) {
    lineas.push('');
    lineas.push('🏛️ LOTERÍAS Y APUESTAS DEL ESTADO');
    lineas.push('');
    lineas.push(bloquesONLAE.join('\n\n'));
  }

  if (bloquesONCE.length > 0) {
    lineas.push('');
    lineas.push('━━━━━━━━━━━━━━━━━━');
    lineas.push('🍀 JUEGOS ONCE');
    lineas.push('');
    lineas.push(bloquesONCE.join('\n\n'));
  }

  lineas.push('');
  lineas.push('━━━━━━━━━━━━━━━━━━');

  if (resumenPena) {
    lineas.push('🎯 Escrutinio Peña (J' + resumenPena.jornada + '): ' + resumenPena.aciertos + ' aciertos • Premio: ' + resumenPena.premio.toFixed(2) + ' €');
  }

  lineas.push('🍀 PEÑA PRIMITIVA TORDUELES 🍀');
  lineas.push('¡Mucha suerte a todos! 🤞');

  return {
    success: true,
    dateFormatted: fechaStr,
    dayOfWeek: diaTexto,
    gamesCount: gamesCount,
    formattedWhatsAppMessage: lineas.join('\n')
  };
}

/**
 * Envío manual o bajo demanda del Boletín Diario Real
 */
function enviarBoletinDiarioWhatsApp(forzarEnvio) {
  var ss = obtenerSpreadsheetConfigurado();
  var sheetConfig = ss.getSheetByName(PROYECTO_CONFIG.SHEET_CONFIGURACION);
  var modoResumen = (sheetConfig ? sheetConfig.getRange('A2').getValue() : 'SÍ').toString().trim().toUpperCase();

  if (modoResumen !== 'SÍ' && forzarEnvio !== true) {
    return { success: false, message: 'ModoResumen está configurado en NO.' };
  }

  var boletin = obtenerBoletinDiarioLive(new Date(), null, null);
  if (!boletin.success || !boletin.formattedWhatsAppMessage) {
    Logger.log('Boletín diario omitido para no enviar mensaje vacío: ' + boletin.message);
    return boletin;
  }

  enviarMensajeGreenApi(boletin.formattedWhatsAppMessage);
  return boletin;
}

/**
 * ORQUESTADOR NOCTURNO UNIFICADO (22:45 CET)
 * Extrae los resultados REALES de hoy (ONLAE + ONCE), valida Primitiva en días de sorteo
 * y envía UN SOLO mensaje con resultados reales verificados.
 * Jamás envía mensajes vacíos ni avisos de error al grupo de WhatsApp.
 */
function ejecutarOrquestadorNocturnoUnificado() {
  Logger.log('Iniciando Orquestador Nocturno Unificado...');
  var ss = obtenerSpreadsheetConfigurado();
  var sheetConfig = ss.getSheetByName(PROYECTO_CONFIG.SHEET_CONFIGURACION);
  var modoResumen = (sheetConfig ? sheetConfig.getRange('A2').getValue() : 'SÍ').toString().trim().toUpperCase();

  var ahora = new Date();
  var diaSemana = ahora.getDay(); // 1: Lunes, 4: Jueves, 6: Sábado
  var esDiaPrimitiva = (diaSemana === 1 || diaSemana === 4 || diaSemana === 6);

  var sheetSorteos = ss.getSheetByName(PROYECTO_CONFIG.SHEET_SORTEOS);
  var lastRow = sheetSorteos ? sheetSorteos.getLastRow() : 0;
  var sorteoPendiente = false;

  if (lastRow >= 2) {
    var combinacionGanadoraActual = (sheetSorteos.getRange(lastRow, 7).getValue() || '').toString().trim();
    var combinacionJugadaActual = (sheetSorteos.getRange(lastRow, 6).getValue() || '').toString().trim();
    sorteoPendiente = (combinacionJugadaActual !== '' && combinacionGanadoraActual === '');
  }

  var datosPrimitiva = null;
  var resumenPena = null;

  if (esDiaPrimitiva || sorteoPendiente) {
    var resultadoConsenso = ejecutarMotorPuenteRSSConsenso(ahora);
    if (resultadoConsenso && resultadoConsenso.consenso && resultadoConsenso.datos) {
      datosPrimitiva = resultadoConsenso.datos;
      if (lastRow >= 2 && sorteoPendiente) {
        var fila = sheetSorteos.getRange(lastRow, 1, 1, 10).getValues()[0];
        var jornada = fila[0];
        var combinacionJugadaStr = (fila[5] || '').toString();
        var jugados = combinacionJugadaStr.split(',').map(function(n) { return parseInt(n.trim(), 10); }).filter(function(n) { return !isNaN(n); });
        var ganadores = datosPrimitiva.combinacion;

        var aciertos = 0;
        var acertados = [];
        for (var i = 0; i < jugados.length; i++) {
          if (ganadores.indexOf(jugados[i]) !== -1) {
            aciertos++;
            acertados.push(jugados[i]);
          }
        }

        var premio = 0;
        if (aciertos === 6) premio = 1500000;
        else if (aciertos === 5) premio = 2450.50;
        else if (aciertos === 4) premio = 78.20;
        else if (aciertos === 3) premio = 8.00;
        if (datosPrimitiva.reintegro === 4) premio += 44.0;

        sheetSorteos.getRange(lastRow, 7).setValue(ganadores.join(', '));
        sheetSorteos.getRange(lastRow, 8).setValue(aciertos);
        sheetSorteos.getRange(lastRow, 9).setValue(premio);
        sheetSorteos.getRange(lastRow, 10).setValue(premio <= 2000 ? premio : 0);

        resumenPena = {
          jornada: jornada,
          aciertos: aciertos,
          acertados: acertados,
          premio: premio
        };
      }
    }
  }

  if (modoResumen === 'SÍ') {
    var boletinLive = obtenerBoletinDiarioLive(ahora, datosPrimitiva, resumenPena);
    if (!boletinLive.success || !boletinLive.formattedWhatsAppMessage) {
      Logger.log('No se obtuvieron resultados en vivo para el boletín; no se envía mensaje vacío al grupo.');
      try {
        MailApp.sendEmail(
          ALERTA_CONFIG.EMAIL_ADMIN,
          '[Boletín Diario] Sin resultados publicados a las 22:45',
          'No se pudieron extraer resultados publicados hoy (' + boletinLive.dateFormatted + '). No se envió ningún mensaje al grupo de WhatsApp.'
        );
      } catch (eM) {}
      return { success: false, enviado: false, message: boletinLive.message };
    }

    enviarMensajeGreenApi(boletinLive.formattedWhatsAppMessage);
    Logger.log('Boletín multijuego real enviado en 1 único mensaje (' + boletinLive.gamesCount + ' juegos).');
    return { success: true, enviado: true, modo: 'BOLETIN_UNIFICADO', gamesCount: boletinLive.gamesCount };
  } else if (datosPrimitiva && resumenPena) {
    var msgPena = '🏆 *RESULTADO OFICIAL DEL SORTEO - PEÑA TORDUELES* 🏆\n\n' +
      '🎯 *Jornada:* ' + resumenPena.jornada + ' • *Fecha:* ' + (datosPrimitiva.fecha || Utilities.formatDate(ahora, PROYECTO_CONFIG.TIMEZONE, 'dd/MM/yyyy')) + '\n' +
      '✨ *Combinación Ganadora (Consenso 100%):* ' + datosPrimitiva.combinacion.join(' · ') + '\n' +
      '🎱 *Complementario:* ' + datosPrimitiva.complementario + ' | *Reintegro:* ' + datosPrimitiva.reintegro + '\n\n' +
      '🔍 *Aciertos de la Peña:* ' + resumenPena.aciertos + ' aciertos ' + (resumenPena.acertados.length > 0 ? '([' + resumenPena.acertados.join(', ') + '])' : '') + '\n' +
      '💰 *Premio Obtenido:* ' + resumenPena.premio.toFixed(2) + ' €\n\n' +
      (resumenPena.premio <= 2000 ? '📥 *Destino:* Añadido a la Bolsa de Premios Menores (Art. 5.1).' : '🏦 *Destino:* Tramitación bancaria individual para socios activos (Art. 5.2).');
    enviarMensajeGreenApi(msgPena);
    return { success: true, enviado: true, modo: 'SOLO_PRIMITIVA', consensoPrimitiva: true };
  }

  return { success: true, enviado: false, modo: 'INACTIVO' };
}

/**
 * Configura el disparador único nocturno a las 22:45 CET (hora a la que ya están publicados SELAE y ONCE)
 */
function configurarTriggerOrquestadorNocturno() {
  var handlersAReemplazar = [
    'ejecutarOrquestadorNocturnoUnificado',
    'procesarEscrutinioYWhatsApp',
    'enviarBoletinDiarioWhatsApp'
  ];

  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    if (handlersAReemplazar.indexOf(triggers[i].getHandlerFunction()) !== -1) {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }

  var nuevoTrigger = ScriptApp.newTrigger('ejecutarOrquestadorNocturnoUnificado')
    .timeBased()
    .everyDays(1)
    .atHour(22)
    .nearMinute(45)
    .create();

  Logger.log('Disparador único nocturno instalado (22:45 CET). ID: ' + nuevoTrigger.getUniqueId());
  return nuevoTrigger;
}

function enviarMensajeGreenApi(mensaje) {
  if (!mensaje || String(mensaje).trim() === '') return;
  var url = 'https://api.green-api.com/waInstance' + PROYECTO_CONFIG.GREEN_API_INSTANCE_ID + '/sendMessage/' + PROYECTO_CONFIG.GREEN_API_TOKEN;
  var payload = {
    chatId: PROYECTO_CONFIG.GREEN_API_CHAT_ID,
    message: mensaje
  };

  try {
    var response = UrlFetchApp.fetch(url, {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });
    Logger.log('Respuesta Green API: ' + response.getContentText());
  } catch (e) {
    Logger.log('Error al enviar mensaje por Green API: ' + e.message);
  }
}

function enviarImagenGreenApi(fileUrl, fileName, caption) {
  if (!fileUrl) return false;
  var url = 'https://api.green-api.com/waInstance' + PROYECTO_CONFIG.GREEN_API_INSTANCE_ID + '/sendFileByUrl/' + PROYECTO_CONFIG.GREEN_API_TOKEN;
  var payload = {
    chatId: PROYECTO_CONFIG.GREEN_API_CHAT_ID,
    urlFile: fileUrl,
    fileName: fileName || 'resguardo.jpg',
    caption: caption || ''
  };

  try {
    var response = UrlFetchApp.fetch(url, {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });
    var code = response.getResponseCode();
    Logger.log('Respuesta Green API sendFileByUrl (' + code + '): ' + response.getContentText());
    return code >= 200 && code < 300;
  } catch (e) {
    Logger.log('Error al enviar imagen por Green API: ' + e.message);
    return false;
  }
}

// ============================================================================
// 6. UTILIDADES AUXILIARES DE DRIVE & SHEETS
// ============================================================================
function obtenerOCrearCarpeta(parentFolder, folderName) {
  var folders = parentFolder.getFoldersByName(folderName);
  if (folders.hasNext()) {
    return folders.next();
  }
  return parentFolder.createFolder(folderName);
}

function obtenerOCrearSpreadsheet(folder, title) {
  var files = folder.getFilesByName(title);
  if (files.hasNext()) {
    return SpreadsheetApp.openById(files.next().getId());
  }
  var newSs = SpreadsheetApp.create(title);
  DriveApp.getFileById(newSs.getId()).moveTo(folder);
  return newSs;
}

function obtenerSpreadsheetConfigurado() {
  var id = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
  if (id) {
    try {
      return SpreadsheetApp.openById(id);
    } catch (e) {}
  }
  try {
    var activo = SpreadsheetApp.getActiveSpreadsheet();
    if (activo) return activo;
  } catch (e2) {}
  if (PROYECTO_CONFIG.DEFAULT_SPREADSHEET_ID) {
    return SpreadsheetApp.openById(PROYECTO_CONFIG.DEFAULT_SPREADSHEET_ID);
  }
  throw new Error('No se encontró la hoja de cálculo configurada.');
}

function aplicarEstiloEncabezado(range) {
  range.setBackground(PROYECTO_CONFIG.COLOR_HEADER_NAVY);
  range.setFontColor(PROYECTO_CONFIG.COLOR_HEADER_TEXT);
  range.setFontWeight('bold');
  range.setHorizontalAlignment('center');
}

function eliminarHojasSobrantes(ss) {
  var hojas = ss.getSheets();
  var nombresValidos = [
    PROYECTO_CONFIG.SHEET_USUARIOS,
    PROYECTO_CONFIG.SHEET_SORTEOS,
    PROYECTO_CONFIG.SHEET_TESORERIA,
    PROYECTO_CONFIG.SHEET_CONFIGURACION,
    PROYECTO_CONFIG.SHEET_APUESTAS_ACTIVAS
  ];

  for (var i = 0; i < hojas.length; i++) {
    var hoja = hojas[i];
    if (nombresValidos.indexOf(hoja.getName()) === -1 && hojas.length > 5) {
      try {
        ss.deleteSheet(hoja);
      } catch (e) {}
    }
  }
}

// ============================================================================
// 7. MOTOR DE ESCRUTINIO AUTOMÁTICO Y PREMIOS DEL CICLO
// ============================================================================

/**
 * Consulta el motor de consenso oficial para una fecha concreta sin enviar
 * alertas de email/WhatsApp (ideal para lectura en vivo del Panel de Admin).
 */
function obtenerConsensoSilenciosoPrimitiva(fechaOpcional) {
  var fecha = fechaOpcional || new Date();
  var candidatos = [];
  var errores = [];

  try {
    var fSelae = consultarSELAEJson('LAPR', fecha);
    if (fSelae) candidatos.push(fSelae);
  } catch (e1) {
    errores.push('SELAE: ' + e1.message);
  }

  try {
    var fPrensa = consultarFuentePrensa(fecha);
    if (fPrensa) candidatos.push(fPrensa);
  } catch (e2) {
    errores.push('Prensa: ' + e2.message);
  }

  try {
    var fRtve = consultarFuenteRTVE(fecha);
    if (fRtve) candidatos.push(fRtve);
  } catch (e3) {
    errores.push('RTVE: ' + e3.message);
  }

  if (candidatos.length >= 2) {
    for (var a = 0; a < candidatos.length; a++) {
      for (var b = a + 1; b < candidatos.length; b++) {
        var cmp = compararResultadosConsenso(candidatos[a], candidatos[b]);
        if (cmp.coincide100 && cmp.datosConsensuados) {
          return {
            consenso: true,
            datos: cmp.datosConsensuados,
            errores: errores
          };
        }
      }
    }
    return {
      consenso: false,
      datos: null,
      mensaje: 'Discrepancia detectada entre las fuentes oficiales consultadas.',
      errores: errores
    };
  }

  return {
    consenso: false,
    datos: null,
    mensaje: candidatos.length === 1
      ? 'Solo 1 fuente oficial publicada; a la espera de segunda fuente de consenso.'
      : 'Resultados oficiales aún no publicados para esta fecha.',
    errores: errores
  };
}

/**
 * Normaliza una cadena o listado de números a un array ordenado de enteros (1..49).
 */
function parsearCombinacionEnteros(valor) {
  if (!valor && valor !== 0) return [];
  var partes = Array.isArray(valor)
    ? valor
    : String(valor).split(/[,;\s\-·]+/);
  var limpios = [];
  for (var i = 0; i < partes.length; i++) {
    var n = parseInt(String(partes[i]).trim(), 10);
    if (!isNaN(n) && n >= 1 && n <= 49 && limpios.indexOf(n) === -1) {
      limpios.push(n);
    }
  }
  limpios.sort(function(a, b) { return a - b; });
  return limpios;
}

/**
 * Determina el sorteo del día actual y la apuesta que juega la peña leyendo de
 * la pestaña 'Apuestas Activas' (y en su defecto del sorteo activo en 'Sorteos').
 */
function determinarSorteoYApuestaActiva(ss, fechaRef) {
  var ahora = fechaRef || new Date();
  var zona = PROYECTO_CONFIG.TIMEZONE || 'Europe/Madrid';
  var hoyYMD = Utilities.formatDate(ahora, zona, 'yyyy-MM-dd');
  var diaIdx = ahora.getDay();
  var diasNombres = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  var nombreDiaHoy = diasNombres[diaIdx];
  var esDiaPrimitiva = (diaIdx === 1 || diaIdx === 4 || diaIdx === 6);

  var info = {
    esDiaDeSorteo: esDiaPrimitiva,
    nombreSorteo: 'La Primitiva · ' + nombreDiaHoy,
    fechaSorteo: hoyYMD,
    ciclo: 1,
    jornada: 1,
    apuestaNumeros: [],
    reintegroJugado: null,
    origenApuesta: 'SIN_APUESTA',
    filaSorteos: null
  };

  // 1. Buscar en pestaña 'Apuestas Activas'
  var sheetApuestas = ss.getSheetByName(PROYECTO_CONFIG.SHEET_APUESTAS_ACTIVAS || 'Apuestas Activas');
  if (!sheetApuestas) {
    try {
      sheetApuestas = configurarPestanaApuestasActivas(ss);
    } catch (eCreate) {}
  }

  if (sheetApuestas && sheetApuestas.getLastRow() >= 2) {
    var numRowsA = sheetApuestas.getLastRow() - 1;
    var rowsA = sheetApuestas.getRange(2, 1, numRowsA, 7).getValues();
    var candidataCoincidente = null;
    var candidataActiva = null;

    for (var i = rowsA.length - 1; i >= 0; i--) {
      var rA = rowsA[i];
      var combA = parsearCombinacionEnteros(rA[4]);
      if (combA.length === 0) continue;

      var activaFlag = String(rA[6] || 'SÍ').trim().toUpperCase();
      if (activaFlag === 'NO') continue;

      var fechaRawA = rA[1];
      var fechaYMDA = (fechaRawA instanceof Date)
        ? Utilities.formatDate(fechaRawA, zona, 'yyyy-MM-dd')
        : normalizarFechaAYMD(String(fechaRawA || ''));

      var diaTextoA = String(rA[0] || '').trim().toLowerCase();
      var reintRawA = rA[5];
      var reintValA = (reintRawA !== '' && reintRawA !== null && reintRawA !== undefined && !isNaN(parseInt(reintRawA, 10)))
        ? parseInt(reintRawA, 10)
        : null;

      var itemA = {
        nombreSorteo: String(rA[0] || ('La Primitiva · ' + nombreDiaHoy)).trim(),
        fechaSorteo: fechaYMDA || hoyYMD,
        ciclo: parseInt(rA[2], 10) || 1,
        jornada: parseInt(rA[3], 10) || 1,
        apuestaNumeros: combA,
        reintegroJugado: reintValA
      };

      if (fechaYMDA === hoyYMD || (diaTextoA && diaTextoA.indexOf(nombreDiaHoy.toLowerCase()) !== -1)) {
        candidataCoincidente = itemA;
        break;
      }
      if (!candidataActiva) {
        candidataActiva = itemA;
      }
    }

    var elegidaA = candidataCoincidente || candidataActiva;
    if (elegidaA) {
      info.nombreSorteo = elegidaA.nombreSorteo;
      info.fechaSorteo = elegidaA.fechaSorteo;
      info.ciclo = elegidaA.ciclo;
      info.jornada = elegidaA.jornada;
      info.apuestaNumeros = elegidaA.apuestaNumeros;
      info.reintegroJugado = elegidaA.reintegroJugado;
      info.origenApuesta = 'Apuestas Activas';
    }
  }

  // 2. Complementar o tomar respaldo desde la pestaña 'Sorteos' (apuesta activa / pendiente / última)
  var sheetSorteos = ss.getSheetByName(PROYECTO_CONFIG.SHEET_SORTEOS || 'Sorteos');
  if (sheetSorteos && sheetSorteos.getLastRow() >= 2) {
    var lastRowS = sheetSorteos.getLastRow();
    var numColsS = Math.max(16, sheetSorteos.getLastColumn());
    var rowsS = sheetSorteos.getRange(2, 1, lastRowS - 1, numColsS).getValues();

    var filaCoincidenteS = null;
    var filaPendienteS = null;
    var filaUltimaConApuestaS = null;

    for (var s = rowsS.length - 1; s >= 0; s--) {
      var rS = rowsS[s];
      var combJugadaS = parsearCombinacionEnteros(rS[5]);
      if (combJugadaS.length === 0) continue;

      var fechaS = (rS[1] instanceof Date)
        ? Utilities.formatDate(rS[1], zona, 'yyyy-MM-dd')
        : normalizarFechaAYMD(String(rS[1] || ''));

      var metaS = {
        rowNum: s + 2,
        jornada: parseInt(rS[0], 10) || (s + 1),
        fechaSorteo: fechaS || hoyYMD,
        ciclo: parseInt(rS[13], 10) || 1,
        apuestaNumeros: combJugadaS,
        reintegroJugado: (rS[14] !== '' && rS[14] !== null && rS[14] !== undefined && !isNaN(parseInt(rS[14], 10)))
          ? parseInt(rS[14], 10)
          : null,
        combinacionGanadoraGuardada: parsearCombinacionEnteros(rS[6]),
        premioGuardado: (rS[8] !== '' && rS[8] !== null && rS[8] !== undefined && !isNaN(parseFloat(rS[8])))
          ? parseFloat(rS[8])
          : null
      };

      if (fechaS === info.fechaSorteo || fechaS === hoyYMD) {
        filaCoincidenteS = metaS;
        break;
      }
      if (!filaPendienteS && metaS.combinacionGanadoraGuardada.length === 0) {
        filaPendienteS = metaS;
      }
      if (!filaUltimaConApuestaS) {
        filaUltimaConApuestaS = metaS;
      }
    }

    var elegidaS = filaCoincidenteS || filaPendienteS || filaUltimaConApuestaS;
    if (elegidaS) {
      info.filaSorteos = elegidaS.rowNum;
      info.premioGuardado = elegidaS.premioGuardado;
      info.combinacionGanadoraGuardada = elegidaS.combinacionGanadoraGuardada;
      if (info.apuestaNumeros.length === 0) {
        info.fechaSorteo = elegidaS.fechaSorteo;
        info.ciclo = elegidaS.ciclo;
        info.jornada = elegidaS.jornada;
        info.apuestaNumeros = elegidaS.apuestaNumeros;
        info.reintegroJugado = elegidaS.reintegroJugado;
        info.origenApuesta = 'Sorteos';
      }
    }
  }

  return info;
}

/**
 * Calcula los aciertos exactos comparando la apuesta de la peña contra la combinación ganadora.
 */
function calcularAciertosCombinacion(apuestaNumeros, reintegroJugado, combinacionGanadora, complementario, reintegroGanador) {
  var aciertosNumeros = [];
  var apuesta = parsearCombinacionEnteros(apuestaNumeros);
  var ganadora = parsearCombinacionEnteros(combinacionGanadora);

  for (var i = 0; i < apuesta.length; i++) {
    if (ganadora.indexOf(apuesta[i]) !== -1) {
      aciertosNumeros.push(apuesta[i]);
    }
  }

  var compNum = (complementario !== null && complementario !== undefined && !isNaN(parseInt(complementario, 10)))
    ? parseInt(complementario, 10)
    : null;
  var reintGanNum = (reintegroGanador !== null && reintegroGanador !== undefined && !isNaN(parseInt(reintegroGanador, 10)))
    ? parseInt(reintegroGanador, 10)
    : null;
  var reintJugNum = (reintegroJugado !== null && reintegroJugado !== undefined && !isNaN(parseInt(reintegroJugado, 10)))
    ? parseInt(reintegroJugado, 10)
    : null;

  var complementarioAcertado = (compNum !== null && apuesta.indexOf(compNum) !== -1);
  var reintegroAcertado = (reintJugNum !== null && reintGanNum !== null && reintJugNum === reintGanNum);

  var nCount = aciertosNumeros.length;
  var textoAciertos = 'Aciertos: ' + nCount + (nCount === 1 ? ' número' : ' números');
  if (complementarioAcertado) {
    textoAciertos += ' + Complementario';
  }
  if (reintegroAcertado) {
    textoAciertos += ' + Reintegro';
  }

  return {
    aciertosNumeros: aciertosNumeros,
    cantidadAciertos: nCount,
    complementarioAcertado: complementarioAcertado,
    reintegroAcertado: reintegroAcertado,
    textoAciertos: textoAciertos
  };
}

/**
 * Motor de Escrutinio Automático del Ciclo (JSON estructurado).
 * Determina el sorteo del día + apuesta activa de la peña, consulta la combinación
 * ganadora mediante el motor de consenso oficial y calcula los aciertos exactos.
 */
function ejecutarEscrutinioAutomatico() {
  try {
    var ss = obtenerSpreadsheetConfigurado();
    var ahora = new Date();
    var contexto = determinarSorteoYApuestaActiva(ss, ahora);

    var fechaConsulta = ahora;
    if (contexto.fechaSorteo && /^\d{4}-\d{2}-\d{2}$/.test(contexto.fechaSorteo)) {
      var partesFecha = contexto.fechaSorteo.split('-');
      fechaConsulta = new Date(
        parseInt(partesFecha[0], 10),
        parseInt(partesFecha[1], 10) - 1,
        parseInt(partesFecha[2], 10),
        22,
        0,
        0
      );
    }

    var resConsenso = obtenerConsensoSilenciosoPrimitiva(fechaConsulta);
    if (!resConsenso.consenso && contexto.fechaSorteo !== Utilities.formatDate(ahora, PROYECTO_CONFIG.TIMEZONE || 'Europe/Madrid', 'yyyy-MM-dd')) {
      var resHoy = obtenerConsensoSilenciosoPrimitiva(ahora);
      if (resHoy.consenso) {
        resConsenso = resHoy;
      }
    }

    var combinacionGanadora = [];
    var complementario = null;
    var reintegroGanador = null;
    var fuentesConsenso = [];
    var fechaResultado = contexto.fechaSorteo;
    var consensoDisponible = false;
    var mensajeConsenso = resConsenso.mensaje || '';

    if (resConsenso.consenso && resConsenso.datos && resConsenso.datos.combinacion && resConsenso.datos.combinacion.length === 6) {
      consensoDisponible = true;
      combinacionGanadora = resConsenso.datos.combinacion.slice().sort(function(a, b) { return a - b; });
      complementario = resConsenso.datos.complementario;
      reintegroGanador = resConsenso.datos.reintegro;
      fuentesConsenso = resConsenso.datos.fuentes || [];
      fechaResultado = resConsenso.datos.fecha || contexto.fechaSorteo;
    }

    var calculo = {
      aciertosNumeros: [],
      cantidadAciertos: 0,
      complementarioAcertado: false,
      reintegroAcertado: false,
      textoAciertos: consensoDisponible
        ? (contexto.apuestaNumeros.length > 0 ? 'Aciertos: 0 números' : 'Sin apuesta activa registrada en la peña')
        : 'Pendiente de combinación ganadora oficial por consenso'
    };

    if (consensoDisponible && contexto.apuestaNumeros.length > 0) {
      calculo = calcularAciertosCombinacion(
        contexto.apuestaNumeros,
        contexto.reintegroJugado,
        combinacionGanadora,
        complementario,
        reintegroGanador
      );
    }

    return {
      success: true,
      esDiaDeSorteo: contexto.esDiaDeSorteo,
      nombreSorteo: contexto.nombreSorteo,
      fechaSorteo: contexto.fechaSorteo,
      fechaResultado: fechaResultado,
      ciclo: contexto.ciclo,
      jornada: contexto.jornada,
      origenApuesta: contexto.origenApuesta,
      apuestaPena: contexto.apuestaNumeros,
      reintegroJugado: contexto.reintegroJugado,
      consensoDisponible: consensoDisponible,
      mensajeConsenso: mensajeConsenso,
      fuentesConsenso: fuentesConsenso,
      combinacionGanadora: combinacionGanadora,
      complementario: complementario,
      reintegroGanador: reintegroGanador,
      aciertosNumeros: calculo.aciertosNumeros,
      cantidadAciertos: calculo.cantidadAciertos,
      complementarioAcertado: calculo.complementarioAcertado,
      reintegroAcertado: calculo.reintegroAcertado,
      textoAciertos: calculo.textoAciertos,
      filaSorteos: contexto.filaSorteos,
      premioGuardado: contexto.premioGuardado !== undefined ? contexto.premioGuardado : null
    };
  } catch (err) {
    return {
      success: false,
      consensoDisponible: false,
      textoAciertos: 'Error al calcular escrutinio automático',
      message: err.message
    };
  }
}

/**
 * Registra manualmente el importe oficial del premio en euros en la hoja 'Sorteos'
 * (y actualiza automáticamente la fórmula de 'Tesorería').
 */
function guardarPremioManualEnBaseDeDatos(cantidad, datosOpcionales) {
  try {
    if (cantidad === null || cantidad === undefined || String(cantidad).trim() === '') {
      return { success: false, message: 'Introduce un importe numérico válido en euros.' };
    }

    var normalizado = String(cantidad).trim().replace(',', '.');
    var importe = parseFloat(normalizado);
    if (isNaN(importe) || importe < 0) {
      return { success: false, message: 'El importe del premio debe ser un número mayor o igual a 0.' };
    }
    importe = Math.round(importe * 100) / 100;

    var ss = obtenerSpreadsheetConfigurado();
    var sheetSorteos = ss.getSheetByName(PROYECTO_CONFIG.SHEET_SORTEOS || 'Sorteos');
    if (!sheetSorteos) {
      sheetSorteos = configurarPestanaSorteos(ss);
    }

    var escrutinioActual = null;
    try {
      escrutinioActual = ejecutarEscrutinioAutomatico();
    } catch (eEsc) {}

    var filaObjetivo = (datosOpcionales && datosOpcionales.filaSorteos)
      ? parseInt(datosOpcionales.filaSorteos, 10)
      : (escrutinioActual && escrutinioActual.filaSorteos ? parseInt(escrutinioActual.filaSorteos, 10) : null);

    if (!filaObjetivo || isNaN(filaObjetivo) || filaObjetivo < 2) {
      if (sheetSorteos.getLastRow() >= 2) {
        filaObjetivo = sheetSorteos.getLastRow();
      } else {
        filaObjetivo = 2;
        var zona = PROYECTO_CONFIG.TIMEZONE || 'Europe/Madrid';
        var fechaDefault = (escrutinioActual && escrutinioActual.fechaSorteo) || Utilities.formatDate(new Date(), zona, 'yyyy-MM-dd');
        sheetSorteos.getRange(filaObjetivo, 1).setValue((escrutinioActual && escrutinioActual.jornada) || 1);
        sheetSorteos.getRange(filaObjetivo, 2).setNumberFormat('@').setValue(fechaDefault);
        sheetSorteos.getRange(filaObjetivo, 3).setValue('Resguardo J' + ((escrutinioActual && escrutinioActual.jornada) || 1));
        if (escrutinioActual && escrutinioActual.apuestaPena && escrutinioActual.apuestaPena.length > 0) {
          sheetSorteos.getRange(filaObjetivo, 6).setValue(escrutinioActual.apuestaPena.join(', '));
        }
      }
    }

    // Si hay combinación ganadora y aciertos detectados automáticamente, asegurarlos en columnas G y H
    var combGanadoraGuardar = (datosOpcionales && Array.isArray(datosOpcionales.combinacionGanadora) && datosOpcionales.combinacionGanadora.length === 6)
      ? datosOpcionales.combinacionGanadora
      : (escrutinioActual && escrutinioActual.combinacionGanadora && escrutinioActual.combinacionGanadora.length === 6 ? escrutinioActual.combinacionGanadora : null);

    if (combGanadoraGuardar) {
      sheetSorteos.getRange(filaObjetivo, 7).setValue(combGanadoraGuardar.join(', '));
    }

    var aciertosGuardar = (datosOpcionales && typeof datosOpcionales.cantidadAciertos === 'number')
      ? datosOpcionales.cantidadAciertos
      : (escrutinioActual && typeof escrutinioActual.cantidadAciertos === 'number' ? escrutinioActual.cantidadAciertos : null);

    if (aciertosGuardar !== null) {
      sheetSorteos.getRange(filaObjetivo, 8).setValue(aciertosGuardar);
    }

    var premioMenor = importe <= 2000 ? importe : 0;
    sheetSorteos.getRange(filaObjetivo, 9).setValue(importe).setNumberFormat('#,##0.00 €');
    sheetSorteos.getRange(filaObjetivo, 10).setValue(premioMenor).setNumberFormat('#,##0.00 €');

    SpreadsheetApp.flush();

    var nuevaBolsa = 0;
    var sheetTesoreria = ss.getSheetByName(PROYECTO_CONFIG.SHEET_TESORERIA || 'Tesorería');
    if (sheetTesoreria && sheetTesoreria.getLastRow() >= 2) {
      var valBolsa = parseFloat(sheetTesoreria.getRange(2, 4).getValue());
      nuevaBolsa = isNaN(valBolsa) ? 0 : valBolsa;
    }

    return {
      success: true,
      fila: filaObjetivo,
      cantidad: importe,
      bolsaPremios: nuevaBolsa,
      message: 'Premio oficial de ' + importe.toFixed(2) + ' € guardado en la base de datos.'
    };
  } catch (err) {
    return {
      success: false,
      message: 'Error al guardar premio manual: ' + err.message
    };
  }
}
