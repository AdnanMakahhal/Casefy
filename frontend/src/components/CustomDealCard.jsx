import { useState } from "react";
import { sessionRequest } from "../lib/api";
import { formatMoney } from "../lib/format";

export default function CustomDealCard({ deal, customer = false, onChanged }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const expired = new Date(deal.expiresAt) <= new Date();
  async function act(action) {
    setBusy(true); setError("");
    try {
      const result = await sessionRequest(`/support/deals/${deal.id}/${action === "checkout" ? "checkout" : "respond"}`, { method: "POST", body: JSON.stringify({ action }) });
      if (result.url) { window.location.assign(result.url); return; }
      await onChanged?.();
    } catch (error) { setError(error.message); }
    finally { setBusy(false); }
  }
  const button = "min-h-11 rounded-md border border-[#CFDDD5] bg-white px-3 text-xs font-semibold text-[#294137] disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2";
  return <article className="my-3 rounded-md border border-[#b9cec0] bg-[#edf3ef] p-4 text-[#102019]">
    <div className="flex flex-wrap justify-between gap-2"><h4 className="text-sm font-bold">Your custom plan</h4><span className="text-xs capitalize">{expired && deal.status === "offered" ? "Expired" : deal.status}</span></div>
    <p className="mt-2 text-xl font-bold">{formatMoney(deal.amount, deal.currency)}<span className="text-xs font-normal"> / {deal.interval}</span></p>
    <p className="mt-2 text-xs leading-6">{deal.seats} seats · {deal.projects} projects · {deal.monthlyCredits.toLocaleString()} credits / month</p>
    <p className="mt-2 whitespace-pre-wrap text-xs leading-6">{deal.notes}</p>
    {["offered", "accepted"].includes(deal.status) && <p className="mt-2 text-xs leading-5">Valid until {new Date(deal.expiresAt).toLocaleDateString()}. Access starts after payment confirmation.</p>}
    {customer && !expired && deal.status === "offered" && <div className="mt-3 flex flex-wrap gap-2"><button className={button} disabled={busy} onClick={() => act("accept")}>Accept offer</button><button className={button} disabled={busy} onClick={() => act("decline")}>Decline</button></div>}
    {customer && !expired && deal.status === "accepted" && <button className={`${button} mt-3`} disabled={busy} onClick={() => act("checkout")}>{busy ? "Opening checkout..." : "Pay & activate plan"}</button>}
    {error && <p role="alert" className="mt-3 text-xs text-red-700">{error}</p>}
  </article>;
}
