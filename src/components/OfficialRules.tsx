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
              <strong>2.1. Ajuste Automático al Presupuesto:</strong> El importe y tamaño de la apuesta múltiple oficial se adaptará automáticamente al número exacto de jugadores que hayan completado el pago en cada ciclo.
            </p>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
              <strong className="text-slate-900">Ejemplos de optimización oficial:</strong>
              <ul className="list-disc pl-4 mt-1 space-y-1">
                <li>44 participantes al corriente: Múltiple autorizada de 5 números por 44,00 € (44 apuestas directas).</li>
                <li>84 participantes al corriente: Múltiple de 9 números por 84,00 € (84 apuestas directas).</li>
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
              Artículo 3. Control de Lista de Espera y Plazo de 24 Horas
            </h2>
          </div>
          <div className="pl-7 space-y-2 text-xs sm:text-sm text-slate-600">
            <p>
              <strong>3.1. Orden Cronológico Inalterable:</strong> Las vacantes se asignarán por estricto orden de antigüedad basado en el sello de tiempo (timestamp) registrado en el Formulario oficial de Google.
            </p>
            <p>
              <strong>3.2. Exclusión por Falta de Pago:</strong> Si un integrante titular no abona la cuota antes de finalizar la jornada 9, la jornada 10 será su última jugada del ciclo y será excluido definitivamente de la peña, procediéndose de inmediato a avisar al primer suplente de la lista.
            </p>
            <p>
              <strong>3.3. Plazo Estricto de 24 Horas para Suplentes:</strong> El aspirante notificado dispondrá de <strong>24 horas exactas</strong> para abonar los 10,00 € correspondientes al nuevo ciclo. Transcurrido dicho plazo sin justificante de ingreso, decaerá en su derecho y se avisará al siguiente suplente.
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
              <strong>4.1. Pérdida de Derechos por Baja:</strong> Toda persona que cause baja (voluntaria o por impago) perderá su condición de socio, su número de jugador y su antigüedad acumulada. Si en el futuro desea reingresar, deberá inscribirse de nuevo en el Formulario de Google y situarse al final de la cola de espera.
            </p>
            <p>
              <strong>4.2. No Heredabilidad de la Plaza:</strong> En caso de fallecimiento de un socio titular, <strong>la plaza en la peña no se hereda a familiares ni allegados</strong>.
            </p>
            <p>
              <strong>4.3. Liquidación a Herederos Legales:</strong> La plaza vacante pasará al primer suplente tras finalizar el ciclo de 10 jornadas que el socio fallecido tuviera previamente abonado. La parte proporcional neta de cualquier premio obtenido durante dicho ciclo vigente se entregará formalmente a sus legítimos herederos legales.
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
                Los premios de cuantía igual o inferior a 2.000,00 € obtenidos en cada sorteo se acumularán íntegramente en el <strong>Fondo Común (Bolsa de Premios Menores)</strong> de la peña, constituyendo una cuenta de reserva separada del presupuesto semanal de apuestas. Este fondo no es susceptible de reparto parcial ni de devolución en caso de baja de un integrante.
              </p>
            </div>

            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl space-y-1.5">
              <strong className="text-amber-950 font-bold block">
                5.2. Premios Mayores (superiores a 2.000,00 €):
              </strong>
              <p>
                Los premios que superen los 2.000,00 € obligan legalmente a la tramitación y cobro del resguardo oficial en una entidad bancaria concertada por SELAE, presentando el DNI / NIF de la totalidad de los miembros activos que componen la peña en dicho sorteo.
              </p>
              <p>
                De acuerdo con la legislación tributaria española (Ley 16/2012), si el premio supera los 40.000,00 €, la entidad bancaria retendrá automáticamente el <strong>20% en concepto de gravamen especial</strong> sobre el importe que exceda de dicha base exenta, transfiriendo posteriormente la parte líquida neta al número de cuenta (IBAN) individual aportado por cada socio.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
