import SupportButton from "../ui/SupportButton";
import H2 from "../ui/H2";
import P from "../ui/P";
import Span from "../ui/Span";
import Button from "../ui/Button";
import Heading from "../ui/Heading";
import { useEffect, useRef, useState } from "react";
import {
  RiArrowLeftLine as ArrowLeft,
  RiArrowRightLine as ArrowRight,
  RiCheckLine as Check,
  RiArrowRightSLine as ChevronRight,
  RiCheckboxCircleLine as CircleCheck,
  RiBankCardLine as CreditCard,
  RiLoader4Line as LoaderCircle,
  RiLock2Line as LockKeyhole,
  RiShieldCheckLine as ShieldCheck,
} from "react-icons/ri";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import { homeForRole, useAuth } from "../features/authentication/authContext";
import { billingRequest } from "../lib/api";
import { planLabels, planRank } from "../features/authentication/plans";
import Avatar from "../components/Avatar";
import CheckoutPlanPreview from "../features/checkout/CheckoutPlanPreview";
import { formatCheckoutMoney } from "../features/checkout/pricing";
import CheckoutSkeleton from "../ui/CheckoutSkeleton";

const planDetails = {
  free: {
    description: "A starting point for your testing workflow.",
    features: [
      "1 workspace",
      "2 active projects",
      "100 credits per month",
      "Documents and user stories",
    ],
  },
  plus: {
    description: "More coverage for your everyday QA work.",
    features: [
      "10 active projects",
      "1,500 credits per month",
      "Live browser testing",
      "Documents, diagrams, and URLs",
    ],
  },
  pro: {
    description: "Keep your team moving with every release.",
    features: [
      "2 seats included",
      "Unlimited projects",
      "6,000 credits per month",
      "Live runs and CI/CD",
    ],
  },
  ultra: {
    description: "Unlimited testing capacity for your organization.",
    features: [
      "Unlimited seats and workspaces",
      "Unlimited credits and projects",
      "Unlimited live testing",
      "All testing workflows",
    ],
  },
};
const greenButton =
  "inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-md bg-[#294137] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#20332b] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#294137]";

