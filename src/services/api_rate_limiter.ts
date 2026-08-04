/**
 * Servicio de control de cuotas y límite de uso de API por cuenta de usuario (Daily Rate Limiter).
 * Permite limitar las llamadas a APIs externas e IA a una cuota máxima diaria por cuenta.
 */

export const DEFAULT_DAILY_API_LIMIT = 50;

export interface ApiUsageStatus {
  count: number;
  limit: number;
  remaining: number;
  date: string;
}

export interface ApiCheckResult {
  allowed: boolean;
  count: number;
  remaining: number;
  message?: string;
}

function getTodayKeyDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getStorageKey(userId?: string): string {
  const accountId = userId && userId.trim() ? userId.trim() : 'anon_user';
  return `callaycome_api_usage_${accountId}`;
}

/**
 * Obtiene el estado actual de consumo de llamadas a la API del día de hoy.
 */
export function getDailyUsage(userId?: string, limit: number = DEFAULT_DAILY_API_LIMIT): ApiUsageStatus {
  const today = getTodayKeyDate();
  const key = getStorageKey(userId);

  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.date === today && typeof parsed.count === 'number') {
        const remaining = Math.max(0, limit - parsed.count);
        return {
          count: parsed.count,
          limit,
          remaining,
          date: today
        };
      }
    }
  } catch (e) {
    console.error('Error al leer consumo de API de localStorage:', e);
  }

  return {
    count: 0,
    limit,
    remaining: limit,
    date: today
  };
}

/**
 * Comprueba e incrementa el contador de consumo de API para el usuario.
 * @throws Error si se ha superado el límite diario permitido.
 */
export function checkAndIncrementApiLimit(
  userId?: string,
  limit: number = DEFAULT_DAILY_API_LIMIT
): ApiCheckResult {
  const usage = getDailyUsage(userId, limit);

  if (usage.count >= limit) {
    const msg = `Has alcanzado el límite diario de llamadas a la API (${limit} llamadas/día). Inténtalo de nuevo mañana.`;
    return {
      allowed: false,
      count: usage.count,
      remaining: 0,
      message: msg
    };
  }

  const newCount = usage.count + 1;
  const key = getStorageKey(userId);
  const today = getTodayKeyDate();

  try {
    localStorage.setItem(key, JSON.stringify({
      date: today,
      count: newCount
    }));
  } catch (e) {
    console.error('Error al guardar consumo de API en localStorage:', e);
  }

  const remaining = Math.max(0, limit - newCount);

  return {
    allowed: true,
    count: newCount,
    remaining
  };
}

/**
 * Reinicia el contador diario de API (para pruebas o reseteo administrativo).
 */
export function resetDailyUsage(userId?: string): void {
  const key = getStorageKey(userId);
  try {
    localStorage.removeItem(key);
  } catch {}
}
