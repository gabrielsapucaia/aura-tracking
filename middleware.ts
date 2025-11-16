import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

const DEBUG = false;

export async function middleware(req: NextRequest) {
  const url = new URL(req.url);
  const isPrivate =
    url.pathname.startsWith("/admin") ||
    url.pathname === "/dashboard" ||
    url.pathname === "/settings";

  if (!isPrivate) return NextResponse.next();

  const response = NextResponse.next();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value;
        },
        set(name: string, value: string, options) {
          req.cookies.set({
            name,
            value,
            ...options,
          });
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options) {
          req.cookies.set({
            name,
            value: "",
            ...options,
          });
          response.cookies.set({
            name,
            value: "",
            ...options,
          });
        },
      },
    }
  );

  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (DEBUG) {
    const cookies = req.cookies.getAll().filter((c) => c.name.startsWith("sb-"));
    console.log("[middleware]", {
      pathname: url.pathname,
      hasSession: Boolean(session),
      userEmail: session?.user?.email,
      error: error?.message,
      cookieCount: cookies.length,
      cookieNames: cookies.map((c) => c.name),
    });
  }

  if (!session) {
    const loginUrl = new URL("/login", req.url);
    const redirectTo = url.pathname + url.search;
    loginUrl.searchParams.set("redirectTo", redirectTo || "/dashboard");
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*", "/dashboard", "/settings"],
};
