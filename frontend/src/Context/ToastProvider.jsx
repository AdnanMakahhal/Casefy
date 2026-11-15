import { useCallback, useEffect, useRef, useState } from "react";
import { ToastContext } from "./toastContext";

function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);
  const timer = useRef(null);

  const showToast = useCallback((message) => {
    window.clearTimeout(timer.current);
    setToast({ id: Date.now(), message });
    timer.current = window.setTimeout(() => setToast(null), 3500);
  }, []);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      {toast && (
        <div
          key={toast.id}
          role="status"
          aria-live="polite"
          className="fixed inset-x-4 bottom-4 z-[100] mx-auto w-fit max-w-sm rounded-lg bg-[#021316] px-4 py-3 text-sm font-medium text-white shadow-xl sm:right-6 sm:left-auto"
        >
          {toast.message}
        </div>
      )}
    </ToastContext.Provider>
  );
}

export default ToastProvider;
