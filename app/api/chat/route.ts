import { NextResponse } from "next/server";
import { z } from "zod";

import { getUserFromRequest } from "@/lib/auth";
import {
  appendMessage,
  createChatSession,
  ensureUserProfile,
  getChatSession,
  getRecentMessages,
  updateChatSessionMetadata,
} from "@/lib/chat-store";
import { copy, getWarningCopy } from "@/lib/i18n";
import { detectMedicalWarning } from "@/lib/medical";
import { generateMedicalReply } from "@/lib/openai";
import type { AppLanguage, ChatMessage, ChatSession, MedicalWarningLevel } from "@/lib/types";

export const runtime = "nodejs";

const payloadSchema = z.object({
  chatId: z.string().trim().min(1).optional().nullable(),
  message: z.string().trim().min(1).max(4000),
  language: z.enum(["en", "tr"]),
});

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
}: {
  id: string;
  userId: string;
  title: string;
  summary: string;
  language: AppLanguage;
  warningLevel: MedicalWarningLevel;
  preview: string;
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
    createdAt: timestamp,
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

export async function POST(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await ensureUserProfile(user);
    const body = await request.json();
    const payload = payloadSchema.parse(body);

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
    const assistantText = await generateMedicalReply({
      message: payload.message,
      language: payload.language,
      history: recentHistory.filter((item) => item.id !== userMessageId),
      warningLevel,
    });

    const assistantMessageId = await appendMessage({
      chatId,
      userId: user.uid,
      role: "assistant",
      content: assistantText,
      language: payload.language,
      warningLevel,
      warningText,
    });

    await updateChatSessionMetadata({
      chatId,
      language: payload.language,
      warningLevel,
      preview: assistantText,
      summary: payload.message,
    });

    return NextResponse.json({
      chatId,
      session: {
        ...(session as ChatSession),
        language: payload.language,
        warningLevel,
        summary: payload.message.slice(0, 120),
        lastMessagePreview: assistantText.slice(0, 140),
        updatedAt: nowIso(),
      },
      userMessage: buildMessageShape({
        id: userMessageId,
        chatId,
        userId: user.uid,
        role: "user",
        content: payload.message,
        language: payload.language,
        warningLevel,
      }),
      assistantMessage: buildMessageShape({
        id: assistantMessageId,
        chatId,
        userId: user.uid,
        role: "assistant",
        content: assistantText,
        language: payload.language,
        warningLevel,
        warningText,
      }),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : copy.en.genericError;
    const status = error instanceof z.ZodError ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
