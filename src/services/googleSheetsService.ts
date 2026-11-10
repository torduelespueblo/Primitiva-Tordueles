/**
 * Servicio para interactuar con la API oficial de Google Sheets v4
 */

import { Player, SyndicateSettings, TicketDraw, WaitingListEntry } from '../types/lottery';

export interface SpreadsheetInfo {
  id: string;
  title: string;
  sheets: { id: number; title: string }[];
  url: string;
}

export const googleSheetsService = {
  /**
   * Obtiene los metadatos de una hoja de cálculo (título y pestañas)
   */
  async getSpreadsheet(accessToken: string, spreadsheetId: string): Promise<SpreadsheetInfo> {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=spreadsheetId,properties.title,sheets.properties(sheetId,title)`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `Error al obtener la hoja de Google Sheets (${res.status})`);
    }

    const data = await res.json();
    return {
      id: data.spreadsheetId,
      title: data.properties?.title || 'Sin Título',
      sheets: (data.sheets || []).map((s: { properties: { sheetId: number; title: string } }) => ({
        id: s.properties.sheetId,
        title: s.properties.title,
      })),
      url: `https://docs.google.com/spreadsheets/d/${data.spreadsheetId}/edit`,
    };
  },

  /**
   * Lee un rango específico de celdas
   */
  async readRange(accessToken: string, spreadsheetId: string, range: string): Promise<string[][]> {
    const encodedRange = encodeURIComponent(range);
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodedRange}`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `Error al leer rango ${range} de Google Sheets`);
    }

    const data = await res.json();
    return data.values || [];
  },

  /**
   * Escribe o sobrescribe un rango específico de celdas
   */
  async writeRange(
    accessToken: string,
    spreadsheetId: string,
    range: string,
    values: (string | number | boolean)[][]
  ): Promise<void> {
    const encodedRange = encodeURIComponent(range);
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodedRange}?valueInputOption=USER_ENTERED`;

    const res = await fetch(url, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        range,
        majorDimension: 'ROWS',
        values,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `Error al escribir en Google Sheets (${res.status})`);
    }
  },

  /**
   * Crea una nueva hoja de cálculo oficial para la peña en Google Drive con las 4 pestañas requeridas
   */
  async createSyndicateSpreadsheet(
    accessToken: string,
    title: string,
    data: {
      settings: SyndicateSettings;
      players: Player[];
      waitingList: WaitingListEntry[];
      tickets: TicketDraw[];
    }
  ): Promise<SpreadsheetInfo> {
    const createUrl = 'https://sheets.googleapis.com/v4/spreadsheets';
    const payload = {
      properties: {
        title: title || 'Peña Primitiva Tordueles - Base de Datos Oficial',
      },
      sheets: [
        { properties: { title: 'Configuracion', tabColor: { red: 0.05, green: 0.15, blue: 0.25 } } },
        { properties: { title: 'Socios_Activos', tabColor: { red: 0.1, green: 0.4, blue: 0.8 } } },
        { properties: { title: 'Lista_Espera_Formulario', tabColor: { red: 0.9, green: 0.6, blue: 0.1 } } },
        { properties: { title: 'Historico_Jornadas', tabColor: { red: 0.1, green: 0.7, blue: 0.4 } } },
      ],
    };

    const res = await fetch(createUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || 'Error al crear la hoja en Google Sheets');
    }

    const created = await res.json();
    const spreadsheetId = created.spreadsheetId;

    // Rellenar las pestañas con los datos iniciales
    await this.exportAllData(accessToken, spreadsheetId, data);

    return {
      id: spreadsheetId,
      title: created.properties?.title || title,
      sheets: (created.sheets || []).map((s: { properties: { sheetId: number; title: string } }) => ({
        id: s.properties.sheetId,
        title: s.properties.title,
      })),
      url: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`,
    };
  },

  /**
   * Exporta todos los datos actuales de la aplicación a las 4 pestañas de Google Sheets
   */
  async exportAllData(
    accessToken: string,
    spreadsheetId: string,
    data: {
      settings: SyndicateSettings;
      players: Player[];
      waitingList: WaitingListEntry[];
      tickets: TicketDraw[];
    }
  ): Promise<void> {
    // 1. Pestaña 'Configuracion'
    const configRows: (string | number)[][] = [
      ['Clave', 'Valor', 'Descripcion'],
      ['CICLO_ACTUAL', data.settings.currentCycle, 'Número de ciclo vigente'],
      ['JORNADA_ACTUAL', data.settings.currentJornada, 'Jornada actual (1 a 10)'],
      ['BOLSA_PREMIOS_MENORES', data.settings.prizeFundBalance, 'Fondo acumulado de premios menores <= 2000€'],
      ['ENVIAR_BOLETIN_DIARIO_GENERAL', data.settings.sendDailyGeneralSummary ? 'SI' : 'NO', 'Boletín diario general'],
      ['ENVIAR_RESGUARDO_2035', data.settings.sendDrawDayTicketAt2035 ? 'SI' : 'NO', 'Envío resguardo a las 20:35h'],
      ['GREEN_API_INSTANCE_ID', data.settings.greenApiInstanceId, 'ID de Instancia Green API'],
      ['GREEN_API_TOKEN', data.settings.greenApiToken, 'Token Green API'],
      ['GREEN_API_CHAT_ID', data.settings.greenApiChatId, 'Chat ID Grupo de WhatsApp'],
      ['ULTIMA_ACTUALIZACION', new Date().toISOString(), 'Fecha y hora de última sincronización'],
    ];

    // 2. Pestaña 'Socios_Activos'
    const sociosRows: (string | number)[][] = [
      [
        'Nº Socio',
        'Nombre Completo',
        'Email',
        'Telefono',
        'Timestamp Registro',
        'Estado (TITULAR/SUPLENTE/BAJA)',
        'Ciclo Pagado',
        'Pagado Hasta Ciclo',
        'Estado Renovacion',
        'Notas',
      ],
      ...data.players.map(p => [
        p.memberNumber,
        p.name,
        p.email,
        p.phone || '',
        p.registrationTimestamp,
        p.status,
        p.currentCyclePaid ? 'SI' : 'NO',
        p.paidUntilCycle,
        p.renewalStatus,
        p.notes || '',
      ]),
    ];

    // 3. Pestaña 'Lista_Espera_Formulario'
    const esperaRows: (string | number)[][] = [
      ['Timestamp Inscripcion', 'Posicion Cola', 'Nombre', 'Email', 'Telefono', 'Fecha Aviso', 'Limite 24h', 'Estado'],
      ...data.waitingList.map((w, idx) => [
        w.registrationTimestamp,
        idx + 1,
        w.name,
        w.email,
        w.phone || '',
        w.notifiedAt || '',
        w.deadline24h || '',
        w.status,
      ]),
    ];

    // 4. Pestaña 'Historico_Jornadas'
    const jornadasRows: (string | number)[][] = [
      [
        'ID Boleto',
        'Ciclo',
        'Jornada',
        'Fecha Sorteo',
        'Tipo Apuesta',
        'Numeros Jugados',
        'Reintegro',
        'Coste (€)',
        'Aciertos',
        'Premio Obtenido (€)',
        'Enlace Resguardo',
      ],
      ...data.tickets.map(t => [
        t.id,
        t.cycleNumber,
        t.jornadaNumber,
        t.drawDate,
        t.betType,
        t.playedNumbers ? t.playedNumbers.join(', ') : '',
        t.playedReintegro !== undefined ? t.playedReintegro : '',
        t.cost,
        t.hitsCount !== undefined ? t.hitsCount : '',
        t.totalPrize !== undefined ? t.totalPrize : 0,
        t.receiptImageUrl || '',
      ]),
    ];

    // Guardar mediante batchUpdate values
    const batchUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`;
    const batchPayload = {
      valueInputOption: 'USER_ENTERED',
      data: [
        { range: 'Configuracion!A1:C20', values: configRows },
        { range: 'Socios_Activos!A1:J150', values: sociosRows },
        { range: 'Lista_Espera_Formulario!A1:G100', values: esperaRows },
        { range: 'Historico_Jornadas!A1:K100', values: jornadasRows },
      ],
    };

    const batchRes = await fetch(batchUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(batchPayload),
    });

    if (!batchRes.ok) {
      const err = await batchRes.json().catch(() => ({}));
      throw new Error(err.error?.message || `Error al exportar datos a Google Sheets (${batchRes.status})`);
    }
  },

  /**
   * Sincroniza y lee los datos actuales desde Google Sheets a la aplicación
   */
  async syncFromSpreadsheet(
    accessToken: string,
    spreadsheetId: string
  ): Promise<{
    settingsPartial: Partial<SyndicateSettings>;
    players?: Player[];
  }> {
    const ranges = encodeURIComponent('Configuracion!A2:C15') + '&ranges=' + encodeURIComponent('Socios_Activos!A2:J100');
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchGet?ranges=${ranges}`;

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || 'Error al leer datos desde Google Sheets');
    }

    const json = await res.json();
    const valueRanges = json.valueRanges || [];

    const configRows: string[][] = valueRanges[0]?.values || [];
    const sociosRows: string[][] = valueRanges[1]?.values || [];

    const settingsPartial: Partial<SyndicateSettings> = {};

    configRows.forEach(row => {
      const key = (row[0] || '').trim();
      const val = (row[1] || '').trim();
      if (key === 'CICLO_ACTUAL') settingsPartial.currentCycle = Number(val) || 1;
      if (key === 'JORNADA_ACTUAL') settingsPartial.currentJornada = Number(val) || 1;
      if (key === 'BOLSA_PREMIOS_MENORES') settingsPartial.prizeFundBalance = Number(val) || 0;
      if (key === 'ENVIAR_BOLETIN_DIARIO_GENERAL') settingsPartial.sendDailyGeneralSummary = val.toUpperCase() === 'SI';
      if (key === 'ENVIAR_RESGUARDO_2035') settingsPartial.sendDrawDayTicketAt2035 = val.toUpperCase() === 'SI';
      if (key === 'GREEN_API_INSTANCE_ID') settingsPartial.greenApiInstanceId = val;
      if (key === 'GREEN_API_TOKEN') settingsPartial.greenApiToken = val;
      if (key === 'GREEN_API_CHAT_ID') settingsPartial.greenApiChatId = val;
    });

    const parsedPlayers: Player[] = [];
    sociosRows.forEach((row, idx) => {
      if (row.length >= 2 && row[1]) {
        const rawStatus = (row[8] || 'PENDIENTE').toUpperCase();
        const validRenewal =
          rawStatus === 'RENOVADO' || rawStatus === 'URGENTE_EXPIRA' || rawStatus === 'EXCLUIDO'
            ? rawStatus
            : 'PENDIENTE';

        parsedPlayers.push({
          id: `sp-${idx + 1}`,
          memberNumber: Number(row[0]) || idx + 1,
          name: row[1],
          email: row[2] || '',
          phone: row[3] || '',
          registrationTimestamp: row[4] || new Date().toISOString(),
          status: (row[5] as 'TITULAR' | 'SUPLENTE' | 'BAJA') || 'TITULAR',
          currentCyclePaid: String(row[6]).toUpperCase() === 'SI' || row[6] === '1',
          paidUntilCycle: Number(row[7]) || 1,
          renewalStatus: validRenewal,
          notes: row[9] || '',
        });
      }
    });

    return {
      settingsPartial,
      players: parsedPlayers.length > 0 ? parsedPlayers : undefined,
    };
  },
};
