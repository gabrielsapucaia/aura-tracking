"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerClient } from "@supabase/ssr";

export async function signInAction(email: string, password: string, redirectTo: string = "/dashboard") {
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

  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password: password.trim(),
  });

  if (error || !data.session) {
    return { error: error?.message ?? "Não foi possível iniciar a sessão." };
  }
  
  // Redirect will throw, so this won't return
  redirect(redirectTo);
}

export async function signUpAction(email: string, password: string) {
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

  const fallbackOrigin = process.env.NEXT_PUBLIC_SITE_URL;
  if (!fallbackOrigin) {
    return { error: "URL base não configurada." };
  }

  const siteUrl = fallbackOrigin.endsWith("/") ? fallbackOrigin.slice(0, -1) : fallbackOrigin;

  const { error } = await supabase.auth.signUp({
    email: email.trim(),
    password: password.trim(),
    options: {
      emailRedirectTo: `${siteUrl}/auth/callback`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  return { success: "Cadastro iniciado. Verifique o seu e-mail para confirmar a conta." };
}
