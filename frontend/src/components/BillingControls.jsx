import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { RiBankCardLine as CreditCard } from "react-icons/ri";
import { useAuth } from "../features/authentication/authContext";
import { planLabels } from "../features/authentication/plans";

export default function BillingControls({ user }) {
  const { getBillingStatus, openBillingPortal } = useAuth();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const limits = [
    ["Seats", user.seatLimit],
    ["Projects", user.projectLimit],
    ["Credits / month", user.monthlyCreditLimit],
  ].filter(([, limit]) => limit != null);
  const needsAttention = ["past_due", "unpaid", "incomplete", "paused"].includes(user.subscriptionStatus);
  const status = user.cancelAtPeriodEnd
    ? "Cancels at period end"
    : user.subscriptionStatus
      ? user.subscriptionStatus.replaceAll("_", " ")
      : user.complimentaryStatus
        ? `Complimentary ${user.complimentaryStatus}`
        : user.plan === "free" ? "Free plan" : "No recurring subscription";
  const secondaryButton = "inline-flex min-h-11 items-center justify-center rounded-md border border-[#CFDDD5] bg-white px-4 text-sm font-semibold text-[#294137] hover:bg-[#edf3ef] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#294137]";

  async function manage() {
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
  useEffect(() => {
    if (!user.stripeCustomerId) return;
    let active = true;
    getBillingStatus().catch((error) => {
      if (active) setError(error.message);
    });
    return () => { active = false; };
  }, [getBillingStatus, user.stripeCustomerId]);

  return (
    <div>
      <div>
        <div className="flex min-h-24 items-center gap-3 px-5 py-5 text-left sm:gap-4 sm:px-8">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-md bg-[#edf3ef] text-[#294137]">
            <CreditCard size={22} aria-hidden="true" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold text-[#102019]">Current plan</span>
            <span className="mt-1 block text-xs capitalize text-[#526159]">{status}</span>
          </span>
          <span className="shrink-0 rounded-full border border-[#CFDDD5] bg-[#edf3ef] px-3 py-1.5 text-xs font-semibold text-[#294137]">
            {planLabels[user.plan] || "Free"}
          </span>
        </div>

        {(limits.length > 0 || user.complimentaryPlan) && <div className="space-y-6 border-t border-[#e1e9e4] bg-[#f6f8f7] px-5 py-5 sm:px-8 sm:py-6">
          {limits.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-[#526159]">Plan limits</h3>
              <dl className="mt-3 grid gap-3 sm:grid-cols-3">
                {limits.map(([label, limit]) => (
                  <div key={label} className="rounded-md border border-[#e1e9e4] bg-white px-4 py-3">
                    <dt className="text-xs text-[#526159]">{label}</dt>
                    <dd className="mt-1 text-lg font-semibold tabular-nums text-[#294137]">{limit.toLocaleString("en-US")}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
          {user.complimentaryPlan && (
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-[#294137]">Complimentary {planLabels[user.complimentaryPlan]} access</h3>
                <span className="text-xs capitalize text-[#526159]">{user.complimentaryStatus}</span>
              </div>
              <p className="mt-3 text-xs leading-5 text-[#526159]">No automatic charge for this complimentary access.</p>
            </div>
          )}
        </div>}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-5 border-t border-[#CFDDD5] px-5 py-5 sm:px-8">
        <div className="min-w-0 flex-1 sm:min-w-48">
          <h3 className="text-sm font-semibold">Manage your subscription</h3>
          <p className="mt-1 text-xs leading-6 text-[#526159]">
            {user.stripeCustomerId ? "View invoices and update your payment details." : "Explore plans and choose the right fit for you."}
          </p>
        </div>
        <div className="ml-auto flex w-full flex-wrap justify-end gap-2 sm:w-auto">
          <Link to="/support?category=refund" className={secondaryButton}>Request refund</Link>
          <Link to="/pricing" className={secondaryButton}>View plans</Link>
          {user.stripeCustomerId && (
            <button type="button" disabled={busy} onClick={manage} className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-md bg-[#294137] px-4 text-sm font-semibold text-white hover:bg-[#20332b] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#294137] disabled:cursor-wait disabled:opacity-50">
              <CreditCard size={16} aria-hidden="true" />
              {busy ? "Opening billing..." : "Manage billing"}
            </button>
          )}
        </div>
      </div>
      {needsAttention && (
        <p role="status" className="mx-5 mb-5 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900 sm:mx-8">
          Your subscription needs attention. <Link to="/support" className="rounded-md font-semibold underline focus-visible:outline-2 focus-visible:outline-offset-2">Contact support</Link> for help with billing.
        </p>
      )}
      {error && <p role="alert" className="mx-5 mb-5 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700 sm:mx-8">{error}</p>}
    </div>
  );
}

