import { useAuth } from "../features/authentication/authContext";
import { useSearchParams } from "react-router-dom";
import { adminViews } from "../features/admin/navigation";
import { useState, useEffect } from "react";
import { adminRequest as request } from "../features/admin/api";
import TestGenerator from "./TestGenerator";
import DashboardSidebar from "../components/DashboardSidebar";
import {
  Menu,
  RefreshCw,
  Plus,
  X,
  Users,
  FolderKanban,
  ClipboardList,
  Activity,
  ArrowUpRight,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import StaffSections from "../features/admin/StaffSections";
import AdminSkeleton from "../components/AdminSkeleton";
import { number, label, plans, roles } from "../features/admin/userOptions";
import SelectMenu from "../components/SelectMenu";
import UsersTable from "../features/admin/UsersTable";
import { UserEditor, BlockUser, DeleteUser } from "../features/admin/UserDialogs";
import "../features/admin/Admin.css";

export default function Admin() {
  const { user, refreshUser } = useAuth();
  const [params, setParams] = useSearchParams();
  const view = Object.hasOwn(adminViews, params.get("view")) ? params.get("view") : "overview";
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
  const [editor, setEditor] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [blocking, setBlocking] = useState(null);
  const canEdit = ["admin", "manager"].includes(user.role);
  const requestKey = JSON.stringify({ view, search, role, plan, access, sort, page });
  const isFetching = isDataView && !error && (loading || loadedKey !== requestKey);
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
  }, [view, search, role, plan, access, sort, page, revision, requestKey, isDataView]);
  function filter(changes) {
    setParams({ view: "users", search, role, plan, access, sort, page: "1", ...changes });
  }
  function saved(message) {
    const updatedSelf = editor?.id === user.id;
    setEditor(null);
    setDeleting(null);
    setBlocking(null);
    setNotice(message);
    setRevision((value) => value + 1);
    if (updatedSelf)
      refreshUser().catch(() => setNotice(`${message} Refresh your profile to see your changes.`));
  }
  function navigate(next) {
    setParams(next === "users" ? { view: "users" } : {});
    setSidebar(false);
  }
  if (view === "generator") return <TestGenerator user={user} />;
  return (
    <div className="admin-shell lg:pl-64">
      <a href="#admin-content" className="admin-skip">
        Skip to dashboard
      </a>
      <DashboardSidebar user={user} isOpen={sidebar} onClose={() => setSidebar(false)} />
      <main
        id="admin-content"
        className="admin-main mx-auto max-w-[1440px] px-4 py-6 sm:px-8 lg:p-10"
      >
        <header className="admin-page-header">
          <div className="flex items-start gap-3">
            <button
              type="button"
              aria-label="Open navigation"
              aria-controls="dashboard-sidebar"
              aria-expanded={sidebar}
              onClick={() => setSidebar(true)}
              className="flex size-11 shrink-0 items-center justify-center rounded-lg border border-[#CFDDD5] bg-white text-[#294137] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#294137] lg:hidden"
            >
              <Menu size={20} aria-hidden="true" />
            </button>
            <div>
              <h1>{adminViews[view].title}</h1>
              <p>{adminViews[view].description}</p>
            </div>
          </div>
          <div className="admin-header-actions">
            <button
              className="admin-button"
              disabled={isFetching}
              onClick={() => setRevision((value) => value + 1)}
            >
              <RefreshCw size={16} className={isFetching ? "admin-spin" : ""} />
              Refresh
            </button>
            {canEdit && isDataView && (
              <button className="admin-button primary" onClick={() => setEditor({})}>
                <Plus size={17} />
                Add user
              </button>
            )}
          </div>
        </header>
        {notice && (
          <div role="status" className="admin-notice">
            {notice}
            <button aria-label="Dismiss notification" onClick={() => setNotice("")}>
              <X size={16} />
            </button>
          </div>
        )}
        {isDataView && error && (
          <div className="admin-error" role="alert">
            {error}
            <button className="admin-button" onClick={() => setRevision((value) => value + 1)}>
              Retry
            </button>
          </div>
        )}
        {!isDataView ? (
          <StaffSections key={view} view={view} revision={revision} />
        ) : isFetching ? (
          <AdminSkeleton view={view} />
        ) : (
          !error && (
            <>
              {view === "overview" && overview && (
                <>
                  <section
                    aria-labelledby="admin-overview-heading"
                    className="admin-overview-section"
                  >
                    <div className="admin-overview-heading">
                      <h2 id="admin-overview-heading">Administration overview</h2>
                    </div>
                    <div className="admin-stats" aria-label="Workspace statistics">
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
                            <h2>{title}</h2>
                            {Icon && (
                              <span className="admin-stat-icon">
                                <Icon size={18} aria-hidden="true" />
                              </span>
                            )}
                          </div>
                          <strong>{value}</strong>
                          <p>{detail}</p>
                        </article>
                      ))}
                    </div>
                  </section>
                  <div className="admin-overview-grid">
                    <section className="admin-panel">
                      <header className="admin-panel-header">
                        <div>
                          <h2>Recent users</h2>
                          <p>The latest accounts to join Casefy</p>
                        </div>
                        <button className="admin-text-button" onClick={() => navigate("users")}>
                          View all <ArrowUpRight size={15} />
                        </button>
                      </header>
                      <div className="admin-recent-list">
                        {overview.recentUsers.map((account) => (
                          <div key={account.id} className="admin-recent-user">
                            <span className="admin-avatar">
                              {account.name.slice(0, 1).toUpperCase()}
                            </span>
                            <div>
                              <strong>{account.name}</strong>
                              <span>{account.email}</span>
                            </div>
                            <span className={`admin-plan plan-${account.plan}`}>
                              <i />
                              {label(account.plan)}
                            </span>
                          </div>
                        ))}
                        {!overview.recentUsers.length && (
                          <p className="admin-empty">No accounts yet.</p>
                        )}
                      </div>
                    </section>
                    <section className="admin-panel">
                      <header className="admin-panel-header">
                        <div>
                          <h2>Plan distribution</h2>
                          <p>Accounts by current plan</p>
                        </div>
                      </header>
                      <div className="admin-plan-chart">
                        {plans.map((planName) => {
                          const count =
                            overview.planCounts.find((item) => item.plan === planName)?._count
                              ._all || 0;
                          return (
                            <div key={planName}>
                              <div>
                                <span className={`admin-plan plan-${planName}`}>
                                  <i />
                                  {label(planName)}
                                </span>
                                <strong>{number(count)}</strong>
                              </div>
                              <div className="admin-bar">
                                <span
                                  style={{
                                    width: `${overview.totalUsers ? (count / overview.totalUsers) * 100 : 0}%`,
                                  }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <p className="admin-chart-footer">
                        {number(overview.totalUsers)} total accounts across all plans
                      </p>
                    </section>
                  </div>
                </>
              )}
              {view === "users" && result && (
                <section className="admin-panel admin-users-panel">
                  <header className="admin-panel-header">
                    <div>
                      <h2>
                        All users <span className="admin-count">{number(result.total)}</span>
                      </h2>
                      <p>
                        {canEdit
                          ? "Manage account details, permissions, and limits."
                          : "Browse account details and permissions."}
                      </p>
                    </div>
                  </header>
                  <div className="staff-user-filters">
                    <form
                      className="staff-user-search"
                      onSubmit={(event) => {
                        event.preventDefault();
                        filter({ search: event.currentTarget.elements.search.value });
                      }}
                    >
                      <Search size={18} />
                      <input
                        key={search}
                        name="search"
                        aria-label="Search users"
                        placeholder="Search name, email, or workspace..."
                        defaultValue={search}
                      />
                      <button className="admin-button">Search</button>
                    </form>
                    <div className="staff-filter-grid">
                      <div>
                        <p>Role</p>
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
                        <p>Plan</p>
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
                                value === "enterprise"
                                  ? "Custom team limits"
                                  : label(value) + " accounts",
                            })),
                          ]}
                        />
                      </div>
                      <div>
                        <p>Account access</p>
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
                        <p>Sort by</p>
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
                    {(search || role || plan || access || sort !== "newest") && (
                      <div className="staff-active-filters">
                        <span className="text-xs text-[#718578]">Active filters</span>
                        {[
                          ["search", search],
                          ["role", role],
                          ["plan", plan],
                          ["access", access],
                        ]
                          .filter(([, value]) => value)
                          .map(([key, value]) => (
                            <button
                              key={key}
                              className="staff-filter-chip"
                              aria-label={`Clear ${key} filter`}
                              onClick={() => filter({ [key]: "" })}
                            >
                              {label(value)}
                              <X size={12} />
                            </button>
                          ))}
                        <button
                          className="admin-text-button"
                          onClick={() =>
                            filter({ search: "", role: "", plan: "", access: "", sort: "newest" })
                          }
                        >
                          Reset all
                        </button>
                      </div>
                    )}
                  </div>
                  <UsersTable
                    users={result.users}
                    actorRole={user.role}
                    currentId={user.id}
                    onEdit={setEditor}
                    onDelete={setDeleting}
                    onBlock={setBlocking}
                  />
                  <footer className="admin-pagination">
                    <span>
                      {result.total
                        ? `${(page - 1) * result.pageSize + 1}–${Math.min(page * result.pageSize, result.total)}`
                        : "0"}{" "}
                      of {number(result.total)} users
                    </span>
                    <div>
                      <button
                        className="admin-icon-button"
                        aria-label="Previous page"
                        disabled={page <= 1}
                        onClick={() => filter({ page: String(page - 1) })}
                      >
                        <ChevronLeft size={18} />
                      </button>
                      <span>Page {page}</span>
                      <button
                        className="admin-icon-button"
                        aria-label="Next page"
                        disabled={page * result.pageSize >= result.total}
                        onClick={() => filter({ page: String(page + 1) })}
                      >
                        <ChevronRight size={18} />
                      </button>
                    </div>
                  </footer>
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
        <BlockUser account={blocking} onClose={() => setBlocking(null)} onSaved={saved} />
      )}
      {deleting && (
        <DeleteUser account={deleting} onClose={() => setDeleting(null)} onSaved={saved} />
      )}
    </div>
  );
}
