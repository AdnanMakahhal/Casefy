import SupportButton from "../ui/SupportButton";
import P from "../ui/P";
import Span from "../ui/Span";
import Button from "../ui/Button";
import { useEffect, useState } from "react";
import {
  RiBankCardLine as CreditCard,
  RiArrowRightUpLine as ArrowUpRight,
  RiRefreshLine as Refresh,
  RiCheckboxCircleLine as CheckCircle,
  RiErrorWarningLine as AlertCircle,
} from "react-icons/ri";
import { useAuth } from "../features/authentication/authContext";
import { planLabels } from "../features/authentication/plans";

export default function BillingControls({ user }) {
  const { getBillingStatus, openBillingPortal } = useAuth();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const hasBilling = Boolean(user.stripeCustomerId);
  const needsAttention = ["past_due", "unpaid", "incomplete", "incomplete_expired", "paused"].includes(user.subscriptionStatus);
  const status = user.cancelAtPeriodEnd
    ? "Cancellation scheduled"
    : user.subscriptionStatus
      ? user.subscriptionStatus.replaceAll("_", " ")
      : user.complimentaryStatus
        ? `Complimentary ${user.complimentaryStatus}`
        : user.plan === "free" ? "Free plan" : "No recurring subscription";
  const endDate = user.subscriptionPeriodEnd ? new Date(user.subscriptionPeriodEnd) : null;
  const formattedDate = endDate && !Number.isNaN(endDate.getTime())
    ? endDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : null;
  const dateLabel = user.cancelAtPeriodEnd ? "Access until" : user.subscriptionStatus === "trialing" ? "Trial ends" : ["active", "past_due"].includes(user.subscriptionStatus) ? "Next renewal" : "Billing period ends";
  const limits = [
    ["Seats", user.seatLimit],
    ["Projects", user.projectLimit],
    ["Monthly credits", user.monthlyCreditLimit],
    ["Workspaces", user.plan === "free" ? 1 : null],
  ];

  async function manage() {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const result = await openBillingPortal();
      window.location.assign(result.url);
    } catch (err) {
      setError(err.message || "Could not open billing. Please try again.");
      setBusy(false);
    }
  }

  useEffect(() => {
    if (!hasBilling) return;
    let active = true;
    getBillingStatus().catch((err) => {
      if (active) setError(err.message || "Could not refresh your subscription.");
    }).finally(() => {
      if (active) setSyncing(false);
    });
    return () => { active = false; };
  }, [getBillingStatus, hasBilling, refreshKey]);

  function refresh() {
    setError("");
    setSyncing(true);
    setRefreshKey((value) => value + 1);
  }

  return (
    <div className="space-y-5 p-5 sm:p-6">
      {needsAttention && (
        <div role="status" className="flex items-start gap-3 rounded-md border border-amber-200 bg-amber-50 p-4 text-amber-950">
          <AlertCircle size={20} aria-hidden="true" className="mt-0.5 shrink-0" />
          <div>
            <h3 className="text-sm font-semibold">Your subscription needs attention</h3>
            <P variant="unstyled" className="mt-1 text-xs leading-5">Open billing to review your payment details, or <SupportButton variant="unstyled" className="rounded-md font-semibold underline underline-offset-2 focus-visible:outline-2">contact support</SupportButton> for help.</P>
          </div>
        </div>
      )}

      <div className="rounded-md border border-[#cfddd5] bg-[#f6f8f7] p-5">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <Span className="flex size-11 shrink-0 items-center justify-center rounded-md border border-[#cfddd5] bg-white text-[#294137]"><CreditCard size={22} aria-hidden="true" /></Span>
            <div>
              <P variant="unstyled" className="text-xs font-medium text-[#526159]">Current plan</P>
              <h3 className="mt-1 text-2xl font-semibold tracking-tight text-[#102019]">{planLabels[user.plan] || "Free"}</h3>
              <Span className={`mt-2 inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium capitalize ${needsAttention || user.cancelAtPeriodEnd ? "bg-amber-100 text-amber-950" : "bg-[#e5eee8] text-[#294137]"}`}>
                {needsAttention ? <AlertCircle size={14} aria-hidden="true" /> : <CheckCircle size={14} aria-hidden="true" />}{status}
              </Span>
            </div>
          </div>
          <div className="flex flex-col items-start gap-2 sm:items-end">
            {hasBilling ? (
              <Button loading={busy} onClick={manage} className="w-full sm:w-auto">
                <CreditCard size={17} aria-hidden="true" />{busy ? "Opening billing..." : "Manage billing"}<ArrowUpRight size={16} aria-hidden="true" />
              </Button>
            ) : (
              <Button to="/pricing" className="w-full sm:w-auto">Explore plans<ArrowUpRight size={16} aria-hidden="true" /></Button>
            )}
            <P variant="unstyled" className="text-xs leading-5 text-[#526159]">{hasBilling ? "Payment methods, invoices, and cancellation." : "Choose a plan that fits your workflow."}</P>
          </div>
        </div>
        {formattedDate && <P variant="unstyled" className="mt-5 border-t border-[#dce6df] pt-4 text-xs text-[#526159]">{dateLabel}: <Span className="font-semibold text-[#294137]">{formattedDate}</Span></P>}
      </div>

      <div>
        <h3 className="text-sm font-semibold text-[#102019]">Included in your plan</h3>
        <dl className="mt-3 grid grid-cols-2 overflow-hidden rounded-md border border-[#e1e9e4] lg:grid-cols-4">
          {limits.map(([label, limit], index) => (
            <div key={label} className={`min-w-0 px-4 py-4 ${index > 1 ? "border-t border-[#e1e9e4] lg:border-t-0" : ""} ${index % 2 ? "border-l border-[#e1e9e4]" : index === 2 ? "lg:border-l lg:border-[#e1e9e4]" : ""}`}>
              <dt className="text-xs text-[#526159]">{label}</dt>
              <dd className="mt-1.5 text-base font-semibold tabular-nums text-[#294137]">{limit == null ? "Unlimited" : limit.toLocaleString("en-US")}</dd>
            </div>
          ))}
        </dl>
        <Button to="/settings#credits" variant="ghost" size="sm" className="mt-2">View credit usage<ArrowUpRight size={14} aria-hidden="true" /></Button>
      </div>

      {user.complimentaryPlan && (
        <div className="rounded-md border border-[#cfddd5] bg-[#edf3ef] p-4">
          <h3 className="text-sm font-semibold text-[#294137]">Complimentary {planLabels[user.complimentaryPlan]} access</h3>
          <P variant="unstyled" className="mt-1 text-xs leading-5 text-[#526159]">No automatic charge for this complimentary access.</P>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#e1e9e4] pt-4">
        <div className="flex flex-wrap gap-2">
          {hasBilling && <Button to="/pricing" variant="outline" size="sm">Compare plans</Button>}
          {hasBilling && <SupportButton variant="ghost" size="sm" category="refund">Request refund</SupportButton>}
        </div>
        {hasBilling && <Button variant="ghost" size="sm" disabled={syncing || busy} onClick={refresh}><Refresh size={15} aria-hidden="true" className={syncing ? "motion-safe:animate-spin" : ""} />{syncing ? "Refreshing..." : "Refresh status"}</Button>}
      </div>
      {error && <P variant="unstyled" role="alert" className="rounded-md border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-700">{error}</P>}
    </div>
  );
}
