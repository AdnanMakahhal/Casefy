import { useEffect, useState } from "react";
import { workspaceRequest } from "./api";
import { useAuth } from "../authentication/authContext";

export default function useWorkspaces() {
  const { workspaceRevision } = useAuth();
  const [state, setState] = useState({ workspaces: [], loading: true, error: "" });
  useEffect(() => {
    let active = true;
    workspaceRequest("/workspaces").then((workspaces) => {
      if (active) setState({ workspaces, loading: false, error: "" });
    }).catch((error) => { if (active) setState({ workspaces: [], loading: false, error: error.message }); });
    return () => { active = false; };
  }, [workspaceRevision]);
  return state;
}
