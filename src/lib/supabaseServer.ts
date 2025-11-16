import { cookies as nextCookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

/**
 * Server-side Supabase client for RSC and route handlers.
 * Uses Next 16 cookies() correctly by awaiting the store before access.
 */
export async function createSupabaseServerClient() {
  const store = await nextCookies();

  const safeSet = (name: string, value: string, options?: CookieOptions) => {
    try {
      if (typeof (store as unknown as Record<string, unknown>).set === "function") {
        (store as unknown as { set: (name: string, value: string, options?: CookieOptions) => void }).set(
          name,
          value,
          options
        );
      }
    } catch {
      // ignore when not in a mutable context
    }
  };

  const safeDelete = (name: string, options?: CookieOptions) => {
    try {
      if (typeof (store as unknown as Record<string, unknown>).delete === "function") {
        (store as unknown as { delete: (name: string, options?: CookieOptions) => void }).delete(name, options);
      } else if (typeof (store as unknown as Record<string, unknown>).set === "function") {
        (store as unknown as { set: (name: string, value: string, options?: CookieOptions) => void }).set(name, "", {
          ...options,
          maxAge: 0,
        });
      }
    } catch {
      // ignore when not in a mutable context
    }
  };

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return store.get(name)?.value;
        },
        set(name: string, value: string, options?: CookieOptions) {
          safeSet(name, value, options);
        },
        remove(name: string, options?: CookieOptions) {
          safeDelete(name, options);
        },
      },
    }
  );
}
