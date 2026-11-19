import {
  RiArrowRightLine as ArrowRight,
  RiCheckLine as Check,
  RiLoader3Line as CircleDashed
} from "react-icons/ri";
import MarketingPage, {
  MarketingCta,
} from "../components/marketing/MarketingPage";

const steps = [
  {
    title: "Set up your workspace",
    description:
      "Create an account, choose your role, and name your primary workspace. Your projects stay organized by workspace.",
    detail:
      "Free includes your primary workspace. Paid plans let you add more workspaces.",
  },
  {
    title: "Bring your context",
    description:
      "Write a user story with a subject and description, attach documents, or add a website URL on an eligible plan.",
    detail:
      "Include acceptance criteria, expected behavior, and anything you want to exclude.",
  },
  {
    title: "Shape the coverage",
    description:
      "Enter your test-case count, set priority, and choose the types of tests you want. Select a model and adjust reasoning or output detail.",
    detail:
      "Your source drafts and model configurations stay separate while you work.",
  },
  {
    title: "Review your request",
    description:
      "Check your source, workspace, model, and filters. Download the request as JSON to keep or share your setup.",
    detail:
      "This is the current preview flow. It does not send an AI request or execute tests.",
  },
];

export default function HowItWorks() {
  return (
    <MarketingPage
      title={
        <>
          From your first story
          <br />
          <span className="text-[#294137]">to a clear testing plan.</span>
        </>
      }
      description="Bring the context, choose your coverage, and review your setup. Here is how the current Casefy workflow fits together."
    >
      <ol className="grid gap-5 md:grid-cols-2">
        {steps.map((step, index) => (
          <li
            key={step.title}
            className="rounded-md border border-[#CFDDD5] bg-white p-6 sm:p-8"
          >
            <span className="mb-6 flex size-12 items-center justify-center rounded-md bg-[#294137] text-lg font-bold text-white">
              0{index + 1}
            </span>
            <h2 className="text-2xl font-extrabold tracking-tight">
              {step.title}
            </h2>
            <p className="mt-3 text-sm leading-7 text-[#526159]">
              {step.description}
            </p>
            <p className="mt-5 border-t border-[#e1e9e4] pt-4 text-xs leading-6 text-[#718578]">
              {step.detail}
            </p>
          </li>
        ))}
      </ol>
      <section
        aria-labelledby="next-workflow"
        className="rounded-md border border-[#CFDDD5] bg-[#edf3ef] p-6 sm:p-8"
      >
        <h2
          id="next-workflow"
          className="text-2xl font-extrabold tracking-tight"
        >
          Next: from planning to execution
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-[#526159]">
          The next stages are planned. They will extend the workflow beyond
          request preparation.
        </p>
        <ol className="mt-7 grid gap-3 sm:grid-cols-3">
          {[
            "Generate and review test cases",
            "Run locally or through CI/CD",
            "Review results and evidence",
          ].map((label) => (
            <li
              key={label}
              className="flex items-start gap-2.5 rounded-md border border-[#CFDDD5] bg-white p-4 text-sm font-medium text-[#294137]"
            >
              <CircleDashed
                size={18}
                className="mt-0.5 shrink-0"
                aria-hidden="true"
              />
              {label}
            </li>
          ))}
        </ol>
        <div className="mt-6 flex flex-wrap items-center gap-3 text-xs text-[#718578]">
          <span className="inline-flex items-center gap-1.5">
            <Check size={14} aria-hidden="true" />
            Prepare today
          </span>
          <ArrowRight size={14} aria-hidden="true" />
          <span>Generation, local runs, and reporting planned</span>
        </div>
      </section>
      <MarketingCta />
    </MarketingPage>
  );
}
