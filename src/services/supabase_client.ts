import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabase_url: string = (import.meta.env.VITE_SUPABASE_URL as string) || '';
let supabase_anon_key: string = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || '';

if (typeof window !== 'undefined') {
  const is_native = (window as any).Capacitor !== undefined && (window as any).Capacitor.isNativePlatform();
  if (!is_native) {
    const saved_url: string | null = localStorage.getItem('supabase_url');
    const saved_key: string | null = localStorage.getItem('supabase_key');
    if (saved_url && saved_url.startsWith('http') && saved_url !== 'undefined' && saved_url !== 'null') {
      supabase_url = saved_url;
    }
    if (saved_key && saved_key !== 'undefined' && saved_key !== 'null' && saved_key.length > 20) {
      supabase_anon_key = saved_key;
    }
  }
}

let supabase_client: SupabaseClient | null = null;

if (supabase_url && supabase_anon_key) {
  try {
    supabase_client = createClient(supabase_url, supabase_anon_key);
  } catch (error) {
    console.error(error);
  }
}

export const get_supabase_client = (): SupabaseClient | null => {
  return supabase_client;
};

export const update_supabase_config = (url: string, key: string): boolean => {
  if (!url || !key) {
    return false;
  }
  localStorage.setItem('supabase_url', url);
  localStorage.setItem('supabase_key', key);
  try {
    supabase_client = createClient(url, key);
    supabase_url = url;
    supabase_anon_key = key;
    return true;
  } catch (error) {
    console.error(error);
    supabase_client = null;
    return false;
  }
};

export const clear_supabase_config = (): void => {
  localStorage.removeItem('supabase_url');
  localStorage.removeItem('supabase_key');
  supabase_url = '';
  supabase_anon_key = '';
  supabase_client = null;
};

export const is_supabase_configured = (): boolean => {
  return !!supabase_client && !!supabase_url && !!supabase_anon_key;
};
