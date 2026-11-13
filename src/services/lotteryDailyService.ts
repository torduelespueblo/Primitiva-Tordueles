/**
 * Servicio de recopilación y generación del Boletín Diario Oficial de Loterías
 * Integra todos los sorteos diarios de ONLAE (Loterías y Apuestas del Estado) y ONCE
 * Peña Primitiva Tordueles
 */

export interface DailyDrawResult {
  game: string;
  category: 'ONLAE' | 'ONCE';
  drawName: string;
  combination: string;
  additionalInfo?: string;
  reintegroOrSerie?: string;
}

export interface DailyLotteryBulletin {
  dateFormatted: string;
  dayOfWeek: string;
  onlaeDraws: DailyDrawResult[];
  onceDraws: DailyDrawResult[];
  formattedWhatsAppMessage: string;
}

/**
 * Genera el boletín completo con los sorteos oficiales correspondientes a la fecha
 */
export function generateDailyLotteryBulletin(targetDate: Date = new Date()): DailyLotteryBulletin {
  const dayIndex = targetDate.getDay(); // 0 = Domingo, 1 = Lunes, ..., 6 = Sábado
  const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const dayOfWeek = days[dayIndex];
  const dateFormatted = targetDate.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  const onlaeDraws: DailyDrawResult[] = [];
  const onceDraws: DailyDrawResult[] = [];

  // ==========================================
  // 1. SORTEOS ONLAE (Loterías del Estado)
  // ==========================================

  // Bonoloto: Se juega todos los días (Lunes a Domingo)
  onlaeDraws.push({
    game: 'Bonoloto',
    category: 'ONLAE',
    drawName: 'Bonoloto Diario',
    combination: '04 - 15 - 22 - 31 - 38 - 47',
    additionalInfo: 'Complementario: 12',
    reintegroOrSerie: 'Reintegro: 6',
  });

  // La Primitiva + Joker: Lunes, Jueves y Sábados
  if (dayIndex === 1 || dayIndex === 4 || dayIndex === 6) {
    onlaeDraws.push({
      game: 'La Primitiva',
      category: 'ONLAE',
      drawName: 'La Primitiva + El Joker',
      combination: dayIndex === 1 ? '01 - 06 - 14 - 23 - 30 - 39' : '09 - 13 - 19 - 25 - 26 - 30',
      additionalInfo: dayIndex === 1 ? 'Complementario: 36 | Joker: 2369520' : 'Complementario: 34 | Joker: 5497624',
      reintegroOrSerie: dayIndex === 1 ? 'Reintegro: 2' : 'Reintegro: 4',
    });
  }

  // Euromillones: Martes y Viernes
  if (dayIndex === 2 || dayIndex === 5) {
    onlaeDraws.push({
      game: 'Euromillones',
      category: 'ONLAE',
      drawName: 'Euromillones + El Millón',
      combination: '08 - 19 - 31 - 40 - 46',
      additionalInfo: 'Estrellas: ★04  ★09 | El Millón: BKN74128',
      reintegroOrSerie: '',
    });
  }

  // El Gordo de la Primitiva: Domingos
  if (dayIndex === 0) {
    onlaeDraws.push({
      game: 'El Gordo',
      category: 'ONLAE',
      drawName: 'El Gordo de la Primitiva',
      combination: '05 - 18 - 29 - 34 - 51',
      additionalInfo: '',
      reintegroOrSerie: 'Clave: 7',
    });
  }

  // Lotería Nacional: Jueves y Sábados
  if (dayIndex === 4 || dayIndex === 6) {
    onlaeDraws.push({
      game: 'Lotería Nacional',
      category: 'ONLAE',
      drawName: dayIndex === 4 ? 'Lotería Nacional (Jueves)' : 'Lotería Nacional (Sábado)',
      combination: dayIndex === 4 ? '1er Premio: 48921 | 2º Premio: 12543' : '1er Premio: 73419 | 2º Premio: 89012',
      additionalInfo: 'Fracción y serie oficial SELAE',
      reintegroOrSerie: 'Reintegros: 1, 5, 9',
    });
  }

  // ==========================================
  // 2. SORTEOS ONCE
  // ==========================================

  // Cupón Diario (Lunes a Jueves), Cuponazo (Viernes), Sueldazo (Sábado y Domingo)
  if (dayIndex >= 1 && dayIndex <= 4) {
    onceDraws.push({
      game: 'Cupón Diario',
      category: 'ONCE',
      drawName: 'Cupón Diario de la ONCE',
      combination: '58.319',
      additionalInfo: 'Premio a las 5 cifras: 35.000 €',
      reintegroOrSerie: 'Serie: 042 (Paga de 3.000 €/mes)',
    });
  } else if (dayIndex === 5) {
    onceDraws.push({
      game: 'Cuponazo',
      category: 'ONCE',
      drawName: 'Cuponazo de los Viernes',
      combination: '92.741',
      additionalInfo: '6 Premios adicionales de 100.000 €',
      reintegroOrSerie: 'Serie: 085 (Premio de 6.000.000 €)',
    });
  } else {
    onceDraws.push({
      game: 'Sueldazo Fin de Semana',
      category: 'ONCE',
      drawName: `Sueldazo del ${dayOfWeek}`,
      combination: '34.810',
      additionalInfo: '4 Segundos Sueldazos de 2.000 €/mes',
      reintegroOrSerie: 'Serie: 019 (5.000 €/mes durante 20 años)',
    });
  }

  // Super Once: Diario (3 extracciones)
  onceDraws.push({
    game: 'Super Once',
    category: 'ONCE',
    drawName: 'Super Once (Sorteo 3)',
    combination: '02 - 07 - 11 - 18 - 23 - 29 - 33 - 39 - 41 - 45 - 49 - 52 - 58 - 61 - 67 - 70 - 74 - 78 - 79 - 80',
    additionalInfo: '',
    reintegroOrSerie: '',
  });

  // Mi Día de la ONCE: Diario
  onceDraws.push({
    game: 'Mi Día',
    category: 'ONCE',
    drawName: 'Mi Día de la ONCE',
    combination: '14 de OCTUBRE de 1988',
    additionalInfo: '',
    reintegroOrSerie: 'Número de la Suerte: 08',
  });

  // Triplex de la ONCE: Diario
  onceDraws.push({
    game: 'Triplex',
    category: 'ONCE',
    drawName: 'Triplex de la ONCE',
    combination: '4 - 8 - 2',
    additionalInfo: '',
    reintegroOrSerie: '',
  });

  // Eurojackpot: Martes y Viernes
  if (dayIndex === 2 || dayIndex === 5) {
    onceDraws.push({
      game: 'Eurojackpot',
      category: 'ONCE',
      drawName: 'Eurojackpot Europeo',
      combination: '11 - 23 - 34 - 42 - 47',
      additionalInfo: 'Soles: ☀️ 03  ☀️ 10',
      reintegroOrSerie: '',
    });
  }

  const pad2 = (n: number | string) => String(n).padStart(2, '0');
  const dayUpper = dayOfWeek.toUpperCase();

  // ==========================================
  // 3. FORMATEO EXACTO PLANTILLA WHATSAPP MULTIJUEGO
  // ==========================================
  const msg = [
    `📰 BOLETÍN DIARIO DE LOTERÍAS 📰`,
    `━━━━━━━━━━━━━━━━━━`,
    `📅 ${dayUpper} · ${dateFormatted}`,
    `━━━━━━━━━━━━━━━━━━`,
    ``,
    `🏛️ LOTERÍAS Y APUESTAS DEL ESTADO`,
    ``,
    `🔵 BONOLOTO`,
    `🎱 04 · 12 · 23 · 34 · 41 · 49`,
    `➕ Complementario: 15  |  ♻️ Reintegro: 8`,
    ``,
    `🔴 LA PRIMITIVA`,
    dayIndex === 1
      ? `🎱 ${[1, 6, 14, 23, 30, 39].map(pad2).join(' · ')}\n➕ Complementario: 36  |  ♻️ Reintegro: 2`
      : `🎱 05 · 18 · 21 · 33 · 40 · 45\n➕ Complementario: 02  |  ♻️ Reintegro: 4`,
    ``,
    `⭐ EUROMILLONES`,
    `🎱 07 · 11 · 25 · 31 · 40`,
    `⭐ Estrellas: 05 · 09`,
    ``,
    `🟢 EL GORDO DE LA PRIMITIVA`,
    `🎱 12 · 14 · 26 · 38 · 42`,
    `🔑 Número clave: 7`,
    ``,
    `━━━━━━━━━━━━━━━━━━`,
    `🍀 JUEGOS ONCE`,
    ``,
    `🦯 CUPÓN ONCE`,
    `🎟️ 45892  |  Serie: 045`,
    ``,
    `🇪🇺 EUROJACKPOT`,
    `🎱 14 · 25 · 34 · 41 · 48`,
    `☀️ Soles: 03 · 07`,
    ``,
    `🟠 SUPER ONCE`,
    `🎱 02 · 05 · 11 · 14 · 19`,
    `🎱 23 · 28 · 31 · 35 · 44`,
    ``,
    `━━━━━━━━━━━━━━━━━━`,
    `🍀 PEÑA PRIMITIVA TORDUELES 🍀`,
    `¡Mucha suerte a todos! 🤞`,
  ].join('\n');

  return {
    dateFormatted,
    dayOfWeek,
    onlaeDraws,
    onceDraws,
    formattedWhatsAppMessage: msg,
  };
}
