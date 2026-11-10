/**
 * Servicio de mensajería para WhatsApp mediante Green API
 * Peña La Primitiva Tordueles
 */

export interface WhatsAppServiceConfig {
  instanceId: string;
  token: string;
  chatId: string;
}

export const GREEN_API_INSTANCE = "710722795241";
export const GREEN_API_TOKEN = "a1c3c85f04d34a21ae86403c9ebdbdb54854f9d5f94842a1b3";
export const WHATSAPP_GROUP_ID = "120363430888892480@g.us";

export interface SendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export const whatsappService = {
  /**
   * Obtiene la configuración activa, priorizando valores personalizados o el valor por defecto
   */
  getConfig(customConfig?: Partial<WhatsAppServiceConfig>): WhatsAppServiceConfig {
    return {
      instanceId: customConfig?.instanceId || GREEN_API_INSTANCE,
      token: customConfig?.token || GREEN_API_TOKEN,
      chatId: customConfig?.chatId || WHATSAPP_GROUP_ID,
    };
  },

  /**
   * Envía un mensaje de texto simple al grupo de WhatsApp mediante Green API
   */
  async sendTextMessage(
    text: string,
    customConfig?: Partial<WhatsAppServiceConfig>
  ): Promise<SendResult> {
    const config = this.getConfig(customConfig);
    const targetChat = config.chatId.includes('@') ? config.chatId : `${config.chatId}@g.us`;
    const url = `https://api.green-api.com/waInstance${config.instanceId}/sendMessage/${config.token}`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatId: targetChat,
          message: text,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return { success: false, error: `Error Green API (${response.status}): ${errorText}` };
      }

