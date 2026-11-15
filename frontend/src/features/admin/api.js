import { useEffect, useState } from "react";
import { sessionRequest } from "../../lib/api";

export const adminRequest = (path, options) =>
  sessionRequest(`/admin${path}`, options);

export function useStaffData(
  path,
  revision = 0,
  session = false,
  keepPreviousData = false,
) {
  const [state, setState] = useState({
    path: null,
    revision: -1,
    data: null,
    error: "",
  });
  useEffect(() => {
    let active = true;
    (session ? sessionRequest(path) : adminRequest(path))
      .then((data) => {
        if (active) setState({ path, revision, data, error: "" });
      })
      .catch((error) => {
        if (active)
          setState({ path, revision, data: null, error: error.message });
      });
    return () => {
      active = false;
    };
  }, [path, revision, session]);
  const refreshing = state.path !== path || state.revision !== revision;
  const loading =
    refreshing && (!keepPreviousData || state.path !== path || !state.data);
  return {
    loading,
    refreshing,
    data: loading ? null : state.data,
    error: loading ? "" : state.error,
  };
}
