import React from 'react';
import { Layers, CheckCircle2, ShieldCheck, Sparkles, TrendingUp, Info } from 'lucide-react';

export interface MultipleBetOption {
  type: string;
  numbersCount: number;
  label: string;
  betsGenerated: number;
  totalCost: number;
  description: string;
  idealFor: string;
  prizeMultiplierTip: string;
}

export const OFFICIAL_MULTIPLE_BETS_LIST: MultipleBetOption[] = [
  {
    type: 'MULTIPLE_5',
    numbersCount: 5,
    label: 'Múltiple de 5 números',
    betsGenerated: 44,
    totalCost: 44.0,
    description: 'Marcas 5 números en el boleto. El sistema genera 44 apuestas combinando tus 5 números elegidos con cada uno de los 44 números restantes.',
    idealFor: 'Peñas de 44 socios (1,00 € por participante exacto)',
    prizeMultiplierTip: 'Si aciertas 5 números de la combinación ganadora, ¡obtienes 44 premios directos de 5ª categoría (4 aciertos) acumulados!',
  },
  {
    type: 'MULTIPLE_7',
    numbersCount: 7,
    label: 'Múltiple de 7 números',
    betsGenerated: 7,
    totalCost: 7.0,
    description: 'Marcas 7 números en el bloque principal. Equivale a jugar 7 apuestas simples combinadas.',
    idealFor: 'Grupos pequeños de 7 socios (1,00 € por participante)',
    prizeMultiplierTip: 'Con 6 aciertos entre tus 7 números, obtienes 1 premio de 1ª Categoría (6 aciertos) y 6 premios de 3ª Categoría (5 aciertos).',
  },
  {
    type: 'MULTIPLE_8',
    numbersCount: 8,
    label: 'Múltiple de 8 números',
    betsGenerated: 28,
    totalCost: 28.0,
    description: 'Marcas 8 números en el bloque. El terminal genera 28 combinaciones de 6 números.',
    idealFor: 'Peñas medianas de 28 socios',
    prizeMultiplierTip: 'Con 5 aciertos obtienes 3 premios de 3ª Categoría (5 aciertos) y 15 premios de 4ª Categoría (4 aciertos).',
  },
  {
    type: 'MULTIPLE_9',
    numbersCount: 9,
    label: 'Múltiple de 9 números',
    betsGenerated: 84,
    totalCost: 84.0,
    description: 'Marcas 9 números en el bloque. Equivale a 84 apuestas simples combinadas en un resguardo oficial.',
    idealFor: 'Peñas grandes de 84 socios o 42 socios a 2€/semana',
    prizeMultiplierTip: 'Con 6 aciertos multiplicas: 1 premio de 6 aciertos + 18 premios de 5 aciertos + 45 premios de 4 aciertos.',
  },
  {
    type: 'MULTIPLE_10',
    numbersCount: 10,
    label: 'Múltiple de 10 números',
    betsGenerated: 210,
    totalCost: 210.0,
    description: 'Marcas 10 números en el bloque oficial. Genera 210 apuestas directas.',
    idealFor: 'Peñas muy numerosas o ciclos con bolsa acumulada',
    prizeMultiplierTip: 'Multiplicación exponencial de premios menores y categorías intermedias.',
  },
  {
    type: 'MULTIPLE_11',
    numbersCount: 11,
    label: 'Múltiple de 11 números',
    betsGenerated: 462,
    totalCost: 462.0,
    description: 'Marcas 11 números en el bloque oficial. Genera 462 apuestas simples.',
    idealFor: 'Sorteos especiales con botes millonarios extraordinarios',
    prizeMultiplierTip: 'Máxima cobertura matemática autorizada por el organismo regulador SELAE.',
  },
];

export const MultipleBetsGuide: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Cabecera */}
      <div className="rounded-2xl bg-gradient-to-r from-[#0d253f] to-[#163B61] p-5 sm:p-6 text-white shadow-md">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-white/10 text-amber-400">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-serif font-black text-lg sm:text-xl">
              Opciones Oficiales de Apuestas Múltiples (SELAE)
            </h3>
            <p className="text-xs text-slate-300 mt-0.5">
              Reglamento oficial de Loterías y Apuestas del Estado para La Primitiva
            </p>
          </div>
        </div>
        <p className="text-xs text-slate-200 mt-3 leading-relaxed">
          Las apuestas múltiples permiten marcar más (o menos, en el caso de 5) números en el boleto oficial. Al sellarse en el terminal de lotería, el sistema genera automáticamente todas las combinaciones posibles de 6 números. En la Peña Tordueles, el tipo de apuesta múltiple se adapta al presupuesto exacto de los socios participantes (a razón de 1,00 € por semana).
        </p>
      </div>

      {/* Grid de opciones */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {OFFICIAL_MULTIPLE_BETS_LIST.map(opt => (
          <div
            key={opt.type}
            className="rounded-2xl bg-white border border-slate-200 p-5 shadow-xs hover:border-blue-400 transition flex flex-col justify-between space-y-4"
          >
            <div className="space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <span className="font-bold text-sm text-[#0d253f]">{opt.label}</span>
                <span className="px-2.5 py-0.5 rounded-lg bg-blue-50 text-blue-900 border border-blue-200 font-extrabold text-xs font-mono">
                  {opt.totalCost.toFixed(2)} €
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-600">
                <span className="font-semibold text-slate-800">Números marcados:</span>
                <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                  {opt.numbersCount} números
                </span>
                <span className="text-slate-400">•</span>
                <span className="font-bold text-slate-700">{opt.betsGenerated} apuestas</span>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">{opt.description}</p>
            </div>

            <div className="pt-3 border-t border-slate-100 space-y-2 text-[11px]">
              <div className="flex items-start gap-1.5 text-blue-950">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-700 shrink-0 mt-0.5" />
                <span>
                  <strong>Ajuste peña:</strong> {opt.idealFor}.
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/70 text-amber-900">
                <div className="flex items-start gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
                  <span className="leading-tight">
                    <strong>Multiplicador de premio:</strong> {opt.prizeMultiplierTip}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Explicación del Art. 2 del Reglamento */}
      <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 sm:p-5 text-xs text-slate-700 space-y-2">
        <div className="flex items-center gap-2 font-bold text-slate-900">
          <Info className="w-4 h-4 text-blue-900" />
          <span>Regla de Neutralidad y Juego Limpio (Art. 2.2 del Reglamento):</span>
        </div>
        <p className="leading-relaxed">
          En la Peña Tordueles, las combinaciones de la apuesta múltiple autorizada se generan de forma <strong>100% aleatoria mediante terminal oficial</strong> en cada sorteo semanal. Nunca se juega una combinación fija personal, garantizando igualdad absoluta, transparencia y neutralidad para todos los vecinos y participantes de la peña.
        </p>
      </div>
    </div>
  );
};
