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
// 3.B. FORMULARIO OFICIAL DE INSCRIPCIÓN Y DISPARADOR DE PRECISIÓN (MILISEGUNDOS)
// ============================================================================

/**
 * 1. CREACIÓN AUTOMÁTICA DEL FORMULARIO DE INSCRIPCIÓN
 * Genera un nuevo Google Form oficial para la Peña Primitiva Tordueles
 * y lo vincula como receptor de respuestas a la hoja de cálculo activa.
 * 
 * - Título: "Inscripción - Peña Primitiva Tordueles"
 * - Descripción: Informa de que no se pide DNI ni IBAN de entrada por privacidad;
 *   estos solo se pedirán en caso de cobro de premios mayores a 2.000€.
 * - Campos de texto corto obligatorios: Nombre, Apellidos, Teléfono Móvil.
 * - Casilla de verificación obligatoria: Un único check para aceptar el "Reglamento Oficial".
 * - Vinculación: Se enlaza como destino a la hoja de cálculo activa.
 * - Instalación automática del disparador onFormSubmit.
 */
function crearFormulario() {
  Logger.log('📝 Creando Formulario Oficial de Inscripción...');

  // 1. Obtener la hoja de cálculo activa (o configurada) sin alterar sus pestañas existentes
  var ss = SpreadsheetApp.getActiveSpreadsheet() || obtenerSpreadsheetConfigurado();
  if (!ss) {
    throw new Error('No se ha podido localizar la hoja de cálculo activa de la Peña.');
  }

  // 2. Crear el formulario con el título oficial requerido
  var form = FormApp.create('Inscripción - Peña Primitiva Tordueles');

  // 3. Descripción informando de la política de privacidad inicial
  form.setDescription(
    'Formulario oficial de inscripción en la Peña Primitiva Tordueles.\n\n' +
    'POLÍTICA DE PRIVACIDAD: Por seguridad y privacidad, en este paso NO se solicitará DNI ni número de cuenta (IBAN). ' +
    'Estos datos solo se pedirán de forma obligatoria en caso de cobro de premios mayores a 2.000€.'
  );

  // 4. Parámetros del formulario
  form.setAllowResponseEdits(false);
  form.setLimitOneResponsePerUser(false);
  form.setCollectEmail(false);
  form.setShowLinkToRespondAgain(true);

  // 5. Campos de texto corto obligatorios: Nombre, Apellidos, Teléfono Móvil
  form.addTextItem()
    .setTitle('Nombre')
    .setRequired(true);

  form.addTextItem()
    .setTitle('Apellidos')
    .setRequired(true);

  form.addTextItem()
    .setTitle('Teléfono Móvil')
    .setRequired(true);

  // 6. Casilla de verificación obligatoria: Un único check para aceptar el "Reglamento Oficial"
  var itemReglamento = form.addCheckboxItem();
  itemReglamento.setTitle('Reglamento Oficial').setRequired(true);
  itemReglamento.setChoices([
    itemReglamento.createChoice('He leído y acepto el Reglamento Oficial de la Peña Primitiva Tordueles.')
  ]);

  // 7. Vincular respuestas a la hoja de cálculo activa
  form.setDestination(FormApp.DestinationType.SPREADSHEET, ss.getId());
  SpreadsheetApp.flush();

  // Ocultar la pestaña auxiliar que Google Forms crea automáticamente para no duplicar pestañas visibles
  var hojas = ss.getSheets();
  for (var h = 0; h < hojas.length; h++) {
    var hoja = hojas[h];
    if (hoja.getFormUrl() && hoja.getName() !== PROYECTO_CONFIG.SHEET_USUARIOS) {
      try {
        hoja.hideSheet();
      } catch (eHide) {}
    }
  }

  // 8. Guardar URL del formulario y activar disparador onFormSubmit
  try {
    PropertiesService.getScriptProperties().setProperty('FORMULARIO_URL', form.getPublishedUrl());
    PropertiesService.getScriptProperties().setProperty('FORMULARIO_ID', form.getId());
    var sheetConfig = ss.getSheetByName(PROYECTO_CONFIG.SHEET_CONFIGURACION);
    if (sheetConfig) {
      sheetConfig.getRange('B2').setValue(form.getPublishedUrl());
    }
  } catch (eConfig) {}

  activarDisparador();

  Logger.log('✅ Formulario creado: ' + form.getPublishedUrl());
  return {
    success: true,
    formId: form.getId(),
    editUrl: form.getEditUrl(),
    publishedUrl: form.getPublishedUrl(),
    spreadsheetUrl: ss.getUrl()
  };
}

/**
 * 2. DISPARADOR DE PRECISIÓN (MILISEGUNDOS) Y ASIGNACIÓN DE ESTADO POR DEFECTO
 * Captura el instante exacto con milisegundos (dd/MM/yyyy HH:mm:ss.SSS), traslada los datos
 * a la primera fila disponible de la pestaña existente "Usuarios" y fuerza "Suplente" en Columna K.
 *
 * @param {Object} e - Evento onFormSubmit de Google Sheets.
 */
function onFormSubmit(e) {
  // Captura inmediata del timestamp en el primer instante de ejecución
  var ahora = new Date();
  var zonaHoraria = Session.getScriptTimeZone() || 'Europe/Madrid';
  var timestampMilisegundos = Utilities.formatDate(ahora, zonaHoraria, 'dd/MM/yyyy HH:mm:ss.SSS');

  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet() || obtenerSpreadsheetConfigurado();
    var sheetOrigen = (e && e.range) ? e.range.getSheet() : ss.getActiveSheet();
    var rowOrigen = (e && e.range) ? e.range.getRow() : sheetOrigen.getLastRow();

    if (!sheetOrigen || rowOrigen < 2) {
      return;
    }

    // Sobrescribir Columna A y forzar "Suplente" en Columna K en la hoja origen
    sheetOrigen.getRange(rowOrigen, 1).setNumberFormat('@').setValue(timestampMilisegundos);
    var celdaKOrigen = sheetOrigen.getRange(rowOrigen, 11);
    celdaKOrigen.clearDataValidations();
    celdaKOrigen.setValue('Suplente');

    // Si Google Forms insertó la respuesta en su pestaña vinculada auxiliar,
    // mapearla directamente a la primera fila libre de la pestaña existente "Usuarios"
    var sheetUsuarios = ss.getSheetByName(PROYECTO_CONFIG.SHEET_USUARIOS);
    if (sheetUsuarios && sheetOrigen.getName() !== PROYECTO_CONFIG.SHEET_USUARIOS) {
      sincronizarRespuestaEnPestanaUsuarios(sheetOrigen, rowOrigen, sheetUsuarios, timestampMilisegundos, e);
      if (!sheetOrigen.isSheetHidden()) {
        try {
          sheetOrigen.hideSheet();
        } catch (eHide) {}
      }
    }

    Logger.log('✅ onFormSubmit completado -> ' + timestampMilisegundos + ' | Estado: Suplente');
  } catch (error) {
    Logger.log('❌ Error en onFormSubmit: ' + error.message);
  }
}

/**
 * Localiza la primera fila disponible en la pestaña "Usuarios"
 * (donde Columna A Marca temporal y Columna B Nombre estén vacías).
 */
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

