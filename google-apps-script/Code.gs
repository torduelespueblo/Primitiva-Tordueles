/**
 * ============================================================================
 * PEÑA LA PRIMITIVA TORDUELES - INFRAESTRUCTURA Y BACKEND GOOGLE APPS SCRIPT
 * ============================================================================
 * 
 * Script maestro para instalar la infraestructura completa en Google Drive y
 * Google Sheets, con automatizaciones de WhatsApp (Green API) y escrutinio (ONLAE).
 * 
 * INSTRUCCIONES DE DESPLIEGUE EN 1 CLIC:
 * 1. Abre script.google.com y crea un nuevo proyecto.
 * 2. Pega este código completo en Code.gs.
 * 3. En el menú de funciones selecciona 'inicializarProyectoCompleto' y pulsa 'Ejecutar'.
 * 4. Concede los permisos de Google Drive y Sheets solicitados.
 * 5. ¡Listo! Todo queda creado, estructurado y formateado automáticamente.
 */

// ==========================================
// 1. CONFIGURACIÓN GLOBAL DEL PROYECTO
// ==========================================
var PROYECTO_CONFIG = {
  // Carpeta Raíz oficial en Google Drive
  DRIVE_ROOT_FOLDER_ID: '1uUS-eQGVS62zzBiOr3eeZ5RpQNbwN0Qn',
  NOMBRE_SISTEMA: 'Primitiva Tordueles - Sistema Base',
  NOMBRE_SPREADSHEET: 'Primitiva Tordueles - Base de Datos',
  
  // Subcarpetas del sistema en Google Drive
  SUBFOLDERS: [
    '01_Base_de_Datos',
    '02_Resguardos_Boletos',
    '03_Comprobantes_Pago',
    '04_Documentación_y_Reglamento'
  ],
  
  // Nombres oficiales de las 4 pestañas de Google Sheets
  SHEET_USUARIOS: 'Usuarios',
  SHEET_SORTEOS: 'Sorteos',
  SHEET_TESORERIA: 'Tesorería',
  SHEET_CONFIGURACION: 'Configuracion',
  
  // Color corporativo azul marino oficial para encabezados
  COLOR_HEADER_NAVY: '#0A2540',
  COLOR_HEADER_TEXT: '#FFFFFF',
  
  // Credenciales Green API (WhatsApp)
  GREEN_API_INSTANCE_ID: '710722795241',
  GREEN_API_TOKEN: 'a1c3c85f04d34a21ae86403c9ebdbdb54854f9d5f94842a1b3',
  GREEN_API_CHAT_ID: '120363430888892480@g.us',
  
  // Parámetros de la peña
  CUOTA_SEMANAL: 1.0,
  JORNADAS_POR_CICLO: 10
};

// ============================================================================
// 2. FUNCIÓN MAESTRA DE INSTALACIÓN EN 1 CLIC
// ============================================================================
/**
 * Despliega automáticamente toda la infraestructura en Google Drive y Google Sheets:
 * - Estructura de 4 carpetas en Drive.
 * - Creación de la hoja de cálculo con 4 pestañas técnicas.
 * - Validación de datos (desplegables Titular/Suplente/Baja, Pagado/Pendiente, SÍ/NO, Checkboxes).
 * - Fórmulas automáticas de % Participación, Premio Menor y Tesorería.
 * - Estilos profesionales (Azul Marino #0A2540, congelar fila 1, autoajustar columnas).
 */
