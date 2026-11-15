import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../features/authentication/authContext";
import { planLabels } from "../features/authentication/plans";

export default function BillingControls({ user }) {
  const { getBillingStatus, openBillingPortal } = useAuth();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
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
    return () => {
      active = false;
    };
  }, [getBillingStatus, user.stripeCustomerId]);
  return (
    <div className="border-b border-[#CFDDD5] bg-[#f6f8f7] px-6 py-4 sm:px-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-[#526159]">Current plan</p>
          <span className="mt-2 inline-block rounded-full border border-[#CFDDD5] bg-[#edf3ef] px-3 py-1 text-xs font-semibold text-[#294137]">
            {planLabels[user.plan] || "Free"} plan
          </span>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            to="/support?category=refund"
            className="inline-flex min-h-11 items-center rounded-lg border border-[#CFDDD5] bg-white px-4 text-sm font-semibold text-[#294137] hover:bg-[#edf3ef]"
          >
            Request refund
          </Link>
          <Link
            to="/pricing"
            className="inline-flex min-h-11 items-center rounded-lg border border-[#CFDDD5] bg-white px-4 text-sm font-semibold text-[#294137] hover:bg-[#edf3ef] focus-visible:outline-2 focus-visible:outline-[#294137]"
          >
            View plans
          </Link>
        </div>
      </div>
      {(user.seatLimit || user.projectLimit || user.monthlyCreditLimit) && (
        <dl className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[
            ["Seats", user.seatLimit],
            ["Projects", user.projectLimit],
            ["Credits / month", user.monthlyCreditLimit],
          ]
            .filter(([, limit]) => limit != null)
            .map(([label, limit]) => (
              <div
                key={label}
                className="rounded-lg border border-[#CFDDD5] bg-white px-4 py-3"
              >
                <dt className="text-xs text-[#718578]">{label}</dt>
                <dd className="mt-1 text-lg font-semibold tabular-nums text-[#294137]">
                  {limit.toLocaleString("en-US")}
                </dd>
              </div>
            ))}
        </dl>
      )}
      {user.complimentaryPlan && (
        <div className="mt-4 rounded-lg border border-[#CFDDD5] bg-white p-4 text-xs leading-6 text-[#526159]">
          <strong>
            Complimentary {planLabels[user.complimentaryPlan]} access ·{" "}
            {user.complimentaryStatus}
          </strong>
          <p>Starts: {new Date(user.complimentaryStartsAt).toLocaleString()}</p>
          <p>Ends: {new Date(user.complimentaryEndsAt).toLocaleString()}</p>
          <p>No automatic charge for this complimentary access.</p>
        </div>
      )}
      {user.stripeCustomerId && (
        <button
          type="button"
          disabled={busy}
          onClick={manage}
          className="mt-4 min-h-10 rounded-lg border border-[#CFDDD5] bg-white px-4 text-sm font-semibold text-[#294137] disabled:cursor-wait disabled:opacity-50"
        >
          {busy ? "Opening billing..." : "Manage billing"}
        </button>
      )}
      {["past_due", "unpaid", "incomplete", "paused"].includes(
        user.subscriptionStatus,
      ) && (
        <p className="mt-3 text-xs leading-5 text-[#526159]">
          Your subscription needs attention.{" "}
          <Link
            to="/support"
            className="rounded font-semibold text-[#294137] underline focus-visible:outline-2"
          >
            Contact support
          </Link>{" "}
          for help with billing.
        </p>
      )}
      {error && (
        <p role="alert" className="mt-3 text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
