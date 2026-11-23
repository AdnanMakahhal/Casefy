import Reveal from "../ui/Reveal";
import H2 from "../ui/H2";
import P from "../ui/P";
import Span from "../ui/Span";
import {
  RiBookOpenLine as BookOpen,
  RiBrainLine as BrainCircuit,
  RiClipboardLine as ClipboardList,
  RiFileTextLine as FileText,
  RiFolderChartLine as FolderKanban,
  RiGitBranchLine as GitBranch,
  RiGlobalLine as Globe,
  RiListCheck2 as ListChecks,
  RiComputerLine as Monitor,
  RiShieldCheckLine as ShieldCheck,
  RiFlowChart as Workflow,
} from "react-icons/ri";
import MarketingPage from "../ui/MarketingPage";
import MarketingCard from "../ui/MarketingCard";

export default function Features() {
  return (
    <MarketingPage
      title="Clear requirements. Better test coverage."
      description="One place to prepare your QA work today, with a path toward generation, local execution, and automated releases."
    >
      <section aria-labelledby="current-features">
        <Reveal className="mb-7 flex flex-wrap items-center justify-between gap-3">
          <H2 id="current-features" className="sm:text-3xl">
            What you can use today
          </H2>
          <Span className="rounded-md border border-[#CFDDD5] bg-white px-3 py-1.5 text-xs font-medium text-[#526159]">
            Current preview
          </Span>
        </Reveal>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <MarketingCard
            delay={0.0}
            icon={BookOpen}
            title="Start with your requirements"
          >
            Write a subject and description, add acceptance criteria, or attach
            requirement documents to prepare a request.
          </MarketingCard>
          <MarketingCard
            delay={0.1}
            icon={ListChecks}
            title="Choose your coverage"
          >
            Set your test-case count and priority. Combine positive, negative,
            functional, edge-case, security, and accessibility scenarios.
          </MarketingCard>
          <MarketingCard
            delay={0.2}
            icon={BrainCircuit}
            title="Preview your generation setup"
          >
            Use LLM + Playwright together and adjust reasoning and output settings. The
            AI model is configured through OpenRouter on the server. AI calls
            are not connected yet.
          </MarketingCard>
          <MarketingCard
            delay={0.0}
            icon={FolderKanban}
            title="Organize your workspace"
          >
            View projects by workspace. Keep the primary workspace created with
            your account, and add workspaces on a paid plan.
          </MarketingCard>
          <MarketingCard
            delay={0.1}
            icon={Globe}
            title="Prepare website context"
          >
            Plus, Pro, and Ultra include a URL input for your request. The
            current preview does not visit or test the website.
          </MarketingCard>
          <MarketingCard
            delay={0.2}
            icon={ShieldCheck}
            title="Manage your account"
          >
            Edit your profile, crop your avatar, and review your plan. Paid plan
            checkout is available through Stripe in the current sandbox setup.
          </MarketingCard>
        </div>
      </section>
      <section aria-labelledby="planned-features">
        <Reveal className="mb-7">
          <H2 id="planned-features" className="sm:text-3xl">
            Where Casefy is heading
          </H2>
          <P className="mt-3 max-w-2xl">
            These features are planned and are not available yet. Scope and
            release timing may change.
          </P>
        </Reveal>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <MarketingCard
            delay={0.0}
            icon={BrainCircuit}
            title="AI-generated test cases"
            planned
          >
            Turn requirements into test steps and expected results, then review
            the output on a dedicated results page.
          </MarketingCard>
          <MarketingCard
            delay={0.1}
            icon={ClipboardList}
            title="Manual test cases"
            planned
          >
            Create and edit cases yourself, organize them into suites, and keep
            manual coverage alongside generated cases.
          </MarketingCard>
          <MarketingCard
            delay={0.2}
            icon={Monitor}
            title="Local test execution"
            planned
          >
            Run test cases against your local app with a local runner.
            Playwright, Cypress, and Selenium workflows are planned.
          </MarketingCard>
          <MarketingCard
            delay={0.0}
            icon={GitBranch}
            title="CI/CD integration"
            planned
          >
            Connect automated checks to your build and release workflow so
            coverage can run with code changes.
          </MarketingCard>
          <MarketingCard
            delay={0.1}
            icon={FileText}
            title="Reports and evidence"
            planned
          >
            Review pass/fail results, screenshots, failures, and coverage in a
            dedicated run report.
          </MarketingCard>
          <MarketingCard
            delay={0.2}
            icon={Workflow}
            title="APIs and integrations"
            planned
          >
            Connect requirement sources, issue trackers, and custom pipelines
            through future APIs and webhooks.
          </MarketingCard>
        </div>
      </section>
    </MarketingPage>
  );
}
