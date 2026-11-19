import { useState } from "react";
import { Link } from "react-router-dom";
import useCredits from "../features/authentication/useCredits";

const labels = { generation_text: "Text generation", generation_documents: "Document generation", generation_browser: "Browser testing", allowance: "Plan allowance", refund: "Returned credits", adjustment: "Account adjustment" };

export default function CreditUsage({ user }) {
  const [page, setPage] = useState(1);
  const { data, loading, error } = useCredits(user.id, page);
  if (loading) return <p role="status" className="p-6 text-sm text-[#526159]">Loading credit activity...</p>;
  if (error) return <p role="alert" className="p-6 text-sm text-red-700">{error}</p>;
  const usage = data.breakdown.filter((item) => item._sum.amount < 0);
  const used = usage.reduce((sum, item) => sum - item._sum.amount, 0);
  const percent = Math.min(100, Math.round(used / Math.max(1, data.allowance) * 100));
  return <div className="space-y-6 px-5 py-6 sm:px-8">
    <div className="grid gap-3 sm:grid-cols-3">
      {[["Credits remaining", data.balance], ["Used this period", used], ["Monthly allowance", data.allowance]].map(([label, value]) => <div key={label} className="rounded-md border border-[#CFDDD5] bg-[#f6f8f7] p-4"><p className="text-xs text-[#526159]">{label}</p><p className="mt-2 text-2xl font-bold tabular-nums">{value.toLocaleString()}</p></div>)}
    </div>
    <div>
      <div className="mb-2 flex justify-between gap-3 text-xs text-[#526159]"><span>{percent}% of allowance used</span><span>Resets {new Date(data.periodEnd).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span></div>
      <progress aria-label="Monthly credit usage" max={Math.max(1, data.allowance)} value={Math.min(used, data.allowance)} className="h-2 w-full accent-[#294137]" />
      <p className="mt-2 text-xs leading-6 text-[#526159]">Credits renew monthly and do not roll over. Request previews and support conversations are free. Each activity below records credits used or returned.</p>
    </div>
    <div><h3 className="text-sm font-semibold">Usage by activity</h3>
      <div className="mt-3 space-y-3">{usage.length ? usage.map((item) => <div key={item.kind} className="flex items-center justify-between gap-4 rounded-md bg-[#f6f8f7] p-3 text-sm"><span>{labels[item.kind] || item.kind.replaceAll("_", " ")}</span><span className="font-semibold tabular-nums">{(-item._sum.amount).toLocaleString()} credits</span></div>) : <p className="text-sm text-[#526159]">No credits used this period.</p>}</div>
    </div>
    <div><h3 className="text-sm font-semibold">Credit activity</h3><div className="mt-3 divide-y divide-[#e1e9e4]">
      {data.entries.map((entry) => <div key={entry.id} className="flex items-start justify-between gap-4 py-3"><div className="min-w-0"><p className="text-sm font-medium">{entry.description}</p><p className="mt-1 text-xs text-[#526159]">{new Date(entry.createdAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })} · {labels[entry.kind] || entry.kind}</p></div><span className={`shrink-0 text-sm font-semibold tabular-nums ${entry.amount > 0 ? "text-[#387c4d]" : "text-[#102019]"}`}>{entry.amount > 0 ? "+" : ""}{entry.amount.toLocaleString()}</span></div>)}
    </div><div className="mt-3 flex items-center justify-between text-xs text-[#526159]"><span>{data.total} entries · Page {page}</span><div className="flex gap-4"><button className="min-h-11 disabled:opacity-40" disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</button><button className="min-h-11 disabled:opacity-40" disabled={page * 20 >= data.total} onClick={() => setPage(page + 1)}>Next</button></div></div></div>
    <Link to="/support?category=custom" className="inline-flex min-h-11 items-center rounded-md bg-[#294137] px-4 text-sm font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2">Need more credits? Contact support</Link>
  </div>;
}
