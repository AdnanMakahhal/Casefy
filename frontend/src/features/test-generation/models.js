import { RiVideoOnLine as MonitorPlay } from "react-icons/ri";

export const GENERATION_MODE = {
  value: "llm-playwright",
  label: "LLM + Playwright",
  description: "LLM planning paired with Playwright browser automation.",
  icon: MonitorPlay,
};

export const DEFAULT_MODEL_CONFIGURATION = {
  detail: "standard",
  reasoning: "medium",
};
