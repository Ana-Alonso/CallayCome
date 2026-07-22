import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPERMARKET_SUPABASE_URL = import.meta.env.VITE_SUPERMARKET_SUPABASE_URL || '';
const SUPERMARKET_SUPABASE_ANON_KEY = import.meta.env.VITE_SUPERMARKET_SUPABASE_ANON_KEY || '';
const SUPERMARKET_API_BASE_URL = import.meta.env.VITE_SUPERMARKET_API_BASE_URL || '';

// Create a secondary Supabase client specifically for the SuperMarketAPI project.
// We use a custom localStorage key prefix to avoid conflicts with the main app's Supabase session.
export const supermarketSupabase: SupabaseClient = createClient(
  SUPERMARKET_SUPABASE_URL,
  SUPERMARKET_SUPABASE_ANON_KEY,
  {
    auth: {
      storageKey: 'supermarket_supabase_session',
      persistSession: true,
      autoRefreshToken: true,
    }
  }
);

export interface SuperMarketProduct {
  referencia_id: string;
  nombre: string;
  precio: number;
  supermercado: string;
  last_seen: string;
  categoria_nombre?: string;
}

/**
 * Gets a valid access token for the SuperMarketAPI.
 * If the current user has a session, it uses it.
 * If not, it falls back to the test user login.
 */
async function getAccessToken(): Promise<string | null> {
  try {
    const { data: { session } } = await supermarketSupabase.auth.getSession();
    return session?.access_token ?? null;
  } catch {
    return null;
  }
}


/**
 * Search products in the SuperMarket database.
 * If products are found in the Supabase DB directly, it returns them (fast and CORS-friendly).
 * If no products are found in the DB, it falls back to calling the Render API REST endpoint
 * to trigger the scraper, scrape new products, save them to the DB, and return them.
 * @param query Search query term (e.g. "leche")
 * @param supermarketId Optional. Search in a specific supermarket (mercadona, carrefour, dia, aldi, eroski)
 */
export async function searchProducts(
  query: string,
  supermarketId?: string
): Promise<SuperMarketProduct[]> {
  if (!query.trim()) return [];

  // 1. Try querying Supabase database directly first (fast, CORS-proof, no Render cold-starts)
  try {
    let q = supermarketSupabase
      .from('productos')
      .select('referencia_id, nombre, precio, supermercado_id, last_seen')
      .ilike('nombre', `%${query.trim()}%`);

    if (supermarketId && supermarketId !== 'todos' && supermarketId !== 'cheapest') {
      q = q.eq('supermercado_id', supermarketId.toLowerCase());
    }

    // Limit to 20 results for auto-complete dropdown responsiveness
    q = q.limit(20);

    const { data, error } = await q;

    if (error) {
      console.warn('Error querying Supabase directly, falling back to Render API:', error.message);
    } else if (data && data.length > 0) {
      // Check if there is a high-quality match in the database
      const queryLower = query.toLowerCase().trim();
      const hasGoodMatch = data.some((item: any) => {
        const nameLower = item.nombre.toLowerCase();
        // Good match if name starts with query, or the query is at the very beginning (index <= 8)
        return nameLower.startsWith(queryLower) || nameLower.indexOf(queryLower) <= 8;
      });

      if (hasGoodMatch) {
        // Products found and at least one is a high-quality match! Return directly.
        return data.map((item: any) => ({
          referencia_id: item.referencia_id,
          nombre: item.nombre,
          precio: Number(item.precio),
          supermercado: item.supermercado_id,
          last_seen: item.last_seen
        }));
      }
      console.log('Products exist in DB but none are a high-quality match. Falling back to Render API scraper...');
    }
  } catch (err) {
    console.warn('Direct database search failed, falling back to Render API:', err);
  }

  // 2. Fallback: If no products found in the database, call Render API to trigger the scraper!
  console.log('No products found in DB. Falling back to Render API to trigger scraper...');
  const token = await getAccessToken();
  if (!token) {
    throw new Error('No se pudo establecer conexión autenticada con la API para iniciar el raspado.');
  }

  const cleanQuery = encodeURIComponent(query.trim());
  let url = `${SUPERMARKET_API_BASE_URL}/supermercados/search?q=${cleanQuery}`;
  if (supermarketId && supermarketId !== 'todos' && supermarketId !== 'cheapest') {
    url = `${SUPERMARKET_API_BASE_URL}/supermercados/${supermarketId.toLowerCase()}/search?q=${cleanQuery}`;
  }

  // Use a CORS proxy to bypass CORS restrictions during browser testing/development
  const corsProxyUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;

  let response: Response;
  try {
    response = await fetch(corsProxyUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });
  } catch (err: any) {
    console.error('Fetch to Render API via CORS proxy failed:', err);
    throw new Error(
      'Error de Conexión: No se pudo contactar con la API de Render a través del proxy CORS. ' +
      'Por favor, comprueba tu conexión a internet o la disponibilidad del servidor de Render.'
    );
  }

  if (!response.ok) {
    if (response.status === 429) {
      throw new Error('Límite de peticiones de la API superado (Rate Limit). Inténtalo más tarde.');
    }
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData?.error?.description || 'Error al consultar la API de supermercados.');
  }

  const json = await response.json();
  if (json.status === 'success' && Array.isArray(json.data)) {
    return json.data as SuperMarketProduct[];
  }

  return [];
}
