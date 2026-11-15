// UI preview choices, checked against provider catalogs on 2026-11-14.
// API calls remain disabled until generation is connected.
export const DEFAULT_LLM_MODELS = [
  { value: "gpt-6.1-sol", label: "ChatGPT", provider: "OpenAI", version: "GPT-6.1 Sol", description: "Prepare test scenarios with GPT-6.1 Sol. Review your story, acceptance criteria, and coverage settings before generation is connected.", logo: "/Models_Logo/Chatgpt_icon.svg" },
  { value: "deepseek-flash", label: "DeepSeek", provider: "DeepSeek", version: "DeepSeek V4.1 Flash", description: "Prepare structured test scenarios with DeepSeek V4.1 Flash. Your reasoning and output preferences stay separate from other models.", logo: "/Models_Logo/Deepseak_icon.svg" },
  { value: "gemini-4-hydrogen", label: "Gemini", provider: "Google", version: "Gemini 4 Hydrogen", description: "Prepare coverage with Gemini 4 Hydrogen using your requirements and additional context. AI generation is not connected yet.", logo: "/Models_Logo/Gemini_icon.svg" },
];

export const DEFAULT_MODEL_CONFIGURATION = { detail: "standard", reasoning: "medium" };