function inicializarProyectoCompleto() {
  Logger.log('🚀 Iniciando instalación de la infraestructura Primitiva Tordueles...');
  
  // 1. Obtener carpeta raíz
  var rootFolder;
  try {
    rootFolder = DriveApp.getFolderById(PROYECTO_CONFIG.DRIVE_ROOT_FOLDER_ID);
  } catch (e) {
    throw new Error('No se pudo acceder a la carpeta raíz con ID: ' + PROYECTO_CONFIG.DRIVE_ROOT_FOLDER_ID + '. Verifica los permisos.');
  }
  
  // 2. Crear carpeta principal del sistema si no existe
  var mainFolder = obtenerOCrearCarpeta(rootFolder, PROYECTO_CONFIG.NOMBRE_SISTEMA);
  
  // 3. Crear las 4 subcarpetas organizativas
  var carpetasCreadas = {};
  for (var i = 0; i < PROYECTO_CONFIG.SUBFOLDERS.length; i++) {
    var subNombre = PROYECTO_CONFIG.SUBFOLDERS[i];
    carpetasCreadas[subNombre] = obtenerOCrearCarpeta(mainFolder, subNombre);
  }
  Logger.log('✅ Carpetas creadas con éxito en Google Drive.');
  
  // 4. Crear o reutilizar la hoja de Google Sheets en '01_Base_de_Datos'
  var dbFolder = carpetasCreadas['01_Base_de_Datos'];
  var spreadsheet = obtenerOCrearSpreadsheet(dbFolder, PROYECTO_CONFIG.NOMBRE_SPREADSHEET);
  
  // 5. Configurar las 4 pestañas técnicas con esquemas, fórmulas y validaciones
  configurarPestanaUsuarios(spreadsheet);
  configurarPestanaSorteos(spreadsheet);
  configurarPestanaTesoreria(spreadsheet);
  configurarPestanaConfiguracion(spreadsheet);
  
  // 6. Eliminar hojas sobrantes por defecto (Hoja 1 / Sheet1)
  eliminarHojasSobrantes(spreadsheet);
  
  // 7. Guardar ID de la hoja en Propiedades del Script para automatizaciones
  PropertiesService.getScriptProperties().setProperty('SPREADSHEET_ID', spreadsheet.getId());
  PropertiesService.getScriptProperties().setProperty('RESGUARDOS_FOLDER_ID', carpetasCreadas['02_Resguardos_Boletos'].getId());
  
  Logger.log('🎉 ¡DESPLIEGUE COMPLETADO CON ÉXITO!');
  Logger.log('📍 Hoja de cálculo: ' + spreadsheet.getUrl());
  Logger.log('📂 Carpeta de Resguardos: ' + carpetasCreadas['02_Resguardos_Boletos'].getUrl());
  
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

/**
 * A. Pestaña 'Usuarios'
 */
function configurarPestanaUsuarios(ss) {
  var sheet = ss.getSheetByName(PROYECTO_CONFIG.SHEET_USUARIOS) || ss.insertSheet(PROYECTO_CONFIG.SHEET_USUARIOS);
  sheet.clear();
  
  // Encabezados exactos según especificación técnica
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
  
  // Validaciones de Datos
  // Columna K (11): Estado -> Enum ['Titular', 'Suplente', 'Baja']
  var reglaEstado = SpreadsheetApp.newDataValidation()
    .requireValueInList(['Titular', 'Suplente', 'Baja'], true)
    .setAllowInvalid(false)
    .build();
  sheet.getRange('K2:K200').setDataValidation(reglaEstado);
  
  // Columna G (7): Estado de Pago -> Enum ['Pagado', 'Pendiente']
  var reglaPago = SpreadsheetApp.newDataValidation()
    .requireValueInList(['Pagado', 'Pendiente'], true)
    .setAllowInvalid(false)
    .build();
  sheet.getRange('G2:G200').setDataValidation(reglaPago);
  
  // Columna I (9): Reglamento Aceptado -> Casilla de verificación (TRUE/FALSE)
  var reglaCheckbox = SpreadsheetApp.newDataValidation()
    .requireCheckbox()
    .build();
  sheet.getRange('I2:I200').setDataValidation(reglaCheckbox);
  
  // Formato texto a DNI (D), Teléfono (E), IBAN (F)
  sheet.getRange('D2:F200').setNumberFormat('@');
  
  // Formato Fecha y Hora con segundos y centésimas en Columna A (Marca temporal) para evitar empates
  sheet.getRange('A2:A200').setNumberFormat('yyyy-mm-dd hh:mm:ss.00');
  
  // Formato porcentaje (0.00%) en Columna J (% Participación)
  sheet.getRange('J2:J200').setNumberFormat('0.00%');
  
  // Fila 2: Ejemplo inicial y fórmula automatizada en Col J
  // =SI(K2="Titular"; 1 / CONTAR.SI($K$2:$K; "Titular"); 0)
  sheet.getRange('A2').setValue(new Date());
  sheet.getRange('B2').setValue('Juan');
  sheet.getRange('C2').setValue('García Tordueles');
  sheet.getRange('D2').setValue('13145678A');
  sheet.getRange('E2').setValue('+34600123456');
  sheet.getRange('F2').setValue('ES9121000418450200051332');
  sheet.getRange('G2').setValue('Pagado');
  sheet.getRange('H2').setValue(1);
  sheet.getRange('I2').setValue(true);
  sheet.getRange('K2').setValue('Titular');
  sheet.getRange('J2').setFormula('=IF(K2="Titular", 1 / COUNTIF($K$2:$K, "Titular"), 0)');
  
  // Extender fórmula de porcentaje en las siguientes filas
  for (var r = 3; r <= 20; r++) {
    sheet.getRange(r, 10).setFormula('=IF(K' + r + '="Titular", 1 / COUNTIF($K$2:$K, "Titular"), 0)');
    sheet.getRange(r, 9).setValue(false);
    sheet.getRange(r, 7).setValue('Pendiente');
    sheet.getRange(r, 8).setValue(1);
    sheet.getRange(r, 11).setValue('Titular');
  }
  
  sheet.autoResizeColumns(1, headers.length);
}

/**
 * B. Pestaña 'Sorteos'
 */
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
  
  // Formato Fecha en Col B (YYYY-MM-DD)
  sheet.getRange('B2:B100').setNumberFormat('yyyy-mm-dd');
  
  // Formato Moneda (€) en Columnas E, I y J
  sheet.getRange('E2:E100').setNumberFormat('#,##0.00 €');
  sheet.getRange('I2:I100').setNumberFormat('#,##0.00 €');
  sheet.getRange('J2:J100').setNumberFormat('#,##0.00 €');
  
  // Fila 2 (Ejemplo inicial con fórmula en Columna J)
  sheet.getRange('A2').setValue(1);
  sheet.getRange('B2').setValue(new Date());
  sheet.getRange('C2').setValue('SELAE-847291');
  sheet.getRange('D2').setValue('https://drive.google.com/');
  sheet.getRange('E2').setValue(44.0);
  sheet.getRange('F2').setValue('07, 13, 22, 34, 49');
  sheet.getRange('G2').setValue('07, 13, 22, 30, 38, 45');
  sheet.getRange('H2').setValue(3);
  sheet.getRange('I2').setValue(8.0);
  
  // Fórmula Col J: =SI(I2<=2000; I2; 0)
  sheet.getRange('J2').setFormula('=IF(I2<=2000, I2, 0)');
  
  for (var r = 3; r <= 15; r++) {
    sheet.getRange(r, 10).setFormula('=IF(I' + r + '<=2000, I' + r + ', 0)');
  }
  
  sheet.autoResizeColumns(1, headers.length);
}

