import { AnimatePresence, motion as Motion, useReducedMotion } from "motion/react";

export default function AnimatedView({ viewKey, children }) {
  const reducedMotion = useReducedMotion();
  return (
    <AnimatePresence initial={false} mode="wait">
      <Motion.div key={viewKey} className="min-w-0" initial={{ opacity: reducedMotion ? 1 : 0, x: reducedMotion ? 0 : 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: reducedMotion ? 0 : -8, pointerEvents: "none" }} transition={{ duration: reducedMotion ? 0 : 0.16, ease: "easeOut" }}>
        {children}
      </Motion.div>
    </AnimatePresence>
  );
}
