import Reveal from "../ui/Reveal";
import { useState } from "react";
import { RiArrowRightUpLine as ArrowUpRight, RiBookOpenLine as BookOpen, RiLineChartLine as ChartNoAxesCombined, RiListCheck2 as ListChecks } from "react-icons/ri";
import H2 from "../ui/H2";
import SupportButton from "../ui/SupportButton";
import P from "../ui/P";
import Span from "../ui/Span";
import Button from "../ui/Button";
import Heading from "../ui/Heading";
import AccountModal from "../components/AccountModal";

function DocGuide({ title, description, tag, to, support = false, actionLabel, icon: Icon, featured = false, compact = false, summary, delay = 0, children }) {
  const [open, setOpen] = useState(false);
  const cardClass = compact ? "" : "flex min-w-0 flex-col rounded-md border border-[#CFDDD5] p-6 sm:p-8 " + (featured ? "bg-[#edf3ef]" : "bg-white");

  return (
    <Reveal as="article" delay={delay} disabled={compact} className={cardClass}>
      {compact ? (
        <Button variant="unstyled" onClick={() => setOpen(true)} className="group flex min-h-16 w-full cursor-pointer items-center gap-3 rounded-md px-1 py-2 text-left focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#294137]">
          <Span aria-hidden="true" className="size-2 shrink-0 rounded-full bg-[#294137]" />
          <Span className="flex-1">
            <Span className="block text-sm font-medium group-hover:underline">{title}</Span>
            <Span variant="muted" className="mt-1 block text-xs leading-5">{summary}</Span>
          </Span>
          <ArrowUpRight size={15} aria-hidden="true" className="shrink-0 text-[#718578]" />
        </Button>
      ) : (
        <>
          {Icon && (
            <Span className="mb-6 flex size-12 items-center justify-center rounded-md bg-[#294137] text-white">
              <Icon size={22} aria-hidden="true" />
            </Span>
          )}
          <H2>{title}</H2>
          <P variant="unstyled" className="mt-3 flex-1 text-sm leading-6 text-[#526159]">{description}</P>
          <Button onClick={() => setOpen(true)} size="custom" className="mt-7 min-h-12 w-fit border border-[#2941372e] px-5 focus-visible:outline-offset-4">
            {tag}
          </Button>
        </>
      )}
      {open && (
        <AccountModal title={title} onDismiss={() => setOpen(false)}>
          <ol className="space-y-4">{children}</ol>
          <div className="mt-6 flex justify-end">
            {support ? (
              <SupportButton onClick={() => setOpen(false)}>{actionLabel}</SupportButton>
            ) : (
              <Button to={to} onClick={() => setOpen(false)}>{actionLabel}<ArrowUpRight size={14} aria-hidden="true" /></Button>
            )}
          </div>
        </AccountModal>
      )}
    </Reveal>
  );
}

