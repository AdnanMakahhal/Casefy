import { useState } from "react";
import { useLocation } from "react-router-dom";
import {
  RiMenuLine as Menu,
  RiArrowRightSLine as ChevronRight,
  RiUserLine as User,
  RiBankCardLine as CreditCard,
  RiCoinLine as Coins,
  RiHistoryLine as History,
} from "react-icons/ri";
import Heading from "../ui/Heading";
import H2 from "../ui/H2";
import P from "../ui/P";
import Span from "../ui/Span";
import Button from "../ui/Button";
import DashboardSidebar from "../components/DashboardSidebar";
import BillingControls from "../components/BillingControls";
import CreditUsage from "../components/CreditUsage";

const sectionLink = (selected) =>
  "inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-md px-3 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#294137] sm:flex-none sm:px-5 " +
  (selected ? "bg-[#294137] text-white" : "text-[#526159] hover:bg-[#edf3ef] hover:text-[#294137]");

const accountRow =
  "group flex w-full items-center gap-4 px-5 py-5 text-left transition-colors hover:bg-[#f6f8f7] focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-[#294137] sm:px-6";

export default function Settings({ user }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { hash } = useLocation();
  const activeSection = hash === "#billing" ? "billing" : hash === "#credits" ? "credits" : "account";

  return (
    <div className="min-h-screen bg-[#f6f8f7] text-[#102019] lg:pl-64">
      <DashboardSidebar user={user} isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <main className="mx-auto max-w-[1440px] px-4 py-6 sm:px-8 lg:p-10">
        <div className="max-w-4xl">
          <header className="flex items-start gap-3">
            <Button variant="outline" size="custom" aria-label="Open navigation" aria-controls="dashboard-sidebar" aria-expanded={isSidebarOpen} onClick={() => setIsSidebarOpen(true)} className="flex size-11 shrink-0 lg:hidden">
              <Menu size={20} aria-hidden="true" />
            </Button>
            <div>
              <Heading as="h1">Settings</Heading>
              <P variant="unstyled" className="mt-2 text-sm leading-6 text-[#526159]">Your account, plan, and usage.</P>
            </div>
          </header>

          <nav aria-label="Settings sections" className="mt-7 flex gap-1 rounded-md border border-[#CFDDD5] bg-white p-1 sm:w-fit">
            <Button variant="unstyled" to="#account" aria-current={activeSection === "account" ? "page" : undefined} className={sectionLink(activeSection === "account")}><User size={17} aria-hidden="true" />Account</Button>
            <Button variant="unstyled" to="#billing" aria-current={activeSection === "billing" ? "page" : undefined} className={sectionLink(activeSection === "billing")}><CreditCard size={17} aria-hidden="true" />Billing</Button>
            <Button variant="unstyled" to="#credits" aria-current={activeSection === "credits" ? "page" : undefined} className={sectionLink(activeSection === "credits")}><Coins size={17} aria-hidden="true" />Credits</Button>
          </nav>

          {activeSection === "account" && (
            <section id="account" aria-label="Account settings" className="mt-6 overflow-hidden rounded-md border border-[#CFDDD5] bg-white">
              <div className="divide-y divide-[#e1e9e4]">
                <Button variant="unstyled" to="/settings/profile" className={accountRow}>
                  <Span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-[#edf3ef] text-[#294137]"><User size={20} aria-hidden="true" /></Span>
                  <Span className="min-w-0 flex-1"><Span className="block text-sm font-semibold">Profile</Span><Span className="mt-1 block text-sm leading-6 text-[#526159]">Personal details, email, and profile photo.</Span></Span>
                  <ChevronRight size={19} aria-hidden="true" className="shrink-0 text-[#718578] group-hover:text-[#294137]" />
                </Button>
              </div>
            </section>
          )}

          {activeSection === "billing" && (
            <section id="billing" aria-labelledby="billing-settings-heading" className="mt-6 overflow-hidden rounded-md border border-[#CFDDD5] bg-white">
              <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e1e9e4] px-5 py-5 sm:px-6">
                <div>
                  <H2 variant="unstyled" id="billing-settings-heading" className="text-base font-semibold">Subscription & billing</H2>
                  <P variant="unstyled" className="mt-1 text-sm leading-6 text-[#526159]">Your plan and payment details.</P>
                </div>
                <Button to="/settings/subscription-history" variant="outline" size="sm"><History size={16} aria-hidden="true" />Subscription history</Button>
              </header>
              <BillingControls user={user} />
            </section>
          )}

          {activeSection === "credits" && (
            <section id="credits" aria-labelledby="credits-settings-heading" className="mt-6 overflow-hidden rounded-md border border-[#CFDDD5] bg-white">
              <header className="border-b border-[#e1e9e4] px-5 py-5 sm:px-6">
                <H2 variant="unstyled" id="credits-settings-heading" className="text-base font-semibold">Credits & usage</H2>
                <P variant="unstyled" className="mt-1 text-sm leading-6 text-[#526159]">Your balance, allowance, and recent activity.</P>
              </header>
              <CreditUsage user={user} />
            </section>
          )}
        </div>
      </main>
    </div>
  );
}