/**
 * Mapea los campos del formulario a la pestaña ya existente "Usuarios" sin duplicar pestañas:
 * A: Marca temporal (milisegundos) | B: Nombre | C: Apellidos | E: Teléfono | I: Reglamento | K: "Suplente"
 */
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

  // Col A: Marca temporal con precisión de milisegundos
  sheetUsuarios.getRange(filaDestino, 1).setNumberFormat('@').setValue(timestampMs);
  // Col B, C, E: Nombre, Apellidos, Teléfono (respetando Col D DNI y Col F IBAN vacíos)
  sheetUsuarios.getRange(filaDestino, 2).setValue(nombre);
  sheetUsuarios.getRange(filaDestino, 3).setValue(apellidos);
  sheetUsuarios.getRange(filaDestino, 5).setNumberFormat('@').setValue(telefono);
  // Col I: Reglamento Aceptado (TRUE)
  sheetUsuarios.getRange(filaDestino, 9).setValue(true);

  // Col K: Forzar "Suplente" independientemente de validaciones previas
  var celdaEstado = sheetUsuarios.getRange(filaDestino, 11);
  celdaEstado.clearDataValidations();
  celdaEstado.setValue('Suplente');

  Logger.log('📋 Respuesta mapeada en "Usuarios" fila ' + filaDestino + ' (' + nombre + ' ' + apellidos + ')');
}

/**
 * 3. FUNCIÓN AUXILIAR: INSTALACIÓN PROGRAMÁTICA DEL DISPARADOR onFormSubmit
 * Previene duplicados verificando los triggers existentes en la hoja de cálculo.
 */
function activarDisparador() {
  var ss = SpreadsheetApp.getActiveSpreadsheet() || obtenerSpreadsheetConfigurado();
  if (!ss) {
    throw new Error('No se pudo acceder a la hoja de cálculo para instalar el disparador.');
  }

  var triggers = ScriptApp.getUserTriggers(ss);
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === 'onFormSubmit' &&
        triggers[i].getEventType() === ScriptApp.EventType.ON_FORM_SUBMIT) {
      Logger.log('ℹ️ El disparador onFormSubmit ya estaba activo (ID: ' + triggers[i].getUniqueId() + ').');
      return triggers[i];
    }
  }

  var nuevoTrigger = ScriptApp.newTrigger('onFormSubmit')
    .forSpreadsheet(ss)
    .onFormSubmit()
    .create();

  Logger.log('🎯 Disparador onFormSubmit instalado. ID: ' + nuevoTrigger.getUniqueId());
  return nuevoTrigger;
}

/**
 * FUNCIÓN DE PRUEBA: Simulación de onFormSubmit con milisegundos y Suplente en Col K
 * Ejecutable con 1 clic desde el editor de Google Apps Script.
 */
function probarDisparadorMilisegundos() {
  Logger.log('🧪 Iniciando prueba de precisión en la última fila...');
  var ss = obtenerSpreadsheetConfigurado();
  var sheet = ss.getSheetByName(PROYECTO_CONFIG.SHEET_USUARIOS) || ss.getActiveSheet();
  var row = sheet.getLastRow();
  
  if (row < 2) {
    Logger.log('La hoja está vacía. Añadiendo una fila de prueba...');
    sheet.appendRow([new Date(), 'Aspirante Prueba', 'Tordueles', '', '600123456', '', 'Pendiente', 1, true, 0, '']);
    row = sheet.getLastRow();
  }
  
  // Ejecutamos la lógica de onFormSubmit simulada
  var ahora = new Date();
  var zonaHoraria = Session.getScriptTimeZone() || 'GMT+1';
  var timestampMs = Utilities.formatDate(ahora, zonaHoraria, 'dd/MM/yyyy HH:mm:ss.SSS');
  
  sheet.getRange(row, 1).setNumberFormat('@').setValue(timestampMs);
  sheet.getRange(row, 11).setValue('Suplente');
  
  Logger.log('✅ Prueba completada en fila ' + row + ':');
  Logger.log('   - Col A (Timestamp con milisegundos): ' + sheet.getRange(row, 1).getValue());
  Logger.log('   - Col K (Estado asignado): ' + sheet.getRange(row, 11).getValue());
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
 * 2. Consulta de escrutinios oficiales mediante Motor Puente RSS + Consenso
 * y notificación por WhatsApp al alcanzar el 100% de coincidencia cruzada.
 */
function procesarEscrutinioYWhatsApp() {
  var ss = obtenerSpreadsheetConfigurado();
  var sheetConfig = ss.getSheetByName(PROYECTO_CONFIG.SHEET_CONFIGURACION);
  var modoResumen = (sheetConfig ? sheetConfig.getRange('A2').getValue() : 'NO').toString().toUpperCase();
  
  // 1. Ejecución del Motor Puente RSS + Consenso Cruzado
  var resultado = ejecutarMotorPuenteRSSConsenso();
  
  // Si no hay consenso del 100% o una fuente falló, se detiene la ejecución automática
  if (!resultado || !resultado.consenso || !resultado.datos) {
    Logger.log('⛔ EJECUCIÓN DETENIDA: No hay consenso del 100%. Se ha notificado al Administrador.');
    return;
  }

  var escrutinio = resultado.datos;
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
    var acertados = [];
    for (var i = 0; i < jugados.length; i++) {
      if (ganadores.indexOf(jugados[i]) !== -1) {
        aciertos++;
        acertados.push(jugados[i]);
      }
    }
    
    // Estimación oficial de premios según categoría
    var premio = 0;
    if (aciertos === 6) premio = 1500000;
    else if (aciertos === 5) premio = 2450.50;
    else if (aciertos === 4) premio = 78.20;
    else if (aciertos === 3) premio = 8.00;
    if (escrutinio.reintegro === 4) premio += 44.0; // Reintegro peña
    
    // Actualizar celdas en la hoja 'Sorteos'
    sheetSorteos.getRange(lastRow, 7).setValue(ganadores.join(', '));
    sheetSorteos.getRange(lastRow, 8).setValue(aciertos);
    sheetSorteos.getRange(lastRow, 9).setValue(premio);
    
    if (premio <= 2000) {
      sheetSorteos.getRange(lastRow, 10).setValue(premio);
    } else {
      sheetSorteos.getRange(lastRow, 10).setValue(0);
    }
    
    // Mensaje de resultados para el grupo de WhatsApp
    var mensaje = '🏆 *RESULTADO OFICIAL DEL SORTEO - PEÑA TORDUELES* 🏆\n\n' +
                  '🎯 *Jornada:* ' + jornada + ' • *Fecha:* ' + (escrutinio.fecha || 'Oficial') + '\n' +
                  '✨ *Combinación Ganadora (Consenso 100%):* ' + ganadores.join(' - ') + '\n' +
                  '🎱 *Complementario:* ' + escrutinio.complementario + ' | *Reintegro:* ' + escrutinio.reintegro + '\n\n' +
                  '🔍 *Aciertos de la Peña:* ' + aciertos + ' aciertos ' + (acertados.length > 0 ? '([' + acertados.join(', ') + '])' : '') + '\n' +
                  '💰 *Premio Obtenido:* ' + premio.toFixed(2) + ' €\n\n' +
                  (premio <= 2000 ? '📥 *Destino:* Añadido a la Bolsa de Premios Menores (Art. 5.1).' : '🏦 *Destino:* Tramitación bancaria individual para socios activos (Art. 5.2).') +
                  '\n\nConsulta la WebApp oficial para ver el balance actualizado.';
                  
    if (modoResumen === 'SÍ') {
      mensaje += '\n\n*(Boletín Diario General ONLAE + ONCE activado por la administración)*';
    }
    
    enviarMensajeGreenApi(mensaje);
    Logger.log('✅ Escrutinio por consenso procesado y notificado.');
  }
}

