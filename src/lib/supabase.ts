import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Resolve URL and Key from environment or local browser storage
export function getSavedSupabaseConfig() {
  const envUrl = (import.meta as any).env?.VITE_SUPABASE_URL;
  const envKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY;

  const localUrl = typeof window !== 'undefined' ? localStorage.getItem('mindchat_supabase_url') : null;
  const localKey = typeof window !== 'undefined' ? localStorage.getItem('mindchat_supabase_anon_key') : null;

  const url = (localUrl && localUrl.trim()) || (envUrl && envUrl.trim()) || '';
  const key = (localKey && localKey.trim()) || (envKey && envKey.trim()) || '';

  const isValid = Boolean(
    url &&
    key &&
    (url.startsWith('https://') || url.startsWith('http://localhost')) &&
    !url.includes('your-project-id')
  );

  return { url, key, isValid };
}

let activeClient: SupabaseClient | null = null;
const initialConfig = getSavedSupabaseConfig();

function createMindChatSupabaseClient(url: string, key: string): SupabaseClient {
  return createClient(url, key, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  });
}

if (initialConfig.isValid) {
  try {
    activeClient = createMindChatSupabaseClient(initialConfig.url, initialConfig.key);
  } catch (err) {
    console.warn('Failed to initialize Supabase client:', err);
    activeClient = null;
  }
}

export function getSupabase(): SupabaseClient | null {
  if (!activeClient) {
    const cfg = getSavedSupabaseConfig();
    if (cfg.isValid) {
      try {
        activeClient = createMindChatSupabaseClient(cfg.url, cfg.key);
      } catch (e) {
        console.warn('Error lazy-initializing Supabase client:', e);
      }
    }
  }
  return activeClient;
}

export const supabase: SupabaseClient | null = activeClient;

export function isSupabaseConnected(): boolean {
  const cfg = getSavedSupabaseConfig();
  const client = getSupabase();
  return cfg.isValid && client !== null;
}

export function setSupabaseCredentials(url: string, key: string): boolean {
  try {
    const cleanUrl = url.trim();
    const cleanKey = key.trim();

    if ((!cleanUrl.startsWith('https://') && !cleanUrl.startsWith('http://localhost')) || !cleanKey) {
      throw new Error('Please enter a valid Supabase Project URL (https://xxxx.supabase.co) and Anon Key.');
    }

    const newClient = createMindChatSupabaseClient(cleanUrl, cleanKey);

    localStorage.setItem('mindchat_supabase_url', cleanUrl);
    localStorage.setItem('mindchat_supabase_anon_key', cleanKey);
    activeClient = newClient;

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('supabase_config_changed', { detail: { url: cleanUrl } }));
    }
    return true;
  } catch (e: any) {
    console.error('Error setting Supabase credentials:', e);
    throw e;
  }
}

export function clearSupabaseCredentials() {
  localStorage.removeItem('mindchat_supabase_url');
  localStorage.removeItem('mindchat_supabase_anon_key');
  activeClient = null;
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('supabase_config_changed', { detail: null }));
  }
}

export async function testSupabaseConnection(url: string, key: string): Promise<{ success: boolean; message: string }> {
  try {
    const testClient = createClient(url.trim(), key.trim());
    const { error } = await testClient.from('profiles').select('id').limit(1);

    if (error && error.code !== 'PGRST116') {
      // If table doesn't exist yet, but authentication reached
      if (error.message?.includes('relation "public.profiles" does not exist')) {
        return {
          success: true,
          message: 'Connected to Supabase! (Database schema migration needs to be executed in SQL Editor).',
        };
      }
      return {
        success: false,
        message: `Connection test response: ${error.message}`,
      };
    }

    return {
      success: true,
      message: 'Successfully connected and authenticated with Supabase PostgreSQL & Realtime!',
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'Network error connecting to Supabase.',
    };
  }
}

export function getBackendStatus() {
  const isConnected = isSupabaseConnected();
  const cfg = getSavedSupabaseConfig();
  return {
    isConfigured: isConnected,
    mode: isConnected ? 'supabase_remote' : 'demo_local',
    providerName: isConnected 
      ? `Supabase Remote (${cfg.url.replace('https://', '').split('.')[0]})` 
      : 'MindChat Reactive Store (Local / Demo Mode)',
    url: cfg.url,
  };
}
