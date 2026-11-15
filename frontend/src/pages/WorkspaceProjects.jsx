import { useEffect, useState } from "react";
import { ArrowLeft, Building2, FolderKanban, Menu, Trash2 } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import DashboardSidebar from "../components/DashboardSidebar";
import { useAuth } from "../features/authentication/authContext";
import WorkspaceAccess from "../features/workspaces/WorkspaceAccess";
import ProjectForm from "../features/workspaces/ProjectForm";
import DeleteItemModal from "../components/DeleteItemModal";
import { useUndoDeletion } from "../context/undoDeletionContext";

function WorkspaceProjectsView({ user, workspaceKey }) {
  const { getWorkspaceProjects, deleteProject } = useAuth();
  const { scheduleDeletion, pendingId, deletedProjectIds, deletionBusy } =
    useUndoDeletion();
  const [editing, setEditing] = useState(null);
  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [attempt, setAttempt] = useState(0);
  const workspace = result?.workspace;
  const canEdit = !error && ["owner", "editor"].includes(workspace?.role);
  const projects = (result?.projects || []).filter(
    (project) =>
      pendingId !== `project:${project.id}` &&
      !deletedProjectIds.includes(`project:${project.id}`),
  );

  useEffect(() => {
    let active = true;
    getWorkspaceProjects(workspaceKey)
      .then((data) => {
        if (active) setResult(data);
      })
      .catch((error) => {
        if (active) setError(error);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [getWorkspaceProjects, workspaceKey, attempt]);

  return (
    <div className="min-h-screen bg-[#f6f8f7] text-[#102019] lg:pl-64">
      <DashboardSidebar
        user={user}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      <main className="mx-auto max-w-[1440px] px-4 py-6 sm:px-8 lg:p-10">
        <Link
          to="/workspaces"
          className="mb-6 inline-flex min-h-10 items-center gap-2 rounded text-sm font-semibold text-[#294137] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#294137]"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          All workspaces
        </Link>
        <header className="flex items-start gap-3">
          <button
            type="button"
            aria-label="Open navigation"
            aria-controls="dashboard-sidebar"
            aria-expanded={isSidebarOpen}
            onClick={() => setIsSidebarOpen(true)}
            className="flex size-11 shrink-0 items-center justify-center rounded-lg border border-[#CFDDD5] bg-white text-[#294137] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#294137] lg:hidden"
          >
            <Menu size={20} aria-hidden="true" />
          </button>
          <div className="min-w-0">
            <div className="mb-3 flex items-center gap-2 text-xs font-semibold tracking-widest text-[#526159]">
              <Building2 size={16} aria-hidden="true" />
              WORKSPACE
              {workspace?.isPrimary && (
                <span className="ml-2 rounded-full bg-[#edf3ef] px-3 py-1 text-xs tracking-normal text-[#294137]">
                  Primary
                </span>
              )}
            </div>
            <h1 className="break-words text-3xl font-extrabold tracking-tight sm:text-4xl">
              {error?.status === 404
                ? "Workspace not found"
                : workspace?.name || "Workspace projects"}
            </h1>
            <p className="mt-3 text-sm leading-6 text-[#526159]">
              Private | {workspace?.role || "Members only"}
            </p>
            {workspace?.id && (
              <p className="mt-2 break-all text-xs text-[#526159]">
                Workspace ID: {workspace.id}
              </p>
            )}
          </div>
        </header>

        {!error && workspace?.role === "owner" && (
          <WorkspaceAccess workspace={workspace} />
        )}
        <section
          aria-labelledby="workspace-projects-heading"
          aria-busy={isLoading}
          className="mt-9"
        >
          {canEdit && (
            <button
              type="button"
              onClick={() => setAdding(true)}
              className="mb-5 min-h-11 cursor-pointer rounded-lg bg-[#294137] px-5 text-sm font-semibold text-white"
            >
              New project
            </button>
          )}
          <h2
            id="workspace-projects-heading"
            className="mb-5 text-lg font-bold tracking-tight"
          >
            Projects
            {result && !error && (
              <span className="ml-2 text-sm font-medium text-[#526159]">
                ({projects.length})
              </span>
            )}
          </h2>
          {isLoading ? (
            <p
              role="status"
              className="rounded-xl border border-[#CFDDD5] bg-white p-8 text-sm text-[#526159]"
            >
              Loading projects...
            </p>
          ) : error ? (
            <div className="rounded-xl border border-[#CFDDD5] bg-white p-8">
              <p role="alert" className="text-sm text-red-700">
                {error.message}
              </p>
              {error.status !== 404 && (
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setIsLoading(true);
                    setAttempt((value) => value + 1);
                  }}
                  className="mt-4 min-h-11 cursor-pointer rounded-lg border border-[#CFDDD5] px-4 text-sm font-semibold text-[#294137] hover:bg-[#edf3ef] focus-visible:outline-2 focus-visible:outline-[#294137]"
                >
                  Try again
                </button>
              )}
            </div>
          ) : projects.length ? (
            <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {projects.map((project) => (
                <li
                  key={project.id}
                  className="rounded-xl border border-[#CFDDD5] bg-white p-6"
                >
                  <span className="flex size-11 items-center justify-center rounded-lg bg-[#edf3ef] text-[#294137]">
                    <FolderKanban size={22} aria-hidden="true" />
                  </span>
                  <h3 className="mt-5 break-words text-lg font-semibold">
                    {project.name}
                  </h3>
                  {project.description && (
                    <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-[#526159]">
                      {project.description}
                    </p>
                  )}
                  <p className="mt-5 text-xs text-[#526159]">
                    Created{" "}
                    <time dateTime={project.createdAt}>
                      {new Date(project.createdAt).toLocaleDateString()}
                    </time>
                  </p>
                  {canEdit && (
                    <>
                      <button
                        type="button"
                        onClick={() => setEditing(project)}
                        className="mt-4 mr-2 min-h-9 cursor-pointer rounded-lg border border-[#CFDDD5] px-3 text-xs font-semibold"
                      >
                        Edit project
                      </button>
                      <button
                        type="button"
                        disabled={deletionBusy}
                        onClick={() => setDeleting(project)}
                        className="mt-4 inline-flex min-h-9 cursor-pointer items-center gap-2 rounded-lg px-2 text-xs font-medium text-red-700 hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Trash2 size={14} aria-hidden="true" />
                        Delete project
                      </button>
                    </>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-[#CFDDD5] bg-white px-6 py-10 text-center">
              <FolderKanban
                size={30}
                className="mb-4 text-[#526159]"
                aria-hidden="true"
              />
              <h3 className="text-lg font-semibold">No projects yet</h3>
              <p className="mt-2 max-w-sm text-sm leading-6 text-[#526159]">
                This workspace has no projects yet.
              </p>
            </div>
          )}
        </section>
        {(adding || editing) && (
          <ProjectForm
            workspaceId={workspace.id}
            project={editing}
            onDismiss={() => {
              setAdding(false);
              setEditing(null);
            }}
            onSaved={() => {
              setAdding(false);
              setEditing(null);
              setError(null);
              setAttempt((value) => value + 1);
            }}
          />
        )}
        {deleting && (
          <DeleteItemModal
            title={`Delete ${deleting.name}?`}
            description="This permanently deletes the project from your workspace."
            onDismiss={() => setDeleting(null)}
            onConfirm={() => {
              if (
                scheduleDeletion({
                  id: `project:${deleting.id}`,
                  message: "Project deletion scheduled",
                  commit: () => deleteProject(deleting.id),
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

export default function WorkspaceProjects({ user }) {
  const { workspaceKey } = useParams();
  return (
    <WorkspaceProjectsView
      key={workspaceKey}
      user={user}
      workspaceKey={workspaceKey}
    />
  );
}