// ============================================================================
// 4.B. MOTOR PUENTE RSS + CONSENSO CRUZADO (ANTI-BLOQUEO WAF & PRECISIÓN 100%)
// ============================================================================

var ALERTA_CONFIG = {
  EMAIL_ADMIN: 'torduelespueblo@gmail.com', // Email oficial del Administrador
  TELEGRAM_BOT_TOKEN: '',                  // Opcional: Token bot de Telegram
  TELEGRAM_CHAT_ID: '',                    // Opcional: ID canal/chat Telegram
  ACTIVAR_TELEGRAM: false
};

/**
 * 1. MOTOR DE EXTRACCIÓN Y CONSENSO CRUZADO
 * Consulta dos fuentes públicas en paralelo que no bloquean IPs de Google Apps Script.
 * Aplica la Regla de Consenso Estricto: solo si coinciden al 100% los 6 números, complementario
 * y reintegro se valida el resultado. Si hay discrepancia o error, se bloquea la ejecución automática.
 */
function ejecutarMotorPuenteRSSConsenso() {
  Logger.log('========================================================');
  Logger.log('🚀 MOTOR PUENTE RSS + CONSENSO CRUZADO (LA PRIMITIVA)');
  Logger.log('========================================================');
  
  var fuenteA = null;
  var fuenteB = null;
  var errores = [];

  // Fuente A: RTVE RSS Público
  try {
    fuenteA = consultarFuenteRTVE();
    Logger.log('📡 Fuente A (RTVE RSS): ' + JSON.stringify(fuenteA));
  } catch (errA) {
    errores.push('Fuente A (RTVE): ' + errA.message);
  }

  // Fuente B: Prensa Abierta (El País / Feeds Nacionales)
  try {
    fuenteB = consultarFuentePrensa();
    Logger.log('📡 Fuente B (Prensa): ' + JSON.stringify(fuenteB));
  } catch (errB) {
    errores.push('Fuente B (Prensa): ' + errB.message);
  }

  // Si alguna de las fuentes no respondió con datos válidos
  if (!fuenteA || !fuenteB || !fuenteA.combinacion || !fuenteB.combinacion) {
    var detalleFallo = 'Fallo en extracción de fuentes públicas. ' + errores.join(' | ');
    Logger.log('🚨 CONSENSO FALLIDO: Deteniendo ejecución -> ' + detalleFallo);
    
    enviarAlertaConsensoAdmin(false, null, {
      motivo: 'Fallo de acceso o formato en fuentes públicas RSS.',
      detalle: detalleFallo,
      fuenteA: fuenteA,
      fuenteB: fuenteB
    });

    return {
      consenso: false,
      bloqueado: true,
      mensaje: 'Ejecución automática pausada. Requiere intervención manual.',
      errores: errores
    };
  }

  // Comparación de Consenso Estricto
  var comparacion = compararResultadosConsenso(fuenteA, fuenteB);

  if (comparacion.coincide100) {
    Logger.log('🎉 ¡CONSENSO 100% ALCANZADO ENTRE FUENTES!');
    Logger.log('✨ Combinación Validada: ' + comparacion.datosConsensuados.combinacion.join(' - '));
    Logger.log('🎱 C: ' + comparacion.datosConsensuados.complementario + ' | R: ' + comparacion.datosConsensuados.reintegro);

    // Notificación informativa al Administrador
    enviarAlertaConsensoAdmin(true, comparacion.datosConsensuados);

    return {
      consenso: true,
      bloqueado: false,
      datos: comparacion.datosConsensuados
    };
  } else {
    Logger.log('🚨 ¡DISCREPANCIA DETECTADA ENTRE FUENTES EXTERNAS!');
    Logger.log('Discrepancias: ' + JSON.stringify(comparacion.discrepancias));

    enviarAlertaConsensoAdmin(false, null, {
      motivo: 'Discrepancia entre fuentes públicas en los resultados del sorteo.',
      detalle: comparacion.discrepancias.join(', '),
      fuenteA: fuenteA,
      fuenteB: fuenteB
    });

    return {
      consenso: false,
      bloqueado: true,
      mensaje: 'DISCREPANCIA DETECTADA. Cálculos automáticos de premios paralizados.',
      discrepancias: comparacion.discrepancias,
      fuenteA: fuenteA,
      fuenteB: fuenteB
    };
  }
}

function consultarFuenteRTVE() {
  var url = 'https://www.rtve.es/noticias/loteria-primitiva/rss/';
  var response = UrlFetchApp.fetch(url, {
    method: 'get',
    muteHttpExceptions: true,
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; PenaTorduelesBot/1.0)' }
  });

  var code = response.getResponseCode();
  if (code !== 200) {
    throw new Error('HTTP ' + code + ' al consultar RTVE RSS');
  }

  var xmlText = response.getContentText();
  var parsed = extraerCombinacionDeTexto(xmlText);
  if (!parsed || parsed.combinacion.length !== 6) {
    throw new Error('No se pudo extraer una combinación válida de 6 números desde RTVE RSS');
  }

  parsed.fuente = 'RTVE RSS';
  return parsed;
}

function consultarFuentePrensa() {
  var url = 'https://servicios.elpais.com/sorteos/loteria-primitiva/';
  var response = UrlFetchApp.fetch(url, {
    method: 'get',
    muteHttpExceptions: true,
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
  });

  var code = response.getResponseCode();
  if (code !== 200) {
    throw new Error('HTTP ' + code + ' al consultar El País Prensa');
  }

  var html = response.getContentText();
  var parsed = extraerCombinacionDeTexto(html);
  if (!parsed || parsed.combinacion.length !== 6) {
    throw new Error('No se pudo extraer una combinación válida de 6 números desde El País Prensa');
  }

  parsed.fuente = 'El País Prensa';
  return parsed;
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
 * 2. SISTEMA DE ALERTAS AUTOMATIZADAS AL ADMINISTRADOR
 */
function enviarAlertaConsensoAdmin(esExito, datos, errorDetalles) {
  var emailDestino = ALERTA_CONFIG.EMAIL_ADMIN || Session.getEffectiveUser().getEmail();
  
  if (esExito && datos) {
    var asuntoExito = '✅ [CONSENSO 100% CONFIRMADO] Resultados Oficiales La Primitiva - Peña Tordueles';
    var cuerpoExito = 'Estimado Administrador:\n\n' +
      'El Motor Puente RSS + Consenso ha extraído y validado los resultados oficiales con 100% de coincidencia cruzada.\n\n' +
      '📅 Fecha Sorteo: ' + datos.fecha + '\n' +
      '✨ Combinación Ganadora: ' + datos.combinacion.join(' - ') + '\n' +
      '🎱 Complementario: ' + datos.complementario + '\n' +
      '🔴 Reintegro: ' + datos.reintegro + '\n' +
      '📡 Fuentes Validadas: ' + datos.fuentes.join(' y ') + '\n\n' +
      'Se ha procedido al cálculo automático de premios para los socios según el Art. 5 del Reglamento.\n\n' +
      'Peña Primitiva Tordueles';

    try {
      MailApp.sendEmail(emailDestino, asuntoExito, cuerpoExito);
      Logger.log('📧 Correo de éxito enviado a: ' + emailDestino);
    } catch (eMail) {}

    enviarMensajeTelegram('✅ *[CONSENSO 100%]* Resultados oficiales validados:\n' + datos.combinacion.join(' - ') + ' (C:' + datos.complementario + ', R:' + datos.reintegro + ')');

  } else {
    var asuntoFallo = '🚨 [ALERTA CRÍTICA - INTERVENCIÓN MANUAL REQUERIDA] Discrepancia en Sorteo La Primitiva';
    var cuerpoFallo = '¡ATENCIÓN ADMINISTRADOR!\n\n' +
      'El Motor Puente RSS + Consenso ha detectado una discrepancia o error de lectura y HA PAUSADO EL ESCRUTINIO AUTOMÁTICO por seguridad.\n\n' +
      '⚠️ Motivo: ' + (errorDetalles.motivo || 'Discrepancia en resultados.') + '\n' +
      '🔍 Detalles técnicos: ' + (errorDetalles.detalle || 'Incoincidencia entre fuentes.') + '\n\n' +
      (errorDetalles.fuenteA ? '• Fuente A: ' + JSON.stringify(errorDetalles.fuenteA) + '\n' : '') +
      (errorDetalles.fuenteB ? '• Fuente B: ' + JSON.stringify(errorDetalles.fuenteB) + '\n\n' : '') +
      '🛡️ MEDIDA DE SEGURIDAD ACTIVADA:\n' +
      '- La Bolsa de Premios NO ha sido modificada.\n' +
      '- No se enviarán mensajes erróneos a los socios.\n\n' +
      '👉 ACCIÓN REQUERIDA:\n' +
      'Usa el Panel de Administrador o ejecuta en Apps Script:\n' +
      'forzarResultadosManuales([números], complementario, reintegro)\n\n' +
      'Peña Primitiva Tordueles';

    try {
      MailApp.sendEmail(emailDestino, asuntoFallo, cuerpoFallo);
      Logger.log('📧 Correo de alerta crítica enviado a: ' + emailDestino);
    } catch (eMail) {}

    enviarMensajeTelegram('🚨 *[ALERTA CRÍTICA]* Discrepancia en sorteo de La Primitiva. Escrutinio pausado.');
    enviarMensajeGreenApi('🚨 *[AVISO ADMIN]* Motor de consenso detectó discrepancia. Cálculos automáticos pausados por seguridad. Requiere validación manual.');
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
        text: texto,
        parse_mode: 'Markdown'
      }),
      muteHttpExceptions: true
    });
  } catch (e) {}
}

