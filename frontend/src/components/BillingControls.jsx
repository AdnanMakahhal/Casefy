import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../features/authentication/authContext";
import { planLabels } from "../features/authentication/plans";
import { sessionRequest } from "../features/admin/api";
import AccountModal from "./AccountModal";

export default function BillingControls({ user }) {
  const { getBillingStatus, openBillingPortal, refreshUser } = useAuth();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [cancelPayPal, setCancelPayPal] = useState(false);
  const [notice, setNotice] = useState("");
  async function cancelPayPalRenewal() {
    setBusy(true); setError("");
    try { const result = await sessionRequest("/billing/paypal/cancel", { method: "POST" }); await refreshUser(); setNotice(result.message); setCancelPayPal(false); }
    catch (err) { setError(err.message); } finally { setBusy(false); }
  }
  async function manage() {
    setBusy(true); setError("");
    try { const result = await openBillingPortal(); window.location.assign(result.url); }
    catch (err) { setError(err.message); setBusy(false); }
  }
  useEffect(() => {
    if (!user.stripeCustomerId && !user.paypalSubscriptionId) return;
    let active = true;
    getBillingStatus().catch((error) => { if (active) setError(error.message); });
    return () => { active = false; };
  }, [getBillingStatus, user.stripeCustomerId, user.paypalSubscriptionId]);
  return <div className="border-b border-[#CFDDD5] bg-[#f6f8f7] px-6 py-4 sm:px-8">
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div><p className="text-sm font-medium text-[#526159]">Current plan</p><span className="mt-2 inline-block rounded-full border border-[#CFDDD5] bg-[#edf3ef] px-3 py-1 text-xs font-semibold text-[#294137]">{planLabels[user.plan] || "Free"} plan</span></div>
      <div className="flex flex-wrap gap-3"><Link to="/support?category=refund" className="inline-flex min-h-11 items-center rounded-lg border border-[#CFDDD5] bg-white px-4 text-sm font-semibold text-[#294137] hover:bg-[#edf3ef]">Request refund</Link><Link to="/pricing" className="inline-flex min-h-11 items-center rounded-lg border border-[#CFDDD5] bg-white px-4 text-sm font-semibold text-[#294137] hover:bg-[#edf3ef] focus-visible:outline-2 focus-visible:outline-[#294137]">View plans</Link></div>
    </div>
    {(user.seatLimit || user.projectLimit || user.monthlyCreditLimit) && <dl className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
      {[["Seats", user.seatLimit], ["Projects", user.projectLimit], ["Credits / month", user.monthlyCreditLimit]].filter(([, limit]) => limit != null).map(([label, limit]) => <div key={label} className="rounded-lg border border-[#CFDDD5] bg-white px-4 py-3"><dt className="text-xs text-[#718578]">{label}</dt><dd className="mt-1 text-lg font-semibold tabular-nums text-[#294137]">{limit.toLocaleString("en-US")}</dd></div>)}
    </dl>}
    {user.complimentaryPlan && <div className="mt-4 rounded-lg border border-[#CFDDD5] bg-white p-4 text-xs leading-6 text-[#526159]"><strong>Complimentary {planLabels[user.complimentaryPlan]} access · {user.complimentaryStatus}</strong><p>Starts: {new Date(user.complimentaryStartsAt).toLocaleString()}</p><p>Ends: {new Date(user.complimentaryEndsAt).toLocaleString()}</p><p>No automatic charge for this complimentary access.</p></div>}
    {user.stripeCustomerId && <button type="button" disabled={busy} onClick={manage} className="mt-4 min-h-10 rounded-lg border border-[#CFDDD5] bg-white px-4 text-sm font-semibold text-[#294137] disabled:cursor-wait disabled:opacity-50">{busy ? "Opening billing..." : "Manage billing"}</button>}
    {user.paypalSubscriptionId && <div className="mt-4 rounded-lg border border-[#CFDDD5] bg-white p-4 text-xs leading-6 text-[#526159]"><strong>PayPal subscription · {user.paypalStatus}</strong><p>Reference: {user.paypalSubscriptionId}</p>{user.paypalPeriodEnd && <p>Verified paid access through: {new Date(user.paypalPeriodEnd).toLocaleString()}</p>}<div className="mt-3 flex flex-wrap gap-3">{user.paypalStatus === "APPROVAL_PENDING" && <Link to={`/checkout?plan=${user.paypalPlan}&billing=${user.paypalBilling}`} className="rounded-lg border border-[#CFDDD5] px-3 py-2 font-semibold text-[#294137]">Resume PayPal approval</Link>}{!["CANCELLED", "EXPIRED"].includes(user.paypalStatus) && <button type="button" disabled={busy} onClick={() => setCancelPayPal(true)} className="rounded-lg border border-[#CFDDD5] px-3 py-2 font-semibold text-[#8e3530]">Cancel PayPal subscription</button>}</div></div>}
    {notice && <p role="status" className="mt-3 text-xs text-[#294137]">{notice}</p>}
    {cancelPayPal && <AccountModal title="Cancel PayPal renewal?" busy={busy} onDismiss={() => setCancelPayPal(false)}><p className="text-sm leading-7 text-[#526159]">This stops recurring PayPal billing. Previously verified paid access continues through its paid-through date.</p>{error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}<div className="mt-6 flex justify-end gap-3"><button type="button" disabled={busy} onClick={() => setCancelPayPal(false)} className="min-h-11 rounded-lg border border-[#CFDDD5] px-4 text-sm font-semibold">Keep subscription</button><button type="button" disabled={busy} onClick={cancelPayPalRenewal} className="min-h-11 rounded-lg bg-[#294137] px-4 text-sm font-semibold text-white">{busy ? "Canceling..." : "Confirm cancellation"}</button></div></AccountModal>}
    {["past_due", "unpaid", "incomplete", "paused"].includes(user.subscriptionStatus) && <p className="mt-3 text-xs leading-5 text-[#526159]">Your subscription needs attention. <Link to="/support" className="rounded font-semibold text-[#294137] underline focus-visible:outline-2">Contact support</Link> for help with billing.</p>}
    {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
  </div>;
}
