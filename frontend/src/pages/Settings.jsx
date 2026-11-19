import { useState } from "react";
import { Link } from "react-router-dom";
import {
  RiMenuLine as Menu,
  RiArrowRightSLine as ChevronRight,
} from "react-icons/ri";
import DashboardSidebar from "../components/DashboardSidebar";
import BillingControls from "../components/BillingControls";
import CreditUsage from "../components/CreditUsage";
import { useLocation } from "react-router-dom";
import { settingsPageLinks } from "../features/settings/navigation";

export default function Settings({ user }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { hash } = useLocation();

  return (
    <div className="min-h-screen bg-[#f6f8f7] text-[#102019] lg:pl-64">
      <DashboardSidebar
        user={user}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      <main className="mx-auto max-w-[1440px] px-4 py-6 sm:px-8 lg:p-10">
        <header className="flex items-start gap-3">
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
              Settings
            </h1>
            <p className="mt-3 text-sm leading-6 text-[#526159]">
              Manage your subscription, plan limits, and billing.
            </p>
          </div>
        </header>
        <section
          aria-labelledby="account-settings-heading"
          className="mt-9 max-w-4xl"
        >
          <h2 id="account-settings-heading" className="text-lg font-bold">
            Account settings
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {settingsPageLinks.map(({ label, description, icon: Icon, to }) => (
              <Link
                key={to}
                to={to}
                className="group flex min-h-32 items-start gap-4 rounded-md border border-[#CFDDD5] bg-white p-5 transition-colors hover:bg-[#edf3ef] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#294137]"
              >
                <span className="flex size-11 shrink-0 items-center justify-center rounded-md bg-[#edf3ef] text-[#294137]">
                  <Icon size={21} aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-bold">{label}</span>
                  <span className="mt-1 block text-sm leading-6 text-[#526159]">
                    {description}
                  </span>
                </span>
                <ChevronRight
                  size={19}
                  aria-hidden="true"
                  className="mt-3 shrink-0 text-[#526159] transition-transform group-hover:translate-x-1 motion-reduce:transition-none"
                />
              </Link>
            ))}
          </div>
        </section>
        <details
          id="credits"
          open={hash === "#credits" || undefined}
          className="group mt-9 max-w-4xl scroll-mt-6 overflow-hidden rounded-md border border-[#CFDDD5] bg-white"
        >
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-5 hover:bg-[#f6f8f7] focus-visible:outline-2 focus-visible:outline-inset sm:px-8 [&::-webkit-details-marker]:hidden">
            <div>
              <h2 className="text-lg font-bold">Credits & usage</h2>
              <p className="mt-1 text-sm leading-6 text-[#526159]">
                Track your balance, monthly allowance, and activity.
              </p>
            </div>
            <ChevronRight
              size={22}
              aria-hidden="true"
              className="shrink-0 transition-transform group-open:rotate-90 motion-reduce:transition-none"
            />
          </summary>
          <div className="border-t border-[#CFDDD5]">
            <CreditUsage user={user} />
          </div>
        </details>
        <details className="group mt-4 max-w-4xl overflow-hidden rounded-md border border-[#CFDDD5] bg-white">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-5 hover:bg-[#f6f8f7] focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-[#294137] sm:px-8 [&::-webkit-details-marker]:hidden">
            <div>
              <h2
                id="subscription-settings-heading"
                className="text-lg font-bold"
              >
                Subscription & billing
              </h2>
              <p className="mt-1 text-sm leading-6 text-[#526159]">
                View your plan details and manage your billing preferences.
              </p>
            </div>
            <ChevronRight
              size={22}
              aria-hidden="true"
              className="shrink-0 text-[#526159] transition-transform group-open:rotate-90 motion-reduce:transition-none"
            />
          </summary>
          <div className="border-t border-[#CFDDD5]">
            <BillingControls user={user} />
          </div>
        </details>
        <details className="group mt-4 max-w-4xl overflow-hidden rounded-md border border-[#CFDDD5] bg-white">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-5 hover:bg-[#f6f8f7] focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-[#294137] sm:px-8 [&::-webkit-details-marker]:hidden">
            <div>
              <h2 className="text-lg font-bold">Subscription history</h2>
              <p className="mt-1 text-sm leading-6 text-[#526159]">
                Review your subscription dates and access timeline.
              </p>
            </div>
            <ChevronRight
              size={22}
              aria-hidden="true"
              className="shrink-0 text-[#526159] transition-transform group-open:rotate-90 motion-reduce:transition-none"
            />
          </summary>
          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[#CFDDD5] bg-[#f6f8f7] px-6 py-5 sm:px-8">
            <p className="max-w-sm text-sm leading-6 text-[#526159]">
              See when your subscription started, when your current period ends,
              and any complimentary access dates.
            </p>
            <Link
              to="/settings/subscription-history"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-[#294137] px-4 text-sm font-semibold text-white hover:bg-[#20332b] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#294137]"
            >
              View subscription history
              <ChevronRight size={18} aria-hidden="true" />
            </Link>
          </div>
        </details>
      </main>
    </div>
  );
}
