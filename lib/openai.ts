import OpenAI from "openai";

import { buildSystemPrompt } from "@/lib/medical";
import type { AppLanguage, ChatMessage, MedicalWarningLevel } from "@/lib/types";

const MODEL = "gpt-5-nano-2025-08-07";
const FALLBACK_REPLY = "I need a little more detail to continue the intake.";

function getClient() {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("Missing OPENAI_API_KEY");
  }

  return new OpenAI({ apiKey });
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
      content: [
        {
          type: "input_text" as const,
          text: buildSystemPrompt(language, warningLevel),
        },
      ],
    },
    ...history.map((item) => ({
      role: item.role,
      content: [
        {
          type: "input_text" as const,
          text: item.content,
        },
      ],
    })),
    {
      role: "user" as const,
      content: [
        {
          type: "input_text" as const,
          text: message,
        },
      ],
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
