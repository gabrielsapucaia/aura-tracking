"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerClient } from "@supabase/ssr";

export async function signOutAction() {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options) {
          try {
            cookieStore.set(name, value, options);
          } catch {
            // Ignore cookie errors in server actions
          }
        },
        remove(name: string, options) {
          try {
            cookieStore.set(name, "", { ...options, maxAge: 0 });
          } catch {
            // Ignore cookie errors in server actions
          }
        },
      },
    }
  );

  await supabase.auth.signOut();
  
  // Force remove all Supabase cookies
  const allCookies = cookieStore.getAll();
  for (const cookie of allCookies) {
    if (cookie.name.startsWith("sb-")) {
      try {
        cookieStore.set(cookie.name, "", { maxAge: 0, path: "/" });
      } catch {
        // Ignore cookie errors in server actions
      }
    }
  }
  
  // Also try to delete the specific auth token cookie
  try {
    cookieStore.set("sb-nucqowewuqeveocmsdnq-auth-token", "", { maxAge: 0, path: "/" });
  } catch {
    // Ignore cookie errors in server actions
  }
  
  redirect("/login");
}
