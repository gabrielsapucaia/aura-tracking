import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
}

let browserClient: SupabaseClient | null = null;

export function getSupabaseBrowserClient() {
  if (!browserClient) {
    browserClient = createClient(url!, anonKey!, {
      auth: {
        detectSessionInUrl: true,
        persistSession: true,
      },
    });
  }
  return browserClient;
}
