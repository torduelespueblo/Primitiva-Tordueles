export interface RuleSection {
  articleNumber: string;
  title: string;
  paragraphs: {
    code?: string;
    heading?: string;
    text: string;
    subText?: string;
    bullets?: string[];
  }[];
}

export const OFFICIAL_RULES_TITLE = 'Reglamento Oficial de la Peña Primitiva Tordueles';

export function getOfficialRulesSections(cycleLength: number = 10): RuleSection[] {
  const renewalStart = Math.max(1, cycleLength - 3);
  const renewalEnd = Math.max(1, cycleLength - 1);
  const totalCost = `${(cycleLength * 1.00).toFixed(2).replace('.', ',')} €`;

  return [
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
          text: `Los pagos se realizarán por adelantado en bloques cerrados e indivisibles según la duración establecida para cada ciclo (${cycleLength} semanas, a razón de 1,00 € por semana y jugador, ${totalCost} en total por ciclo). No se admiten pagos fraccionados ni semanas sueltas.`,
        },
        {
          code: '1.3.',
          heading: 'Plazo Obligatorio de Renovación:',
          text: `La renovación de la cuota para el siguiente ciclo debe abonarse obligatoriamente entre la penúltima jornada y las 2 anteriores a esta del ciclo vigente (jornadas ${renewalStart} a ${renewalEnd}).`,
        },
      ],
    },
    {
      articleNumber: 'Artículo 2',
      title: 'Apuestas Múltiples Adaptables e Imparcialidad',
      paragraphs: [
        {
          code: '2.1.',
          heading: 'Ajuste al Presupuesto, Combinaciones Múltiples y Escalado de Jugadores:',
          text: 'El importe y la estructura de las apuestas oficiales se adaptarán al número exacto de jugadores que participen en cada ciclo. Dado que cada jugador aporta 1,00 € por sorteo, la peña podrá jugar un único resguardo múltiple o combinar varios resguardos múltiples oficiales en un mismo sorteo (por ejemplo, duplicando o triplicando bloques, o combinando distintas modalidades) con el objetivo de absorber al mayor número posible de inscritos y reducir al mínimo la lista de suplentes. En cualquier caso, la suma total de apuestas selladas en el conjunto de los resguardos deberá coincidir exactamente con el número de titulares al corriente de pago (1,00 € por apuesta), sin admitirse cifras intermedias.',
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
          heading: 'Requisitos de Inscripción, Mayoría de Edad y Aceptación de Bases:',
          text: 'La participación en la peña está estrictamente reservada a personas mayores de 18 años, quedando prohibida la inscripción de menores de edad bajo cualquier circunstancia. Para formalizar la inscripción en la peña mediante el Formulario de Registro, es obligatoria la recopilación de Nombre, Apellidos, Teléfono Móvil y marcar la casilla obligatoria de Aceptación del Reglamento. Por motivos de privacidad y seguridad ante datos sensibles, no se exigirá el DNI ni el número de IBAN en el momento del alta inicial. No obstante, todo socio acepta expresamente que, en caso de resultar agraciado con un premio que legal o bancariamente requiera dichos datos para su tramitación y cobro, estará obligado a facilitar su DNI/NIF y su número de cuenta (IBAN); de no aportarse, no será posible materializar la entrega individualizada del premio correspondiente.',
        },
        {
          code: '3.2.',
          heading: 'Orden Cronológico Inalterable y Asignación Inicial de Plazas:',
          text: 'Las plazas y vacantes se asignarán por estricto orden cronológico de inscripción registrado al completar el alta. Durante la fase inicial de captación o mientras se evalúa la combinación óptima de boletos múltiples a jugar, el listado público de socios podrá permanecer oculto o mostrar únicamente la condición de inscrito sin asignar orden definitivo de titularidad o suplencia, hasta que la Administración cierre el cupo y apruebe la modalidad o combinación de apuestas definitiva para el ciclo.',
        },
        {
          code: '3.3.',
          heading: 'Exclusión por Falta de Pago:',
          text: `Si un integrante titular no abona la cuota antes de finalizar la jornada ${cycleLength - 1}, la jornada ${cycleLength} (última del ciclo) será su última jugada y será excluido definitivamente de la peña.`,
        },
        {
          code: '3.4.',
          heading: 'Aviso de Vacantes y Plazo de 48 Horas para Suplentes:',
          text: `Si se produce alguna baja, se avisará primero en el grupo oficial de WhatsApp de que existen vacantes disponibles y, a continuación, se contactará de forma individual con quien corresponda según el orden estricto de la lista de suplentes. El aspirante notificado dispondrá de 48 horas para abonar los ${totalCost} correspondientes al nuevo ciclo; transcurrido dicho plazo sin justificante de ingreso, decaerá en su derecho y se avisará al siguiente suplente.`,
        },
        {
          code: '3.5.',
          heading: 'Ampliación de la Peña y Salto de Nivel:',
          text: 'Si la lista de espera ("Suplentes") crece lo suficiente como para sumar, junto con los titulares actuales, el número exacto de participantes requerido para alcanzar el siguiente bloque oficial de apuestas múltiples, el ascenso de categoría no se realizará de forma automática. El Administrador recibirá un aviso del sistema y deberá evaluar y aprobar manualmente este salto de nivel antes de finalizar el ciclo vigente. Una vez aprobado el salto oficial por la administración, se notificará en bloque a los suplentes correspondientes, quienes dispondrán del plazo reglamentario para abonar su cuota. Solo tras la confirmación de estos pagos, los suplentes adquirirán la condición de "Titular" y la peña al completo pasará a jugar el nuevo bloque en el siguiente ciclo.',
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
          text: `La plaza vacante pasará al primer suplente tras finalizar el ciclo de ${cycleLength} jornadas que el socio fallecido tuviera previamente abonado. La parte proporcional neta de cualquier premio obtenido durante dicho ciclo vigente se entregará formalmente a sus legítimos herederos legales.`,
        },
        {
          code: '4.4.',
          heading: 'Compromiso con el Juego Responsable:',
          text: 'Con el fin de velar por el bienestar de todos los participantes y fomentar un ocio saludable, si un integrante o un familiar cercano solicita al Administrador su baja por dificultades relacionadas con el juego, la Administración procederá a tramitar su exclusión de la peña de forma inmediata, confidencial y preventiva. Al tratarse de una actividad puramente recreativa entre particulares, los participantes eximen al Administrador de cualquier responsabilidad personal, económica o legal derivada de las decisiones individuales de juego o de las bajas gestionadas bajo este compromiso. De manera excepcional a lo dispuesto para el resto de bajas, en este supuesto se liquidará y devolverá al interesado (o a su entorno familiar autorizado) la parte proporcional que le correspondiera del Fondo Común acumulado hasta la fecha de su salida.',
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
          text: 'Los premios de cuantía igual o inferior a 2.000,00 € obtenidos en cada sorteo se acumularán íntegramente en el Fondo Común (Bolsa de Premios Menores) de la peña, constituyendo una cuenta de reserva separada del presupuesto semanal de apuestas. Este fondo no es susceptible de reparto parcial ni de devolución en caso de baja de un integrante (salvo la excepción contemplada en el Artículo 4.4).',
        },
        {
          code: '5.2.',
          heading: 'Premios Mayores (superiores a 2.000,00 €):',
          text: 'Los premios que superen los 2.000,00 € obligan legalmente a la tramitación y cobro del resguardo oficial en una entidad bancaria concertada por SELAE, presentando el DNI / NIF de la totalidad de los miembros activos que componen la peña en dicho sorteo. De acuerdo con la legislación tributaria española (Ley 16/2012), si el premio supera los 40.000,00 €, la entidad bancaria retendrá automáticamente el 20% en concepto de gravamen especial sobre el importe que exceda de dicha base exenta. Posteriormente, se transferirá la parte líquida neta al número de cuenta (IBAN) individual facilitado por cada socio. Al tratarse de transferencias bancarias para el reparto de estas cantidades (mayores de 2.000,00 € y de 40.000,00 €), cada jugador asumirá de forma individual los posibles gastos o comisiones por transferencia que aplique la entidad bancaria, descontándose dichas comisiones directamente del importe a percibir.',
        },
      ],
    },
  ];
}

export const OFFICIAL_RULES_SECTIONS = getOfficialRulesSections(10);
