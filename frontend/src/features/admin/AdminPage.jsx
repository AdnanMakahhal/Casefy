import Heading from "../../ui/Heading";
import H2 from "../../ui/H2";
import P from "../../ui/P";
import Span from "../../ui/Span";
import Button from "../../ui/Button";
import { useAuth } from "../authentication/authContext";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { adminPath, adminViewFromPath, adminViews } from "./navigation";
import { useState, useEffect, useCallback } from "react";
import { adminRequest as request } from "./api";
import DashboardSidebar from "../../components/DashboardSidebar";
import {
  RiMenuLine as Menu,
  RiRefreshLine as RefreshCw,
  RiAddLine as Plus,
  RiCloseLine as X,
  RiGroupLine as Users,
  RiFolderChartLine as FolderKanban,
  RiClipboardLine as ClipboardList,
  RiPulseLine as Activity,
} from "react-icons/ri";
import StaffSections from "./StaffSections";
import OverviewCards from "./OverviewCards";
import AdminSkeleton from "../../ui/AdminSkeleton";
import { number, label, plans, roles } from "./userOptions";
import SelectMenu from "../../components/SelectMenu";
import UsersTable from "./UsersTable";
import { Loading, Pagination, SearchForm } from "./ui";
import { UserEditor, BlockUser, DeleteUser } from "./UserDialogs";

