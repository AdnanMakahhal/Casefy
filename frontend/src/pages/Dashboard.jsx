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
import { Link } from "react-router-dom";
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
            <button
              type="button"
              aria-label="Open navigation"
              aria-controls="dashboard-sidebar"
              aria-expanded={isSidebarOpen}
              onClick={() => setIsSidebarOpen(true)}
              className="flex size-11 shrink-0 items-center justify-center rounded-md border border-[#CFDDD5] bg-white text-[#294137] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#294137] lg:hidden"
            >
              <Menu size={20} aria-hidden="true" />
            </button>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
                Dashboard
              </h1>
              <p className="mt-3 text-sm leading-6 text-[#526159]">
                Your projects, test coverage, and activity at a glance.
              </p>
            </div>
          </div>
          <Link
            to="/test-generator"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-[#294137] px-5 text-sm font-semibold text-white hover:bg-[#20332b] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#294137]"
          >
            <Sparkles size={17} aria-hidden="true" />
            Generate test cases
          </Link>
        </header>

        <section aria-labelledby="overview-heading" className="mt-9">
          <div className="mb-5 flex items-center justify-between gap-2">
            <h2
              id="overview-heading"
              className="min-w-0 text-sm font-bold tracking-tight sm:text-lg"
            >
              Testing overview
            </h2>
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
                <button
                  key={option.label}
                  type="button"
                  onClick={() => setPeriod(option)}
                  aria-pressed={period.label === option.label}
                  className={`min-h-10 cursor-pointer rounded-md px-2 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#294137] sm:px-3 sm:text-sm ${period.label === option.label ? "bg-[#294137] text-white" : "text-[#526159] hover:bg-[#edf3ef]"}`}
                >
                  {option.label}
                </button>
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
                  <span className="flex size-9 items-center justify-center rounded-md bg-[#edf3ef] text-[#294137]">
                    <Icon size={18} aria-hidden="true" />
                  </span>
                </div>
                <p
                  aria-label="No data available"
                  className="mt-5 text-3xl font-extrabold tracking-tight text-[#526159]"
                >
                  &mdash;
                </p>
                <p className="mt-2 text-xs text-[#526159]">
                  No data for this period
                </p>
              </article>
            ))}
          </div>
          <p role="status" className="mt-4 text-xs text-[#526159]">
            Showing activity for {period.description}.
          </p>
        </section>

        <div className="mt-8 grid gap-6 xl:grid-cols-[1.7fr_1fr]">
          <section
            aria-labelledby="projects-heading"
            className="overflow-hidden rounded-md border border-[#CFDDD5] bg-white"
          >
            <div className="border-b border-[#CFDDD5] px-6 py-5">
              <h2
                id="projects-heading"
                className="text-lg font-bold tracking-tight"
              >
                Recent projects
              </h2>
              <p className="mt-1 text-sm text-[#526159]">
                Your latest web application projects.
              </p>
            </div>
            <div className="flex min-h-64 flex-col items-center justify-center px-6 py-10 text-center">
              <FolderKanban
                size={26}
                className="mb-4 text-[#526159]"
                aria-hidden="true"
              />
              <h3 className="text-sm font-semibold">No projects to show</h3>
              <p className="mt-2 max-w-xs text-sm leading-6 text-[#526159]">
                Projects from {period.description} will appear here.
              </p>
            </div>
          </section>
          <section
            aria-labelledby="activity-heading"
            className="overflow-hidden rounded-md border border-[#CFDDD5] bg-white"
          >
            <div className="border-b border-[#CFDDD5] px-6 py-5">
              <h2
                id="activity-heading"
                className="text-lg font-bold tracking-tight"
              >
                Recent activity
              </h2>
              <p className="mt-1 text-sm text-[#526159]">
                Updates across your testing workflow.
              </p>
            </div>
            <div className="flex min-h-64 flex-col items-center justify-center px-6 py-10 text-center">
              <Activity
                size={26}
                className="mb-4 text-[#526159]"
                aria-hidden="true"
              />
              <h3 className="text-sm font-semibold">All quiet for now</h3>
              <p className="mt-2 max-w-xs text-sm leading-6 text-[#526159]">
                Test runs and updates from {period.description} will appear
                here.
              </p>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

export default Dashboard;

