import Span from "../ui/Span";
import { useEffect, useState } from "react";
import { AnimatePresence, motion as Motion, useReducedMotion } from "motion/react";

export default function SiteStartup({ children }) {
  const [loading, setLoading] = useState(true);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    let active = true;
    const finish = () => {
      if (active) setLoading(false);
    };
    let minimumTimer;
    const minimum = new Promise((resolve) => {
      minimumTimer = window.setTimeout(resolve, reducedMotion ? 0 : 1100);
    });
    Promise.all([minimum, document.fonts?.ready]).then(finish);
    // A delayed font download must not keep the site behind the splash screen.
    const deadline = window.setTimeout(finish, 4000);
    return () => {
      active = false;
      window.clearTimeout(minimumTimer);
      window.clearTimeout(deadline);
    };
  }, [reducedMotion]);

  useEffect(() => {
    if (!loading) return;
    const alreadyLocked = document.body.classList.contains("overflow-hidden");
    document.body.classList.add("overflow-hidden");
    return () => {
      if (!alreadyLocked) document.body.classList.remove("overflow-hidden");
    };
  }, [loading]);

  return (
    <>
      <div inert={loading ? true : undefined} aria-hidden={loading ? true : undefined}>
        {children}
      </div>
      <AnimatePresence>
        {loading && (
          <Motion.div
            key="site-startup"
            className="site-loader"
            role="status"
            aria-live="polite"
            aria-busy="true"
            initial={false}
            exit={{ opacity: 0 }}
            transition={{ duration: reducedMotion ? 0 : 0.25 }}
          >
            <Span className="site-loader-label">Loading Casefy...</Span>
            <div className="site-loader-word" aria-hidden="true">
              <Span>Casefy</Span>
              <Span>Casefy</Span>
            </div>
          </Motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
