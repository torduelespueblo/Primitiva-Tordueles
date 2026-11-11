import { Player, WaitingListEntry, TicketDraw, SyndicateSettings } from '../types/lottery';

const STORAGE_KEYS = {
  SETTINGS: 'primitiva_tordueles_settings',
  PLAYERS: 'primitiva_tordueles_players',
  WAITING_LIST: 'primitiva_tordueles_waiting_list',
  TICKETS: 'primitiva_tordueles_tickets',
  CONFORMITY: 'primitiva_tordueles_conformity_v1',
  ADMIN_PIN: 'primitiva_tordueles_admin_pin',
  PUSH_TOKEN: 'primitiva_tordueles_push_token',
};

const DEFAULT_SETTINGS: SyndicateSettings = {
  syndicateName: 'Peña Primitiva Tordueles',
  weeklyFee: 1.0,
  cycleLength: 10,
  currentCycle: 3,
  currentJornada: 8, // En pleno periodo de renovación (Jornadas 7 a 9)
  prizeFundBalance: 384.50,
  googleFormUrl: 'https://docs.google.com/forms/d/e/1FAIpQLSc_TorduelesLoteriaRegistro/viewform',
  googleAppsScriptUrl: 'https://script.google.com/macros/s/AKfycbxFolqBPLovSHOHM0ST-bBtyzlCzTG64ZmzNvNSaDgawIT6MP1RXwg9BhE2ZKJt_weJCw/exec',
  googleSheetUrl: 'https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit',
  greenApiInstanceId: '710722795241',
  greenApiToken: 'a1c3c85f04d34a21ae86403c9ebdbdb54854f9d5f94842a1b3',
  greenApiChatId: '120363430888892480@g.us', // Grupo de WhatsApp de la Peña
  sendDailyGeneralSummary: false, // Interruptor SÍ/NO resumen general
  sendDrawDayTicketAt2035: true, // Envío automático a las 20:35
  sendScrutinyAlert: true,
  pushEnabled: true,
};

// Generación de jugadores realistas de Tordueles
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
    paidUntilCycle: 4,
    renewalStatus: 'RENOVADO',
    notes: 'Socio fundador',
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
    paidUntilCycle: 4,
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
    paidUntilCycle: 3,
    renewalStatus: 'PENDIENTE',
    notes: 'Avisado por WhatsApp jornada 8',
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
    paidUntilCycle: 4,
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
    paidUntilCycle: 3,
    renewalStatus: 'PENDIENTE',
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
    paidUntilCycle: 4,
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
    paidUntilCycle: 3,
    renewalStatus: 'URGENTE_EXPIRA',
    notes: 'Plazo límite fin de jornada 9',
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
    paidUntilCycle: 4,
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
    paidUntilCycle: 4,
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
    paidUntilCycle: 4,
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
    paidUntilCycle: 4,
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
    paidUntilCycle: 3,
    renewalStatus: 'PENDIENTE',
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
    paidUntilCycle: 4,
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
    paidUntilCycle: 4,
    renewalStatus: 'RENOVADO',
  },
  // Jugador con baja definitiva por no pagar
  {
    id: 'p-99',
    memberNumber: 0,
    name: 'Ignacio Vega Delgado',
    email: 'ignacio.vega@gmail.com',
    phone: '+34 690 99 88 77',
    registrationTimestamp: '2024-01-08T09:12:00Z',
    status: 'BAJA',
    currentCyclePaid: false,
    paidUntilCycle: 2,
    renewalStatus: 'EXCLUIDO',
    notes: 'Excluido en Ciclo 2 tras finalizar jornada 10 sin abono. Pierde antigüedad.',
  },
];

// Lista de espera por estricto orden de timestamp de Google Form
const INITIAL_WAITING_LIST: WaitingListEntry[] = [
  {
    id: 'w-01',
    name: 'Ignacio Román Delgado',
    email: 'ignacio.roman@gmail.com',
    phone: '+34 671 22 33 44',
    registrationTimestamp: '2024-02-14T11:22:15.34Z',
    notifiedAt: '2026-11-10T08:00:00.00Z',
    deadline24h: '2026-11-11T08:00:00.00Z',
    status: 'NOTIFICADO_24H',
  },
  {
    id: 'w-02',
    name: 'Sonia Barbero Casado',
    email: 'sonia.barbero@gmail.com',
    phone: '+34 682 33 44 55',
    registrationTimestamp: '2024-02-18T16:45:00.82Z',
    status: 'ESPERANDO',
  },
  {
    id: 'w-03',
    name: 'Carlos Andrés Mahamud',
    email: 'carlos.andres@gmail.com',
    phone: '+34 693 44 55 66',
    registrationTimestamp: '2024-03-01T09:10:33.19Z',
    status: 'ESPERANDO',
  },
  {
    id: 'w-04',
    name: 'Teresa Santillán Moral',
    email: 'teresa.smoral@gmail.com',
    phone: '+34 614 55 66 77',
    registrationTimestamp: '2024-03-12T19:05:42.67Z',
    status: 'ESPERANDO',
  },
];