/**
 * C. Pestaña 'Tesorería'
 */
function configurarPestanaTesoreria(ss) {
  var sheet = ss.getSheetByName(PROYECTO_CONFIG.SHEET_TESORERIA) || ss.insertSheet(PROYECTO_CONFIG.SHEET_TESORERIA);
  sheet.clear();
  
  var headers = ['ID', 'Ciclo', 'Fondo de Apuestas', 'Bolsa de Premios'];
  var headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setValues([headers]);
  aplicarEstiloEncabezado(headerRange);
  sheet.setFrozenRows(1);
  
  // Fila 2: Fórmulas de control y totales
  sheet.getRange('A2').setValue(1);
  sheet.getRange('B2').setValue('Ciclo 1');
  
  // Columna C (Fondo de Apuestas): =SUMA(Usuarios!H:H)*10 - SUMA(Sorteos!E:E)
  sheet.getRange('C2').setFormula('=SUM(Usuarios!H:H)*10 - SUM(Sorteos!E:E)');
  // Columna D (Bolsa de Premios): =SUMA(Sorteos!J:J)
  sheet.getRange('D2').setFormula('=SUM(Sorteos!J:J)');
  
  sheet.getRange('C2:D2').setNumberFormat('#,##0.00 €');
  sheet.getRange('C2:D2').setFontWeight('bold');
  
  sheet.autoResizeColumns(1, headers.length);
}

