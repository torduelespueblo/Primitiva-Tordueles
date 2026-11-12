import React from 'react';
import { Logo } from './Logo';
import {
  FileText,
  DollarSign,
  Shuffle,
  Clock,
  UserX,
  Trophy,
  Scale,
  Printer
} from 'lucide-react';
import { MultipleBetsGuide } from './MultipleBetsGuide';

export const OfficialRules: React.FC = () => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="rounded-2xl bg-[#0d253f] p-6 sm:p-8 text-white shadow-md flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4 text-center sm:text-left">
          <div className="bg-white p-2 rounded-2xl shadow-sm shrink-0">
            <Logo size={64} variant="full" />
          </div>
          <div>
            <span className="text-xs uppercase font-bold tracking-widest text-sky-300 block">
              Documento Oficial Vinculante
            </span>
            <h1 className="text-xl sm:text-2xl font-black font-serif text-white">
              Reglamento Interno Oficial
            </h1>
            <p className="text-xs text-slate-300 mt-1">
              Peña de Lotería La Primitiva • Tordueles (Burgos)
            </p>
          </div>
        </div>

        <button
          onClick={handlePrint}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-semibold text-white transition cursor-pointer"
        >
          <Printer className="w-4 h-4" />
          <span>Imprimir / Guardar PDF</span>
        </button>
      </div>

      {/* Rules Content */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-8 text-slate-700 leading-relaxed text-sm">
        {/* Art 1 */}
        <section className="space-y-2 border-b border-slate-100 pb-6">
          <div className="flex items-center gap-2.5 text-[#0d253f]">
            <DollarSign className="w-5 h-5 text-blue-900" />
            <h2 className="text-base sm:text-lg font-bold font-serif">
              Artículo 1. Financiación, Cuotas y Ciclos de Juego
            </h2>
          </div>
          <div className="pl-7 space-y-2 text-xs sm:text-sm text-slate-600">
            <p>
              <strong>1.1. Cuota Unitaria:</strong> La participación en la peña tiene una cuota fija de <strong>1,00 € semanal por jugador</strong>.
            </p>
            <p>
              <strong>1.2. Bloques Indivisibles:</strong> Los pagos se realizarán por adelantado en bloques cerrados e indivisibles de <strong>10 jornadas (10,00 € por jugador y ciclo)</strong>. No se admiten pagos fraccionados ni semanas sueltas.
            </p>
            <p>
              <strong>1.3. Plazo Obligatorio de Renovación:</strong> La renovación de la cuota para el siguiente ciclo debe abonarse obligatoriamente entre la <strong>jornada 7 y la jornada 9</strong> del ciclo vigente.
            </p>
          </div>
        </section>

        {/* Art 2 */}
        <section className="space-y-2 border-b border-slate-100 pb-6">
          <div className="flex items-center gap-2.5 text-[#0d253f]">
            <Shuffle className="w-5 h-5 text-blue-900" />
            <h2 className="text-base sm:text-lg font-bold font-serif">
              Artículo 2. Apuestas Múltiples Adaptables e Imparcialidad
            </h2>
          </div>
          <div className="pl-7 space-y-2 text-xs sm:text-sm text-slate-600">
            <p>
              <strong>2.1. Ajuste Automático al Presupuesto y Escalado de Jugadores:</strong> El importe y tamaño de la apuesta múltiple oficial se adaptará automáticamente al número exacto de jugadores que hayan completado el pago en cada ciclo. Dado que cada jugador aporta 1,00 € por sorteo, para aumentar el tamaño de la peña y jugar una combinación mayor, el número total de participantes deberá coincidir siempre con el número exacto de apuestas directas que exige cada bloque múltiple oficial. No se admitirán cifras intermedias de jugadores.
            </p>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
              <strong className="text-slate-900">Las opciones de apuestas múltiples de La Primitiva y los cupos exactos requeridos son:</strong>
              <ul className="list-disc pl-4 mt-1.5 space-y-1">
                <li>Múltiple de 7 números: 7 apuestas (requiere 7 jugadores por 7,00 €).</li>
                <li>Múltiple de 8 números: 28 apuestas (requiere 28 jugadores por 28,00 €).</li>
                <li>Múltiple de 5 números (fijo): 44 apuestas (requiere 44 jugadores por 44,00 €).</li>
                <li>Múltiple de 9 números: 84 apuestas (requiere 84 jugadores por 84,00 €).</li>
                <li>Múltiple de 10 números: 210 apuestas (requiere 210 jugadores por 210,00 €).</li>
                <li>Múltiple de 11 números: 462 apuestas (requiere 462 jugadores por 462,00 €).</li>
              </ul>
            </div>
            <p>
              <strong>2.2. Combinaciones Aleatorias de Terminal:</strong> Las combinaciones jugadas <strong>nunca serán fijas</strong>. Se generarán de forma automática y aleatoria mediante el terminal oficial de Loterías y Apuestas del Estado en cada sorteo para garantizar total neutralidad y juego limpio.
            </p>
          </div>
        </section>

        {/* Art 3 */}
        <section className="space-y-2 border-b border-slate-100 pb-6">
          <div className="flex items-center gap-2.5 text-[#0d253f]">
            <Clock className="w-5 h-5 text-blue-900" />
            <h2 className="text-base sm:text-lg font-bold font-serif">
              Artículo 3. Control de Lista de Espera, Inscripción y Plazos
            </h2>
          </div>
          <div className="pl-7 space-y-2 text-xs sm:text-sm text-slate-600">
            <p>
              <strong>3.1. Requisitos de Inscripción y Aceptación de Bases:</strong> Para formalizar la inscripción en la peña, es obligatoria la recopilación de Nombre, Apellidos, Teléfono Móvil y marcar la casilla de Aceptación del Reglamento. Por motivos de privacidad, no se exigirá el DNI ni el IBAN en el alta inicial. No obstante, todo socio acepta expresamente que, en caso de resultar agraciado con un premio que requiera dichos datos, estará obligado a facilitar su DNI/NIF y su número de cuenta (IBAN).
            </p>
            <p>
              <strong>3.2. Orden Cronológico Inalterable:</strong> Las vacantes se asignarán por estricto orden de antigüedad basado en el sello de tiempo registrado al completar la inscripción.
            </p>
            <p>
              <strong>3.3. Exclusión por Falta de Pago:</strong> Si un integrante titular no abona la cuota antes de finalizar la jornada 9, será excluido de la peña.
            </p>
            <p>
              <strong>3.4. Plazo Estricto de 24 Horas para Suplentes:</strong> El aspirante notificado dispondrá de <strong>24 horas exactas</strong> para abonar los 10,00 € correspondientes al nuevo ciclo.
            </p>
            <p>
              <strong>3.5. Ampliación de la Peña y Salto de Nivel:</strong> Si la lista de espera ("Suplentes") crece lo suficiente como para alcanzar el siguiente bloque oficial, el ascenso de categoría no se realizará de forma automática. El Administrador deberá evaluar y aprobar manualmente este salto de nivel antes de finalizar el ciclo vigente. Tras la confirmación de los pagos, la peña al completo pasará a jugar el nuevo bloque en el siguiente ciclo.
            </p>
          </div>
        </section>

        {/* Art 4 */}
        <section className="space-y-2 border-b border-slate-100 pb-6">
          <div className="flex items-center gap-2.5 text-[#0d253f]">
            <UserX className="w-5 h-5 text-blue-900" />
            <h2 className="text-base sm:text-lg font-bold font-serif">
              Artículo 4. Bajas, Pérdida de Antigüedad y Régimen de Fallecimiento
            </h2>
          </div>
          <div className="pl-7 space-y-2 text-xs sm:text-sm text-slate-600">
            <p>
              <strong>4.1. Pérdida de Derechos por Baja:</strong> Toda persona que cause baja perderá su condición de socio. Si desea reingresar, deberá situarse al final de la cola.
            </p>
            <p>
              <strong>4.2. No Heredabilidad de la Plaza:</strong> En caso de fallecimiento, <strong>la plaza no se hereda</strong>.
            </p>
            <p>
              <strong>4.3. Liquidación a Herederos Legales:</strong> La plaza vacante pasará al primer suplente tras finalizar el ciclo abonado. La parte neta de cualquier premio obtenido en dicho ciclo se entregará a sus herederos legales.
            </p>
          </div>
        </section>

        {/* Art 5 */}
        <section className="space-y-2">
          <div className="flex items-center gap-2.5 text-[#0d253f]">
            <Trophy className="w-5 h-5 text-blue-900" />
            <h2 className="text-base sm:text-lg font-bold font-serif">
              Artículo 5. Reparto de Premios Menores vs Mayores
            </h2>
          </div>
          <div className="pl-7 space-y-3 text-xs sm:text-sm text-slate-600">
            <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl space-y-1.5">
              <strong className="text-blue-950 font-bold block">
                5.1. Premios Menores (hasta 2.000,00 €):
              </strong>
              <p>
                Se acumularán íntegramente en el <strong>Fondo Común de la peña</strong>.
              </p>
            </div>

            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl space-y-1.5">
              <strong className="text-amber-950 font-bold block">
                5.2. Premios Mayores (superiores a 2.000,00 €):
              </strong>
              <p>
                Obligan legalmente a la tramitación presentando el DNI de la totalidad de los miembros. La entidad bancaria retendrá automáticamente el 20% en concepto de gravamen especial sobre el importe que exceda de 40.000,00 €. Posteriormente, se transferirá la parte líquida neta al IBAN individual. Al tratarse de transferencias bancarias para el reparto de estas cantidades (mayores de 2.000,00 € y de 40.000,00 €), cada jugador asumirá de forma individual los posibles gastos o comisiones por transferencia que aplique la entidad bancaria, descontándose dichas comisiones directamente del importe a percibir.
              </p>
            </div>
          </div>
        </section>

        {/* ANEXO OFICIAL: OPCIONES DE APUESTAS MÚLTIPLES */}
        <section className="pt-4 border-t border-slate-100">
          <MultipleBetsGuide />
        </section>
      </div>
    </div>
  );
};
