import { useEffect, useId, useRef, useState } from "react";
import { Building2, ChevronsUpDown, House, LogOut, UserRound } from "lucide-react";
import { Link } from "react-router-dom";
import Avatar from "./Avatar";
import LogoutDialog from "./LogoutDialog";
import { readRolePreference, roleLabels } from "../features/authentication/roles";

function WorkspaceMenu({ user }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const container = useRef(null);
  const trigger = useRef(null);
  const firstOption = useRef(null);
  const menuId = useId();
  const role = roleLabels[user ? user.role : readRolePreference()];
  const itemClass = "flex min-h-11 w-full cursor-pointer items-center gap-3 rounded-lg px-3 text-left text-sm font-medium text-[#102019] hover:bg-[#edf3ef] focus-visible:outline-2 focus-visible:outline-[#294137]";

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
      className="relative mt-auto pt-5"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setIsOpen(false);
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape" && isOpen) {
          event.stopPropagation();
          setIsOpen(false);
          trigger.current.focus();
        }
      }}
    >
      {isOpen && (
        <nav id={menuId} aria-label="Account options" className="absolute inset-x-0 bottom-full mb-2 rounded-xl border border-[#CFDDD5] bg-white p-1.5 shadow-lg shadow-[#102019]/10">
          <Link ref={firstOption} to="/profile" className={itemClass} onClick={() => setIsOpen(false)}><UserRound size={18} aria-hidden="true" />Profile</Link>
          <Link to="/workspaces" className={itemClass} onClick={() => setIsOpen(false)}><Building2 size={18} aria-hidden="true" />Workspaces</Link>
          <Link to="/" className={itemClass} onClick={() => setIsOpen(false)}><House size={18} aria-hidden="true" />Back to home page</Link>
          <button type="button" className={itemClass} onClick={() => { setIsOpen(false); setIsLoggingOut(true); }}><LogOut size={18} aria-hidden="true" />Log out</button>
        </nav>
      )}
      <button
        ref={trigger}
        type="button"
        aria-expanded={isOpen}
        aria-controls={menuId}
        onClick={() => setIsOpen((value) => !value)}
        className="mt-3 flex w-full cursor-pointer items-center gap-3 rounded-xl border border-[#CFDDD5] p-3 text-left transition-colors hover:bg-[#f6f8f7] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#294137]"
      >
        <Avatar user={user} className="size-9 text-sm" />
        <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-[#102019]" title={user?.name || "Your account"}>{user?.name || "Your account"}</span><span className="mt-0.5 block text-xs text-[#526159]">{role || "Choose your role"}</span></span>
        <ChevronsUpDown size={16} className="shrink-0 text-[#526159]" aria-hidden="true" />
      </button>
      {isLoggingOut && <LogoutDialog onDismiss={() => { setIsLoggingOut(false); trigger.current?.focus(); }} />}
    </div>
  );
}

export default WorkspaceMenu;
