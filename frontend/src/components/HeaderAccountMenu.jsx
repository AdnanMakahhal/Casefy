import { useEffect, useId, useRef, useState } from "react";
import { LayoutDashboard, LogOut } from "lucide-react";
import { Link } from "react-router-dom";
import { homeForRole } from "../features/authentication/authContext";
import Avatar from "./Avatar";
import LogoutDialog from "./LogoutDialog";

export default function HeaderAccountMenu({ user, onOpen }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const container = useRef(null);
  const trigger = useRef(null);
  const firstOption = useRef(null);
  const menuId = useId();
  const home = homeForRole(user.role);
  const itemClass =
    "flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-left text-sm font-medium text-[#102019] hover:bg-[#edf3ef] focus-visible:outline-2 focus-visible:outline-[#294137]";

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
      <button
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
      </button>
      {isOpen && (
        <nav
          id={menuId}
          aria-label="Header account options"
          className="absolute top-full right-0 z-50 mt-6 w-56 max-w-[calc(100vw-2rem)] rounded-xl border border-[#CFDDD5] bg-white p-1.5 shadow-lg shadow-[#102019]/10"
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
          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              setIsLoggingOut(true);
            }}
            className={`${itemClass} cursor-pointer`}
          >
            <LogOut size={18} aria-hidden="true" />
            Log out
          </button>
        </nav>
      )}
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
