import { useState } from "react";
import { ArrowRight, Building2, LockKeyhole, Menu, Plus, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import DashboardSidebar from "../components/DashboardSidebar";
import AccountModal from "../components/AccountModal";
import { useAuth } from "../features/authentication/authContext";
import { canAddWorkspace } from "../features/authentication/plans";
import useWorkspaces from "../features/workspaces/useWorkspaces";
import DeleteItemModal from "../components/DeleteItemModal";
import { useUndoDeletion } from "../context/undoDeletionContext";

function AddWorkspace({ onDismiss, onAdded }) {
  const { addWorkspace } = useAuth();
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event) {
    event.preventDefault();
    if (busy || !name.trim()) return;
    setBusy(true);
    setError("");
    try {
      await addWorkspace(name);
      onAdded();
    } catch (error) { setError(error.message); }
    finally { setBusy(false); }
  }

  return <AccountModal title="Add workspace" onDismiss={onDismiss} busy={busy}>
    <p className="mb-5 text-sm leading-6 text-[#526159]">Give your new workspace a name.</p>
    <form onSubmit={submit}>
      <label htmlFor="new-workspace-name" className="block text-sm font-medium">Workspace name</label>
      <input id="new-workspace-name" name="workspaceName" type="text" autoComplete="organization" placeholder="e.g. Mobile app QA" required maxLength={80} value={name} onChange={(event) => { setName(event.target.value); setError(""); }} disabled={busy} className="mt-2 min-h-12 w-full rounded-lg border border-[#CFDDD5] bg-white px-3 py-3 text-base text-[#102019] placeholder:text-[#929b97] focus:outline-2 focus:outline-offset-2 focus:outline-[#294137]" />
      {error && <p role="alert" className="mt-4 text-sm text-red-700">{error}</p>}
      <div className="mt-6 flex justify-end gap-3"><button type="button" disabled={busy} onClick={onDismiss} className="min-h-11 cursor-pointer rounded-lg border border-[#CFDDD5] px-4 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-[#294137] disabled:opacity-50">Cancel</button><button type="submit" disabled={busy || !name.trim()} className="min-h-11 cursor-pointer rounded-lg bg-[#294137] px-4 text-sm font-semibold text-white hover:bg-[#20332b] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#294137] disabled:cursor-not-allowed disabled:opacity-50">{busy ? "Adding..." : "Add workspace"}</button></div>
    </form>
  </AccountModal>;
}