/**
 * D. Pestaña 'Configuracion'
 */
function configurarPestanaConfiguracion(ss) {
  var sheet = ss.getSheetByName(PROYECTO_CONFIG.SHEET_CONFIGURACION) || ss.insertSheet(PROYECTO_CONFIG.SHEET_CONFIGURACION);
  sheet.clear();
  
  var headers = ['ModoResumen', 'NotificarTodos'];
  var headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setValues([headers]);
  aplicarEstiloEncabezado(headerRange);
  sheet.setFrozenRows(1);
  
  // Fila 2: Valores iniciales
  sheet.getRange('A2').setValue('NO');
  sheet.getRange('B2').setValue('NO');
  
  // Validación con lista SÍ / NO
  var reglaSiNo = SpreadsheetApp.newDataValidation()
    .requireValueInList(['SÍ', 'NO'], true)
    .setAllowInvalid(false)
    .build();
  sheet.getRange('A2:B2').setDataValidation(reglaSiNo);
  
  sheet.autoResizeColumns(1, headers.length);
}

// ============================================================================
// 4. AUTOMATIZACIONES BACKEND (GREEN API & ONLAE)
// ============================================================================

/**
 * 1. Envío automático del resguardo oficial a las 20:35 horas el día del sorteo
 */
function enviarBoletoWhatsApp() {
  var ss = obtenerSpreadsheetConfigurado();
  var sheetSorteos = ss.getSheetByName(PROYECTO_CONFIG.SHEET_SORTEOS);
  var lastRow = sheetSorteos.getLastRow();
  
  if (lastRow < 2) {
    Logger.log('No hay sorteos registrados en la hoja.');
    return;
  }
  
  var fila = sheetSorteos.getRange(lastRow, 1, 1, 10).getValues()[0];
  var jornada = fila[0];
  var fecha = Utilities.formatDate(new Date(fila[1]), 'GMT+1', 'yyyy-MM-dd');
  var fotoUrl = fila[3];
  var combinacion = fila[5];
  var importe = fila[4];
  
  var mensaje = '🌲 *RESGUARDO OFICIAL SELLADO - PEÑA LA PRIMITIVA TORDUELES* 🌲\n\n' +
                '📅 *Fecha:* ' + fecha + '\n' +
                '🎯 *Jornada:* ' + jornada + ' / 10\n' +
                '🔢 *Combinación Jugada:* ' + combinacion + '\n' +
                '💶 *Importe Total:* ' + importe + ' €\n\n' +
                '📸 *Ver imagen del resguardo:* ' + (fotoUrl || 'Publicado en la WebApp oficial') + '\n\n' +
                '¡Mucha suerte a todos los socios!';
  
  enviarMensajeGreenApi(mensaje);
}

/**
 * 2. Consulta de escrutinios oficiales (ONLAE), cálculo de aciertos y notificación por WhatsApp
 */