function CheckoutPage({ planKey, billing, canceled }) {
  const { user, createCheckout, createUpgrade, openBillingPortal } = useAuth();
  const [catalog, setCatalog] = useState(null);
  const [catalogError, setCatalogError] = useState("");
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);
  const isPaid = ["plus", "pro", "ultra"].includes(planKey);
  const hasSubscription = Boolean(
    user.subscriptionStatus &&
    !["canceled", "incomplete_expired"].includes(user.subscriptionStatus),
  );
  const alreadyIncluded = planRank[planKey] <= (planRank[user.plan] || 0);
  const isUpgrade =
    isPaid &&
    hasSubscription &&
    ["active", "trialing"].includes(user.subscriptionStatus) &&
    !alreadyIncluded;
  const details = planDetails[planKey];

  useEffect(() => {
    if (!isPaid) return;
    let active = true;
    billingRequest("/plans")
      .then((data) => {
        if (active) setCatalog(data);
      })
      .catch((error) => {
        if (active) setCatalogError(error.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [isPaid, attempt]);

  if (isPaid && loading) return <CheckoutSkeleton />;

  const price = catalog?.plans?.[planKey]?.[billing];
  const amount = price
    ? formatCheckoutMoney(
        price.amount,
        price.currency,
        price.amount % 100 === 0 ? 0 : 2,
      )
    : null;
  const period =
    (price?.interval || (billing === "annual" ? "year" : "month")) === "year"
      ? "year"
      : "month";
  const priceLabel =
    planKey === "free"
      ? "Free"
      : amount || (loading ? "Loading..." : "Unavailable");
  const monthlyPrice = catalog?.plans?.[planKey]?.monthly;
  const annualBase = monthlyPrice ? monthlyPrice.amount * 12 : 0;
  const annualSavings =
    billing === "annual" &&
    price?.interval === "year" &&
    monthlyPrice?.currency === price.currency
      ? Math.max(0, annualBase - price.amount)
      : 0;
  const annualDiscount = annualSavings
    ? Math.round((annualSavings / annualBase) * 100)
    : 0;
  const money = (cents) => formatCheckoutMoney(cents, price?.currency);

  async function submit(event) {
    event.preventDefault();
    if (
      pending.current ||
      !isPaid ||
      !price ||
      alreadyIncluded ||
      (hasSubscription && !isUpgrade)
    )
      return;
    pending.current = true;
    setBusy(true);
    setError("");
    try {
      const result = await (isUpgrade
        ? createUpgrade(planKey, billing)
        : createCheckout(planKey, billing));
      window.location.assign(result.url);
    } catch (error) {
      setError(error.message);
      setBusy(false);
      pending.current = false;
    }
  }

  async function manageBilling() {
    setBusy(true);
    setError("");
    try {
      const result = await openBillingPortal();
      window.location.assign(result.url);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }
  return (
    <section className="mx-auto max-w-6xl px-4 pt-5 pb-8 text-[#102019] sm:px-8 sm:pt-6 sm:pb-12">
      <div className="flex justify-start">
        <Link
          to="/pricing"
          aria-label="Back to plans"
          title="Back to plans"
          className="group inline-flex size-11 items-center justify-center rounded-full border border-[#CFDDD5] bg-white text-[#294137] transition-colors hover:border-[#9bb4a5] hover:bg-[#edf3ef] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#294137]"
        >
          <ArrowLeft
            size={19}
            aria-hidden="true"
            className="transition-transform group-hover:-translate-x-0.5 motion-reduce:transition-none"
          />
        </Link>
      </div>

      <header className="mx-auto mt-2 max-w-2xl text-center">
        <Heading
          as="h1"
          className="text-4xl leading-[1.12] font-extrabold tracking-tight sm:text-5xl"
        >
          Better testing starts here.
        </Heading>
        <P variant="unstyled" className="mx-auto mt-5 max-w-lg text-base leading-7 text-[#526159]">
          {isPaid
            ? "Review your plan, then choose a secure payment method."
            : planKey === "free"
              ? "Your testing workflow, ready when you are."
              : "Let’s find the right fit for your team."}
        </P>
      </header>

      <ol
        aria-label="Checkout progress"
        className="mx-auto mt-6 flex max-w-lg items-center justify-center gap-3 text-xs font-semibold sm:gap-5 sm:text-sm"
      >
        <li className="flex flex-col items-center gap-2 text-[#526159] sm:flex-row">
          <Span variant="accent" className="flex size-6 items-center justify-center rounded-full bg-[#e2ece6]">
            <Check size={14} aria-hidden="true" />
          </Span>
          Choose plan
        </li>
        <ChevronRight
          size={14}
          className="shrink-0 text-[#929b97]"
          aria-hidden="true"
        />
        <li
          aria-current="step"
          className="flex flex-col items-center gap-2 text-[#294137] sm:flex-row"
        >
          <Span className="flex size-6 items-center justify-center rounded-full bg-[#294137] text-white">
            2
          </Span>
          Review
        </li>
        <ChevronRight
          size={14}
          className="shrink-0 text-[#929b97]"
          aria-hidden="true"
        />
        <li className="flex flex-col items-center gap-2 text-[#526159] sm:flex-row">
          <Span className="flex size-6 items-center justify-center rounded-full border border-[#CFDDD5] bg-white">
            3
          </Span>
          {isPaid ? "Payment" : "Get started"}
        </li>
      </ol>

      {canceled && (
        <div
          role="status"
          className="mt-8 rounded-md border border-[#CFDDD5] bg-[#edf3ef] px-5 py-4 text-sm leading-6 text-[#294137]"
        >
          You left Stripe Checkout. Your plan has not changed, and you can
          continue whenever you’re ready.
        </div>
      )}

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <CheckoutPlanPreview
          planName={`Casefy ${planLabels[planKey]}`}
          priceLabel={priceLabel}
          period={period}
          hasPrice={Boolean(price)}
          loading={isPaid && loading}
          error={catalogError || (isPaid && !loading && !price)}
          user={user}
          features={details.features}
          annualSavings={annualSavings}
          annualDiscount={annualDiscount}
          annualBase={annualBase}
          money={money}
          isFree={planKey === "free"}

          busy={busy}
        />

        <form
          onSubmit={submit}
          aria-labelledby="checkout-details-heading"
          className="overflow-hidden rounded-md border border-[#CFDDD5] bg-white"
        >
          <div className="p-6 sm:p-8">
            <H2 variant="unstyled"
              id="checkout-details-heading"
              className="text-xl font-bold tracking-tight"
            >
              Review your details
            </H2>
            <P variant="unstyled" className="mt-2 text-sm leading-6 text-[#526159]">
              Your plan will be linked to this Casefy account.
            </P>
            <div className="mt-6 flex items-center gap-4 rounded-md border border-[#CFDDD5] bg-[#f6f8f7] p-4">
              <Avatar user={user} className="size-11 text-sm" />
              <div className="min-w-0">
                <P variant="unstyled" className="break-words text-sm font-semibold">{user.name}</P>
                <P variant="unstyled" className="mt-1 break-all text-sm text-[#526159]">
                  {user.email}
                </P>
              </div>
              <CircleCheck
                size={19}
                className="ml-auto shrink-0 text-[#294137]"
                aria-label="Signed in"
              />
            </div>

            <dl className="mt-6 divide-y divide-[#e6eee9] text-sm">
              {user.workspaceName && (
                <div className="flex items-start justify-between gap-5 py-4">
                  <dt className="shrink-0 text-[#526159]">Workspace</dt>
                  <dd className="min-w-0 break-words text-right font-medium">
                    {user.workspaceName}
                  </dd>
                </div>
              )}
              <div className="flex items-center justify-between gap-5 py-4">
                <dt className="text-[#526159]">Plan</dt>
                <dd className="font-medium">{planLabels[planKey]}</dd>
              </div>
              <div className="flex items-center justify-between gap-5 py-4">
                <dt className="text-[#526159]">Billing</dt>
                <dd className="text-right font-medium">
                  {planKey === "free"
                    ? "No payment required"
                    : billing === "annual"
                        ? "Annual subscription"
                        : "Monthly subscription"}
                </dd>
              </div>
              {annualSavings > 0 && (
                <>
                  <div className="flex items-center justify-between gap-5 py-4">
                    <dt className="text-[#526159]">
                      12 months at monthly rate
                    </dt>
                    <dd className="font-medium">{money(annualBase)}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-5 py-4 text-[#294137]">
                    <dt>Annual savings ({annualDiscount}%)</dt>
                    <dd className="font-semibold">−{money(annualSavings)}</dd>
                  </div>
                </>
              )}
              <div className="flex items-baseline justify-between gap-5 py-5">
                <dt className="font-semibold">
                  {isPaid
                    ? billing === "annual"
                      ? "Annual total"
                      : "Subscription price"
                    : "Price"}
                </dt>
                <dd className="text-right">
                  <Span className="text-xl font-bold tracking-tight">
                    {priceLabel}
                  </Span>
                  {price && (
                    <Span className="ml-1 text-xs text-[#526159]">
                      / {period}
                    </Span>
                  )}
                </dd>
              </div>
            </dl>

            {catalogError && isPaid && (
              <div
                role="alert"
                className="mt-3 rounded-md border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-800"
              >
                <P variant="unstyled">{catalogError}</P>
                <Button variant="unstyled"
                  type="button"
                  onClick={() => {
                    setCatalogError("");
                    setLoading(true);
                    setAttempt((value) => value + 1);
                  }}
                  className="mt-2 min-h-9 cursor-pointer rounded-md font-semibold underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-800"
                >
                  Try loading prices again
                </Button>
              </div>
            )}
            {!loading && catalog && isPaid && !price && (
              <div
                role="status"
                className="mt-3 rounded-md bg-[#edf3ef] p-4 text-sm leading-6 text-[#294137]"
              >
                This billing option isn’t available.{" "}
                <Link
                  to={`/checkout?plan=${planKey}&billing=monthly`}
                  className="rounded-md font-semibold underline focus-visible:outline-2"
                >
                  Choose monthly billing
                </Link>{" "}
                to continue.
              </div>
            )}

            <div className="mt-4 border-t border-[#CFDDD5] pt-6">
              {alreadyIncluded ? (
                <>
                  <Button variant="secondary" size="custom"
                    type="button"
                    disabled
                    className="mt-2 min-h-12 w-full cursor-not-allowed px-5 text-[#526159]"
                  >
                    {user.plan === planKey
                      ? "Current plan"
                      : "Included in your current plan"}
                  </Button>
                  <Link
                    to={homeForRole(user.role)}
                    className="mt-4 block text-center text-sm font-semibold text-[#294137] underline"
                  >
                    Open workspace
                  </Link>
                </>
              ) : isUpgrade ? (
                <>
                  <P variant="unstyled" className="text-sm leading-6 text-[#526159]">
                    Upgrade your existing subscription from{" "}
                    {planLabels[user.plan]} to {planLabels[planKey]}. Stripe
                    will show the prorated amount and renewal details for your
                    confirmation.
                  </P>
                  <Button variant="unstyled"
                    type="submit"
                    disabled={busy || loading || !price}
                    className={`${greenButton} mt-5 disabled:cursor-not-allowed disabled:opacity-50`}
                  >
                    {busy ? "Opening Stripe..." : "Review upgrade with Stripe"}
                  </Button>
                </>
              ) : hasSubscription ? (
                <>
                  <P variant="unstyled" className="text-sm leading-6 text-[#526159]">
                    Manage your existing subscription and payment details in
                    Stripe before changing this plan.
                  </P>
                  <Button variant="unstyled"
                    type="button"
                    disabled={busy}
                    onClick={manageBilling}
                    className={`${greenButton} mt-5 disabled:cursor-wait disabled:opacity-50`}
                  >
                    {busy ? "Opening billing..." : "Manage billing"}
                  </Button>
                </>
              ) : planKey === "free" ? (
                <>
                  <div className="flex items-center gap-2 text-sm font-semibold text-[#294137]">
                    <CircleCheck size={18} aria-hidden="true" />
                    No payment details needed
                  </div>
                  <P variant="unstyled" className="mt-2 text-sm leading-6 text-[#526159]">
                    Continue to your workspace and start organizing your
                    testing.
                  </P>
                  <Link
                    to={homeForRole(user.role)}
                    className={`${greenButton} mt-5`}
                  >
                    Continue to workspace
                    <ArrowRight size={17} aria-hidden="true" />
                  </Link>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2 text-sm font-semibold text-[#294137]">
                    <LockKeyhole size={17} aria-hidden="true" />
                    Secure payment with Stripe
                  </div>
                  <P variant="unstyled" className="mt-2 text-sm leading-6 text-[#526159]">
                    Enter your payment details on Stripe’s secure checkout page.
                  </P>
                  <Button variant="unstyled"
                    type="submit"
                    disabled={busy || loading || !price}
                    aria-label={
                      busy ? "Processing checkout" : "Continue to Stripe"
                    }
                    aria-busy={busy}
                    className={`mt-5 flex min-h-14 w-full cursor-pointer items-center justify-center gap-2 rounded-md border border-[#5750e6] bg-[#635BFF] px-6 font-[Arial,Helvetica,sans-serif] text-[18px] leading-none font-semibold tracking-[-0.035em] text-white shadow-[0_4px_12px_#635bff20] transition-[background-color,box-shadow,transform] duration-150 hover:bg-[#5851ea] hover:shadow-[0_6px_16px_#635bff30] active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#635BFF] motion-reduce:transition-none disabled:translate-y-0 disabled:opacity-60 disabled:shadow-none ${busy ? "disabled:cursor-wait" : "disabled:cursor-not-allowed"}`}
                  >
                    {busy ? (
                      <>
                        <LoaderCircle
                          size={20}
                          className="animate-spin motion-reduce:animate-none"
                          aria-hidden="true"
                        />
                        <Span>Processing...</Span>
                      </>
                    ) : (
                      <Span className="inline-flex items-center justify-center gap-1">
                        <Span>Continue to</Span>
                        <img
                          src="/Payment_Logos/Strips_Logo.svg"
                          alt=""
                          aria-hidden="true"
                          className="h-9 w-[72px] object-contain brightness-0 invert"
                        />
                      </Span>
                    )}
                  </Button>
                  <P variant="unstyled" role="status" className="sr-only">
                    {busy
                      ? "Opening secure payment checkout. Please wait."
                      : ""}
                  </P>
                  <P variant="unstyled" className="mt-4 text-center text-xs leading-5 text-[#6c7771]">
                    Renews automatically each {period}. For plan changes or
                    cancellation,{" "}
                    <SupportButton variant="unstyled"

                      className="rounded-md underline hover:text-[#294137] focus-visible:outline-2 focus-visible:outline-[#294137]"
                    >
                      contact support
                    </SupportButton>
                    .
                  </P>
                </>
              )}
              {error && (
                <P variant="unstyled"
                  role="alert"
                  className="mt-4 rounded-md border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-800"
                >
                  {error}
                </P>
              )}
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 border-t border-[#CFDDD5] bg-[#f6f8f7] px-5 py-4 text-xs text-[#526159]">
            <Span className="inline-flex items-center gap-1.5">
              <ShieldCheck size={15} aria-hidden="true" />
              Secure checkout
            </Span>
            <Span className="inline-flex items-center gap-1.5">
              <CreditCard size={15} aria-hidden="true" />
              Payment details stay with your payment provider
            </Span>
          </div>
        </form>
      </div>
      <P variant="unstyled" className="mt-7 text-center text-sm text-[#526159]">
        Have a question?{" "}
        <SupportButton variant="unstyled"

          className="rounded-md font-semibold text-[#294137] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#294137]"
        >
          Contact support
        </SupportButton>
      </P>
    </section>
  );
}

export default function Checkout() {
  const [searchParams] = useSearchParams();
  const planKey = searchParams.get("plan");
  const billing = searchParams.get("billing") || "monthly";
  if (
    !Object.hasOwn(planLabels, planKey) ||
    !["monthly", "annual"].includes(billing)
  )
    return <Navigate to="/pricing" replace />;
  return (
    <CheckoutPage
      key={`${planKey}-${billing}`}
      planKey={planKey}
      billing={billing}
      canceled={searchParams.has("canceled")}
    />
  );
}
