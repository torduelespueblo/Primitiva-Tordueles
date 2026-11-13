import React from 'react';
import { Logo } from './Logo';
import {
  DollarSign,
  Shuffle,
  Clock,
  UserX,
  Trophy,
  Printer
} from 'lucide-react';
import { MultipleBetsGuide } from './MultipleBetsGuide';

export const OfficialRules: React.FC = () => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header with large borderless Logo */}
      <div className="rounded-3xl bg-[#0A2540] p-6 sm:p-8 text-white shadow-md flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
          <Logo
            size={92}
            variant="full"
            theme="dark"
            className="w-22 h-22 sm:w-24 sm:h-24 shrink-0"
          />
          <div>
            <span className="text-sm uppercase font-extrabold tracking-widest text-[#FF6B00] block">
              Documento Oficial Vinculante
            </span>
            <h1 className="text-2xl sm:text-3xl font-black font-serif text-white mt-1">
              Reglamento Interno Oficial
            </h1>
            <p className="text-base text-slate-300 mt-1">
              Peña de Lotería La Primitiva · Tordueles (Burgos)
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handlePrint}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-5 min-h-[48px] rounded-xl bg-[#FF6B00] hover:bg-[#E55E00] text-base font-bold text-white transition cursor-pointer shrink-0"
        >
          <Printer className="w-5 h-5" />
          <span>Imprimir / Guardar PDF</span>
        </button>
      </div>

      {/* Rules Content */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-8 text-slate-800 leading-relaxed text-base">
        {/* Art 1 */}
        <section className="space-y-3 border-b border-slate-200 pb-6">
          <div className="flex items-center gap-3 text-[#0A2540]">
            <DollarSign className="w-6 h-6 text-[#FF6B00] shrink-0" />
            <h2 className="text-xl sm:text-2xl font-black font-serif">
              Artículo 1. Financiación, Cuotas y Ciclos de Juego
            </h2>
          </div>
          <div className="space-y-3 text-base sm:text-lg text-slate-700 leading-relaxed">
            <p>
              <strong className="text-[#0A2540]">1.1. Cuota Unitaria:</strong> La participación en la peña tiene una cuota fija de <strong>1,00 € semanal por jugador</strong>.
            </p>
            <p>
              <strong className="text-[#0A2540]">1.2. Bloques Indivisibles:</strong> Los pagos se realizarán por adelantado en bloques cerrados e indivisibles de <strong>10 jornadas (10,00 € por jugador y ciclo)</strong>. No se admiten pagos fraccionados ni semanas sueltas.
            </p>
            <p>
              <strong className="text-[#0A2540]">1.3. Plazo Obligatorio de Renovación:</strong> La renovación de la cuota para el siguiente ciclo debe abonarse obligatoriamente entre la <strong>jornada 7 y la jornada 9</strong> del ciclo vigente.
            </p>
          </div>
        </section>

        {/* Art 2 */}
        <section className="space-y-3 border-b border-slate-200 pb-6">
          <div className="flex items-center gap-3 text-[#0A2540]">
            <Shuffle className="w-6 h-6 text-[#FF6B00] shrink-0" />
            <h2 className="text-xl sm:text-2xl font-black font-serif">
              Artículo 2. Apuestas Múltiples Adaptables e Imparcialidad
            </h2>
          </div>
          <div className="space-y-3 text-base sm:text-lg text-slate-700 leading-relaxed">
            <p>
              <strong className="text-[#0A2540]">2.1. Ajuste Automático al Presupuesto:</strong> El importe y tamaño de la apuesta múltiple oficial se adaptará automáticamente al número exacto de jugadores con pago completado en cada ciclo. Para escalar de categoría, el total de socios deberá coincidir exactamente con las apuestas del bloque oficial.
            </p>
            <div className="bg-[#F4F6F9] p-4 sm:p-5 rounded-2xl border border-slate-200 text-base">
              <strong className="text-[#0A2540] block mb-2">
                Opciones oficiales y cupos exactos requeridos:
              </strong>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>Múltiple de 7 números: 7 apuestas (7 jugadores · 7,00 €).</li>
                <li>Múltiple de 8 números: 28 apuestas (28 jugadores · 28,00 €).</li>
                <li>Múltiple de 5 números (fijo): 44 apuestas (44 jugadores · 44,00 €).</li>
                <li>Múltiple de 9 números: 84 apuestas (84 jugadores · 84,00 €).</li>
                <li>Múltiple de 10 números: 210 apuestas (210 jugadores · 210,00 €).</li>
                <li>Múltiple de 11 números: 462 apuestas (462 jugadores · 462,00 €).</li>
              </ul>
            </div>
            <p>
              <strong className="text-[#0A2540]">2.2. Combinaciones Aleatorias de Terminal:</strong> Las combinaciones jugadas <strong>nunca serán fijas</strong>. Se generarán de forma automática y aleatoria mediante el terminal oficial de Loterías y Apuestas del Estado en cada sorteo.
            </p>
          </div>
        </section>

        {/* Art 3 */}
        <section className="space-y-3 border-b border-slate-200 pb-6">
          <div className="flex items-center gap-3 text-[#0A2540]">
            <Clock className="w-6 h-6 text-[#FF6B00] shrink-0" />
            <h2 className="text-xl sm:text-2xl font-black font-serif">
              Artículo 3. Control de Lista de Espera, Inscripción y Plazos
            </h2>
          </div>
          <div className="space-y-3 text-base sm:text-lg text-slate-700 leading-relaxed">
            <p>
              <strong className="text-[#0A2540]">3.1. Requisitos y Privacidad:</strong> Para inscribirse es obligatorio indicar Nombre, Apellidos, Teléfono Móvil y aceptar el Reglamento. Por privacidad no se pide DNI ni IBAN inicialmente, aunque será obligatorio facilitarlos ante premios mayores a 2.000 €.
            </p>
            <p>
              <strong className="text-[#0A2540]">3.2. Orden Cronológico Inalterable:</strong> Las vacantes se asignan por orden estricto del sello de tiempo con milisegundos registrado en el alta.
            </p>
            <p>
              <strong className="text-[#0A2540]">3.3. Exclusión por Falta de Pago:</strong> Si un titular no abona la renovación antes de finalizar la jornada 9, causará baja definitiva tras la jornada 10.
            </p>
            <p>
              <strong className="text-[#0A2540]">3.4. Plazo Estricto de 24 Horas para Suplentes:</strong> El aspirante notificado dispondrá de <strong>24 horas exactas</strong> para abonar los 10,00 € del ciclo.
            </p>
            <p>
              <strong className="text-[#0A2540]">3.5. Ampliación y Salto de Nivel:</strong> Si los suplentes alcanzan el siguiente cupo oficial, el Administrador evaluará y aprobará manualmente el salto de nivel antes de finalizar el ciclo vigente.
            </p>
          </div>
        </section>

        {/* Art 4 */}
        <section className="space-y-3 border-b border-slate-200 pb-6">
          <div className="flex items-center gap-3 text-[#0A2540]">
            <UserX className="w-6 h-6 text-[#FF6B00] shrink-0" />
            <h2 className="text-xl sm:text-2xl font-black font-serif">
              Artículo 4. Bajas, Antigüedad y Régimen de Fallecimiento
            </h2>
          </div>
          <div className="space-y-3 text-base sm:text-lg text-slate-700 leading-relaxed">
            <p>
              <strong className="text-[#0A2540]">4.1. Pérdida de Derechos por Baja:</strong> Toda baja extingue la condición de socio y la antigüedad acumulada. Para reingresar habrá que situarse al final de la cola.
            </p>
            <p>
              <strong className="text-[#0A2540]">4.2. No Heredabilidad de la Plaza:</strong> En caso de fallecimiento, <strong>la plaza no se hereda</strong>.
            </p>
            <p>
              <strong className="text-[#0A2540]">4.3. Liquidación a Herederos Legales:</strong> La plaza pasará al primer suplente al terminar el ciclo abonado y la parte neta de cualquier premio obtenido en dicho ciclo se entregará a sus herederos legales.
            </p>
          </div>
        </section>

        {/* Art 5 */}
        <section className="space-y-3">
          <div className="flex items-center gap-3 text-[#0A2540]">
            <Trophy className="w-6 h-6 text-[#FF6B00] shrink-0" />
            <h2 className="text-xl sm:text-2xl font-black font-serif">
              Artículo 5. Reparto de Premios Menores vs Mayores
            </h2>
          </div>
          <div className="space-y-4 text-base sm:text-lg text-slate-700 leading-relaxed">
            <div className="p-4 sm:p-5 bg-[#F4F6F9] border border-slate-200 rounded-2xl space-y-1.5">
              <strong className="text-[#0A2540] font-extrabold block">
                5.1. Premios Menores (hasta 2.000,00 €):
              </strong>
              <p>
                Se acumularán íntegramente en el <strong>Fondo Común de la peña</strong>.
              </p>
            </div>

            <div className="p-4 sm:p-5 bg-orange-50 border border-orange-200 rounded-2xl space-y-1.5">
              <strong className="text-[#0A2540] font-extrabold block">
                5.2. Premios Mayores (superiores a 2.000,00 €):
              </strong>
              <p>
                Se tramitan en entidad bancaria presentando el DNI de todos los socios activos. La entidad retendrá el 20 % sobre el exceso de 40.000,00 € y transferirá la parte neta al IBAN individual, asumiendo cada socio los posibles gastos bancarios de su transferencia.
              </p>
            </div>
          </div>
        </section>

        {/* ANEXO OFICIAL */}
        <section className="pt-6 border-t border-slate-200">
          <MultipleBetsGuide />
        </section>
      </div>
    </div>
  );
};