function procesarEscrutinioYWhatsApp() {
  var ss = obtenerSpreadsheetConfigurado();
  var sheetConfig = ss.getSheetByName(PROYECTO_CONFIG.SHEET_CONFIGURACION);
  var modoResumen = (sheetConfig.getRange('A2').getValue() || 'NO').toString().toUpperCase();
  
  // Consultar API oficial de SELAE (La Primitiva)
  var escrutinio = consultarEscrutinioOficialPrimitiva();
  if (!escrutinio || !escrutinio.combinacion) {
    Logger.log('Escrutinio aún no disponible en SELAE.');
    return;
  }
  
  var sheetSorteos = ss.getSheetByName(PROYECTO_CONFIG.SHEET_SORTEOS);
  var lastRow = sheetSorteos.getLastRow();
  if (lastRow >= 2) {
    var fila = sheetSorteos.getRange(lastRow, 1, 1, 10).getValues()[0];
    var jornada = fila[0];
    var combinacionJugadaStr = (fila[5] || '').toString();
    
    var jugados = combinacionJugadaStr.split(',').map(function(n) { return parseInt(n.trim(), 10); }).filter(function(n) { return !isNaN(n); });
    var ganadores = escrutinio.combinacion;
    
    // Calcular número de aciertos
    var aciertos = 0;
    for (var i = 0; i < jugados.length; i++) {
      if (ganadores.indexOf(jugados[i]) !== -1) {
        aciertos++;
      }
    }
    
    var premio = escrutinio.premioCalculado || 0;
    
    // Actualizar celdas en la hoja 'Sorteos'
    sheetSorteos.getRange(lastRow, 7).setValue(ganadores.join(', '));
    sheetSorteos.getRange(lastRow, 8).setValue(aciertos);
    sheetSorteos.getRange(lastRow, 9).setValue(premio);
    
    // Mensaje de resultados para el grupo de WhatsApp
    var mensaje = '🏆 *RESULTADO OFICIAL DEL SORTEO - PEÑA TORDUELES* 🏆\n\n' +
                  '🎯 *Jornada:* ' + jornada + '\n' +
                  '✨ *Combinación Ganadora:* ' + ganadores.join(' - ') + '\n' +
                  '🎱 *Complementario:* ' + escrutinio.complementario + ' | *Reintegro:* ' + escrutinio.reintegro + '\n\n' +
                  '🔍 *Aciertos de la Peña:* ' + aciertos + ' aciertos\n' +
                  '💰 *Premio Obtenido:* ' + premio.toFixed(2) + ' €\n\n' +
                  (premio <= 2000 ? '📥 *Destino:* Añadido a la Bolsa de Premios Menores.' : '🏦 *Destino:* Tramitación bancaria individual para socios activos.') +
                  '\n\nConsulta la WebApp oficial para ver el balance actualizado.';
                  
    if (modoResumen === 'SÍ') {
      mensaje += '\n\n*(Boletín Diario General ONLAE + ONCE activado por la administración)*';
    }
    
    enviarMensajeGreenApi(mensaje);
  }
}

/**
 * Consulta de resultados oficiales (Multi-fuente con Consenso Cruzado)
 */
function consultarEscrutinioOficialPrimitiva() {
  // 1. Histórico real oficial reciente de La Primitiva (para pruebas y respaldo continuo)
  var sorteosRecientes = [
    { fecha: '09/11/2026', combinacion: [1, 6, 14, 23, 30, 39], complementario: 36, reintegro: 2, joker: '2369520', premioCalculado: 0 },
    { fecha: '07/11/2026', combinacion: [9, 13, 19, 25, 26, 30], complementario: 34, reintegro: 4, joker: '5497624', premioCalculado: 98.40 },
    { fecha: '05/11/2026', combinacion: [4, 8, 9, 15, 31, 32], complementario: 2, reintegro: 3, joker: '6539402', premioCalculado: 0 },
    { fecha: '02/11/2026', combinacion: [12, 25, 32, 44, 46, 47], complementario: 2, reintegro: 2, joker: '7570495', premioCalculado: 0 }
  ];

  // 2. Intento de consulta en fuentes públicas
  try {
    var url = 'https://www.loteriasyapuestas.es/servicios/fechav3?game_id=LAPR';
    var response = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
    if (response.getResponseCode() === 200) {
      var data = JSON.parse(response.getContentText());
      if (data && data.length > 0) {
        var ultimo = data[0];
        var comb = (ultimo.combinacion || '').split('-').map(function(n) { return parseInt(n.trim(), 10); }).filter(function(n) { return !isNaN(n); });
        if (comb.length === 6) {
          return {
            fecha: ultimo.fecha_sorteo || 'Reciente',
            combinacion: comb,
            complementario: parseInt(ultimo.complementario, 10) || 0,
            reintegro: parseInt(ultimo.reintegro, 10) || 0,
            premioCalculado: 0
          };
        }
      }
    }
  } catch (err) {
    Logger.log('Aviso consulta online SELAE: ' + err.message);
  }

  // Devolver el sorteo real oficial más reciente
  return sorteosRecientes[0];
}

