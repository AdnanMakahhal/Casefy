import H2 from "../ui/H2";
import P from "../ui/P";
import Span from "../ui/Span";
import Button from "../ui/Button";
import Heading from "../ui/Heading";
import { useEffect, useState } from "react";
import {
  RiArrowLeftLine as ArrowLeft,
  RiBuildingLine as Building2,
  RiFolderChartLine as FolderKanban,
  RiMenuLine as Menu,
  RiDeleteBin6Line as Trash2,
  RiSearchLine as Search,
  RiAddLine as Plus,
  RiGroupLine as Users,
  RiEditLine as Edit,
  RiFolderTransferLine as Move,
  RiArrowRightLine as ArrowRight,
} from "react-icons/ri";
import { useNavigate, useParams } from "react-router-dom";
import DashboardSidebar from "../components/DashboardSidebar";
import { useAuth } from "../features/authentication/authContext";
import WorkspaceAccess from "../features/workspaces/WorkspaceAccess";
import ProjectForm from "../features/workspaces/ProjectForm";
import MoveProjectModal from "../features/workspaces/MoveProjectModal";
import ProjectDetails from "../features/workspaces/ProjectDetails";
import DeleteItemModal from "../components/DeleteItemModal";
import { useUndoDeletion } from "../Context/undoDeletionContext";

