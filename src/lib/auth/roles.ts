import { supabaseAdmin } from "@/lib/supabase/admin";
import type { UserRole } from "@/lib/supabase/types";

export async function getUserRole(userId: string): Promise<UserRole> {
  const supabase = supabaseAdmin();
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data?.role ?? "user";
}

export async function setUserRole(userId: string, role: UserRole) {
  const supabase = supabaseAdmin();
  const { error } = await supabase
    .from("user_roles")
    .upsert({ user_id: userId, role })
    .eq("user_id", userId);

  if (error) {
    throw new Error(error.message);
  }
}
