/**
 * ============================================================================
 * PEÑA PRIMITIVA TORDUELES - WEBAPP FRONTEND CONTROLLER (HtmlService)
 * Archivo: WebApp.gs
 * ============================================================================
 *
 * Controlador principal de la WebApp SPA (Mobile-First PWA):
 * - doGet(e): sirve Index.html compilado con <?!= include('Estilos'); ?> y <?!= include('Logica'); ?>
 * - include(filename): inserta Estilos.html y Logica.html
 * - Módulos backend:
 *   1. Pantalla Dual: validarLoginDNI(dni) & registrarNuevoJugadorDesdeWeb(datos)
 *   2. Reglamento: aceptarReglamento(dni)
 *   3. Vista Pública RGPD: obtenerListaJugadoresPublica()
 *   4. Panel Admin Protegido: obtenerListaJugadoresAdmin(password),
 *      actualizarEstadoPagoAdmin(fila, nuevoEstado, password),
 *      aprobarSaltoDeNivelAdmin(password)
 *   5. Automatización Banner Naranja: obtenerJornadaActual()
 *   6. Dashboard Consolidado: obtenerDatosDashboard(dni)
 */

var WEBAPP_ADMIN_CONFIG = {
  // Se recomienda configurar 'ADMIN_PASSWORD' en Propiedades del Script de Apps Script
  DEFAULT_ADMIN_PASSWORD: '230696',
  DEFAULT_SPREADSHEET_ID: '18R_F67pOt4pYBD5VqzBln12H-VMxUx-qmoeCewwz8qw',
  JORNADAS_POR_CICLO: 10
};

// ============================================================================
// 1. CONTROLADOR DE VISTAS Y ENDPOINT WEB (HtmlService & API REST)
// ============================================================================

