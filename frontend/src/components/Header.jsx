import Button from "../ui/Button";
import { useRef, useState } from "react";
import AnimatedIcon from "../ui/AnimatedIcon";
import {
  RiMenuLine as Menu,
  RiMoonLine as Moon,
  RiSunLine as Sun,
  RiCloseLine as X,
} from "react-icons/ri";
import { Link } from "react-router-dom";
import BrandLogo from "./BrandLogo";
import HeaderAccountMenu from "./HeaderAccountMenu";
import Navigation from "./Navigation";
import { useAuth } from "../features/authentication/authContext";
import HeaderActionsSkeleton from "../ui/HeaderActionsSkeleton";

function Header() {
  const [showSun, setShowSun] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuTrigger = useRef(null);
  const { user, isLoading } = useAuth();

  return (
    <header
      onKeyDown={(event) => {
        if (event.key === "Escape" && isMenuOpen) {
          setIsMenuOpen(false);
          menuTrigger.current?.focus();
        }
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
        <Button variant="outline" size="custom"
          type="button"
          onClick={() => setShowSun((value) => !value)}
          aria-label={`Animate to ${showSun ? "moon" : "sun"} icon`}
          className="relative h-10 w-10 shrink-0 hover:bg-[#29413712]"
        >
          <AnimatedIcon animationKey={showSun ? "sun" : "moon"}>{showSun ? <Sun size={20} /> : <Moon size={20} />}</AnimatedIcon>
        </Button>
        {isLoading && <HeaderActionsSkeleton />}
        {!isLoading && !user && (
          <div className="hidden items-center gap-2 lg:flex">
            <Button variant="secondary" size="custom"
              to="/signin"
              className="min-h-10 px-4 whitespace-nowrap"
            >
              Sign in
            </Button>
            <Button variant="primary" size="custom"
              to="/signup"
              className="min-h-10 border border-[#2941372e] px-4 whitespace-nowrap"
            >
              Sign up
            </Button>
          </div>
        )}
        {!isLoading && user && (
          <HeaderAccountMenu user={user} onOpen={() => setIsMenuOpen(false)} />
        )}
        <Button variant="outline" size="custom"
          ref={menuTrigger}
          type="button"
          onClick={() => setIsMenuOpen((value) => !value)}
          aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          aria-expanded={isMenuOpen}
          aria-controls="header-navigation"
          className="h-10 w-10 lg:hidden"
        >
          <AnimatedIcon animationKey={isMenuOpen ? "close" : "menu"}>{isMenuOpen ? (
            <X size={20} aria-hidden="true" />
          ) : (
            <Menu size={20} aria-hidden="true" />
          )}</AnimatedIcon>
        </Button>
      </div>
    </header>
  );
}

export default Header;