function WorkspaceProjectsView({ user, workspaceKey }) {
  const navigate = useNavigate();
  const { getWorkspaceProjects, deleteProject } = useAuth();
  const { scheduleDeletion, pendingId, deletedProjectIds, deletionBusy } =
    useUndoDeletion();
  const [editing, setEditing] = useState(null);
  const [moving, setMoving] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [attempt, setAttempt] = useState(0);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("newest");
  const [showAccess, setShowAccess] = useState(false);
  const workspace = result?.workspace;
  const canEdit = !error && ["owner", "editor"].includes(workspace?.role);
  const projects = (result?.projects || []).filter(
    (project) =>
      pendingId !== `project:${project.id}` &&
      !deletedProjectIds.includes(`project:${project.id}`),
  );
  const visibleProjects = projects.filter((project) =>
    `${project.name} ${project.description || ""}`.toLowerCase().includes(query.trim().toLowerCase()),
  ).sort((a, b) => sort === "name"
    ? a.name.localeCompare(b.name)
    : (new Date(b.createdAt).getTime() || 0) - (new Date(a.createdAt).getTime() || 0));

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
        <Button variant="outline" size="sm"
          to="/settings/workspaces"
          className="mb-6 min-h-10"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          All workspaces
        </Button>
        <header className="flex flex-wrap items-start gap-3">
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
          <div className="min-w-0 flex-1">
            <div className="mb-3 flex items-center gap-2 text-xs font-semibold tracking-widest text-[#526159]">
              <Building2 size={16} aria-hidden="true" />
              WORKSPACE
              {workspace?.isPrimary && (
                <Span variant="accent" className="ml-2 rounded-md bg-[#edf3ef] px-3 py-1 text-xs tracking-normal">
                  Primary
                </Span>
              )}
            </div>
            <Heading
              as="h1"
              className="break-words text-3xl font-extrabold tracking-tight sm:text-4xl"
            >
              {error?.status === 404
                ? "Workspace not found"
                : workspace?.name || "Workspace projects"}
            </Heading>
            <P variant="unstyled" className="mt-3 text-sm leading-6 text-[#526159]">
              {workspace ? "Your projects and team, in one place." : "Loading workspace details..."}
            </P>
            {workspace && <div className="mt-3 flex flex-wrap gap-2 text-xs text-[#526159]"><Span className="rounded-md border border-[#dce6df] bg-white px-2 py-1 capitalize">{workspace.role}</Span><Span className="px-2 py-1">Private workspace</Span></div>}
          </div>
          {!error && workspace?.role === "owner" && <Button variant="outline" onClick={() => setShowAccess((open) => !open)} aria-expanded={showAccess} aria-controls="workspace-access-panel" className="w-full sm:w-auto"><Users size={17} aria-hidden="true" />Manage access</Button>}
        </header>

        {!error && workspace?.role === "owner" && showAccess && (
          <div id="workspace-access-panel"><WorkspaceAccess workspace={workspace} /></div>
        )}
        <section
          aria-labelledby="workspace-projects-heading"
          aria-busy={isLoading}
          className="mt-7"
        >
          <div className="flex items-center justify-between gap-3">
          <H2 variant="unstyled"
            id="workspace-projects-heading"
            className="text-lg font-bold tracking-tight"
          >
            Projects
            {result && !error && (
              <Span className="ml-2 text-sm font-medium text-[#526159]">
                ({projects.length})
              </Span>
            )}
          </H2>
          {canEdit && <Button onClick={() => setAdding(true)}><Plus size={17} aria-hidden="true" />New project</Button>}
          </div>
          {!isLoading && !error && projects.length > 0 && <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <div className="relative min-w-0 flex-1"><Search size={18} aria-hidden="true" className="pointer-events-none absolute left-3 top-3 text-[#718578]" /><input type="search" aria-label="Search projects" placeholder="Search projects..." value={query} onChange={(event) => setQuery(event.target.value)} className="min-h-11 w-full rounded-md border border-[#cfddd5] bg-white pl-10 pr-3 text-sm focus:outline-2 focus:outline-offset-2 focus:outline-[#294137]" /></div>
            <select aria-label="Sort projects" value={sort} onChange={(event) => setSort(event.target.value)} className="min-h-11 rounded-md border border-[#cfddd5] bg-white px-3 text-sm text-[#294137] focus:outline-2 focus:outline-offset-2 focus:outline-[#294137]"><option value="newest">Newest first</option><option value="name">Name A–Z</option></select>
          </div>}
          <div className="mt-4">
          {isLoading ? (
            <P variant="unstyled"
              role="status"
              className="rounded-md border border-[#CFDDD5] bg-white p-8 text-sm text-[#526159]"
            >
              Loading projects...
            </P>
          ) : error ? (
            <div className="rounded-md border border-[#CFDDD5] bg-white p-8">
              <P variant="unstyled" role="alert" className="text-sm text-red-700">
                {error.message}
              </P>
              {error.status !== 404 && (
                <Button variant="unstyled"
                  type="button"
                  onClick={() => {
                    setError(null);
                    setIsLoading(true);
                    setAttempt((value) => value + 1);
                  }}
                  className="mt-4 min-h-11 cursor-pointer rounded-md border border-[#CFDDD5] px-4 text-sm font-semibold text-[#294137] hover:bg-[#edf3ef] focus-visible:outline-2 focus-visible:outline-[#294137]"
                >
                  Try again
                </Button>
              )}
            </div>
          ) : visibleProjects.length ? (
            <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {visibleProjects.map((project) => (
                <li
                  key={project.id}
                  className="flex min-w-0 flex-col rounded-md border border-[#CFDDD5] bg-white p-5 transition-shadow hover:shadow-sm"
                >
                  <Span variant="accent" className="flex size-11 items-center justify-center rounded-md bg-[#edf3ef]">
                    <FolderKanban size={22} aria-hidden="true" />
                  </Span>
                  <h3 className="mt-4 break-words text-base font-semibold">
                    {project.name}
                  </h3>
                  {project.description && (
                    <P variant="unstyled" className="mt-2 line-clamp-2 whitespace-pre-wrap break-words text-sm leading-6 text-[#526159]">
                      {project.description}
                    </P>
                  )}
                  <P variant="unstyled" className="mt-auto pt-5 text-xs text-[#526159]">
                    Created{" "}
                    <time dateTime={project.createdAt}>
                      {new Date(project.createdAt).toLocaleDateString()}
                    </time>
                  </P>
                  <div className="mt-4 flex flex-wrap items-center gap-1.5 border-t border-[#e1e9e4] pt-3">
                  {canEdit ? (
                    <Button variant="primary" size="custom"
                      to={`/workspaces/${workspaceKey}/projects/${project.id}`}
                      className="mr-auto min-h-10 px-3 text-xs"
                    >
                      Open project<ArrowRight size={14} aria-hidden="true" />
                    </Button>
                  ) : (
                    <Button variant="unstyled"
                      type="button"
                      onClick={() => setViewing(project)}
                      className="min-h-10 cursor-pointer rounded-md border border-[#CFDDD5] px-3 text-xs font-semibold focus-visible:outline-2 focus-visible:outline-[#294137]"
                    >
                      View project
                    </Button>
                  )}
                  {canEdit && (
                    <>
                      <Button variant="ghost" size="icon" aria-label={`Edit ${project.name}`} title="Edit project"
                        type="button"
                        onClick={() => setEditing(project)}
                      >
                        <Edit size={17} aria-hidden="true" />
                      </Button>
                      <Button variant="ghost" size="icon" aria-label={`Move ${project.name}`} title="Move project"
                        type="button"
                        disabled={deletionBusy}
                        onClick={() => setMoving(project)}
                      >
                        <Move size={17} aria-hidden="true" />
                      </Button>
                      <Button variant="ghost" size="icon" aria-label={`Delete ${project.name}`} title="Delete project"
                        type="button"
                        disabled={deletionBusy}
                        onClick={() => setDeleting(project)}
                        className="text-red-700 focus-visible:outline-red-700"
                      >
                        <Trash2 size={17} aria-hidden="true" />
                      </Button>
                    </>
                  )}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex min-h-64 flex-col items-center justify-center rounded-md border border-[#CFDDD5] bg-white px-6 py-10 text-center">
              <FolderKanban
                size={30}
                className="mb-4 text-[#526159]"
                aria-hidden="true"
              />
              <h3 className="text-lg font-semibold">{projects.length ? "No matching projects" : "No projects yet"}</h3>
              <P variant="unstyled" className="mt-2 max-w-sm text-sm leading-6 text-[#526159]">
                {projects.length ? "Try another name or description." : canEdit ? "Create your first project to start organizing your test coverage." : "Projects will appear here when your team adds them."}
              </P>
              {projects.length > 0 && <Button variant="outline" size="sm" className="mt-4" onClick={() => setQuery("")}>Clear search</Button>}
            </div>
          )}
          </div>
        </section>
        {(adding || editing) && (
          <ProjectForm
            workspaceId={workspace.id}
            project={editing}
            onDismiss={() => {
              setAdding(false);
              setEditing(null);
            }}
            onSaved={(project) => {
              if (adding) {
                navigate(`/workspaces/${workspaceKey}/projects/${project.id}`);
                return;
              }
              setAdding(false);
              setEditing(null);
              setError(null);
              setAttempt((value) => value + 1);
            }}
          />
        )}
        {moving && (
          <MoveProjectModal
            project={moving}
            workspaceId={workspace.id}
            onDismiss={() => setMoving(null)}
          />
        )}
        {viewing && (
          <ProjectDetails
            project={viewing}
            onDismiss={() => setViewing(null)}
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
