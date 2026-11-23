import Button from "../ui/Button";
import { useEffect, useId, useRef, useState } from "react";
import { motion as Motion, useReducedMotion } from "motion/react";
import {
  RiDashboardLine as LayoutDashboard,
  RiLogoutBoxRLine as LogOut
} from "react-icons/ri";
import { Link } from "react-router-dom";
import { homeForRole } from "../features/authentication/authContext";
import Avatar from "./Avatar";
import LogoutDialog from "./LogoutDialog";

export default function HeaderAccountMenu({ user, onOpen }) {
  const reducedMotion = useReducedMotion();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const container = useRef(null);
  const trigger = useRef(null);
  const firstOption = useRef(null);
  const menuId = useId();
  const home = homeForRole(user.role);
  const itemClass =
    "flex min-h-11 w-full items-center gap-3 rounded-md px-3 text-left text-sm font-medium text-[#102019] hover:bg-[#edf3ef] focus-visible:outline-2 focus-visible:outline-[#294137]";

  useEffect(() => {
    if (!isOpen) return;
    firstOption.current?.focus();
    function closeOutside(event) {
      if (!container.current?.contains(event.target)) setIsOpen(false);
    }
    document.addEventListener("pointerdown", closeOutside);
    return () => document.removeEventListener("pointerdown", closeOutside);
  }, [isOpen]);

  return (
    <div
      ref={container}
      className="relative flex items-center"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget))
          setIsOpen(false);
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape" && isOpen) {
          event.stopPropagation();
          setIsOpen(false);
          trigger.current?.focus();
        }
      }}
    >
      <Button variant="unstyled"
        ref={trigger}
        type="button"
        aria-label="Open account options"
        aria-expanded={isOpen}
        aria-controls={menuId}
        onClick={() => {
          if (!isOpen) onOpen?.();
          setIsOpen((value) => !value);
        }}
        className="flex cursor-pointer items-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#294137]"
      >
        <Avatar user={user} />
      </Button>
        <Motion.nav
          id={menuId}
          aria-label="Header account options"
          className="absolute top-full right-0 z-50 mt-6 w-56 max-w-[calc(100vw-2rem)] rounded-md border border-[#CFDDD5] bg-white p-1.5 shadow-lg shadow-[#102019]/10"
          initial={false}
          animate={{ opacity: isOpen ? 1 : 0, y: isOpen || reducedMotion ? 0 : -10, scale: isOpen || reducedMotion ? 1 : 0.94 }}
          transition={reducedMotion ? { duration: 0 } : { type: "spring", duration: 0.32, bounce: 0.1, delay: 0.06, opacity: { type: "tween", duration: 0.2, delay: 0.06, ease: "easeInOut" } }}
          style={{ transformOrigin: "top right", pointerEvents: isOpen ? "auto" : "none" }}
          inert={!isOpen}
          aria-hidden={!isOpen}
        >
          <Link
            ref={firstOption}
            to={home}
            onClick={() => setIsOpen(false)}
            className={itemClass}
          >
            <LayoutDashboard size={18} aria-hidden="true" />
            {home === "/admin" ? "Go to admin" : "Go to dashboard"}
          </Link>
          <Button variant="unstyled"
            type="button"
            onClick={() => {
              setIsOpen(false);
              setIsLoggingOut(true);
            }}
            className={`${itemClass} cursor-pointer`}
          >
            <LogOut size={18} aria-hidden="true" />
            Log out
          </Button>
        </Motion.nav>
      {isLoggingOut && (
        <LogoutDialog
          onDismiss={() => {
            setIsLoggingOut(false);
            trigger.current?.focus();
          }}
        />
      )}
    </div>
  );
}
