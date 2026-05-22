import "server-only";

import {
  isAllowedAttachmentMimeType,
  isChatAttachmentPathForUserChat,
  MAX_ATTACHMENT_BYTES,
  MAX_ATTACHMENTS_PER_MESSAGE,
} from "@/lib/chat-attachments";
import type { ChatAttachment, ChatMessage } from "@/lib/types";

function toPositiveInteger(value: unknown, fallback = 0) {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function downloadUrlMatchesStoragePath(downloadUrl: string | null | undefined, storagePath: string) {
  if (!downloadUrl) {
    return false;
  }

  try {
    const parsedUrl = new URL(downloadUrl);
    const expectedEncodedPath = encodeURIComponent(storagePath);
    const bucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;

    return (
      Boolean(bucketName) &&
      parsedUrl.hostname === "firebasestorage.googleapis.com" &&
      parsedUrl.pathname === `/v0/b/${bucketName}/o/${expectedEncodedPath}` &&
      parsedUrl.searchParams.get("alt") === "media" &&
      Boolean(parsedUrl.searchParams.get("token"))
    );
  } catch {
    return false;
  }
}

export async function hydrateAttachmentsWithDownloadUrls(attachments: ChatAttachment[]) {
  return attachments;
}

export async function hydrateChatMessagesWithDownloadUrls(messages: ChatMessage[]) {
  return messages;
}

export async function validateChatAttachmentsForUser({
  userId,
  chatId,
  attachments,
}: {
  userId: string;
  chatId: string;
  attachments: ChatAttachment[];
}) {
  if (attachments.length > MAX_ATTACHMENTS_PER_MESSAGE) {
    throw new Error(`A message can include up to ${MAX_ATTACHMENTS_PER_MESSAGE} images.`);
  }

  return Promise.all(
    attachments.map(async (attachment) => {
      if (!isChatAttachmentPathForUserChat({ storagePath: attachment.storagePath, userId, chatId })) {
        throw new Error("Attachment does not belong to this user or chat.");
      }

      if (!isAllowedAttachmentMimeType(attachment.mimeType)) {
        throw new Error("Unsupported attachment type.");
      }

      if (!downloadUrlMatchesStoragePath(attachment.downloadUrl, attachment.storagePath)) {
        throw new Error("Attachment download URL could not be verified.");
      }

      if (!isAllowedAttachmentMimeType(attachment.mimeType)) {
        throw new Error("Attachment file type is not allowed.");
      }

      if (attachment.sizeBytes > MAX_ATTACHMENT_BYTES) {
        throw new Error("Attachment file is too large.");
      }

      return {
        id: attachment.id,
        storagePath: attachment.storagePath,
        mimeType: attachment.mimeType,
        fileName: attachment.fileName,
        downloadUrl: attachment.downloadUrl,
        sizeBytes: attachment.sizeBytes,
        width: toPositiveInteger(attachment.width, 0),
        height: toPositiveInteger(attachment.height, 0),
        kind: attachment.kind,
      } satisfies ChatAttachment;
    }),
  );
}
