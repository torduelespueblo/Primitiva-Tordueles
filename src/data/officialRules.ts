export interface RuleSection {
  articleNumber: string;
  title: string;
  paragraphs: {
    code?: string;
    heading?: string;
    text: string;
    bullets?: string[];
  }[];
}

export const OFFICIAL_RULES_TITLE = 'Reglamento Oficial de la Peña Primitiva Tordueles';

export const OFFICIAL_RULES_SECTIONS: RuleSection[] = [
  {
    articleNumber: 'Artículo 1',
    title: 'Financiación, Cuotas y Ciclos de Juego',
    paragraphs: [
      {
        code: '1.1.',
        heading: 'Cuota Unitaria:',
        text: 'La participación en la peña tiene una cuota fija de 1,00 € semanal por jugador.',
      },
      {
        code: '1.2.',
        heading: 'Bloques Indivisibles:',
        text: 'Los pagos se realizarán por adelantado en bloques cerrados e indivisibles de 10 jornadas (10,00 € por jugador y ciclo). No se admiten pagos fraccionados ni semanas sueltas.',
      },
      {
        code: '1.3.',
        heading: 'Plazo Obligatorio de Renovación:',
        text: 'La renovación de la cuota para el siguiente ciclo debe abonarse obligatoriamente entre la jornada 7 y la jornada 9 del ciclo vigente.',
      },
    ],
  },
  {
    articleNumber: 'Artículo 2',
    title: 'Apuestas Múltiples Adaptables e Imparcialidad',
    paragraphs: [
      {
        code: '2.1.',
        heading: 'Ajuste Automático al Presupuesto y Escalado de Jugadores:',
        text: 'El importe y tamaño de la apuesta múltiple oficial se adaptará automáticamente al número exacto de jugadores que hayan completado el pago en cada ciclo. Dado que cada jugador aporta 1,00 € por sorteo, para aumentar el tamaño de la peña y jugar una combinación mayor, el número total de participantes deberá coincidir siempre con el número exacto de apuestas directas que exige cada bloque múltiple oficial. No se admitirán cifras intermedias de jugadores. Las opciones de apuestas múltiples de La Primitiva y los cupos exactos requeridos son:',
        bullets: [
          'Múltiple de 7 números: 7 apuestas (requiere exactamente 7 jugadores al corriente por 7,00 €).',
          'Múltiple de 8 números: 28 apuestas (requiere exactamente 28 jugadores al corriente por 28,00 €).',
          'Múltiple de 5 números (fijo): 44 apuestas (requiere exactamente 44 jugadores al corriente por 44,00 €).',
          'Múltiple de 9 números: 84 apuestas (requiere exactamente 84 jugadores al corriente por 84,00 €).',
          'Múltiple de 10 números: 210 apuestas (requiere exactamente 210 jugadores al corriente por 210,00 €).',
          'Múltiple de 11 números: 462 apuestas (requiere exactamente 462 jugadores al corriente por 462,00 €).',
        ],
      },
      {
        code: '2.2.',
        heading: 'Combinaciones Aleatorias de Terminal:',
        text: 'Las combinaciones jugadas nunca serán fijas. Se generarán de forma automática y aleatoria mediante el terminal oficial de Loterías y Apuestas del Estado en cada sorteo para garantizar total neutralidad y juego limpio.',
      },
    ],
  },
  {
    articleNumber: 'Artículo 3',
    title: 'Control de Lista de Espera, Inscripción y Plazos',
    paragraphs: [
      {
        code: '3.1.',
        heading: 'Requisitos de Inscripción y Aceptación de Bases:',
        text: 'Para formalizar la inscripción en la peña mediante el Formulario de Registro, es obligatoria la recopilación de Nombre, Apellidos, Teléfono Móvil y marcar la casilla obligatoria de Aceptación del Reglamento. Por motivos de privacidad y seguridad ante datos sensibles, no se exigirá el DNI ni el número de IBAN en el momento del alta inicial. No obstante, todo socio acepta expresamente que, en caso de resultar agraciado con un premio que legal o bancariamente requiera dichos datos para su tramitación y cobro, estará obligado a facilitar su DNI/NIF y su número de cuenta (IBAN); de no aportarse, no será posible materializar la entrega individualizada del premio correspondiente.',
      },
      {
        code: '3.2.',
        heading: 'Orden Cronológico Inalterable:',
        text: 'Las vacantes se asignarán por estricto orden de antigüedad según la fecha y hora exacta registrada al completar la inscripción para fijar la prelación en la lista de espera.',
      },
      {
        code: '3.3.',
        heading: 'Exclusión por Falta de Pago y Aviso de Bajas:',
        text: 'Si un integrante titular no abona la cuota antes de finalizar la jornada 9, la jornada 10 será su última jugada del ciclo y será excluido definitivamente de la peña. Se avisará en el grupo de WhatsApp a los suplentes de que va a haber una o varias bajas y se les avisará de forma individual a quienes corresponda según el orden de la lista de suplentes.',
      },
      {
        code: '3.4.',
        heading: 'Plazo de 48 Horas para Suplentes:',
        text: 'El aspirante avisado de forma individual dispondrá de 48 horas para abonar los 10,00 € correspondientes al nuevo ciclo. Transcurrido dicho plazo sin justificante de ingreso, decaerá en su derecho y se avisará al siguiente suplente de la lista.',
      },
      {
        code: '3.5.',
        heading: 'Ampliación de la Peña y Salto de Nivel:',
        text: 'Si la lista de espera ("Suplentes") crece lo suficiente como para sumar, junto con los titulares actuales, el número exacto de participantes requerido para alcanzar el siguiente bloque oficial de apuestas múltiples, el ascenso de categoría no se realizará de forma automática. El Administrador recibirá un aviso del sistema y deberá evaluar y aprobar manualmente este salto de nivel antes de finalizar el ciclo vigente. Una vez aprobado el salto oficial por la administración, se notificará en bloque a los suplentes correspondientes, quienes dispondrán del plazo reglamentario de 48 horas para abonar su cuota. Solo tras la confirmación de estos pagos, los suplentes adquirirán la condición de "Titular" y la peña al completo pasará a jugar el nuevo bloque en el siguiente ciclo.',
      },
    ],
  },
  {
    articleNumber: 'Artículo 4',
    title: 'Bajas, Pérdida de Antigüedad y Régimen de Fallecimiento',
    paragraphs: [
      {
        code: '4.1.',
        heading: 'Pérdida de Derechos por Baja:',
        text: 'Toda persona que cause baja (voluntaria o por impago) perderá su condición de socio, su número de jugador y su antigüedad acumulada. Si en el futuro desea reingresar, deberá inscribirse de nuevo y situarse al final de la cola de espera.',
      },
      {
        code: '4.2.',
        heading: 'No Heredabilidad de la Plaza:',
        text: 'En caso de fallecimiento de un socio titular, la plaza en la peña no se hereda a familiares ni allegados.',
      },
      {
        code: '4.3.',
        heading: 'Liquidación a Herederos Legales:',
        text: 'La plaza vacante pasará al suplente que corresponda por orden tras finalizar el ciclo de 10 jornadas que el socio fallecido tuviera previamente abonado. La parte proporcional neta de cualquier premio obtenido durante dicho ciclo vigente se entregará formalmente a sus legítimos herederos legales.',
      },
    ],
  },
  {
    articleNumber: 'Artículo 5',
    title: 'Reparto de Premios Menores vs Mayores',
    paragraphs: [
      {
        code: '5.1.',
        heading: 'Premios Menores (hasta 2.000,00 €):',
        text: 'Los premios de cuantía igual o inferior a 2.000,00 € obtenidos en cada sorteo se acumularán íntegramente en el Fondo Común (Bolsa de Premios Menores) de la peña, constituyendo una cuenta de reserva separada del presupuesto semanal de apuestas. Este fondo no es susceptible de reparto parcial ni de devolución en caso de baja de un integrante.',
      },
      {
        code: '5.2.',
        heading: 'Premios Mayores (superiores a 2.000,00 €):',
        text: 'Los premios que superen los 2.000,00 € obligan legalmente a la tramitación y cobro del resguardo oficial en una entidad bancaria concertada por SELAE, presentando el DNI / NIF de la totalidad de los miembros activos que componen la peña en dicho sorteo. De acuerdo con la legislación tributaria española (Ley 16/2012), si el premio supera los 40.000,00 €, la entidad bancaria retendrá automáticamente el 20% en concepto de gravamen especial sobre el importe que exceda de dicha base exenta. Posteriormente, se transferirá la parte líquida neta al número de cuenta (IBAN) individual facilitado por cada socio. Al tratarse de transferencias bancarias para el reparto de estas cantidades (mayores de 2.000,00 € y de 40.000,00 €), cada jugador asumirá de forma individual los posibles gastos o comisiones por transferencia que aplique la entidad bancaria, descontándose dichas comisiones directamente del importe a percibir.',
      },
    ],
  },
];
