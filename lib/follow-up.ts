export type FollowUpSuggestion = {
  question: string;
  options: string[];
};

const FOLLOW_UP_QUESTION_MARKER = "FOLLOW_UP_QUESTION:";
const FOLLOW_UP_OPTIONS_MARKER = "FOLLOW_UP_OPTIONS:";

export function extractFollowUp(content: string): {
  body: string;
  followUp: FollowUpSuggestion | null;
} {
  const markerIndex = content.indexOf(FOLLOW_UP_QUESTION_MARKER);

  if (markerIndex === -1) {
    return {
      body: content.trim(),
      followUp: null,
    };
  }

  const body = content.slice(0, markerIndex).trim();
  const tail = content.slice(markerIndex);
  const questionMatch = tail.match(/FOLLOW_UP_QUESTION:\s*([^\n\r]*)/);
  const optionsMarkerIndex = tail.indexOf(FOLLOW_UP_OPTIONS_MARKER);
  const question = questionMatch?.[1]?.trim() ?? "";

  const options =
    optionsMarkerIndex === -1
      ? []
      : tail
          .slice(optionsMarkerIndex + FOLLOW_UP_OPTIONS_MARKER.length)
          .split(/\r?\n/)
          .map((line) => line.trim())
          .filter((line) => line.startsWith("- "))
          .map((line) => line.slice(2).trim())
          .filter(Boolean)
          .slice(0, 4);

  if (!question) {
    return {
      body,
      followUp: null,
    };
  }

  return {
    body,
    followUp: {
      question,
      options,
    },
  };
}
