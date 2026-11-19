import Heading from "../components/Heading";
import { useState } from "react";
import {
  RiArrowRightLine as ArrowRight,
  RiCheckboxCircleLine as CheckCircle2,
  RiTimeLine as Clock3,
  RiFileTextLine as FileText,
  RiMenuLine as Menu,
  RiVideoOnLine as MonitorPlay,
  RiPlayCircleLine as PlayCircle,
  RiSparklingLine as Sparkles
} from "react-icons/ri";
import { Link } from "react-router-dom";
import DashboardSidebar from "../components/DashboardSidebar";

const buttonClass =
  "inline-flex min-h-10 items-center justify-center gap-2 rounded-md px-4 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#294137]";

export default function Executions({ user }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#f6f8f7] text-[#102019] lg:pl-64">
      <DashboardSidebar
        user={user}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <main className="mx-auto max-w-[1440px] px-4 py-6 sm:px-8 lg:p-10">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <button
              type="button"
              aria-label="Open navigation"
              aria-controls="dashboard-sidebar"
              aria-expanded={sidebarOpen}
              onClick={() => setSidebarOpen(true)}
              className="flex size-11 shrink-0 items-center justify-center rounded-md border border-[#CFDDD5] bg-white text-[#294137] focus-visible:outline-2 focus-visible:outline-[#294137] lg:hidden"
            >
              <Menu size={20} aria-hidden="true" />
            </button>
            <div>
              <Heading as="h1" className="text-3xl font-extrabold tracking-tight sm:text-4xl">Executions</Heading>
              <p className="mt-3 text-sm leading-6 text-[#526159]">
                Track browser test runs and review their outcomes.
              </p>
            </div>
          </div>
          <Link to="/test-generator" className={`${buttonClass} bg-[#294137] text-white hover:bg-[#20332b]`}>
            <Sparkles size={16} aria-hidden="true" />
            Prepare tests
          </Link>
        </header>

        <section aria-labelledby="execution-setup-heading" className="mt-8 flex flex-col gap-5 rounded-md border border-[#CFDDD5] bg-[#edf3ef] p-5 sm:flex-row sm:items-center sm:p-6">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-md border border-[#cfddd5] bg-white text-[#294137]">
            <MonitorPlay size={22} aria-hidden="true" />
          </span>
          <div className="flex-1">
            <p className="text-[10px] font-semibold tracking-widest text-[#526159]">EXECUTION SETUP</p>
            <h2 id="execution-setup-heading" className="mt-1 text-base font-semibold">Browser runner awaiting setup</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#526159]">
              Automated runs will be available once a browser runner is connected.
              You can prepare test requests in Test Generator while execution setup is pending.
            </p>
          </div>
          <span className="inline-flex w-fit items-center gap-2 rounded-md border border-[#CFDDD5] bg-white px-3 py-2 text-xs font-medium text-[#526159]">
            <Clock3 size={14} aria-hidden="true" />
            Not connected
          </span>
        </section>

        <section aria-labelledby="execution-history-heading" className="mt-6 overflow-hidden rounded-md border border-[#CFDDD5] bg-white">
          <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e1e9e4] px-5 py-5 sm:px-6">
            <div>
              <h2 id="execution-history-heading" className="text-base font-semibold">Run history</h2>
              <p className="mt-1 text-xs leading-5 text-[#718578]">Browser executions and their results will appear here.</p>
            </div>
            <Link to="/reports" className="inline-flex min-h-10 items-center gap-2 rounded-md px-2 text-xs font-semibold text-[#294137] hover:bg-[#edf3ef] focus-visible:outline-2 focus-visible:outline-[#294137]">
              Generation reports <ArrowRight size={15} aria-hidden="true" />
            </Link>
          </header>
          <div className="flex flex-col items-center px-5 py-14 text-center sm:py-20">
            <span className="flex size-14 items-center justify-center rounded-md bg-[#edf3ef] text-[#6c8073]">
              <PlayCircle size={28} aria-hidden="true" />
            </span>
            <h3 className="mt-5 text-lg font-semibold">No executions yet</h3>
            <p className="mt-2 max-w-sm text-sm leading-6 text-[#718578]">
              Once the runner is connected, this is where you’ll see run status,
              passed and failed tests, and details for each execution.
            </p>
            <Link to="/test-generator" className={`${buttonClass} mt-6 border border-[#CFDDD5] text-[#294137] hover:bg-[#edf3ef]`}>
              Go to Test Generator <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
        </section>

        <section aria-labelledby="execution-workflow-heading" className="mt-8">
          <h2 id="execution-workflow-heading" className="text-sm font-semibold text-[#526159]">From requirements to results</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {[
              { icon: FileText, title: "1. Prepare your tests", description: "Add requirements, choose coverage, and review your test request in Test Generator." },
              { icon: MonitorPlay, title: "2. Run in a browser", description: "After runner setup, execute supported tests against your application." },
              { icon: CheckCircle2, title: "3. Review outcomes", description: "Use execution results to investigate failures and follow up on issues." },
            ].map(({ icon: Icon, title, description }) => (
              <article key={title} className="rounded-md border border-[#CFDDD5] bg-white p-5">
                <Icon size={19} aria-hidden="true" className="text-[#718578]" />
                <h3 className="mt-4 text-sm font-semibold">{title}</h3>
                <p className="mt-2 text-xs leading-6 text-[#718578]">{description}</p>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
