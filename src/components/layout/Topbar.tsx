"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { signOutAction } from "@/app/logout/actions";

export function Topbar() {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    let isMounted = true;
    const fetchUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (isMounted) {
        setUserEmail(user?.email ?? null);
      }
    };

    fetchUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserEmail(session?.user?.email ?? null);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  const handleSignOut = () => {
    startTransition(async () => {
      await signOutAction();
    });
  };

  return (
    <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6 shadow-sm">
      <div className="text-lg font-semibold tracking-tight text-gray-900">Minimal Dashboard</div>
      <div className="flex items-center gap-4 text-sm text-gray-600">
        <span className="hidden text-xs font-semibold uppercase tracking-widest text-gray-500 md:inline">v0.1.0</span>
        <span className="text-gray-700">{userEmail ?? "—"}</span>
        <Button variant="outline" size="sm" disabled={isPending} onClick={handleSignOut}>
          {isPending ? "Saindo..." : "Sair"}
        </Button>
      </div>
    </header>
  );
}
