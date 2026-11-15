import { MultipleBetType, DrawSimulationResult, TicketDraw } from '../types/lottery';

export interface BetOption {
  type: MultipleBetType;
  label: string;
  numbersCount: number;
  betsGenerated: number;
  totalCost: number;
  description: string;
}

export const OFFICIAL_MULTIPLE_BETS: BetOption[] = [
  {
    type: 'MULTIPLE_7',
    label: 'Múltiple de 7 números',
    numbersCount: 7,
    betsGenerated: 7,
    totalCost: 7.0,
    description: '7 apuestas simples (1 bloque de 7 números marcados)',
  },
  {
    type: 'MULTIPLE_8',
    label: 'Múltiple de 8 números',
    numbersCount: 8,
    betsGenerated: 28,
    totalCost: 28.0,
    description: '28 apuestas simples (1 bloque de 8 números)',
  },
  {
    type: 'MULTIPLE_5',
    label: 'Múltiple de 5 números (Autorizada)',
    numbersCount: 5,
    betsGenerated: 44,
    totalCost: 44.0,
    description: '44 apuestas simples (el terminal combina con los restantes 44 números)',
  },
  {
    type: 'MULTIPLE_9',
    label: 'Múltiple de 9 números',
    numbersCount: 9,
    betsGenerated: 84,
    totalCost: 84.0,
    description: '84 apuestas simples (1 bloque de 9 números)',
  },
  {
    type: 'MULTIPLE_10',
    label: 'Múltiple de 10 números',
    numbersCount: 10,
    betsGenerated: 210,
    totalCost: 210.0,
    description: '210 apuestas simples (1 bloque de 10 números)',
  },
  {
    type: 'MULTIPLE_11',
    label: 'Múltiple de 11 números',
    numbersCount: 11,
    betsGenerated: 462,
    totalCost: 462.0,
    description: '462 apuestas simples (1 bloque de 11 números)',
  },
];

export type CombinationStatus = 'READY' | 'CLOSE' | 'WAITING';

export interface BlockCombinationOption {
  id: string;
  description: string;
  blocks: number[];
  ticketsCount: number;
  totalPlayers: number;
  totalCost: number;
  diffFromEnrolled: number; // positivo = faltan jugadores, <= 0 = cubierto/sobran
  status: CombinationStatus;
  statusLabel: string;
  gapLabel: string;
}

const PRIMITIVA_BLOCK_VALUES = [7, 28, 44, 84, 210, 462] as const;

function formatBlocksDescription(blocks: number[]): string {
  const counts = new Map<number, number>();
  for (const b of blocks) {
    counts.set(b, (counts.get(b) || 0) + 1);
  }
  const sortedEntries = Array.from(counts.entries()).sort((a, b) => b[0] - a[0]);
  return sortedEntries
    .map(([val, qty]) => (qty > 1 ? `${val} × ${qty}` : `${val}`))
    .join(' + ');
}

/**
 * Genera combinaciones válidas (1 a 3 boletos, más múltiplos directos de 4x pequeños)
 * a partir de los bloques oficiales [7, 28, 44, 84, 210, 462] a 1 €/apuesta.
 */
