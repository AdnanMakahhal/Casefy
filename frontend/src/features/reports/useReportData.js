import { useEffect, useState } from "react";
import { sessionRequest } from "../../lib/api";

export default function useReportData(path, revision = 0) {
  const [state, setState] = useState({
    path: null,
    revision: -1,
    data: null,
    error: "",
  });
  useEffect(() => {
    let active = true;
    sessionRequest(path)
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
  }, [path, revision]);
  const loading = state.path !== path || state.revision !== revision;
  return {
    loading,
    data: loading ? null : state.data,
    error: loading ? "" : state.error,
  };
}
