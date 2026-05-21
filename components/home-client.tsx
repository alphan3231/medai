"use client";

import { useEffect, useState } from "react";
import type { User } from "firebase/auth";
import { onAuthStateChanged } from "firebase/auth";
import { Activity, HeartPulse, Languages, ShieldCheck, Stethoscope } from "lucide-react";

import { AuthPanel } from "@/components/auth-panel";
import { ChatShell } from "@/components/chat-shell";
import { auth } from "@/lib/firebase/client";
import { copy } from "@/lib/i18n";
import type { AppLanguage } from "@/lib/types";

const featureIcons = [Stethoscope, ShieldCheck, Languages] as const;

const welcomeContent = {
  en: {
    heroTitle: "A calmer front door for medical intake.",
    heroParagraphOne:
      "MedAI helps people turn scattered symptoms into a clear intake conversation before a real clinical visit begins. Instead of leaving them alone with a blank text box, it asks focused follow-up questions and keeps the exchange readable from start to finish.",
    heroParagraphTwo:
      "The goal is not to diagnose. The goal is to make the first part of the medical conversation better: calmer, more structured, easier to review, and less likely to miss an important detail.",
    sessionTitle: "Human intake rhythm, not a cold form.",
    sessionBody:
      "The assistant asks focused follow-ups, streams answers live, and keeps the whole thread tied to the patient account.",
    chipOne: "Structured symptom intake",
    chipTwo: "Soft urgent-risk warnings",
    noteTitle: "Built for real sessions",
    noteBody:
      "Open where you left off, stream in place, and keep history readable instead of chaotic. Patients should not have to reconstruct the same story every time they return.",
    paragraphCardTitle: "Why this landing matters",
    paragraphCardBody:
      "A medical intake product should feel trustworthy before the first message is even sent. That means clear language, visible structure, and a tone that feels measured rather than theatrical.",
  },
  tr: {
    heroTitle: "Tıbbi ön görüşme için daha sakin bir başlangıç.",
    heroParagraphOne:
      "MedAI, dağınık belirtileri düzenli bir ön görüşmeye çevirmeye yardım eder. Boş bir metin kutusuna kullanıcıyı bırakmak yerine, yerinde takip soruları sorar ve konuşmayı baştan sona okunabilir tutar.",
    heroParagraphTwo:
      "Amacı tanı koymak değildir. Amacı, tıbbi görüşmenin ilk adımını daha düzenli, daha sakin, daha kolay incelenebilir ve önemli ayrıntıların daha az kaçırıldığı bir hâle getirmektir.",
    sessionTitle: "Soğuk bir form değil, insan gibi akan bir ön görüşme.",
    sessionBody:
      "Asistan odaklı takip soruları sorar, yanıtları canlı akar şekilde yazar ve tüm görüşmeyi hesapla bağlı tutar.",
    chipOne: "Düzenli belirti kaydı",
    chipTwo: "Ölçülü aciliyet uyarısı",
    noteTitle: "Gerçek kullanım için tasarlandı",
    noteBody:
      "Kaldığın yerden devam et, yanıtları aynı akışta gör ve geçmişi karmaşık değil, okunabilir tut. Kullanıcı her geri geldiğinde hikâyesini baştan kurmak zorunda kalmamalı.",
    paragraphCardTitle: "Neden bu ilk ekran önemli",
    paragraphCardBody:
      "Tıbbi ön görüşme ürünü, ilk mesaj atılmadan önce bile güven vermelidir. Bu da net dil, görünen bir düzen ve abartılı değil, ölçülü bir ton gerektirir.",
  },
} satisfies Record<AppLanguage, {
  heroTitle: string;
  heroParagraphOne: string;
  heroParagraphTwo: string;
  sessionTitle: string;
  sessionBody: string;
  chipOne: string;
  chipTwo: string;
  noteTitle: string;
  noteBody: string;
  paragraphCardTitle: string;
  paragraphCardBody: string;
}>;

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
    const wc = welcomeContent[language];

    return (
      <main className="min-h-screen overflow-hidden px-4 py-6 md:px-6">
        <div className="mx-auto grid min-h-[calc(100vh-3rem)] max-w-7xl items-stretch gap-6 lg:grid-cols-[minmax(0,1.18fr)_430px]">
          <section className="relative overflow-hidden rounded-[2.2rem] border border-[rgba(24,32,24,0.08)] bg-[linear-gradient(140deg,rgba(255,252,247,0.94),rgba(244,239,229,0.88)_42%,rgba(231,239,233,0.82))] px-8 py-8 shadow-[0_32px_90px_rgba(30,38,31,0.16)] md:px-10 md:py-10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(201,121,74,0.22),transparent_20%),radial-gradient(circle_at_86%_20%,rgba(36,89,70,0.2),transparent_22%),linear-gradient(rgba(24,32,24,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(24,32,24,0.03)_1px,transparent_1px)] bg-[length:auto,auto,34px_34px,34px_34px]" />
            <div className="absolute -left-20 top-20 h-56 w-56 rounded-full bg-[#c9794a]/12 blur-3xl" />
            <div className="absolute bottom-0 right-0 h-64 w-64 translate-x-14 translate-y-14 rounded-full bg-[#245946]/14 blur-3xl" />

            <div className="relative flex h-full flex-col justify-between gap-10">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="inline-flex items-center gap-3 rounded-full border border-[rgba(24,32,24,0.1)] bg-white/72 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-[#245946] shadow-[0_10px_25px_rgba(36,89,70,0.08)]">
                  <HeartPulse className="h-4 w-4" />
                  {t.appName}
                </div>

                <div className="flex items-center gap-2 rounded-full border border-[rgba(24,32,24,0.08)] bg-white/78 p-1 shadow-[0_10px_24px_rgba(24,32,24,0.08)]">
                  {(["en", "tr"] as const).map((option) => (
                    <button
                      key={option}
                      className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] transition ${
                        language === option
                          ? "bg-[#245946] text-white shadow-[0_10px_24px_rgba(36,89,70,0.22)]"
                          : "text-[#5c665d] hover:bg-white"
                      }`}
                      onClick={() => setLanguage(option)}
                      type="button"
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-10 xl:grid-cols-[minmax(0,1fr)_260px] xl:items-start">
                <div className="max-w-3xl">
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#245946]">{t.intakeBadge}</p>
                  <h1 className="mt-5 max-w-4xl font-[var(--font-display)] text-[clamp(3rem,6vw,5.5rem)] leading-[0.95] text-[#182018]">
                    {wc.heroTitle}
                  </h1>
                  <p className="mt-5 max-w-2xl text-lg leading-8 text-[#425045]">{wc.heroParagraphOne}</p>
                  <p className="mt-4 max-w-2xl text-base leading-8 text-[#556157]">{wc.heroParagraphTwo}</p>

                  <div className="mt-8 flex flex-wrap gap-3">
                    <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(24,32,24,0.08)] bg-white/74 px-4 py-2 text-sm text-[#425045]">
                      <Activity className="h-4 w-4 text-[#245946]" />
                      {wc.chipOne}
                    </div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(24,32,24,0.08)] bg-white/74 px-4 py-2 text-sm text-[#425045]">
                      <ShieldCheck className="h-4 w-4 text-[#245946]" />
                      {wc.chipTwo}
                    </div>
                  </div>
                </div>

                <div className="rounded-[2rem] border border-[rgba(24,32,24,0.08)] bg-[#1f3e33] p-5 text-[#f6f2ea] shadow-[0_24px_60px_rgba(22,34,29,0.24)]">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#b9d3c8]">
                    {language === "tr" ? "Görüşme hissi" : "Session feel"}
                  </p>
                  <p className="mt-3 font-[var(--font-display)] text-3xl leading-tight">
                    {wc.sessionTitle}
                  </p>
                  <p className="mt-4 text-sm leading-6 text-[#d7e4de]">
                    {wc.sessionBody}
                  </p>
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-3">
                {[
                  [t.featureOneTitle, t.featureOneBody],
                  [t.featureTwoTitle, t.featureTwoBody],
                  [t.featureThreeTitle, t.featureThreeBody],
                ].map(([title, body], index) => {
                  const Icon = featureIcons[index] ?? Activity;

                  return (
                    <div
                      key={title}
                      className="rounded-[1.8rem] border border-[rgba(24,32,24,0.08)] bg-white/72 p-5 shadow-[0_14px_32px_rgba(24,32,24,0.06)]"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="rounded-2xl bg-[#245946]/10 p-3 text-[#245946]">
                          <Icon className="h-5 w-5" />
                        </div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#748076]">
                          0{index + 1}
                        </p>
                      </div>
                      <p className="mt-4 text-base font-semibold text-[#182018]">{title}</p>
                      <p className="mt-2 text-sm leading-6 text-[#5c665d]">{body}</p>
                    </div>
                  );
                })}
              </div>

              <div className="grid gap-4 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,0.75fr)]">
                <div className="rounded-[1.85rem] border border-[rgba(24,32,24,0.08)] bg-white/72 px-5 py-4 text-sm leading-6 text-[#5c665d] shadow-[0_14px_32px_rgba(24,32,24,0.06)]">
                  <span className="font-semibold text-[#182018]">{t.introLabel}:</span> {t.disclaimer}
                </div>
                <div className="rounded-[1.85rem] border border-dashed border-[rgba(24,32,24,0.12)] bg-white/56 px-5 py-4 text-sm leading-6 text-[#425045]">
                  <p className="font-semibold text-[#182018]">{wc.noteTitle}</p>
                  <p className="mt-2">{wc.noteBody}</p>
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
                <div className="rounded-[1.9rem] border border-[rgba(24,32,24,0.08)] bg-white/66 p-5 shadow-[0_12px_28px_rgba(24,32,24,0.05)]">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#245946]">{wc.paragraphCardTitle}</p>
                  <p className="mt-3 text-sm leading-7 text-[#4a574d]">{wc.paragraphCardBody}</p>
                </div>
                <div className="rounded-[1.9rem] border border-[rgba(24,32,24,0.08)] bg-[linear-gradient(180deg,rgba(255,255,255,0.72),rgba(255,250,244,0.72))] p-5 shadow-[0_12px_28px_rgba(24,32,24,0.05)]">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#245946]">{t.appName}</p>
                  <p className="mt-3 text-base leading-8 text-[#425045]">
                    {t.featureOneBody} {t.featureTwoBody} {t.featureThreeBody}
                  </p>
                </div>
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