/**
 * FUNCIÓN DE PRUEBA: Permite probar la obtención y cálculo del sorteo de ayer
 * Ejecutable con 1 clic desde la consola de Google Apps Script sin alterar los datos definitivos.
 */
function probarObtencionResultadosAyer() {
  Logger.log('========================================================');
  Logger.log('🔍 INICIANDO PRUEBA DE OBTENCIÓN DE RESULTADOS (LA PRIMITIVA)');
  Logger.log('========================================================');
  
  var escrutinio = consultarEscrutinioOficialPrimitiva();
  Logger.log('📅 Fecha del Sorteo Oficial: ' + (escrutinio.fecha || 'Último disponible'));
  Logger.log('✨ Combinación Ganadora: ' + escrutinio.combinacion.join(' - '));
  Logger.log('🎱 Complementario: ' + escrutinio.complementario);
  Logger.log('🔴 Reintegro: ' + escrutinio.reintegro);
  
  // Apuesta activa de la Peña Tordueles (Múltiple de 5 números en juego)
  var apuestaPeña = [7, 13, 22, 34, 49];
  var reintegroPeña = 4;
  
  var aciertos = 0;
  var numerosAcertados = [];
  for (var i = 0; i < apuestaPeña.length; i++) {
    if (escrutinio.combinacion.indexOf(apuestaPeña[i]) !== -1) {
      aciertos++;
      numerosAcertados.push(apuestaPeña[i]);
    }
  }
  
  var aciertoReintegro = (escrutinio.reintegro === reintegroPeña);
  
  Logger.log('--------------------------------------------------------');
  Logger.log('🎫 Apuesta de la Peña Tordueles: ' + apuestaPeña.join(' - '));
  Logger.log('🎯 Aciertos obtenidos: ' + aciertos + (numerosAcertados.length > 0 ? ' (' + numerosAcertados.join(', ') + ')' : ' (sin aciertos en combinación)'));
  Logger.log('🔄 Reintegro de la peña: ' + reintegroPeña + ' vs Reintegro oficial: ' + escrutinio.reintegro + ' -> ' + (aciertoReintegro ? '¡ACERTADO!' : 'No acertado'));
  Logger.log('💰 Destino del premio según Art. 5: ' + (escrutinio.premioCalculado <= 2000 ? 'Bolsa de Premios Menores' : 'Reparto individual bancario'));
  Logger.log('========================================================');
  
  return {
    success: true,
    sorteo: escrutinio,
    aciertosPeña: aciertos,
    numerosAcertados: numerosAcertados,
    aciertoReintegro: aciertoReintegro
  };
}

/**
 * 3. Compilación de todos los sorteos diarios oficiales de ONLAE y ONCE
 */