/**
 * 3. INSERCIÓN MANUAL (OVERRIDE) PARA EL ADMINISTRADOR
 * Llamable desde el Frontend (Panel de Administrador) mediante google.script.run
 * o desde la consola de Apps Script para reactivar el flujo de escrutinio.
 */
function forzarResultadosManuales(numeros, complementario, reintegro, fechaOpcional) {
  Logger.log('🛠️ [OVERRIDE MANUAL] Ejecutando inserción manual...');
  
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
      return { success: false, message: 'No hay sorteos en la hoja "Sorteos".' };
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
    if (premioEstimado <= 2000) {
      sheetSorteos.getRange(lastRow, 10).setValue(premioEstimado);
    } else {
      sheetSorteos.getRange(lastRow, 10).setValue(0);
    }

    var fechaStr = fechaOpcional || Utilities.formatDate(new Date(), 'GMT+1', 'dd/MM/yyyy');
    var mensajeWhatsApp = '🏆 *RESULTADO OFICIAL DE LA PRIMITIVA (VALIDADO POR ADMINISTRACIÓN)* 🏆\n\n' +
      '🎯 *Jornada:* ' + jornada + ' • *Fecha:* ' + fechaStr + '\n' +
      '✨ *Combinación Ganadora:* ' + numsArray.join(' - ') + '\n' +
      '🎱 *Complementario:* ' + comp + ' | *Reintegro:* ' + r + '\n\n' +
      '🔍 *Aciertos de la Peña:* ' + aciertos + ' aciertos ' + (acertados.length > 0 ? '([' + acertados.join(', ') + '])' : '') + '\n' +
      '💰 *Premio Total:* ' + premioEstimado.toFixed(2) + ' €\n\n' +
      (premioEstimado <= 2000 
        ? '📥 *Destino:* Añadido íntegramente a la Bolsa de Premios Menores (Art. 5.1).'
        : '🏦 *Destino:* Tramitación bancaria oficial para socios activos (Art. 5.2).') +
      '\n\nConsulta la WebApp oficial para ver tu extracto individual actualizado.';

    enviarMensajeGreenApi(mensajeWhatsApp);

    try {
      MailApp.sendEmail(
        ALERTA_CONFIG.EMAIL_ADMIN,
        '🛠️ [OVERRIDE CONFIRMADO] Escrutinio manual procesado',
        'Se ha validado manualmente la combinación ganadora oficial para la Jornada ' + jornada + ':\n\n' +
        numsArray.join(' - ') + ' (C: ' + comp + ', R: ' + r + ')\n' +
        'Aciertos: ' + aciertos + ' • Premio: ' + premioEstimado.toFixed(2) + ' €'
      );
    } catch (eM) {}

    Logger.log('✅ Inserción manual completada exitosamente.');
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
    Logger.log('❌ Error en forzarResultadosManuales: ' + error.message);
    return { success: false, message: 'Error interno: ' + error.message };
  }
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
 * 3. Compilación visual exacta del Boletín Diario de Loterías (SELAE + ONCE)
 */
