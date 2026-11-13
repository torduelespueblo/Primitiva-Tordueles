export type PlayerStatus = 'TITULAR' | 'SUPLENTE' | 'BAJA';

export interface Player {
  id: string;
  memberNumber: number; // Número de socio
  name: string;
  email: string;
  phone: string;
  dni?: string; // DNI/NIF opcional para autenticación o cobro de premios mayores
  registrationTimestamp: string; // Timestamp inalterable de inscripción (Google Form)
  status: PlayerStatus;
  currentCyclePaid: boolean; // Si ha pagado el ciclo actual de 10 jornadas
  paidUntilCycle: number; // Ciclo hasta el cual tiene cubierto el pago
  renewalStatus: 'RENOVADO' | 'PENDIENTE' | 'URGENTE_EXPIRA' | 'EXCLUIDO';
  notes?: string;
}

export interface WaitingListEntry {
  id: string;
  name: string;
  email: string;
  phone: string;
  registrationTimestamp: string; // Timestamp de inscripción del Formulario
  notifiedAt?: string; // Fecha en que se le avisó de vacante
  deadline24h?: string; // Límite exacto de 24 horas para abonar las 10 jornadas
  status: 'ESPERANDO' | 'NOTIFICADO_24H' | 'ADMITIDO' | 'RECHAZADO_EXPIRADO';
}

export type MultipleBetType = 'MULTIPLE_5' | 'MULTIPLE_7' | 'MULTIPLE_8' | 'MULTIPLE_9' | 'MULTIPLE_10' | 'COMBINADA';

export interface TicketDraw {
  id: string;
  cycleNumber: number; // Ej. Ciclo 12
  jornadaNumber: number; // Jornada 1 a 10 dentro del ciclo
  drawDate: string; // Ej. '2026-11-12' (Jueves / Sábado)
  receiptImageUrl: string; // Foto del resguardo sellado
  betType: MultipleBetType;
  numbersPlayedCount: number; // Ej. 8 números
  cost: number; // Ej. 84€
  activePlayersCount: number; // Ej. 84 jugadores
  costPerPlayer: number; // 1€ por jornada
  playedNumbers: number[]; // Combinación jugada (ej. 7, 13, 21, 24, 38, 42, 49)
  playedReintegro: number; // Reintegro jugado (ej. 7)
  jokerPlayed?: boolean;
  
  // Escrutinio oficial
  isScrutinized: boolean;
  winningNumbers?: number[]; // 6 números ganadores
  complementario?: number;
  reintegro?: number;
  jokerNumber?: string;
  
  // Resultados
  hitsCount?: number; // Aciertos en la combinación
  hasReintegro?: boolean;
  prizeCategory?: string; // Ej. '5 aciertos + C', '4 aciertos', 'Reintegro', 'Sin premio'
  totalPrize: number; // Importe total ganado
  prizeType?: 'MENOR_BOLSA' | 'MAYOR_BANCO' | 'NINGUNO'; // <=2000€ va a bolsa, >2000€ a banco
}

export interface SyndicateSettings {
  syndicateName: string;
  weeklyFee: number; // 1€ por jornada
  cycleLength: number; // 10 jornadas
  currentCycle: number;
  currentJornada: number;
  prizeFundBalance: number; // Bolsa acumulada de premios menores
  googleFormUrl: string; // Enlace al formulario de Google para lista de espera
  googleAppsScriptUrl: string; // Endpoint WebApp de Google Apps Script
  googleSheetUrl: string;
  
  // Green API WhatsApp Settings
  greenApiInstanceId: string;
  greenApiToken: string;
  greenApiChatId: string; // ID del grupo de WhatsApp (ej. 120363xxx@g.us)
  sendDailyGeneralSummary: boolean; // Interruptor SÍ/NO para boletín diario general
  sendDrawDayTicketAt2035: boolean; // Interruptor para enviar resguardo oficial a las 20:35
  sendScrutinyAlert: boolean; // Interruptor para enviar escrutinio oficial
  
  // Notificaciones Push Web
  pushEnabled: boolean;
}

export interface DrawSimulationResult {
  hits: number;
  complementarioHit: boolean;
  reintegroHit: boolean;
  prizeAmount: number;
  category: string;
  isMayor: boolean;
  taxWithheld?: number; // 20% sobre exceso de 40.000€
  netPerPlayer?: number;
}

export interface PrizeHistoryEntry {
  id: string;
  ticketId: string;
  cycleNumber: number;
  jornadaNumber: number;
  drawDate: string;
  hitsCount: number;
  hasReintegro: boolean;
  prizeCategory: string;
  prizeAmount: number;
  prizeType: 'MENOR_BOLSA' | 'MAYOR_BANCO';
}
