export type AppLanguage = "en" | "tr";

export type ChatRole = "user" | "assistant";

export type MedicalWarningLevel = "none" | "soft";

export interface ChatMessage {
  id: string;
  chatId: string;
  userId: string;
  role: ChatRole;
  content: string;
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
