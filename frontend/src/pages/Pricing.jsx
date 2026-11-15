import { useEffect, useState } from "react";
import { Check, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../features/authentication/authContext";
import { planAction } from "../features/authentication/plans";

const plans = [
  {
    id: "free",
    name: "Free",
    tagline: "A simple place to start",
    description: "Validate ideas from requirements before moving to live testing.",
    features: [
      "1 workspace",
      "2 active projects",
      "100 credits / month",
      "Docs + user stories only",
    ],
    action: "Start free",
  },
  {
    id: "plus",
    name: "Plus",
    tagline: "For independent QA work",
    description: "Bring live browser testing into your everyday QA workflow.",
    monthly: "24",
    annual: "19.20",
    yearly: "230.40",
    saving: "57.60",
    popular: true,
    features: [
      "10 active projects",
      "1,500 credits / month",
      "Live browser testing",
      "Docs, diagrams + URLs",
    ],
    action: "Start Plus",
  },
  {
    id: "pro",
    name: "Pro",
    tagline: "Room for your team to grow",
    description: "Keep your small QA team in sync and automate every release.",
    monthly: "79",
    annual: "63.20",
    yearly: "758.40",
    saving: "189.60",
    features: [
      "2 seats included",
      "Unlimited projects",
      "6,000 credits / month",
      "Live runs + CI/CD",
    ],
    action: "Start Pro",
  },
  {
    id: "enterprise",
    name: "Enterprise",
    tagline: "Built around your organization",
    description: "Get the scale, security, and control your organization needs.",
    features: [
      "Custom seats",
      "Custom credits + projects",
      "Unlimited live testing",
      "SSO, audit logs + SLA",
    ],
    action: "Contact support",
  },
];

function PricingCard({ plan, isAnnual, billingPeriod, user, loading }) {
  const enterprise = plan.id === "enterprise";
  const free = plan.id === "free";
  const action = planAction(user, plan.id);
  const disabled = loading || ["current", "included"].includes(action);
  const buttonLabel = loading
    ? "Loading account..."
    : action === "current"
      ? "Current plan"
      : action === "included"
        ? "Included in your plan"
        : action === "upgrade"
          ? `Upgrade to ${plan.name}`
          : plan.action;
  return (
    <article
      aria-labelledby={`plan-${plan.id}`}
      className={`relative flex h-full flex-col rounded-2xl border p-6 transition-shadow duration-200 sm:p-7 xl:p-6 ${plan.popular ? "border-[#779b86] bg-[#edf3ef] shadow-[0_8px_28px_#29413712] ring-1 ring-[#779b86]" : "border-[#d5e0d9] bg-white shadow-[0_4px_20px_#29413705] hover:shadow-[0_8px_28px_#2941370c]"}`}
    >
      <div className="flex min-h-7 items-center justify-between gap-2">
        <h2 id={`plan-${plan.id}`} className="text-xl font-bold tracking-tight text-[#20332b]">
          {plan.name}
        </h2>
        {plan.popular && (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#294137] px-2.5 py-1.5 text-[10px] font-semibold text-white">
            <Sparkles size={11} aria-hidden="true" />
            Most popular
          </span>
        )}
      </div>
      <p className="mt-2 text-[11px] font-medium text-[#718578]">{plan.tagline}</p>
      <p className="mt-5 min-h-18 text-sm leading-6 text-[#526159]">{plan.description}</p>

      <div className="mt-5 min-h-32">
        <p className="flex min-h-14 flex-wrap items-baseline gap-x-1.5 text-[#20332b]">
          <span
            className={`${enterprise ? "text-[40px]" : "text-[44px]"} leading-tight font-bold tracking-[-0.045em] tabular-nums`}
          >
            {enterprise ? "Custom" : free ? "$0" : `$${isAnnual ? plan.annual : plan.monthly}`}
          </span>
          {!enterprise && <span className="text-sm font-medium text-[#718578]">/ month</span>}
        </p>
        <p className="mt-2 text-xs leading-5 text-[#718578]">
          {enterprise
            ? "Pricing tailored to your team"
            : free
              ? "Free to get started"
              : isAnnual
                ? `$${plan.yearly} billed yearly`
                : `$${plan.monthly} billed monthly`}
        </p>
        {isAnnual && plan.saving && (
          <p className="mt-1 text-xs font-semibold leading-5 text-[#3d7754]">
            Save ${plan.saving} per year
          </p>
        )}
      </div>

      {disabled ? (
        <button
          type="button"
          disabled
          aria-label={`${buttonLabel}: ${plan.name}`}
          className="inline-flex min-h-12 w-full cursor-not-allowed items-center justify-center rounded-xl border border-[#CFDDD5] bg-[#e2ece6] px-3 text-sm font-semibold text-[#526159]"
        >
          {buttonLabel}
        </button>
      ) : (
        <Link
          to={
            enterprise
              ? "/support?category=enterprise"
              : `/checkout?plan=${plan.id}&billing=${billingPeriod}`
          }
          className={`inline-flex min-h-12 w-full items-center justify-center rounded-xl border px-3 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#294137] ${plan.popular ? "border-[#294137] bg-[#294137] text-white shadow-sm hover:bg-[#20332b]" : "border-[#c2d3c8] bg-white text-[#294137] hover:border-[#91a99a] hover:bg-[#edf3ef]"}`}
        >
          {buttonLabel}
        </Link>
      )}

      <div
        className={`mt-7 flex-1 border-t pt-6 ${plan.popular ? "border-[#c9d9cf]" : "border-[#e5ece7]"}`}
      >
        <h3 className="text-[10px] font-semibold tracking-[0.12em] text-[#718578]">
          WHAT'S INCLUDED
        </h3>
        <ul className="mt-4 space-y-4">
          {plan.features.map((feature) => (
            <li key={feature} className="flex items-start gap-2.5 text-sm leading-5 text-[#526159]">
              <span
                className={`mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full ${plan.popular ? "bg-[#d6e5dc]" : "bg-[#edf3ef]"}`}
              >
                <Check size={11} strokeWidth={2.5} aria-hidden="true" className="text-[#3d7754]" />
              </span>
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}

export default function Pricing() {
  const { user, isLoading, refreshUser } = useAuth();
  useEffect(() => {
    if (user?.id) refreshUser().catch(() => {});
  }, [user?.id, refreshUser]);
  const [billingPeriod, setBillingPeriod] = useState("monthly");
  const isAnnual = billingPeriod === "annual";

  return (
    <section className="mx-auto max-w-7xl px-4 pt-12 pb-16 sm:px-8 sm:pt-16 sm:pb-20">
      <div className="text-center">
        <h1 className="mx-auto max-w-[700px] text-4xl leading-[1.12] font-extrabold tracking-tight text-[#102019] sm:text-5xl">
          Plans built for QA teams.
        </h1>
        <p className="mx-auto mt-5 max-w-[540px] text-sm leading-7 text-[#526159] sm:text-base">
          Start with requirements, add live testing when you need it, and scale with clear limits.
        </p>

        <div
          role="group"
          aria-label="Billing period"
          className="mx-auto mt-8 inline-flex max-w-full gap-1 rounded-full border border-[#d5e0d9] bg-[#eaf0ec] p-1.5"
        >
          <button
            type="button"
            aria-pressed={!isAnnual}
            onClick={() => setBillingPeriod("monthly")}
            className={`min-h-11 cursor-pointer rounded-full px-5 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#294137] ${!isAnnual ? "bg-white text-[#294137] shadow-sm" : "text-[#718578] hover:text-[#294137]"}`}
          >
            Monthly
          </button>
          <button
            type="button"
            aria-pressed={isAnnual}
            onClick={() => setBillingPeriod("annual")}
            className={`flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-full px-4 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#294137] ${isAnnual ? "bg-white text-[#294137] shadow-sm" : "text-[#718578] hover:text-[#294137]"}`}
          >
            Annual
            <span className="rounded-full bg-[#d9e8df] px-2 py-1 text-[10px] font-bold text-[#3d7754]">
              Save 20%
            </span>
          </button>
        </div>
        <p className="mt-3 min-h-5 text-xs leading-5 text-[#718578]">
          {isAnnual
            ? "Save 20% on Plus and Pro with yearly billing."
            : "Choose monthly billing, or save 20% with an annual plan."}
        </p>
      </div>

      <div className="mt-10 grid items-stretch gap-5 sm:grid-cols-2 xl:mt-12 xl:grid-cols-4">
        {plans.map((plan) => (
          <PricingCard
            key={plan.id}
            plan={plan}
            isAnnual={isAnnual}
            billingPeriod={billingPeriod}
            user={user}
            loading={isLoading}
          />
        ))}
      </div>
      <p className="mx-auto mt-7 max-w-xl text-center text-xs leading-6 text-[#718578]">
        Annual prices are shown as a monthly equivalent and charged once per year. Monthly credit
        limits apply to both billing options.
      </p>
    </section>
  );
}
