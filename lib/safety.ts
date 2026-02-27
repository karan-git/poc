export const SAFETY_MESSAGE =
  "⚠️ If you are in crisis, please call or text 988 or go to your nearest emergency room immediately.";

const CRISIS_KEYWORDS = [
  "suicide",
  "kill myself",
  "end my life",
  "hurt myself",
  "self-harm",
  "killing people",
  "plan to die",
  "suicidal ideation",
  "harm intent",
  "homicidal ideation",
  "want to die",
];

export function checkCrisis(message: string): boolean {
  const lowerMessage = message.toLowerCase();
  return CRISIS_KEYWORDS.some((keyword) => lowerMessage.includes(keyword));
}
