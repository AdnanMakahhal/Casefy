import { useState } from "react";
import AccountModal from "./AccountModal";
import { useAuth } from "../features/authentication/authContext";
import { roleLabels, signupRoles } from "../features/authentication/roles";

const inputClass =
  "mt-2 min-h-12 w-full rounded-lg border border-[#CFDDD5] bg-white px-3 py-2 text-base text-[#102019] focus:outline-2 focus:outline-offset-2 focus:outline-[#294137]";

export default function EditAccount({
  user,
  onDismiss,
  onSaved,
  inline = false,
}) {
  const { updateProfile } = useAuth();
  const [details, setDetails] = useState({
    name: user.name,
    email: user.email,
    role: user.role,
    workspaceName: user.workspaceName || "",
    currentPassword: "",
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const privileged = ["admin", "manager"].includes(user.role);
  const emailChanged = details.email.trim().toLowerCase() !== user.email;
  const change = (event) => {
    setDetails((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
    setError("");
  };

  async function save(event) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const data = { name: details.name, email: details.email };
      if (!privileged) data.role = details.role;
      if (!privileged || details.workspaceName.trim())
        data.workspaceName = details.workspaceName;
      if (emailChanged) data.currentPassword = details.currentPassword;
      await updateProfile(data);
      onSaved();
    } catch (error) {
      setError(error.message);
    } finally {
      setBusy(false);
    }
  }

  const form = (
    <form onSubmit={save} className="space-y-5">
      <label className="block text-sm font-medium">
        Full name
        <input
          name="name"
          autoComplete="name"
          required
          maxLength={100}
          value={details.name}
          onChange={change}
          className={inputClass}
        />
      </label>
      <label className="block text-sm font-medium">
        Email address
        <input
          name="email"
          type="email"
          autoComplete="email"
          required
          maxLength={254}
          value={details.email}
          onChange={change}
          className={inputClass}
        />
      </label>
      {emailChanged && (
        <label className="block text-sm font-medium">
          Current password
          <input
            name="currentPassword"
            type="password"
            autoComplete="current-password"
            required
            value={details.currentPassword}
            onChange={change}
            aria-describedby="email-password-hint"
            className={inputClass}
          />
          <span
            id="email-password-hint"
            className="mt-2 block text-xs leading-5 text-[#526159]"
          >
            Confirm your password to change your email address.
          </span>
        </label>
      )}
      <label className="block text-sm font-medium">
        Role
        {privileged ? (
          <span className="mt-2 block text-base text-[#526159]">
            {roleLabels[user.role]}
          </span>
        ) : (
          <select
            name="role"
            value={details.role}
            onChange={change}
            className={inputClass}
          >
            {signupRoles.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        )}
      </label>
      <label className="block text-sm font-medium">
        Workspace name
        <input
          name="workspaceName"
          autoComplete="organization"
          required={!privileged}
          maxLength={80}
          value={details.workspaceName}
          onChange={change}
          className={inputClass}
        />
      </label>
      {error && (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}
      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          disabled={busy}
          onClick={onDismiss}
          className="min-h-11 cursor-pointer rounded-lg border border-[#CFDDD5] px-4 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-[#294137] disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={busy}
          className="min-h-11 cursor-pointer rounded-lg bg-[#294137] px-4 text-sm font-semibold text-white hover:bg-[#20332b] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#294137] disabled:cursor-wait disabled:opacity-50"
        >
          {busy ? "Saving..." : "Save changes"}
        </button>
      </div>
    </form>
  );

  return inline ? (
    form
  ) : (
    <AccountModal title="Edit account" onDismiss={onDismiss} busy={busy}>
      {form}
    </AccountModal>
  );
}
