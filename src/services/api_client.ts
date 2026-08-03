/**
 * Client HTTP robusto con reintentos exponenciales automáticos y toasting de errores.
 */
export async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  retries: number = 3,
  delayMs: number = 1000
): Promise<Response> {
  let attempt = 0;

  while (attempt < retries) {
    try {
      const response = await fetch(url, options);
      if (response.ok || response.status < 500) {
        return response;
      }
      attempt++;
      if (attempt < retries) {
        await new Promise(res => setTimeout(res, delayMs * Math.pow(2, attempt - 1)));
      } else {
        return response;
      }
    } catch (error) {
      attempt++;
      if (attempt < retries) {
        await new Promise(res => setTimeout(res, delayMs * Math.pow(2, attempt - 1)));
      } else {
        throw error;
      }
    }
  }

  throw new Error(`Fallo tras ${retries} reintentos al conectar con ${url}`);
}

/**
 * Convierte claves en formato snake_case a camelCase de manera transparente.
 */
export function keysToCamelCase<T>(obj: any): T {
  if (Array.isArray(obj)) {
    return obj.map(v => keysToCamelCase(v)) as unknown as T;
  } else if (obj !== null && obj.constructor === Object) {
    return Object.keys(obj).reduce((result, key) => {
      const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      result[camelKey] = keysToCamelCase(obj[key]);
      return result;
    }, {} as any) as T;
  }
  return obj as T;
}
