import {
  BookOpen,
  BrainCircuit,
  ClipboardList,
  FileText,
  FolderKanban,
  GitBranch,
  Globe,
  ListChecks,
  Monitor,
  Settings2,
  ShieldCheck,
  Workflow,
} from "lucide-react";
import MarketingPage, { MarketingCard, MarketingCta } from "../components/marketing/MarketingPage";

const current = [
  {
    icon: BookOpen,
    title: "Start with your requirements",
    text: "Write a subject and description, add acceptance criteria, or attach requirement documents to prepare a request.",
  },
  {
    icon: ListChecks,
    title: "Choose your coverage",
    text: "Set your test-case count and priority. Combine positive, negative, functional, edge-case, security, and accessibility scenarios.",
  },
  {
    icon: BrainCircuit,
    title: "Preview your model setup",
    text: "Choose ChatGPT, DeepSeek, or Gemini and keep separate reasoning and output settings for each model. AI calls are not connected yet.",
  },
  {
    icon: FolderKanban,
    title: "Organize your workspace",
    text: "View projects by workspace. Keep the primary workspace created with your account, and add workspaces on a paid plan.",
  },
  {
    icon: Globe,
    title: "Prepare website context",
    text: "Plus, Pro, and Enterprise include a URL input for your request. The current preview does not visit or test the website.",
  },
  {
    icon: ShieldCheck,
    title: "Manage your account",
    text: "Edit your profile, crop your avatar, and review your plan. Paid plan checkout is available through Stripe in the current sandbox setup.",
  },
];
const planned = [
  {
    icon: BrainCircuit,
    title: "AI-generated test cases",
    text: "Turn requirements into test steps and expected results, then review the output on a dedicated results page.",
  },
  {
    icon: ClipboardList,
    title: "Manual test cases",
    text: "Create and edit cases yourself, organize them into suites, and keep manual coverage alongside generated cases.",
  },
  {
    icon: Monitor,
    title: "Local test execution",
    text: "Run test cases against your local app with a local runner. Playwright, Cypress, and Selenium workflows are planned.",
  },
  {
    icon: GitBranch,
    title: "CI/CD integration",
    text: "Connect automated checks to your build and release workflow so coverage can run with code changes.",
  },
  {
    icon: FileText,
    title: "Reports and evidence",
    text: "Review pass/fail results, screenshots, failures, and coverage in a dedicated run report.",
  },
  {
    icon: Workflow,
    title: "APIs and integrations",
    text: "Connect requirement sources, issue trackers, and custom pipelines through future APIs and webhooks.",
  },
];

export default function Features() {
  return (
    <MarketingPage
      title={
        <>
          Clear requirements.
          <br />
          <span className="text-[#294137]">Better test coverage.</span>
        </>
      }
      description="One place to prepare your QA work today, with a path toward generation, local execution, and automated releases."
    >
      <section aria-labelledby="current-features">
        <div className="mb-7 flex flex-wrap items-center justify-between gap-3">
          <h2 id="current-features" className="text-2xl font-extrabold tracking-tight sm:text-3xl">
            What you can use today
          </h2>
          <span className="rounded-full border border-[#CFDDD5] bg-white px-3 py-1.5 text-xs font-medium text-[#526159]">
            Current preview
          </span>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {current.map(({ icon, title, text }) => (
            <MarketingCard key={title} icon={icon} title={title}>
              {text}
            </MarketingCard>
          ))}
        </div>
      </section>
      <section aria-labelledby="planned-features">
        <div className="mb-7">
          <h2 id="planned-features" className="text-2xl font-extrabold tracking-tight sm:text-3xl">
            Where Casefy is heading
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-[#526159]">
            These features are planned and are not available yet. Scope and release timing may
            change.
          </p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {planned.map(({ icon, title, text }) => (
            <MarketingCard key={title} icon={icon} title={title} planned>
              {text}
            </MarketingCard>
          ))}
        </div>
      </section>
      <div className="flex items-start gap-3 rounded-xl border border-[#CFDDD5] bg-white p-5 text-sm leading-7 text-[#526159]">
        <Settings2 size={19} aria-hidden="true" className="mt-1 shrink-0 text-[#294137]" />
        <p>
          Today, the generator lets you prepare, review, and download a request. AI generation,
          document parsing, test execution, and run reports will be added later.
        </p>
      </div>
      <MarketingCta />
    </MarketingPage>
  );
}
