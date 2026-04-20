export function guardianAgent(input: string): { blocked: boolean; reason?: string } {
  // PII checks
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
  const phoneRegex = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/;

  if (emailRegex.test(input)) {
    return { blocked: true, reason: "PII detected (email)" };
  }
  if (phoneRegex.test(input)) {
    return { blocked: true, reason: "PII detected (phone)" };
  }

  // Essay writing checks
  const essayKeywords = ["write an essay about", "draft a personal statement", "write my college essay", "write my statement of purpose"];
  const lowerInput = input.toLowerCase();
  for (const keyword of essayKeywords) {
    if (lowerInput.includes(keyword)) {
      return { blocked: true, reason: "Essay writing assistance is not allowed" };
    }
  }

  // Self-harm keywords
  const selfHarmKeywords = ["suicide", "kill myself", "end my life", "self harm", "hurt myself"];
  for (const keyword of selfHarmKeywords) {
    if (lowerInput.includes(keyword)) {
      return { blocked: true, reason: "Safety concern detected (self-harm). Please seek professional help." };
    }
  }

  return { blocked: false };
}
