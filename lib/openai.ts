import OpenAI from "openai";

import { extractFollowUp } from "@/lib/follow-up";
import { buildSystemPrompt } from "@/lib/medical";
import type { AppLanguage, ChatMessage, MedicalWarningLevel } from "@/lib/types";

const MODEL = "gpt-5-nano-2025-08-07";
const FALLBACK_REPLY = "I need a little more detail to continue the intake.";
const REASONING = {
  effort: "minimal" as const,
};

function getClient() {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("Missing OPENAI_API_KEY");
  }

  return new OpenAI({ apiKey });
}

function buildTranscriptContext(history: ChatMessage[], message: string) {
  const priorTurns = history
    .map((item) => {
      const cleanedContent =
        item.role === "assistant" ? extractFollowUp(item.content).body : item.content.trim();

      if (!cleanedContent) {
        return null;
      }

      return `${item.role === "user" ? "User" : "Assistant"}: ${cleanedContent}`;
    })
    .filter(Boolean)
    .join("\n\n");

  return priorTurns
    ? `Conversation so far:\n${priorTurns}\n\nCurrent user message:\n${message}`
    : `Current user message:\n${message}`;
}

function buildInput({
  message,
  language,
  history,
  warningLevel,
}: {
  message: string;
  language: AppLanguage;
  history: ChatMessage[];
  warningLevel: MedicalWarningLevel;
}) {
  return [
    {
      role: "system" as const,
      content: buildSystemPrompt(language, warningLevel),
    },
    {
      role: "user" as const,
      content: buildTranscriptContext(history, message),
    },
  ];
}

export async function generateMedicalReply({
  message,
  language,
  history,
  warningLevel,
}: {
  message: string;
  language: AppLanguage;
  history: ChatMessage[];
  warningLevel: MedicalWarningLevel;
}) {
  const client = getClient();

  const response = await client.responses.create({
    model: MODEL,
    input: buildInput({ message, language, history, warningLevel }),
    reasoning: REASONING,
  });

  return response.output_text?.trim() || FALLBACK_REPLY;
}

export async function* streamMedicalReply({
  message,
  language,
  history,
  warningLevel,
}: {
  message: string;
  language: AppLanguage;
  history: ChatMessage[];
  warningLevel: MedicalWarningLevel;
}) {
  const client = getClient();
  const stream = await client.responses.create({
    model: MODEL,
    input: buildInput({ message, language, history, warningLevel }),
    reasoning: REASONING,
    stream: true,
  });

  let hasText = false;

  for await (const event of stream) {
    if (event.type === "response.output_text.delta" && event.delta) {
      hasText = true;
      yield event.delta;
    }
  }

  if (!hasText) {
    yield FALLBACK_REPLY;
  }
}
