import { Bot, MonitorPlay } from "lucide-react";

export const GENERATION_MODES = [
  {
    value: "llm-playwright",
    label: "LLM + Playwright",
    description: "AI test generation with Playwright browser automation.",
    icon: MonitorPlay,
  },
  {
    value: "llm",
    label: "LLM by itself",
    description: "AI test generation without browser automation.",
    icon: Bot,
  },
];

export const DEFAULT_MODEL_CONFIGURATION = {
  detail: "standard",
  reasoning: "medium",
};