export function generateBlockCombinations(enrolledCount: number): BlockCombinationOption[] {
  const safeEnrolled = Math.max(0, Math.floor(enrolledCount));
  const bestBySum = new Map<number, { blocks: number[]; ticketsCount: number; maxBlock: number }>();

  const registerCombo = (blocks: number[]) => {
    const sum = blocks.reduce((acc, v) => acc + v, 0);
    const maxAllowed = Math.max(safeEnrolled + 90, 220);
    // Siempre incluimos bloques individuales (210, 462) o sumas cercanas al cupo actual
    if (blocks.length > 1 && sum > maxAllowed) return;

    const sortedDesc = [...blocks].sort((a, b) => b - a);
    const maxBlock = sortedDesc[0] || 0;
    const existing = bestBySum.get(sum);

    if (
      !existing ||
      sortedDesc.length < existing.ticketsCount ||
      (sortedDesc.length === existing.ticketsCount && maxBlock > existing.maxBlock)
    ) {
      bestBySum.set(sum, {
        blocks: sortedDesc,
        ticketsCount: sortedDesc.length,
        maxBlock,
      });
    }
  };

  // Combinaciones de 1, 2 y 3 boletos
  for (let i = 0; i < PRIMITIVA_BLOCK_VALUES.length; i++) {
    const a = PRIMITIVA_BLOCK_VALUES[i];
    registerCombo([a]);
    for (let j = i; j < PRIMITIVA_BLOCK_VALUES.length; j++) {
      const b = PRIMITIVA_BLOCK_VALUES[j];
      registerCombo([a, b]);
      for (let k = j; k < PRIMITIVA_BLOCK_VALUES.length; k++) {
        const c = PRIMITIVA_BLOCK_VALUES[k];
        registerCombo([a, b, c]);
      }
    }
  }

  // Múltiplos adicionales útiles de 4 boletos para bloques medios/pequeños (ej. 44 × 4 = 176)
  for (const val of [7, 28, 44]) {
    registerCombo([val, val, val, val]);
  }

  const list: BlockCombinationOption[] = Array.from(bestBySum.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([totalPlayers, meta]) => {
      const diff = totalPlayers - safeEnrolled;
      const closeThreshold = Math.max(6, Math.ceil(totalPlayers * 0.15));

      let status: CombinationStatus = 'WAITING';
      let statusLabel = '⚪ En espera';
      let gapLabel = `Faltan ${diff} ${diff === 1 ? 'jugador' : 'jugadores'}`;

      if (diff <= 0) {
        status = 'READY';
        statusLabel = '🟢 Listo para jugar';
        const extra = Math.abs(diff);
        gapLabel =
          extra === 0
            ? 'Cupo exacto (0 faltan)'
            : `Cubierto (sobran ${extra} ${extra === 1 ? 'suplente' : 'suplentes'})`;
      } else if (diff <= closeThreshold) {
        status = 'CLOSE';
        statusLabel = '🟡 Muy cerca';
        gapLabel = `Faltan ${diff} ${diff === 1 ? 'jugador' : 'jugadores'}`;
      }

      return {
        id: meta.blocks.join('-'),
        description: formatBlocksDescription(meta.blocks),
        blocks: meta.blocks,
        ticketsCount: meta.ticketsCount,
        totalPlayers,
        totalCost: totalPlayers,
        diffFromEnrolled: diff,
        status,
        statusLabel,
        gapLabel,
      };
    });

  return list;
}

export function getRecommendedBet(playersCount: number): BetOption {
  const exact = OFFICIAL_MULTIPLE_BETS.find(b => b.totalCost === playersCount);
  if (exact) return exact;

  if (playersCount <= 10) return OFFICIAL_MULTIPLE_BETS[0];
  if (playersCount <= 35) return OFFICIAL_MULTIPLE_BETS[1];
  if (playersCount <= 60) return OFFICIAL_MULTIPLE_BETS[2]; // 44 apuestas = 44€
  if (playersCount <= 120) return OFFICIAL_MULTIPLE_BETS[3]; // 84 apuestas = 84€
  if (playersCount <= 300) return OFFICIAL_MULTIPLE_BETS[4]; // 210 apuestas = 210€
  return OFFICIAL_MULTIPLE_BETS[5]; // 462 apuestas
}

/**
 * Cálculo del escrutinio de una jugada de La Primitiva
 */
export function calculateScrutiny(
  playedNumbers: number[],
  playedReintegro: number,
  winningNumbers: number[],
  complementario: number,
  reintegro: number,
  betType: MultipleBetType = 'MULTIPLE_5',
  activePlayersCount: number = 44
): DrawSimulationResult {
  const hitsArray = playedNumbers.filter(n => winningNumbers.includes(n));
  const hits = hitsArray.length;
  const complementarioHit = playedNumbers.includes(complementario);
  const reintegroHit = playedReintegro === reintegro;

  let prizeAmount = 0;
  let category = 'Sin premio oficial';

  if (betType === 'MULTIPLE_5') {
    if (hits === 5) {
      prizeAmount = 1850000;
      category = '¡Premio de Categoría Especial / 1ª Categoría!';
    } else if (hits === 4) {
      prizeAmount = 5200;
      category = '4 aciertos en Múltiple de 5 (2x 5 Aciertos + 42x 4 Aciertos)';
    } else if (hits === 3) {
      prizeAmount = 126.4;
      category = '3 aciertos en Múltiple de 5 (3x 4 Aciertos + 41x 3 Aciertos)';
    } else if (hits === 2) {
      prizeAmount = 8.0;
      category = '2 aciertos en Múltiple (4x 5ª Cat / Reintegros)';
    }
  } else if (betType === 'MULTIPLE_8') {
    if (hits === 6) {
      prizeAmount = 1450000;
      category = '¡6 Aciertos en Múltiple de 8!';
    } else if (hits === 5 && complementarioHit) {
      prizeAmount = 62000;
      category = '5 Aciertos + C en Múltiple de 8';
    } else if (hits === 5) {
      prizeAmount = 6800;
      category = '5 Aciertos en Múltiple de 8 (3x 5ª + 15x 4ª)';
    } else if (hits === 4) {
      prizeAmount = 350.0;
      category = '4 Aciertos en Múltiple de 8 (6x 4ª + 16x 5ª)';
    } else if (hits === 3) {
      prizeAmount = 80.0;
      category = '3 Aciertos en Múltiple de 8 (10x 5ª)';
    }
  } else {
    if (hits === 6) {
      prizeAmount = 1200000;
      category = '¡6 Aciertos (1ª Categoría)!';
    } else if (hits === 5 && complementarioHit) {
      prizeAmount = 28500;
      category = '5 Aciertos + C (2ª Categoría)';
    } else if (hits === 5) {
      prizeAmount = 1850;
      category = '5 Aciertos (3ª Categoría)';
    } else if (hits === 4) {
      prizeAmount = 58.2;
      category = '4 Aciertos (4ª Categoría)';
    } else if (hits === 3) {
      prizeAmount = 8.0;
      category = '3 Aciertos (5ª Categoría)';
    }
  }

  if (reintegroHit) {
    const reintegroValue =
      betType === 'MULTIPLE_5'
        ? 44.0
        : betType === 'MULTIPLE_8'
        ? 28.0
        : betType === 'MULTIPLE_9'
        ? 84.0
        : betType === 'MULTIPLE_10'
        ? 210.0
        : betType === 'MULTIPLE_11'
        ? 462.0
        : 7.0;
    prizeAmount += reintegroValue;
    category += ` + Reintegro (${reintegroValue.toFixed(2)} €)`;
  }

  const isMayor = prizeAmount > 2000;

  let taxWithheld = 0;
  if (prizeAmount > 40000) {
    taxWithheld = (prizeAmount - 40000) * 0.2;
  }
  const netTotal = prizeAmount - taxWithheld;
  const netPerPlayer = activePlayersCount > 0 ? netTotal / activePlayersCount : 0;

  return {
    hits,
    complementarioHit,
    reintegroHit,
    prizeAmount,
    category,
    isMayor,
    taxWithheld,
    netPerPlayer,
  };
}

