import Heading from "../components/Heading";
import { useEffect, useRef, useState } from "react";
import {
  RiArrowRightUpLine as ArrowUpRight,
  RiBookOpenLine as BookOpen,
  RiLineChartLine as ChartNoAxesCombined,
  RiListCheck2 as ListChecks,
  RiSearchLine as Search,
  RiCloseLine as X
} from "react-icons/ri";
import { Link } from "react-router-dom";
import AccountModal from "../components/AccountModal";

const guides = [
  {
    id: "quick-start",
    title: "Quick start",
    tag: "Start here",
    description:
      "Set up your workspace and prepare your first test-generation request.",
    steps: [
      "Create an account and choose your role and primary workspace name during setup.",
      "Open Test generator and select your workspace. Choose User story, then enter a subject and description with your acceptance criteria.",
      "Set the number of test cases, priorities, and test types. Choose a model preview and review your request.",
      "Download the request as JSON if you want to keep it. Generation is currently a UI preview; it does not send a request to an AI provider.",
    ],
    to: "/test-generator",
    action: "Open test generator",
  },
  {
    id: "generator",
    title: "Test generator",
    tag: "Guide",
    description:
      "Learn how stories, documents, and URLs shape your test coverage.",
    steps: [
      "Choose User story for a subject and description, Documents for requirement files, or Website URL for a page address.",
      "Choose the number of test cases and priority. Combine Functional, Positive, Negative, Edge cases, Security, and Accessibility coverage as needed.",
      "Search the model picker and adjust reasoning and output detail. Each model keeps its own settings while you work.",
      "Select Generate tests to check your inputs. This preview does not generate test cases, parse document contents, or visit websites.",
    ],
    to: "/test-generator",
    action: "Try the composer",
  },
  {
    id: "reports",
    title: "Run reports",
    tag: "Workflow",
    description:
      "Understand where results and evidence fit into your testing workflow.",
    steps: [
      "Start by preparing clear requirements and reviewing the coverage you need in Test generator.",
      "Test execution and run reports are planned. The current generator preview does not execute tests or produce report data.",
      "For now, download your generation request to share the proposed inputs and settings with your team.",
    ],
    to: "/support",
    action: "Ask about reports",
  },
  {
    id: "requirements",
    title: "Import from requirements",
    tag: "Guide",
    description: "Work with user stories and requirement documents.",
    steps: [
      "For a user story, add a short subject and describe the expected behavior, acceptance criteria, and important rules.",
      "For documents, attach PDF, DOCX, TXT, or Markdown files. You can select up to 5 files, each containing content and no larger than 10 MB.",
      "Add optional instructions to explain what to include or exclude, then review your request.",
      "Files stay in your browser in this preview. Downloaded requests include file names and sizes, without document contents.",
    ],
    to: "/test-generator",
    action: "Add requirements",
  },
  {
    id: "urls",
    title: "Generate from URLs",
    tag: "Guide",
    description: "Prepare website context for pages and states.",
    steps: [
      "Website URL input is available on Plus, Pro, and Custom. Free includes user stories and documents.",
      "Choose Website URL and enter an HTTP or HTTPS address without embedded credentials.",
      "Describe the pages, user journeys, or states you want to cover in the additional instructions.",
      "Review the URL and coverage settings before downloading the request. The current preview does not visit the website or generate tests.",
    ],
    to: "/test-generator",
    action: "Open URL input",
  },
  {
    id: "api",
    title: "API reference",
    tag: "Coming later",
    description:
      "Follow the status of generation APIs and integration workflows.",
    steps: [
      "A public test-generation API, CI integration, and generation webhooks are planned. They are not available in the current preview.",
      "Use the Test generator interface to prepare and download a request with your source, model configuration, and coverage settings.",
      "Contact support to discuss your integration requirements.",
    ],
    to: "/support",
    action: "Contact support",
  },
];
const buttonBase =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-md border border-[#2941372e] px-5 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#294137]";
const buttonClass = `${buttonBase} bg-[#294137] text-white hover:bg-[#20332b]`;

export default function Docs() {
  const [query, setQuery] = useState("");
  const [activeGuide, setActiveGuide] = useState(null);
  const search = useRef(null);
  const matches = guides.filter((guide) =>
    `${guide.title} ${guide.description} ${guide.steps.join(" ")}`
      .toLowerCase()
      .includes(query.trim().toLowerCase()),
  );

  useEffect(() => {
    function shortcut(event) {
      if (
        event.key === "/" &&
        !event.ctrlKey &&
        !event.metaKey &&
        !event.altKey &&
        !activeGuide &&
        !event.target.closest("input, textarea, [contenteditable]")
      ) {
        event.preventDefault();
        search.current?.focus();
      }
    }
    document.addEventListener("keydown", shortcut);
    return () => document.removeEventListener("keydown", shortcut);
  }, [activeGuide]);

  return (
    <section className="mx-auto max-w-6xl px-4 pt-12 pb-16 text-[#102019] sm:px-8 sm:pt-14 sm:pb-20">
      <div className="text-center">
        <Heading as="h1" className="mx-auto max-w-[700px] text-4xl leading-[1.12] font-extrabold tracking-tight sm:text-5xl">
          Build with Casefy faster.
        </Heading>
        <p className="mx-auto mt-6 max-w-[600px] text-base leading-6 font-medium text-[#526159]">
          Guides and workflow examples for turning stories, documents, and URLs
          into a clear testing plan.
        </p>
        <div role="search" className="relative mx-auto mt-8 max-w-[600px]">
          <Search
            size={18}
            aria-hidden="true"
            className="pointer-events-none absolute top-4 left-4 text-[#718578]"
          />
          <label htmlFor="docs-search" className="sr-only">
            Search documentation
          </label>
          <input
            ref={search}
            id="docs-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Escape") setQuery("");
            }}
            placeholder="Search docs, guides, integrations..."
            className="min-h-14 w-full rounded-md border border-[#CFDDD5] bg-white pr-12 pl-12 text-sm text-[#294137] placeholder:text-[#8a9890] focus:outline-2 focus:outline-offset-2 focus:outline-[#294137] [&::-webkit-search-cancel-button]:appearance-none"
          />
          {query ? (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => {
                setQuery("");
                search.current?.focus();
              }}
              className="absolute top-2 right-2 flex size-10 cursor-pointer items-center justify-center rounded-md text-[#718578] hover:bg-[#edf3ef] focus-visible:outline-2 focus-visible:outline-[#294137]"
            >
              <X size={16} />
            </button>
          ) : (
            <kbd
              aria-hidden="true"
              className="pointer-events-none absolute top-4 right-4 rounded-md border border-[#dce6df] px-1.5 text-xs leading-6 text-[#8a9890]"
            >
              /
            </kbd>
          )}
        </div>
      </div>

      {query.trim() ? (
        <section
          aria-labelledby="docs-results"
          className="mx-auto mt-12 max-w-[1040px]"
        >
          <h2
            id="docs-results"
            role="status"
            className="mb-5 text-sm font-semibold text-[#526159]"
          >
            {matches.length} {matches.length === 1 ? "guide" : "guides"} found
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {matches.map((guide) => (
              <button
                key={guide.id}
                type="button"
                onClick={() => setActiveGuide(guide)}
                className="cursor-pointer rounded-md border border-[#CFDDD5] bg-white p-6 text-left transition-colors hover:bg-[#edf3ef] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#294137]"
              >
                <span className="block text-base font-semibold">
                  {guide.title}
                </span>
                <span className="mt-2 block text-sm leading-6 text-[#526159]">
                  {guide.description}
                </span>
              </button>
            ))}
          </div>
          {!matches.length && (
            <p className="rounded-md border border-dashed border-[#cfddd5] p-8 text-center text-sm text-[#718578]">
              No matching guides. Try searching for stories, documents, or URLs.
            </p>
          )}
        </section>
      ) : (
        <>
          <div className="mx-auto mt-12 grid max-w-[1040px] gap-5 md:grid-cols-3 sm:gap-6">
            {guides.slice(0, 3).map((guide, index) => (
              <article
                key={guide.id}
                className={`flex min-w-0 flex-col rounded-md border border-[#CFDDD5] p-6 sm:p-8 ${index === 0 ? "bg-[#edf3ef]" : "bg-white"}`}
              >
                <span className="mb-6 flex size-12 items-center justify-center rounded-md bg-[#294137] text-white">
                  {index === 0 ? (
                    <BookOpen size={22} aria-hidden="true" />
                  ) : index === 1 ? (
                    <ListChecks size={22} aria-hidden="true" />
                  ) : (
                    <ChartNoAxesCombined size={22} aria-hidden="true" />
                  )}
                </span>
                <h2 className="text-2xl font-extrabold tracking-tight">
                  {guide.title}
                </h2>
                <p className="mt-3 flex-1 text-sm leading-6 text-[#526159]">
                  {guide.description}
                </p>
                <button
                  type="button"
                  onClick={() => setActiveGuide(guide)}
                  className={`${buttonClass} mt-7 w-fit cursor-pointer`}
                >
                  {guide.tag}
                </button>
              </article>
            ))}
          </div>

          <div className="mx-auto mt-6 grid max-w-[1040px] gap-5 md:grid-cols-3 sm:gap-6">
            <section
              aria-labelledby="popular-guides"
              className="min-w-0 rounded-md border border-[#CFDDD5] bg-white p-6 sm:p-8"
            >
              <h2
                id="popular-guides"
                className="text-2xl font-extrabold tracking-tight"
              >
                Popular guides
              </h2>
              <div className="mt-4 space-y-3">
                {guides.slice(3, 5).map((guide) => (
                  <button
                    key={guide.id}
                    type="button"
                    onClick={() => setActiveGuide(guide)}
                    className="group flex min-h-16 w-full cursor-pointer items-center gap-3 rounded-md px-1 py-2 text-left focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#294137]"
                  >
                    <span
                      aria-hidden="true"
                      className="size-2 shrink-0 rounded-full bg-[#294137]"
                    />
                    <span className="flex-1">
                      <span className="block text-sm font-medium group-hover:underline">
                        {guide.title}
                      </span>
                      <span className="mt-1 block text-xs leading-5 text-[#718578]">
                        {guide.id === "requirements"
                          ? "User story and document sources"
                          : "Explore pages and states"}
                      </span>
                    </span>
                    <ArrowUpRight
                      size={15}
                      aria-hidden="true"
                      className="shrink-0 text-[#718578]"
                    />
                  </button>
                ))}
              </div>
            </section>
            <section
              aria-labelledby="api-reference"
              className="flex flex-col min-w-0 rounded-md border border-[#CFDDD5] bg-white p-6 sm:p-8"
            >
              <h2
                id="api-reference"
                className="text-2xl font-extrabold tracking-tight"
              >
                API reference
              </h2>
              <p className="mt-4 flex-1 text-sm leading-6 text-[#526159]">
                Generation APIs and integrations are coming later. See what is
                available in the current preview.
              </p>
              <button
                type="button"
                onClick={() =>
                  setActiveGuide(guides.find((guide) => guide.id === "api"))
                }
                className={`${buttonClass} mt-5 w-fit cursor-pointer`}
              >
                Integration status
              </button>
            </section>
            <section
              aria-labelledby="docs-help"
              className="min-w-0 rounded-md border border-[#CFDDD5] bg-white p-6 sm:p-8"
            >
              <h2
                id="docs-help"
                className="text-2xl font-extrabold tracking-tight"
              >
                Need help?
              </h2>
              <p className="mt-4 text-sm leading-6 text-[#526159]">
                Find setup answers, compare plans, or get help with your
                account.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                {[
                  ["Support", "/support"],
                  ["Policy", "/policy"],
                  ["Privacy", "/privacy"],
                  ["Terms", "/terms"],
                ].map(([label, to]) => (
                  <Link
                    key={to}
                    to={to}
                    className="inline-flex min-h-11 items-center justify-center rounded-md border border-[#CFDDD5] bg-[#edf3ef] px-3 text-xs font-medium transition-colors hover:bg-[#edf3ef] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#294137]"
                  >
                    {label}
                  </Link>
                ))}
              </div>
            </section>
          </div>
        </>
      )}

      {activeGuide && (
        <AccountModal
          title={activeGuide.title}
          onDismiss={() => setActiveGuide(null)}
        >
          <ol className="space-y-4">
            {activeGuide.steps.map((step, index) => (
              <li
                key={step}
                className="flex gap-3 text-sm leading-6 text-[#526159]"
              >
                <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-[#edf3ef] text-xs font-semibold text-[#294137]">
                  {index + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
          <div className="mt-6 flex justify-end">
            <Link to={activeGuide.to} className={buttonClass}>
              {activeGuide.action}
              <ArrowUpRight size={14} aria-hidden="true" />
            </Link>
          </div>
        </AccountModal>
      )}
    </section>
  );
}
