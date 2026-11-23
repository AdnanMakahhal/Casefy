import H1 from "../ui/H1";
import P from "../ui/P";
import Button from "../ui/Button";
import { useState } from "react";
import { Navigate } from "react-router-dom";
import { RiMenuLine as Menu } from "react-icons/ri";
import DashboardSidebar from "../components/DashboardSidebar";
import Inbox from "../features/admin/Inbox";

export default function StaffSupport({ user }) {
  const [sidebar, setSidebar] = useState(false);
  const [category, setCategory] = useState("");
  if (!user.isSupportAgent && !["admin", "manager"].includes(user.role))
    return <Navigate to="/dashboard" replace />;
  return (
    <div className="min-h-screen bg-[#f6f8f7] text-[#102019] lg:pl-64">
      <DashboardSidebar
        user={user}
        isOpen={sidebar}
        onClose={() => setSidebar(false)}
      />
      <main className="mx-auto max-w-[1440px] px-4 py-6 sm:px-8 lg:p-10">
        <header className="flex items-start gap-3">
          <Button variant="unstyled"
            className="flex size-11 items-center justify-center rounded-md border border-[#CFDDD5] bg-white lg:hidden"
            type="button"
            aria-label="Open navigation"
            aria-controls="dashboard-sidebar"
            aria-expanded={sidebar}
            onClick={() => setSidebar(true)}
          >
            <Menu size={20} />
          </Button>
          <div>
            <H1 variant="unstyled" className="text-3xl font-bold">Support desk</H1>
            <P variant="unstyled" className="mt-3 text-sm leading-6 text-[#526159]">
              Reply to customers, claim conversations, and coordinate with your
              team. Managers and admins approve refunds.
            </P>
          </div>
        </header>
        <div
          className="my-6 flex flex-wrap gap-2"
          role="group"
          aria-label="Request type"
        >
          {[
            ["", "All requests"],
            ["live_chat", "Live chat"],
            ["support", "Support"],
            ["contact", "Contact"],
            ["refund", "Refunds"],
          ].map(([value, label]) => (
            <Button variant="unstyled" type="submit"
              key={value}
              aria-pressed={category === value}
              className={`min-h-11 rounded-md border border-[#CFDDD5] px-4 text-sm font-semibold ${category === value ? "bg-[#294137] text-white" : "bg-white text-[#294137]"}`}
              onClick={() => setCategory(value)}
            >
              {label}
            </Button>
          ))}
        </div>
        <Inbox key={category} category={category} />
      </main>
    </div>
  );
}
