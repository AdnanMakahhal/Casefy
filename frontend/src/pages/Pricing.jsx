import { useState } from "react";
import { Link } from "react-router-dom";

function Pricing() {
  const [billingPeriod, setBillingPeriod] = useState("monthly");

  return (
    <section className="mx-auto max-w-7xl px-4 pt-12 pb-16 text-center sm:px-8 sm:pt-14">
      <h1 className="mx-auto max-w-[700px] text-4xl leading-[1.12] font-extrabold tracking-tight text-[#102019] sm:text-5xl">
        Plans built for QA teams.
      </h1>
      <p className="mx-auto mt-6 max-w-[600px] text-base leading-6 font-medium text-[#526159]">
        Start with requirements, add live testing when you need it, and scale
        with clear limits.
      </p>

      <div
        role="group"
        aria-label="Billing period"
        className="mx-auto mt-8 grid w-full max-w-[360px] grid-cols-2 gap-1 rounded-2xl border border-[#CFDDD5] bg-[#ffffff] p-1.5"
      >
        <button
          type="button"
          aria-pressed={billingPeriod === "monthly"}
          onClick={() => setBillingPeriod("monthly")}
          className={`min-h-14 cursor-pointer rounded-xl px-5 py-3 text-lg font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#294137] ${billingPeriod === "monthly" ? "bg-[#294137] text-[#ffffff]" : "text-[#102018] hover:bg-[#edf3ef]"}`}
        >
          Monthly
        </button>
        <button
          type="button"
          aria-pressed={billingPeriod === "annual"}
          onClick={() => setBillingPeriod("annual")}
          className={`min-h-14 cursor-pointer rounded-xl px-5 py-3 text-lg font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#294137] ${billingPeriod === "annual" ? "bg-[#294137] text-[#ffffff]" : "text-[#102018] hover:bg-[#edf3ef]"}`}
        >
          Annual
        </button>
      </div>

      <div className="mt-12 grid gap-6 text-left text-[#102018] sm:grid-cols-2 xl:grid-cols-4">
        <article className="flex min-h-[416px] flex-col rounded-lg border border-[#CFDDD5] bg-[#ffffff] p-6 pb-14 shadow-[0_20px_32px_#10201826]">
          <h2 className="text-xl font-semibold">Free</h2>
          <p className="mt-3 min-h-12 text-sm leading-6">
            For validating ideas from requirements before live testing.
          </p>
          <p className="mt-4 text-[44px] leading-tight font-bold tracking-tight">
            Free
          </p>
          <ul className="mt-3 space-y-1 border-t border-[#CFDDD5] pt-3 pl-4 text-sm leading-6">
            <li>1 workspace</li>
            <li>2 active projects</li>
            <li>100 credits / month</li>
            <li>Docs + user stories only</li>
          </ul>

          <Link
            to="/signup"
            className="mt-3 inline-flex min-h-11 items-center justify-center rounded-lg bg-[#294137] px-4 text-sm font-semibold text-[#ffffff] transition-colors hover:bg-[#20332b] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#294137]"
          >
            Start free
          </Link>
        </article>

        <article className="flex min-h-[416px] flex-col rounded-lg border border-[#294137] bg-[#edf3ef] p-6 pb-14 shadow-[0_12px_28px_#2941371a]">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-xl font-semibold">Plus</h2>
            <span className="rounded-md bg-[#294137] px-4 py-1.5 text-[10px] font-bold text-[#ffffff]">
              POPULAR
            </span>
          </div>
          <p className="mt-3 min-h-12 text-sm leading-6">
            For independent QA work with live browser testing.
          </p>
          <p className="mt-4 flex items-baseline gap-8">
            <span className="text-[44px] leading-tight font-bold tracking-tight">
              $24
            </span>
            <span className="text-sm">/mo</span>
          </p>
          <ul className="mt-3 list-disc space-y-1 border-t border-[#CFDDD5] pt-3 pl-4 text-sm leading-6 marker:text-[#294137]">
            <li>10 active projects</li>
            <li>1,500 credits / month</li>
            <li>Live browser testing</li>
            <li>Docs, diagrams + URLs</li>
          </ul>
          <Link
            to="/signup"
            className="mt-3 inline-flex min-h-11 items-center justify-center rounded-lg bg-[#294137] px-4 text-sm font-semibold text-[#ffffff] transition-colors hover:bg-[#20332b] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#294137]"
          >
            Start Plus
          </Link>
        </article>

        <article className="flex min-h-[416px] flex-col rounded-lg border border-[#CFDDD5] bg-[#ffffff] p-6 pb-14 shadow-[0_20px_32px_#10201826]">
          <h2 className="text-xl font-semibold">Pro</h2>
          <p className="mt-3 min-h-12 text-sm leading-6">
            For small QA teams automating every release.
          </p>
          <p className="mt-4 flex items-baseline gap-8">
            <span className="text-[44px] leading-tight font-bold tracking-tight">
              $79
            </span>
            <span className="text-sm">/mo</span>
          </p>
          <ul className="mt-3 space-y-1 border-t border-[#CFDDD5] pt-3 pl-4 text-sm leading-6">
            <li>2 seats included</li>
            <li>Unlimited projects</li>
            <li>6,000 credits / month</li>
            <li>Live runs + CI/CD</li>
          </ul>
          <Link
            to="/signup"
            className="mt-3 inline-flex min-h-11 items-center justify-center rounded-lg bg-[#294137] px-4 text-sm font-semibold text-[#ffffff] transition-colors hover:bg-[#20332b] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#294137]"
          >
            Start Pro
          </Link>
        </article>

        <article className="flex min-h-[416px] flex-col rounded-lg border border-[#CFDDD5] bg-[#ffffff] p-6 pb-14 shadow-[0_20px_32px_#10201826]">
          <h2 className="text-xl font-semibold">Enterprise</h2>
          <p className="mt-3 min-h-12 text-sm leading-6">
            For organizations needing scale, security, and control.
          </p>
          <p className="mt-4 text-[40px] leading-[1.375] font-bold tracking-tight">
            Custom
          </p>
          <ul className="mt-3 space-y-1 border-t border-[#CFDDD5] pt-3 pl-4 text-sm leading-6">
            <li>Custom seats</li>
            <li>Custom credits + projects</li>
            <li>Unlimited live testing</li>
            <li>SSO, audit logs + SLA</li>
          </ul>
          <button
            type="button"
            className="mt-3 inline-flex min-h-11 cursor-pointer items-center justify-center rounded-lg bg-[#294137] px-4 text-sm font-semibold text-[#ffffff] transition-colors hover:bg-[#20332b] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#294137]"
          >
            Contact sales
          </button>
        </article>
      </div>
    </section>
  );
}

export default Pricing;