function doGet(e) {
  if (e && e.parameter && (e.parameter.api === 'true' || e.parameter.action === 'status' || e.parameter.format === 'json')) {
    try {
      var accion = e.parameter.action || 'status';
      var payload = {};

      if (accion === 'listaPublica') {
        payload = obtenerListaJugadoresPublica();
      } else if (accion === 'jornadaActual') {
        payload = obtenerJornadaActual();
      } else if (accion === 'boletinDiario') {
        payload = obtenerBoletinDiarioLive(new Date(), null, null);
      } else if (accion === 'enviarBoletin') {
        payload = enviarBoletinDiarioWhatsApp(true);
      } else if (accion === 'escrutinioConsenso') {
        payload = ejecutarMotorPuenteRSSConsenso();
      } else {
        var ss = obtenerSpreadsheetPeña();
        var sheetTesoreria = ss.getSheetByName('Tesorería');
        var sheetConfig = ss.getSheetByName('Configuracion');
        var jornadaInfo = obtenerJornadaActual();
        var bolsa = 0;

        if (sheetTesoreria && sheetTesoreria.getLastRow() >= 2) {
          var rawBolsa = parseFloat(sheetTesoreria.getRange(2, 4).getValue());
          bolsa = isNaN(rawBolsa) ? 0 : rawBolsa;
        }

        payload = {
          status: 'OK',
          app: 'Peña Primitiva Tordueles',
          ciclo: jornadaInfo.cicloActual,
          jornada: jornadaInfo.jornadaActual,
          jornadaEnCiclo: jornadaInfo.jornadaEnCiclo,
          esPeriodoRenovacion: jornadaInfo.esPeriodoRenovacion,
          bolsaPremios: bolsa,
          boletinDiarioActivo: sheetConfig ? (String(sheetConfig.getRange('A2').getValue()).trim().toUpperCase() === 'SÍ') : true,
          timestamp: new Date().toISOString()
        };
      }

      return ContentService.createTextOutput(JSON.stringify(payload))
        .setMimeType(ContentService.MimeType.JSON);
    } catch (err) {
      return ContentService.createTextOutput(JSON.stringify({
        status: 'ERROR',
        success: false,
        message: err.message
      })).setMimeType(ContentService.MimeType.JSON);
    }
  }

  var template = HtmlService.createTemplateFromFile('Index');
  return template.evaluate()
    .setTitle('Peña Primitiva Tordueles | Portal Oficial')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no')
    .addMetaTag('theme-color', '#0A2540')
    .addMetaTag('apple-mobile-web-app-capable', 'yes')
    .addMetaTag('apple-mobile-web-app-status-bar-style', 'black-translucent')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function doPost(e) {
  try {
    var contents = (e && e.postData && e.postData.contents) ? JSON.parse(e.postData.contents) : {};
    var action = contents.action;

    if (action === 'registro') {
      var res = registrarNuevoJugadorDesdeWeb(contents.datos);
      return ContentService.createTextOutput(JSON.stringify(res))
        .setMimeType(ContentService.MimeType.JSON);
    }

    if (action === 'validarAdmin') {
      var valido = validarPasswordAdmin(contents.password);
      return ContentService.createTextOutput(JSON.stringify({ success: valido }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({ status: 'OK', received: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'ERROR',
      success: false,
      message: err.message
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Inserta archivos HTML modulares (Estilos.html, Logica.html) dentro de Index.html
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

// ============================================================================
// 2. MÓDULO 1: PANTALLA DUAL (LOGIN DNI / REGISTRO INTELIGENTE)
// ============================================================================

/**
 * Verifica si un DNI o NIE existe en la pestaña 'Usuarios'.
 * Si existe: devuelve la ficha del socio para abrir el Dashboard.
 * Si NO existe: devuelve { success: false, notFound: true } para activar el registro.
 */
function validarLoginDNI(dniInput) {
  try {
    if (!dniInput || typeof dniInput !== 'string') {
      return { success: false, notFound: false, message: 'Por favor, introduce un DNI o NIE válido.' };
    }

    var dniLimpio = dniInput.trim().toUpperCase().replace(/[\s-]/g, '');
    if (dniLimpio.length < 5) {
      return { success: false, notFound: false, message: 'Formato de DNI/NIE demasiado corto.' };
    }

    var ss = obtenerSpreadsheetPeña();
    var sheetUsuarios = ss.getSheetByName('Usuarios');
    if (!sheetUsuarios || sheetUsuarios.getLastRow() < 2) {
      return {
        success: false,
        notFound: true,
        dniBuscado: dniLimpio,
        message: 'DNI no encontrado en el censo. Accediendo al registro inicial.'
      };
    }

    var lastRow = sheetUsuarios.getLastRow();
    // Columnas A..K: 1:Timestamp, 2:Nombre, 3:Apellidos, 4:DNI, 5:Teléfono, 6:IBAN, 7:Pago, 8:Ciclo, 9:Reglamento, 10:%Part, 11:Estado
    var datos = sheetUsuarios.getRange(2, 1, lastRow - 1, 11).getValues();

    for (var i = 0; i < datos.length; i++) {
      var fila = datos[i];
      var dniFila = (fila[3] || '').toString().trim().toUpperCase().replace(/[\s-]/g, '');

      if (dniFila && dniFila === dniLimpio) {
        var nombre = (fila[1] || '').toString().trim();
        var apellidos = (fila[2] || '').toString().trim();
        var estadoPago = (fila[6] || 'Pendiente').toString().trim();
        var cicloActual = parseInt(fila[7], 10) || 1;
        var reglamentoAceptado = fila[8] === true || fila[8] === 'TRUE' || fila[8] === 1 || fila[8] === 'SÍ';
        var porcentajePart = fila[9] || 0;
        var estado = (fila[10] || 'Titular').toString().trim();

        if (estado.toUpperCase() === 'BAJA') {
          return {
            success: false,
            notFound: false,
            baja: true,
            message: 'Tu ficha figura como BAJA definitiva conforme al Artículo 4 del Reglamento.'
          };
        }

        return {
          success: true,
          notFound: false,
          user: {
            filaIndex: i + 2,
            dni: dniLimpio,
            nombre: nombre,
            apellidos: apellidos,
            nombreCompleto: (nombre + ' ' + apellidos).trim(),
            estadoPago: estadoPago,
            pago: estadoPago,
            cicloActual: cicloActual,
            reglamentoAceptado: reglamentoAceptado,
            porcentajeParticipacion: typeof porcentajePart === 'number' ? (porcentajePart * 100).toFixed(2) + '%' : String(porcentajePart),
            estado: estado
          }
        };
      }
    }

    return {
      success: false,
      notFound: true,
      dniBuscado: dniLimpio,
      message: 'DNI no encontrado en el registro oficial.'
    };
  } catch (err) {
    return { success: false, notFound: false, message: 'Error interno al validar: ' + err.message };
  }
}

/**
 * Alta inicial desde el Formulario Inteligente (sin DNI ni IBAN por privacidad inicial).
 * Registra Nombre, Apellidos, Teléfono Móvil, sello temporal con milisegundos y estado 'Suplente'.
 */
function registrarNuevoJugadorDesdeWeb(datos) {
  try {
    if (!datos || !datos.nombre || !datos.apellidos || !datos.telefono) {
      return { success: false, message: 'Nombre, Apellidos y Teléfono Móvil son obligatorios.' };
    }
    if (!datos.reglamentoAceptado) {
      return { success: false, message: 'Es obligatorio aceptar el Reglamento Oficial para continuar.' };
    }

    var ss = obtenerSpreadsheetPeña();
    var sheetUsuarios = ss.getSheetByName('Usuarios');
    if (!sheetUsuarios) {
      return { success: false, message: 'La hoja "Usuarios" no está inicializada.' };
    }

    var ahora = new Date();
    var zonaHoraria = Session.getScriptTimeZone() || 'GMT+1';
    var timestampMs = Utilities.formatDate(ahora, zonaHoraria, 'dd/MM/yyyy HH:mm:ss.SSS');

    var nombreLimpio = String(datos.nombre).trim();
    var apellidosLimpio = String(datos.apellidos).trim();
    var telefonoLimpio = String(datos.telefono).trim();

    var lastRow = sheetUsuarios.getLastRow();
    var suplentesActuales = 0;
    var nuevaFila = lastRow + 1;
    if (lastRow >= 2) {
      var valores = sheetUsuarios.getRange(2, 1, lastRow - 1, 11).getValues();
      var filaLibreEncontrada = false;
      for (var i = 0; i < valores.length; i++) {
        var nomFila = String(valores[i][1] || '').trim();
        var tsFila = String(valores[i][0] || '').trim();
        if (!filaLibreEncontrada && !nomFila && !tsFila) {
          nuevaFila = i + 2;
          filaLibreEncontrada = true;
        }
        if (nomFila && String(valores[i][10] || '').trim() === 'Suplente') {
          suplentesActuales++;
        }
      }
    }

    var posicionEspera = suplentesActuales + 1;
    var jornadaInfo = obtenerJornadaActual();

    sheetUsuarios.getRange(nuevaFila, 1).setNumberFormat('@').setValue(timestampMs);
    sheetUsuarios.getRange(nuevaFila, 2).setValue(nombreLimpio);
    sheetUsuarios.getRange(nuevaFila, 3).setValue(apellidosLimpio);
    sheetUsuarios.getRange(nuevaFila, 4).setNumberFormat('@').setValue(''); // Sin DNI en fase inicial
    sheetUsuarios.getRange(nuevaFila, 5).setNumberFormat('@').setValue(telefonoLimpio);
    sheetUsuarios.getRange(nuevaFila, 6).setNumberFormat('@').setValue(''); // Sin IBAN en fase inicial
    sheetUsuarios.getRange(nuevaFila, 7).setValue('Pendiente');
    sheetUsuarios.getRange(nuevaFila, 8).setValue(jornadaInfo.cicloActual || 1);
    sheetUsuarios.getRange(nuevaFila, 9).setValue(true);
    sheetUsuarios.getRange(nuevaFila, 10).setFormula('=IF(K' + nuevaFila + '="Titular", IFERROR(1 / COUNTIF($K$2:$K, "Titular"), 0), 0)');
    var celdaEstado = sheetUsuarios.getRange(nuevaFila, 11);
    celdaEstado.clearDataValidations();
    celdaEstado.setValue('Suplente');

    return {
      success: true,
      timestamp: timestampMs,
      nombre: (nombreLimpio + ' ' + apellidosLimpio).trim(),
      estado: 'Suplente',
      posicionEspera: posicionEspera,
      user: {
        filaIndex: nuevaFila,
        dni: '',
        nombre: nombreLimpio,
        apellidos: apellidosLimpio,
        nombreCompleto: (nombreLimpio + ' ' + apellidosLimpio).trim(),
        estadoPago: 'Pendiente',
        pago: 'Pendiente',
        cicloActual: jornadaInfo.cicloActual || 1,
        reglamentoAceptado: true,
        porcentajeParticipacion: '0.00%',
        estado: 'Suplente'
      }
    };
  } catch (err) {
    return { success: false, message: 'Error al formalizar el alta: ' + err.message };
  }
}

/**
 * Registra la aceptación del reglamento oficial para un socio existente (Columna I = TRUE).
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
        sheetUsuarios.getRange(i + 2, 9).setValue(true);
        return { success: true, message: 'Reglamento aceptado formalmente.' };
      }
    }
    return { success: false, message: 'Usuario no localizado.' };
  } catch (err) {
    return { success: false, message: 'Error al registrar aceptación: ' + err.message };
  }
}

// ============================================================================
// 3. MÓDULO 3: VISTA PÚBLICA DE JUGADORES (SEGURIDAD RGPD EN SERVIDOR)
// ============================================================================

/**
 * Extrae el censo de 'Usuarios' y ELIMINA en el servidor DNI, Teléfono, IBAN y Estado de Pago.
 * Devuelve únicamente: [{ id, nombre, apellidos, estado }]
 */
function obtenerListaJugadoresPublica() {
  try {
    var ss = obtenerSpreadsheetPeña();
    var sheetUsuarios = ss.getSheetByName('Usuarios');
    if (!sheetUsuarios || sheetUsuarios.getLastRow() < 2) {
      return [];
    }

    var lastRow = sheetUsuarios.getLastRow();
    var rows = sheetUsuarios.getRange(2, 1, lastRow - 1, 11).getValues();
    var listaCensurada = [];

    for (var i = 0; i < rows.length; i++) {
      var r = rows[i];
      var nombre = (r[1] || '').toString().trim();
      var apellidos = (r[2] || '').toString().trim();
      var estado = (r[10] || 'Suplente').toString().trim();

      if (nombre && estado !== 'Baja') {
        listaCensurada.push({
          id: listaCensurada.length + 1,
          nombre: nombre,
          apellidos: apellidos,
          estado: estado
        });
      }
    }

    return listaCensurada;
  } catch (err) {
    Logger.log('Error en obtenerListaJugadoresPublica: ' + err.message);
    return [];
  }
}

// ============================================================================
// 4. MÓDULO 4: PANEL DE ADMINISTRADOR PROTEGIDO
// ============================================================================

function validarPasswordAdmin(password) {
  var claveReal = PropertiesService.getScriptProperties().getProperty('ADMIN_PASSWORD') || WEBAPP_ADMIN_CONFIG.DEFAULT_ADMIN_PASSWORD;
  return Boolean(password && String(password).trim() === String(claveReal).trim());
}

/**
 * Devuelve la tabla administrativa sin censura (DNI, Teléfono, IBAN y Estado de Pago)
 * tras validar la contraseña de administrador en el servidor.
 */
function obtenerListaJugadoresAdmin(password) {
  if (!validarPasswordAdmin(password)) {
    return { success: false, error: 'Acceso denegado. Contraseña de administrador incorrecta.' };
  }

  try {
    var ss = obtenerSpreadsheetPeña();
    var sheetUsuarios = ss.getSheetByName('Usuarios');
    if (!sheetUsuarios || sheetUsuarios.getLastRow() < 2) {
      return { success: true, jugadores: [] };
    }

    var lastRow = sheetUsuarios.getLastRow();
    var rows = sheetUsuarios.getRange(2, 1, lastRow - 1, 11).getValues();
    var listaCompleta = [];

    for (var i = 0; i < rows.length; i++) {
      var r = rows[i];
      var nombre = (r[1] || '').toString().trim();
      if (nombre) {
        listaCompleta.push({
          fila: i + 2,
          timestamp: (r[0] || '').toString(),
          nombre: nombre,
          apellidos: (r[2] || '').toString().trim(),
          dni: (r[3] || '').toString().trim(),
          telefono: (r[4] || '').toString().trim(),
          iban: (r[5] || '').toString().trim(),
          pago: (r[6] || 'Pendiente').toString().trim(),
          ciclo: (r[7] || 1).toString().trim(),
          reglamento: Boolean(r[8]),
          participacion: r[9] || 0,
          estado: (r[10] || 'Suplente').toString().trim()
        });
      }
    }

    return { success: true, jugadores: listaCompleta };
  } catch (err) {
    return { success: false, error: 'Error al leer la base de datos: ' + err.message };
  }
}

/**
 * Cambia manualmente el Estado de Pago ('Pagado' / 'Pendiente') de un socio en la fila indicada.
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
    var ss = obtenerSpreadsheetPeña();
    var sheetUsuarios = ss.getSheetByName('Usuarios');
    sheetUsuarios.getRange(filaNum, 7).setValue(estadoNormalizado);

    return {
      success: true,
      fila: filaNum,
      nuevoEstado: estadoNormalizado,
      message: 'Estado de pago actualizado a "' + estadoNormalizado + '".'
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Botón Maestro del Administrador: Evalúa la lista de espera y aprueba el salto
 * al siguiente bloque oficial de apuesta múltiple ([7, 28, 44, 84, 210, 462]).
 */
function aprobarSaltoDeNivelAdmin(password) {
  if (!validarPasswordAdmin(password)) {
    return { success: false, error: 'Acceso no autorizado.' };
  }

  try {
    var ss = obtenerSpreadsheetPeña();
    var sheetUsuarios = ss.getSheetByName('Usuarios');
    if (!sheetUsuarios || sheetUsuarios.getLastRow() < 2) {
      return { success: false, error: 'No existen registros en la hoja Usuarios.' };
    }

    var lastRow = sheetUsuarios.getLastRow();
    var rows = sheetUsuarios.getRange(2, 1, lastRow - 1, 11).getValues();
    var bloquesOficiales = [7, 28, 44, 84, 210, 462];

    var titulares = 0;
    var suplentes = [];

    for (var i = 0; i < rows.length; i++) {
      var estado = String(rows[i][10] || '').trim();
      if (estado === 'Titular') {
        titulares++;
      } else if (estado === 'Suplente') {
        suplentes.push({
          fila: i + 2,
          nombre: (rows[i][1] + ' ' + rows[i][2]).trim()
        });
      }
    }

    var siguienteBloque = null;
    for (var b = 0; b < bloquesOficiales.length; b++) {
      if (bloquesOficiales[b] > titulares) {
        siguienteBloque = bloquesOficiales[b];
        break;
      }
    }

    if (!siguienteBloque) {
      return { success: false, error: 'La peña ya alcanzó el cupo máximo oficial (462 jugadores).' };
    }

    var plazasNecesarias = siguienteBloque - titulares;
    if (suplentes.length < plazasNecesarias) {
      return {
        success: false,
        error: 'Suplentes insuficientes para saltar de ' + titulares + ' a ' + siguienteBloque + ' plazas (hacen falta ' + plazasNecesarias + ' suplentes y hay ' + suplentes.length + ').'
      };
    }

    var ascendidos = [];
    for (var s = 0; s < plazasNecesarias; s++) {
      sheetUsuarios.getRange(suplentes[s].fila, 11).setValue('Titular');
      ascendidos.push(suplentes[s].nombre);
    }

    return {
      success: true,
      nivelAnterior: titulares,
      nuevoNivel: siguienteBloque,
      plazasCubiertas: plazasNecesarias,
      ascendidos: ascendidos,
      message: 'Salto de nivel aprobado: de ' + titulares + ' a ' + siguienteBloque + ' jugadores titulares.'
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ============================================================================
// 5. MÓDULO 5: AUTOMATIZACIÓN DEL AVISO NARANJA DE RENOVACIÓN
// ============================================================================

/**
 * Lee el número de jornada actual en 'Sorteos' y calcula si la peña
 * está dentro de la ventana obligatoria de renovación (jornadas 7, 8 o 9).
 */
function obtenerJornadaActual() {
  try {
    var ss = obtenerSpreadsheetPeña();
    var sheetSorteos = ss.getSheetByName('Sorteos');
    var jornadaActual = 1;

    if (sheetSorteos && sheetSorteos.getLastRow() >= 2) {
      var val = sheetSorteos.getRange(sheetSorteos.getLastRow(), 1).getValue();
      var parsed = parseInt(val, 10);
      if (!isNaN(parsed) && parsed > 0) {
        jornadaActual = parsed;
      }
    }

    var cicloLength = WEBAPP_ADMIN_CONFIG.JORNADAS_POR_CICLO || 10;
    var jornadaEnCiclo = ((jornadaActual - 1) % cicloLength) + 1;
    var cicloActual = Math.floor((jornadaActual - 1) / cicloLength) + 1;
    var esPeriodoRenovacion = (jornadaEnCiclo >= 7 && jornadaEnCiclo <= 9);

    return {
      jornadaActual: jornadaActual,
      jornadaEnCiclo: jornadaEnCiclo,
      cicloActual: cicloActual,
      esPeriodoRenovacion: esPeriodoRenovacion,
      esUltimaJornadaPlazo: (jornadaEnCiclo === 9),
      textoBanner: 'Periodo de Renovación Activo: Jornada ' + jornadaEnCiclo + '/10. Recuerda abonar la cuota de 10€ antes de finalizar la jornada 9.'
    };
  } catch (err) {
    return {
      jornadaActual: 1,
      jornadaEnCiclo: 1,
      cicloActual: 1,
      esPeriodoRenovacion: false,
      esUltimaJornadaPlazo: false,
      textoBanner: ''
    };
  }
}

// ============================================================================
// 6. CARGA CONSOLIDADA DEL DASHBOARD DEL JUGADOR (MÁXIMO ÚLTIMOS 4 BOLETOS)
// ============================================================================

function obtenerDatosDashboard(dniInput) {
  try {
    var ss = obtenerSpreadsheetPeña();
    var sheetTesoreria = ss.getSheetByName('Tesorería');
    var fondoApuestas = 0;
    var bolsaPremios = 0;
    var cicloTesoreria = 'Ciclo 1';

    if (sheetTesoreria && sheetTesoreria.getLastRow() >= 2) {
      var filaT = sheetTesoreria.getRange(2, 1, 1, 4).getValues()[0];
      cicloTesoreria = (filaT[1] || 'Ciclo 1').toString();
      fondoApuestas = parseFloat(filaT[2]) || 0;
      bolsaPremios = parseFloat(filaT[3]) || 0;
    }

    var sheetSorteos = ss.getSheetByName('Sorteos');
    var listaSorteos = [];
    if (sheetSorteos && sheetSorteos.getLastRow() >= 2) {
      var lastRowS = sheetSorteos.getLastRow();
      var datosS = sheetSorteos.getRange(2, 1, lastRowS - 1, 10).getValues();
      var limiteInicio = Math.max(0, datosS.length - 4);
      for (var s = datosS.length - 1; s >= limiteInicio; s--) {
        var filaS = datosS[s];
        var fechaStr = (filaS[1] instanceof Date)
          ? Utilities.formatDate(filaS[1], 'Europe/Madrid', 'dd/MM/yyyy')
          : (filaS[1] || '').toString();

        listaSorteos.push({
          jornada: parseInt(filaS[0], 10) || (s + 1),
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

    var jornadaInfo = obtenerJornadaActual();
    var userData = null;
    if (dniInput) {
      var val = validarLoginDNI(dniInput);
      if (val.success) {
        userData = val.user;
      }
    }

    return {
      success: true,
      data: {
        tesoreria: {
          ciclo: cicloTesoreria,
          fondoApuestas: fondoApuestas,
          bolsaPremios: bolsaPremios
        },
        jornadaInfo: jornadaInfo,
        sorteos: listaSorteos,
        ultimoSorteo: listaSorteos.length > 0 ? listaSorteos[0] : null,
        usuario: userData
      }
    };
  } catch (err) {
    return { success: false, message: 'Error al cargar dashboard: ' + err.message };
  }
}

/**
 * Localiza la hoja de cálculo principal del proyecto
 */
function obtenerSpreadsheetPeña() {
  var id = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
  if (id) {
    try {
      return SpreadsheetApp.openById(id);
    } catch (e) {}
  }

  try {
    var ssActivo = SpreadsheetApp.getActiveSpreadsheet();
    if (ssActivo) return ssActivo;
  } catch (e) {}

  if (WEBAPP_ADMIN_CONFIG.DEFAULT_SPREADSHEET_ID) {
    try {
      return SpreadsheetApp.openById(WEBAPP_ADMIN_CONFIG.DEFAULT_SPREADSHEET_ID);
    } catch (e2) {}
  }

  var files = DriveApp.getFilesByName('Primitiva Tordueles - Base de Datos');
  if (files.hasNext()) {
    return SpreadsheetApp.openById(files.next().getId());
  }

  throw new Error('No se encontró la hoja "Primitiva Tordueles - Base de Datos".');
}
