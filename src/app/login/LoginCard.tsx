"use client";

import { FormEvent, useCallback, useMemo, useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signInAction, signUpAction } from "./actions";

export function LoginCard() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const destination = useMemo(() => {
    const redirectTo = searchParams?.get("redirectTo") ?? undefined;
    return redirectTo && redirectTo.startsWith("/") ? redirectTo : "/dashboard";
  }, [searchParams]);

  const validateCredentials = useCallback(() => {
    if (!email.trim()) {
      return "Informe um e-mail válido.";
    }
    if (password.trim().length < 6) {
      return "A senha deve ter ao menos 6 caracteres.";
    }
    return null;
  }, [email, password]);

  const handleSignIn = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setError(null);
      setInfo(null);
      const validationError = validateCredentials();
      if (validationError) {
        setError(validationError);
        return;
      }

      startTransition(async () => {
        const result = await signInAction(email, password, destination);
        if (result?.error) {
          setError(result.error);
        }
        // If successful, signInAction will redirect
      });
    },
    [destination, email, password, validateCredentials]
  );

  const handleSignUp = useCallback(async () => {
    setError(null);
    setInfo(null);
    const validationError = validateCredentials();
    if (validationError) {
      setError(validationError);
      return;
    }

    startTransition(async () => {
      const result = await signUpAction(email, password);
      if (result.error) {
        setError(result.error);
      } else if (result.success) {
        setInfo(result.success);
      }
    });
  }, [email, password, validateCredentials]);

  return (
    <div className="mx-auto w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-8 text-white shadow-2xl backdrop-blur">
      <div className="mb-6 text-center">
        <p className="text-xs uppercase tracking-[0.35em] text-white/60">Aura Tracking</p>
        <h1 className="text-2xl font-semibold">Painel operacional</h1>
        <p className="mt-2 text-sm text-white/70">Entre com seu e-mail corporativo.</p>
      </div>

      <form className="space-y-4" onSubmit={handleSignIn} noValidate>
        <div className="space-y-2">
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="voce@empresa.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            disabled={isPending}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Senha</Label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            disabled={isPending}
            required
          />
        </div>

        <Button type="submit" disabled={isPending} className="flex w-full items-center justify-center gap-2 bg-white text-slate-900 hover:bg-white/90">
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          <span>{isPending ? "Entrando..." : "Entrar"}</span>
        </Button>
      </form>

      <Button
        type="button"
        variant="ghost"
        disabled={isPending}
        onClick={handleSignUp}
        className="mt-4 w-full text-white hover:bg-white/10"
      >
        {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        <span>Criar nova conta</span>
      </Button>

      {error ? <p className="mt-4 text-center text-sm text-red-300">{error}</p> : null}
      {info ? <p className="mt-2 text-center text-sm text-emerald-300">{info}</p> : null}
    </div>
  );
}
