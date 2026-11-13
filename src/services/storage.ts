import { Player, WaitingListEntry, TicketDraw, SyndicateSettings } from '../types/lottery';

const STORAGE_KEYS = {
  SETTINGS: 'primitiva_tordueles_settings',
  PLAYERS: 'primitiva_tordueles_players',
  WAITING_LIST: 'primitiva_tordueles_waiting_list',
  TICKETS: 'primitiva_tordueles_tickets',
  CONFORMITY: 'primitiva_tordueles_conformity_v1',
  ADMIN_PIN: 'primitiva_tordueles_admin_pin',
  PUSH_TOKEN: 'primitiva_tordueles_push_token',
  CLEAN_VERSION: 'primitiva_tordueles_clean_v2',
};

export const MAX_STORED_TICKETS = 4;

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

// Base inicial de socios titulares (sin sorteos simulados ni premios acumulados ficticios)
const INITIAL_PLAYERS: Player[] = [
  {
    id: 'p-01',
    memberNumber: 1,
    name: 'José Antonio Martínez Peña',
    email: 'jantonio.mp@gmail.com',
    phone: '+34 612 34 56 01',
    registrationTimestamp: '2024-01-10T10:14:22.18Z',
    status: 'TITULAR',
    currentCyclePaid: true,
    paidUntilCycle: 1,
    renewalStatus: 'RENOVADO',
  },
  {
    id: 'p-02',
    memberNumber: 2,
    name: 'María Carmen Gómez Arroyo',
    email: 'mcarmen.gomez@gmail.com',
    phone: '+34 620 45 67 02',
    registrationTimestamp: '2024-01-10T10:15:04.45Z',
    status: 'TITULAR',
    currentCyclePaid: true,
    paidUntilCycle: 1,
    renewalStatus: 'RENOVADO',
  },
  {
    id: 'p-03',
    memberNumber: 3,
    name: 'Francisco Javier Tordueles Díez',
    email: 'fjavier.td@gmail.com',
    phone: '+34 633 56 78 03',
    registrationTimestamp: '2024-01-10T10:16:30.73Z',
    status: 'TITULAR',
    currentCyclePaid: true,
    paidUntilCycle: 1,
    renewalStatus: 'RENOVADO',
  },
  {
    id: 'p-04',
    memberNumber: 4,
    name: 'Lucía Santamaría Barbero',
    email: 'lucia.stmaria@gmail.com',
    phone: '+34 644 67 89 04',
    registrationTimestamp: '2024-01-10T10:18:15.91Z',
    status: 'TITULAR',
    currentCyclePaid: true,
    paidUntilCycle: 1,
    renewalStatus: 'RENOVADO',
  },
  {
    id: 'p-05',
    memberNumber: 5,
    name: 'David Rodrigo Alonso',
    email: 'david.rodrigo@gmail.com',
    phone: '+34 655 78 90 05',
    registrationTimestamp: '2024-01-10T10:20:00Z',
    status: 'TITULAR',
    currentCyclePaid: true,
    paidUntilCycle: 1,
    renewalStatus: 'RENOVADO',
  },
  {
    id: 'p-06',
    memberNumber: 6,
    name: 'Elena Nebreda Arribas',
    email: 'elena.nebreda@gmail.com',
    phone: '+34 666 89 01 06',
    registrationTimestamp: '2024-01-10T10:22:45Z',
    status: 'TITULAR',
    currentCyclePaid: true,
    paidUntilCycle: 1,
    renewalStatus: 'RENOVADO',
  },
  {
    id: 'p-07',
    memberNumber: 7,
    name: 'Manuel Castrillo Pineda',
    email: 'manuel.castrillo@gmail.com',
    phone: '+34 677 90 12 07',
    registrationTimestamp: '2024-01-10T10:25:12Z',
    status: 'TITULAR',
    currentCyclePaid: true,
    paidUntilCycle: 1,
    renewalStatus: 'RENOVADO',
  },
  {
    id: 'p-08',
    memberNumber: 8,
    name: 'Sara Calvo Fuente',
    email: 'sara.calvof@gmail.com',
    phone: '+34 688 01 23 08',
    registrationTimestamp: '2024-01-10T10:27:03Z',
    status: 'TITULAR',
    currentCyclePaid: true,
    paidUntilCycle: 1,
    renewalStatus: 'RENOVADO',
  },
  {
    id: 'p-09',
    memberNumber: 9,
    name: 'Pablo Herrero Vicario',
    email: 'pablo.herrero@gmail.com',
    phone: '+34 699 12 34 09',
    registrationTimestamp: '2024-01-10T10:30:19Z',
    status: 'TITULAR',
    currentCyclePaid: true,
    paidUntilCycle: 1,
    renewalStatus: 'RENOVADO',
  },
  {
    id: 'p-10',
    memberNumber: 10,
    name: 'Beatriz Alonso Moral',
    email: 'beatriz.amoral@gmail.com',
    phone: '+34 610 23 45 10',
    registrationTimestamp: '2024-01-10T10:32:50Z',
    status: 'TITULAR',
    currentCyclePaid: true,
    paidUntilCycle: 1,
    renewalStatus: 'RENOVADO',
  },
  {
    id: 'p-11',
    memberNumber: 11,
    name: 'Santiago Miguel Lerma',
    email: 'santiago.lerma@gmail.com',
    phone: '+34 621 34 56 11',
    registrationTimestamp: '2024-01-10T10:35:14Z',
    status: 'TITULAR',
    currentCyclePaid: true,
    paidUntilCycle: 1,
    renewalStatus: 'RENOVADO',
  },
  {
    id: 'p-12',
    memberNumber: 12,
    name: 'Patricia Pascual Sanz',
    email: 'patricia.pascual@gmail.com',
    phone: '+34 632 45 67 12',
    registrationTimestamp: '2024-01-10T10:37:41Z',
    status: 'TITULAR',
    currentCyclePaid: true,
    paidUntilCycle: 1,
    renewalStatus: 'RENOVADO',
  },
  {
    id: 'p-13',
    memberNumber: 13,
    name: 'Raúl Gutiérrez Blanco',
    email: 'raul.gblanco@gmail.com',
    phone: '+34 643 56 78 13',
    registrationTimestamp: '2024-01-10T10:40:02Z',
    status: 'TITULAR',
    currentCyclePaid: true,
    paidUntilCycle: 1,
    renewalStatus: 'RENOVADO',
  },
  {
    id: 'p-14',
    memberNumber: 14,
    name: 'Ángel Luis Tordueles Ruiz',
    email: 'angelluis.tr@gmail.com',
    phone: '+34 654 67 89 14',
    registrationTimestamp: '2024-01-10T10:42:19Z',
    status: 'TITULAR',
    currentCyclePaid: true,
    paidUntilCycle: 1,
    renewalStatus: 'RENOVADO',
  },
];

const INITIAL_WAITING_LIST: WaitingListEntry[] = [];

// Sin sorteos ni premios simulados; máximo 4 boletos guardados
const INITIAL_TICKETS: TicketDraw[] = [];

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
      return Array.isArray(parsed) ? parsed.slice(0, MAX_STORED_TICKETS) : INITIAL_TICKETS;
    } catch {
      return INITIAL_TICKETS;
    }
  },

  saveTickets(tickets: TicketDraw[]): void {
    const capped = tickets.slice(0, MAX_STORED_TICKETS);
    localStorage.setItem(STORAGE_KEYS.TICKETS, JSON.stringify(capped));
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
