"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Image from "next/image";
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
    <header className="flex h-16 items-center justify-between border-b border-border bg-card px-6 shadow-sm">
      <div className="flex items-center gap-3">
        <Image src="/aura-tracking-logo.svg" alt="Aura Tracking logo" width={150} height={40} priority />
        <span className="sr-only">Aura Tracking</span>
      </div>
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <span className="hidden rounded-full bg-accent/20 px-2 py-0.5 text-xs font-semibold uppercase tracking-widest text-accent md:inline">
          v0.1.0
        </span>
        <span className="text-foreground">{userEmail ?? "—"}</span>
        <Button variant="outline" size="sm" disabled={isPending} onClick={handleSignOut}>
          {isPending ? "Saindo..." : "Sair"}
        </Button>
      </div>
    </header>
  );
}
