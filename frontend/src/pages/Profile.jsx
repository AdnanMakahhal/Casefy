import { useRef, useState } from "react";
import { Camera, Menu, Pencil, Save, Trash2 } from "lucide-react";
import DashboardSidebar from "../components/DashboardSidebar";
import { roleLabels } from "../features/authentication/roles";
import { useAuth } from "../features/authentication/authContext";
import Avatar from "../components/Avatar";
import AvatarCropper from "../components/AvatarCropper";
import EditAccount from "../components/EditAccount";
import DeleteAccount from "../components/DeleteAccount";
import BillingControls from "../components/BillingControls";

function Profile({ user }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [modal, setModal] = useState(null);
  const [photo, setPhoto] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [photoBusy, setPhotoBusy] = useState(false);
  const { updateProfile } = useAuth();
  const fileInput = useRef(null);
  const profile = user;
  const role = roleLabels[user.role];
  const workspaceName = user.workspaceName;
  const details = [
    { label: "Full name", value: profile.name },
    { label: "Email address", value: profile.email },
    { label: "Role", value: role },
    { label: "Workspace name", value: workspaceName },
  ];

  function selectPhoto(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setMessage("");
    setError("");
    if (
      !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
      file.size > 10 * 1024 * 1024
    ) {
      setError("Choose a JPEG, PNG, or WebP photo up to 10 MB.");
      return;
    }
    setPhoto(file);
  }

  async function removePhoto() {
    setPhotoBusy(true);
    setError("");
    setMessage("");
    try {
      await updateProfile({ avatarImage: null });
      setMessage("Profile photo removed.");
    } catch (error) {
      setError(error.message);
    } finally {
      setPhotoBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f6f8f7] text-[#102019] lg:pl-64">
      <DashboardSidebar
        user={user}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      <main className="mx-auto max-w-[1440px] px-4 py-6 sm:px-8 lg:p-10">
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
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Profile</h1>
            <p className="mt-3 text-sm leading-6 text-[#526159]">
              Your personal details and workspace information.
            </p>
          </div>
        </header>

        <section
          aria-labelledby="profile-details-heading"
          className="mt-9 max-w-3xl overflow-hidden rounded-xl border border-[#CFDDD5] bg-white"
        >
          <div className="flex flex-wrap items-center gap-5 border-b border-[#CFDDD5] px-6 py-6 sm:px-8">
            <input
              ref={fileInput}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              aria-label="Choose a profile photo"
              onChange={selectPhoto}
              className="sr-only"
              tabIndex={-1}
            />
            <button
              type="button"
              onClick={() => fileInput.current.click()}
              disabled={photoBusy}
              aria-label="Change profile photo"
              className="group relative shrink-0 cursor-pointer rounded-full focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#294137] disabled:opacity-50"
            >
              <Avatar user={user} className="size-20 text-2xl" />
              <span
                aria-hidden="true"
                className="absolute right-0 bottom-0 flex size-7 items-center justify-center rounded-full border-2 border-white bg-[#294137] text-white group-hover:bg-[#20332b]"
              >
                <Camera size={14} />
              </span>
            </button>
            <div className="min-w-0 flex-1">
              <h2 id="profile-details-heading" className="break-words text-xl font-semibold">
                {profile.name || "Your profile"}
              </h2>
              <p className="mt-1 text-sm text-[#526159]">{role || "No role selected"}</p>
              {user.avatarImage && (
                <button
                  type="button"
                  disabled={photoBusy}
                  onClick={removePhoto}
                  className="mt-3 cursor-pointer rounded text-xs font-semibold text-[#526159] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#294137]"
                >
                  {photoBusy ? "Removing..." : "Remove photo"}
                </button>
              )}
            </div>
          </div>
          <BillingControls user={user} />
          {modal === "edit" ? (
            <div className="p-6 sm:p-8">
              <EditAccount
                inline
                user={user}
                onDismiss={() => setModal(null)}
                onSaved={() => {
                  setModal(null);
                  setMessage("Account updated.");
                }}
              />
            </div>
          ) : (
            <dl className="grid gap-6 p-6 sm:grid-cols-2 sm:p-8">
              {details.map(({ label, value }) => (
                <div key={label}>
                  <dt className="text-sm text-[#526159]">{label}</dt>
                  <dd className="mt-2 break-words text-base font-medium">
                    {value || "Not provided"}
                  </dd>
                </div>
              ))}
            </dl>
          )}
          {modal !== "edit" && (
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#CFDDD5] px-6 py-5 sm:px-8">
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  disabled={photoBusy}
                  onClick={() => {
                    setMessage("");
                    setError("");
                    setModal("edit");
                  }}
                  className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-lg bg-[#294137] px-4 text-sm font-semibold text-white hover:bg-[#20332b] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#294137]"
                >
                  <Pencil size={16} aria-hidden="true" />
                  Edit account
                </button>
                <button
                  type="button"
                  disabled
                  title="Choose Edit account to make changes, then save them here"
                  className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-[#CFDDD5] px-4 text-sm font-semibold text-[#526159] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Save size={16} aria-hidden="true" />
                  Save changes
                </button>
              </div>
              <button
                type="button"
                disabled={photoBusy}
                onClick={() => {
                  setMessage("");
                  setError("");
                  setModal("delete");
                }}
                className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border border-red-200 px-4 text-sm font-semibold text-red-700 hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700"
              >
                <Trash2 size={16} aria-hidden="true" />
                Delete account
              </button>
            </div>
          )}
        </section>
        {(user.subscriptionStartedAt || user.subscriptionPeriodEnd) && (
          <details className="mt-6 max-w-3xl rounded-xl border border-[#CFDDD5] bg-white">
            <summary className="cursor-pointer rounded-xl px-6 py-5 text-base font-semibold text-[#294137] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#294137] sm:px-8">
              Subscription history
            </summary>
            <dl className="grid gap-5 border-t border-[#CFDDD5] px-6 py-5 sm:grid-cols-2 sm:px-8">
              {user.subscriptionStartedAt && (
                <div>
                  <dt className="text-sm text-[#526159]">Subscription started</dt>
                  <dd className="mt-2 text-sm font-medium">
                    <time dateTime={user.subscriptionStartedAt}>
                      {new Date(user.subscriptionStartedAt).toLocaleString()}
                    </time>
                  </dd>
                </div>
              )}
              {user.subscriptionPeriodEnd && (
                <div>
                  <dt className="text-sm text-[#526159]">
                    {user.cancelAtPeriodEnd
                      ? "Paid subscription ends"
                      : "Current billing period ends"}
                  </dt>
                  <dd className="mt-2 text-sm font-medium">
                    <time dateTime={user.subscriptionPeriodEnd}>
                      {new Date(user.subscriptionPeriodEnd).toLocaleString()}
                    </time>
                  </dd>
                </div>
              )}
            </dl>
          </details>
        )}
        {message && (
          <p role="status" className="mt-4 text-sm text-[#294137]">
            {message}
          </p>
        )}
        {error && (
          <p role="alert" className="mt-4 text-sm text-red-700">
            {error}
          </p>
        )}
        {modal === "delete" && <DeleteAccount onDismiss={() => setModal(null)} />}
        {photo && (
          <AvatarCropper
            file={photo}
            onDismiss={() => setPhoto(null)}
            onSave={async (avatarImage) => {
              await updateProfile({ avatarImage });
              setPhoto(null);
              setMessage("Profile photo updated.");
            }}
          />
        )}
      </main>
    </div>
  );
}

export default Profile;
