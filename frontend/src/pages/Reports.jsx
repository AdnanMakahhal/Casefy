import { useState } from "react";
import { Menu, RefreshCw } from "lucide-react";
import DashboardSidebar from "../components/DashboardSidebar";
import ReportsSection from "../features/admin/ReportsSection";
import "../features/admin/Admin.css";

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
            <button
              className="flex size-11 items-center justify-center rounded-lg border border-[#CFDDD5] bg-white lg:hidden"
              aria-label="Open navigation"
              aria-expanded={sidebar}
              aria-controls="dashboard-sidebar"
              onClick={() => setSidebar(true)}
            >
              <Menu size={20} />
            </button>
            <div>
              <h1>Reports</h1>
              <p>Your generation history and saved results.</p>
            </div>
          </div>
          <button
            className="admin-button"
            onClick={() => setRevision((value) => value + 1)}
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </header>
        <ReportsSection session revision={revision} />
      </main>
    </div>
  );
}
