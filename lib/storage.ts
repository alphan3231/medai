import "server-only";

import { adminStorage } from "@/lib/firebase/admin";
import {
  isAllowedAttachmentMimeType,
  isChatAttachmentPathForUserChat,
  MAX_ATTACHMENT_BYTES,
  MAX_ATTACHMENTS_PER_MESSAGE,
} from "@/lib/chat-attachments";
import type { ChatAttachment, ChatMessage } from "@/lib/types";

const SIGNED_URL_TTL_MS = 24 * 60 * 60 * 1000;

function toPositiveInteger(value: unknown, fallback = 0) {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export async function createSignedAttachmentUrl(storagePath: string) {
  const [url] = await adminStorage
    .bucket()
    .file(storagePath)
    .getSignedUrl({
      action: "read",
      expires: Date.now() + SIGNED_URL_TTL_MS,
    });

  return url;
}

export async function hydrateAttachmentsWithSignedUrls(attachments: ChatAttachment[]) {
  return Promise.all(
    attachments.map(async (attachment) => ({
      ...attachment,
      downloadUrl: await createSignedAttachmentUrl(attachment.storagePath),
    })),
  );
}

export async function hydrateChatMessagesWithSignedUrls(messages: ChatMessage[]) {
  return Promise.all(
    messages.map(async (message) => {
      if (!message.attachments?.length) {
        return message;
      }

      return {
        ...message,
        attachments: await hydrateAttachmentsWithSignedUrls(message.attachments),
      };
    }),
  );
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
        sizeBytes,
        width: toPositiveInteger(customMetadata.width, attachment.width),
        height: toPositiveInteger(customMetadata.height, attachment.height),
        kind: attachment.kind,
      } satisfies ChatAttachment;
    }),
  );
}
