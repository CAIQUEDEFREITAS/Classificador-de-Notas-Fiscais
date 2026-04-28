import { createClient, SupabaseClient } from "@supabase/supabase-js";

// ─── Singleton do Supabase (server-side) ──────────────────────────────────────
// Evita criar uma nova instância a cada request

let _supabase: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    console.warn("Supabase não configurado — variáveis de ambiente ausentes.");
    return null;
  }

  if (!_supabase) {
    _supabase = createClient(url, key);
  }

  return _supabase;
}
