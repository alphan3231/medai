import type { AppLanguage, ChatAttachment, ChatAttachmentKind } from "@/lib/types";

export const MAX_ATTACHMENTS_PER_MESSAGE = 4;
export const MAX_ATTACHMENT_BYTES = 8 * 1024 * 1024;
export const ALLOWED_ATTACHMENT_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

const CHAT_ATTACHMENT_ROOT = "chat-attachments";

export function isAllowedAttachmentMimeType(mimeType: string) {
  return ALLOWED_ATTACHMENT_MIME_TYPES.includes(
    mimeType as (typeof ALLOWED_ATTACHMENT_MIME_TYPES)[number],
  );
}

export function sanitizeAttachmentFileName(fileName: string) {
  return fileName
    .trim()
    .replace(/[^\w.\-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80) || "image";
}

export function buildChatAttachmentStoragePath({
  userId,
  chatId,
  attachmentId,
  fileName,
}: {
  userId: string;
  chatId: string;
  attachmentId: string;
  fileName: string;
}) {
  return `${CHAT_ATTACHMENT_ROOT}/${userId}/${chatId}/${attachmentId}-${sanitizeAttachmentFileName(fileName)}`;
}

export function isChatAttachmentPathForUserChat({
  storagePath,
  userId,
  chatId,
}: {
  storagePath: string;
  userId: string;
  chatId: string;
}) {
  return storagePath.startsWith(`${CHAT_ATTACHMENT_ROOT}/${userId}/${chatId}/`);
}

export function isXrayAttachmentKind(kind: ChatAttachmentKind) {
  return kind === "xray_like";
}

export function messageHasXrayAttachment(attachments?: ChatAttachment[] | null) {
  return Boolean(attachments?.some((attachment) => isXrayAttachmentKind(attachment.kind)));
}

export function describeAttachmentKind(kind: ChatAttachmentKind, language: AppLanguage) {
  if (kind === "xray_like") {
    return language === "tr" ? "Röntgen" : "X-ray";
  }

  return language === "tr" ? "Belirti fotoğrafı" : "Symptom photo";
}

export function serializeChatAttachments(attachments: ChatAttachment[]) {
  return attachments.map((attachment) => ({
    id: attachment.id,
    storagePath: attachment.storagePath,
    downloadUrl: attachment.downloadUrl ?? null,
    mimeType: attachment.mimeType,
    fileName: attachment.fileName,
    sizeBytes: attachment.sizeBytes,
    width: attachment.width,
    height: attachment.height,
    kind: attachment.kind,
  }));
}
