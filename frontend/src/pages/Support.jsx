import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../features/authentication/authContext";
import { apiRequest, tokenKey } from "../features/authentication/api";
import SelectMenu from "../components/SelectMenu";

const inputClass = "mt-2 min-h-12 w-full rounded-lg border border-[#CFDDD5] bg-white px-4 py-3 text-base text-[#102019] placeholder:text-[#929b97] focus:outline-2 focus:outline-offset-2 focus:outline-[#294137]";

export default function Support() {
  const { user } = useAuth();
  const [params] = useSearchParams();
  const [category, setCategory] = useState(["enterprise", "refund"].includes(params.get("category")) ? params.get("category") : "support");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [reference, setReference] = useState(null);

  async function submit(event) {
    event.preventDefault();
    if (busy) return;
    const data = new FormData(event.currentTarget);
    const details = Object.fromEntries(["name", "email", "subject", "description"].map((key) => [key, data.get(key).trim()]));
    if (Object.values(details).some((value) => !value)) { setError("Please complete all fields."); return; }
    setBusy(true);
    setError("");
    try {
      const result = await apiRequest("/support", { token: user ? sessionStorage.getItem(tokenKey) : undefined, method: "POST", body: JSON.stringify({ ...details, category }) });
      setReference(result.id);
    } catch (error) { setError(error.message); }
    finally { setBusy(false); }
  }

  return <section className="mx-auto max-w-2xl px-6 py-12 sm:px-8 sm:py-16">
    <Link to="/pricing" className="rounded text-sm font-semibold text-[#294137] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#294137]">Back to plans</Link>
    <div className="mt-6 rounded-xl border border-[#CFDDD5] bg-white p-6 sm:p-8">
      <p className="text-xs font-semibold tracking-widest text-[#526159]">CASEFY SUPPORT</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">Contact support</h1>
      <p className="mt-3 text-sm leading-6 text-[#526159]">Get help with your account, billing, privacy, or an Enterprise plan. Tell us what you need.</p>
      {reference ? <div role="status" className="mt-8 rounded-lg bg-[#edf3ef] p-5 text-[#294137]"><h2 className="text-lg font-semibold">Request received</h2><p className="mt-2 text-sm leading-6">Your support request has been saved. Your reference number is #{reference}.</p></div> : <form onSubmit={submit} className="mt-8 space-y-5">
        <fieldset disabled={busy} className="space-y-5 disabled:opacity-60">
          <legend className="sr-only">Support request details</legend>
          <label className="block text-sm font-medium">Name<input name="name" autoComplete="name" defaultValue={user?.name || ""} placeholder="Your name" required maxLength={100} className={inputClass} /></label>
          <label className="block text-sm font-medium">Email<input name="email" type="email" autoComplete="email" defaultValue={user?.email || ""} readOnly={Boolean(user)} placeholder="name@company.com" required maxLength={254} className={inputClass} /></label>
          <div><p className="mb-2 text-sm font-medium">Topic</p><SelectMenu label="Support topic" value={category} onChange={setCategory} options={[{ value: "support", label: "Account & support", description: "Questions, technical issues, or billing help" }, { value: "enterprise", label: "Enterprise enquiry", description: "Custom seats, credits, and team requirements" }, { value: "refund", label: "Refund request", description: "Include the payment date and reason" }]} /></div>
          <label className="block text-sm font-medium">Subject<input key={category} name="subject" defaultValue={category === "enterprise" ? "Enterprise plan enquiry" : category === "refund" ? "Refund request" : ""} required maxLength={160} className={inputClass} /></label>
          <label className="block text-sm font-medium">Description<textarea name="description" placeholder="Describe your team's requirements, expected seats, projects, and any questions." required maxLength={5000} rows={6} className={`${inputClass} resize-y`} /></label>
        </fieldset>
        {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
        <button type="submit" disabled={busy} className="min-h-12 w-full cursor-pointer rounded-lg bg-[#294137] px-5 text-sm font-semibold text-white hover:bg-[#20332b] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#294137] disabled:cursor-wait disabled:opacity-50">{busy ? "Submitting..." : "Submit request"}</button>
      </form>}
    </div>
  </section>;
}
