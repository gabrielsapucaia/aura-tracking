import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

const DEBUG = false;
const DEFAULT_DESTINATION = "/dashboard";

function buildLoginUrl(origin: string, redirectTo: string) {
  const loginUrl = new URL("/login", origin);
  loginUrl.searchParams.set("redirectTo", redirectTo || DEFAULT_DESTINATION);
  return loginUrl;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const origin = url.origin;
  const code = url.searchParams.get("code");
  const redirectParam = url.searchParams.get("redirectTo") ?? url.searchParams.get("redirect_to") ?? DEFAULT_DESTINATION;
  const destination = redirectParam.startsWith("/") ? redirectParam : DEFAULT_DESTINATION;

  if (DEBUG) {
    console.log("[auth/callback] request", {
      url: request.url,
      hasCode: Boolean(code),
      destination,
    });
  }

  if (!code) {
    const loginUrl = buildLoginUrl(origin, destination);
    return NextResponse.redirect(loginUrl);
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  const authCookies = (await cookies())
    .getAll()
    .filter((cookie) => cookie.name.startsWith("sb-"))
    .map((cookie) => cookie.name);

  if (DEBUG) {
    console.log("[auth/callback] exchange result", {
      error: error?.message,
      cookies: authCookies,
    });
  }

  if (error) {
    const loginUrl = buildLoginUrl(origin, destination);
    loginUrl.hash = `error=${encodeURIComponent(error.message)}`;
    return NextResponse.redirect(loginUrl);
  }

  const targetUrl = new URL(destination, origin);
  return NextResponse.redirect(targetUrl);
}
