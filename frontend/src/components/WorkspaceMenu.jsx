import Span from "../ui/Span";
import Button from "../ui/Button";
import { useEffect, useId, useRef, useState } from "react";
import { motion as Motion, useReducedMotion } from "motion/react";
import {
  RiArrowUpDownLine as ChevronsUpDown,
  RiHome4Line as House,
  RiLogoutBoxRLine as LogOut,
} from "react-icons/ri";
import { Link } from "react-router-dom";
import Avatar from "./Avatar";
import LogoutDialog from "./LogoutDialog";
import {
  readRolePreference,
  roleLabels,
} from "../features/authentication/roles";

function WorkspaceMenu({ user }) {
  const reducedMotion = useReducedMotion();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const container = useRef(null);
  const trigger = useRef(null);
  const firstOption = useRef(null);
  const menuId = useId();
  const role = roleLabels[user ? user.role : readRolePreference()];
  const itemClass =
    "flex min-h-11 w-full cursor-pointer items-center gap-3 rounded-md px-3 text-left text-sm font-medium text-[#102019] hover:bg-[#edf3ef] focus-visible:outline-2 focus-visible:outline-[#294137]";

  useEffect(() => {
    if (!isOpen) return;
    firstOption.current?.focus();
    function handleOutside(event) {
      if (!container.current?.contains(event.target)) setIsOpen(false);
    }
    document.addEventListener("pointerdown", handleOutside);
    return () => document.removeEventListener("pointerdown", handleOutside);
  }, [isOpen]);

  return (
    <div
      ref={container}
      className="relative pt-5"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget))
          setIsOpen(false);
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape" && isOpen) {
          event.stopPropagation();
          setIsOpen(false);
          trigger.current.focus();
        }
      }}
    >
        <Motion.nav
          id={menuId}
          aria-label="Account options"
          className="absolute inset-x-0 bottom-[calc(100%_-_1.75rem)] z-10 rounded-md border border-[#CFDDD5] bg-white p-1.5 shadow-lg shadow-[#102019]/10"
          initial={false}
          animate={{ opacity: isOpen ? 1 : 0, y: isOpen || reducedMotion ? 0 : 10, scale: isOpen || reducedMotion ? 1 : 0.94 }}
          transition={reducedMotion ? { duration: 0 } : { type: "spring", duration: 0.32, bounce: 0.1, delay: 0.06, opacity: { type: "tween", duration: 0.2, delay: 0.06, ease: "easeInOut" } }}
          style={{ transformOrigin: "bottom center", pointerEvents: isOpen ? "auto" : "none" }}
          inert={!isOpen}
          aria-hidden={!isOpen}
        >
          <Link ref={firstOption} to="/" className={itemClass} onClick={() => setIsOpen(false)}>
            <House size={18} aria-hidden="true" />
            Back to home page
          </Link>
          <Button variant="unstyled"
            type="button"
            className={itemClass}
            onClick={() => {
              setIsOpen(false);
              setIsLoggingOut(true);
            }}
          >
            <LogOut size={18} aria-hidden="true" />
            Log out
          </Button>
        </Motion.nav>
      <Button variant="unstyled"
        ref={trigger}
        type="button"
        aria-expanded={isOpen}
        aria-controls={menuId}
        onClick={() => setIsOpen((value) => !value)}
        className="mt-3 flex w-full cursor-pointer items-center gap-3 rounded-md border border-[#CFDDD5] p-3 text-left transition-colors hover:bg-[#f6f8f7] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#294137]"
      >
        <Avatar user={user} className="size-9 text-sm" />
        <Span className="min-w-0 flex-1">
          <Span
            className="block truncate text-sm font-semibold text-[#102019]"
            title={user?.name || "Your account"}
          >
            {user?.name || "Your account"}
          </Span>
          <Span className="mt-0.5 block text-xs text-[#526159]">
            {role || "Choose your role"}
          </Span>
        </Span>
        <ChevronsUpDown
          size={16}
          className="shrink-0 text-[#526159]"
          aria-hidden="true"
        />
      </Button>
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

export default WorkspaceMenu;
