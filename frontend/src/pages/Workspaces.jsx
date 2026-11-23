import H2 from "../ui/H2";
import P from "../ui/P";
import Span from "../ui/Span";
import Button from "../ui/Button";
import Heading from "../ui/Heading";
import WorkspaceCardSkeleton from "../ui/WorkspaceCardSkeleton";
import { useState } from "react";
import {
  RiArrowRightLine as ArrowRight,
  RiBuildingLine as Building2,
  RiLock2Line as LockKeyhole,
  RiMenuLine as Menu,
  RiAddLine as Plus,
  RiDeleteBin6Line as Trash2
} from "react-icons/ri";
import { Link } from "react-router-dom";
import DashboardSidebar from "../components/DashboardSidebar";
import AccountModal from "../components/AccountModal";
import { useAuth } from "../features/authentication/authContext";
import { canAddWorkspace } from "../features/authentication/plans";
import useWorkspaces from "../features/workspaces/useWorkspaces";
import DeleteItemModal from "../components/DeleteItemModal";
import { useUndoDeletion } from "../Context/undoDeletionContext";

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
    } catch (error) {
      setError(error.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AccountModal title="Add workspace" onDismiss={onDismiss} busy={busy}>
      <P variant="unstyled" className="mb-5 text-sm leading-6 text-[#526159]">
        Give your new workspace a name.
      </P>
      <form onSubmit={submit}>
        <label
          htmlFor="new-workspace-name"
          className="block text-sm font-medium"
        >
          Workspace name
        </label>
        <input
          id="new-workspace-name"
          name="workspaceName"
          type="text"
          autoComplete="organization"
          placeholder="e.g. Mobile app QA"
          required
          maxLength={80}
          value={name}
          onChange={(event) => {
            setName(event.target.value);
            setError("");
          }}
          disabled={busy}
          className="mt-2 min-h-12 w-full rounded-md border border-[#CFDDD5] bg-white px-3 py-3 text-base text-[#102019] placeholder:text-[#929b97] focus:outline-2 focus:outline-offset-2 focus:outline-[#294137]"
        />
        {error && (
          <P variant="unstyled" role="alert" className="mt-4 text-sm text-red-700">
            {error}
          </P>
        )}
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="unstyled"
            type="button"
            disabled={busy}
            onClick={onDismiss}
            className="min-h-11 cursor-pointer rounded-md border border-[#CFDDD5] px-4 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-[#294137] disabled:opacity-50"
          >
            Cancel
          </Button>
          <Button variant="primary" size="custom"
            type="submit"
            disabled={busy || !name.trim()}
            className="min-h-11 px-4"
          >
            {busy ? "Adding..." : "Add workspace"}
          </Button>
        </div>
      </form>
    </AccountModal>
  );
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
  const workspaces = savedWorkspaces.filter(
    (workspace) => pendingId !== `workspace:${workspace.key}`,
  );

  return (
    <div className="min-h-screen bg-[#f6f8f7] text-[#102019] lg:pl-64">
      <DashboardSidebar
        user={user}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      <main className="mx-auto max-w-[1440px] px-4 py-6 sm:px-8 lg:p-10">
        <header className="flex flex-wrap items-start justify-between gap-5">
          <div className="flex items-start gap-3">
            <Button variant="outline" size="custom"
              type="button"
              aria-label="Open navigation"
              aria-controls="dashboard-sidebar"
              aria-expanded={isSidebarOpen}
              onClick={() => setIsSidebarOpen(true)}
              className="flex size-11 shrink-0 lg:hidden"
            >
              <Menu size={20} aria-hidden="true" />
            </Button>
            <div>
              <Heading as="h1" className="text-3xl font-extrabold tracking-tight sm:text-4xl">
                Workspaces
              </Heading>
              <P variant="unstyled" className="mt-3 text-sm leading-6 text-[#526159]">
                Private workspaces you own or have joined.
              </P>
            </div>
          </div>
          {canAdd && (
            <Button variant="primary" size="custom"
              type="button"
              disabled={deletionBusy}
              onClick={() => {
                setMessage("");
                setIsAdding(true);
              }}
              className="min-h-11 px-5"
            >
              <Plus size={18} aria-hidden="true" />
              Add workspace
            </Button>
          )}
        </header>

        {message && (
          <P variant="unstyled" role="status" className="mt-6 text-sm text-[#294137]">
            {message}
          </P>
        )}
        {!canAdd && (
          <P variant="unstyled" className="mt-6 rounded-md border border-[#CFDDD5] bg-white px-4 py-3 text-sm text-[#526159]">
            Free plan: use your private workspace or join an invited workspace.
            Upgrade to create additional workspaces.
          </P>
        )}
        <section aria-labelledby="workspace-list-heading" aria-busy={loading} className="mt-7">
          <H2 variant="unstyled"
            id="workspace-list-heading"
            className="mb-5 text-lg font-bold tracking-tight"
          >
            Your workspaces{" "}
            {!loading && !error && <Span className="ml-1 text-sm font-medium text-[#526159]">
              ({workspaces.length})
            </Span>}
          </H2>
          {loading ? (
            <WorkspaceCardSkeleton />
          ) : error ? (
            <P variant="unstyled" role="alert" className="text-red-700">
              {error}
            </P>
          ) : workspaces.length ? (
            <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {workspaces.map(({ key, name, isPrimary, role }) => (
                <li
                  key={key}
                  className="flex min-w-0 flex-col overflow-hidden rounded-md border border-[#CFDDD5] bg-white transition-shadow hover:shadow-sm"
                >
                  <Link
                    to={`/workspaces/${key}`}
                    className="group block flex-1 p-5 transition-colors hover:bg-[#f6f8f7] focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-[#294137]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <Span variant="accent" className="flex size-10 items-center justify-center rounded-md bg-[#edf3ef]">
                        <Building2 size={21} aria-hidden="true" />
                      </Span>
                      {isPrimary && (
                        <Span variant="accent" className="rounded-md bg-[#edf3ef] px-3 py-1 text-xs font-semibold">
                          Primary
                        </Span>
                      )}
                    </div>
                    <h3 className="mt-4 break-words text-base font-semibold">
                      {name}
                    </h3>
                    <P variant="unstyled" className="mt-2 text-xs leading-5 text-[#526159]">
                      {`Private · ${role === "owner" ? "Owner" : role === "editor" ? "Editor" : "Viewer"}`}
                    </P>
                    <Span variant="accent" className="mt-5 inline-flex min-h-10 items-center gap-2 rounded-md border border-[#cfddd5] bg-white px-3 text-xs font-semibold group-hover:border-[#91a99a] group-hover:bg-[#edf3ef]">
                      View projects
                      <ArrowRight
                        size={16}
                        aria-hidden="true"
                        className="transition-transform group-hover:translate-x-1 motion-reduce:transition-none"
                      />
                    </Span>
                  </Link>
                  <div className="border-t border-[#e1e9e4] bg-[#f6f8f7] px-5 py-3">
                    {isPrimary || role !== "owner" ? (
                      <P variant="unstyled" className="flex min-h-9 items-center gap-2 text-xs text-[#718578]">
                        <LockKeyhole size={14} aria-hidden="true" />
                        {role === "owner"
                          ? "Protected from deletion"
                          : `${role === "editor" ? "Editor" : "Viewer"} access`}
                      </P>
                    ) : (
                      <Button variant="unstyled"
                        type="button"
                        disabled={deletionBusy}
                        onClick={() => setDeleting({ key, name })}
                        className="inline-flex min-h-9 cursor-pointer items-center gap-2 rounded-md px-2 text-xs font-medium text-red-700 hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Trash2 size={14} aria-hidden="true" />
                        Delete workspace
                      </Button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="rounded-md border border-dashed border-[#CFDDD5] bg-white p-10 text-center">
              <Building2
                size={30}
                className="mx-auto text-[#526159]"
                aria-hidden="true"
              />
              <h3 className="mt-4 text-lg font-semibold">
                {canAdd
                  ? "Create your first workspace"
                  : "No workspaces to show"}
              </h3>
              <P variant="unstyled" className="mt-2 text-sm leading-6 text-[#526159]">
                {canAdd
                  ? "Use Add workspace to get started."
                  : "Your saved workspaces will appear here."}
              </P>
            </div>
          )}
        </section>
        {canAdd && isAdding && (
          <AddWorkspace
            onDismiss={() => setIsAdding(false)}
            onAdded={() => {
              setIsAdding(false);
              setMessage("Workspace added.");
            }}
          />
        )}
        {deleting && (
          <DeleteItemModal
            title={`Delete ${deleting.name}?`}
            description="Deleting this workspace also permanently deletes its projects."
            onDismiss={() => setDeleting(null)}
            onConfirm={() => {
              if (
                scheduleDeletion({
                  id: `workspace:${deleting.key}`,
                  message: "Workspace deletion scheduled",
                  commit: () => deleteWorkspace(deleting),
                })
              )
                setDeleting(null);
            }}
          />
        )}
      </main>
    </div>
  );
}
