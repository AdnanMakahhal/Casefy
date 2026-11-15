import { useEffect, useState } from "react";
import { Copy, Link2, ShieldCheck, Users } from "lucide-react";
import SelectMenu from "../../components/SelectMenu";
import { workspacePath, workspaceRequest } from "./api";

const roles = [
  { value: "viewer", label: "Viewer", description: "Can view workspace projects" },
  { value: "editor", label: "Editor", description: "Can create, edit and delete projects" },
];
const button = "min-h-10 cursor-pointer rounded-lg border border-[#CFDDD5] px-3 text-sm font-semibold hover:bg-[#edf3ef] disabled:cursor-not-allowed disabled:opacity-50";

export default function WorkspaceAccess({ workspace }) {
  const [data, setData] = useState(null);
  const [revision, setRevision] = useState(0);
  const [role, setRole] = useState("viewer");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [link, setLink] = useState("");
  useEffect(() => {
    let active = true;
    workspaceRequest(workspacePath(workspace.id, "/access")).then((result) => {
      if (active) setData(result);
    }).catch((error) => { if (active) setError(error.message); });
    return () => { active = false; };
  }, [workspace.id, revision]);

  async function change(path, method, body) {
    setBusy(true); setError(""); setMessage("");
    try {
      const result = await workspaceRequest(workspacePath(workspace.id, path), { method, ...(body ? { body: JSON.stringify(body) } : {}) });
      if (result.token) {
        setLink(`${window.location.origin}/workspace-invite#${result.token}`);
        setMessage("Invitation created. Copy the link and share it privately.");
      } else { setLink(""); setMessage(result.message); }
      setRevision((value) => value + 1);
    } catch (error) { setError(error.message); }
    finally { setBusy(false); }
  }
  async function copy() {
    try { await navigator.clipboard.writeText(link); setMessage("Invite link copied."); }
    catch { setMessage("Select and copy the invite link below."); }
  }
  return <section className="mt-8 rounded-xl border border-[#CFDDD5] bg-white p-5 sm:p-6" aria-labelledby="workspace-sharing">
    <h2 id="workspace-sharing" className="flex items-center gap-2 text-lg font-bold"><Users size={20} />People and invitations</h2>
    <p className="mt-2 text-sm leading-6 text-[#526159]">Only you and invited members can enter. Viewer access is read-only. Editors can create, edit and delete projects. Only you can manage access.</p>
    <div className="mt-5 flex flex-wrap items-end gap-3">
      <SelectMenu label="Invite permission" value={role} onChange={setRole} options={roles} disabled={busy} className="w-full sm:w-64" />
      <button type="button" disabled={busy} onClick={() => change("/invites", "POST", { role })} className={`${button} inline-flex items-center gap-2 bg-[#294137] text-white hover:bg-[#20332b]`}><Link2 size={16} />Create invite link</button>
    </div>
    <p className="mt-3 text-xs leading-5 text-[#526159]">Each link works once, expires after 7 days, and lets anyone holding it join after signing in. Share it only with the intended person.</p>
    {link && <div className="mt-4 flex flex-wrap gap-2"><input aria-label="New invite link" readOnly value={link} onFocus={(event) => event.target.select()} className="min-h-11 min-w-0 flex-1 rounded-lg border border-[#CFDDD5] px-3 text-sm" /><button type="button" className={`${button} inline-flex items-center gap-2`} onClick={copy}><Copy size={16} />Copy link</button></div>}
    {error && <p role="alert" className="mt-4 text-sm text-red-700">{error}</p>}
    {message && <p role="status" className="mt-4 text-sm text-[#294137]">{message}</p>}
    {!data ? error ? <button type="button" onClick={() => { setError(""); setRevision((value) => value + 1); }} className={`${button} mt-4`}>Reload members</button> : <div role="status" aria-label="Loading members" className="mt-5 h-24 animate-pulse rounded-lg bg-[#edf3ef]" /> : <>
      <h3 className="mt-7 font-semibold">Members ({data.members.length + 1})</h3>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-b border-[#e1e9e4] py-3"><div><p className="font-medium">{data.owner.name} (you)</p><p className="text-xs text-[#526159]">{data.owner.email}</p></div><span className="inline-flex items-center gap-1 text-sm text-[#526159]"><ShieldCheck size={16} />Owner</span></div>
      {data.members.map((member) => <div key={member.userId} className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e1e9e4] py-4"><div className="min-w-0"><p className="break-words font-medium">{member.user.name}</p><p className="break-all text-xs text-[#526159]">{member.user.email}</p></div><div className="flex flex-wrap items-center gap-2"><SelectMenu label={`Access for ${member.user.name}`} value={member.role} options={roles} disabled={busy} onChange={(role) => change(`/members/${member.userId}`, "PATCH", { role })} className="w-40" /><button type="button" disabled={busy} onClick={() => change(`/members/${member.userId}`, "PATCH", { role: "remove" })} className={`${button} text-red-700`}>Remove</button></div></div>)}
      <h3 className="mt-6 font-semibold">Pending invitations ({data.invites.length})</h3>
      {!data.invites.length && <p className="mt-2 text-sm text-[#526159]">No active invite links.</p>}
      {data.invites.map((invite) => <div key={invite.id} className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-[#f6f8f7] p-3"><div><p className="text-sm font-medium capitalize">{invite.role} invitation</p><p className="mt-1 text-xs text-[#526159]">Expires {new Date(invite.expiresAt).toLocaleString()}</p></div><button type="button" disabled={busy} onClick={() => change(`/invites/${invite.id}`, "DELETE")} className={`${button} text-red-700`}>Revoke link</button></div>)}
    </>}
  </section>;
}
