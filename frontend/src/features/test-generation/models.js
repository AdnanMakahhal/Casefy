import {
  RiRobot2Line as Bot,
  RiVideoOnLine as MonitorPlay
} from "react-icons/ri";

export const GENERATION_MODES = [
  {
    value: "llm-playwright",
    label: "LLM + Playwright",
    description: "AI test generation with Playwright browser automation.",
    icon: MonitorPlay,
  },
  {
    value: "llm",
    label: "LLM",
    description: "AI test generation without browser automation.",
    icon: Bot,
  },
];

export const DEFAULT_MODEL_CONFIGURATION = {
  detail: "standard",
  reasoning: "medium",
};
