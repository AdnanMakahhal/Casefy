import P from "../ui/P";
import Span from "../ui/Span";
import Button from "../ui/Button";
import { useState } from "react";

import useCredits from "../features/authentication/useCredits";

const labels = { generation_text: "Text generation", generation_documents: "Document generation", generation_browser: "Browser testing", allowance: "Plan allowance", refund: "Returned credits", adjustment: "Account adjustment" };

export default function CreditUsage({ user }) {
  const [page, setPage] = useState(1);
  const { data, loading, error } = useCredits(user.id, page);
  if (loading) return <P variant="unstyled" role="status" className="p-6 text-sm text-[#526159]">Loading credit activity...</P>;
  if (error) return <P variant="unstyled" role="alert" className="p-6 text-sm text-red-700">{error}</P>;
  const usage = data.breakdown.filter((item) => item._sum.amount < 0);
  const used = usage.reduce((sum, item) => sum - item._sum.amount, 0);
  const allowanceUsed = usage.filter((item) => !item.kind.startsWith("unlimited_")).reduce((sum, item) => sum - item._sum.amount, 0);
  const percent = data.unlimited ? 0 : Math.min(100, Math.round(allowanceUsed / Math.max(1, data.allowance) * 100));
  const displayCredits = (value) => value == null ? "Unlimited" : value.toLocaleString();
  return <div className="space-y-6 px-5 py-6 sm:px-8">
    <div className="grid gap-3 sm:grid-cols-3">
      {[["Credits remaining", data.balance], ["Used this period", used], ["Monthly allowance", data.allowance]].map(([label, value]) => <div key={label} className="rounded-md border border-[#CFDDD5] bg-[#f6f8f7] p-4"><P variant="unstyled" className="text-xs text-[#526159]">{label}</P><P variant="unstyled" className="mt-2 text-2xl font-bold tabular-nums">{displayCredits(value)}</P></div>)}
    </div>
    {data.unlimited ? <P variant="unstyled" className="rounded-md bg-[#edf3ef] p-4 text-sm text-[#294137]">Ultra includes unlimited credits. Activity is recorded without reducing your access.</P> : <div>
      <div className="mb-2 flex justify-between gap-3 text-xs text-[#526159]"><Span>{percent}% of allowance used</Span><Span>Resets {new Date(data.periodEnd).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</Span></div>
      <progress aria-label="Monthly credit usage" max={Math.max(1, data.allowance)} value={Math.min(allowanceUsed, data.allowance)} className="h-2 w-full accent-[#294137]" />
      <P variant="unstyled" className="mt-2 text-xs leading-6 text-[#526159]">Credits renew monthly and do not roll over. Request previews and support conversations are free. Each activity below records credits used or returned.</P>
    </div>}
    <div><h3 className="text-sm font-semibold">Usage by activity</h3>
      <div className="mt-3 space-y-3">{usage.length ? usage.map((item) => <div key={item.kind} className="flex items-center justify-between gap-4 rounded-md bg-[#f6f8f7] p-3 text-sm"><Span>{labels[item.kind.replace(/^unlimited_/, "")] || item.kind.replaceAll("_", " ")}</Span><Span className="font-semibold tabular-nums">{(-item._sum.amount).toLocaleString()} credits</Span></div>) : <P variant="unstyled" className="text-sm text-[#526159]">No credits used this period.</P>}</div>
    </div>
    <div><h3 className="text-sm font-semibold">Credit activity</h3><div className="mt-3 divide-y divide-[#e1e9e4]">
      {data.entries.map((entry) => <div key={entry.id} className="flex items-start justify-between gap-4 py-3"><div className="min-w-0"><P variant="unstyled" className="text-sm font-medium">{entry.description}</P><P variant="unstyled" className="mt-1 text-xs text-[#526159]">{new Date(entry.createdAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })} · {labels[entry.kind.replace(/^unlimited_/, "")] || entry.kind}</P></div><Span className={`shrink-0 text-sm font-semibold tabular-nums ${entry.amount > 0 ? "text-[#387c4d]" : "text-[#102019]"}`}>{entry.amount > 0 ? "+" : ""}{entry.amount.toLocaleString()}</Span></div>)}
    </div><div className="mt-3 flex items-center justify-between text-xs text-[#526159]"><Span>{data.total} entries · Page {page}</Span><div className="flex gap-4"><Button variant="unstyled" type="submit" className="min-h-11 disabled:opacity-40" disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</Button><Button variant="unstyled" type="submit" className="min-h-11 disabled:opacity-40" disabled={page * 20 >= data.total} onClick={() => setPage(page + 1)}>Next</Button></div></div></div>
    {!data.unlimited && <Button variant="primary" size="custom" to="/checkout?plan=ultra&billing=monthly" className="min-h-11 px-4">Upgrade to Ultra for unlimited credits</Button>}
  </div>;
}
