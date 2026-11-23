import H2 from "../ui/H2";
import P from "../ui/P";
import Span from "../ui/Span";
import Button from "../ui/Button";
import Heading from "../ui/Heading";
import { useState } from "react";
import {
  RiArrowRightLine as ArrowRight,
  RiMenuLine as Menu,
  RiPlayCircleLine as PlayCircle,
  RiSparklingLine as Sparkles
} from "react-icons/ri";
import DashboardSidebar from "../components/DashboardSidebar";

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
            <Button variant="outline" size="custom"
              type="button"
              aria-label="Open navigation"
              aria-controls="dashboard-sidebar"
              aria-expanded={sidebarOpen}
              onClick={() => setSidebarOpen(true)}
              className="flex size-11 shrink-0 lg:hidden"
            >
              <Menu size={20} aria-hidden="true" />
            </Button>
            <div>
              <Heading as="h1">Executions</Heading>
              <P variant="unstyled" className="mt-3 text-sm leading-6 text-[#526159]">
                Your browser test runs and results.
              </P>
            </div>
          </div>
        </header>

        <section aria-labelledby="execution-history-heading" className="mt-7 overflow-hidden rounded-md border border-[#CFDDD5] bg-white">
          <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e1e9e4] px-5 py-4 sm:px-6">
            <div className="flex items-center gap-2">
              <H2 variant="unstyled" id="execution-history-heading" className="text-sm font-semibold">Run history</H2>
              <Span className="rounded-md bg-[#edf3ef] px-2 py-0.5 text-xs font-medium tabular-nums text-[#526159]" aria-label="0 runs">0</Span>
            </div>
            <Button variant="ghost" size="sm" to="/reports">
              Reports <ArrowRight size={15} aria-hidden="true" />
            </Button>
          </header>
          <div className="flex flex-col items-center px-5 py-12 text-center sm:py-16">
            <Span className="flex size-12 items-center justify-center rounded-md bg-[#edf3ef] text-[#294137]">
              <PlayCircle size={24} aria-hidden="true" />
            </Span>
            <h3 className="mt-4 text-base font-semibold">No test runs yet</h3>
            <P variant="unstyled" className="mt-2 max-w-sm text-sm leading-6 text-[#526159]">
              Prepare your tests now. Runs and results will appear here when the browser runner is connected.
            </P>
            <Button to="/test-generator" className="mt-5">
              <Sparkles size={16} aria-hidden="true" />Prepare tests
            </Button>
          </div>
          <div className="flex items-center gap-2 border-t border-[#e1e9e4] bg-[#f6f8f7] px-5 py-3 text-xs text-[#526159] sm:px-6">
            <Span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-[#718578]" />Browser runner not connected
          </div>
        </section>
      </main>
    </div>
  );
}
