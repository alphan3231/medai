import OpenAI from "openai";

import { buildSystemPrompt } from "@/lib/medical";
import type { AppLanguage, ChatMessage, MedicalWarningLevel } from "@/lib/types";

const MODEL = "gpt-5-nano-2025-08-07";

function getClient() {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("Missing OPENAI_API_KEY");
  }

  return new OpenAI({ apiKey });
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
  const input = [
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

  const response = await client.responses.create({
    model: MODEL,
    input,
  });

  return response.output_text?.trim() || "I need a little more detail to continue the intake.";
}