export default function Docs() {
  return (
    <section className="mx-auto max-w-6xl px-4 pt-12 pb-16 text-[#102019] sm:px-8 sm:pt-14 sm:pb-20">
      <div className="text-center">
        <Heading as="h1" className="mx-auto max-w-[700px] text-4xl leading-[1.12] font-extrabold tracking-tight sm:text-5xl">Build with Casefy faster.</Heading>
        <Reveal delay={0.08}><P variant="unstyled" className="mx-auto mt-6 max-w-[600px] text-base leading-6 font-medium text-[#526159]">
          Guides and workflow examples for turning stories, documents, and URLs into a clear testing plan.
        </P></Reveal>

      </div>

      <div className="mx-auto mt-12 max-w-[1040px]">
        <div className="space-y-6">
          <div className="grid gap-5 sm:gap-6 md:grid-cols-3">
          <DocGuide delay={0.0} title="Quick start" description="Set up your workspace and prepare your first test-generation request." tag="Start here" to="/test-generator" actionLabel="Open test generator" icon={BookOpen} featured>
            <li className="flex gap-3 text-sm leading-6 text-[#526159]">
              <Span variant="accent" className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-[#edf3ef] text-xs font-semibold">1</Span>
              <Span>Create an account and choose your role and primary workspace name during setup.</Span>
            </li>
            <li className="flex gap-3 text-sm leading-6 text-[#526159]">
              <Span variant="accent" className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-[#edf3ef] text-xs font-semibold">2</Span>
              <Span>Open Test generator and select your workspace. Choose User story, then enter a subject and description with your acceptance criteria.</Span>
            </li>
            <li className="flex gap-3 text-sm leading-6 text-[#526159]">
              <Span variant="accent" className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-[#edf3ef] text-xs font-semibold">3</Span>
              <Span>Set the number of test cases, priorities, and test types. Configure LLM + Playwright and review your request.</Span>
            </li>
            <li className="flex gap-3 text-sm leading-6 text-[#526159]">
              <Span variant="accent" className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-[#edf3ef] text-xs font-semibold">4</Span>
              <Span>Download the request as JSON if you want to keep it. Generation is currently a UI preview; it does not send a request to an AI provider.</Span>
            </li>
          </DocGuide>
          <DocGuide delay={0.1} title="Test generator" description="Learn how stories, documents, and URLs shape your test coverage." tag="Guide" to="/test-generator" actionLabel="Try the composer" icon={ListChecks}>
            <li className="flex gap-3 text-sm leading-6 text-[#526159]">
              <Span variant="accent" className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-[#edf3ef] text-xs font-semibold">1</Span>
              <Span>Choose User story for a subject and description, Documents for requirement files, or Website URL for a page address.</Span>
            </li>
            <li className="flex gap-3 text-sm leading-6 text-[#526159]">
              <Span variant="accent" className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-[#edf3ef] text-xs font-semibold">2</Span>
              <Span>Choose the number of test cases and priority. Combine Functional, Positive, Negative, Edge cases, Security, and Accessibility coverage as needed.</Span>
            </li>
            <li className="flex gap-3 text-sm leading-6 text-[#526159]">
              <Span variant="accent" className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-[#edf3ef] text-xs font-semibold">3</Span>
              <Span>Open LLM + Playwright settings to adjust reasoning and output detail. Both work together in one workflow.</Span>
            </li>
            <li className="flex gap-3 text-sm leading-6 text-[#526159]">
              <Span variant="accent" className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-[#edf3ef] text-xs font-semibold">4</Span>
              <Span>Select Generate tests to check your inputs. This preview does not generate test cases, parse document contents, or visit websites.</Span>
            </li>
          </DocGuide>
          <DocGuide delay={0.2} title="Run reports" description="Understand where results and evidence fit into your testing workflow." tag="Workflow" support actionLabel="Ask about reports" icon={ChartNoAxesCombined}>
            <li className="flex gap-3 text-sm leading-6 text-[#526159]">
              <Span variant="accent" className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-[#edf3ef] text-xs font-semibold">1</Span>
              <Span>Start by preparing clear requirements and reviewing the coverage you need in Test generator.</Span>
            </li>
            <li className="flex gap-3 text-sm leading-6 text-[#526159]">
              <Span variant="accent" className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-[#edf3ef] text-xs font-semibold">2</Span>
              <Span>Test execution and run reports are planned. The current generator preview does not execute tests or produce report data.</Span>
            </li>
            <li className="flex gap-3 text-sm leading-6 text-[#526159]">
              <Span variant="accent" className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-[#edf3ef] text-xs font-semibold">3</Span>
              <Span>For now, download your generation request to share the proposed inputs and settings with your team.</Span>
            </li>
          </DocGuide>
          </div>
          <div className="grid gap-5 sm:gap-6 md:grid-cols-3">
            <Reveal as="section" className="min-w-0 rounded-md border border-[#CFDDD5] bg-white p-6 sm:p-8" aria-label="Popular guides">
              <H2>Popular guides</H2>
              <div className="mt-4 space-y-3">
          <DocGuide delay={0.0} title="Import from requirements" description="Work with user stories and requirement documents." tag="Guide" to="/test-generator" actionLabel="Add requirements" compact summary="User story and document sources">
            <li className="flex gap-3 text-sm leading-6 text-[#526159]">
              <Span variant="accent" className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-[#edf3ef] text-xs font-semibold">1</Span>
              <Span>For a user story, add a short subject and describe the expected behavior, acceptance criteria, and important rules.</Span>
            </li>
            <li className="flex gap-3 text-sm leading-6 text-[#526159]">
              <Span variant="accent" className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-[#edf3ef] text-xs font-semibold">2</Span>
              <Span>For documents, attach PDF, DOCX, TXT, or Markdown files. You can select up to 5 files, each containing content and no larger than 10 MB.</Span>
            </li>
            <li className="flex gap-3 text-sm leading-6 text-[#526159]">
              <Span variant="accent" className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-[#edf3ef] text-xs font-semibold">3</Span>
              <Span>Add optional instructions to explain what to include or exclude, then review your request.</Span>
            </li>
            <li className="flex gap-3 text-sm leading-6 text-[#526159]">
              <Span variant="accent" className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-[#edf3ef] text-xs font-semibold">4</Span>
              <Span>Files stay in your browser in this preview. Downloaded requests include file names and sizes, without document contents.</Span>
            </li>
          </DocGuide>
          <DocGuide delay={0.1} title="Generate from URLs" description="Prepare website context for pages and states." tag="Guide" to="/test-generator" actionLabel="Open URL input" compact summary="Explore pages and states">
            <li className="flex gap-3 text-sm leading-6 text-[#526159]">
              <Span variant="accent" className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-[#edf3ef] text-xs font-semibold">1</Span>
              <Span>Website URL input is available on Plus, Pro, and Ultra. Free includes user stories and documents.</Span>
            </li>
            <li className="flex gap-3 text-sm leading-6 text-[#526159]">
              <Span variant="accent" className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-[#edf3ef] text-xs font-semibold">2</Span>
              <Span>Choose Website URL and enter an HTTP or HTTPS address without embedded credentials.</Span>
            </li>
            <li className="flex gap-3 text-sm leading-6 text-[#526159]">
              <Span variant="accent" className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-[#edf3ef] text-xs font-semibold">3</Span>
              <Span>Describe the pages, user journeys, or states you want to cover in the additional instructions.</Span>
            </li>
            <li className="flex gap-3 text-sm leading-6 text-[#526159]">
              <Span variant="accent" className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-[#edf3ef] text-xs font-semibold">4</Span>
              <Span>Review the URL and coverage settings before downloading the request. The current preview does not visit the website or generate tests.</Span>
            </li>
          </DocGuide>
              </div>
            </Reveal>
          <DocGuide delay={0.2} title="API reference" description="Follow the status of generation APIs and integration workflows." tag="Integration status" support actionLabel="Contact support" >
            <li className="flex gap-3 text-sm leading-6 text-[#526159]">
              <Span variant="accent" className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-[#edf3ef] text-xs font-semibold">1</Span>
              <Span>A public test-generation API, CI integration, and generation webhooks are planned. They are not available in the current preview.</Span>
            </li>
            <li className="flex gap-3 text-sm leading-6 text-[#526159]">
              <Span variant="accent" className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-[#edf3ef] text-xs font-semibold">2</Span>
              <Span>Use the Test generator interface to prepare and download a request with your source, model configuration, and coverage settings.</Span>
            </li>
            <li className="flex gap-3 text-sm leading-6 text-[#526159]">
              <Span variant="accent" className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-[#edf3ef] text-xs font-semibold">3</Span>
              <Span>Contact support to discuss your integration requirements.</Span>
            </li>
          </DocGuide>
              <Reveal as="section" delay={0.2} aria-labelledby="docs-help" className="min-w-0 rounded-md border border-[#CFDDD5] bg-white p-6 sm:p-8">
                <H2 id="docs-help">Need help?</H2>
                <P variant="unstyled" className="mt-4 text-sm leading-6 text-[#526159]">Find setup answers, compare plans, or get help with your account.</P>
                <div className="mt-5 flex flex-wrap gap-2">
                  <SupportButton variant="secondary" size="custom" className="min-h-11 px-3 text-xs font-medium">Support</SupportButton>
                  <Button to="/policy" variant="secondary" size="custom" className="min-h-11 px-3 text-xs font-medium">Policy</Button>
                  <Button to="/privacy" variant="secondary" size="custom" className="min-h-11 px-3 text-xs font-medium">Privacy</Button>
                  <Button to="/terms" variant="secondary" size="custom" className="min-h-11 px-3 text-xs font-medium">Terms</Button>
                </div>
              </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
