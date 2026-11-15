import { Link, NavLink } from "react-router-dom";

function Navigation({
  isMenuOpen,
  onNavigate,
  isAuthenticated = false,
  isAuthLoading = false,
}) {
  return (
    <nav
      id="header-navigation"
      aria-label="Main navigation"
      className={`${isMenuOpen ? "flex" : "hidden"} absolute inset-x-0 top-full max-h-[calc(100svh-78px)] flex-col gap-4 overflow-y-auto border-b border-[#CFDDD5] bg-[#ffffff] p-4 shadow-lg shadow-[#1020190d] lg:static lg:block lg:max-h-none lg:overflow-visible lg:border-0 lg:p-0 lg:shadow-none`}
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
          <Link
            to="/signin"
            onClick={onNavigate}
            className="inline-flex min-h-11 items-center justify-center rounded-md border border-[#CFDDD5] bg-[#edf3ef] px-5 text-sm font-semibold whitespace-nowrap text-[#14231c] transition-colors hover:bg-[#e2ece6] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#294137]"
          >
            Sign in
          </Link>
          <Link
            to="/signup"
            onClick={onNavigate}
            className="inline-flex min-h-11 items-center justify-center rounded-md border border-[#2941372e] bg-[#294137] px-5 text-sm font-semibold whitespace-nowrap text-[#ffffff] transition-colors hover:bg-[#20332b] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#294137]"
          >
            Sign up
          </Link>
        </div>
      )}
    </nav>
  );
}

export default Navigation;
