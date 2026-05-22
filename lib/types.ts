export type AppLanguage = "en" | "tr";

export type ChatRole = "user" | "assistant";

export type MedicalWarningLevel = "none" | "soft";

export type ChatAttachmentKind = "symptom_photo" | "xray_like";

export interface ChatAttachment {
  id: string;
  storagePath: string;
  downloadUrl?: string | null;
  mimeType: string;
  fileName: string;
  sizeBytes: number;
  width: number;
  height: number;
  kind: ChatAttachmentKind;
}

export interface ChatMessage {
  id: string;
  chatId: string;
  userId: string;
  role: ChatRole;
  content: string;
  attachments?: ChatAttachment[];
  language: AppLanguage;
  warningLevel: MedicalWarningLevel;
  warningText?: string | null;
  createdAt: string;
}

export interface ChatSession {
  id: string;
  userId: string;
  title: string;
  summary: string;
  language: AppLanguage;
  warningLevel: MedicalWarningLevel;
  lastMessagePreview: string;
  createdAt: string;
  updatedAt: string;
}
