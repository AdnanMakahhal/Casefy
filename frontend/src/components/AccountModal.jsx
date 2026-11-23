import H2 from "../ui/H2";
import Button from "../ui/Button";
import { useEffect, useId, useRef } from "react";
import { twMerge } from "tailwind-merge";
import {
  RiCloseLine as X
} from "react-icons/ri";

export default function AccountModal({
  title,
  children,
  onDismiss,
  busy = false,
  icon: Icon,
  className = "",
  descriptionId,
  closeLabel,
}) {
  const dialog = useRef(null);
  const titleId = useId();
  useEffect(() => {
    const element = dialog.current;
    const previousFocus = document.activeElement;
    element.showModal();
    return () => {
      element.close();
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, []);
  return (
    <dialog
      ref={dialog}
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onDismiss();
      }}
      className={twMerge("fixed inset-0 m-auto max-h-[calc(100svh-2rem)] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-md border border-[#CFDDD5] bg-white p-6 text-[#102019] shadow-xl backdrop:bg-[#102019]/40 sm:p-8", className)}
    >
      <div className="mb-5 flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
        {Icon && <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-[#edf3ef] text-[#294137]"><Icon size={21} aria-hidden="true" /></span>}
        <H2 variant="unstyled" id={titleId} className="text-xl font-bold tracking-tight">
          {title}
        </H2>
        </div>
        <Button variant="outline" size="icon"
          type="button"
          aria-label={closeLabel || `Close ${title.toLowerCase()}`}
          disabled={busy}
          onClick={onDismiss}
        >
          <X size={20} aria-hidden="true" />
        </Button>
      </div>
      {children}
    </dialog>
  );
}
