import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Activity, ArrowUpRight, ChevronLeft, ChevronRight, ClipboardList, FolderKanban, Menu, Pencil, Plus, RefreshCw, Search, ShieldBan, ShieldCheck, Trash2, Users, X } from "lucide-react";
import { useAuth } from "../features/authentication/authContext";
import { apiRequest, tokenKey } from "../features/authentication/api";
import DashboardSidebar from "../components/DashboardSidebar";
import AdminSkeleton from "../components/AdminSkeleton";
import SelectMenu from "../components/SelectMenu";
import { adminViews } from "../features/admin/navigation";
import StaffSections from "../features/admin/StaffSections";
import TestGenerator from "./TestGenerator";
import "./Admin.css";

const roles = ["admin", "manager", "qa_engineer", "student", "employee", "developer"];
const plans = ["free", "plus", "pro", "enterprise"];
const label = (value) => value.replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());
const number = (value) => value?.toLocaleString("en-US") ?? "—";
const date = (value) => new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
const request = (path, options) => apiRequest(`/admin${path}`, { token: sessionStorage.getItem(tokenKey), ...options });

function Modal({ title, children, onClose, busy }) {
  const ref = useRef(null);
  useEffect(() => {
    const dialog = ref.current;
    const previousFocus = document.activeElement;
    dialog.showModal();
    return () => { dialog.close(); if (previousFocus?.isConnected) previousFocus.focus(); };
  }, []);
  return <dialog ref={ref} className="admin-modal" aria-labelledby="admin-modal-title" onCancel={(event) => { event.preventDefault(); if (!busy) onClose(); }}>
    <header><div><span className="admin-eyebrow">ACCOUNT MANAGEMENT</span><h2 id="admin-modal-title">{title}</h2></div><button className="admin-icon-button" aria-label="Close dialog" disabled={busy} onClick={onClose}><X size={20} /></button></header>
    {children}
  </dialog>;
}

function UserEditor({ account, onClose, onSaved, currentId, actorRole }) {
  const creating = !account.id;
  const [values, setValues] = useState({ name: "", email: "", password: "", workspaceName: "", role: "student", plan: "free", seatLimit: "", projectLimit: "", monthlyCreditLimit: "", ...account, ...(account.basePlan ? { plan: account.basePlan } : {}) });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const field = (name) => ({ value: values[name] ?? "", onChange: (event) => setValues({ ...values, [name]: event.target.value }) });
  async function save(event) {
    event.preventDefault(); setBusy(true); setError("");
    const body = Object.fromEntries(["name", "email", "workspaceName", "role", "plan"].map((key) => [key, values[key]]));
    for (const key of ["seatLimit", "projectLimit", "monthlyCreditLimit"]) body[key] = values[key] === "" || values[key] == null ? null : Number(values[key]);
    if (creating) body.password = values.password;
    try { await request(creating ? "/users" : `/users/${account.id}`, { method: creating ? "POST" : "PATCH", body: JSON.stringify(body) }); onSaved(creating ? "Account created successfully." : "Account updated successfully."); }
    catch (err) { setError(err.message); } finally { setBusy(false); }
  }
  return <Modal title={creating ? "Create a new user" : "Edit user"} onClose={onClose} busy={busy}>
    <form onSubmit={save}><fieldset disabled={busy} className="admin-form-grid">
      <label>Full name<input {...field("name")} autoComplete="name" required maxLength={100} autoFocus /></label>
      <label>Email address<input {...field("email")} type="email" autoComplete="email" required maxLength={254} /></label>
      {creating && <label className="admin-span">Password<input {...field("password")} type="password" autoComplete="new-password" required minLength={8} /><small>At least 8 characters; maximum 72 bytes.</small></label>}
      <label className="admin-span">Workspace name<input {...field("workspaceName")} required maxLength={80} /></label>
      <label>Role<select {...field("role")} disabled={account.id === currentId}>{roles.filter((role) => actorRole === "admin" || !["admin", "manager"].includes(role)).map((role) => <option key={role} value={role}>{label(role)}</option>)}</select></label>
      <label>Account plan<select {...field("plan")}>{plans.map((plan) => <option key={plan} value={plan}>{label(plan)}</option>)}</select></label>
      <p className="admin-form-note admin-span">Account plan and limits control app entitlements. Changes here do not update Stripe billing.</p>
      {[["seatLimit", "Seats"], ["projectLimit", "Project limit"], ["monthlyCreditLimit", "Monthly credits"]].map(([key, title]) => <label key={key}>{title}<input {...field(key)} type="number" min="1" max="2147483647" step="1" placeholder="Plan default" /></label>)}
      <p className="admin-form-note admin-span">Leave a limit blank to use the plan default.</p>
    </fieldset>
    {error && <p role="alert" className="admin-error">{error}</p>}
    <footer><button type="button" className="admin-button" onClick={onClose} disabled={busy}>Cancel</button><button className="admin-button primary" disabled={busy}>{busy ? "Saving…" : creating ? "Create user" : "Save changes"}</button></footer></form>
  </Modal>;
}

