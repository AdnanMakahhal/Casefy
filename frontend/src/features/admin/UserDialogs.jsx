import { useRef, useEffect, useState } from "react";
import { X } from "lucide-react";
import { adminRequest as request } from "./api";
import { roles, label, plans, number } from "./userOptions";

function Modal({ title, children, onClose, busy }) {
  const ref = useRef(null);
  useEffect(() => {
    const dialog = ref.current;
    const previousFocus = document.activeElement;
    dialog.showModal();
    return () => {
      dialog.close();
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className="admin-modal"
      aria-labelledby="admin-modal-title"
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onClose();
      }}
    >
      <header>
        <div>
          <span className="admin-eyebrow">ACCOUNT MANAGEMENT</span>
          <h2 id="admin-modal-title">{title}</h2>
        </div>
        <button
          className="admin-icon-button"
          aria-label="Close dialog"
          disabled={busy}
          onClick={onClose}
        >
          <X size={20} />
        </button>
      </header>
      {children}
    </dialog>
  );
}

export function UserEditor({
  account,
  onClose,
  onSaved,
  currentId,
  actorRole,
}) {
  const creating = !account.id;
  const [values, setValues] = useState({
    name: "",
    email: "",
    password: "",
    workspaceName: "",
    role: "student",
    plan: "free",
    seatLimit: "",
    projectLimit: "",
    monthlyCreditLimit: "",
    ...account,
    ...(account.basePlan ? { plan: account.basePlan } : {}),
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const field = (name) => ({
    value: values[name] ?? "",
    onChange: (event) => setValues({ ...values, [name]: event.target.value }),
  });
  async function save(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const body = Object.fromEntries(
      ["name", "email", "workspaceName", "role", "plan"].map((key) => [
        key,
        values[key],
      ]),
    );
    for (const key of ["seatLimit", "projectLimit", "monthlyCreditLimit"])
      body[key] =
        values[key] === "" || values[key] == null ? null : Number(values[key]);
    if (creating) body.password = values.password;
    try {
      await request(creating ? "/users" : `/users/${account.id}`, {
        method: creating ? "POST" : "PATCH",
        body: JSON.stringify(body),
      });
      onSaved(
        creating
          ? "Account created successfully."
          : "Account updated successfully.",
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal
      title={creating ? "Create a new user" : "Edit user"}
      onClose={onClose}
      busy={busy}
    >
      <form onSubmit={save}>
        <fieldset disabled={busy} className="admin-form-grid">
          <label>
            Full name
            <input
              {...field("name")}
              autoComplete="name"
              required
              maxLength={100}
              autoFocus
            />
          </label>
          <label>
            Email address
            <input
              {...field("email")}
              type="email"
              autoComplete="email"
              required
              maxLength={254}
            />
          </label>
          {creating && (
            <label className="admin-span">
              Password
              <input
                {...field("password")}
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
              />
              <small>At least 8 characters; maximum 72 bytes.</small>
            </label>
          )}
          <label className="admin-span">
            Workspace name
            <input {...field("workspaceName")} required maxLength={80} />
          </label>
          <label>
            Role
            <select {...field("role")} disabled={account.id === currentId}>
              {roles
                .filter(
                  (role) =>
                    actorRole === "admin" ||
                    !["admin", "manager"].includes(role),
                )
                .map((role) => (
                  <option key={role} value={role}>
                    {label(role)}
                  </option>
                ))}
            </select>
          </label>
          <label>
            Account plan
            <select {...field("plan")}>
              {plans.map((plan) => (
                <option key={plan} value={plan}>
                  {label(plan)}
                </option>
              ))}
            </select>
          </label>
          <p className="admin-form-note admin-span">
            Account plan and limits control app entitlements. Changes here do
            not update Stripe billing.
          </p>
          {[
            ["seatLimit", "Seats"],
            ["projectLimit", "Project limit"],
            ["monthlyCreditLimit", "Monthly credits"],
          ].map(([key, title]) => (
            <label key={key}>
              {title}
              <input
                {...field(key)}
                type="number"
                min="1"
                max="2147483647"
                step="1"
                placeholder="Plan default"
              />
            </label>
          ))}
          <p className="admin-form-note admin-span">
            Leave a limit blank to use the plan default.
          </p>
        </fieldset>
        {error && (
          <p role="alert" className="admin-error">
            {error}
          </p>
        )}
        <footer>
          <button
            type="button"
            className="admin-button"
            onClick={onClose}
            disabled={busy}
          >
            Cancel
          </button>
          <button className="admin-button primary" disabled={busy}>
            {busy ? "Saving…" : creating ? "Create user" : "Save changes"}
          </button>
        </footer>
      </form>
    </Modal>
  );
}

export function DeleteUser({ account, onClose, onSaved }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function remove() {
    setBusy(true);
    setError("");
    try {
      await request(`/users/${account.id}`, { method: "DELETE" });
      onSaved("Account deleted.");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal title="Delete this account?" onClose={onClose} busy={busy}>
      <p className="admin-delete-copy">
        This permanently deletes <strong>{account.email}</strong>, their
        workspaces, and all {number(account._count.projects)} projects. This
        action cannot be undone.
      </p>
      {error && (
        <p role="alert" className="admin-error">
          {error}
        </p>
      )}
      <footer>
        <button className="admin-button" disabled={busy} onClick={onClose}>
          Cancel
        </button>
        <button
          className="admin-button danger"
          disabled={busy}
          onClick={remove}
        >
          {busy ? "Deleting…" : "Delete account"}
        </button>
      </footer>
    </Modal>
  );
}

export function BlockUser({ account, onClose, onSaved }) {
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await request(`/users/${account.id}/block`, {
        method: "POST",
        body: JSON.stringify({ blocked: !account.blockedAt, reason }),
      });
      onSaved(
        account.blockedAt
          ? "User unblocked."
          : "User blocked. Existing sessions can no longer access the app.",
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal
      title={account.blockedAt ? "Unblock this user?" : "Block this user?"}
      onClose={onClose}
      busy={busy}
    >
      <form onSubmit={submit}>
        <p className="mb-5 text-sm leading-7 text-[#526159]">
          {account.email}.{" "}
          {account.blockedAt
            ? "The user will be able to sign in again."
            : "This prevents sign-in and stops access from existing sessions. Billing subscriptions are not canceled."}
        </p>
        {!account.blockedAt && (
          <label className="block text-sm font-medium">
            Reason
            <textarea
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              required
              maxLength={500}
              rows={3}
              disabled={busy}
              className="mt-2 w-full rounded-lg border border-[#CFDDD5] bg-white p-3 text-sm"
            />
          </label>
        )}
        {error && (
          <p role="alert" className="admin-error">
            {error}
          </p>
        )}
        <footer>
          <button
            type="button"
            className="admin-button"
            disabled={busy}
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className={`admin-button ${account.blockedAt ? "primary" : "danger"}`}
            disabled={busy}
          >
            {busy
              ? "Updating..."
              : account.blockedAt
                ? "Unblock user"
                : "Block user"}
          </button>
        </footer>
      </form>
    </Modal>
  );
}
