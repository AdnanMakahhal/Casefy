import Button from "../ui/Button";
import { NavLink } from "react-router-dom";
import { useSyncExternalStore } from "react";
import { motion as Motion, useReducedMotion } from "motion/react";

const desktopQuery = "(min-width: 1024px)";
function subscribeToDesktop(callback) {
  const query = window.matchMedia(desktopQuery);
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
}
const getDesktop = () => window.matchMedia(desktopQuery).matches;
const getServerDesktop = () => false;

function Navigation({
  isMenuOpen,
  onNavigate,
  isAuthenticated = false,
  isAuthLoading = false,
}) {
  const desktop = useSyncExternalStore(subscribeToDesktop, getDesktop, getServerDesktop);
  const reducedMotion = useReducedMotion();
  const visible = desktop || isMenuOpen;
  return (
    <Motion.nav
      id="header-navigation"
      aria-label="Main navigation"
      className="absolute inset-x-0 top-full flex max-h-[calc(100svh-78px)] flex-col gap-4 overflow-y-auto border-b border-[#CFDDD5] bg-[#ffffff] p-4 shadow-lg shadow-[#1020190d] lg:static lg:block lg:max-h-none lg:overflow-visible lg:border-0 lg:p-0 lg:shadow-none"
      initial={false}
      animate={{ opacity: visible ? 1 : 0, y: visible || reducedMotion ? 0 : -10, scale: visible || reducedMotion ? 1 : 0.98 }}
      transition={reducedMotion || desktop ? { duration: 0 } : { type: "spring", duration: 0.32, bounce: 0.1, delay: 0.06, opacity: { type: "tween", duration: 0.2, delay: 0.06, ease: "easeInOut" } }}
      style={{ transformOrigin: "top right", pointerEvents: visible ? "auto" : "none" }}
      inert={!visible}
      aria-hidden={!visible}
    >
      <div className="flex flex-col gap-1 lg:flex-row lg:items-center lg:justify-start lg:gap-1">
        <NavLink
          to="/features"
          onClick={onNavigate}
          className="rounded-md px-3 py-3 text-sm font-medium text-[#14231c] transition-colors hover:bg-[#edf3ef] aria-[current=page]:bg-[#edf3ef] aria-[current=page]:text-[#294137] focus-visible:outline-2 focus-visible:outline-[#294137] lg:py-2"
        >
          Features
        </NavLink>
        <NavLink
          to="/how-it-works"
          onClick={onNavigate}
          className="rounded-md px-3 py-3 text-sm font-medium text-[#14231c] transition-colors hover:bg-[#edf3ef] aria-[current=page]:bg-[#edf3ef] aria-[current=page]:text-[#294137] focus-visible:outline-2 focus-visible:outline-[#294137] lg:py-2"
        >
          How it works
        </NavLink>
        <NavLink
          to="/use-cases"
          onClick={onNavigate}
          className="rounded-md px-3 py-3 text-sm font-medium text-[#14231c] transition-colors hover:bg-[#edf3ef] aria-[current=page]:bg-[#edf3ef] aria-[current=page]:text-[#294137] focus-visible:outline-2 focus-visible:outline-[#294137] lg:py-2"
        >
          Use Cases
        </NavLink>
        <NavLink
          to="/pricing"
          onClick={onNavigate}
          className="rounded-md px-3 py-3 text-sm font-medium text-[#14231c] transition-colors hover:bg-[#edf3ef] aria-[current=page]:bg-[#edf3ef] aria-[current=page]:text-[#294137] focus-visible:outline-2 focus-visible:outline-[#294137] lg:py-2"
        >
          Pricing
        </NavLink>
        <NavLink
          to="/docs"
          onClick={onNavigate}
          className="rounded-md px-3 py-3 text-sm font-medium text-[#14231c] transition-colors hover:bg-[#edf3ef] aria-[current=page]:bg-[#edf3ef] aria-[current=page]:text-[#294137] focus-visible:outline-2 focus-visible:outline-[#294137] lg:py-2"
        >
          Docs
        </NavLink>
      </div>
      {!isAuthenticated && !isAuthLoading && (
        <div className="grid grid-cols-2 gap-3 border-t border-[#CFDDD5] pt-4 lg:hidden">
          <Button variant="secondary" size="custom"
            to="/signin"
            onClick={onNavigate}
            className="min-h-11 px-5 whitespace-nowrap"
          >
            Sign in
          </Button>
          <Button variant="primary" size="custom"
            to="/signup"
            onClick={onNavigate}
            className="min-h-11 border border-[#2941372e] px-5 whitespace-nowrap"
          >
            Sign up
          </Button>
        </div>
      )}
    </Motion.nav>
  );
}

export default Navigation;
