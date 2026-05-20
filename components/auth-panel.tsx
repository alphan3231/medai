"use client";

import { type FormEvent, useMemo, useState } from "react";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";

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
    <section className="glass-panel grain relative w-full max-w-md overflow-hidden rounded-[2rem] p-8">
      <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-[#245946]/30 to-transparent" />
      <div className="space-y-6">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#245946]">{t.intakeBadge}</p>
          <h1 className="font-[var(--font-display)] text-4xl leading-tight text-[#182018]">{t.authTitle}</h1>
          <p className="text-sm leading-6 text-[#5c665d]">{t.authSubtitle}</p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-[0.2em] text-[#5c665d]" htmlFor="email">
              {t.emailLabel}
            </label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-[0.2em] text-[#5c665d]" htmlFor="password">
              {t.passwordLabel}
            </label>
            <Input
              id="password"
              type="password"
              autoComplete={mode === "sign-up" ? "new-password" : "current-password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              minLength={6}
              required
            />
          </div>

          {error ? <p className="rounded-2xl bg-[#b4533f]/10 px-4 py-3 text-sm text-[#8f3e2f]">{error}</p> : null}

          <Button className="w-full" disabled={busy} type="submit">
            {busy ? t.sending : mode === "sign-up" ? t.signUp : t.signIn}
          </Button>
        </form>

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
