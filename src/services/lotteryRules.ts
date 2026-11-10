import { MultipleBetType, DrawSimulationResult } from '../types/lottery';

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
];

export function getRecommendedBet(playersCount: number): BetOption {
  // Busca una múltiple exacta o la más cercana
  const exact = OFFICIAL_MULTIPLE_BETS.find(b => b.totalCost === playersCount);
  if (exact) return exact;

  if (playersCount <= 10) return OFFICIAL_MULTIPLE_BETS[0];
  if (playersCount <= 35) return OFFICIAL_MULTIPLE_BETS[1];
  if (playersCount <= 60) return OFFICIAL_MULTIPLE_BETS[2]; // 44 apuestas = 44€
  if (playersCount <= 120) return OFFICIAL_MULTIPLE_BETS[3]; // 84 apuestas = 84€
  return OFFICIAL_MULTIPLE_BETS[4]; // 210 apuestas
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

  // Tabla aproximada de premios medios de La Primitiva oficial
  let prizeAmount = 0;
  let category = 'Sin premio oficial';

  if (betType === 'MULTIPLE_5') {
    // En múltiple de 5 números:
    // Si aciertas 5 números del bombo: tienes 1 de 6 aciertos + 43 de 5 aciertos
    // Si aciertas 4 números: tienes 2 de 5 aciertos + 42 de 4 aciertos
    // Si aciertas 3 números: tienes 3 de 4 aciertos + 41 de 3 aciertos
    if (hits === 5) {
      prizeAmount = 1850000; // Bote estimado
      category = '¡Premio de Categoría Especial / 1ª Categoría!';
    } else if (hits === 4) {
      prizeAmount = 5200; // 2 de 5ª y 42 de 4ª
      category = '4 aciertos en Múltiple de 5 (2x 5 Aciertos + 42x 4 Aciertos)';
    } else if (hits === 3) {
      prizeAmount = 126.40; // 3x 4 aciertos + 41x 3 aciertos
      category = '3 aciertos en Múltiple de 5 (3x 4 Aciertos + 41x 3 Aciertos)';
    } else if (hits === 2) {
      prizeAmount = 8.00;
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
    // Múltiple general o simple
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
      prizeAmount = 58.20;
      category = '4 Aciertos (4ª Categoría)';
    } else if (hits === 3) {
      prizeAmount = 8.00;
      category = '3 Aciertos (5ª Categoría)';
    }
  }

  // Si acierta reintegro
  if (reintegroHit) {
    const reintegroValue = (betType === 'MULTIPLE_5' ? 44.0 : (betType === 'MULTIPLE_9' ? 84.0 : 7.0));
    prizeAmount += reintegroValue;
    category += ` + Reintegro (${reintegroValue.toFixed(2)} €)`;
  }

  // Clasificación legal de la peña: Menor <= 2.000€ vs Mayor > 2.000€
  const isMayor = prizeAmount > 2000;

  // Impuesto legal español (Ley 16/2012): 20% sobre el exceso de 40.000 € por boleto
  let taxWithheld = 0;
  if (prizeAmount > 40000) {
    taxWithheld = (prizeAmount - 40000) * 0.20;
  }
  const netTotal = prizeAmount - taxWithheld;
  const netPerPlayer = activePlayersCount > 0 ? (netTotal / activePlayersCount) : 0;

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