function DeleteUser({ account, onClose, onSaved }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function remove() {
    setBusy(true); setError("");
    try { await request(`/users/${account.id}`, { method: "DELETE" }); onSaved("Account deleted."); }
    catch (err) { setError(err.message); } finally { setBusy(false); }
  }
  return <Modal title="Delete this account?" onClose={onClose} busy={busy}><p className="admin-delete-copy">This permanently deletes <strong>{account.email}</strong>, their workspaces, and all {number(account._count.projects)} projects. This action cannot be undone.</p>{error && <p role="alert" className="admin-error">{error}</p>}<footer><button className="admin-button" disabled={busy} onClick={onClose}>Cancel</button><button className="admin-button danger" disabled={busy} onClick={remove}>{busy ? "Deleting…" : "Delete account"}</button></footer></Modal>;
}

function BlockUser({ account, onClose, onSaved }) {
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(event) {
    event.preventDefault(); setBusy(true); setError("");
    try { await request(`/users/${account.id}/block`, { method: "POST", body: JSON.stringify({ blocked: !account.blockedAt, reason }) }); onSaved(account.blockedAt ? "User unblocked." : "User blocked. Existing sessions can no longer access the app."); }
    catch (err) { setError(err.message); } finally { setBusy(false); }
  }
  return <Modal title={account.blockedAt ? "Unblock this user?" : "Block this user?"} onClose={onClose} busy={busy}><form onSubmit={submit}><p className="mb-5 text-sm leading-7 text-[#526159]">{account.email}. {account.blockedAt ? "The user will be able to sign in again." : "This prevents sign-in and stops access from existing sessions. Billing subscriptions are not canceled."}</p>{!account.blockedAt && <label className="block text-sm font-medium">Reason<textarea value={reason} onChange={(event) => setReason(event.target.value)} required maxLength={500} rows={3} disabled={busy} className="mt-2 w-full rounded-lg border border-[#CFDDD5] bg-white p-3 text-sm" /></label>}{error && <p role="alert" className="admin-error">{error}</p>}<footer><button type="button" className="admin-button" disabled={busy} onClick={onClose}>Cancel</button><button className={`admin-button ${account.blockedAt ? "primary" : "danger"}`} disabled={busy}>{busy ? "Updating..." : account.blockedAt ? "Unblock user" : "Block user"}</button></footer></form></Modal>;
}

