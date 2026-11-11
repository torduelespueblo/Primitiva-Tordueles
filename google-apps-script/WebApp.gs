/**
 * ============================================================================
 * PEÑA PRIMITIVA TORDUELES - WEBAPP FRONTEND CONTROLLER (HtmlService)
 * Archivo: WebApp.gs
 * ============================================================================
 * 
 * Controlador de servicio para la interfaz web servida vía Google Apps Script:
 * - doGet() con soporte para plantillas y metatags PWA Mobile-First
 * - include() para modularizar HTML, CSS (Estilos.html) y JS (Logica.html)
 * - Funciones de backend llamadas desde google.script.run:
 *   * validarLoginDNI(dni)
 *   * aceptarReglamento(dni)
 *   * obtenerDatosDashboard(dni)
 */

// ==========================================
// 1. CONTROLADOR DE VISTAS (HtmlService)
// ==========================================
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
    .addMetaTag('apple-mobile-web-app-status-bar-style', 'black-translucent')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * Función auxiliar para incluir archivos modulares en el template de GAS
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

// ==========================================
// 2. FUNCIONES DE BACKEND PARA EL FRONTEND
// ==========================================

/**
 * Valida el DNI del usuario contra la hoja 'Usuarios'.
 * @param {string} dniInput - DNI o NIE introducido por el usuario.
 * @returns {object} Objeto con resultado de validación y datos del usuario.
 */
function validarLoginDNI(dniInput) {
  try {
    if (!dniInput || typeof dniInput !== 'string') {
      return { success: false, message: 'Por favor, introduce un DNI o NIE válido.' };
    }

    var dniLimpio = dniInput.trim().toUpperCase().replace(/[\s-]/g, '');
    var ss = obtenerSpreadsheetPeña();
    var sheetUsuarios = ss.getSheetByName('Usuarios');
    
    if (!sheetUsuarios) {
      return { success: false, message: 'La pestaña "Usuarios" no existe en la base de datos.' };
    }

    var lastRow = sheetUsuarios.getLastRow();
    if (lastRow < 2) {
      return { success: false, message: 'No hay usuarios dados de alta en el sistema.' };
    }

    // Leemos el rango de usuarios: A2:K[lastRow]
    // Columnas: A:Marca temporal, B:Nombre, C:Apellidos, D:DNI, E:Teléfono, F:IBAN, G:Estado de Pago, H:Ciclo Actual, I:Reglamento Aceptado, J:% Participación, K:Estado
    var datos = sheetUsuarios.getRange(2, 1, lastRow - 1, 11).getValues();

    for (var i = 0; i < datos.length; i++) {
      var fila = datos[i];
      var dniFila = (fila[3] || '').toString().trim().toUpperCase().replace(/[\s-]/g, '');

      if (dniFila === dniLimpio) {
        var nombre = (fila[1] || '').toString().trim();
        var apellidos = (fila[2] || '').toString().trim();
        var estadoPago = (fila[6] || 'Pendiente').toString().trim();
        var cicloActual = parseInt(fila[7], 10) || 1;
        var reglamentoAceptado = fila[8] === true || fila[8] === 'TRUE' || fila[8] === 1 || fila[8] === 'SÍ';
        var porcentajePart = fila[9] || 0;
        var estado = (fila[10] || 'Titular').toString().trim();

        // Si está en estado BAJA, advertir
        if (estado.toUpperCase() === 'BAJA') {
          return {
            success: false,
            message: 'Tu usuario figura como BAJA en el registro oficial según Art. 4 del Reglamento.'
          };
        }

        return {
          success: true,
          user: {
            dni: dniLimpio,
            nombre: nombre,
            apellidos: apellidos,
            nombreCompleto: nombre + ' ' + apellidos,
            estadoPago: estadoPago,
            cicloActual: cicloActual,
            reglamentoAceptado: reglamentoAceptado,
            porcentajeParticipacion: typeof porcentajePart === 'number' ? (porcentajePart * 100).toFixed(2) + '%' : porcentajePart,
            estado: estado,
            filaIndex: i + 2
          }
        };
      }
    }

    return {
      success: false,
      message: 'DNI no encontrado. Asegúrate de escribirlo correctamente o regístrate en el Formulario oficial.'
    };
  } catch (err) {
    return { success: false, message: 'Error interno en el servidor: ' + err.message };
  }
}

/**
 * Registra la aceptación del reglamento oficial en la hoja 'Usuarios' (Columna I = TRUE).
 * @param {string} dniInput - DNI del usuario autenticado.
 * @returns {object} Resultado de la operación.
 */
