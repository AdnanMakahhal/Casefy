import { useEffect, useId, useRef } from "react";
import { X } from "lucide-react";

export default function AccountModal({ title, children, onDismiss, busy = false }) {
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
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onDismiss();
      }}
      className="fixed inset-0 m-auto max-h-[calc(100svh-2rem)] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-2xl border border-[#CFDDD5] bg-white p-6 text-[#102019] shadow-xl backdrop:bg-[#102019]/40 sm:p-8"
    >
      <div className="mb-5 flex items-center justify-between gap-4">
        <h2 id={titleId} className="text-xl font-bold tracking-tight">
          {title}
        </h2>
        <button
          type="button"
          aria-label={`Close ${title.toLowerCase()}`}
          disabled={busy}
          onClick={onDismiss}
          className="flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-lg hover:bg-[#edf3ef] focus-visible:outline-2 focus-visible:outline-[#294137] disabled:opacity-50"
        >
          <X size={20} aria-hidden="true" />
        </button>
      </div>
      {children}
    </dialog>
  );
}
