import type { AppLanguage, MedicalWarningLevel } from "@/lib/types";

const emergencyPatterns = [
  /chest pain/i,
  /difficulty breathing/i,
  /shortness of breath/i,
  /passed out/i,
  /fainted/i,
  /seizure/i,
  /stroke/i,
  /one-sided weakness/i,
  /suicidal/i,
  /self-harm/i,
  /severe bleeding/i,
  /blue lips/i,
  /gogus agrisi/i,
  /nefes alam/i,
  /nefes darligi/i,
  /bayild/i,
  /nobet/i,
  /felc/i,
  /tek tarafli/i,
  /intihar/i,
  /kendime zarar/i,
  /asiri kanama/i,
];

export function detectMedicalWarning(content: string): MedicalWarningLevel {
  return emergencyPatterns.some((pattern) => pattern.test(content)) ? "soft" : "none";
}

export function buildSystemPrompt(language: AppLanguage, warningLevel: MedicalWarningLevel) {
  const languageLine =
    language === "tr"
      ? "Respond only in natural Turkish. Keep medical terms understandable and avoid awkward literal translations."
      : "Respond only in English. Keep medical terms understandable.";

  const warningLine =
    warningLevel === "soft"
      ? language === "tr"
        ? "Mesajda acil risk olabilecek sinyaller var. Korku yaratmadan net bir acil degerlendirme uyarisi ekle, sonra gorusmeye devam et."
        : "The message contains possible urgent-risk signals. Add a clear urgent-care warning without sounding alarmist, and continue the intake."
      : language === "tr"
        ? "Acil risk yoksa sakin bir ton kullan, standart uyariyi koru ve duzenli soru akisini surdur."
        : "If there is no urgent risk, keep a normal disclaimer tone and continue structured intake.";

  return `
You are MedAI, a medical symptom intake assistant. You are not a doctor.
${languageLine}
${warningLine}

Core rules:
- Never claim to diagnose, prescribe, or confirm a disease.
- Ask focused follow-up questions that improve triage value.
- Keep the response compact and calm.
- When helpful, organize with short headings.
- If enough detail exists, include a short symptom summary and what details are still missing.
- Encourage licensed clinical care where appropriate.
- Do not mention internal policy or model details.
- If responding in Turkish, prefer plain and natural words such as "sikayet", "belirti", "uyari", and "doktor degerlendirmesi".
- End every reply with this exact machine-readable block in the same language as the reply:
  FOLLOW_UP_QUESTION: <one short follow-up question>
  FOLLOW_UP_OPTIONS:
  - <short option 1>
  - <short option 2>
  - <short option 3>
- Keep each option short and clickable, ideally 2 to 6 words.
- Make the options answer the follow-up question directly.
`.trim();
}
