"use client";

import { useEffect, useState } from "react";
import type { User } from "firebase/auth";
import { onAuthStateChanged } from "firebase/auth";

import { AuthPanel } from "@/components/auth-panel";
import { ChatShell } from "@/components/chat-shell";
import { auth } from "@/lib/firebase/client";
import { copy } from "@/lib/i18n";
import type { AppLanguage } from "@/lib/types";

export function HomeClient() {
  const [language, setLanguage] = useState<AppLanguage>("en");
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <div className="glass-panel rounded-[2rem] px-6 py-5 text-sm text-[#5c665d]">{copy[language].sending}</div>
      </main>
    );
  }

  if (!user) {
    const t = copy[language];

    return (
      <main className="min-h-screen px-4 py-6 md:px-6">
        <div className="mx-auto grid min-h-[calc(100vh-3rem)] max-w-7xl gap-6 lg:grid-cols-[minmax(0,1.1fr)_440px]">
          <section className="glass-panel grain relative overflow-hidden rounded-[2rem] px-8 py-10 md:px-10">
            <div className="absolute -right-12 top-10 h-40 w-40 rounded-full bg-[#245946]/12 blur-3xl" />
            <div className="absolute bottom-6 left-6 h-32 w-32 rounded-full bg-[#c9794a]/14 blur-3xl" />
            <div className="relative max-w-3xl space-y-10">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#245946]">{t.appName}</p>
                  <h1 className="mt-3 font-[var(--font-display)] text-5xl leading-[1.05] text-[#182018]">
                    {t.appTitle}
                  </h1>
                </div>
                <div className="flex items-center gap-2 rounded-full border border-[rgba(24,32,24,0.08)] bg-white/70 p-1">
                  {(["en", "tr"] as const).map((option) => (
                    <button
                      key={option}
                      className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] transition ${
                        language === option ? "bg-[#245946] text-white" : "text-[#5c665d] hover:bg-white"
                      }`}
                      onClick={() => setLanguage(option)}
                      type="button"
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>

              <p className="max-w-2xl text-lg leading-8 text-[#425045]">{t.appSubtitle}</p>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-[1.75rem] border border-[rgba(24,32,24,0.08)] bg-white/72 p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#245946]">01</p>
                  <p className="mt-3 text-base font-semibold text-[#182018]">{t.featureOneTitle}</p>
                  <p className="mt-2 text-sm leading-6 text-[#5c665d]">{t.featureOneBody}</p>
                </div>
                <div className="rounded-[1.75rem] border border-[rgba(24,32,24,0.08)] bg-white/72 p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#245946]">02</p>
                  <p className="mt-3 text-base font-semibold text-[#182018]">{t.featureTwoTitle}</p>
                  <p className="mt-2 text-sm leading-6 text-[#5c665d]">{t.featureTwoBody}</p>
                </div>
                <div className="rounded-[1.75rem] border border-[rgba(24,32,24,0.08)] bg-white/72 p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#245946]">03</p>
                  <p className="mt-3 text-base font-semibold text-[#182018]">{t.featureThreeTitle}</p>
                  <p className="mt-2 text-sm leading-6 text-[#5c665d]">{t.featureThreeBody}</p>
                </div>
              </div>

              <div className="max-w-2xl rounded-[1.75rem] border border-[rgba(24,32,24,0.08)] bg-white/72 px-5 py-4 text-sm leading-6 text-[#5c665d]">
                <span className="font-semibold text-[#182018]">{t.introLabel}:</span> {t.disclaimer}
              </div>
            </div>
          </section>

          <div className="flex items-center justify-center">
            <AuthPanel language={language} />
          </div>
        </div>
      </main>
    );
  }

  return <ChatShell language={language} onLanguageChange={setLanguage} user={user} />;
}
