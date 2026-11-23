import Reveal from "../ui/Reveal";
import H2 from "../ui/H2";
import P from "../ui/P";
import Span from "../ui/Span";
import Button from "../ui/Button";
import Heading from "../ui/Heading";
import { useEffect, useState } from "react";
import {
  RiCheckLine as Check,
  RiSparklingLine as Sparkles,
} from "react-icons/ri";
import { Link } from "react-router-dom";
import { useAuth } from "../features/authentication/authContext";
import { planAction } from "../features/authentication/plans";
import PricingSkeleton from "../ui/PricingSkeleton";

const plans = [
  {
    id: "free",
    name: "Free",
    tagline: "A simple place to start",
    description:
      "Validate ideas from requirements before moving to live testing.",
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
    id: "ultra",
    name: "Ultra",
    tagline: "Unlimited room for your QA work",
    description:
      "Scale your testing with unlimited seats, projects, workspaces, and credits.",
    features: [
      "Unlimited seats and workspaces",
      "Unlimited projects",
      "Unlimited credits",
      "All testing workflows",
    ],
    monthly: "699",
    annual: "699",
    yearly: "8388",
    action: "Start Ultra",
  },
];

function PricingCard({ plan, isAnnual, billingPeriod, user, loading, delay = 0 }) {
  const free = plan.id === "free";
  const staff = ["admin", "manager"].includes(user?.role);
  const action = planAction(user, plan.id);
  const disabled = staff || loading || ["current", "included"].includes(action);
  const buttonLabel = staff
    ? "Plans are for customer accounts"
    : loading
      ? "Loading account..."
      : action === "current"
        ? "Current plan"
        : action === "included"
          ? "Included in your plan"
          : action === "upgrade"
            ? `Upgrade to ${plan.name}`
            : plan.action;
  return (
    <Reveal as="article" delay={delay}
      aria-labelledby={`plan-${plan.id}`}
      className={`relative flex h-full flex-col rounded-md border p-6 transition-shadow duration-200 sm:p-7 xl:p-6 ${plan.popular ? "border-[#779b86] bg-[#edf3ef] shadow-[0_8px_28px_#29413712] ring-1 ring-[#779b86]" : "border-[#d5e0d9] bg-white shadow-[0_4px_20px_#29413705] hover:shadow-[0_8px_28px_#2941370c]"}`}
    >
      <div className="flex min-h-7 items-center justify-between gap-2">
        <H2 variant="unstyled"
          id={`plan-${plan.id}`}
          className="text-xl font-bold tracking-tight text-[#20332b]"
        >
          {plan.name}
        </H2>
        {plan.popular && (
          <Span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-[#294137] px-2.5 py-1.5 text-[10px] font-semibold text-white">
            <Sparkles size={11} aria-hidden="true" />
            Most popular
          </Span>
        )}
      </div>
      <P variant="unstyled" className="mt-2 text-[11px] font-medium text-[#718578]">
        {plan.tagline}
      </P>
      <P variant="unstyled" className="mt-5 min-h-18 text-sm leading-6 text-[#526159]">
        {plan.description}
      </P>

      <div className="mt-5 min-h-32">
        <P variant="unstyled" className="flex min-h-14 flex-wrap items-baseline gap-x-1.5 text-[#20332b]">
          <Span
            className="text-[44px] leading-tight font-bold tracking-[-0.045em] tabular-nums"
          >
            {free ? "$0" : "$" + (isAnnual ? plan.annual : plan.monthly)}
          </Span>
          <Span variant="muted" className="text-sm font-medium">/ month</Span>
        </P>
        <P variant="unstyled" className="mt-2 text-xs leading-5 text-[#718578]">
          {free
              ? "Free to get started"
              : isAnnual
                ? `$${plan.yearly} billed yearly`
                : `$${plan.monthly} billed monthly`}
        </P>
        {isAnnual && plan.saving && (
          <P variant="unstyled" className="mt-1 text-xs font-semibold leading-5 text-[#3d7754]">
            Save ${plan.saving} per year
          </P>
        )}
      </div>

      {disabled ? (
        <Button variant="unstyled"
          type="button"
          disabled
          aria-label={`${buttonLabel}: ${plan.name}`}
          className="inline-flex min-h-12 w-full cursor-not-allowed items-center justify-center rounded-md border border-[#CFDDD5] bg-[#e2ece6] px-3 text-sm font-semibold text-[#526159]"
        >
          {buttonLabel}
        </Button>
      ) : (
        <Link
          to={`/checkout?plan=${plan.id}&billing=${billingPeriod}`}
          className={`inline-flex min-h-12 w-full items-center justify-center rounded-md border px-3 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#294137] ${plan.popular ? "border-[#294137] bg-[#294137] text-white shadow-sm hover:bg-[#20332b]" : "border-[#c2d3c8] bg-white text-[#294137] hover:border-[#91a99a] hover:bg-[#edf3ef]"}`}
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
            <li
              key={feature}
              className="flex items-start gap-2.5 text-sm leading-5 text-[#526159]"
            >
              <Span
                className={`mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full ${plan.popular ? "bg-[#d6e5dc]" : "bg-[#edf3ef]"}`}
              >
                <Check
                  size={11}
                  aria-hidden="true"
                  className="text-[#3d7754]"
                />
              </Span>
              <Span>{feature}</Span>
            </li>
          ))}
        </ul>
      </div>
    </Reveal>
  );
}

