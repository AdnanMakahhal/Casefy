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
          className="fixed top-4 right-4 z-[100] w-fit max-w-[calc(100vw-2rem)] rounded-md bg-[#021316] px-4 py-3 text-sm font-medium text-white shadow-xl sm:top-6 sm:right-6 sm:max-w-sm"
        >
          {toast.message}
        </div>
      )}
    </ToastContext.Provider>
  );
}

export default ToastProvider;
