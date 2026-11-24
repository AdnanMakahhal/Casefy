export const GENERATION_MODE = Object.freeze({
  value: "ai-assisted",
  label: "AI-assisted generation",
});

export function currentGenerationRequest(request) {
  if (!request || typeof request !== "object") return request;
  return { ...request, generationMode: { ...GENERATION_MODE } };
}
