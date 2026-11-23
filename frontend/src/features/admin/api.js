import { useEffect, useState } from "react";
import { sessionRequest } from "../../lib/api";

export const adminRequest = (path, options) =>
  sessionRequest(`/admin${path}`, options);

export function useStaffData(
  path,
  revision = 0,
  session = false,
  keepPreviousData = false,
  { refreshKey = 0 } = {},
) {
  const [state, setState] = useState({
    path: null,
    revision: -1,
    refreshKey: -1,
    data: null,
    error: "",
    errorStatus: null,
  });
  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);
    (session ? sessionRequest(path, { signal: controller.signal }) : adminRequest(path, { signal: controller.signal }))
      .then((data) => {
        if (active) setState({ path, revision, refreshKey, data, error: "", errorStatus: null });
      })
      .catch((error) => {
        if (active)
          setState({ path, revision, refreshKey, data: null, error: controller.signal.aborted ? "Loading timed out. Please refresh to try again." : error.message, errorStatus: error.status || null });
      }).finally(() => clearTimeout(timeout));
    return () => {
      active = false;
      controller.abort();
      clearTimeout(timeout);
    };
  }, [path, revision, session, refreshKey]);
  const refreshing = state.path !== path || state.revision !== revision || state.refreshKey !== refreshKey;
  const loading =
    refreshing && (!keepPreviousData || state.path !== path || !state.data || state.refreshKey !== refreshKey);
  return {
    loading,
    refreshing,
    data: loading ? null : state.data,
    error: loading ? "" : state.error,
    errorStatus: loading ? null : state.errorStatus,
  };
}
