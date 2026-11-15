import {
  BarChart3,
  LayoutDashboard,
  PlayCircle,
  Settings2,
  Sparkles,
  X,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import WorkspaceMenu from "./WorkspaceMenu";
import { homeForRole } from "../features/authentication/authContext";
import { adminNavigation } from "../features/admin/navigation";
import { Fragment } from "react";

const navigation = [
  { label: "Dashboard", icon: LayoutDashboard, active: true },
  { label: "Test generator", icon: Sparkles, to: "/test-generator" },
  { label: "Executions", icon: PlayCircle },
  { label: "Reports", icon: BarChart3, to: "/reports" },
  { label: "Settings", icon: Settings2 },
];

function DashboardSidebar({ isOpen, onClose, user, items }) {
  const { pathname, search } = useLocation();
  const home = homeForRole(user?.role);
  const links = items || (home === "/admin" ? adminNavigation(pathname, search) : navigation);

  return (
    <>
      {isOpen && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Close navigation"
          className="fixed inset-0 z-40 bg-[#102019]/30 lg:hidden"
        />
      )}
      <aside
        id="dashboard-sidebar"
        aria-label="Workspace navigation"
        onKeyDown={(event) => {
          if (event.key === "Escape") onClose();
        }}
        className={`${isOpen ? "flex" : "hidden"} fixed inset-y-0 left-0 z-50 w-64 flex-col overflow-y-auto border-r border-[#CFDDD5] bg-white p-5 lg:flex`}
      >
        <div className="relative flex justify-center">
          <Link
            to="/"
            aria-label="Casefy home"
            className="rounded focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#294137]"
          >
            <img
              src="/Logo/Logo_Casefy.svg"
              alt="Casefy logo"
              width="150"
              height="50"
              className="block h-[50px] w-[150px] object-contain"
            />
          </Link>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close navigation"
            className="absolute -right-4 top-0 flex size-8 items-center justify-center rounded-lg text-[#294137] hover:bg-[#edf3ef] lg:hidden"
          >
            <X size={20} />
          </button>
        </div>
        <nav className="mt-6 space-y-2" aria-label="Dashboard navigation">
          {links.map(({ label, icon: Icon, active, to, selected, section }) => <Fragment key={label}>
            {section && <p className="px-3 pt-4 pb-1 text-[10px] font-semibold tracking-widest text-[#718578]">{section.toUpperCase()}</p>}
            {
            active || to ? (
              <Link
                key={label}
                to={to || home}
                onClick={onClose}
                aria-current={(selected ?? pathname === (to || home)) ? "page" : undefined}
                className={`flex min-h-12 items-center gap-3 rounded-lg px-3 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#294137] ${(selected ?? pathname === (to || home)) ? "bg-[#294137] text-white" : "text-[#526159] hover:bg-[#edf3ef]"}`}
              >
                <Icon size={19} aria-hidden="true" />
                {!to && home === "/admin" ? "Admin" : label}
              </Link>
            ) : (
              <button
                key={label}
                type="button"
                disabled
                title={`${label} is coming soon`}
                className="flex min-h-12 w-full items-center gap-3 rounded-lg px-3 text-left text-sm text-[#526159]"
              >
                <Icon size={19} aria-hidden="true" />
                {label}
                <span className="ml-auto text-[10px] text-[#526159]">Soon</span>
              </button>
            )}</Fragment>)}
        </nav>
        <WorkspaceMenu user={user} />
      </aside>
    </>
  );
}

export default DashboardSidebar;
