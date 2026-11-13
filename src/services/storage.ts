import { Player, WaitingListEntry, TicketDraw, SyndicateSettings, PrizeHistoryEntry } from '../types/lottery';

const STORAGE_KEYS = {
  SETTINGS: 'primitiva_tordueles_settings',
  PLAYERS: 'primitiva_tordueles_players',
  WAITING_LIST: 'primitiva_tordueles_waiting_list',
  TICKETS: 'primitiva_tordueles_tickets',
  PRIZE_HISTORY: 'primitiva_tordueles_prize_history',
  CONFORMITY: 'primitiva_tordueles_conformity_v1',
  ADMIN_PIN: 'primitiva_tordueles_admin_pin',
  PUSH_TOKEN: 'primitiva_tordueles_push_token',
  CLEAN_VERSION: 'primitiva_tordueles_clean_v3',
};

export const MAX_STORED_TICKETS = 4;

export function capTicketsKeepingPlayed(tickets: TicketDraw[]): TicketDraw[] {
  const pending = tickets.filter(t => !t.isScrutinized);
  const played = tickets.filter(t => t.isScrutinized).slice(0, MAX_STORED_TICKETS);
  return [...pending, ...played];
}

const DELETED_MOCK_TICKET_IDS = new Set(['t-08', 't-07', 't-06', 't-05']);

const DEFAULT_SETTINGS: SyndicateSettings = {
  syndicateName: 'Peña Primitiva Tordueles',
  weeklyFee: 1.0,
  cycleLength: 10,
  currentCycle: 1,
  currentJornada: 1,
  prizeFundBalance: 0,
  googleFormUrl: '',
  googleAppsScriptUrl: 'https://script.google.com/macros/s/AKfycbxFolqBPLovSHOHM0ST-bBtyzlCzTG64ZmzNvNSaDgawIT6MP1RXwg9BhE2ZKJt_weJCw/exec',
  googleSheetUrl: 'https://docs.google.com/spreadsheets/d/18R_F67pOt4pYBD5VqzBln12H-VMxUx-qmoeCewwz8qw/edit',
  greenApiInstanceId: '710722795241',
  greenApiToken: 'a1c3c85f04d34a21ae86403c9ebdbdb54854f9d5f94842a1b3',
  greenApiChatId: '120363430888892480@g.us',
  sendDailyGeneralSummary: true,
  sendDrawDayTicketAt2035: true,
  sendScrutinyAlert: true,
  pushEnabled: true,
};

// Sin jugadores simulados ni nombres hardcodeados: se consume estrictamente la pestaña "Usuarios" del backend
const INITIAL_PLAYERS: Player[] = [];

const INITIAL_WAITING_LIST: WaitingListEntry[] = [];

// Sin sorteos ni premios simulados; máximo 4 boletos guardados
const INITIAL_TICKETS: TicketDraw[] = [];

const DELETED_MOCK_PLAYER_IDS = new Set([
  'p-01', 'p-02', 'p-03', 'p-04', 'p-05', 'p-06', 'p-07',
  'p-08', 'p-09', 'p-10', 'p-11', 'p-12', 'p-13', 'p-14'
]);

