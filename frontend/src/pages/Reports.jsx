import P from "../ui/P";
import Button from "../ui/Button";
import Heading from "../ui/Heading";
import { useState } from "react";
import {
  RiMenuLine as Menu,
  RiRefreshLine as RefreshCw
} from "react-icons/ri";
import DashboardSidebar from "../components/DashboardSidebar";
import ReportsSection from "../features/reports/ReportsSection";

export default function Reports({ user }) {
  const [sidebar, setSidebar] = useState(false),
    [revision, setRevision] = useState(0);
  return (
    <div className="admin-shell lg:pl-64">
      <DashboardSidebar
        user={user}
        isOpen={sidebar}
        onClose={() => setSidebar(false)}
      />
      <main className="mx-auto max-w-[1440px] px-4 py-6 sm:px-8 lg:p-10">
        <header className="admin-page-header">
          <div className="flex gap-3">
            <Button variant="unstyled" type="submit"
              className="flex size-11 items-center justify-center rounded-md border border-[#CFDDD5] bg-white lg:hidden"
              aria-label="Open navigation"
              aria-expanded={sidebar}
              aria-controls="dashboard-sidebar"
              onClick={() => setSidebar(true)}
            >
              <Menu size={20} />
            </Button>
            <div>
              <Heading as="h1">Reports</Heading>
              <P variant="unstyled">Your generation history and saved results.</P>
            </div>
          </div>
          <Button variant="outline" size="md" type="submit"
            className="border px-5 py-2.5 whitespace-nowrap"
            onClick={() => setRevision((value) => value + 1)}
          >
            <RefreshCw size={16} />
            Refresh
          </Button>
        </header>
        <ReportsSection revision={revision} />
      </main>
    </div>
  );
}