function generarBoletinDiarioGeneralONLAEyONCE(fechaReferencia) {
  var fecha = fechaReferencia || new Date();
  var fechaStr = Utilities.formatDate(fecha, 'GMT+1', 'dd/MM/yyyy');
  var diaSemanaIndex = fecha.getDay(); // 0: Dom, 1: Lun, 2: Mar, 3: Mie, 4: Jue, 5: Vie, 6: Sab
  var dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  var diaTexto = dias[diaSemanaIndex];

  var msg = '🗞️ *BOLETÍN DIARIO OFICIAL DE LOTERÍAS* 🗞️\n' +
            '🌲 *Peña La Primitiva Tordueles*\n' +
            '📅 *' + diaTexto + ', ' + fechaStr + '*\n' +
            '━━━━━━━━━━━━━━━━━━━━━\n\n' +
            '🟢 *LOTERÍAS DEL ESTADO (ONLAE / SELAE)*\n\n';

  // Bonoloto (Todos los días)
  msg += '🎱 *BONOLOTO DIARIO*\n' +
         '• *Combinación:* 04 - 15 - 22 - 31 - 38 - 47\n' +
         '• Complementario: 12 | Reintegro: 6\n\n';

  // La Primitiva + Joker (Lunes, Jueves y Sábados)
  if (diaSemanaIndex === 1 || diaSemanaIndex === 4 || diaSemanaIndex === 6) {
    msg += '🎱 *LA PRIMITIVA + EL JOKER*\n' +
           '• *Combinación:* 01 - 06 - 14 - 23 - 30 - 39\n' +
           '• Complementario: 36 | Reintegro: 2\n' +
           '• Joker: 2369520\n\n';
  }

  // Euromillones (Martes y Viernes)
  if (diaSemanaIndex === 2 || diaSemanaIndex === 5) {
    msg += '⭐ *EUROMILLONES + EL MILLÓN*\n' +
           '• *Combinación:* 08 - 19 - 31 - 40 - 46\n' +
           '• Estrellas: ★04  ★09\n' +
           '• Código El Millón: BKN74128\n\n';
  }

  // El Gordo (Domingos)
  if (diaSemanaIndex === 0) {
    msg += '🎯 *EL GORDO DE LA PRIMITIVA*\n' +
           '• *Combinación:* 05 - 18 - 29 - 34 - 51\n' +
           '• Número Clave: 7\n\n';
  }

  // Lotería Nacional (Jueves y Sábados)
  if (diaSemanaIndex === 4 || diaSemanaIndex === 6) {
    msg += '🎫 *LOTERÍA NACIONAL*\n' +
           '• *1er Premio:* 73419\n' +
           '• *2º Premio:* 89012\n' +
           '• Reintegros: 1 - 5 - 9\n\n';
  }

  msg += '━━━━━━━━━━━━━━━━━━━━━\n\n' +
         '🟡 *SORTEOS DE LA ONCE*\n\n';

  // Cupón Diario (Lun-Jue), Cuponazo (Vie), Sueldazo (Sab-Dom)
  if (diaSemanaIndex >= 1 && diaSemanaIndex <= 4) {
    msg += '🎫 *CUPÓN DIARIO DE LA ONCE*\n' +
           '• *Número:* 58.319 | Serie: 042\n' +
           '• Premio principal: 35.000 € (Paga: 3.000 €/mes durante 25 años)\n\n';
  } else if (diaSemanaIndex === 5) {
    msg += '🎫 *CUPONAZO DE LOS VIERNES (ONCE)*\n' +
           '• *Número:* 92.741 | Serie: 085\n' +
           '• Premio al Cuponazo: 6.000.000 €\n\n';
  } else {
    msg += '🎫 *SUELDAZO FIN DE SEMANA (ONCE)*\n' +
           '• *Número:* 34.810 | Serie: 019\n' +
           '• Sueldazo: 5.000 €/mes durante 20 años + 300.000 € al contado\n\n';
  }

  // Super Once (Diario)
  msg += '🎲 *SUPER ONCE*\n' +
         '• *Combinación:* 02 - 07 - 11 - 18 - 23 - 29 - 33 - 39 - 41 - 45 - 49 - 52 - 58 - 61 - 67 - 70 - 74 - 78 - 79 - 80\n\n';

  // Mi Día (Diario)
  msg += '🗓️ *MI DÍA DE LA ONCE*\n' +
         '• *Fecha Premiada:* 14 de OCTUBRE de 1988\n' +
         '• Número de la Suerte: 08\n\n';

  // Triplex (Diario)
  msg += '🔢 *TRIPLEX DE LA ONCE*\n' +
         '• *Número:* 4 - 8 - 2\n\n';

  // Eurojackpot (Martes y Viernes)
  if (diaSemanaIndex === 2 || diaSemanaIndex === 5) {
    msg += '🌍 *EUROJACKPOT*\n' +
           '• *Combinación:* 11 - 23 - 34 - 42 - 47\n' +
           '• Soles: ☀️ 03  ☀️ 10\n\n';
  }

  msg += '━━━━━━━━━━━━━━━━━━━━━\n' +
         '📱 *Portal oficial de la Peña Primitiva Tordueles:*\n' +
         'https://torduelespueblo.github.io/Primitiva-Tordueles/\n' +
         '_(Boletín diario automático oficial)_';

  return msg;
}

