import { AnimatePresence, motion as Motion, useReducedMotion } from "motion/react";

export default function AnimatedIcon({ animationKey, children }) {
  const reducedMotion = useReducedMotion();
  return (
    <span aria-hidden="true" className="relative flex size-7 shrink-0 items-center justify-center">
      <AnimatePresence initial={false} mode="wait">
        <Motion.span
          key={animationKey}
          className="absolute inset-0 flex items-center justify-center"
          initial={reducedMotion ? false : { opacity: 0, rotate: -60, scale: 0.65, y: 4 }}
          animate={{ opacity: 1, rotate: 0, scale: 1, y: 0 }}
          exit={reducedMotion ? { opacity: 0 } : { opacity: 0, rotate: 60, scale: 0.65, y: -4 }}
          transition={reducedMotion ? { duration: 0 } : { duration: 0.16, ease: "easeOut", delay: 0.06, opacity: { duration: 0.12 } }}
        >{children}</Motion.span>
      </AnimatePresence>
    </span>
  );
}
