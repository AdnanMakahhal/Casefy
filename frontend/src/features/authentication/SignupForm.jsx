import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "./authContext";

function SignupForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setSignupDraft } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const name = data.get("fullName").trim();
        if (!name) {
          setError("Please enter your full name.");
          return;
        }
        setSignupDraft({
          name,
          email: data.get("email").trim().toLowerCase(),
          password: data.get("password"),
        });
        navigate("/select-role", { state: location.state });
      }}
    >
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <button
          type="button"
          className="flex min-h-14 cursor-pointer items-center justify-center gap-3 rounded-lg border border-[#CFDDD5] bg-[#ffffff] px-3 py-3 text-base font-medium text-[#102018] transition-colors hover:bg-[#edf3ef] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#294137]"
        >
          <img
            src="/Comp_Logos/Google_Logo.svg"
            alt=""
            className="h-7 w-7 shrink-0 object-contain"
          />
          <span>Google</span>
        </button>
        <button
          type="button"
          className="flex min-h-14 cursor-pointer items-center justify-center gap-3 rounded-lg border border-[#CFDDD5] bg-[#ffffff] px-3 py-3 text-base font-medium text-[#102018] transition-colors hover:bg-[#edf3ef] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#294137]"
        >
          <img
            src="/Comp_Logos/Github_Logo.svg"
            alt=""
            className="h-7 w-7 shrink-0 object-contain"
          />
          <span>GitHub</span>
        </button>
      </div>
      <div className="mt-8 space-y-6">
        <div>
          <label htmlFor="full-name" className="mb-2 block text-sm font-medium text-[#102018]">
            Full name
          </label>
          <input
            id="full-name"
            name="fullName"
            type="text"
            autoComplete="name"
            placeholder="Your name"
            required
            className="min-h-14 w-full rounded-lg border border-[#CFDDD5] bg-[#ffffff] px-4 py-3 text-base text-[#102018] placeholder:text-[#929b97] focus:border-[#294137] focus:outline-2 focus:outline-offset-2 focus:outline-[#294137]"
          />
        </div>
        <div>
          <label htmlFor="email" className="mb-2 block text-sm font-medium text-[#102018]">
            Email address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="name@company.com"
            required
            className="min-h-14 w-full rounded-lg border border-[#CFDDD5] bg-[#ffffff] px-4 py-3 text-base text-[#102018] placeholder:text-[#929b97] focus:border-[#294137] focus:outline-2 focus:outline-offset-2 focus:outline-[#294137]"
          />
        </div>
        <div>
          <label htmlFor="password" className="mb-2 block text-sm font-medium text-[#102018]">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              minLength={8}
              placeholder="At least 8 characters"
              required
              className="min-h-14 w-full rounded-lg border border-[#CFDDD5] bg-[#ffffff] py-3 pr-20 pl-4 text-base text-[#102018] placeholder:text-[#929b97] focus:border-[#294137] focus:outline-2 focus:outline-offset-2 focus:outline-[#294137]"
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              aria-controls="password"
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute inset-y-0 right-2 my-2 cursor-pointer rounded px-3 text-sm font-medium text-[#526159] hover:text-[#294137] focus-visible:outline-2 focus-visible:outline-[#294137]"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
        </div>
        <label className="flex cursor-pointer items-start gap-3 text-sm leading-6 text-[#526159]">
          <input
            type="checkbox"
            name="acceptTerms"
            required
            className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer accent-[#294137] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#294137]"
          />
          <span>I agree to the Terms and Privacy Policy.</span>
        </label>
        {error && (
          <p role="alert" className="text-sm text-red-700">
            {error}
          </p>
        )}
        <button
          type="submit"
          className="min-h-14 w-full cursor-pointer rounded-lg bg-[#294137] px-6 py-3 text-base font-semibold text-[#ffffff] transition-colors hover:bg-[#20332b] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#294137]"
        >
          Create account
        </button>
      </div>
      <div className="mt-6 flex flex-wrap items-center justify-between gap-2 text-sm">
        <p className="text-[#6c7771]">Already have an account?</p>
        <Link
          to="/signin"
          state={location.state}
          className="rounded font-semibold text-[#102018] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#294137]"
        >
          Sign in
        </Link>
      </div>
      <p className="mt-12 text-xs leading-5 text-[#929b97]">
        Protected by secure authentication and encrypted project data.
      </p>
    </form>
  );
}

export default SignupForm;
