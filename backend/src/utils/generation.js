export const GENERATION_MODE = Object.freeze({
  value: "llm-playwright",
  label: "LLM + Playwright",
});

export function currentGenerationRequest(request) {
  if (!request || typeof request !== "object") return request;
  return { ...request, generationMode: { ...GENERATION_MODE } };
}
