import P from "../../ui/P";
import Span from "../../ui/Span";
import Button from "../../ui/Button";
import { RiGoogleFill, RiGithubFill } from "react-icons/ri";
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "./authContext";
import { validateCredentials } from "./validation";

function SignupForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signupDraft, setSignupDraft } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const details = { name: data.get("fullName").trim(), email: data.get("email").trim().toLowerCase(), password: data.get("password") };
        const invalid = validateCredentials(details, true);
        if (invalid) {
          setError(invalid.message);
          event.currentTarget.elements.namedItem(invalid.field)?.focus();
          return;
        }
        if (!data.get("acceptTerms")) {
          setError("Agree to the Terms and Privacy Policy to create an account.");
          event.currentTarget.elements.namedItem("acceptTerms")?.focus();
          return;
        }
        setError("");
        setSignupDraft(details);
        navigate("/select-role", { state: location.state });
      }}
    >
      <div className="mt-7 grid grid-cols-2 gap-3 sm:gap-4">
        <Button variant="unstyled"
          type="button"
          onClick={() => setError("Google sign-up is not available yet. Create an account with email instead.")}
          className="flex min-h-12 cursor-pointer items-center justify-center gap-3 rounded-md border border-[#CFDDD5] bg-[#ffffff] px-3 py-3 text-base font-medium text-[#102018] transition-colors hover:bg-[#edf3ef] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#294137]"
        >
          <RiGoogleFill size={20} aria-hidden="true" className="shrink-0" />
          <Span>Google</Span>
        </Button>
        <Button variant="unstyled"
          type="button"
          onClick={() => setError("GitHub sign-up is not available yet. Create an account with email instead.")}
          className="flex min-h-12 cursor-pointer items-center justify-center gap-3 rounded-md border border-[#CFDDD5] bg-[#ffffff] px-3 py-3 text-base font-medium text-[#102018] transition-colors hover:bg-[#edf3ef] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#294137]"
        >
          <RiGithubFill size={20} aria-hidden="true" className="shrink-0" />
          <Span>GitHub</Span>
        </Button>
      </div>
      <div className="my-6 flex items-center gap-4 text-[10px] font-medium tracking-wider text-[#718578]">
        <Span aria-hidden="true" className="h-px flex-1 bg-[#e5ece7]" />
        OR SIGN UP WITH EMAIL
        <Span aria-hidden="true" className="h-px flex-1 bg-[#e5ece7]" />
      </div>
      <div className="space-y-5">
        <div>
          <label
            htmlFor="full-name"
            className="mb-2 block text-sm font-medium text-[#102018]"
          >
            Full name
          </label>
          <input
            id="full-name"
            name="fullName"
            defaultValue={signupDraft?.name || ""}
            type="text"
            autoComplete="name"
            maxLength={100}
            placeholder="Your name"
            required
            className="min-h-12 w-full rounded-md border border-[#CFDDD5] bg-[#ffffff] px-4 py-3 text-base text-[#102018] placeholder:text-[#929b97] focus:border-[#294137] focus:outline-2 focus:outline-offset-2 focus:outline-[#294137]"
          />
        </div>
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
            defaultValue={signupDraft?.email || ""}
            type="email"
            autoComplete="email"
            maxLength={254}
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
              defaultValue={signupDraft?.password || ""}
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              minLength={8}
              placeholder="At least 8 characters"
              required
              className="min-h-12 w-full rounded-md border border-[#CFDDD5] bg-[#ffffff] py-3 pr-20 pl-4 text-base text-[#102018] placeholder:text-[#929b97] focus:border-[#294137] focus:outline-2 focus:outline-offset-2 focus:outline-[#294137]"
            />
            <Button variant="unstyled"
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              aria-controls="password"
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute inset-y-0 right-2 my-2 cursor-pointer rounded-md px-3 text-sm font-medium text-[#526159] hover:text-[#294137] focus-visible:outline-2 focus-visible:outline-[#294137]"
            >
              {showPassword ? "Hide" : "Show"}
            </Button>
          </div>
        </div>
        <label className="flex cursor-pointer items-start gap-3 text-sm leading-6 text-[#526159]">
          <input
            type="checkbox"
            name="acceptTerms"
            required
            className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer accent-[#294137] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#294137]"
          />
          <Span>I agree to the Terms and Privacy Policy.</Span>
        </label>
        {error && (
          <P variant="unstyled" role="alert" className="text-sm text-red-700">
            {error}
          </P>
        )}
        <Button variant="primary" size="lg"
          type="submit"
          className="w-full"
        >
          Create account
        </Button>
      </div>
      <div className="mt-6 flex flex-wrap items-center justify-between gap-2 text-sm">
        <P variant="unstyled" className="text-[#6c7771]">Already have an account?</P>
        <Link
          to="/signin"
          state={location.state}
          className="rounded-md font-semibold text-[#102018] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#294137]"
        >
          Sign in
        </Link>
      </div>
      <P variant="unstyled" className="mt-7 text-xs leading-5 text-[#929b97]">
        Protected by secure authentication and encrypted project data.
      </P>
    </form>
  );
}

export default SignupForm;