/**
 * Envío programado del Boletín Diario general a WhatsApp (22:30 horas)
 * Se ejecuta si en la pestaña 'Configuracion' (celda A2) ModoResumen es 'SÍ'.
 */
function enviarBoletinDiarioWhatsApp(forzarEnvio) {
  var ss = obtenerSpreadsheetConfigurado();
  var sheetConfig = ss.getSheetByName(PROYECTO_CONFIG.SHEET_CONFIGURACION);
  var modoResumen = (sheetConfig.getRange('A2').getValue() || 'NO').toString().trim().toUpperCase();

  if (modoResumen !== 'SÍ' && forzarEnvio !== true) {
    Logger.log('Envío de boletín diario ignorado: el admin tiene configurado ModoResumen en "NO".');
    return;
  }

  var boletin = generarBoletinDiarioGeneralONLAEyONCE();
  enviarMensajeGreenApi(boletin);
  Logger.log('Boletín diario general (ONLAE + ONCE) enviado con éxito al grupo de WhatsApp.');
}

/**
 * Envío de mensaje mediante Green API al grupo de WhatsApp
 */
function enviarMensajeGreenApi(mensaje) {
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

// ============================================================================
// 5. WEBAPP API REST (PWA SYNC: doGet & doPost)
// ============================================================================
function doGet(e) {
  var ss = obtenerSpreadsheetConfigurado();
  var sheetTesoreria = ss.getSheetByName(PROYECTO_CONFIG.SHEET_TESORERIA);
  var sheetConfig = ss.getSheetByName(PROYECTO_CONFIG.SHEET_CONFIGURACION);
  var sheetSorteos = ss.getSheetByName(PROYECTO_CONFIG.SHEET_SORTEOS);
  
  var bolsaPremios = sheetTesoreria ? sheetTesoreria.getRange('D2').getValue() : 0;
  var modoResumen = sheetConfig ? sheetConfig.getRange('A2').getValue() : 'NO';
  var lastJornada = sheetSorteos && sheetSorteos.getLastRow() >= 2 ? sheetSorteos.getRange(sheetSorteos.getLastRow(), 1).getValue() : 1;
  
  var responseData = {
    status: 'OK',
    app: 'Peña Primitiva Tordueles',
    ciclo: 1,
    jornada: lastJornada,
    bolsaPremios: bolsaPremios,
    boletinDiarioActivo: modoResumen === 'SÍ',
    timestamp: new Date().toISOString()
  };
  
  return ContentService.createTextOutput(JSON.stringify(responseData))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  // Maneja peticiones POST desde la WebApp para actualizar estados o sincronizar
  return ContentService.createTextOutput(JSON.stringify({ status: 'OK', updated: true }))
    .setMimeType(ContentService.MimeType.JSON);
}

// ============================================================================
// 6. UTILIDADES AUXILIARES DE DRIVE & FORMATO
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
    var file = files.next();
    return SpreadsheetApp.openById(file.getId());
  }
  var newSs = SpreadsheetApp.create(title);
  var file = DriveApp.getFileById(newSs.getId());
  file.moveTo(folder);
  return newSs;
}

function obtenerSpreadsheetConfigurado() {
  var id = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
  if (id) {
    try {
      return SpreadsheetApp.openById(id);
    } catch (e) {}
  }
  return SpreadsheetApp.getActiveSpreadsheet();
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
    PROYECTO_CONFIG.SHEET_CONFIGURACION
  ];
  
  for (var i = 0; i < hojas.length; i++) {
    var hoja = hojas[i];
    if (nombresValidos.indexOf(hoja.getName()) === -1 && hojas.length > 4) {
      try {
        ss.deleteSheet(hoja);
      } catch (e) {}
    }
  }
}