export default function Workspaces({ user }) {
  const { deleteWorkspace } = useAuth();
  const { scheduleDeletion, pendingId, deletionBusy } = useUndoDeletion();
  const [deleting, setDeleting] = useState(null);
  const canAdd = canAddWorkspace(user);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [message, setMessage] = useState("");
  const { workspaces: savedWorkspaces, loading, error } = useWorkspaces();
  const workspaces = savedWorkspaces.filter((workspace) => pendingId !== `workspace:${workspace.key}`);

  return (
    <div className="min-h-screen bg-[#f6f8f7] text-[#102019] lg:pl-64">
      <DashboardSidebar user={user} isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <main className="mx-auto max-w-[1440px] px-4 py-6 sm:px-8 lg:p-10">
        <header className="flex flex-wrap items-start justify-between gap-5">
          <div className="flex items-start gap-3">
            <button type="button" aria-label="Open navigation" aria-controls="dashboard-sidebar" aria-expanded={isSidebarOpen} onClick={() => setIsSidebarOpen(true)} className="flex size-11 shrink-0 items-center justify-center rounded-lg border border-[#CFDDD5] bg-white text-[#294137] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#294137] lg:hidden"><Menu size={20} aria-hidden="true" /></button>
            <div><h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Workspaces</h1><p className="mt-3 text-sm leading-6 text-[#526159]">Private workspaces you own or have joined.</p></div>
          </div>
          {canAdd && <button type="button" disabled={deletionBusy} onClick={() => { setMessage(""); setIsAdding(true); }} className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-lg bg-[#294137] px-5 text-sm font-semibold text-white hover:bg-[#20332b] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#294137] disabled:cursor-not-allowed disabled:opacity-50"><Plus size={18} aria-hidden="true" />Add workspace</button>}
        </header>

        {message && <p role="status" className="mt-6 text-sm text-[#294137]">{message}</p>}
        {!canAdd && <p className="mt-6 rounded-lg border border-[#CFDDD5] bg-white px-4 py-3 text-sm text-[#526159]">Free plan: use your private workspace or join an invited workspace. Upgrade to create additional workspaces.</p>}
        <section aria-labelledby="workspace-list-heading" className="mt-9">
          <h2 id="workspace-list-heading" className="mb-5 text-lg font-bold tracking-tight">Your workspaces <span className="ml-1 text-sm font-medium text-[#526159]">({workspaces.length})</span></h2>
          {loading ? <div role="status" aria-label="Loading workspaces" className="h-52 animate-pulse rounded-xl bg-[#e1e9e4]" /> : error ? <p role="alert" className="text-red-700">{error}</p> : workspaces.length ? <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {workspaces.map(({ key, name, isPrimary, role }) => <li key={key} className="flex flex-col overflow-hidden rounded-xl border border-[#CFDDD5] bg-white">
              <Link to={`/workspaces/${key}`} className="group block flex-1 p-6 transition-colors hover:bg-[#edf3ef] focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-[#294137]">
              <div className="flex items-start justify-between gap-3"><span className="flex size-12 items-center justify-center rounded-xl bg-[#edf3ef] text-[#294137]"><Building2 size={23} aria-hidden="true" /></span>{isPrimary && <span className="rounded-full bg-[#edf3ef] px-3 py-1 text-xs font-semibold text-[#294137]">Primary</span>}</div>
              <h3 className="mt-5 break-words text-lg font-semibold">{name}</h3>
              <p className="mt-2 text-sm text-[#526159]">{`Private | ${role === "owner" ? "Owner" : role === "editor" ? "Editor" : "Viewer"}`}<span className="mt-2 block break-all text-xs">ID: {key}</span></p>
              <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#294137]">View projects<ArrowRight size={16} aria-hidden="true" className="transition-transform group-hover:translate-x-1 motion-reduce:transition-none" /></span>
              </Link>
              <div className="border-t border-[#e1e9e4] px-6 py-3">{isPrimary || role !== "owner" ? <p className="flex min-h-9 items-center gap-2 text-xs text-[#718578]"><LockKeyhole size={14} aria-hidden="true" />{role === "owner" ? "Primary workspace cannot be deleted" : `${role === "editor" ? "Editor" : "Viewer"} access | Private`}</p> : <button type="button" disabled={deletionBusy} onClick={() => setDeleting({ key, name })} className="inline-flex min-h-9 cursor-pointer items-center gap-2 rounded-lg px-2 text-xs font-medium text-red-700 hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-red-700 disabled:cursor-not-allowed disabled:opacity-50"><Trash2 size={14} aria-hidden="true" />Delete workspace</button>}</div>
            </li>)}
          </ul> : <div className="rounded-xl border border-dashed border-[#CFDDD5] bg-white p-10 text-center"><Building2 size={30} className="mx-auto text-[#526159]" aria-hidden="true" /><h3 className="mt-4 text-lg font-semibold">{canAdd ? "Create your first workspace" : "No workspaces to show"}</h3><p className="mt-2 text-sm leading-6 text-[#526159]">{canAdd ? "Use Add workspace to get started." : "Your saved workspaces will appear here."}</p></div>}
        </section>
        {canAdd && isAdding && <AddWorkspace onDismiss={() => setIsAdding(false)} onAdded={() => { setIsAdding(false); setMessage("Workspace added."); }} />}
        {deleting && <DeleteItemModal title={`Delete ${deleting.name}?`} description="Deleting this workspace also permanently deletes its projects." onDismiss={() => setDeleting(null)} onConfirm={() => {
          if (scheduleDeletion({ id: `workspace:${deleting.key}`, message: "Workspace deletion scheduled", commit: () => deleteWorkspace(deleting) })) setDeleting(null);
        }} />}
      </main>
    </div>
  );
}
