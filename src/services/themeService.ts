export type ThemeMode = 'auto' | 'light' | 'dark';

const THEME_STORAGE_KEY = 'primitiva_tordueles_theme_mode';

export function getStoredTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'auto';
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === 'light' || stored === 'dark' || stored === 'auto') {
    return stored;
  }
  return 'auto';
}

export function setStoredTheme(mode: ThemeMode): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(THEME_STORAGE_KEY, mode);
  applyTheme(mode);
}

/**
 * Calcula la hora de amanecer y atardecer astronómica para cada día del año
 * basándose en la latitud de Burgos (42.34° N) y la geometría solar.
 */
function getSunriseSunsetForDate(date: Date = new Date()): { sunriseHour: number; sunsetHour: number } {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  const dayOfYear = Math.floor(diff / oneDay);

  // Declinación solar aproximada
  const declination = 23.45 * Math.sin(((2 * Math.PI) / 365) * (dayOfYear - 81));
  const latRad = (42.34 * Math.PI) / 180;
  const decRad = (declination * Math.PI) / 180;

  const cosHourAngle = -Math.tan(latRad) * Math.tan(decRad);
  const clampedCos = Math.max(-1, Math.min(1, cosHourAngle));
  const hourAngle = Math.acos(clampedCos);
  const halfDayLengthHours = (hourAngle * 180) / Math.PI / 15;

  const solarNoonHour = 13.25; // Mediodía solar local aproximado en Burgos
  const sunriseHour = solarNoonHour - halfDayLengthHours;
  const sunsetHour = solarNoonHour + halfDayLengthHours;

  return {
    sunriseHour: Math.max(5.5, Math.min(9.0, sunriseHour)),
    sunsetHour: Math.max(17.5, Math.min(22.0, sunsetHour))
  };
}

export function isDarkModeActive(mode: ThemeMode): boolean {
  if (mode === 'dark') return true;
  if (mode === 'light') return false;

  // Modo automático: calcula el amanecer y atardecer real del día en curso (Burgos)
  const now = new Date();
  const currentHourDecimal = now.getHours() + now.getMinutes() / 60;
  const { sunriseHour, sunsetHour } = getSunriseSunsetForDate(now);

  // Es de noche (modo oscuro) si la hora actual es anterior al amanecer o posterior al atardecer
  return currentHourDecimal < sunriseHour || currentHourDecimal >= sunsetHour;
}

export function applyTheme(mode: ThemeMode): void {
  if (typeof document === 'undefined') return;
  const isDark = isDarkModeActive(mode);
  const root = document.documentElement;
  if (isDark) {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
}
