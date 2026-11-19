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
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
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
            <span className="site-loader-label">Loading Casefy...</span>
            <div className="site-loader-word" aria-hidden="true">
              <span>Casefy</span>
              <span>Casefy</span>
            </div>
          </Motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
