import { useState } from "react";
import { Menu, Moon, Sun, X } from "lucide-react";
import { Link, NavLink } from "react-router-dom";

function Header() {
  const [showSun, setShowSun] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header
      onKeyDown={(event) => {
        if (event.key === "Escape") setIsMenuOpen(false);
      }}
      className="sticky top-0 z-50 flex min-h-[78px] items-center justify-between gap-4 border-b border-[#e5e7eb] bg-[#ffffff] px-4 py-3.5 sm:px-8 lg:grid lg:grid-cols-[150px_1fr_auto_auto]"
    >
      <Link to="/" aria-label="Casefy home" className="shrink-0">
        <img
          src="https://placehold.co/150x50"
          alt="Casefy logo"
          width="150"
          height="50"
          className="object-cover"
        />
      </Link>
      <nav
        id="header-navigation"
        aria-label="Main navigation"
        className={`${isMenuOpen ? "flex" : "hidden"} absolute inset-x-0 top-full max-h-[calc(100svh-78px)] flex-col gap-4 overflow-y-auto border-b border-[#CFDDD5] bg-[#ffffff] p-4 shadow-lg shadow-[#1020190d] lg:static lg:contents`}
      >
        <div className="flex flex-col gap-1 lg:flex-row lg:items-center lg:gap-1">
          <NavLink
            to="/features"
            onClick={() => setIsMenuOpen(false)}
            className="rounded-md px-3 py-3 text-sm font-medium text-[#14231c] transition-colors hover:bg-[#edf3ef] aria-[current=page]:bg-[#edf3ef] aria-[current=page]:text-[#294137] focus-visible:outline-2 focus-visible:outline-[#294137] lg:py-2"
          >
            Features
          </NavLink>
          <NavLink
            to="/how-it-works"
            onClick={() => setIsMenuOpen(false)}
            className="rounded-md px-3 py-3 text-sm font-medium text-[#14231c] transition-colors hover:bg-[#edf3ef] aria-[current=page]:bg-[#edf3ef] aria-[current=page]:text-[#294137] focus-visible:outline-2 focus-visible:outline-[#294137] lg:py-2"
          >
            How it works
          </NavLink>
          <NavLink
            to="/use-cases"
            onClick={() => setIsMenuOpen(false)}
            className="rounded-md px-3 py-3 text-sm font-medium text-[#14231c] transition-colors hover:bg-[#edf3ef] aria-[current=page]:bg-[#edf3ef] aria-[current=page]:text-[#294137] focus-visible:outline-2 focus-visible:outline-[#294137] lg:py-2"
          >
            Use Cases
          </NavLink>
          <NavLink
            to="/pricing"
            onClick={() => setIsMenuOpen(false)}
            className="rounded-md px-3 py-3 text-sm font-medium text-[#14231c] transition-colors hover:bg-[#edf3ef] aria-[current=page]:bg-[#edf3ef] aria-[current=page]:text-[#294137] focus-visible:outline-2 focus-visible:outline-[#294137] lg:py-2"
          >
            Pricing
          </NavLink>
          <NavLink
            to="/docs"
            onClick={() => setIsMenuOpen(false)}
            className="rounded-md px-3 py-3 text-sm font-medium text-[#14231c] transition-colors hover:bg-[#edf3ef] aria-[current=page]:bg-[#edf3ef] aria-[current=page]:text-[#294137] focus-visible:outline-2 focus-visible:outline-[#294137] lg:py-2"
          >
            Docs
          </NavLink>
        </div>
        <div className="grid grid-cols-2 gap-3 border-t border-[#CFDDD5] pt-4 lg:order-4 lg:flex lg:border-0 lg:pt-0">
          <Link
            to="/signin"
            onClick={() => setIsMenuOpen(false)}
            className="inline-flex min-h-11 items-center justify-center rounded-md border border-[#CFDDD5] bg-[#edf3ef] px-5 text-sm font-semibold whitespace-nowrap text-[#14231c] transition-colors hover:bg-[#e2ece6] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#294137]"
          >
            Sign in
          </Link>
          <Link
            to="/signup"
            onClick={() => setIsMenuOpen(false)}
            className="inline-flex min-h-11 items-center justify-center rounded-md border border-[#2941372e] bg-[#294137] px-5 text-sm font-semibold whitespace-nowrap text-[#ffffff] transition-colors hover:bg-[#20332b] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#294137]"
          >
            Sign up
          </Link>
        </div>
      </nav>
      <div className="flex items-center gap-2 lg:order-3">
        <button
          type="button"
          onClick={() => setShowSun((value) => !value)}
          aria-label={`Animate to ${showSun ? "moon" : "sun"} icon`}
          className="relative inline-flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-md border border-[#CFDDD5] bg-[#ffffff] text-[#294137] hover:bg-[#29413712] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#294137]"
        >
          <Sun
            size={20}
            aria-hidden="true"
            className={`absolute transition-all duration-300 motion-reduce:transition-none ${showSun ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-0 opacity-0"}`}
          />
          <Moon
            size={20}
            aria-hidden="true"
            className={`absolute transition-all duration-300 motion-reduce:transition-none ${showSun ? "rotate-90 scale-0 opacity-0" : "rotate-0 scale-100 opacity-100"}`}
          />
        </button>
        <button
          type="button"
          onClick={() => setIsMenuOpen((value) => !value)}
          aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          aria-expanded={isMenuOpen}
          aria-controls="header-navigation"
          className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-md border border-[#CFDDD5] bg-[#ffffff] text-[#294137] hover:bg-[#edf3ef] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#294137] lg:hidden"
        >
          {isMenuOpen ? (
            <X size={20} aria-hidden="true" />
          ) : (
            <Menu size={20} aria-hidden="true" />
          )}
        </button>
      </div>
    </header>
  );
}

export default Header;
