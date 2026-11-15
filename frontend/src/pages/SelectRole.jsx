import { useState } from "react";
import { setLocalValue } from "../lib/storage";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import {
  readRolePreference,
  readWorkspaceName,
  rolePreferenceKey,
  signupRoles,
  workspaceNameKey,
} from "../features/authentication/roles";
import { homeForRole, useAuth } from "../features/authentication/authContext";

function SelectRole() {
  const { user, isLoading, sessionError, signupDraft, signup, updateProfile } =
    useAuth();
  const [role, setRole] = useState(() => user?.role || readRolePreference());
  const [workspaceName, setWorkspaceName] = useState(
    () => user?.workspaceName || readWorkspaceName(),
  );
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  async function handleContinue(event) {
    event.preventDefault();
    if (isSubmitting) return;
    if (!signupRoles.some(({ value }) => value === role)) return;
    const trimmedWorkspaceName = workspaceName.trim();
    if (!trimmedWorkspaceName) {
      setError("Enter a workspace name to continue.");
      return;
    }
    setError("");
    setIsSubmitting(true);
    try {
      const details = { role, workspaceName: trimmedWorkspaceName };
      const currentUser = user
        ? await updateProfile(details)
        : (await signup({ ...signupDraft, ...details })).user;
      setLocalValue(workspaceNameKey, trimmedWorkspaceName);
      setLocalValue(rolePreferenceKey, role);
      const from = location.state?.from;
      const invited =
        from?.pathname === "/workspace-invite"
          ? `${from.pathname}${from.hash || ""}`
          : null;
      navigate(user ? "/profile" : invited || homeForRole(currentUser.role), {
        replace: true,
      });
    } catch (error) {
      setError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading)
    return (
      <p role="status" className="p-8 text-center">
        Loading your account...
      </p>
    );
  if (sessionError)
    return (
      <p role="alert" className="p-8 text-center">
        {sessionError}
      </p>
    );
  if (!user && !signupDraft) return <Navigate to="/signup" replace />;
  if (user && ["admin", "manager"].includes(user.role))
    return <Navigate to="/admin" replace />;

  return (
    <section className="min-h-[calc(100svh-78px)] w-full">
      <div className="grid w-full items-center lg:grid-cols-[55%_45%]">
        <div className="mx-auto w-full max-w-lg px-6 py-10 sm:px-8 sm:py-16">
          <p className="text-xs font-semibold tracking-[0.12em] text-[#294137]">
            STEP 2 OF 2
          </p>
          <h1 className="mt-5 max-w-md text-4xl leading-tight font-bold tracking-tight sm:text-5xl">
            Build your QA workspace.
          </h1>
          <p className="mt-5 max-w-md text-base leading-7 text-[#526159]">
            Give your workspace a name and tell us how you work. Keep your
            projects and testing organized in one place.
          </p>
          <div
            className="mt-8"
            aria-label="Step 2 of 2: Workspace details"
            role="img"
          >
            <div className="flex max-w-64 gap-2" aria-hidden="true">
              <span className="h-1.5 flex-1 rounded-full bg-[#CFDDD5]" />
              <span className="h-1.5 flex-1 rounded-full bg-[#294137]" />
            </div>
            <p className="mt-4 text-xs text-[#526159]" aria-hidden="true">
              Account details <span className="px-1">&bull;</span> Workspace
              details
            </p>
          </div>
        </div>
        <div className="min-h-[calc(100svh-78px)] w-full bg-[#FFFFFF] p-6 sm:p-10">
          <p className="text-xs font-semibold tracking-widest text-[#526159]">
            WORKSPACE SETUP
          </p>
          <h2 className="mt-3 text-3xl leading-tight font-semibold">
            Tell us how you work
          </h2>
          <p className="mt-3 text-sm leading-6 text-[#526159]">
            Set up your first Casefy workspace. You can change these details
            later.
          </p>
          <form onSubmit={handleContinue} className="mt-8">
            <label
              htmlFor="workspace-name"
              className="mb-2 block text-sm font-medium"
            >
              Company or team name
            </label>
            <input
              id="workspace-name"
              name="workspaceName"
              type="text"
              autoComplete="organization"
              placeholder="e.g. Acme QA"
              value={workspaceName}
              onChange={(event) => {
                setWorkspaceName(event.target.value);
                setError("");
              }}
              required
              maxLength={80}
              className="min-h-14 w-full rounded-lg border border-[#CFDDD5] bg-[#ffffff] px-4 py-3 text-base text-[#102018] placeholder:text-[#526159] focus:outline-2 focus:outline-offset-2 focus:outline-[#294137]"
            />
            <fieldset className="mt-5" aria-describedby="role-hint">
              <legend className="mb-2 text-sm font-medium">
                What best describes you?
              </legend>
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                {signupRoles.map(({ value, label }) => (
                  <label key={value} className="cursor-pointer">
                    <input
                      type="radio"
                      name="role"
                      value={value}
                      checked={role === value}
                      onChange={() => setRole(value)}
                      required
                      className="peer sr-only"
                    />
                    <span className="flex min-h-14 items-center justify-center rounded-lg border border-[#CFDDD5] bg-[#ffffff] px-3 py-2 text-center text-sm font-semibold transition-colors peer-checked:border-[#294137] peer-checked:bg-[#294137] peer-checked:text-white peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[#294137]">
                      {label}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
            <p id="role-hint" className="mt-2 text-xs leading-5 text-[#526159]">
              Choose the closest match. You can update it later.
            </p>
            {error && (
              <p role="alert" className="mt-4 text-sm text-red-600">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={isSubmitting || !role || !workspaceName.trim()}
              className="mt-7 min-h-14 w-full cursor-pointer rounded-lg bg-[#294137] px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-[#20332b] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#294137] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting
                ? "Saving..."
                : user
                  ? "Save workspace"
                  : "Create workspace"}
            </button>
            <p className="mt-4 text-center text-xs leading-5 text-[#526159]">
              Your next step toward better test coverage.
            </p>
          </form>
        </div>
      </div>
    </section>
  );
}

export default SelectRole;
