"use client";

import { type FormEvent, useMemo, useState } from "react";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { LockKeyhole, Mail, ShieldCheck } from "lucide-react";

import { auth } from "@/lib/firebase/client";
import { copy } from "@/lib/i18n";
import type { AppLanguage } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function AuthPanel({
  language,
}: {
  language: AppLanguage;
}) {
  const t = useMemo(() => copy[language], [language]);
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");

    try {
      if (mode === "sign-up") {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch {
      setError(t.authError);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="relative w-full max-w-md overflow-hidden rounded-[2.2rem] border border-[rgba(24,32,24,0.08)] bg-[linear-gradient(180deg,rgba(255,252,247,0.96),rgba(248,244,236,0.94))] p-8 shadow-[0_30px_80px_rgba(22,32,27,0.16)]">
      <div className="absolute inset-x-0 top-0 h-24 bg-[linear-gradient(180deg,rgba(36,89,70,0.16),transparent)]" />
      <div className="absolute -right-10 top-8 h-28 w-28 rounded-full bg-[#245946]/10 blur-3xl" />
      <div className="absolute -left-8 bottom-10 h-24 w-24 rounded-full bg-[#c9794a]/12 blur-3xl" />

      <div className="relative space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(24,32,24,0.08)] bg-white/80 px-3 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-[#245946]">
            <ShieldCheck className="h-4 w-4" />
            {mode === "sign-up" ? t.signUp : t.signIn}
          </div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#748076]">
            {t.appName}
          </p>
        </div>

        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#245946]">{t.intakeBadge}</p>
          <h1 className="font-[var(--font-display)] text-4xl leading-[1.02] text-[#182018]">{t.authTitle}</h1>
          <p className="text-sm leading-6 text-[#5c665d]">{t.authSubtitle}</p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-[0.2em] text-[#5c665d]" htmlFor="email">
              {t.emailLabel}
            </label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#748076]" />
              <Input
                id="email"
                type="email"
                autoComplete="email"
                className="pl-11"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-[0.2em] text-[#5c665d]" htmlFor="password">
              {t.passwordLabel}
            </label>
            <div className="relative">
              <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#748076]" />
              <Input
                id="password"
                type="password"
                autoComplete={mode === "sign-up" ? "new-password" : "current-password"}
                className="pl-11"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                minLength={6}
                required
              />
            </div>
          </div>

          {error ? <p className="rounded-[1.35rem] bg-[#b4533f]/10 px-4 py-3 text-sm text-[#8f3e2f]">{error}</p> : null}

          <Button className="w-full" disabled={busy} size="lg" type="submit">
            {busy ? t.sending : mode === "sign-up" ? t.signUp : t.signIn}
          </Button>
        </form>

        <div className="rounded-[1.6rem] border border-[rgba(24,32,24,0.08)] bg-white/72 p-4 text-sm leading-6 text-[#5c665d]">
          <p className="font-semibold text-[#182018]">Secure entry</p>
          <p className="mt-1">Your chat history stays linked to your account so you can reopen previous intake sessions anytime.</p>
        </div>

        <button
          className="text-sm font-medium text-[#245946] transition hover:text-[#182018]"
          onClick={() => setMode((current) => (current === "sign-in" ? "sign-up" : "sign-in"))}
          type="button"
        >
          {mode === "sign-up" ? t.switchToSignIn : t.switchToSignUp}
        </button>
      </div>
    </section>
  );
}
