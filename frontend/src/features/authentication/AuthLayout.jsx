import Heading from "../../components/Heading";
import { lazy, Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import {
  RiArrowRightUpLine as ArrowUpRight,
  RiFileTextLine as FileText,
  RiStackLine as Layers3,
  RiScanLine as ScanLine
} from "react-icons/ri";
import { Link } from "react-router-dom";

const AuthGrainBackground = lazy(() => import("./AuthGrainBackground"));
const workflow = [
  { label: "Analyze", icon: FileText },
  { label: "Generate", icon: Layers3 },
  { label: "Execute", icon: ScanLine },
];

export default function AuthLayout({ signup = false, children }) {
  return (
    <section className="w-full bg-[#f6f8f7] p-3 text-[#102019] sm:p-5">
      <div className="grid min-h-[calc(100svh-118px)] gap-3 lg:grid-cols-[55%_45%] lg:gap-0">
        <div className="heading-on-dark relative isolate flex min-h-[480px] flex-col justify-between overflow-hidden rounded-md bg-[#294137] px-7 py-8 text-[#f6f8f7] sm:px-10 sm:py-10 lg:min-h-full lg:px-12 lg:py-12 xl:px-16">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_90%_80%,#a9bfb0_0%,#456b53_40%,#102019_100%)]">
            <ErrorBoundary fallback={null}>
              <Suspense fallback={null}>
                <AuthGrainBackground />
              </Suspense>
            </ErrorBoundary>
            <div className="absolute inset-0 bg-[linear-gradient(130deg,#102019e6_0%,#10201999_55%,#10201933_100%)]" />
          </div>
          <div className="pb-12">
            <p className="text-[11px] font-medium tracking-[0.18em] text-[#cfddd5]">
              {signup ? "MAKE ROOM FOR BETTER TESTING" : "YOUR NEXT RELEASE STARTS HERE"}
            </p>
            <Heading as="h1" className="mt-5 max-w-lg text-4xl leading-[1.08] font-semibold tracking-[-0.045em] sm:text-5xl xl:text-6xl">
              {signup ? <>Build better tests.<br />Move forward<br className="hidden xl:block" /> with clarity.</> : <>Less guesswork.<br />More confidence.</>}
            </Heading>
            <p className="mt-6 max-w-sm text-sm leading-7 text-[#e0ebe3] sm:text-base">
              {signup
                ? "Bring your requirements, ideas, and team into one place. Build a thoughtful testing workflow from the very first step."
                : "Pick up where you left off. Turn your requirements into thoughtful test coverage, one clear step at a time."}
            </p>
            <Link to="/how-it-works" className="mt-7 inline-flex min-h-10 items-center gap-2 rounded-md text-xs font-semibold text-white underline decoration-white/30 underline-offset-4 hover:decoration-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">
              Explore the workflow <ArrowUpRight size={15} aria-hidden="true" />
            </Link>
          </div>
          <div className="rounded-md border border-white/20 bg-[#102019]/25 p-5 backdrop-blur-md sm:p-6">
            <p className="mb-6 text-center text-[10px] font-medium tracking-[0.15em] text-[#cfddd5]">FROM REQUIREMENTS TO CONFIDENCE</p>
            <ol aria-label="Testing workflow" className="grid grid-cols-3 gap-3">
              {workflow.map(({ label, icon: Icon }, index) => (
                <li key={label} className="flex min-w-0 flex-col items-center text-center">
                  <span className="flex size-14 items-center justify-center rounded-full border border-white/30 bg-white/10 sm:size-16">
                    <Icon size={22} aria-hidden="true" />
                  </span>
                  <p className="mt-3 text-xs font-medium sm:text-sm"><span className="mr-1.5 text-[#b7cbbf]">0{index + 1}</span>{label}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
        <div className="flex min-w-0 flex-col justify-center rounded-md border border-[#e1e9e4] bg-white px-6 py-10 sm:px-10 sm:py-12 lg:ml-4 lg:px-10 xl:px-14">
          <div className="mx-auto w-full max-w-md">
            <p className="text-[10px] font-semibold tracking-[0.18em] text-[#718578]">{signup ? "YOUR FIRST STEP STARTS HERE" : "WELCOME TO YOUR WORKSPACE"}</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">{signup ? "Create your account" : "Welcome back"}</h2>
            <p className="mt-3 text-sm leading-6 text-[#718578]">{signup ? "A little setup. A clearer path to better testing." : "Sign in and get back to what you’re building."}</p>
            {children}
          </div>
        </div>
      </div>
    </section>
  );
}