export default function Pricing() {
  const { user, isLoading, refreshUser } = useAuth();
  useEffect(() => {
    if (user?.id) refreshUser().catch(() => {});
  }, [user?.id, refreshUser]);
  const [billingPeriod, setBillingPeriod] = useState("monthly");
  const isAnnual = billingPeriod === "annual";

  if (isLoading) return <PricingSkeleton />;

  return (
    <section className="mx-auto max-w-7xl px-4 pt-12 pb-16 sm:px-8 sm:pt-16 sm:pb-20">
      <div className="text-center">
        <Heading
          as="h1"
          className="mx-auto max-w-[700px] text-4xl leading-[1.12] font-extrabold tracking-tight text-[#102019] sm:text-5xl"
        >
          Plans built for QA teams.
        </Heading>
        <Reveal delay={0.08}><P className="mx-auto mt-5 max-w-[540px] sm:text-base">
          Start with requirements, add live testing when you need it, and scale
          with clear limits.
        </P></Reveal>

        <Reveal delay={0.16}
          role="group"
          aria-label="Billing period"
          className="mx-auto mt-8 inline-flex max-w-full gap-1 rounded-md border border-[#d5e0d9] bg-[#eaf0ec] p-1.5"
        >
          <Button variant="unstyled"
            type="button"
            aria-pressed={!isAnnual}
            onClick={() => setBillingPeriod("monthly")}
            className={`min-h-11 cursor-pointer rounded-md px-5 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#294137] ${!isAnnual ? "bg-white text-[#294137] shadow-sm" : "text-[#718578] hover:text-[#294137]"}`}
          >
            Monthly
          </Button>
          <Button variant="unstyled"
            type="button"
            aria-pressed={isAnnual}
            onClick={() => setBillingPeriod("annual")}
            className={`flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-md px-4 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#294137] ${isAnnual ? "bg-white text-[#294137] shadow-sm" : "text-[#718578] hover:text-[#294137]"}`}
          >
            Annual
            <Span className="rounded-md bg-[#d9e8df] px-2 py-1 text-[10px] font-bold text-[#3d7754]">
              Save 20%
            </Span>
          </Button>
        </Reveal>
      </div>

      <div className="mt-10 grid items-stretch gap-5 sm:grid-cols-2 xl:mt-12 xl:grid-cols-4">
        {plans.map((plan, index) => (
          <PricingCard
            key={plan.id}
            plan={plan}
            delay={index * 0.1}
            isAnnual={isAnnual}
            billingPeriod={billingPeriod}
            user={user}
            loading={isLoading}
          />
        ))}
      </div>
    </section>
  );
}
