import { RiGoogleFill, RiGithubFill } from "react-icons/ri";
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "./authContext";
import { validateCredentials } from "./validation";
import { destinationAfterAuth } from "./navigation";

function SigninForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { signin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  async function handleSubmit(event) {
    event.preventDefault();
    if (isSubmitting) return;
    const data = new FormData(event.currentTarget);
    const credentials = { email: data.get("email").trim().toLowerCase(), password: data.get("password") };
    const invalid = validateCredentials(credentials);
    if (invalid) {
      setError(invalid.message);
      event.currentTarget.elements.namedItem(invalid.field)?.focus();
      return;
    }
    setError("");
    setIsSubmitting(true);
    try {
      const session = await signin(credentials);
      navigate(destinationAfterAuth(session.user.role, location.state?.from), { replace: true });
    } catch (error) {
      setError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate aria-busy={isSubmitting}>
      <fieldset disabled={isSubmitting} className="min-w-0">
      <div className="mt-7 space-y-5">
        <div>
          <label
            htmlFor="email"
            className="mb-2 block text-sm font-medium text-[#102018]"
          >
            Email address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="name@company.com"
            required
            className="min-h-12 w-full rounded-md border border-[#CFDDD5] bg-[#ffffff] px-4 py-3 text-base text-[#102018] placeholder:text-[#929b97] focus:border-[#294137] focus:outline-2 focus:outline-offset-2 focus:outline-[#294137]"
          />
        </div>
        <div>
          <label
            htmlFor="password"
            className="mb-2 block text-sm font-medium text-[#102018]"
          >
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="At least 8 characters"
              required
              className="min-h-12 w-full rounded-md border border-[#CFDDD5] bg-[#ffffff] py-3 pr-20 pl-4 text-base text-[#102018] placeholder:text-[#929b97] focus:border-[#294137] focus:outline-2 focus:outline-offset-2 focus:outline-[#294137]"
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              aria-controls="password"
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute inset-y-0 right-2 my-2 cursor-pointer rounded-md px-3 text-sm font-medium text-[#526159] hover:text-[#294137] focus-visible:outline-2 focus-visible:outline-[#294137]"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
        </div>

        {error && (
          <p role="alert" className="text-sm text-red-700">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={isSubmitting}
          className="min-h-12 w-full cursor-pointer rounded-md bg-[#294137] px-6 py-3 text-base font-semibold text-[#ffffff] transition-colors hover:bg-[#20332b] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#294137] disabled:cursor-wait disabled:opacity-50"
        >
          {isSubmitting ? "Signing in..." : "Login"}
        </button>
      </div>
      <p className="my-8 text-center text-xs font-medium tracking-wider text-[#526159]">
        OR CONTINUE WITH
      </p>
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <button
          type="button"
          onClick={() => setError("Google sign-in is not available yet. Use your email and password.")}
          className="flex min-h-12 cursor-pointer items-center justify-center gap-3 rounded-md border border-[#CFDDD5] bg-[#ffffff] px-3 py-3 text-base font-medium text-[#102018] transition-colors hover:bg-[#edf3ef] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#294137]"
        >
          <RiGoogleFill size={20} aria-hidden="true" className="shrink-0" />
          <span>Google</span>
        </button>
        <button
          type="button"
          onClick={() => setError("GitHub sign-in is not available yet. Use your email and password.")}
          className="flex min-h-12 cursor-pointer items-center justify-center gap-3 rounded-md border border-[#CFDDD5] bg-[#ffffff] px-3 py-3 text-base font-medium text-[#102018] transition-colors hover:bg-[#edf3ef] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#294137]"
        >
          <RiGithubFill size={20} aria-hidden="true" className="shrink-0" />
          <span>GitHub</span>
        </button>
      </div>
      <div className="mt-6 flex flex-wrap items-center justify-between gap-2 text-sm">
        <p className="text-[#6c7771]">New to Casefy?</p>
        <Link
          to="/signup"
          state={location.state}
          className="rounded-md font-semibold text-[#102018] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#294137]"
        >
          Create an account
        </Link>
      </div>
      <p className="mt-7 text-xs leading-5 text-[#929b97]">
        By continuing, you agree to the Terms and Privacy Policy.
      </p>
      </fieldset>
    </form>
  );
}

export default SigninForm;
