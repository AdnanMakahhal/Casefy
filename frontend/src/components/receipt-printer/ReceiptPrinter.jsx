import { createContext, useContext } from "react";
import { AnimatePresence, motion as Motion, useReducedMotion } from "motion/react";
import { AlertCircle, CircleCheck, LoaderCircle } from "lucide-react";

const ReceiptPrinterContext = createContext(null);
const classes = (...values) => values.filter(Boolean).join(" ");
const easeOut = [0.23, 1, 0.32, 1];
const easeInOut = [0.77, 0, 0.175, 1];
const toothPoints = Array.from({ length: 80 }, (_, index) => `${100 - (index + 1) * 100 / 80}% ${index % 2 === 0 ? "100%" : "calc(100% - 4px)"}`).join(", ");
const receiptClipPath = `polygon(0 0, 100% 0, 100% calc(100% - 4px), ${toothPoints})`;
const feedFrames = ["translateY(calc(-100% + 2px))", "translateY(-91%)", "translateY(-91%)", "translateY(-81%)", "translateY(-81%)", "translateY(-70%)", "translateY(-70%)", "translateY(-58%)", "translateY(-58%)", "translateY(-45%)", "translateY(-45%)", "translateY(-32%)", "translateY(-32%)", "translateY(-20%)", "translateY(-20%)", "translateY(-10%)", "translateY(-10%)", "translateY(-3%)", "translateY(-3%)", "translateY(0%)"];
const feedTimes = [0, 0.075, 0.105, 0.18, 0.21, 0.285, 0.315, 0.39, 0.42, 0.495, 0.525, 0.6, 0.63, 0.705, 0.735, 0.81, 0.84, 0.915, 0.945, 1];
const statusLabels = { processing: "Preparing your plan summary", printing: "Printing your plan summary", complete: "Plan summary ready" };

function useReceiptPrinter() {
  const context = useContext(ReceiptPrinterContext);
  if (!context) throw new Error("Receipt printer parts must be inside ReceiptPrinter.Root");
  return context;
}

export function ReceiptPrinterRoot({ stage, animate = true, feedMotion = "stepped", children, className, "aria-label": ariaLabel = "Plan summary printer", ...props }) {
  const reducedMotion = useReducedMotion();
  return <ReceiptPrinterContext.Provider value={{ stage, animate, feedMotion, shouldMove: animate && !reducedMotion }}>
    <section aria-label={ariaLabel} data-stage={stage} className={classes("relative isolate flex w-full max-w-md flex-col items-center", className)} {...props}>{children}</section>
  </ReceiptPrinterContext.Provider>;
}

export function ReceiptPrinterMachine({ children, className, ...props }) {
  return <div className={classes("relative isolate w-full overflow-hidden rounded-3xl border border-[#1c3026] bg-[#294137] p-3 pb-8 shadow-[0_15px_35px_-18px_#10201966,inset_0_1px_0_#ffffff26]", className)} {...props}>
    {children}
    <div aria-hidden="true" className="absolute inset-x-6 bottom-3 z-40 h-2 rounded border border-[#102019] bg-[#102019] shadow-inner" />
  </div>;
}

export function ReceiptPrinterHeader({ children, className, ...props }) {
  return <div className={classes("relative z-10 flex min-h-14 items-center justify-between gap-3 px-2 pt-1", className)} {...props}>{children}</div>;
}

export function ReceiptPrinterScreen({ children, className, ...props }) {
  return <div className={classes("relative z-10 overflow-hidden rounded-xl border border-[#102019] bg-[#15291f] p-4 text-[#d8e9dd] shadow-[inset_0_0_20px_#10201980]", className)} {...props}>{children}</div>;
}

export function ReceiptPrinterStatus({ children, className, error = false, ...props }) {
  const { stage, animate, shouldMove } = useReceiptPrinter();
  return <div className={classes("flex min-w-0 items-center gap-2.5", className)} {...props}>
    <span aria-hidden="true" className="flex size-5 shrink-0 items-center justify-center">{error ? <AlertCircle size={18} className="text-[#f1d5aa]" /> : stage === "complete" ? <CircleCheck size={18} className="text-[#a1d6af]" /> : <LoaderCircle size={18} className={classes("text-[#b4cabd]", animate && "animate-spin motion-reduce:animate-none")} />}</span>
    <div role="status" aria-live="polite" className="grid min-w-0 flex-1">
      <AnimatePresence initial={false} mode="sync"><Motion.span key={error ? "error" : stage} initial={{ opacity: animate ? 0 : 1, y: shouldMove ? 4 : 0 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: animate ? 0 : 1, y: shouldMove ? -4 : 0 }} transition={{ duration: animate ? 0.18 : 0, ease: easeOut }} className="col-start-1 row-start-1 text-xs leading-5">{children ?? statusLabels[stage]}</Motion.span></AnimatePresence>
    </div>
  </div>;
}

export function ReceiptPrinterPaper({ children, className, style, ...props }) {
  return <article className={classes("relative z-10 min-h-80 bg-[#fffefb] px-5 pt-7 pb-8 font-mono text-[#294137] sm:px-6", className)} style={{ clipPath: receiptClipPath, backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 3px, #29413703 3px, #29413703 4px)", ...style }} {...props}>{children}</article>;
}

export function ReceiptPrinterOutput({ children, className, onFeedComplete, ...props }) {
  const { stage, animate, feedMotion, shouldMove } = useReceiptPrinter();
  const visible = stage !== "processing";
  const stepped = feedMotion === "stepped" && stage === "printing" && shouldMove;
  return <div className={classes("relative z-50 -mt-4 w-[calc(100%_-_1rem)] max-w-full overflow-hidden px-2 pb-5 sm:w-[calc(100%_-_2rem)]", className)} {...props}>
    {visible && <div aria-hidden="true" className="pointer-events-none absolute inset-x-2 -top-1 z-20 h-2 bg-[#102019]/45 blur-[5px]" />}
    <Motion.div
      initial={shouldMove ? { opacity: 0, transform: "translateY(calc(-100% + 2px))" } : false}
      animate={{ opacity: visible ? 1 : 0, transform: stage === "printing" && shouldMove ? stepped ? feedFrames : "translateY(0%)" : visible || !shouldMove ? "translateY(0%)" : "translateY(calc(-100% + 2px))" }}
      transition={{ opacity: { duration: animate ? 0.16 : 0 }, transform: { duration: shouldMove && stage === "printing" ? 1.75 : 0, ease: stepped ? "linear" : easeInOut, ...(stepped ? { times: feedTimes } : {}) } }}
      onAnimationComplete={() => { if (stage === "printing") onFeedComplete?.(); }}
      aria-hidden={stage !== "complete"}
      className="relative drop-shadow-[0_8px_10px_#29413718]"
    >{children}</Motion.div>
  </div>;
}
