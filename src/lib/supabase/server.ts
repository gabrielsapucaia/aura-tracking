import { createSupabaseServerClient } from "@/lib/supabaseServer";

export async function getSupabaseServerClient() {
  return createSupabaseServerClient();
}
