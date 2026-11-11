/**
 * Servicio para interactuar con la API oficial de Google Sheets v4
 * Compatible con la estructura estándar técnica:
 * - 'Usuarios'
 * - 'Sorteos'
 * - 'Tesorería'
 * - 'Configuracion'
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
   * Crea una nueva hoja de cálculo oficial con las 4 pestañas requeridas
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
        title: title || 'Primitiva Tordueles - Base de Datos',
      },
      sheets: [
        { properties: { title: 'Usuarios', tabColor: { red: 0.04, green: 0.15, blue: 0.25 } } },
        { properties: { title: 'Sorteos', tabColor: { red: 0.1, green: 0.4, blue: 0.8 } } },
        { properties: { title: 'Tesorería', tabColor: { red: 0.9, green: 0.6, blue: 0.1 } } },
        { properties: { title: 'Configuracion', tabColor: { red: 0.1, green: 0.7, blue: 0.4 } } },
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

    // Rellenar las pestañas con los datos iniciales y fórmulas
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
   * Exporta todos los datos actuales a las pestañas de Google Sheets respetando fórmulas
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
    // 1. Pestaña 'Usuarios'
    const usuariosRows: (string | number | boolean)[][] = [
      [
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
        'Estado',
      ],
      ...data.players.map((p, idx) => {
        const parts = p.name.trim().split(' ');
        const nombre = parts[0] || p.name;
        const apellidos = parts.slice(1).join(' ') || '';
        const filaNum = idx + 2;
        const estadoLabel = p.status === 'TITULAR' ? 'Titular' : p.status === 'SUPLENTE' ? 'Suplente' : 'Baja';
        const pagoLabel = p.currentCyclePaid ? 'Pagado' : 'Pendiente';
        return [
          p.registrationTimestamp,
          nombre,
          apellidos,
          '', // DNI
          p.phone || '',
          '', // IBAN
          pagoLabel,
          data.settings.currentCycle,
          true,
          `=IF(K${filaNum}="Titular", 1 / COUNTIF($K$2:$K, "Titular"), 0)`,
          estadoLabel,
        ];
      }),
    ];

    // 2. Pestaña 'Sorteos'
    const sorteosRows: (string | number)[][] = [
      [
        'Jornada',
        'Fecha',
        'Resguardo',
        'Foto Resguardo',
        'Importe Jugado',
        'Combinación Jugada',
        'Combinación Ganadora',
        'Aciertos',
        'Cantidad Premiada',
        'Premio Menor',
      ],
      ...data.tickets.map((t, idx) => {
        const filaNum = idx + 2;
        return [
          t.jornadaNumber,
          t.drawDate,
          `SELAE-${t.id}`,
          t.receiptImageUrl || '',
          t.cost,
          t.playedNumbers ? t.playedNumbers.join(', ') : '',
          t.winningNumbers ? t.winningNumbers.join(', ') : '',
          t.hitsCount !== undefined ? t.hitsCount : '',
          t.totalPrize !== undefined ? t.totalPrize : 0,
          `=IF(I${filaNum}<=2000, I${filaNum}, 0)`,
        ];
      }),
    ];

    // 3. Pestaña 'Tesorería'
    const tesoreriaRows: (string | number)[][] = [
      ['ID', 'Ciclo', 'Fondo de Apuestas', 'Bolsa de Premios'],
      [
        1,
        `Ciclo ${data.settings.currentCycle}`,
        '=SUM(Usuarios!H:H)*10 - SUM(Sorteos!E:E)',
        '=SUM(Sorteos!J:J)',
      ],
    ];

    // 4. Pestaña 'Configuracion'
    const configuracionRows: (string | number)[][] = [
      ['ModoResumen', 'NotificarTodos'],
      [data.settings.sendDailyGeneralSummary ? 'SÍ' : 'NO', 'NO'],
    ];

    const batchUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`;
    const batchPayload = {
      valueInputOption: 'USER_ENTERED',
      data: [
        { range: 'Usuarios!A1:K150', values: usuariosRows },
        { range: 'Sorteos!A1:J100', values: sorteosRows },
        { range: 'Tesorería!A1:D2', values: tesoreriaRows },
        { range: 'Configuracion!A1:B2', values: configuracionRows },
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
    // Consultar pestañas 'Usuarios', 'Tesorería', 'Configuracion'
    const ranges = [
      encodeURIComponent('Usuarios!A2:K100'),
      encodeURIComponent('Tesorería!C2:D2'),
      encodeURIComponent('Configuracion!A2:B2'),
    ].join('&ranges=');

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

    const usuariosRows: string[][] = valueRanges[0]?.values || [];
    const tesoreriaRows: string[][] = valueRanges[1]?.values || [];
    const configRows: string[][] = valueRanges[2]?.values || [];

    const settingsPartial: Partial<SyndicateSettings> = {};

    // 1. Configuración
    if (configRows.length > 0 && configRows[0].length >= 1) {
      const modoResumen = (configRows[0][0] || '').toString().trim().toUpperCase();
      settingsPartial.sendDailyGeneralSummary = modoResumen === 'SÍ' || modoResumen === 'SI';
    }

    // 2. Tesorería
    if (tesoreriaRows.length > 0 && tesoreriaRows[0].length >= 2) {
      const bolsaRaw = tesoreriaRows[0][1];
      if (bolsaRaw !== undefined && bolsaRaw !== '') {
        const cleaned = String(bolsaRaw).replace(/[^\d.,-]/g, '').replace(',', '.');
        const num = parseFloat(cleaned);
        if (!isNaN(num)) {
          settingsPartial.prizeFundBalance = num;
        }
      }
    }

    // 3. Usuarios
    const parsedPlayers: Player[] = [];
    usuariosRows.forEach((row, idx) => {
      if (row.length >= 2 && row[1]) {
        const nombre = (row[1] || '').trim();
        const apellidos = (row[2] || '').trim();
        const fullName = apellidos ? `${nombre} ${apellidos}` : nombre;
        const estadoRaw = (row[10] || 'Titular').trim().toUpperCase();
        const status: 'TITULAR' | 'SUPLENTE' | 'BAJA' =
          estadoRaw === 'TITULAR' ? 'TITULAR' : estadoRaw === 'SUPLENTE' ? 'SUPLENTE' : 'BAJA';
        const pagoRaw = (row[6] || 'Pagado').trim().toUpperCase();
        const isPaid = pagoRaw === 'PAGADO' || pagoRaw === 'SI';
        const cicloActual = Number(row[7]) || 1;

        parsedPlayers.push({
          id: `sp-${idx + 1}`,
          memberNumber: idx + 1,
          name: fullName,
          email: `${nombre.toLowerCase().replace(/\s+/g, '')}@example.com`,
          phone: row[4] || '',
          registrationTimestamp: row[0] || new Date().toISOString(),
          status,
          currentCyclePaid: isPaid,
          paidUntilCycle: cicloActual,
          renewalStatus: isPaid ? 'RENOVADO' : 'PENDIENTE',
          notes: row[3] ? `DNI: ${row[3]}` : '',
        });
      }
    });

    return {
      settingsPartial,
      players: parsedPlayers.length > 0 ? parsedPlayers : undefined,
    };
  },
};
