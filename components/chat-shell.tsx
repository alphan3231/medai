"use client";

import { type FormEvent, useEffect, useEffectEvent, useMemo, useState } from "react";
import type { User } from "firebase/auth";
import { signOut } from "firebase/auth";
import { AlertTriangle, ArrowUpRight, Languages, LogOut, MessageSquarePlus, ShieldAlert, Sparkles } from "lucide-react";

import { auth } from "@/lib/firebase/client";
import { copy, getWarningCopy } from "@/lib/i18n";
import type { AppLanguage, ChatMessage, ChatSession } from "@/lib/types";
import { formatRelativeTime } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type ChatApiReply = {
  chatId: string;
  session: ChatSession;
  userMessage: ChatMessage;
  assistantMessage: ChatMessage;
};

export function ChatShell({
  user,
  language,
  onLanguageChange,
}: {
  user: User;
  language: AppLanguage;
  onLanguageChange: (language: AppLanguage) => void;
}) {
  const t = useMemo(() => copy[language], [language]);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const activeSession = sessions.find((item) => item.id === activeChatId) ?? null;
  const warningCopy = getWarningCopy(language, activeSession?.warningLevel ?? "none");

  async function authorizedFetch(url: string, init?: RequestInit) {
    const token = await user.getIdToken();

    return fetch(url, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...(init?.headers ?? {}),
      },
    });
  }

  const loadSessions = useEffectEvent(async () => {
    setLoadingHistory(true);
    setError("");

    try {
      const response = await authorizedFetch("/api/chats");
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? t.genericError);
      }

      const nextSessions = payload.sessions as ChatSession[];
      setSessions(nextSessions);

      if (!activeChatId && nextSessions[0]) {
        await loadConversation(nextSessions[0].id);
      } else if (!nextSessions.length) {
        setMessages([]);
      }
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : t.genericError;
      setError(message);
    } finally {
      setLoadingHistory(false);
    }
  });

  async function loadConversation(chatId: string) {
    setActiveChatId(chatId);
    setLoadingHistory(true);
    setError("");

    try {
      const response = await authorizedFetch(`/api/chats/${chatId}`);
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? t.genericError);
      }

      setMessages(payload.messages as ChatMessage[]);
      const session = payload.session as ChatSession;
      if (session?.language) {
        onLanguageChange(session.language);
      }
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : t.genericError;
      setError(message);
    } finally {
      setLoadingHistory(false);
    }
  }

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void loadSessions();
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [user.uid]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!input.trim() || sending) {
      return;
    }

    setSending(true);
    setError("");

    try {
      const response = await authorizedFetch("/api/chat", {
        method: "POST",
        body: JSON.stringify({
          chatId: activeChatId,
          message: input.trim(),
          language,
        }),
      });
      const payload = (await response.json()) as ChatApiReply & { error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? t.genericError);
      }

      setMessages((current) => {
        const withoutPending = current.filter((item) => item.id !== "pending");
        return [...withoutPending, payload.userMessage, payload.assistantMessage];
      });

      setSessions((current) => {
        const next = [payload.session, ...current.filter((item) => item.id !== payload.session.id)];
        return next;
      });
      setActiveChatId(payload.chatId);
      setInput("");
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : t.genericError;
      setError(message.includes("OPENAI_API_KEY") ? t.missingKeyError : message);
    } finally {
      setSending(false);
    }
  }

  function startNewChat() {
    setActiveChatId(null);
    setMessages([]);
    setError("");
    setInput("");
  }

  return (
    <div className="min-h-screen px-4 py-6 md:px-6">
      <div className="mx-auto grid min-h-[calc(100vh-3rem)] max-w-7xl gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="glass-panel grain flex flex-col rounded-[2rem] p-5">
          <div className="space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.26em] text-[#245946]">{t.appName}</p>
                <h1 className="mt-2 font-[var(--font-display)] text-3xl leading-tight text-[#182018]">
                  {t.sidebarTitle}
                </h1>
              </div>
              <div className="rounded-full border border-[rgba(24,32,24,0.08)] bg-white/70 p-2 text-[#245946]">
                <Sparkles className="h-4 w-4" />
              </div>
            </div>

            <p className="text-sm leading-6 text-[#5c665d]">{t.sidebarHint}</p>

            <div className="flex items-center gap-2 rounded-full border border-[rgba(24,32,24,0.08)] bg-white/70 p-1">
              {(["en", "tr"] as const).map((option) => (
                <button
                  key={option}
                  className={`flex-1 rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] transition ${
                    language === option ? "bg-[#245946] text-white" : "text-[#5c665d] hover:bg-white"
                  }`}
                  onClick={() => onLanguageChange(option)}
                  type="button"
                >
                  <span className="inline-flex items-center gap-2">
                    <Languages className="h-3.5 w-3.5" />
                    {option}
                  </span>
                </button>
              ))}
            </div>

            <Button className="w-full" onClick={startNewChat} variant="secondary">
              <MessageSquarePlus className="mr-2 h-4 w-4" />
              {t.newChat}
            </Button>
          </div>

          <div className="mt-6 flex-1 space-y-3 overflow-y-auto pr-1">
            {sessions.length ? (
              sessions.map((session) => (
                <button
                  key={session.id}
                  className={`w-full rounded-[1.4rem] border p-4 text-left transition ${
                    session.id === activeChatId
                      ? "border-[#245946]/40 bg-white/95 shadow-[0_16px_40px_rgba(36,89,70,0.12)]"
                      : "border-[rgba(24,32,24,0.08)] bg-white/55 hover:bg-white/80"
                  }`}
                  onClick={() => void loadConversation(session.id)}
                  type="button"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2">
                      <p className="font-semibold text-[#182018]">{session.title}</p>
                      <p className="text-sm leading-5 text-[#5c665d]">{session.lastMessagePreview}</p>
                    </div>
                    {session.warningLevel === "soft" ? (
                      <ShieldAlert className="h-4 w-4 shrink-0 text-[#b4533f]" />
                    ) : null}
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs uppercase tracking-[0.18em] text-[#748076]">
                    <span>{session.language}</span>
                    <span>{formatRelativeTime(session.updatedAt)}</span>
                  </div>
                </button>
              ))
            ) : (
              <div className="rounded-[1.5rem] border border-dashed border-[rgba(24,32,24,0.12)] px-4 py-6 text-sm leading-6 text-[#5c665d]">
                {loadingHistory ? t.sending : t.historyEmpty}
              </div>
            )}
          </div>

          <div className="mt-6 rounded-[1.5rem] border border-[rgba(24,32,24,0.08)] bg-white/70 p-4">
            <p className="text-sm font-semibold text-[#182018]">{user.email}</p>
            <Button className="mt-3 w-full" onClick={() => void signOut(auth)} size="sm" variant="ghost">
              <LogOut className="mr-2 h-4 w-4" />
              {t.signOut}
            </Button>
          </div>
        </aside>

        <main className="glass-panel grain flex min-h-[75vh] flex-col rounded-[2rem]">
          <div className="flex flex-col gap-4 border-b border-[rgba(24,32,24,0.08)] px-6 py-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#245946]">{t.intakeBadge}</p>
              <h2 className="font-[var(--font-display)] text-4xl leading-tight text-[#182018]">{t.appTitle}</h2>
              <p className="text-sm leading-6 text-[#5c665d]">{t.appSubtitle}</p>
            </div>
            <div className="rounded-[1.5rem] border border-[rgba(24,32,24,0.08)] bg-white/70 px-4 py-3 text-sm leading-6 text-[#5c665d]">
              <p className="font-semibold text-[#182018]">{t.introLabel}</p>
              <p>{t.disclaimer}</p>
            </div>
          </div>

          {warningCopy ? (
            <div className="mx-6 mt-6 rounded-[1.5rem] border border-[#b4533f]/20 bg-[#fff2eb] px-4 py-4 text-sm leading-6 text-[#8f3e2f]">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
                <div>
                  <p className="font-semibold">{warningCopy.title}</p>
                  <p>{warningCopy.body}</p>
                </div>
              </div>
            </div>
          ) : null}

          <div className="flex-1 space-y-4 overflow-y-auto px-6 py-6">
            {error ? (
              <div className="rounded-[1.5rem] border border-[#b4533f]/20 bg-[#fff2eb] px-4 py-3 text-sm text-[#8f3e2f]">
                {error}
              </div>
            ) : null}

            {!messages.length ? (
              <div className="rounded-[2rem] border border-dashed border-[rgba(24,32,24,0.12)] bg-white/50 px-6 py-8">
                <p className="text-lg font-semibold text-[#182018]">{t.chatPlaceholder}</p>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-[#5c665d]">{t.startPrompt}</p>
              </div>
            ) : null}

            {messages.map((message) => (
              <article
                key={message.id}
                className={`max-w-3xl rounded-[1.75rem] px-5 py-4 ${
                  message.role === "user"
                    ? "ml-auto bg-[#245946] text-white shadow-[0_16px_36px_rgba(36,89,70,0.24)]"
                    : "border border-[rgba(24,32,24,0.08)] bg-white/88 text-[#182018]"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <p className="whitespace-pre-wrap text-sm leading-7">{message.content}</p>
                  <span
                    className={`shrink-0 text-[10px] font-semibold uppercase tracking-[0.22em] ${
                      message.role === "user" ? "text-white/70" : "text-[#748076]"
                    }`}
                  >
                    {message.role === "user" ? t.userRole : t.assistantRole}
                  </span>
                </div>
                {message.warningLevel === "soft" && message.warningText ? (
                  <div
                    className={`mt-4 rounded-[1.25rem] px-4 py-3 text-sm leading-6 ${
                      message.role === "user"
                        ? "bg-white/12 text-white/90"
                        : "bg-[#fff2eb] text-[#8f3e2f]"
                    }`}
                  >
                    {message.warningText}
                  </div>
                ) : null}
              </article>
            ))}

            {sending ? (
              <div className="inline-flex items-center gap-3 rounded-full border border-[rgba(24,32,24,0.08)] bg-white/80 px-4 py-3 text-sm text-[#5c665d]">
                <ArrowUpRight className="h-4 w-4 animate-pulse" />
                {t.sending}
              </div>
            ) : null}
          </div>

          <div className="border-t border-[rgba(24,32,24,0.08)] px-6 py-5">
            <form className="space-y-3" onSubmit={handleSubmit}>
              <Textarea
                onChange={(event) => setInput(event.target.value)}
                placeholder={t.composerPlaceholder}
                value={input}
              />
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs uppercase tracking-[0.2em] text-[#748076]">
                  {activeSession?.language
                    ? `${activeSession.language} ${t.sessionLabel}`
                    : `${language} ${t.sessionLabel}`}
                </p>
                <Button disabled={sending || !input.trim()} type="submit">
                  {t.send}
                </Button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}
