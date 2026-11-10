export interface GreenApiConfig {
  instanceId?: string;
  token?: string;
  chatId?: string;
}

export const GREEN_API_DEFAULT_CONFIG: Required<GreenApiConfig> = {
  instanceId: '710722795241',
  token: 'a1c3c85f04d34a21ae86403c9ebdbdb54854f9d5f94842a1b3',
  chatId: '120363430888892480@g.us',
};

export const greenApiService = {
  async sendMessage(
    config?: GreenApiConfig,
    message?: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const activeConfig = {
      instanceId: config?.instanceId || GREEN_API_DEFAULT_CONFIG.instanceId,
      token: config?.token || GREEN_API_DEFAULT_CONFIG.token,
      chatId: config?.chatId || GREEN_API_DEFAULT_CONFIG.chatId,
    };

    if (!activeConfig.instanceId || !activeConfig.token || !activeConfig.chatId || !message) {
      return {
        success: false,
        error: 'Credenciales de Green API no configuradas. Por favor añade Instance ID, API Token y Chat ID.',
      };
    }

    try {
      const url = `https://api.green-api.com/waInstance${activeConfig.instanceId}/sendMessage/${activeConfig.token}`;
      const payload = {
        chatId: activeConfig.chatId.includes('@') ? activeConfig.chatId : `${activeConfig.chatId}@g.us`,
        message,
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return { success: false, error: `Error Green API (${response.status}): ${errorText}` };
      }

      const data = await response.json();
      return { success: true, messageId: data.idMessage };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error desconocido de red';
      return { success: false, error: msg };
    }
  },

  async sendFileByUrl(
    config: GreenApiConfig,
    fileUrl: string,
    fileName: string,
    caption: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!config.instanceId || !config.token || !config.chatId) {
      return {
        success: false,
        error: 'Credenciales de Green API incompletas.',
      };
    }

    try {
      const url = `https://api.green-api.com/waInstance${config.instanceId}/sendFileByUrl/${config.token}`;
      const payload = {
        chatId: config.chatId.includes('@') ? config.chatId : `${config.chatId}@g.us`,
        urlFile: fileUrl,
        fileName,
        caption,
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return { success: false, error: `Error Green API (${response.status}): ${errorText}` };
      }

      const data = await response.json();
      return { success: true, messageId: data.idMessage };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error de conexión';
      return { success: false, error: msg };
    }
  },

  formatDrawTicketMessage(jornada: number, cycle: number, numbers: number[], reintegro: number, players: number): string {
    return `🌲 *PEÑA LA PRIMITIVA TORDUELES* 🌲\n` +
      `📅 *Jornada ${jornada}/10 (Ciclo ${cycle})*\n` +
      `⏰ *Publicación oficial: 20:35 h*\n\n` +
      `🎟️ *Resguardo Sellado Oficial Validado:*\n` +
      `• Jugadores Activos: ${players} socios (1€/semana)\n` +
      `• Tipo de Apuesta: Múltiple de ${numbers.length} números (${players} apuestas)\n` +
      `• Números Jugados: ${numbers.join(' - ')}\n` +
      `• Reintegro: [ ${reintegro} ]\n\n` +
      `🍀 *¡Mucha suerte a todos los socios de Tordueles!*\n` +
      `📱 Consulta el resguardo sellado y el escrutinio en directo en la WebApp oficial.`;
  },

  formatScrutinyMessage(jornada: number, hits: number, prize: number, category: string, isMayor: boolean): string {
    return `🌲 *ESCRUTINIO OFICIAL PRIMITIVA - PEÑA TORDUELES* 🌲\n` +
      `📊 *Resultado Jornada ${jornada}/10*\n\n` +
      `🎯 *Aciertos:* ${hits}\n` +
      `🏆 *Categoría:* ${category}\n` +
      `💰 *Premio Total:* ${prize.toFixed(2)} €\n\n` +
      (isMayor
        ? `🚨 *¡PREMIO MAYOR (> 2.000 €)!*\nSe tramita cobro en entidad bancaria con DNI de miembros activos. ¡Enhorabuena!`
        : `📥 *Destino:* Ingresado en el Fondo Común (Bolsa de Premios Menores).`);
  },

  formatDailySummaryMessage(summaryDate: string, drawsInfo: string): string {
    return `🌲 *BOLETÍN DIARIO DE SORTEOS - PEÑA TORDUELES* 🌲\n` +
      `📅 *Fecha:* ${summaryDate}\n\n` +
      `${drawsInfo}\n\n` +
      `_Boletín automático configurado desde el panel de control._`;
  },

  async sendDrawTicketAlert(
    config: GreenApiConfig | undefined,
    jornada: number,
    cycle: number,
    numbers: number[],
    reintegro: number,
    players: number
  ) {
    const text = this.formatDrawTicketMessage(jornada, cycle, numbers, reintegro, players);
    return this.sendMessage(config, text);
  },

  async sendScrutinyAlert(
    config: GreenApiConfig | undefined,
    jornada: number,
    hits: number,
    prize: number,
    category: string,
    isMayor: boolean
  ) {
    const text = this.formatScrutinyMessage(jornada, hits, prize, category, isMayor);
    return this.sendMessage(config, text);
  },

  async sendDailySummaryAlert(
    config: GreenApiConfig | undefined,
    summaryDate: string,
    drawsInfo: string
  ) {
    const text = this.formatDailySummaryMessage(summaryDate, drawsInfo);
    return this.sendMessage(config, text);
  },
};
