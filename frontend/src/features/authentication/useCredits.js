import { useEffect, useState } from "react";
import { sessionRequest } from "../../lib/api";

export default function useCredits(userId, page = 1) {
  const [state, setState] = useState({ userId: null, page: null, data: null, error: "" });
  useEffect(() => {
    if (!userId) return;
    let active = true;
    let inFlight = false;
    async function load() {
      if (inFlight) return;
      inFlight = true;
      try {
        const data = await sessionRequest(`/credits?page=${page}`);
        if (active) setState({ userId, page, data, error: "" });
      } catch (error) {
        if (active) setState((current) => ({ ...current, userId, page, error: error.message }));
      } finally { inFlight = false; }
    }
    load();
    const timer = setInterval(() => { if (document.visibilityState === "visible") load(); }, 30000);
    window.addEventListener("focus", load);
    window.addEventListener("credits-changed", load);
    return () => { active = false; clearInterval(timer); window.removeEventListener("focus", load); window.removeEventListener("credits-changed", load); };
  }, [userId, page]);
  const matches = state.userId === userId && state.page === page;
  return { data: matches ? state.data : null, error: matches ? state.error : "", loading: !matches || (!state.data && !state.error) };
}