function aceptarReglamento(dniInput) {
  try {
    if (!dniInput) {
      return { success: false, message: 'DNI requerido.' };
    }

    var dniLimpio = dniInput.trim().toUpperCase().replace(/[\s-]/g, '');
    var ss = obtenerSpreadsheetPeña();
    var sheetUsuarios = ss.getSheetByName('Usuarios');
    var lastRow = sheetUsuarios.getLastRow();
    
    if (lastRow < 2) {
      return { success: false, message: 'Sin registros.' };
    }

    var dnis = sheetUsuarios.getRange(2, 4, lastRow - 1, 1).getValues();

    for (var i = 0; i < dnis.length; i++) {
      var d = (dnis[i][0] || '').toString().trim().toUpperCase().replace(/[\s-]/g, '');
      if (d === dniLimpio) {
        var filaReal = i + 2;
        // Columna I (9): Reglamento Aceptado -> TRUE
        sheetUsuarios.getRange(filaReal, 9).setValue(true);
        return { success: true, message: 'Reglamento aceptado formalmente.' };
      }
    }

    return { success: false, message: 'Usuario no localizado para aceptar reglamento.' };
  } catch (err) {
    return { success: false, message: 'Error al registrar aceptación: ' + err.message };
  }
}

/**
 * Obtiene todos los datos para el Dashboard: Tesorería, Sorteos y Datos actualizados del Usuario.
 * @param {string} dniInput - DNI del usuario autenticado.
 * @returns {object} Datos consolidados del dashboard.
 */
function obtenerDatosDashboard(dniInput) {
  try {
    var ss = obtenerSpreadsheetPeña();
    
    // 1. Datos de Tesorería (Pestaña 'Tesorería')
    var sheetTesoreria = ss.getSheetByName('Tesorería');
    var fondoApuestas = 0;
    var bolsaPremios = 0;
    var cicloTesoreria = 'Ciclo 1';

    if (sheetTesoreria && sheetTesoreria.getLastRow() >= 2) {
      var filaTesoreria = sheetTesoreria.getRange(2, 1, 1, 4).getValues()[0];
      cicloTesoreria = (filaTesoreria[1] || 'Ciclo 1').toString();
      fondoApuestas = parseFloat(filaTesoreria[2]) || 0;
      bolsaPremios = parseFloat(filaTesoreria[3]) || 0;
    }

    // 2. Historial de Sorteos (Pestaña 'Sorteos')
    var sheetSorteos = ss.getSheetByName('Sorteos');
    var listaSorteos = [];
    var jornadaActual = 1;

    if (sheetSorteos && sheetSorteos.getLastRow() >= 2) {
      var lastRowSorteos = sheetSorteos.getLastRow();
      var datosSorteos = sheetSorteos.getRange(2, 1, lastRowSorteos - 1, 10).getValues();

      for (var s = datosSorteos.length - 1; s >= 0; s--) {
        var filaS = datosSorteos[s];
        var jNum = parseInt(filaS[0], 10) || (s + 1);
        if (s === datosSorteos.length - 1) {
          jornadaActual = jNum;
        }

        var fechaStr = '';
        if (filaS[1] instanceof Date) {
          fechaStr = Utilities.formatDate(filaS[1], 'GMT+1', 'dd/MM/yyyy');
        } else {
          fechaStr = (filaS[1] || '').toString();
        }

        listaSorteos.push({
          jornada: jNum,
          fecha: fechaStr,
          resguardo: (filaS[2] || '').toString(),
          fotoResguardo: (filaS[3] || '').toString(),
          importeJugado: parseFloat(filaS[4]) || 0,
          combinacionJugada: (filaS[5] || '').toString(),
          combinacionGanadora: (filaS[6] || '').toString(),
          aciertos: filaS[7] !== '' ? parseInt(filaS[7], 10) : null,
          cantidadPremiada: parseFloat(filaS[8]) || 0,
          premioMenor: parseFloat(filaS[9]) || 0
        });
      }
    }

    // 3. Datos del usuario actualizados
    var userValidation = validarLoginDNI(dniInput);
    var userData = userValidation.success ? userValidation.user : null;

    return {
      success: true,
      data: {
        tesoreria: {
          ciclo: cicloTesoreria,
          fondoApuestas: fondoApuestas,
          bolsaPremios: bolsaPremios
        },
        jornadaActual: jornadaActual,
        sorteos: listaSorteos,
        ultimoSorteo: listaSorteos.length > 0 ? listaSorteos[0] : null,
        usuario: userData
      }
    };
  } catch (err) {
    return { success: false, message: 'Error al cargar datos del dashboard: ' + err.message };
  }
}

/**
 * Localiza la hoja de cálculo de la Peña Primitiva Tordueles
 */
function obtenerSpreadsheetPeña() {
  // 1. Por Script Properties
  var id = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
  if (id) {
    try {
      return SpreadsheetApp.openById(id);
    } catch (e) {}
  }
  
  // 2. Si este script está vinculado al propio Spreadsheet
  try {
    var ssActivo = SpreadsheetApp.getActiveSpreadsheet();
    if (ssActivo) return ssActivo;
  } catch (e) {}

  // 3. Búsqueda en Google Drive dentro de la carpeta del sistema
  var files = DriveApp.getFilesByName('Primitiva Tordueles - Base de Datos');
  if (files.hasNext()) {
    return SpreadsheetApp.openById(files.next().getId());
  }

  throw new Error('No se ha encontrado la hoja "Primitiva Tordueles - Base de Datos". Ejecuta "inicializarProyectoCompleto()" primero.');
}