function runCleanMigrationIfNeeded() {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
  if (localStorage.getItem(STORAGE_KEYS.CLEAN_VERSION) === 'true') return;

  try {
    const rawSettings = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (rawSettings) {
      const parsed = JSON.parse(rawSettings);
      if (parsed.prizeFundBalance === 384.5) {
        parsed.prizeFundBalance = 0;
      }
      if (
        typeof parsed.googleFormUrl === 'string' &&
        parsed.googleFormUrl.includes('1FAIpQLSc_TorduelesLoteriaRegistro')
      ) {
        parsed.googleFormUrl = '';
      }
      if (
        typeof parsed.googleSheetUrl === 'string' &&
        parsed.googleSheetUrl.includes('1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms')
      ) {
        parsed.googleSheetUrl = DEFAULT_SETTINGS.googleSheetUrl;
      }
      parsed.sendDailyGeneralSummary = true;
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify({ ...DEFAULT_SETTINGS, ...parsed }));
    }

    const rawTickets = localStorage.getItem(STORAGE_KEYS.TICKETS);
    if (rawTickets) {
      const parsedTickets: TicketDraw[] = JSON.parse(rawTickets);
      if (Array.isArray(parsedTickets)) {
        const realOnly = parsedTickets
          .filter(t => !DELETED_MOCK_TICKET_IDS.has(t.id))
          .slice(0, MAX_STORED_TICKETS);
        localStorage.setItem(STORAGE_KEYS.TICKETS, JSON.stringify(realOnly));
      }
    }

    const rawPlayers = localStorage.getItem(STORAGE_KEYS.PLAYERS);
    if (rawPlayers) {
      const parsedPlayers: Player[] = JSON.parse(rawPlayers);
      if (Array.isArray(parsedPlayers)) {
        const realPlayers = parsedPlayers.filter(
          p => !DELETED_MOCK_PLAYER_IDS.has(p.id) && p.name !== 'José Antonio Martínez Peña'
        );
        localStorage.setItem(STORAGE_KEYS.PLAYERS, JSON.stringify(realPlayers));
      }
    }

    localStorage.setItem(STORAGE_KEYS.CLEAN_VERSION, 'true');
  } catch {
    // Ignorar error de parseo
  }
}

