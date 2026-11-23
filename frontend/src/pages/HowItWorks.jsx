import Reveal from "../ui/Reveal";
import H2 from "../ui/H2";
import P from "../ui/P";
import Span from "../ui/Span";
import MarketingPage from "../ui/MarketingPage";



export default function HowItWorks() {
  return (
    <MarketingPage
      title="From your first story to a clear testing plan."
      description="Bring the context, choose your coverage, and review your setup. Here is how the current Casefy workflow fits together."
    >
      <ol className="grid gap-5 md:grid-cols-2">

        <Reveal as="li" delay={0.0} className="rounded-md border border-[#CFDDD5] bg-white p-6 sm:p-8">
          <Span className="mb-6 flex size-12 items-center justify-center rounded-md bg-[#294137] text-lg font-bold text-white">01</Span>
          <H2>Set up your workspace</H2>
          <P className="mt-3">Create an account, choose your role, and name your primary workspace. Your projects stay organized by workspace.</P>
          <P variant="muted" className="mt-5 border-t border-[#e1e9e4] pt-4">Free includes your primary workspace. Paid plans let you add more workspaces.</P>
        </Reveal>
        <Reveal as="li" delay={0.1} className="rounded-md border border-[#CFDDD5] bg-white p-6 sm:p-8">
          <Span className="mb-6 flex size-12 items-center justify-center rounded-md bg-[#294137] text-lg font-bold text-white">02</Span>
          <H2>Bring your context</H2>
          <P className="mt-3">Write a user story with a subject and description, attach documents, or add a website URL on an eligible plan.</P>
          <P variant="muted" className="mt-5 border-t border-[#e1e9e4] pt-4">Include acceptance criteria, expected behavior, and anything you want to exclude.</P>
        </Reveal>
        <Reveal as="li" delay={0.2} className="rounded-md border border-[#CFDDD5] bg-white p-6 sm:p-8">
          <Span className="mb-6 flex size-12 items-center justify-center rounded-md bg-[#294137] text-lg font-bold text-white">03</Span>
          <H2>Shape the coverage</H2>
          <P className="mt-3">Enter your test-case count, set priority, and choose the types of tests you want. Configure LLM + Playwright and adjust reasoning or output detail.</P>
          <P variant="muted" className="mt-5 border-t border-[#e1e9e4] pt-4">Your source drafts and model configurations stay separate while you work.</P>
        </Reveal>
        <Reveal as="li" delay={0.3} className="rounded-md border border-[#CFDDD5] bg-white p-6 sm:p-8">
          <Span className="mb-6 flex size-12 items-center justify-center rounded-md bg-[#294137] text-lg font-bold text-white">04</Span>
          <H2>Review your request</H2>
          <P className="mt-3">Check your source, workspace, model, and filters. Download the request as JSON to keep or share your setup.</P>
          <P variant="muted" className="mt-5 border-t border-[#e1e9e4] pt-4">This is the current preview flow. It does not send an AI request or execute tests.</P>
        </Reveal>

      </ol>
    </MarketingPage>
  );
}