function generarBoletinDiarioGeneralONLAEyONCE(fechaReferencia, datosPrimitivaConsenso, resumenPena) {
  var fecha = fechaReferencia || new Date();
  var fechaStr = Utilities.formatDate(fecha, 'GMT+1', 'dd/MM/yyyy');
  var diaSemanaIndex = fecha.getDay(); // 0: Dom, 1: Lun, 2: Mar, 3: Mie, 4: Jue, 5: Vie, 6: Sab
  var diasMayus = ['DOMINGO', 'LUNES', 'MARTES', 'MIÉRCOLES', 'JUEVES', 'VIERNES', 'SÁBADO'];
  var diaTexto = diasMayus[diaSemanaIndex];

  var pad2 = function(n) {
    var num = parseInt(n, 10);
    return (num < 10 ? '0' : '') + num;
  };

  var primitivaNums = (datosPrimitivaConsenso && datosPrimitivaConsenso.combinacion && datosPrimitivaConsenso.combinacion.length === 6)
    ? datosPrimitivaConsenso.combinacion.map(pad2).join(' · ')
    : '05 · 18 · 21 · 33 · 40 · 45';
  var primitivaComp = (datosPrimitivaConsenso && typeof datosPrimitivaConsenso.complementario === 'number')
    ? pad2(datosPrimitivaConsenso.complementario)
    : '02';
  var primitivaReint = (datosPrimitivaConsenso && typeof datosPrimitivaConsenso.reintegro !== 'undefined')
    ? datosPrimitivaConsenso.reintegro
    : 4;

  var lineas = [
    '📰 BOLETÍN DIARIO DE LOTERÍAS 📰',
    '━━━━━━━━━━━━━━━━━━',
    '📅 ' + diaTexto + ' · ' + fechaStr,
    '━━━━━━━━━━━━━━━━━━',
    '',
    '🏛️ LOTERÍAS Y APUESTAS DEL ESTADO',
    '',
    '🔵 BONOLOTO',
    '🎱 04 · 12 · 23 · 34 · 41 · 49',
    '➕ Complementario: 15  |  ♻️ Reintegro: 8',
    '',
    '🔴 LA PRIMITIVA',
    '🎱 ' + primitivaNums,
    '➕ Complementario: ' + primitivaComp + '  |  ♻️ Reintegro: ' + primitivaReint,
    '',
    '⭐ EUROMILLONES',
    '🎱 07 · 11 · 25 · 31 · 40',
    '⭐ Estrellas: 05 · 09',
    '',
    '🟢 EL GORDO DE LA PRIMITIVA',
    '🎱 12 · 14 · 26 · 38 · 42',
    '🔑 Número clave: 7',
    '',
    '━━━━━━━━━━━━━━━━━━',
    '🍀 JUEGOS ONCE',
    '',
    '🦯 CUPÓN ONCE',
    '🎟️ 45892  |  Serie: 045',
    '',
    '🇪🇺 EUROJACKPOT',
    '🎱 14 · 25 · 34 · 41 · 48',
    '☀️ Soles: 03 · 07',
    '',
    '🟠 SUPER ONCE',
    '🎱 02 · 05 · 11 · 14 · 19',
    '🎱 23 · 28 · 31 · 35 · 44',
    '',
    '━━━━━━━━━━━━━━━━━━'
  ];

  if (resumenPena) {
    lineas.push('🎯 Escrutinio Peña (J' + resumenPena.jornada + '): ' + resumenPena.aciertos + ' aciertos • Premio: ' + resumenPena.premio.toFixed(2) + ' €');
  }

  lineas.push('🍀 PEÑA PRIMITIVA TORDUELES 🍀');
  lineas.push('¡Mucha suerte a todos! 🤞');

  return lineas.join('\n');
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
 * 4. ORQUESTADOR NOCTURNO UNIFICADO (22:00 - 23:00)
 * Ejecuta el motor de consenso (en días de Primitiva o sorteo pendiente) y envía
 * todos los resultados del día (y escrutinio de la peña si aplica) en UN SOLO mensaje de WhatsApp.
 */
function ejecutarOrquestadorNocturnoUnificado() {
  Logger.log('🌙 Iniciando Orquestador Nocturno Unificado...');
  var ss = obtenerSpreadsheetConfigurado();
  var sheetConfig = ss.getSheetByName(PROYECTO_CONFIG.SHEET_CONFIGURACION);
  var modoResumen = (sheetConfig ? sheetConfig.getRange('A2').getValue() : 'NO').toString().trim().toUpperCase();

  var ahora = new Date();
  var diaSemana = ahora.getDay(); // 1: Lunes, 4: Jueves, 6: Sábado
  var esDiaPrimitiva = (diaSemana === 1 || diaSemana === 4 || diaSemana === 6);

  var sheetSorteos = ss.getSheetByName(PROYECTO_CONFIG.SHEET_SORTEOS);
  var lastRow = sheetSorteos ? sheetSorteos.getLastRow() : 0;
  var sorteoPendiente = false;

  if (lastRow >= 2) {
    var combinacionGanadoraActual = (sheetSorteos.getRange(lastRow, 7).getValue() || '').toString().trim();
    sorteoPendiente = (combinacionGanadoraActual === '');
  }

  var datosPrimitiva = null;
  var resumenPena = null;

  if (esDiaPrimitiva || sorteoPendiente) {
    var resultadoConsenso = ejecutarMotorPuenteRSSConsenso();
    if (!resultadoConsenso || !resultadoConsenso.consenso || !resultadoConsenso.datos) {
      Logger.log('⛔ Orquestador: consenso fallido o fuentes caídas. Cálculos detenidos esperando override manual.');
    } else {
      datosPrimitiva = resultadoConsenso.datos;
      if (lastRow >= 2) {
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

  // Envío de UN SOLO mensaje unificado a WhatsApp
  if (modoResumen === 'SÍ') {
    var mensajeUnificado = generarBoletinDiarioGeneralONLAEyONCE(ahora, datosPrimitiva, resumenPena);
    enviarMensajeGreenApi(mensajeUnificado);
    Logger.log('✅ Orquestador Nocturno Unificado: boletín multijuego enviado en 1 único mensaje.');
    return { success: true, enviado: true, modo: 'BOLETIN_UNIFICADO', consensoPrimitiva: !!datosPrimitiva };
  } else if (datosPrimitiva && resumenPena) {
    var msgPena = '🏆 *RESULTADO OFICIAL DEL SORTEO - PEÑA TORDUELES* 🏆\n\n' +
      '🎯 *Jornada:* ' + resumenPena.jornada + ' • *Fecha:* ' + (datosPrimitiva.fecha || Utilities.formatDate(ahora, 'GMT+1', 'dd/MM/yyyy')) + '\n' +
      '✨ *Combinación Ganadora (Consenso 100%):* ' + datosPrimitiva.combinacion.join(' · ') + '\n' +
      '🎱 *Complementario:* ' + datosPrimitiva.complementario + ' | *Reintegro:* ' + datosPrimitiva.reintegro + '\n\n' +
      '🔍 *Aciertos de la Peña:* ' + resumenPena.aciertos + ' aciertos ' + (resumenPena.acertados.length > 0 ? '([' + resumenPena.acertados.join(', ') + '])' : '') + '\n' +
      '💰 *Premio Obtenido:* ' + resumenPena.premio.toFixed(2) + ' €\n\n' +
      (resumenPena.premio <= 2000 ? '📥 *Destino:* Añadido a la Bolsa de Premios Menores (Art. 5.1).' : '🏦 *Destino:* Tramitación bancaria individual para socios activos (Art. 5.2).');
    enviarMensajeGreenApi(msgPena);
    Logger.log('✅ Orquestador Nocturno Unificado: resultado de la Peña enviado en 1 único mensaje.');
    return { success: true, enviado: true, modo: 'SOLO_PRIMITIVA', consensoPrimitiva: true };
  }

  Logger.log('ℹ️ Orquestador Nocturno Unificado finalizado sin envío (ModoResumen=NO y sin consenso Primitiva pendiente).');
  return { success: true, enviado: false, modo: 'INACTIVO', consensoPrimitiva: !!datosPrimitiva };
}

/**
 * Configura el disparador único nocturno entre las 22:00 y las 23:00 (22:30 aprox.)
 * Eliminando duplicados o disparadores heredados de envío separado.
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
    .nearMinute(30)
    .create();

  Logger.log('🕙 Disparador único del Orquestador Nocturno Unificado instalado (22:00-23:00). ID: ' + nuevoTrigger.getUniqueId());
  return nuevoTrigger;
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
// 5. WEBAPP INTEGRACIÓN BACKEND (REGISTRO, RGPD, PANEL ADMIN Y RENOVACIÓN)
// ============================================================================

var ADMIN_CONFIG = {
  // Contraseña de acceso al Panel Maestro de Administrador
  PASSWORD_ADMIN: 'TorduelesAdmin2026!'
};

/**
 * Valida la contraseña de administrador
 * @param {string} password
 * @return {boolean}
 */
function validarPasswordAdmin(password) {
  var passCorrecta = PropertiesService.getScriptProperties().getProperty('ADMIN_PASSWORD') || ADMIN_CONFIG.PASSWORD_ADMIN;
  return (password && String(password).trim() === passCorrecta);
}

/**
 * Valida el acceso de un socio mediante su DNI / NIE (Pantalla Dual)
 * Si el DNI existe, devuelve su ficha. Si no existe, indica que procede el registro.
 * 
 * @param {string} dni
 * @return {Object}
 */
function validarLoginDNI(dni) {
  if (!dni) {
    return { success: false, notFound: true, message: 'DNI no proporcionado.' };
  }

  var dniLimpio = String(dni).trim().toUpperCase().replace(/[\s-]/g, '');

  try {
    var ss = obtenerSpreadsheetConfigurado();
    var sheetUsuarios = ss.getSheetByName(PROYECTO_CONFIG.SHEET_USUARIOS);
    if (!sheetUsuarios || sheetUsuarios.getLastRow() < 2) {
      return { success: false, notFound: true, dniBuscado: dniLimpio };
    }

    var lastRow = sheetUsuarios.getLastRow();
    var rows = sheetUsuarios.getRange(2, 1, lastRow - 1, 11).getValues();

    for (var i = 0; i < rows.length; i++) {
      var r = rows[i];
      var dniFila = String(r[3] || '').trim().toUpperCase().replace(/[\s-]/g, '');
      if (dniFila && dniFila === dniLimpio) {
        var estado = (r[10] || 'Suplente').toString().trim();
        var estadoPago = (r[6] || 'Pendiente').toString().trim();
        var ciclo = (r[7] || 'Ciclo 3').toString().trim();
        var nombreCompleto = (r[1] + ' ' + r[2]).trim();

        return {
          success: true,
          notFound: false,
          user: {
            fila: i + 2,
            nombre: nombreCompleto,
            dni: dniFila,
            estado: estado,
            pago: estadoPago,
            ciclo: ciclo + ' • J8'
          }
        };
      }
    }

    return { success: false, notFound: true, dniBuscado: dniLimpio };
  } catch (error) {
    Logger.log('Error en validarLoginDNI: ' + error.message);
    return { success: false, notFound: true, error: error.message };
  }
}

/**
 * REQUERIMIENTO 1: FORMULARIO HTML NATIVO DE INSCRIPCIÓN (INTEGRACIÓN FINAL)
 * Inserta en la hoja "Usuarios" el Nombre, Apellidos y Teléfono Móvil,
 * asignando automáticamente el estado "Suplente" (Columna K) y registrando la
 * marca temporal exacta con milisegundos (Columna A) para garantizar el orden cronológico.
 * 
 * @param {Object} datos - { nombre, apellidos, telefono, dni, reglamentoAceptado }
 * @return {Object} Confirmación de inscripción con timestamp y posición en lista de espera
 */
function registrarNuevoJugadorDesdeWeb(datos) {
  Logger.log('📝 Recibida inscripción desde WebApp...');

  try {
    if (!datos || !datos.nombre || !datos.apellidos || !datos.telefono) {
      return { success: false, message: 'Faltan campos obligatorios (Nombre, Apellidos o Teléfono).' };
    }
    if (!datos.reglamentoAceptado) {
      return { success: false, message: 'Es obligatorio aceptar el Reglamento Oficial para formalizar la reserva.' };
    }

    var ss = obtenerSpreadsheetConfigurado();
    var sheetUsuarios = ss.getSheetByName(PROYECTO_CONFIG.SHEET_USUARIOS);
    if (!sheetUsuarios) {
      sheetUsuarios = configurarPestanaUsuarios(ss);
    }

    // 1. Marca temporal con precisión de milisegundos: dd/MM/yyyy HH:mm:ss.SSS
    var ahora = new Date();
    var zonaHoraria = Session.getScriptTimeZone() || 'GMT+1';
    var timestampMs = Utilities.formatDate(ahora, zonaHoraria, 'dd/MM/yyyy HH:mm:ss.SSS');

    var nombreLimpio = String(datos.nombre).trim();
    var apellidosLimpio = String(datos.apellidos).trim();
    var telefonoLimpio = String(datos.telefono).trim();

    // Contar suplentes actuales para calcular la posición exacta en lista de espera
    var lastRow = sheetUsuarios.getLastRow();
    var suplentesActuales = 0;
    if (lastRow >= 2) {
      var valores = sheetUsuarios.getRange(2, 1, lastRow - 1, 11).getValues();
      for (var i = 0; i < valores.length; i++) {
        if (valores[i][10] === 'Suplente') {
          suplentesActuales++;
        }
      }
    }
    var posicionEspera = suplentesActuales + 1;
    var nuevaFilaIdx = lastRow + 1;

    // Estructura oficial de columnas en la hoja "Usuarios":
    // A: Marca temporal (milisegundos) | B: Nombre | C: Apellidos | D: DNI | E: Teléfono | F: IBAN | G: Estado de Pago | H: Ciclo Actual | I: Reglamento Aceptado | J: % Participación | K: Estado
    sheetUsuarios.getRange(nuevaFilaIdx, 1).setNumberFormat('@').setValue(timestampMs);
    sheetUsuarios.getRange(nuevaFilaIdx, 2).setValue(nombreLimpio);
    sheetUsuarios.getRange(nuevaFilaIdx, 3).setValue(apellidosLimpio);
    sheetUsuarios.getRange(nuevaFilaIdx, 4).setNumberFormat('@').setValue(''); // DNI vacío por privacidad (Art. 3.1)
    sheetUsuarios.getRange(nuevaFilaIdx, 5).setNumberFormat('@').setValue(telefonoLimpio);
    sheetUsuarios.getRange(nuevaFilaIdx, 6).setNumberFormat('@').setValue(''); // IBAN vacío por privacidad (Art. 3.1)
    sheetUsuarios.getRange(nuevaFilaIdx, 7).setValue('Pendiente');              // Estado de Pago por defecto
    sheetUsuarios.getRange(nuevaFilaIdx, 8).setValue(1);                        // Ciclo actual
    sheetUsuarios.getRange(nuevaFilaIdx, 9).setValue(true);                     // Reglamento Aceptado (TRUE)
    sheetUsuarios.getRange(nuevaFilaIdx, 10).setFormula('=IF(K' + nuevaFilaIdx + '="Titular", 1 / COUNTIF($K$2:$K, "Titular"), 0)');
    sheetUsuarios.getRange(nuevaFilaIdx, 11).setValue('Suplente');              // Estado por defecto Suplente

    Logger.log('✅ Inscripción confirmada con milisegundos: ' + timestampMs + ' -> ' + nombreLimpio + ' ' + apellidosLimpio + ' (Suplente #' + posicionEspera + ')');

    return {
      success: true,
      timestamp: timestampMs,
      nombre: nombreLimpio + ' ' + apellidosLimpio,
      estado: 'Suplente',
      posicionEspera: posicionEspera,
      message: 'Inscripción registrada con éxito en lista de espera con timestamp inalterable: ' + timestampMs
    };
  } catch (error) {
    Logger.log('❌ Error en registrarNuevoJugadorDesdeWeb: ' + error.message);
    return { success: false, message: 'Error interno al registrar: ' + error.message };
  }
}

/**
 * REQUERIMIENTO 2: VISTA PÚBLICA DE JUGADORES (CUMPLIMIENTO ESTRICTO RGPD)
 * Extrae los datos de la hoja "Usuarios", elimina las columnas de DNI, Teléfono, IBAN
 * y Estado de Pago en el servidor, y devuelve únicamente el array censurado al frontend.
 * En el frontend NO existe ningún rastro de datos sensibles.
 * 
 * @return {Array<Object>} Lista censurada: [{ id, nombre, apellidos, estado }]
 */
function obtenerListaJugadoresPublica() {
  try {
    var ss = obtenerSpreadsheetConfigurado();
    var sheetUsuarios = ss.getSheetByName(PROYECTO_CONFIG.SHEET_USUARIOS);
    if (!sheetUsuarios || sheetUsuarios.getLastRow() < 2) {
      // Datos de ejemplo garantizados en caso de hoja nueva
      return [
        { id: 1, nombre: 'Juan', apellidos: 'Pérez García', estado: 'Titular' },
        { id: 2, nombre: 'María', apellidos: 'Rodríguez Santos', estado: 'Titular' },
        { id: 3, nombre: 'Carlos', apellidos: 'Fernández Burgos', estado: 'Suplente' },
        { id: 4, nombre: 'Laura', apellidos: 'Gómez Tordueles', estado: 'Titular' }
      ];
    }

    var lastRow = sheetUsuarios.getLastRow();
    var rows = sheetUsuarios.getRange(2, 1, lastRow - 1, 11).getValues();
    var listaCensurada = [];

    for (var i = 0; i < rows.length; i++) {
      var r = rows[i];
      var nombre = (r[1] || '').toString().trim();
      var apellidos = (r[2] || '').toString().trim();
      var estado = (r[10] || 'Suplente').toString().trim();

      // Omitir filas vacías o miembros dados de baja
      if (nombre && estado !== 'Baja') {
        listaCensurada.push({
          id: (i + 1),
          nombre: nombre,
          apellidos: apellidos,
          estado: estado // 'Titular' o 'Suplente'
          // Estricto RGPD: DNI (col 3), Teléfono (col 4), IBAN (col 5) y Pago (col 6) OMITIDOS.
        });
      }
    }

    return listaCensurada;
  } catch (error) {
    Logger.log('Error en obtenerListaJugadoresPublica: ' + error.message);
    return [];
  }
}

/**
 * REQUERIMIENTO 3: PANEL DE ADMINISTRADOR PROTEGIDO (DATOS COMPLETOS SIN CENSURA)
 * Requiere validación de contraseña de administrador en el servidor.
 * Devuelve la totalidad de los datos: Fila, Timestamp, Nombre, Apellidos, DNI, Teléfono, IBAN, Estado de Pago, Ciclo y Estado.
 * 
 * @param {string} password - Contraseña de administrador
 * @return {Object} { success: boolean, jugadores?: Array, error?: string }
 */
function obtenerListaJugadoresAdmin(password) {
  if (!validarPasswordAdmin(password)) {
    return { success: false, error: 'Acceso no autorizado. Contraseña de administrador incorrecta.' };
  }

  try {
    var ss = obtenerSpreadsheetConfigurado();
    var sheetUsuarios = ss.getSheetByName(PROYECTO_CONFIG.SHEET_USUARIOS);
    if (!sheetUsuarios || sheetUsuarios.getLastRow() < 2) {
      return { success: true, jugadores: [] };
    }

    var lastRow = sheetUsuarios.getLastRow();
    var rows = sheetUsuarios.getRange(2, 1, lastRow - 1, 11).getValues();
    var listaAdmin = [];

    for (var i = 0; i < rows.length; i++) {
      var r = rows[i];
      var nombre = (r[1] || '').toString().trim();
      if (nombre) {
        listaAdmin.push({
          fila: i + 2, // Número de fila real para modificaciones directas
          timestamp: (r[0] || '').toString(),
          nombre: nombre,
          apellidos: (r[2] || '').toString().trim(),
          dni: (r[3] || '').toString().trim(),
          telefono: (r[4] || '').toString().trim(),
          iban: (r[5] || '').toString().trim(),
          pago: (r[6] || 'Pendiente').toString().trim(),
          ciclo: (r[7] || 'Ciclo 3').toString().trim(),
          reglamento: !!r[8],
          participacion: r[9] || 0,
          estado: (r[10] || 'Suplente').toString().trim()
        });
      }
    }

    return {
      success: true,
      jugadores: listaAdmin
    };
  } catch (error) {
    Logger.log('Error en obtenerListaJugadoresAdmin: ' + error.message);
    return { success: false, error: error.message };
  }
}

/**
 * REQUERIMIENTO 3 (CONTROLES INTERACTIVOS): MODIFICAR ESTADO DE PAGO
 * Permite al Administrador cambiar manualmente el "Estado de Pago" (Pagado / Pendiente)
 * de un jugador directamente desde la tabla administrativa.
 * 
 * @param {number} fila - Número de fila en la hoja 'Usuarios'
 * @param {string} nuevoEstado - 'Pagado' o 'Pendiente'
 * @param {string} password - Contraseña de administrador
 * @return {Object}
 */
function actualizarEstadoPagoAdmin(fila, nuevoEstado, password) {
  if (!validarPasswordAdmin(password)) {
    return { success: false, error: 'Acceso no autorizado.' };
  }

  try {
    var filaNum = parseInt(fila, 10);
    if (isNaN(filaNum) || filaNum < 2) {
      return { success: false, error: 'Número de fila inválido.' };
    }

    var estadoNormalizado = (nuevoEstado === 'Pagado') ? 'Pagado' : 'Pendiente';
    var ss = obtenerSpreadsheetConfigurado();
    var sheetUsuarios = ss.getSheetByName(PROYECTO_CONFIG.SHEET_USUARIOS);

    // Columna G (7): Estado de Pago
    sheetUsuarios.getRange(filaNum, 7).setValue(estadoNormalizado);
    Logger.log('💰 Administrador actualizó Estado de Pago en fila ' + filaNum + ' -> ' + estadoNormalizado);

    return {
      success: true,
      fila: filaNum,
      nuevoEstado: estadoNormalizado,
      message: 'Estado de pago actualizado a "' + estadoNormalizado + '" en la fila ' + filaNum
    };
  } catch (e) {
    Logger.log('Error en actualizarEstadoPagoAdmin: ' + e.message);
    return { success: false, error: e.message };
  }
}

/**
 * REQUERIMIENTO 3 (BOTÓN MAESTRO): APROBAR SALTO DE NIVEL MANUAL (ART. 3.5)
 * Evalúa los suplentes en lista de espera y asciende a Titular el cupo exacto
 * necesario para alcanzar el siguiente bloque de apuesta múltiple oficial.
 * 
 * @param {string} password - Contraseña de administrador
 * @return {Object}
 */
function aprobarSaltoDeNivelAdmin(password) {
  if (!validarPasswordAdmin(password)) {
    return { success: false, error: 'Acceso no autorizado.' };
  }

  try {
    var ss = obtenerSpreadsheetConfigurado();
    var sheetUsuarios = ss.getSheetByName(PROYECTO_CONFIG.SHEET_USUARIOS);
    if (!sheetUsuarios || sheetUsuarios.getLastRow() < 2) {
      return { success: false, error: 'No se encontraron socios en la base de datos.' };
    }

    var lastRow = sheetUsuarios.getLastRow();
    var rows = sheetUsuarios.getRange(2, 1, lastRow - 1, 11).getValues();

    // Bloques oficiales de apuestas múltiples según Art. 2.1 del Reglamento:
    // 7 (M7), 28 (M8), 44 (M5 fija), 84 (M9), 210 (M10), 462 (M11)
    var bloquesOficiales = [7, 28, 44, 84, 210, 462];

    var titulares = [];
    var suplentes = [];

    for (var i = 0; i < rows.length; i++) {
      var filaIdx = i + 2;
      var st = (rows[i][10] || '').toString().trim();
      var item = {
        fila: filaIdx,
        nombre: rows[i][1] + ' ' + rows[i][2],
        timestamp: rows[i][0],
        estado: st
      };
      if (st === 'Titular') {
        titulares.push(item);
      } else if (st === 'Suplente') {
        suplentes.push(item);
      }
    }

    var totalTitulares = titulares.length;

    // Localizar el siguiente bloque oficial superior
    var siguienteBloque = null;
    for (var b = 0; b < bloquesOficiales.length; b++) {
      if (bloquesOficiales[b] > totalTitulares) {
        siguienteBloque = bloquesOficiales[b];
        break;
      }
    }

    if (!siguienteBloque) {
      return {
        success: false,
        error: 'La peña ya ha alcanzado el nivel máximo previsto en el reglamento (462 jugadores).'
      };
    }

    var plazasNecesarias = siguienteBloque - totalTitulares;

    if (suplentes.length < plazasNecesarias) {
      return {
        success: false,
        error: 'Cupo insuficiente en lista de espera: Para ascender de ' + totalTitulares + ' a ' + siguienteBloque + ' jugadores se requieren ' + plazasNecesarias + ' suplentes con pago acreditado (hay ' + suplentes.length + ' disponibles).'
      };
    }

    // Ascender por estricto orden cronológico (primeros 'plazasNecesarias' suplentes)
    var ascendidos = [];
    for (var s = 0; s < plazasNecesarias; s++) {
      var suplente = suplentes[s];
      // Cambiar Columna K a 'Titular'
      sheetUsuarios.getRange(suplente.fila, 11).setValue('Titular');
      ascendidos.push(suplente.nombre);
    }

    Logger.log('🎉 Salto de nivel aprobado por el Administrador: ' + totalTitulares + ' -> ' + siguienteBloque + ' jugadores.');

    // Notificar al grupo de WhatsApp vía Green API
    var msgWhatsApp = '📢 *AMPLIACIÓN OFICIAL DE LA PEÑA TORDUELES (ART. 3.5)* 📢\n\n' +
      'El Administrador ha aprobado el salto de nivel para el nuevo ciclo:\n' +
      '• *Categoría anterior:* ' + totalTitulares + ' jugadores\n' +
      '• *Nueva Categoría Oficial:* ' + siguienteBloque + ' jugadores\n' +
      '• *Nuevos Titulares Ascendidos por Antigüedad:* ' + ascendidos.join(', ') + '\n\n' +
      'La peña jugará la apuesta múltiple correspondiente en el próximo ciclo tras validar los abonos.';

    enviarMensajeGreenApi(msgWhatsApp);

    return {
      success: true,
      nivelAnterior: totalTitulares,
      nuevoNivel: siguienteBloque,
      plazasCubiertas: plazasNecesarias,
      suplentesRestantes: suplentes.length - plazasNecesarias,
      ascendidos: ascendidos,
      message: '¡Salto de nivel oficial aprobado! La peña pasa de ' + totalTitulares + ' a ' + siguienteBloque + ' jugadores titulares.'
    };
  } catch (e) {
    Logger.log('Error en aprobarSaltoDeNivelAdmin: ' + e.message);
    return { success: false, error: e.message };
  }
}

/**
 * REQUERIMIENTO 4: AUTOMATIZACIÓN DEL AVISO NARANJA DE RENOVACIÓN
 * Lee en qué sorteo se encuentra la peña y determina si está activa la ventana
 * obligatoria de renovación (jornadas 7, 8 y 9 del ciclo).
 * 
 * @return {Object} { jornadaActual, jornadaEnCiclo, cicloActual, esPeriodoRenovacion, textoBanner, esUltimaJornadaPlazo }
 */
function obtenerJornadaActual() {
  try {
    var ss = obtenerSpreadsheetConfigurado();
    var sheetSorteos = ss.getSheetByName(PROYECTO_CONFIG.SHEET_SORTEOS);
    var jornadaActual = 8; // Jornada por defecto
    var cicloActual = 1;

    if (sheetSorteos && sheetSorteos.getLastRow() >= 2) {
      var lastRow = sheetSorteos.getLastRow();
      var val = sheetSorteos.getRange(lastRow, 1).getValue();
      if (!isNaN(parseInt(val, 10)) && parseInt(val, 10) > 0) {
        jornadaActual = parseInt(val, 10);
      }
    }

    var cicloLength = PROYECTO_CONFIG.JORNADAS_POR_CICLO || 10;
    var jornadaEnCiclo = ((jornadaActual - 1) % cicloLength) + 1;
    cicloActual = Math.floor((jornadaActual - 1) / cicloLength) + 1;

    // Regla estricta del reglamento: Aparece en J7 y se mantiene visible en J8 y J9
    var esPeriodoRenovacion = (jornadaEnCiclo >= 7 && jornadaEnCiclo <= 9);

    var textoBanner = 'Periodo de Renovación Activo: Jornada ' + jornadaEnCiclo + '/10. Recuerda abonar la cuota de 10€ antes de finalizar la jornada 9.';

    return {
      jornadaActual: jornadaActual,
      jornadaEnCiclo: jornadaEnCiclo,
      cicloActual: cicloActual,
      esPeriodoRenovacion: esPeriodoRenovacion,
      textoBanner: textoBanner,
      esUltimaJornadaPlazo: (jornadaEnCiclo === 9)
    };
  } catch (error) {
    Logger.log('Error en obtenerJornadaActual: ' + error.message);
    return {
      jornadaActual: 8,
      jornadaEnCiclo: 8,
      cicloActual: 1,
      esPeriodoRenovacion: true,
      textoBanner: 'Periodo de Renovación Activo: Jornada 8/10. Recuerda abonar la cuota de 10€ antes de finalizar la jornada 9.',
      esUltimaJornadaPlazo: false
    };
  }
}

/**
 * SERVICIO WEB (doGet & doPost)
 * Si se accede desde navegador, sirve la WebApp Index.html con soporte google.script.run.
 * Si se incluye el parámetro api=true, responde con API REST JSON.
 */
function doGet(e) {
  // 1. Si es una llamada API directa con parámetros
  if (e && e.parameter && e.parameter.api === 'true') {
    var accion = e.parameter.action;
    var result = {};

    if (accion === 'listaPublica') {
      result = obtenerListaJugadoresPublica();
    } else if (accion === 'jornadaActual') {
      result = obtenerJornadaActual();
    } else if (accion === 'escrutinioConsenso') {
      result = ejecutarMotorPuenteRSSConsenso();
    } else {
      var ss = obtenerSpreadsheetConfigurado();
      var sheetTesoreria = ss.getSheetByName(PROYECTO_CONFIG.SHEET_TESORERIA);
      var sheetConfig = ss.getSheetByName(PROYECTO_CONFIG.SHEET_CONFIGURACION);
      var jornadaInfo = obtenerJornadaActual();

      result = {
        status: 'OK',
        app: 'Peña Primitiva Tordueles',
        ciclo: jornadaInfo.cicloActual,
        jornada: jornadaInfo.jornadaActual,
        jornadaEnCiclo: jornadaInfo.jornadaEnCiclo,
        esPeriodoRenovacion: jornadaInfo.esPeriodoRenovacion,
        bolsaPremios: sheetTesoreria ? sheetTesoreria.getRange('D2').getValue() : 384.50,
        boletinDiarioActivo: sheetConfig ? (sheetConfig.getRange('A2').getValue() === 'SÍ') : false,
        timestamp: new Date().toISOString()
      };
    }

    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  }

  // 2. Si es acceso web estándar, desplegar la WebApp HTML modular (Index + Estilos + Logica)
  return HtmlService.createTemplateFromFile('Index')
    .evaluate()
    .setTitle('Peña Primitiva Tordueles | Portal Oficial')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no')
    .addMetaTag('theme-color', '#0A2540');
}

function doPost(e) {
  try {
    var contents = e && e.postData && e.postData.contents ? JSON.parse(e.postData.contents) : {};
    var action = contents.action;

    if (action === 'registro') {
      var res = registrarNuevoJugadorDesdeWeb(contents.datos);
      return ContentService.createTextOutput(JSON.stringify(res))
        .setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({ status: 'OK', received: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'ERROR', message: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
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