function UsersTable({ users, currentId, actorRole, onEdit, onDelete, onBlock }) {
  return <div className="admin-table-scroll"><table className="admin-table"><thead><tr><th>User</th><th>Role</th><th>Plan</th><th>Access</th><th>Projects</th><th>Joined</th><th>Actions</th></tr></thead><tbody>
    {users.map((account) => {
      const editable = actorRole === "admin" || !["admin", "manager"].includes(account.role);
      return <tr key={account.id}><td><div className="admin-person"><span className="admin-avatar">{account.name.slice(0, 1).toUpperCase()}</span><div><strong>{account.name}{account.id === currentId && <span className="admin-you">You</span>}</strong><span>{account.email}</span></div></div></td><td><span className={`admin-role ${account.role === "admin" ? "is-admin" : ""}`}>{label(account.role)}</span></td><td><span className={`admin-plan plan-${account.plan}`}><i />{label(account.plan)}</span></td><td><span title={account.blockedReason || "Can sign in"} className={`staff-badge ${account.blockedAt ? "negative" : "positive"}`}>{account.blockedAt ? "Blocked" : "Active"}</span></td><td>{number(account._count.projects)}{account.projectLimit && <span className="admin-muted"> / {number(account.projectLimit)}</span>}</td><td className="admin-date">{date(account.createdAt)}</td><td><div className="admin-row-actions"><button className="admin-icon-button" disabled={!editable} aria-label={`Edit ${account.email}`} onClick={() => onEdit(account)}><Pencil size={16} /></button><button className="admin-icon-button" disabled={!editable || account.id === currentId} title={account.blockedAt ? "Unblock user" : "Block user"} aria-label={`${account.blockedAt ? "Unblock" : "Block"} ${account.email}`} onClick={() => onBlock(account)}>{account.blockedAt ? <ShieldCheck size={17} /> : <ShieldBan size={17} />}</button><button className="admin-icon-button delete" aria-label={`Delete ${account.email}`} disabled={!editable || account.id === currentId} onClick={() => onDelete(account)}><Trash2 size={16} /></button></div></td></tr>;
    })}
    {!users.length && <tr><td colSpan={7} className="admin-empty"><Users size={28} /><strong>No users found</strong><span>Try a different search or filter.</span></td></tr>}
  </tbody></table></div>;
}

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
    const onKey = (event) => { if (event.key === "Escape") setSidebar(false); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [sidebar]);
  useEffect(() => {
    if (!isDataView) return;
    let active = true;
    async function load() {
      setLoading(true); setError("");
      try {
        const data = await request(view === "overview" ? "" : `/users?${new URLSearchParams({ search, role, plan, access, sort, page })}`);
        if (active) { if (view === "overview") setOverview(data); else setResult(data); setLoadedKey(requestKey); }
      } catch (err) { if (active) setError(err.message); }
      finally { if (active) setLoading(false); }
    }
    load(); return () => { active = false; };
  }, [view, search, role, plan, access, sort, page, revision, requestKey, isDataView]);
  function filter(changes) { setParams({ view: "users", search, role, plan, access, sort, page: "1", ...changes }); }
  function saved(message) {
    const updatedSelf = editor?.id === user.id;
    setEditor(null); setDeleting(null); setBlocking(null); setNotice(message); setRevision((value) => value + 1);
    if (updatedSelf) refreshUser().catch(() => setNotice(`${message} Refresh your profile to see your changes.`));
  }
  function navigate(next) { setParams(next === "users" ? { view: "users" } : {}); setSidebar(false); }
  if (view === "generator") return <TestGenerator user={user} />;
  return <div className="admin-shell lg:pl-64">
    <a href="#admin-content" className="admin-skip">Skip to dashboard</a>
    <DashboardSidebar user={user} isOpen={sidebar} onClose={() => setSidebar(false)} />
    <main id="admin-content" className="admin-main mx-auto max-w-[1440px] px-4 py-6 sm:px-8 lg:p-10">
      <header className="admin-page-header">
        <div className="flex items-start gap-3">
          <button type="button" aria-label="Open navigation" aria-controls="dashboard-sidebar" aria-expanded={sidebar} onClick={() => setSidebar(true)} className="flex size-11 shrink-0 items-center justify-center rounded-lg border border-[#CFDDD5] bg-white text-[#294137] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#294137] lg:hidden"><Menu size={20} aria-hidden="true" /></button>
          <div><h1>{adminViews[view].title}</h1><p>{adminViews[view].description}</p></div>
        </div>
        <div className="admin-header-actions"><button className="admin-button" disabled={isFetching} onClick={() => setRevision((value) => value + 1)}><RefreshCw size={16} className={isFetching ? "admin-spin" : ""} />Refresh</button>{canEdit && isDataView && <button className="admin-button primary" onClick={() => setEditor({})}><Plus size={17} />Add user</button>}</div>
      </header>
      {notice && <div role="status" className="admin-notice">{notice}<button aria-label="Dismiss notification" onClick={() => setNotice("")}><X size={16} /></button></div>}
      {isDataView && error && <div className="admin-error" role="alert">{error}<button className="admin-button" onClick={() => setRevision((value) => value + 1)}>Retry</button></div>}
      {!isDataView ? <StaffSections key={view} view={view} revision={revision} /> : isFetching ? <AdminSkeleton view={view} /> : !error && <>
        {view === "overview" && overview && <>
          <section aria-labelledby="admin-overview-heading" className="admin-overview-section">
          <div className="admin-overview-heading"><h2 id="admin-overview-heading">Administration overview</h2></div>
          <div className="admin-stats" aria-label="Workspace statistics">{[
            { title: "Total users", value: number(overview.totalUsers), detail: `+${number(overview.newUsersToday)} today (UTC)`, icon: Users },
            { title: "Active projects", value: number(overview.totalProjects), detail: "Total saved projects", icon: FolderKanban },
            { title: "Test cases", icon: ClipboardList, value: number(overview.totalTestCases), detail: "Generated test cases" },
            { title: "Generation runs", icon: Activity, value: number(overview.totalGenerations), detail: "Across staff accounts" },
          ].map(({ title, value, detail, icon: Icon }) => <article key={title} className="admin-stat"><div><h2>{title}</h2>{Icon && <span className="admin-stat-icon"><Icon size={18} aria-hidden="true" /></span>}</div><strong>{value}</strong><p>{detail}</p></article>)}</div></section>
          <div className="admin-overview-grid"><section className="admin-panel"><header className="admin-panel-header"><div><h2>Recent users</h2><p>The latest accounts to join Casefy</p></div><button className="admin-text-button" onClick={() => navigate("users")}>View all <ArrowUpRight size={15} /></button></header><div className="admin-recent-list">{overview.recentUsers.map((account) => <div key={account.id} className="admin-recent-user"><span className="admin-avatar">{account.name.slice(0, 1).toUpperCase()}</span><div><strong>{account.name}</strong><span>{account.email}</span></div><span className={`admin-plan plan-${account.plan}`}><i />{label(account.plan)}</span></div>)}{!overview.recentUsers.length && <p className="admin-empty">No accounts yet.</p>}</div></section>
          <section className="admin-panel"><header className="admin-panel-header"><div><h2>Plan distribution</h2><p>Accounts by current plan</p></div></header><div className="admin-plan-chart">{plans.map((planName) => { const count = overview.planCounts.find((item) => item.plan === planName)?._count._all || 0; return <div key={planName}><div><span className={`admin-plan plan-${planName}`}><i />{label(planName)}</span><strong>{number(count)}</strong></div><div className="admin-bar"><span style={{ width: `${overview.totalUsers ? count / overview.totalUsers * 100 : 0}%` }} /></div></div>; })}</div><p className="admin-chart-footer">{number(overview.totalUsers)} total accounts across all plans</p></section></div>
        </>}
        {view === "users" && result && <section className="admin-panel admin-users-panel"><header className="admin-panel-header"><div><h2>All users <span className="admin-count">{number(result.total)}</span></h2><p>{canEdit ? "Manage account details, permissions, and limits." : "Browse account details and permissions."}</p></div></header><div className="staff-user-filters">
  <form className="staff-user-search" onSubmit={(event) => { event.preventDefault(); filter({ search: event.currentTarget.elements.search.value }); }}><Search size={18} /><input key={search} name="search" aria-label="Search users" placeholder="Search name, email, or workspace..." defaultValue={search} /><button className="admin-button">Search</button></form>
  <div className="staff-filter-grid">
    <div><p>Role</p><SelectMenu label="Filter users by role" value={role} onChange={(value) => filter({ role: value })} options={[{ value: "", label: "All roles", description: "Everyone in your workspace" }, ...roles.map((value) => ({ value, label: label(value), description: ["admin", "manager"].includes(value) ? "Staff account" : "Customer account" }))]} /></div>
    <div><p>Plan</p><SelectMenu label="Filter users by plan" value={plan} onChange={(value) => filter({ plan: value })} options={[{ value: "", label: "All plans", description: "Every subscription tier" }, ...plans.map((value) => ({ value, label: label(value), description: value === "enterprise" ? "Custom team limits" : label(value) + " accounts" }))]} /></div>
    <div><p>Account access</p><SelectMenu label="Filter account access" value={access} onChange={(value) => filter({ access: value })} options={[{ value: "", label: "Any access", description: "Active and blocked accounts" }, { value: "active", label: "Active", description: "Can sign in to Casefy" }, { value: "blocked", label: "Blocked", description: "Access has been suspended" }]} /></div>
    <div><p>Sort by</p><SelectMenu label="Sort users" value={sort} onChange={(value) => filter({ sort: value })} options={[{ value: "newest", label: "Newest first" }, { value: "oldest", label: "Oldest first" }, { value: "name", label: "Name A to Z" }]} /></div>
  </div>
  {(search || role || plan || access || sort !== "newest") && <div className="staff-active-filters"><span className="text-xs text-[#718578]">Active filters</span>{[["search", search], ["role", role], ["plan", plan], ["access", access]].filter(([, value]) => value).map(([key, value]) => <button key={key} className="staff-filter-chip" aria-label={`Clear ${key} filter`} onClick={() => filter({ [key]: "" })}>{label(value)}<X size={12} /></button>)}<button className="admin-text-button" onClick={() => filter({ search: "", role: "", plan: "", access: "", sort: "newest" })}>Reset all</button></div>}
</div><UsersTable users={result.users} actorRole={user.role} currentId={user.id} onEdit={setEditor} onDelete={setDeleting} onBlock={setBlocking} /><footer className="admin-pagination"><span>{result.total ? `${(page - 1) * result.pageSize + 1}–${Math.min(page * result.pageSize, result.total)}` : "0"} of {number(result.total)} users</span><div><button className="admin-icon-button" aria-label="Previous page" disabled={page <= 1} onClick={() => filter({ page: String(page - 1) })}><ChevronLeft size={18} /></button><span>Page {page}</span><button className="admin-icon-button" aria-label="Next page" disabled={page * result.pageSize >= result.total} onClick={() => filter({ page: String(page + 1) })}><ChevronRight size={18} /></button></div></footer></section>}
      </>}
    </main>
    {editor && <UserEditor account={editor} onClose={() => setEditor(null)} onSaved={saved} currentId={user.id} actorRole={user.role} />}
    {blocking && <BlockUser account={blocking} onClose={() => setBlocking(null)} onSaved={saved} />}
    {deleting && <DeleteUser account={deleting} onClose={() => setDeleting(null)} onSaved={saved} />}
  </div>;
}