export default function Admin() {
  const { user, refreshUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const pathView = adminViewFromPath(location.pathname);
  const legacyView = params.get("view");
  const validLegacyView = ["refunds", "payments"].includes(legacyView) ? "support" : Object.hasOwn(adminViews, legacyView)
    ? legacyView
    : null;
  const view = validLegacyView || pathView || "overview";
  const isDataView = view === "overview" || view === "users";
  const search = params.get("search") || "";
  const role = params.get("role") || "";
  const plan = params.get("plan") || "";
  const access = params.get("access") || "";
  const sort = params.get("sort") || "newest";
  const page = Math.max(1, Number(params.get("page")) || 1);
  const [sidebar, setSidebar] = useState(false);
  const [overview, setOverview] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadedKey, setLoadedKey] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [revision, setRevision] = useState(0);
  const [staffLoading, setStaffLoading] = useState({ view: null, loading: false });
  const reportStaffLoading = useCallback((nextLoading) => setStaffLoading((current) => current.view === view && current.loading === nextLoading ? current : { view, loading: nextLoading }), [view]);
  const [editor, setEditor] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [blocking, setBlocking] = useState(null);
  const canEdit = ["admin", "manager"].includes(user.role);
  const requestKey = JSON.stringify({
    view,
    search,
    role,
    plan,
    access,
    sort,
    page,
  });
  const isFetching =
    isDataView && !error && (loading || loadedKey !== requestKey);
  const refreshing = isFetching || (!isDataView && staffLoading.view === view && staffLoading.loading);
  useEffect(() => {
    if (pathView && legacyView === null) return;
    const nextParams = new URLSearchParams(location.search);
    nextParams.delete("view");
    if (legacyView === "refunds") nextParams.set("category", "refund");
    if (legacyView === "payments") nextParams.set("category", "payment");
    const nextSearch = nextParams.toString();
    navigate(
      {
        pathname: adminPath(validLegacyView || pathView || "overview"),
        search: nextSearch ? `?${nextSearch}` : "",
      },
      { replace: true },
    );
  }, [legacyView, location.search, navigate, pathView, validLegacyView]);
  useEffect(() => {
    if (!sidebar) return;
    const onKey = (event) => {
      if (event.key === "Escape") setSidebar(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [sidebar]);
  useEffect(() => {
    if (!isDataView) return;
    let active = true;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const data = await request(
          view === "overview"
            ? ""
            : `/users?${new URLSearchParams({ search, role, plan, access, sort, page })}`,
        );
        if (active) {
          if (view === "overview") setOverview(data);
          else setResult(data);
          setLoadedKey(requestKey);
        }
      } catch (err) {
        if (active) setError(err.message);
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [
    view,
    search,
    role,
    plan,
    access,
    sort,
    page,
    revision,
    requestKey,
    isDataView,
  ]);
  function filter(changes) {
    setParams({
      search,
      role,
      plan,
      access,
      sort,
      page: "1",
      ...changes,
    });
  }
  function saved(message) {
    const updatedSelf = editor?.id === user.id;
    setEditor(null);
    setDeleting(null);
    setBlocking(null);
    setNotice(message);
    setRevision((value) => value + 1);
    if (updatedSelf)
      refreshUser().catch(() =>
        setNotice(`${message} Refresh your profile to see your changes.`),
      );
  }
  return (
    <div className="admin-shell lg:pl-64">
      <a href="#admin-content" className="admin-skip">
        Skip to dashboard
      </a>
      <DashboardSidebar
        user={user}
        isOpen={sidebar}
        onClose={() => setSidebar(false)}
      />
      <main
        id="admin-content"
        className="admin-main mx-auto max-w-[1440px] px-4 py-6 sm:px-8 lg:p-10"
      >
        <header className="admin-page-header">
          <div className="flex items-start gap-3">
            <Button variant="outline" size="custom"
              type="button"
              aria-label="Open navigation"
              aria-controls="dashboard-sidebar"
              aria-expanded={sidebar}
              onClick={() => setSidebar(true)}
              className="flex size-11 shrink-0 lg:hidden"
            >
              <Menu size={20} aria-hidden="true" />
            </Button>
            <div>
              <Heading as="h1">{adminViews[view].title}</Heading>
              <P variant="unstyled">{adminViews[view].description}</P>
            </div>
          </div>
          <div className="admin-header-actions">
            <Button variant="outline" size="md" type="submit"
              className="border px-5 py-2.5 whitespace-nowrap"
              disabled={refreshing}
              aria-busy={refreshing}
              onClick={() => setRevision((value) => value + 1)}
            >
              <RefreshCw size={16} className={refreshing ? "admin-spin motion-reduce:animate-none" : ""} />
              Refresh
            </Button>
            {canEdit && isDataView && (
              <Button variant="primary" size="md" type="submit"
                className="border px-5 py-2.5 whitespace-nowrap border-[#294137]"
                onClick={() => setEditor({})}
              >
                <Plus size={17} />
                Add user
              </Button>
            )}
          </div>
        </header>
        {notice && (
          <div role="status" className="admin-notice">
            {notice}
            <Button variant="unstyled" type="submit"
              aria-label="Dismiss notification"
              onClick={() => setNotice("")}
            >
              <X size={16} />
            </Button>
          </div>
        )}
        {isDataView && error && (
          <div className="admin-error" role="alert">
            {error}
            <Button variant="outline" size="md" type="submit"
              className="border px-5 py-2.5 whitespace-nowrap"
              onClick={() => setRevision((value) => value + 1)}
            >
              Retry
            </Button>
          </div>
        )}
        {!isDataView ? (
          <StaffSections key={view} view={view} revision={revision} onLoadingChange={reportStaffLoading} />
        ) : isFetching && view === "overview" ? (
          <AdminSkeleton view={view} />
        ) : (
          (!error || view === "users") && (
            <>
              {view === "overview" && overview && (
                <>
                  <section
                    aria-labelledby="admin-overview-heading"
                    className="admin-overview-section"
                  >
                    <div className="admin-overview-heading">
                      <H2 variant="unstyled" id="admin-overview-heading">
                        Administration overview
                      </H2>
                    </div>
                    <div
                      className="admin-stats"
                      aria-label="Workspace statistics"
                    >
                      {[
                        {
                          title: "Total users",
                          value: number(overview.totalUsers),
                          detail: `+${number(overview.newUsersToday)} today (UTC)`,
                          icon: Users,
                        },
                        {
                          title: "Active projects",
                          value: number(overview.totalProjects),
                          detail: "Total saved projects",
                          icon: FolderKanban,
                        },
                        {
                          title: "Test cases",
                          icon: ClipboardList,
                          value: number(overview.totalTestCases),
                          detail: "Generated test cases",
                        },
                        {
                          title: "Generation runs",
                          icon: Activity,
                          value: number(overview.totalGenerations),
                          detail: "Across staff accounts",
                        },
                      ].map(({ title, value, detail, icon: Icon }) => (
                        <article key={title} className="admin-stat">
                          <div>
                            <H2 variant="unstyled">{title}</H2>
                            {Icon && (
                              <Span className="admin-stat-icon">
                                <Icon size={18} aria-hidden="true" />
                              </Span>
                            )}
                          </div>
                          <strong>{value}</strong>
                          <P variant="unstyled">{detail}</P>
                        </article>
                      ))}
                    </div>
                  </section>
                  <OverviewCards overview={overview} />
                </>
              )}
              {view === "users" && (
                <section className="admin-panel admin-users-panel">
                  <header className="admin-panel-header">
                    <div>
                      <H2 variant="unstyled">
                        All users{" "}
                        <Span className="admin-count">
                          {number(result?.total)}
                        </Span>
                      </H2>
                      <P variant="unstyled">
                        {canEdit
                          ? "Manage account details, permissions, and limits."
                          : "Browse account details and permissions."}
                      </P>
                    </div>
                  </header>
                  <div className="staff-user-filters">
                    <SearchForm liveSearch value={search} placeholder="Search name, email, or workspace..." onSearch={(value) => {
                      setParams((current) => {
                        const next = new URLSearchParams(current);
                        if (value) next.set("search", value);
                        else next.delete("search");
                        next.set("page", "1");
                        return next;
                      }, { replace: true });
                    }} />
                    <div className="staff-filter-grid">
                      <div>
                        <P variant="unstyled">Role</P>
                        <SelectMenu
                          label="Filter users by role"
                          value={role}
                          onChange={(value) => filter({ role: value })}
                          options={[
                            {
                              value: "",
                              label: "All roles",
                              description: "Everyone in your workspace",
                            },
                            ...roles.map((value) => ({
                              value,
                              label: label(value),
                              description: ["admin", "manager"].includes(value)
                                ? "Staff account"
                                : "Customer account",
                            })),
                          ]}
                        />
                      </div>
                      <div>
                        <P variant="unstyled">Plan</P>
                        <SelectMenu
                          label="Filter users by plan"
                          value={plan}
                          onChange={(value) => filter({ plan: value })}
                          options={[
                            {
                              value: "",
                              label: "All plans",
                              description: "Every subscription tier",
                            },
                            ...plans.map((value) => ({
                              value,
                              label: label(value),
                              description:
                                value === "ultra"
                                  ? "Unlimited seats, projects, and credits"
                                  : label(value) + " accounts",
                            })),
                          ]}
                        />
                      </div>
                      <div>
                        <P variant="unstyled">Account access</P>
                        <SelectMenu
                          label="Filter account access"
                          value={access}
                          onChange={(value) => filter({ access: value })}
                          options={[
                            {
                              value: "",
                              label: "Any access",
                              description: "Active and blocked accounts",
                            },
                            {
                              value: "active",
                              label: "Active",
                              description: "Can sign in to Casefy",
                            },
                            {
                              value: "blocked",
                              label: "Blocked",
                              description: "Access has been suspended",
                            },
                          ]}
                        />
                      </div>
                      <div>
                        <P variant="unstyled">Sort by</P>
                        <SelectMenu
                          label="Sort users"
                          value={sort}
                          onChange={(value) => filter({ sort: value })}
                          options={[
                            { value: "newest", label: "Newest first" },
                            { value: "oldest", label: "Oldest first" },
                            { value: "name", label: "Name A to Z" },
                          ]}
                        />
                      </div>
                    </div>
                    {(search ||
                      role ||
                      plan ||
                      access ||
                      sort !== "newest") && (
                      <div className="staff-active-filters">
                        <Span variant="muted" className="text-xs">
                          Active filters
                        </Span>
                        {[
                          ["search", search],
                          ["role", role],
                          ["plan", plan],
                          ["access", access],
                        ]
                          .filter(([, value]) => value)
                          .map(([key, value]) => (
                            <Button variant="unstyled" type="submit"
                              key={key}
                              className="staff-filter-chip"
                              aria-label={`Clear ${key} filter`}
                              onClick={() => filter({ [key]: "" })}
                            >
                              {label(value)}
                              <X size={12} />
                            </Button>
                          ))}
                        <Button variant="unstyled" type="submit"
                          className="admin-text-button"
                          onClick={() =>
                            filter({
                              search: "",
                              role: "",
                              plan: "",
                              access: "",
                              sort: "newest",
                            })
                          }
                        >
                          Reset all
                        </Button>
                      </div>
                    )}
                  </div>
                  {isFetching ? <Loading /> : !error && result && <>
                  <UsersTable
                    users={result.users}
                    actorRole={user.role}
                    currentId={user.id}
                    onEdit={setEditor}
                    onDelete={setDeleting}
                    onBlock={setBlocking}
                  />
                  <Pagination
                    data={{ ...result, page }}
                    label="users"
                    onChange={(next) => filter({ page: String(next) })}
                  />
                  </>}
                </section>
              )}
            </>
          )
        )}
      </main>
      {editor && (
        <UserEditor
          account={editor}
          onClose={() => setEditor(null)}
          onSaved={saved}
          currentId={user.id}
          actorRole={user.role}
        />
      )}
      {blocking && (
        <BlockUser
          account={blocking}
          onClose={() => setBlocking(null)}
          onSaved={saved}
        />
      )}
      {deleting && (
        <DeleteUser
          account={deleting}
          onClose={() => setDeleting(null)}
          onSaved={saved}
        />
      )}
    </div>
  );
}
