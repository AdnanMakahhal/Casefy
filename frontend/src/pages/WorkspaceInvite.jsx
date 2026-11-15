import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { LockKeyhole } from "lucide-react";
import { useAuth } from "../features/authentication/authContext";
import { workspaceRequest } from "../features/workspaces/api";

export default function WorkspaceInvite() {
  const location = useLocation();
  const navigate = useNavigate();
  const { refreshWorkspaces } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const token = location.hash.slice(1);
  async function join() {
    setBusy(true); setError("");
    try {
      const result = await workspaceRequest("/workspace-invites/accept", { method: "POST", body: JSON.stringify({ token }) });
      refreshWorkspaces();
      navigate(`/workspaces/${result.workspace.id}`, { replace: true });
    } catch (error) { setError(error.message); }
    finally { setBusy(false); }
  }
  return <main className="flex min-h-screen items-center justify-center bg-[#FFFFFF] p-5 text-[#102019]"><section className="w-full max-w-lg rounded-2xl border border-[#CFDDD5] bg-white p-8"><Link to="/" aria-label="Casefy home" className="mb-7 inline-block rounded bg-white focus-visible:outline-2 focus-visible:outline-[#294137]"><img src="/Logo/Logo_Casefy.svg" alt="Casefy logo" width="150" height="50" className="h-[50px] w-[150px] object-contain" /></Link><LockKeyhole size={32} className="text-[#294137]" /><h1 className="mt-5 text-3xl font-bold">Workspace invitation</h1><p className="mt-4 text-sm leading-6 text-[#526159]">Join this private workspace using the permission selected by its owner. Your own workspace stays private.</p>{error && <p role="alert" className="mt-5 text-sm text-red-700">{error}</p>}<button type="button" disabled={busy || !/^[a-f0-9]{64}$/.test(token)} onClick={join} className="mt-6 min-h-12 w-full cursor-pointer rounded-lg bg-[#294137] px-5 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">{busy ? "Joining…" : "Accept invitation and join"}</button>{!/^[a-f0-9]{64}$/.test(token) && <p className="mt-4 text-sm text-red-700">This invite link is incomplete. Ask the owner for a new link.</p>}<Link to="/workspaces" className="mt-5 block text-center text-sm underline">Back to my workspaces</Link></section></main>;
}
