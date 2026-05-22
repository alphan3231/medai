import "server-only";

import { adminStorage } from "@/lib/firebase/admin";
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
    const bucketName = adminStorage.bucket().name;

    return (
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

      const file = adminStorage.bucket().file(attachment.storagePath);
      const [exists] = await file.exists();
      if (!exists) {
        throw new Error("Attachment file was not found.");
      }

      const [metadata] = await file.getMetadata();
      const contentType = metadata.contentType ?? "";
      const sizeBytes = Number.parseInt(String(metadata.size ?? "0"), 10);
      const customMetadata = metadata.metadata ?? {};
      const fileName =
        typeof customMetadata.fileName === "string" && customMetadata.fileName.trim()
          ? customMetadata.fileName
          : attachment.fileName;

      if (!isAllowedAttachmentMimeType(contentType)) {
        throw new Error("Attachment file type is not allowed.");
      }

      if (sizeBytes > MAX_ATTACHMENT_BYTES) {
        throw new Error("Attachment file is too large.");
      }

      if (customMetadata.userId !== userId || customMetadata.chatId !== chatId || customMetadata.attachmentId !== attachment.id) {
        throw new Error("Attachment ownership could not be verified.");
      }

      return {
        id: attachment.id,
        storagePath: attachment.storagePath,
        mimeType: contentType,
        fileName,
        downloadUrl: attachment.downloadUrl,
        sizeBytes,
        width: toPositiveInteger(customMetadata.width, attachment.width),
        height: toPositiveInteger(customMetadata.height, attachment.height),
        kind: attachment.kind,
      } satisfies ChatAttachment;
    }),
  );
}