export interface MultiTicketScrutinyItem {
  ticketId: string;
  ticket: TicketDraw;
  matchedNumbers: number[];
  result: DrawSimulationResult;
}

export interface MultiTicketScrutinySummary {
  items: MultiTicketScrutinyItem[];
  totalHits: number;
  anyComplementarioHit: boolean;
  anyReintegroHit: boolean;
  totalPrizeAmount: number;
  combinedCategory: string;
  isMayor: boolean;
  taxWithheld: number;
  netPerPlayer: number;
}

/**
 * Escrutinio conjunto para jornadas con 1, 2 o más resguardos sellados.
 * Suma los aciertos y los premios obtenidos entre todos los boletos de la jornada.
 */
export function calculateMultiTicketScrutiny(
  jornadaTickets: TicketDraw[],
  winningNumbers: number[],
  complementario: number,
  reintegro: number,
  activePlayersCount: number = 44
): MultiTicketScrutinySummary {
  const items: MultiTicketScrutinyItem[] = jornadaTickets.map(ticket => {
    const matchedNumbers = (ticket.playedNumbers || [])
      .filter(n => winningNumbers.includes(n))
      .sort((a, b) => a - b);
    const result = calculateScrutiny(
      ticket.playedNumbers || [],
      ticket.playedReintegro,
      winningNumbers,
      complementario,
      reintegro,
      ticket.betType,
      activePlayersCount
    );
    return {
      ticketId: ticket.id,
      ticket,
      matchedNumbers,
      result,
    };
  });

  const totalHits = items.reduce((sum, item) => sum + item.result.hits, 0);
  const anyComplementarioHit = items.some(item => item.result.complementarioHit);
  const anyReintegroHit = items.some(item => item.result.reintegroHit);
  const totalPrizeAmount = items.reduce((sum, item) => sum + item.result.prizeAmount, 0);
  const isMayor = totalPrizeAmount > 2000;
  const taxWithheld = totalPrizeAmount > 40000 ? (totalPrizeAmount - 40000) * 0.2 : 0;
  const netPerPlayer = activePlayersCount > 0 ? (totalPrizeAmount - taxWithheld) / activePlayersCount : 0;

  let combinedCategory = 'Sin premio oficial';
  if (items.length === 1) {
    combinedCategory = items[0].result.category;
  } else if (items.length > 1) {
    const winningCats = items
      .filter(item => item.result.prizeAmount > 0)
      .map((item, idx) => `B${idx + 1}: ${item.result.category}`);
    combinedCategory =
      winningCats.length > 0
        ? winningCats.join(' · ')
        : `Sin premio (${items.length} resguardos revisados)`;
  }

  return {
    items,
    totalHits,
    anyComplementarioHit,
    anyReintegroHit,
    totalPrizeAmount,
    combinedCategory,
    isMayor,
    taxWithheld,
    netPerPlayer,
  };
}
