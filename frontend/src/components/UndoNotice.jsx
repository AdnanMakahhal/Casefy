import { useEffect, useState } from "react";
import { useReducedMotion } from "motion/react";
import {
  RiCheckboxCircleLine as CircleCheck,
  RiRestartLine as RotateCcw
} from "react-icons/ri";

export default function UndoNotice({
  duration = 5000,
  message,
  onExpire,
  onUndo,
}) {
  const [counting, setCounting] = useState(false);
  const reduceMotion = useReducedMotion();
  useEffect(() => {
    const frame = requestAnimationFrame(() => setCounting(true));
    const timer = setTimeout(onExpire, duration);
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(timer);
    };
  }, [duration, onExpire]);
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-12 items-center justify-between gap-3 rounded-md border border-[#cfddd5] bg-[#edf3ef] p-1.5 pl-3 shadow-lg"
    >
      <div className="flex min-w-0 items-center gap-2">
        <CircleCheck
          size={17}
          aria-hidden="true"
          className="shrink-0 text-[#36825a]"
        />
        <p className="break-words text-xs font-medium text-[#294137]">
          {message}
        </p>
      </div>
      <button
        type="button"
        onClick={(event) => onUndo(event.detail === 0 ? "keyboard" : "pointer")}
        className="relative isolate flex min-h-9 min-w-20 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-md border border-[#cfddd5] bg-white px-3 text-xs font-semibold text-[#294137] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#294137] active:scale-[0.97] motion-reduce:transform-none"
      >
        <span className="flex items-center gap-1.5">
          <RotateCcw size={13} aria-hidden="true" />
          Undo
        </span>
        {!reduceMotion && (
          <span
            aria-hidden="true"
            className="absolute inset-0 flex items-center justify-center gap-1.5 bg-[#294137] px-3 text-white"
            style={{
              clipPath: counting ? "inset(0 100% 0 0)" : "inset(0 0 0 0)",
              transition: `clip-path ${duration}ms linear`,
            }}
          >
            <RotateCcw size={13} />
            Undo
          </span>
        )}
      </button>
    </div>
  );
}
