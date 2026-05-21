import { FieldValue, Timestamp } from "firebase-admin/firestore";

import { adminDb } from "@/lib/firebase/admin";
import type { AppLanguage, ChatMessage, ChatSession, MedicalWarningLevel } from "@/lib/types";

function serializeDate(value: Timestamp | string | null | undefined) {
  if (!value) {
    return new Date(0).toISOString();
  }

  if (typeof value === "string") {
    return value;
  }

  return value.toDate().toISOString();
}

function buildTitle(message: string) {
  return message.trim().slice(0, 52) || "New intake";
}

function buildSummary(message: string) {
  return message.trim().slice(0, 120) || "Symptom intake in progress.";
}

const CHAT_QUOTA_LIMIT = 5;
const CHAT_QUOTA_WINDOW_MS = 60 * 60 * 1000;
const CHAT_QUOTA_EXEMPT_EMAILS = new Set(["alphanozcan@gmail.com"]);

type ChatQuotaResult = {
  allowed: boolean;
  remaining: number;
  resetAt: string;
};

export async function ensureUserProfile(user: { uid: string; email?: string | null }) {
  await adminDb.collection("users").doc(user.uid).set(
    {
      email: user.email ?? null,
      updatedAt: FieldValue.serverTimestamp(),
      createdAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );
}

export async function consumeChatQuota(
  userId: string,
  email?: string | null,
): Promise<ChatQuotaResult> {
  if (email && CHAT_QUOTA_EXEMPT_EMAILS.has(email.trim().toLowerCase())) {
    return {
      allowed: true,
      remaining: Number.MAX_SAFE_INTEGER,
      resetAt: new Date(0).toISOString(),
    };
  }

  const ref = adminDb.collection("users").doc(userId).collection("rateLimits").doc("chatMessages");
  const now = new Date();

  return adminDb.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(ref);
    const data = snapshot.data();
    const existingStart =
      data?.windowStartedAt instanceof Timestamp ? data.windowStartedAt.toDate() : null;
    const inCurrentWindow =
      existingStart !== null && now.getTime() - existingStart.getTime() < CHAT_QUOTA_WINDOW_MS;
    const windowStartedAt = inCurrentWindow ? existingStart : now;
    const count = inCurrentWindow ? Number(data?.count ?? 0) : 0;
    const resetAt = new Date(windowStartedAt.getTime() + CHAT_QUOTA_WINDOW_MS);

    if (count >= CHAT_QUOTA_LIMIT) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: resetAt.toISOString(),
      };
    }

    const nextCount = count + 1;

    transaction.set(
      ref,
      {
        count: nextCount,
        limit: CHAT_QUOTA_LIMIT,
        windowStartedAt: Timestamp.fromDate(windowStartedAt),
        resetAt: Timestamp.fromDate(resetAt),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

    return {
      allowed: true,
      remaining: CHAT_QUOTA_LIMIT - nextCount,
      resetAt: resetAt.toISOString(),
    };
  });
}

export async function listChatSessions(userId: string): Promise<ChatSession[]> {
  const snapshot = await adminDb
    .collection("chats")
    .where("userId", "==", userId)
    .orderBy("updatedAt", "desc")
    .get();

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      userId: data.userId,
      title: data.title,
      summary: data.summary,
      language: data.language,
      warningLevel: data.warningLevel ?? "none",
      lastMessagePreview: data.lastMessagePreview ?? "",
      createdAt: serializeDate(data.createdAt),
      updatedAt: serializeDate(data.updatedAt),
    } satisfies ChatSession;
  });
}

export async function getChatSession(userId: string, chatId: string): Promise<ChatSession | null> {
  const doc = await adminDb.collection("chats").doc(chatId).get();
  if (!doc.exists) {
    return null;
  }

  const data = doc.data();
  if (!data || data.userId !== userId) {
    return null;
  }

  return {
    id: doc.id,
    userId: data.userId,
    title: data.title,
    summary: data.summary,
    language: data.language,
    warningLevel: data.warningLevel ?? "none",
    lastMessagePreview: data.lastMessagePreview ?? "",
    createdAt: serializeDate(data.createdAt),
    updatedAt: serializeDate(data.updatedAt),
  };
}

export async function getChatMessages(userId: string, chatId: string): Promise<ChatMessage[]> {
  const session = await getChatSession(userId, chatId);
  if (!session) {
    return [];
  }

  const snapshot = await adminDb
    .collection("chats")
    .doc(chatId)
    .collection("messages")
    .orderBy("createdAt", "asc")
    .get();

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      chatId,
      userId: data.userId,
      role: data.role,
      content: data.content,
      language: data.language,
      warningLevel: data.warningLevel ?? "none",
      warningText: data.warningText ?? null,
      createdAt: serializeDate(data.createdAt),
    } satisfies ChatMessage;
  });
}

export async function getRecentMessages(userId: string, chatId: string, limit = 8) {
  const session = await getChatSession(userId, chatId);
  if (!session) {
    return [];
  }

  const snapshot = await adminDb
    .collection("chats")
    .doc(chatId)
    .collection("messages")
    .orderBy("createdAt", "desc")
    .limit(limit)
    .get();

  return snapshot.docs
    .map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        chatId,
        userId: data.userId,
        role: data.role,
        content: data.content,
        language: data.language,
        warningLevel: data.warningLevel ?? "none",
        warningText: data.warningText ?? null,
        createdAt: serializeDate(data.createdAt),
      } satisfies ChatMessage;
    })
    .reverse();
}

export async function createChatSession({
  userId,
  language,
  firstMessage,
  warningLevel,
}: {
  userId: string;
  language: AppLanguage;
  firstMessage: string;
  warningLevel: MedicalWarningLevel;
}) {
  const ref = adminDb.collection("chats").doc();
  const payload = {
    userId,
    title: buildTitle(firstMessage),
    summary: buildSummary(firstMessage),
    language,
    warningLevel,
    lastMessagePreview: firstMessage.trim().slice(0, 140),
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };

  await ref.set(payload);
  return ref.id;
}

export async function appendMessage({
  chatId,
  userId,
  role,
  content,
  language,
  warningLevel,
  warningText,
}: {
  chatId: string;
  userId: string;
  role: "user" | "assistant";
  content: string;
  language: AppLanguage;
  warningLevel: MedicalWarningLevel;
  warningText?: string | null;
}) {
  const ref = adminDb.collection("chats").doc(chatId).collection("messages").doc();
  await ref.set({
    chatId,
    userId,
    role,
    content,
    language,
    warningLevel,
    warningText: warningText ?? null,
    createdAt: FieldValue.serverTimestamp(),
  });

  return ref.id;
}

export async function updateChatSessionMetadata({
  chatId,
  language,
  warningLevel,
  preview,
  summary,
}: {
  chatId: string;
  language: AppLanguage;
  warningLevel: MedicalWarningLevel;
  preview: string;
  summary: string;
}) {
  await adminDb.collection("chats").doc(chatId).set(
    {
      language,
      warningLevel,
      lastMessagePreview: preview.slice(0, 140),
      summary: summary.slice(0, 140),
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );
}