export const storageService = {
  getSettings(): SyndicateSettings {
    runCleanMigrationIfNeeded();
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
      return DEFAULT_SETTINGS;
    }
    try {
      const parsed = JSON.parse(raw);
      let needsUpdate = false;
      if (!parsed.greenApiInstanceId || parsed.greenApiInstanceId === '7103859201') {
        parsed.greenApiInstanceId = DEFAULT_SETTINGS.greenApiInstanceId;
        parsed.greenApiToken = DEFAULT_SETTINGS.greenApiToken;
        parsed.greenApiChatId = DEFAULT_SETTINGS.greenApiChatId;
        needsUpdate = true;
      }
      if (!parsed.googleAppsScriptUrl || parsed.googleAppsScriptUrl.endsWith('/exe')) {
        parsed.googleAppsScriptUrl = DEFAULT_SETTINGS.googleAppsScriptUrl;
        needsUpdate = true;
      }
      if (
        typeof parsed.googleFormUrl === 'string' &&
        parsed.googleFormUrl.includes('1FAIpQLSc_TorduelesLoteriaRegistro')
      ) {
        parsed.googleFormUrl = '';
        needsUpdate = true;
      }
      if (needsUpdate) {
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify({ ...DEFAULT_SETTINGS, ...parsed }));
      }
      return { ...DEFAULT_SETTINGS, ...parsed };
    } catch {
      return DEFAULT_SETTINGS;
    }
  },

  saveSettings(settings: SyndicateSettings): void {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  },

  getPlayers(): Player[] {
    runCleanMigrationIfNeeded();
    const raw = localStorage.getItem(STORAGE_KEYS.PLAYERS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.PLAYERS, JSON.stringify(INITIAL_PLAYERS));
      return INITIAL_PLAYERS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_PLAYERS;
    }
  },

  savePlayers(players: Player[]): void {
    localStorage.setItem(STORAGE_KEYS.PLAYERS, JSON.stringify(players));
  },

  getWaitingList(): WaitingListEntry[] {
    runCleanMigrationIfNeeded();
    const raw = localStorage.getItem(STORAGE_KEYS.WAITING_LIST);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.WAITING_LIST, JSON.stringify(INITIAL_WAITING_LIST));
      return INITIAL_WAITING_LIST;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_WAITING_LIST;
    }
  },

  saveWaitingList(list: WaitingListEntry[]): void {
    localStorage.setItem(STORAGE_KEYS.WAITING_LIST, JSON.stringify(list));
  },

  getTickets(): TicketDraw[] {
    runCleanMigrationIfNeeded();
    const raw = localStorage.getItem(STORAGE_KEYS.TICKETS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.TICKETS, JSON.stringify(INITIAL_TICKETS));
      return INITIAL_TICKETS;
    }
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? capTicketsKeepingPlayed(parsed) : INITIAL_TICKETS;
    } catch {
      return INITIAL_TICKETS;
    }
  },

  saveTickets(tickets: TicketDraw[]): void {
    const capped = capTicketsKeepingPlayed(tickets);
    localStorage.setItem(STORAGE_KEYS.TICKETS, JSON.stringify(capped));
  },

  getPrizeHistory(): PrizeHistoryEntry[] {
    runCleanMigrationIfNeeded();
    let stored: PrizeHistoryEntry[] = [];
    const raw = localStorage.getItem(STORAGE_KEYS.PRIZE_HISTORY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          stored = parsed;
        }
      } catch {
        stored = [];
      }
    }

    // Sincronizar automáticamente boletos ya escrutados con premio que no estuvieran en el histórico
    const existingTicketIds = new Set(stored.map(e => e.ticketId));
    const currentTickets = this.getTickets();
    let added = false;
    for (const t of currentTickets) {
      if (t.isScrutinized && (t.totalPrize || 0) > 0 && !existingTicketIds.has(t.id)) {
        stored.push({
          id: `prize-${t.id}`,
          ticketId: t.id,
          cycleNumber: t.cycleNumber,
          jornadaNumber: t.jornadaNumber,
          drawDate: t.drawDate,
          hitsCount: t.hitsCount ?? 0,
          hasReintegro: Boolean(t.hasReintegro),
          prizeCategory: t.prizeCategory || 'Premio SELAE',
          prizeAmount: t.totalPrize,
          prizeType: t.totalPrize > 2000 ? 'MAYOR_BANCO' : 'MENOR_BOLSA',
        });
        existingTicketIds.add(t.id);
        added = true;
      }
    }

    if (added) {
      localStorage.setItem(STORAGE_KEYS.PRIZE_HISTORY, JSON.stringify(stored));
    }

    return stored;
  },

  savePrizeHistory(entries: PrizeHistoryEntry[]): void {
    localStorage.setItem(STORAGE_KEYS.PRIZE_HISTORY, JSON.stringify(entries));
  },

  isConformityAccepted(): boolean {
    return localStorage.getItem(STORAGE_KEYS.CONFORMITY) === 'true';
  },

  setConformityAccepted(accepted: boolean): void {
    localStorage.setItem(STORAGE_KEYS.CONFORMITY, accepted ? 'true' : 'false');
  },

  getAdminPin(): string {
    const saved = localStorage.getItem(STORAGE_KEYS.ADMIN_PIN);
    if (!saved || saved === '1234') {
      localStorage.setItem(STORAGE_KEYS.ADMIN_PIN, '230696');
      return '230696';
    }
    return saved;
  },

  setAdminPin(pin: string): void {
    localStorage.setItem(STORAGE_KEYS.ADMIN_PIN, pin);
  },

  getPushToken(): string | null {
    return localStorage.getItem(STORAGE_KEYS.PUSH_TOKEN);
  },

  savePushToken(token: string): void {
    localStorage.setItem(STORAGE_KEYS.PUSH_TOKEN, token);
  },

  resetToDefaults(): void {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
    localStorage.setItem(STORAGE_KEYS.PLAYERS, JSON.stringify(INITIAL_PLAYERS));
    localStorage.setItem(STORAGE_KEYS.WAITING_LIST, JSON.stringify(INITIAL_WAITING_LIST));
    localStorage.setItem(STORAGE_KEYS.TICKETS, JSON.stringify(INITIAL_TICKETS));
    localStorage.removeItem(STORAGE_KEYS.PUSH_TOKEN);
  },
};
