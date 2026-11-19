import { useState } from "react";
import { Link } from "react-router-dom";
import { RiArrowLeftLine as ArrowLeft, RiMenuLine as Menu } from "react-icons/ri";
import DashboardSidebar from "../components/DashboardSidebar";
import SubscriptionHistory from "../components/SubscriptionHistory";
import { planLabels } from "../features/authentication/plans";

export default function SubscriptionHistoryPage({ user }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#f6f8f7] text-[#102019] lg:pl-64">
      <DashboardSidebar user={user} isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <main className="mx-auto max-w-[1440px] px-4 py-6 sm:px-8 lg:p-10">
        <div className="mb-6 flex items-center gap-3">
          <button type="button" aria-label="Open navigation" aria-controls="dashboard-sidebar" aria-expanded={isSidebarOpen} onClick={() => setIsSidebarOpen(true)} className="flex size-11 shrink-0 items-center justify-center rounded-md border border-[#CFDDD5] bg-white text-[#294137] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#294137] lg:hidden">
            <Menu size={20} aria-hidden="true" />
          </button>
          <Link to="/settings" className="inline-flex min-h-11 items-center gap-2 rounded-md text-sm font-semibold text-[#294137] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#294137]">
            <ArrowLeft size={18} aria-hidden="true" />
            Back to Settings
          </Link>
        </div>
        <header>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Subscription history</h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-[#526159]">Your subscription and access dates, together in one place.</p>
        </header>
        <div className="mt-8 max-w-4xl overflow-hidden rounded-md border border-[#CFDDD5] bg-white">
          <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-5 sm:px-8">
            <div>
              <p className="text-xs font-medium text-[#526159]">Current plan</p>
              <p className="mt-1 text-xl font-bold">{planLabels[user.plan] || "Free"}</p>
            </div>
            {user.cancelAtPeriodEnd && <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-900">Cancels at period end</span>}
          </div>
          <SubscriptionHistory user={user} />
        </div>
      </main>
    </div>
  );
}
