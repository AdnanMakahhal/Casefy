import Heading from "../ui/Heading";
import H2 from "../ui/H2";
import P from "../ui/P";
import Span from "../ui/Span";
import Button from "../ui/Button";
import { useState } from "react";
import {
  RiPulseLine as Activity,
  RiCalendarLine as CalendarDays,
  RiCheckboxCircleLine as CheckCircle2,
  RiClipboardLine as ClipboardList,
  RiFolderChartLine as FolderKanban,
  RiMenuLine as Menu,
  RiPlayCircleLine as PlayCircle,
  RiSparklingLine as Sparkles
} from "react-icons/ri";

import DashboardSidebar from "../components/DashboardSidebar";

const periods = [
  { label: "Day", description: "the last day" },
  { label: "Week", description: "the last week" },
  { label: "Month", description: "the last month" },
  { label: "Year", description: "the last year" },
];
const metrics = [
  { title: "Active projects", icon: FolderKanban },
  { title: "Test cases", icon: ClipboardList },
  { title: "Pass rate", icon: CheckCircle2 },
  { title: "Test runs", icon: PlayCircle },
];

function Dashboard({ user }) {
  const [period, setPeriod] = useState(periods[0]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#f6f8f7] text-[#102019] lg:pl-64">
      <a
        href="#dashboard-content"
        className="sr-only rounded-md bg-white p-3 focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60]"
      >
        Skip to dashboard
      </a>
      <DashboardSidebar
        user={user}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      <main
        id="dashboard-content"
        className="mx-auto max-w-[1440px] px-4 py-6 sm:px-8 lg:p-10"
      >
        <header className="flex flex-wrap items-start justify-between gap-5">
          <div className="flex items-start gap-3">
            <Button variant="outline" size="custom"
              type="button"
              aria-label="Open navigation"
              aria-controls="dashboard-sidebar"
              aria-expanded={isSidebarOpen}
              onClick={() => setIsSidebarOpen(true)}
              className="flex size-11 shrink-0 lg:hidden"
            >
              <Menu size={20} aria-hidden="true" />
            </Button>
            <div>
              <Heading as="h1">
                Dashboard
              </Heading>
              <P variant="unstyled" className="mt-3 text-sm leading-6 text-[#526159]">
                Your projects, test coverage, and activity at a glance.
              </P>
            </div>
          </div>
          <Button variant="primary" size="custom"
            to="/test-generator"
            className="min-h-11 px-5"
          >
            <Sparkles size={17} aria-hidden="true" />
            Generate test cases
          </Button>
        </header>

        <section aria-labelledby="overview-heading" className="mt-9">
          <div className="mb-5 flex items-center justify-between gap-2">
            <H2 variant="unstyled"
              id="overview-heading"
              className="min-w-0 text-sm font-bold tracking-tight sm:text-lg"
            >
              Testing overview
            </H2>
            <div
              role="group"
              aria-label="Filter dashboard by time period"
              className="flex shrink-0 items-center gap-0.5 rounded-md border border-[#CFDDD5] bg-white p-1 sm:gap-1"
            >
              <CalendarDays
                size={16}
                className="mx-2 hidden text-[#526159] sm:block"
                aria-hidden="true"
              />
              {periods.map((option) => (
                <Button variant="unstyled"
                  key={option.label}
                  type="button"
                  onClick={() => setPeriod(option)}
                  aria-pressed={period.label === option.label}
                  className={`min-h-10 cursor-pointer rounded-md px-2 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#294137] sm:px-3 sm:text-sm ${period.label === option.label ? "bg-[#294137] text-white" : "text-[#526159] hover:bg-[#edf3ef]"}`}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {metrics.map(({ title, icon: Icon }) => (
              <article
                key={title}
                className="rounded-md border border-[#CFDDD5] bg-white p-5"
              >
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold text-[#526159]">
                    {title}
                  </h3>
                  <Span variant="accent" className="flex size-9 items-center justify-center rounded-md bg-[#edf3ef]">
                    <Icon size={18} aria-hidden="true" />
                  </Span>
                </div>
                <P variant="unstyled"
                  aria-label={`${title}: ${title === "Pass rate" ? "0%" : "0"}`}
                  className="mt-5 text-3xl font-extrabold tracking-tight text-[#526159]"
                >
                  {title === "Pass rate" ? "0%" : "0"}
                </P>
                <P variant="unstyled" className="mt-2 text-xs text-[#526159]">
                  No data for this period
                </P>
              </article>
            ))}
          </div>
          <P variant="unstyled" role="status" className="mt-4 text-xs text-[#526159]">
            Showing activity for {period.description}.
          </P>
        </section>

        <div className="mt-8 grid gap-6 xl:grid-cols-[1.7fr_1fr]">
          <section
            aria-labelledby="projects-heading"
            className="overflow-hidden rounded-md border border-[#CFDDD5] bg-white"
          >
            <div className="border-b border-[#CFDDD5] px-6 py-5">
              <H2 variant="unstyled"
                id="projects-heading"
                className="text-lg font-bold tracking-tight"
              >
                Recent projects
              </H2>
              <P variant="unstyled" className="mt-1 text-sm text-[#526159]">
                Your latest web application projects.
              </P>
            </div>
            <div className="flex min-h-64 flex-col items-center justify-center px-6 py-10 text-center">
              <FolderKanban
                size={26}
                className="mb-4 text-[#526159]"
                aria-hidden="true"
              />
              <h3 className="text-sm font-semibold">No projects to show</h3>
              <P variant="unstyled" className="mt-2 max-w-xs text-sm leading-6 text-[#526159]">
                Projects from {period.description} will appear here.
              </P>
            </div>
          </section>
          <section
            aria-labelledby="activity-heading"
            className="overflow-hidden rounded-md border border-[#CFDDD5] bg-white"
          >
            <div className="border-b border-[#CFDDD5] px-6 py-5">
              <H2 variant="unstyled"
                id="activity-heading"
                className="text-lg font-bold tracking-tight"
              >
                Recent activity
              </H2>
              <P variant="unstyled" className="mt-1 text-sm text-[#526159]">
                Updates across your testing workflow.
              </P>
            </div>
            <div className="flex min-h-64 flex-col items-center justify-center px-6 py-10 text-center">
              <Activity
                size={26}
                className="mb-4 text-[#526159]"
                aria-hidden="true"
              />
              <h3 className="text-sm font-semibold">All quiet for now</h3>
              <P variant="unstyled" className="mt-2 max-w-xs text-sm leading-6 text-[#526159]">
                Test runs and updates from {period.description} will appear
                here.
              </P>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

export default Dashboard;

