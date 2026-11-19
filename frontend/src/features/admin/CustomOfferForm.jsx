import { useState } from "react";
import { adminRequest } from "./api";

export default function CustomOfferForm({ request, onSaved }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(event) {
    event.preventDefault(); setBusy(true); setError("");
    const form = new FormData(event.currentTarget);
    try {
      const currency = form.get("currency");
      const amount = Math.round(Number(form.get("price")) * (currency === "jod" ? 1000 : 100));
      await adminRequest(`/inbox/${request.id}/offer`, { method: "POST", body: JSON.stringify({ amount, currency, interval: form.get("interval"), seats: Number(form.get("seats")), projects: Number(form.get("projects")), monthlyCredits: Number(form.get("monthlyCredits")), notes: form.get("notes") }) });
      onSaved();
    } catch (error) { setError(error.message); }
    finally { setBusy(false); }
  }
  const input = "mt-1 min-h-11 w-full rounded-md border border-[#CFDDD5] bg-white px-3 py-2 text-sm";
  return <form onSubmit={submit} className="rounded-md border border-[#CFDDD5] bg-[#f6f8f7] p-4">
    <h3 className="text-sm font-bold">Approve a custom offer</h3><p className="mt-1 text-xs leading-6 text-[#526159]">Set the customer's price and limits. They can accept the agreement and pay through checkout. Offers expire after 14 days.</p>
    <fieldset disabled={busy} className="mt-4 grid gap-3 sm:grid-cols-2">
      <label className="text-xs font-medium">Price per billing period<input name="price" type="number" min="0.01" max="1000000" step="0.001" required className={input} /></label>
      <label className="text-xs font-medium">Currency<select name="currency" className={input}><option value="usd">USD</option><option value="eur">EUR</option><option value="gbp">GBP</option><option value="jod">JOD</option></select></label>
      <label className="text-xs font-medium">Billing period<select name="interval" className={input}><option value="month">Monthly</option><option value="year">Yearly</option></select></label>
      {[["seats", "Seats"], ["projects", "Projects"], ["monthlyCredits", "Credits per month"]].map(([key, label]) => <label key={key} className="text-xs font-medium">{label}<input name={key} type="number" min="1" max="100000000" step="1" required defaultValue={request.details?.[key] || ""} className={input} /></label>)}
      <label className="text-xs font-medium sm:col-span-2">Agreement terms<textarea name="notes" required maxLength={2000} rows={3} className={input} placeholder="Include the agreed service, limits, and any special arrangements." /></label>
    </fieldset>
    {error && <p role="alert" className="mt-3 text-xs text-red-700">{error}</p>}
    <button disabled={busy} className="admin-button primary mt-4">{busy ? "Saving offer..." : "Approve & send offer"}</button>
  </form>;
}
