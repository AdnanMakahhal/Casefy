import { useCallback, useRef, useState } from "react";
import { X } from "lucide-react";
import UndoNotice from "../components/UndoNotice";
import { UndoDeletionContext } from "./undoDeletionContext";

export default function UndoDeletionProvider({ children }) {
  const [pending, setPending] = useState(null);
  const [committing, setCommitting] = useState(false);
  const [error, setError] = useState("");
  const [deletedProjectIds, setDeletedProjectIds] = useState([]);
  const action = useRef(null);

  const scheduleDeletion = useCallback(({ id, message, commit }) => {
    if (action.current) return false;
    action.current = { id, commit };
    setError("");
    setPending({ id, message });
    return true;
  }, []);

  const expire = useCallback(async () => {
    const task = action.current;
    if (!task) return;
    setCommitting(true);
    try {
      await task.commit();
      if (task.id.startsWith("project:"))
        setDeletedProjectIds((ids) => [...ids, task.id]);
    } catch (error) {
      setError(
        error.message || "Unable to delete. Your data has been restored.",
      );
    } finally {
      action.current = null;
      setPending(null);
      setCommitting(false);
    }
  }, []);

  const undo = useCallback(() => {
    action.current = null;
    setPending(null);
  }, []);

  return (
    <UndoDeletionContext.Provider
      value={{
        scheduleDeletion,
        pendingId: pending?.id,
        deletedProjectIds,
        deletionBusy: Boolean(pending),
      }}
    >
      {children}
      {(pending || error) && (
        <div className="fixed right-4 bottom-5 left-4 z-[100] mx-auto max-w-md sm:right-6 sm:left-auto sm:w-[380px]">
          {pending &&
            (committing ? (
              <p
                role="status"
                className="rounded-xl border border-[#cfddd5] bg-white p-4 text-sm text-[#526159] shadow-lg"
              >
                Deleting...
              </p>
            ) : (
              <UndoNotice
                message={pending.message}
                onExpire={expire}
                onUndo={undo}
              />
            ))}
          {error && (
            <div
              role="alert"
              className="flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-white p-4 text-sm text-red-700 shadow-lg"
            >
              <p>{error}</p>
              <button
                type="button"
                aria-label="Dismiss deletion error"
                onClick={() => setError("")}
                className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-lg hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-red-700"
              >
                <X size={16} />
              </button>
            </div>
          )}
        </div>
      )}
    </UndoDeletionContext.Provider>
  );
}
