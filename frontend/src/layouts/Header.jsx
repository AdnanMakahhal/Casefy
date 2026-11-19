import { useState } from "react";
import {
  RiMenuLine as Menu,
  RiMoonLine as Moon,
  RiSunLine as Sun,
  RiCloseLine as X,
} from "react-icons/ri";
import { Link } from "react-router-dom";
import BrandLogo from "../components/BrandLogo";
import HeaderAccountMenu from "../components/HeaderAccountMenu";
import Navigation from "../components/Navigation";
import { useAuth } from "../features/authentication/authContext";
import HeaderActionsSkeleton from "../components/skeletons/HeaderActionsSkeleton";

function Header() {
  const [showSun, setShowSun] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, isLoading } = useAuth();

  return (
    <header
      onKeyDown={(event) => {
        if (event.key === "Escape") setIsMenuOpen(false);
      }}
      className="sticky top-0 z-50 flex min-h-[78px] items-center justify-between gap-4 border-b border-[#e5e7eb] bg-[#ffffff] px-4 py-3.5 sm:px-8 lg:grid lg:grid-cols-[150px_minmax(0,1fr)_auto] lg:gap-6"
    >
      <Link
        to="/"
        aria-label="Casefy home"
        className="flex h-[50px] w-fit shrink-0 items-center rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#294137]"
      >
        <BrandLogo />
      </Link>
      <Navigation
        isMenuOpen={isMenuOpen}
        onNavigate={() => setIsMenuOpen(false)}
        isAuthenticated={Boolean(user)}
        isAuthLoading={isLoading}
      />
      <div className="flex items-center justify-end gap-2 lg:justify-self-end">
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
        {isLoading && <HeaderActionsSkeleton />}
        {!isLoading && !user && (
          <div className="hidden items-center gap-2 lg:flex">
            <Link
              to="/signin"
              className="inline-flex min-h-10 items-center justify-center rounded-md border border-[#CFDDD5] bg-[#edf3ef] px-4 text-sm font-semibold whitespace-nowrap text-[#14231c] transition-colors hover:bg-[#e2ece6] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#294137]"
            >
              Sign in
            </Link>
            <Link
              to="/signup"
              className="inline-flex min-h-10 items-center justify-center rounded-md border border-[#2941372e] bg-[#294137] px-4 text-sm font-semibold whitespace-nowrap text-white transition-colors hover:bg-[#20332b] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#294137]"
            >
              Sign up
            </Link>
          </div>
        )}
        {!isLoading && user && (
          <HeaderAccountMenu user={user} onOpen={() => setIsMenuOpen(false)} />
        )}
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
