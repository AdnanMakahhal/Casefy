import P from "../ui/P";
import Span from "../ui/Span";
import Button from "../ui/Button";
import {
  RiBarChartBoxLine as BarChart3,
  RiBuildingLine as Building,
  RiDashboardLine as LayoutDashboard,
  RiPlayCircleLine as PlayCircle,
  RiSparklingLine as Sparkles,
  RiCloseLine as X,
} from "react-icons/ri";
import { Link, useLocation } from "react-router-dom";
import BrandLogo from "./BrandLogo";
import WorkspaceMenu from "./WorkspaceMenu";
import { homeForRole } from "../features/authentication/authContext";
import { adminNavigation } from "../features/admin/navigation";
import { settingsNavigation } from "../features/settings/navigation";
import { Fragment } from "react";

const navigation = [
  { label: "Dashboard", icon: LayoutDashboard, active: true },
  { label: "Test generator", icon: Sparkles, to: "/test-generator" },
  { label: "Executions", icon: PlayCircle, to: "/executions" },
  { label: "Reports", icon: BarChart3, to: "/reports" },
  { label: "Workspaces", icon: Building, to: "/settings/workspaces" },
  ...settingsNavigation,
];

function DashboardSidebar({ isOpen, onClose, user, items }) {
  const { pathname } = useLocation();
  const home = homeForRole(user?.role);
  const links =
    items || (home === "/admin" ? adminNavigation(pathname) : navigation);

  return (
    <>
      {isOpen && (
        <Button variant="unstyled"
          type="button"
          onClick={onClose}
          aria-label="Close navigation"
          className="fixed inset-0 z-40 bg-[#102019]/30 lg:hidden"
        />
      )}
      <aside
        id="dashboard-sidebar"
        aria-label={
          home === "/admin" ? "Admin navigation" : "Workspace navigation"
        }
        onKeyDown={(event) => {
          if (event.key === "Escape") onClose();
        }}
        className={`${isOpen ? "flex" : "hidden"} fixed inset-y-0 left-0 z-50 w-64 flex-col overflow-y-auto border-r border-[#CFDDD5] bg-white p-5 lg:flex`}
      >
        <div className="relative flex justify-center">
          <Link
            to="/"
            aria-label="Casefy home"
            className="flex items-center rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#294137]"
          >
            <BrandLogo />
          </Link>
          <Button variant="unstyled"
            type="button"
            onClick={onClose}
            aria-label="Close navigation"
            className="absolute -right-4 top-0 flex size-8 items-center justify-center rounded-md text-[#294137] hover:bg-[#edf3ef] lg:hidden"
          >
            <X size={20} />
          </Button>
        </div>
        <nav className="mt-6 space-y-2" aria-label="Dashboard navigation">
          {links.map(({ label, icon: Icon, active, to, selected, section }) => (
            <Fragment key={label}>
              {section && (
                <P variant="unstyled" className="px-3 pt-4 pb-1 text-[10px] font-semibold tracking-widest text-[#718578]">
                  {section.toUpperCase()}
                </P>
              )}
              {active || to ? (
                <Link
                  key={label}
                  to={to || home}
                  onClick={onClose}
                  aria-current={
                    (selected ?? pathname === (to || home)) ? "page" : undefined
                  }
                  className={`flex min-h-12 items-center gap-3 rounded-md px-3 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#294137] ${(selected ?? pathname === (to || home)) ? "bg-[#294137] text-white" : "text-[#526159] hover:bg-[#edf3ef]"}`}
                >
                  <Icon size={19} aria-hidden="true" />
                  {!to && home === "/admin" ? "Admin" : label}
                </Link>
              ) : (
                <Button variant="unstyled"
                  key={label}
                  type="button"
                  disabled
                  title={`${label} is coming soon`}
                  className="flex min-h-12 w-full items-center gap-3 rounded-md px-3 text-left text-sm text-[#526159]"
                >
                  <Icon size={19} aria-hidden="true" />
                  {label}
                  <Span className="ml-auto text-[10px] text-[#526159]">
                    Soon
                  </Span>
                </Button>
              )}
            </Fragment>
          ))}
        </nav>
        <div className="mt-auto">
          {user?.isSupportAgent && (
            <Link
              to="/staff-support"
              onClick={onClose}
              className="mt-4 block rounded-md bg-[#edf3ef] px-3 py-3 text-sm font-semibold text-[#294137]"
            >
              Support desk
            </Link>
          )}
          <WorkspaceMenu user={user} />
        </div>
      </aside>
    </>
  );
}

export default DashboardSidebar;
