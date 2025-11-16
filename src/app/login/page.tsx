import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { LoginCard } from "./LoginCard";

type LoginPageProps = {
  searchParams?:
    | {
        redirectTo?: string;
      }
    | Promise<{
        redirectTo?: string;
      }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const resolvedSearchParams = await searchParams;

  const destination = resolvedSearchParams?.redirectTo && resolvedSearchParams.redirectTo.startsWith("/")
    ? resolvedSearchParams.redirectTo
    : "/dashboard";

  if (session) {
    redirect(destination);
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-slate-950 px-4 py-10 text-white">
      <div className="absolute inset-0 bg-linear-to-br from-indigo-500/30 via-slate-900 to-slate-950" aria-hidden></div>
      <div className="relative z-10 w-full max-w-lg">
        <LoginCard />
      </div>
    </div>
  );
}