      const data = await response.json();
      return { success: true, messageId: data.idMessage };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error de conexión con Green API';
      return { success: false, error: msg };
    }
  },

  /**
   * Envía un archivo o imagen con pie de foto al grupo mediante Green API
   */
  async sendMediaFile(
    fileUrl: string,
    fileName: string,
    caption: string,
    customConfig?: Partial<WhatsAppServiceConfig>
  ): Promise<SendResult> {
    const config = this.getConfig(customConfig);
    const targetChat = config.chatId.includes('@') ? config.chatId : `${config.chatId}@g.us`;
    const url = `https://api.green-api.com/waInstance${config.instanceId}/sendFileByUrl/${config.token}`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatId: targetChat,
          urlFile: fileUrl,
          fileName,
          caption,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return { success: false, error: `Error enviando archivo (${response.status}): ${errorText}` };
      }

      const data = await response.json();
      return { success: true, messageId: data.idMessage };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al enviar imagen';
      return { success: false, error: msg };
    }
  },

  /**
   * Notificación y publicación del resguardo sellado oficial a las 20:35 horas
   * según las especificaciones del reglamento
   */
  async sendTicketReceipt(
    params: {
      jornada: number;
      cycle: number;
      numbers: number[];
      reintegro: number;
      players: number;
      cost: number;
      receiptImageUrl?: string;
      drawDate?: string;
    },
    customConfig?: Partial<WhatsAppServiceConfig>
  ): Promise<SendResult> {
    const caption =
      `🌲 *PEÑA LA PRIMITIVA TORDUELES* 🌲\n` +
      `📅 *Jornada ${params.jornada}/10 (Ciclo ${params.cycle})*\n` +
      `⏰ *Publicación oficial: 20:35 h*\n\n` +
      `🎟️ *Resguardo Sellado Oficial Validado:*\n` +
      `• Jugadores Activos: ${params.players} socios (1€/semana)\n` +
      `• Presupuesto Jugado: ${params.cost.toFixed(2)} €\n` +
      `• Tipo de Apuesta: Múltiple de ${params.numbers.length} números (${params.players} apuestas)\n` +
      `• Números Jugados: ${params.numbers.map(n => (n < 10 ? `0${n}` : n)).join(' - ')}\n` +
      `• Reintegro: [ ${params.reintegro} ]\n` +
      `• Combinación generada aleatoriamente por terminal oficial SELAE.\n\n` +
      `🍀 *¡Mucha suerte a todos los socios de Tordueles!*\n` +
      `📱 Consulta el resguardo completo y el escrutinio en la WebApp oficial.`;

    // Si tiene URL de imagen válida, envía el archivo con el pie de foto
    if (params.receiptImageUrl && params.receiptImageUrl.startsWith('http')) {
      const mediaResult = await this.sendMediaFile(
        params.receiptImageUrl,
        `resguardo_jornada_${params.jornada}_tordueles.jpg`,
        caption,
        customConfig
      );
      if (mediaResult.success) return mediaResult;
    }

    // Fallback: envía como mensaje de texto
    return this.sendTextMessage(caption, customConfig);
  },

  /**
   * Notificación del escrutinio oficial SELAE
   * Aplica las normas del Art. 5:
   * - Menor o igual a 2.000 €: Fondo Común (Bolsa de Premios Menores)
   * - Mayor a 2.000 €: Cobro bancario con DNI y retención legal del 20% > 40.000 €
   */
  async sendScrutinyResult(
    params: {
      jornada: number;
      cycle: number;
      winningNumbers: number[];
      complementario: number;
      reintegro: number;
      hits: number;
      prize: number;
      category: string;
      isMayor: boolean;
      activePlayersCount: number;
    },
    customConfig?: Partial<WhatsAppServiceConfig>
  ): Promise<SendResult> {
    let msg =
      `🌲 *ESCRUTINIO OFICIAL PRIMITIVA - PEÑA TORDUELES* 🌲\n` +
      `📊 *Resultado Oficial Jornada ${params.jornada}/10 (Ciclo ${params.cycle})*\n\n` +
      `🎱 *Combinación Ganadora SELAE:*\n` +
      `   ${params.winningNumbers.map(n => (n < 10 ? `0${n}` : n)).join(' · ')}\n` +
      `   (Complementario: ${params.complementario} | Reintegro: ${params.reintegro})\n\n` +
      `🎯 *Aciertos de la Peña:* ${params.hits}\n` +
      `🏆 *Categoría:* ${params.category}\n` +
      `💰 *Premio Total Obtenido:* ${params.prize.toFixed(2)} €\n\n`;

    if (params.isMayor) {
      const netEstimate = params.prize > 40000 ? params.prize - (params.prize - 40000) * 0.2 : params.prize;
      const perPlayer = params.activePlayersCount > 0 ? netEstimate / params.activePlayersCount : 0;
      msg +=
        `🚨 *¡PREMIO MAYOR SUPERIOR A 2.000 €!* 🚨\n` +
        `Según el Art. 5.2 del Reglamento Oficial:\n` +
        `• El cobro debe tramitarse obligatoriamente en entidad bancaria con los DNI de los socios activos.\n` +
        (params.prize > 40000 ? `• Retención fiscal legal del 20% sobre el exceso de 40.000 €.\n` : '') +
        `• Parte neta estimada por socio: ~${perPlayer.toFixed(2)} € ingresados en IBAN individual.\n` +
        `¡Enhorabuena a todo el pueblo de Tordueles! 🎉`;
    } else if (params.prize > 0) {
      msg +=
        `📥 *Destino del Premio (Art. 5.1):*\n` +
        `Ingresado íntegramente en el *Fondo Común (Bolsa de Premios Menores)*.\n` +
        `No es reembolsable individualmente en caso de baja.`;
    } else {
      msg += `🍀 Esta jornada no ha habido premio oficial. ¡A por la siguiente jornada del ciclo!`;
    }

    return this.sendTextMessage(msg, customConfig);
  },

  /**
   * Aviso de periodo de renovación urgente para Jornadas 7 a 9 (Art. 1 y 3)
   */
  async sendRenewalReminder(
    jornada: number,
    cycle: number,
    pendingCount: number,
    customConfig?: Partial<WhatsAppServiceConfig>
  ): Promise<SendResult> {
    const msg =
      `⚠️ *AVISO IMPORTANTE DE RENOVACIÓN - PEÑA TORDUELES* ⚠️\n` +
      `📅 *Jornada ${jornada}/10 (Ciclo ${cycle})*\n\n` +
      `Recordatorio reglamentario (Art. 1 y Art. 3):\n` +
      `El plazo obligatorio para renovar la cuota de 10€ (1€ semanal para las próximas 10 jornadas) está abierto entre la jornada 7 y la 9.\n\n` +
      `• Socios con renovación pendiente: *${pendingCount}*\n` +
      `• *Atención:* Todo socio que no haya ingresado la cuota antes de finalizar la jornada 9 jugará la jornada 10 como última y causará *baja definitiva*, perdiendo antigüedad y pasando la vacante al primer suplente con 24h para pagar.\n\n` +
      `Por favor, confirma tu abono lo antes posible.`;

    return this.sendTextMessage(msg, customConfig);
  },

  /**
   * Aviso de vacante disponible al primer suplente con límite de 24 horas (Art. 3)
   */
  async sendSubstituteOpportunityAlert(
    substituteName: string,
    deadlineFormatted: string,
    customConfig?: Partial<WhatsAppServiceConfig>
  ): Promise<SendResult> {
    const msg =
      `📢 *VACANTE DISPONIBLE EN PEÑA TORDUELES (Art. 3)* 📢\n\n` +
      `Se ha generado una vacante por falta de renovación en el ciclo.\n` +
      `Conforme al orden cronológico del Formulario de Google, se avisa al primer suplente:\n` +
      `👤 *Aspirante:* ${substituteName}\n` +
      `⏰ *Plazo improrrogable:* Dispone de *24 horas exactas* (hasta ${deadlineFormatted}) para abonar los 10€ del ciclo completo de 10 jornadas.\n\n` +
      `Si transcurre el plazo sin justificante, la plaza pasará automáticamente al siguiente suplente de la lista.`;

    return this.sendTextMessage(msg, customConfig);
  },

  /**
   * Boletín diario general de sorteos (La Primitiva + ONCE)
   */
  async sendDailySummary(
    summaryDate: string,
    drawsInfo: string,
    customConfig?: Partial<WhatsAppServiceConfig>
  ): Promise<SendResult> {
    const msg =
      `🌲 *BOLETÍN DIARIO DE SORTEOS - PEÑA TORDUELES* 🌲\n` +
      `📅 *Fecha:* ${summaryDate}\n\n` +
      `${drawsInfo}\n\n` +
      `_Boletín automático activado desde el panel de control._`;

    return this.sendTextMessage(msg, customConfig);
  },
};
