import H2 from "../ui/H2";
import P from "../ui/P";
import Span from "../ui/Span";
import Button from "../ui/Button";
import Heading from "../ui/Heading";
import { useState } from "react";
import { setLocalValue } from "../lib/storage";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import {
  readRolePreference,
  readWorkspaceName,
  rolePreferenceKey,
  signupRoles,
  workspaceNameKey,
} from "../features/authentication/roles";
import { useAuth } from "../features/authentication/authContext";
import { destinationAfterAuth } from "../features/authentication/navigation";

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
    if (!signupRoles.some(({ value }) => value === role)) {
      setError("Choose the role that best describes you.");
      event.currentTarget.elements.namedItem("role")?.[0]?.focus();
      return;
    }
    const trimmedWorkspaceName = workspaceName.trim();
    if (!trimmedWorkspaceName || trimmedWorkspaceName.length > 80) {
      setError("Enter a workspace name between 1 and 80 characters.");
      event.currentTarget.elements.namedItem("workspaceName")?.focus();
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
      navigate(user ? "/profile" : destinationAfterAuth(currentUser.role, location.state?.from), {
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
      <P variant="unstyled" role="status" className="p-8 text-center">
        Loading your account...
      </P>
    );
  if (sessionError)
    return (
      <P variant="unstyled" role="alert" className="p-8 text-center">
        {sessionError}
      </P>
    );
  if (!user && !signupDraft) return <Navigate to="/signup" replace />;
  if (user && ["admin", "manager"].includes(user.role))
    return <Navigate to="/admin" replace />;

  return (
    <section className="min-h-[calc(100svh-78px)] w-full">
      <div className="grid w-full items-center lg:grid-cols-[55%_45%]">
        <div className="mx-auto w-full max-w-lg px-6 py-10 sm:px-8 sm:py-16">
          <P variant="unstyled" className="text-xs font-semibold tracking-[0.12em] text-[#294137]">
            STEP 2 OF 2
          </P>
          <Heading as="h1" className="mt-5 max-w-md text-4xl leading-tight font-bold tracking-tight sm:text-5xl">
            Build your QA workspace.
          </Heading>
          <P variant="unstyled" className="mt-5 max-w-md text-base leading-7 text-[#526159]">
            Give your workspace a name and tell us how you work. Keep your
            projects and testing organized in one place.
          </P>
          <div
            className="mt-8"
            aria-label="Step 2 of 2: Workspace details"
            role="img"
          >
            <div className="flex max-w-64 gap-2" aria-hidden="true">
              <Span className="h-1.5 flex-1 rounded-full bg-[#CFDDD5]" />
              <Span className="h-1.5 flex-1 rounded-full bg-[#294137]" />
            </div>
            <P variant="unstyled" className="mt-4 text-xs text-[#526159]" aria-hidden="true">
              Account details <Span className="px-1">&bull;</Span> Workspace
              details
            </P>
          </div>
        </div>
        <div className="min-h-[calc(100svh-78px)] w-full bg-[#FFFFFF] p-6 sm:p-10">
          <P variant="unstyled" className="text-xs font-semibold tracking-widest text-[#526159]">
            WORKSPACE SETUP
          </P>
          <H2 variant="unstyled" className="mt-3 text-3xl leading-tight font-semibold">
            Tell us how you work
          </H2>
          <P variant="unstyled" className="mt-3 text-sm leading-6 text-[#526159]">
            Set up your first Casefy workspace. You can change these details
            later.
          </P>
          <form onSubmit={handleContinue} noValidate aria-busy={isSubmitting} className="mt-8">
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
              className="min-h-14 w-full rounded-md border border-[#CFDDD5] bg-[#ffffff] px-4 py-3 text-base text-[#102018] placeholder:text-[#526159] focus:outline-2 focus:outline-offset-2 focus:outline-[#294137]"
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
                    <Span className="flex min-h-14 items-center justify-center rounded-md border border-[#CFDDD5] bg-[#ffffff] px-3 py-2 text-center text-sm font-semibold transition-colors peer-checked:border-[#294137] peer-checked:bg-[#294137] peer-checked:text-white peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[#294137]">
                      {label}
                    </Span>
                  </label>
                ))}
              </div>
            </fieldset>
            <P variant="unstyled" id="role-hint" className="mt-2 text-xs leading-5 text-[#526159]">
              Choose the closest match. You can update it later.
            </P>
            {error && (
              <P variant="unstyled" role="alert" className="mt-4 text-sm text-red-600">
                {error}
              </P>
            )}
            {!user && (
              <Link to="/signup" state={location.state} className="mt-4 inline-flex min-h-10 items-center rounded-md text-sm font-semibold text-[#294137] underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#294137]">
                Back to account details
              </Link>
            )}
            <Button variant="primary" size="custom"
              type="submit"
              disabled={isSubmitting}
              className="mt-7 min-h-14 w-full px-6 py-3 text-base focus-visible:outline-offset-4"
            >
              {isSubmitting
                ? "Saving..."
                : user
                  ? "Save workspace"
                  : "Create workspace"}
            </Button>
            <P variant="unstyled" className="mt-4 text-center text-xs leading-5 text-[#526159]">
              Your next step toward better test coverage.
            </P>
          </form>
        </div>
      </div>
    </section>
  );
}

export default SelectRole;
