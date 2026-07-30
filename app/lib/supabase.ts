import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// These are public browser credentials, not database secrets. Keeping the
// Davo project defaults here ensures static hosts can initialise Supabase even
// when NEXT_PUBLIC values are unavailable during their build step.
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  "https://dtofdcgyckvseopmkrsj.supabase.co";
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  "sb_publishable_Xv00XK0zO61bqKf0RrxSdw_hcuOthTi";

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;