// Historial de resguardos sellados y escrutinios
const INITIAL_TICKETS: TicketDraw[] = [
  {
    id: 't-08',
    cycleNumber: 3,
    jornadaNumber: 8,
    drawDate: '2026-11-12',
    receiptImageUrl: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?auto=format&fit=crop&w=800&q=80',
    betType: 'MULTIPLE_5',
    numbersPlayedCount: 5,
    cost: 44.0, // 44 personas = 44€ apuesta múltiple de 5 números (44 apuestas)
    activePlayersCount: 44,
    costPerPlayer: 1.0,
    playedNumbers: [7, 13, 22, 34, 49],
    playedReintegro: 4,
    jokerPlayed: true,
    isScrutinized: false, // Jornada en juego pendiente de sorteo a las 21:40
    totalPrize: 0,
    prizeType: 'NINGUNO',
  },
  {
    id: 't-07',
    cycleNumber: 3,
    jornadaNumber: 7,
    drawDate: '2026-11-07',
    receiptImageUrl: 'https://images.unsplash.com/photo-1588702547923-7093a6c3ba33?auto=format&fit=crop&w=800&q=80',
    betType: 'MULTIPLE_5',
    numbersPlayedCount: 5,
    cost: 44.0,
    activePlayersCount: 44,
    costPerPlayer: 1.0,
    playedNumbers: [3, 11, 24, 38, 41],
    playedReintegro: 7,
    jokerPlayed: true,
    isScrutinized: true,
    winningNumbers: [3, 11, 24, 33, 41, 48],
    complementario: 19,
    reintegro: 7,
    jokerNumber: '7412890',
    hitsCount: 4,
    hasReintegro: true,
    prizeCategory: '4 Aciertos + Reintegro',
    totalPrize: 98.40,
    prizeType: 'MENOR_BOLSA',
  },
  {
    id: 't-06',
    cycleNumber: 3,
    jornadaNumber: 6,
    drawDate: '2026-11-05',
    receiptImageUrl: 'https://images.unsplash.com/photo-1588702547923-7093a6c3ba33?auto=format&fit=crop&w=800&q=80',
    betType: 'MULTIPLE_5',
    numbersPlayedCount: 5,
    cost: 44.0,
    activePlayersCount: 44,
    costPerPlayer: 1.0,
    playedNumbers: [5, 14, 23, 37, 44],
    playedReintegro: 2,
    jokerPlayed: true,
    isScrutinized: true,
    winningNumbers: [5, 14, 20, 29, 36, 47],
    complementario: 44,
    reintegro: 9,
    hitsCount: 2,
    hasReintegro: false,
    prizeCategory: 'Sin premio oficial (2 aciertos)',
    totalPrize: 0,
    prizeType: 'NINGUNO',
  },
  {
    id: 't-05',
    cycleNumber: 3,
    jornadaNumber: 5,
    drawDate: '2026-10-31',
    receiptImageUrl: 'https://images.unsplash.com/photo-1588702547923-7093a6c3ba33?auto=format&fit=crop&w=800&q=80',
    betType: 'MULTIPLE_5',
    numbersPlayedCount: 5,
    cost: 44.0,
    activePlayersCount: 44,
    costPerPlayer: 1.0,
    playedNumbers: [8, 17, 26, 35, 42],
    playedReintegro: 5,
    jokerPlayed: true,
    isScrutinized: true,
    winningNumbers: [8, 17, 26, 31, 39, 45],
    complementario: 35,
    reintegro: 5,
    hitsCount: 3,
    hasReintegro: true,
    prizeCategory: '3 Aciertos + Reintegro (5ª Cat)',
    totalPrize: 42.60,
    prizeType: 'MENOR_BOLSA',
  },
];

export const storageService = {
  getSettings(): SyndicateSettings {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
      return DEFAULT_SETTINGS;
    }
    try {
      const parsed = JSON.parse(raw);
      // Actualizar automáticamente a las credenciales oficiales de Green API proporcionadas por el usuario
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
    const raw = localStorage.getItem(STORAGE_KEYS.TICKETS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.TICKETS, JSON.stringify(INITIAL_TICKETS));
      return INITIAL_TICKETS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_TICKETS;
    }
  },

  saveTickets(tickets: TicketDraw[]): void {
    localStorage.setItem(STORAGE_KEYS.TICKETS, JSON.stringify(tickets));
  },

  isConformityAccepted(): boolean {
    return localStorage.getItem(STORAGE_KEYS.CONFORMITY) === 'true';
  },

  setConformityAccepted(accepted: boolean): void {
    localStorage.setItem(STORAGE_KEYS.CONFORMITY, accepted ? 'true' : 'false');
  },

  getAdminPin(): string {
    return localStorage.getItem(STORAGE_KEYS.ADMIN_PIN) || '1234';
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
