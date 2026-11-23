import H1 from "../ui/H1";
import P from "../ui/P";
import Span from "../ui/Span";
import Button from "../ui/Button";
import { useState } from "react";
import { Link } from "react-router-dom";
import {
  RiArrowLeftLine as ArrowLeft,
  RiMenuLine as Menu,
} from "react-icons/ri";
import DashboardSidebar from "../components/DashboardSidebar";
import SubscriptionHistory from "../components/SubscriptionHistory";
import { planLabels } from "../features/authentication/plans";

export default function SubscriptionHistoryPage({ user }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#f6f8f7] text-[#102019] lg:pl-64">
      <DashboardSidebar
        user={user}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      <main className="mx-auto max-w-[1440px] px-4 py-6 sm:px-8 lg:p-10">
        <div className="mb-6 flex items-center gap-3">
          <Button
            variant="outline"
            size="custom"
            type="button"
            aria-label="Open navigation"
            aria-controls="dashboard-sidebar"
            aria-expanded={isSidebarOpen}
            onClick={() => setIsSidebarOpen(true)}
            className="flex size-11 shrink-0 lg:hidden"
          >
            <Menu size={20} aria-hidden="true" />
          </Button>
          <Link
            to="/settings#billing"
            className="inline-flex min-h-11 items-center gap-2 rounded-md text-sm font-semibold text-[#294137] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#294137]"
          >
            <ArrowLeft size={18} aria-hidden="true" />
            Back to Settings
          </Link>
        </div>
        <header>
          <H1>Subscription history</H1>
          <P
            variant="unstyled"
            className="mt-3 max-w-xl text-sm leading-6 text-[#526159]"
          >
            Your subscription and access dates, together in one place.
          </P>
        </header>
        <div className="mt-8 max-w-4xl overflow-hidden rounded-md border border-[#CFDDD5] bg-white">
          <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-5 sm:px-8">
            <div>
              <P
                variant="unstyled"
                className="text-xs font-medium text-[#526159]"
              >
                Current plan
              </P>
              <P variant="unstyled" className="mt-1 text-xl font-bold">
                {planLabels[user.plan] || "Free"}
              </P>
            </div>
            {user.cancelAtPeriodEnd && (
              <Span className="rounded-md border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-900">
                Cancels at period end
              </Span>
            )}
          </div>
          <SubscriptionHistory user={user} />
        </div>
      </main>
    </div>
  );
}
