import { NextResponse } from "next/server";
import { z } from "zod";

import { getUserFromRequest } from "@/lib/auth";
import {
  appendMessage,
  consumeChatQuota,
  createChatSession,
  ensureUserProfile,
  getChatSession,
  getRecentMessages,
  updateChatSessionMetadata,
} from "@/lib/chat-store";
import { copy, getWarningCopy } from "@/lib/i18n";
import { detectMedicalWarning } from "@/lib/medical";
import { streamMedicalReply } from "@/lib/openai";
import type { AppLanguage, ChatMessage, ChatSession, MedicalWarningLevel } from "@/lib/types";

export const runtime = "nodejs";

const payloadSchema = z.object({
  chatId: z.string().trim().min(1).optional().nullable(),
  message: z.string().trim().min(1).max(4000),
  language: z.enum(["en", "tr"]),
});

type StreamEvent =
  | {
      type: "start";
      chatId: string;
      session: ChatSession;
      userMessage: ChatMessage;
      assistantDraft: {
        language: AppLanguage;
        warningLevel: MedicalWarningLevel;
        warningText: string | null;
      };
    }
  | {
      type: "delta";
      delta: string;
    }
  | {
      type: "done";
      chatId: string;
      session: ChatSession;
      assistantMessage: ChatMessage;
    }
  | {
      type: "error";
      error: string;
    };

function nowIso() {
  return new Date().toISOString();
}

function buildSessionShape({
  id,
  userId,
  title,
  summary,
  language,
  warningLevel,
  preview,
  createdAt,
}: {
  id: string;
  userId: string;
  title: string;
  summary: string;
  language: AppLanguage;
  warningLevel: MedicalWarningLevel;
  preview: string;
  createdAt?: string;
}): ChatSession {
  const timestamp = nowIso();
  return {
    id,
    userId,
    title,
    summary,
    language,
    warningLevel,
    lastMessagePreview: preview,
    createdAt: createdAt ?? timestamp,
    updatedAt: timestamp,
  };
}

function buildMessageShape({
  id,
  chatId,
  userId,
  role,
  content,
  language,
  warningLevel,
  warningText,
}: {
  id: string;
  chatId: string;
  userId: string;
  role: "user" | "assistant";
  content: string;
  language: AppLanguage;
  warningLevel: MedicalWarningLevel;
  warningText?: string | null;
}): ChatMessage {
  return {
    id,
    chatId,
    userId,
    role,
    content,
    language,
    warningLevel,
    warningText: warningText ?? null,
    createdAt: nowIso(),
  };
}

function buildUpdatedSession({
  session,
  language,
  warningLevel,
  summary,
  preview,
}: {
  session: ChatSession;
  language: AppLanguage;
  warningLevel: MedicalWarningLevel;
  summary: string;
  preview: string;
}) {
  return buildSessionShape({
    id: session.id,
    userId: session.userId,
    title: session.title,
    summary: summary.slice(0, 120),
    language,
    warningLevel,
    preview: preview.slice(0, 140),
    createdAt: session.createdAt,
  });
}

function encodeEvent(encoder: TextEncoder, event: StreamEvent) {
  return encoder.encode(`${JSON.stringify(event)}\n`);
}

export async function POST(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await ensureUserProfile(user);
    const body = await request.json();
    const payload = payloadSchema.parse(body);
    const quota = await consumeChatQuota(user.uid, user.email);

    if (!quota.allowed) {
      return NextResponse.json(
        {
          error: copy[payload.language].rateLimitError,
          resetAt: quota.resetAt,
        },
        { status: 429 },
      );
    }

    const warningLevel = detectMedicalWarning(payload.message);
    const warningText = getWarningCopy(payload.language, warningLevel)?.body ?? null;

    let chatId = payload.chatId ?? undefined;
    let session = chatId ? await getChatSession(user.uid, chatId) : null;

    if (!chatId || !session) {
      chatId = await createChatSession({
        userId: user.uid,
        language: payload.language,
        firstMessage: payload.message,
        warningLevel,
      });
      session = buildSessionShape({
        id: chatId,
        userId: user.uid,
        title: payload.message.slice(0, 52) || "New intake",
        summary: payload.message.slice(0, 120),
        language: payload.language,
        warningLevel,
        preview: payload.message.slice(0, 140),
      });
    }

    const userMessageId = await appendMessage({
      chatId,
      userId: user.uid,
      role: "user",
      content: payload.message,
      language: payload.language,
      warningLevel,
    });

    const recentHistory = await getRecentMessages(user.uid, chatId, 10);
    const startingSession = buildUpdatedSession({
      session,
      language: payload.language,
      warningLevel,
      summary: payload.message,
      preview: payload.message,
    });

    const encoder = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        const send = (event: StreamEvent) => controller.enqueue(encodeEvent(encoder, event));

        try {
          send({
            type: "start",
            chatId,
            session: startingSession,
            userMessage: buildMessageShape({
              id: userMessageId,
              chatId,
              userId: user.uid,
              role: "user",
              content: payload.message,
              language: payload.language,
              warningLevel,
            }),
            assistantDraft: {
              language: payload.language,
              warningLevel,
              warningText,
            },
          });

          let assistantText = "";

          for await (const delta of streamMedicalReply({
            message: payload.message,
            language: payload.language,
            history: recentHistory.filter((item) => item.id !== userMessageId),
            warningLevel,
          })) {
            assistantText += delta;
            send({ type: "delta", delta });
          }

          const finalizedAssistantText = assistantText.trim() || assistantText;
          const assistantMessageId = await appendMessage({
            chatId,
            userId: user.uid,
            role: "assistant",
            content: finalizedAssistantText,
            language: payload.language,
            warningLevel,
            warningText,
          });

          await updateChatSessionMetadata({
            chatId,
            language: payload.language,
            warningLevel,
            preview: finalizedAssistantText,
            summary: payload.message,
          });

          send({
            type: "done",
            chatId,
            session: buildUpdatedSession({
              session: startingSession,
              language: payload.language,
              warningLevel,
              summary: payload.message,
              preview: finalizedAssistantText,
            }),
            assistantMessage: buildMessageShape({
              id: assistantMessageId,
              chatId,
              userId: user.uid,
              role: "assistant",
              content: finalizedAssistantText,
              language: payload.language,
              warningLevel,
              warningText,
            }),
          });
        } catch (error) {
          const message =
            error instanceof Error ? error.message : copy[payload.language].genericError;
          send({
            type: "error",
            error: message.includes("OPENAI_API_KEY")
              ? copy[payload.language].missingKeyError
              : message,
          });
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "Content-Type": "application/x-ndjson; charset=utf-8",
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : copy.en.genericError;
    const status = error instanceof z.ZodError ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
