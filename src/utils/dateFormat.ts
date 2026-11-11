/**
 * Utilidades para formateo de sellos de tiempo (timestamps) de alta precisión
 * con fecha, hora, minutos, segundos y centésimas (dos dígitos de milisegundos)
 * para evitar colisiones y dirimir la prelación estricta de inscripción.
 */

export function formatTimestampWithCentiseconds(isoString: string): string {
  if (!isoString) return '-';
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return isoString;

  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();

  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  const milliseconds = String(d.getMilliseconds()).padStart(3, '0');
  const centiseconds = milliseconds.slice(0, 2);

  return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}.${centiseconds}`;
}

/**
 * Devuelve un timestamp ISO actual con milisegundos completos (ej: 2026-11-11T08:12:34.567Z)
 */
export function getPreciseTimestamp(): string {
  return new Date().toISOString();
}
