import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowUpRight, ChevronLeft, ChevronRight, CreditCard, Mail, MessageSquare, Plug, RotateCcw, Search, Send, X } from "lucide-react";
import { useAuth } from "../authentication/authContext";
import { adminRequest, currencyDigits, displayDate, formatMoney, titleCase, useStaffData } from "./api";
import ComplimentaryAccess from "./ComplimentaryAccess";
import AccountModal from "../../components/AccountModal";
import SelectMenu from "../../components/SelectMenu";
import GenerationResults from "../../components/GenerationResults";

const input = "min-h-11 w-full rounded-lg border border-[#CFDDD5] bg-white px-3 py-2 text-sm text-[#102019] focus:outline-2 focus:outline-offset-2 focus:outline-[#294137]";
const statuses = ["open", "pending", "resolved"];
const panel = "rounded-xl border border-[#CFDDD5] bg-white";

function Loading() {
  return <div role="status" aria-busy="true" className={`${panel} space-y-5 p-6`}><span className="sr-only">Loading section...</span><div aria-hidden="true" className="space-y-5">{Array.from({ length: 6 }, (_, index) => <div key={index} className="h-12 animate-pulse rounded-lg bg-[#edf3ef] motion-reduce:animate-none" />)}</div></div>;
}
function Empty({ text = "No records to show yet." }) { return <div className="flex min-h-48 flex-col items-center justify-center gap-3 p-8 text-center text-sm text-[#526159]"><MessageSquare size={25} /><p>{text}</p></div>; }
function ErrorMessage({ children }) { return children ? <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">{children}</p> : null; }
function Badge({ value }) { return <span className={`staff-badge ${["failed", "blocked", "canceled"].includes(value) ? "negative" : ["completed", "sent", "active", "succeeded", "resolved"].includes(value) ? "positive" : ""}`}>{titleCase(value || "No subscription")}</span>; }
function Pagination({ data, onChange }) {
  return <footer className="admin-pagination"><span>{data.total ? `${(data.page - 1) * data.pageSize + 1}–${Math.min(data.page * data.pageSize, data.total)}` : "0"} of {data.total}</span><div><button className="admin-icon-button" aria-label="Previous page" disabled={data.page <= 1} onClick={() => onChange(data.page - 1)}><ChevronLeft size={18} /></button><span>Page {data.page}</span><button className="admin-icon-button" aria-label="Next page" disabled={data.page * data.pageSize >= data.total} onClick={() => onChange(data.page + 1)}><ChevronRight size={18} /></button></div></footer>;
}
function SearchForm({ onSearch, placeholder = "Search name or email..." }) {
  return <form onSubmit={(event) => { event.preventDefault(); onSearch(event.currentTarget.elements.search.value.trim()); }} className="flex min-w-0 flex-1 items-center gap-2"><div className="relative min-w-0 flex-1"><Search size={17} className="pointer-events-none absolute top-3.5 left-3 text-[#718578]" /><input name="search" aria-label={placeholder} placeholder={placeholder} className={`${input} pl-10`} /></div><button className="admin-button">Search</button></form>;
}

function ComposeMessage({ account, request, onClose, onSaved }) {
  const [channel, setChannel] = useState(account ? "in_app" : "email");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(event) {
    event.preventDefault(); const values = new FormData(event.currentTarget); setBusy(true); setError("");
    try {
      const result = await adminRequest("/messages", { method: "POST", body: JSON.stringify({ ...(request ? { supportRequestId: request.id } : { recipientId: account.id }), subject: values.get("subject"), body: values.get("body"), channel }) });
      onSaved(result.notice);
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  }
  return <AccountModal title={request ? "Reply to contact" : "Message user"} onDismiss={onClose} busy={busy}><p className="mb-5 text-sm text-[#526159]">To: <strong>{account?.email || request.email}</strong></p><form onSubmit={submit} className="space-y-4"><fieldset disabled={busy} className="space-y-4"><label className="block text-xs font-semibold text-[#526159]">Delivery<SelectMenu label="Message delivery" value={channel} onChange={setChannel} options={[...(account ? [{ value: "in_app", label: "In-app inbox", description: "Visible in the user's Messages page" }] : []), { value: "email", label: "Email", description: "Send through your configured Resend account" }]} /></label><label className="block text-sm font-medium">Subject<input name="subject" defaultValue={request ? `Re: ${request.subject}`.slice(0, 160) : "Your Casefy subscription"} required maxLength={160} className={`${input} mt-2`} /></label><label className="block text-sm font-medium">Message<textarea name="body" required maxLength={10000} rows={6} placeholder="Write your message..." className={`${input} mt-2`} /></label></fieldset><ErrorMessage>{error}</ErrorMessage><div className="flex justify-end gap-3 pt-2"><button type="button" disabled={busy} className="admin-button" onClick={onClose}>Cancel</button><button disabled={busy} className="admin-button primary"><Send size={16} />{busy ? "Sending..." : "Send message"}</button></div></form></AccountModal>;
}

function Conversation({ id, onClose, onChanged }) {
  const [revision, setRevision] = useState(0);
  const { data, loading, error } = useStaffData(`/inbox/${id}`, revision, false, true);
  const [replying, setReplying] = useState(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState("");
  useEffect(() => {
    if (replying || busy) return;
    const timer = setInterval(() => { if (document.visibilityState === "visible") setRevision((value) => value + 1); }, 5000);
    return () => clearInterval(timer);
  }, [replying, busy]);
  async function changeStatus(status) {
    setBusy(true); setActionError("");
    try { await adminRequest(`/inbox/${id}`, { method: "PATCH", body: JSON.stringify({ status }) }); setRevision((value) => value + 1); onChanged(); }
    catch (err) { setActionError(err.message); } finally { setBusy(false); }
  }
  if (replying) return <ComposeMessage account={replying.user} request={replying} onClose={() => setReplying(null)} onSaved={() => { setReplying(null); setRevision((value) => value + 1); onChanged(); }} />;
  return <AccountModal title={`Contact request #${id}`} onDismiss={onClose} busy={busy}>{loading ? <Loading /> : error ? <ErrorMessage>{error}</ErrorMessage> : <div className="space-y-5"><div><h3 className="text-lg font-bold">{data.request.subject}</h3><p className="mt-2 text-sm text-[#526159]">{data.request.name} · {data.request.email}</p><p className="mt-1 text-xs text-[#718578]">{displayDate(data.request.createdAt)} · {titleCase(data.request.category)}{data.request.user ? ` · ${titleCase(data.request.user.plan)} plan` : " · Guest contact"}</p></div><div className="rounded-xl bg-[#f6f8f7] p-4 text-sm leading-7 whitespace-pre-wrap">{data.request.description}</div><div className="max-h-64 space-y-3 overflow-y-auto">{data.request.messages.map((message) => <article key={message.id} className="rounded-lg border border-[#CFDDD5] p-4"><div className="flex flex-wrap justify-between gap-2 text-xs text-[#526159]"><strong>{message.sender?.name || "Casefy team"}</strong><span>{titleCase(message.channel)} · {titleCase(message.deliveryStatus)}</span></div><p className="mt-3 text-sm leading-6 whitespace-pre-wrap">{message.body}</p><p className="mt-2 text-[11px] text-[#718578]">{displayDate(message.createdAt)}</p></article>)}</div><ErrorMessage>{actionError}</ErrorMessage><div className="grid gap-3 sm:grid-cols-[1fr_auto]"><SelectMenu label="Request status" value={data.request.status} disabled={busy} onChange={changeStatus} options={statuses.map((status) => ({ value: status, label: titleCase(status), description: status === "open" ? "Needs attention" : status === "pending" ? "Waiting for a response" : "Conversation complete" }))} /><button className="admin-button primary" disabled={busy} onClick={() => setReplying(data.request)}><Send size={16} />Reply</button></div></div>}</AccountModal>;
}

function Inbox({ category, revision = 0 }) {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [localRevision, setLocalRevision] = useState(0);
  const [selected, setSelected] = useState(null);
  const { data, loading, error } = useStaffData(`/inbox?${new URLSearchParams({ category, status, search, page })}`, revision + localRevision, false, true);
  useEffect(() => { const timer = setInterval(() => { if (document.visibilityState === "visible") setLocalRevision((value) => value + 1); }, 15000); return () => clearInterval(timer); }, []);
  return <><section className={`${panel} overflow-visible`}><div className="flex flex-wrap items-end gap-4 border-b border-[#CFDDD5] p-5"><SearchForm onSearch={(value) => { setSearch(value); setPage(1); }} placeholder="Search contacts, emails, or subjects..." /><div className="w-48 max-w-full"><p className="mb-2 text-xs font-semibold text-[#526159]">Request status</p><SelectMenu label="Filter request status" value={status} onChange={(value) => { setStatus(value); setPage(1); }} options={[{ value: "", label: "All statuses" }, ...statuses.map((value) => ({ value, label: titleCase(value) }))]} /></div></div>{loading ? <Loading /> : error ? <div className="p-5"><ErrorMessage>{error}</ErrorMessage></div> : <>{!data.requests.length ? <Empty text="No contact requests match these filters." /> : <div className="divide-y divide-[#e5ece7]">{data.requests.map((request) => <button key={request.id} onClick={() => setSelected(request.id)} className="flex w-full items-start gap-4 px-6 py-5 text-left hover:bg-[#f6f8f7]"><span className="admin-avatar">{request.name.slice(0, 1).toUpperCase()}</span><span className="min-w-0 flex-1"><span className="flex flex-wrap items-center gap-2"><strong className="text-sm">{request.subject}</strong><Badge value={request.status} /></span><span className="mt-2 block text-xs text-[#526159]">{request.name} · {request.email}</span><span className="mt-2 block truncate text-sm text-[#718578]">{request.description}</span><span className="mt-2 block text-[11px] text-[#718578]">{displayDate(request.createdAt)} · {request._count.messages} replies</span></span><ArrowUpRight size={17} className="shrink-0 text-[#526159]" /></button>)}</div>}<Pagination data={data} onChange={setPage} /></>}</section>{selected && <Conversation id={selected} onClose={() => setSelected(null)} onChanged={() => setLocalRevision((value) => value + 1)} />}</>;
}

function IntegrationCard({ integration, editable, onSaved }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(event) {
    event.preventDefault(); const form = event.currentTarget; const values = new FormData(form); setBusy(true); setError("");
    try { await adminRequest(`/integrations/${integration.provider}`, { method: "PUT", body: JSON.stringify({ apiKey: values.get("apiKey"), model: values.get("model") || "", senderEmail: values.get("senderEmail") || "", enabled: values.get("enabled") === "on" }) }); form.reset(); onSaved(); }
    catch (err) { setError(err.message); } finally { setBusy(false); }
  }
  return <form onSubmit={submit} className={`${panel} space-y-5 p-6`}><div className="flex items-start justify-between gap-3"><div className="flex items-center gap-3"><span className="flex size-10 items-center justify-center rounded-lg bg-[#edf3ef] text-[#294137]"><Plug size={20} /></span><h2 className="font-bold">{integration.name}</h2></div><Badge value={!integration.enabled ? "disabled" : integration.configured ? "active" : "not_configured"} /></div><fieldset disabled={busy || !editable} className="space-y-4"><label className="block text-sm font-medium">API key<input name="apiKey" type="password" autoComplete="new-password" placeholder={integration.configured ? "Saved securely · enter to replace" : "Enter provider API key"} maxLength={1000} className={`${input} mt-2`} /></label>{integration.provider === "resend" ? <label className="block text-sm font-medium">Verified sender email<input name="senderEmail" type="email" defaultValue={integration.senderEmail} placeholder="support@yourdomain.com" className={`${input} mt-2`} /></label> : <label className="block text-sm font-medium">Model ID<input name="model" required defaultValue={integration.model} maxLength={100} className={`${input} mt-2`} /><small className="mt-2 block text-xs leading-5 text-[#718578]">Use a model available to your provider account.</small></label>}<label className="flex items-center gap-2 text-sm"><input name="enabled" type="checkbox" defaultChecked={integration.enabled} className="accent-[#294137]" />Enable integration</label></fieldset><ErrorMessage>{error}</ErrorMessage>{editable && <button disabled={busy} className="admin-button primary">{busy ? "Saving..." : "Save integration"}</button>}</form>;
}

function Integrations({ revision }) {
  const { user } = useAuth();
  const [localRevision, setLocalRevision] = useState(0);
  const [notice, setNotice] = useState("");
  const { data, loading, error } = useStaffData("/integrations", revision + localRevision);
  if (loading) return <Loading />;
  if (error) return <ErrorMessage>{error}</ErrorMessage>;
  return <div className="space-y-6">{notice && <p role="status" className="admin-notice">{notice}</p>}<p className="text-sm leading-6 text-[#526159]">Keys are encrypted on the server and are never returned to the browser. Leave a saved key blank to keep it. {user.role === "manager" && "Only administrators can change credentials."}</p><div className="grid gap-6 xl:grid-cols-2">{data.integrations.map((integration) => <IntegrationCard key={`${integration.provider}-${localRevision}`} integration={integration} editable={user.role === "admin"} onSaved={() => { setLocalRevision((value) => value + 1); setNotice("Integration settings saved."); }} />)}</div><section className={`${panel} p-6`}><div className="flex items-center gap-3"><CreditCard size={22} className="text-[#294137]" /><h2 className="font-bold">Stripe billing</h2><Badge value={data.stripe.configured ? "active" : "not_configured"} /><span className="text-xs text-[#526159]">{data.stripe.liveMode ? "Live mode" : "Sandbox mode"}</span></div><p className="mt-4 text-sm leading-6 text-[#526159]">Stripe credentials and webhook signing secrets are managed in the server environment. Webhook signing: {data.stripe.webhookConfigured ? "configured" : "not configured"}.</p><Link to="/admin?view=payments" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#294137]">Manage payments <ArrowUpRight size={16} /></Link></section><section className={`${panel} p-6`}><div className="flex items-center gap-3"><CreditCard size={22} className="text-[#294137]" /><h2 className="font-bold">PayPal subscriptions</h2><Badge value={data.paypal?.configured && data.paypal?.webhookConfigured ? "active" : "not_configured"} /></div><p className="mt-4 text-sm leading-6 text-[#526159]">PayPal checkout appears below Stripe. Configure server credentials, webhook verification, and a matching PayPal plan for each tier and billing period.</p><div className="mt-4 grid grid-cols-2 gap-3">{["plus", "pro"].flatMap((tier) => ["monthly", "annual"].map((period) => <div key={tier + period} className="rounded-lg border border-[#CFDDD5] p-3 text-xs text-[#526159]">{titleCase(tier)} / {period}: {data.paypal?.plans?.[tier]?.[period] ? "Plan mapped" : "Needs plan ID"}</div>))}</div></section></div>;
}

function SubscriptionAction({ account, onClose, onSaved }) {
  const [busy, setBusy] = useState(false), [error, setError] = useState("");
  async function submit() {
    setBusy(true); setError("");
    try { await adminRequest(`/subscriptions/${account.id}`, { method: "POST", body: JSON.stringify({ cancelAtPeriodEnd: !account.cancelAtPeriodEnd }) }); onSaved("Subscription updated."); }
    catch (err) { setError(err.message); } finally { setBusy(false); }
  }
  return <AccountModal title={account.cancelAtPeriodEnd ? "Keep subscription active?" : "Cancel at period end?"} onDismiss={onClose} busy={busy}><p className="text-sm leading-7 text-[#526159]">{account.email} · {titleCase(account.plan)}. {account.cancelAtPeriodEnd ? "Recurring billing will continue on the existing schedule." : "Access continues until the current paid period ends. No refund will be issued by this action."}</p><ErrorMessage>{error}</ErrorMessage><div className="mt-6 flex justify-end gap-3"><button className="admin-button" disabled={busy} onClick={onClose}>Back</button><button className="admin-button primary" disabled={busy} onClick={submit}>{busy ? "Updating..." : account.cancelAtPeriodEnd ? "Keep subscription active" : "Cancel at period end"}</button></div></AccountModal>;
}

function Subscriptions({ revision }) {
  const [, setParams] = useSearchParams();
  const [page, setPage] = useState(1), [search, setSearch] = useState(""), [plan, setPlan] = useState("");
  const [localRevision, setLocalRevision] = useState(0), [notice, setNotice] = useState("");
  const [message, setMessage] = useState(null), [changing, setChanging] = useState(null), [access, setAccess] = useState(null);
  const { data, loading, error } = useStaffData(`/subscriptions?${new URLSearchParams({ page, search, plan })}`, revision + localRevision);
  function saved(text) { setNotice(text); setChanging(null); setMessage(null); setAccess(null); setLocalRevision((value) => value + 1); }
  return <>{notice && <p role="status" className="admin-notice">{notice}</p>}<section className={`${panel} overflow-visible`}><div className="flex flex-wrap items-center gap-4 border-b border-[#CFDDD5] p-5"><SearchForm onSearch={(value) => { setSearch(value); setPage(1); }} /><SelectMenu label="Subscription plan" className="w-44" value={plan} onChange={(value) => { setPlan(value); setPage(1); }} options={[{ value: "", label: "All plans" }, ...["free", "plus", "pro", "enterprise"].map((value) => ({ value, label: titleCase(value) }))]} /></div>{loading ? <Loading /> : error ? <div className="p-5"><ErrorMessage>{error}</ErrorMessage></div> : <><p className="border-b border-[#CFDDD5] bg-[#f6f8f7] px-6 py-3 text-xs text-[#526159]">{data.configured ? `${data.liveMode ? "Live" : "Sandbox"} Stripe billing. Subscription status is synchronized by webhooks.` : "Stripe is not configured. Account plans are shown below."}</p><div className="admin-table-scroll"><table className="admin-table"><thead><tr><th>Customer</th><th>Plan</th><th>Subscription</th><th>Start / end dates</th><th>Actions</th></tr></thead><tbody>{data.users.map((account) => <tr key={account.id}><td><strong className="block">{account.name}</strong><span className="mt-1 block text-xs text-[#526159]">{account.email}</span></td><td>{titleCase(account.plan)}{account.complimentaryStatus && <p className="mt-1 text-xs text-[#718578]">Complimentary: {titleCase(account.complimentaryStatus)}</p>}</td><td><Badge value={(account.paypalSubscriptionId ? account.paypalStatus?.toLowerCase() : account.subscriptionStatus) || (account.complimentaryStatus ? `complimentary_${account.complimentaryStatus}` : account.plan === "enterprise" ? "manual_plan" : "no_subscription")} />{account.cancelAtPeriodEnd && <p className="mt-2 text-xs text-[#8e3530]">Cancels at period end</p>}</td><td><p className="text-xs text-[#526159]">Start: {displayDate(account.complimentaryStartsAt || account.paypalStartedAt || account.subscriptionStartedAt)}</p><p className="mt-1 text-xs text-[#526159]">End: {displayDate(account.complimentaryEndsAt || account.paypalPeriodEnd || account.subscriptionPeriodEnd)}</p></td><td><div className="flex items-center gap-1"><button className="admin-button" onClick={() => setAccess(account)}>Dates & free access</button><button className="admin-icon-button" title="View payments" aria-label={`Payments for ${account.email}`} onClick={() => setParams({ view: "payments", userId: String(account.id) })}><CreditCard size={17} /></button><button className="admin-icon-button" title="Message customer" aria-label={`Message ${account.email}`} onClick={() => setMessage(account)}><Mail size={17} /></button>{account.stripeSubscriptionId && !["canceled", "incomplete_expired"].includes(account.subscriptionStatus) && <button className="admin-button" onClick={() => setChanging(account)}>{account.cancelAtPeriodEnd ? "Keep active" : "Cancel"}</button>}</div></td></tr>)}</tbody></table></div>{!data.users.length && <Empty />}<Pagination data={data} onChange={setPage} /></>}</section>{message && <ComposeMessage account={message} onClose={() => setMessage(null)} onSaved={saved} />}{access && <ComplimentaryAccess account={access} onClose={() => setAccess(null)} onSaved={saved} />}{changing && <SubscriptionAction account={changing} onClose={() => setChanging(null)} onSaved={saved} />}</>;
}

function RefundModal({ payment, retry, onClose, onSaved }) {
  const [operationId] = useState(() => retry?.id || crypto.randomUUID());
  const currency = retry?.currency || payment.currency;
  const remaining = retry?.amount || payment.amount - payment.amountRefunded;
  const digits = currencyDigits(currency), factor = 10 ** digits;
  const account = retry?.user || payment.user;
  const [busy, setBusy] = useState(false), [error, setError] = useState("");
  async function submit(event) {
    event.preventDefault(); const values = new FormData(event.currentTarget);
    const raw = values.get("amount");
    if (!new RegExp(`^\\d+(?:\\.\\d{1,${Math.max(1, digits)}})?$`).test(raw) || digits === 0 && raw.includes(".")) { setError("Enter an amount in the payment's currency precision."); return; }
    const amount = Math.round(Number(raw) * factor);
    if (amount < 1 || amount > remaining) { setError("The amount exceeds the remaining refundable balance."); return; }
    setBusy(true); setError("");
    try {
      const result = await adminRequest("/refunds", { method: "POST", body: JSON.stringify({ operationId, userId: account.id, chargeId: retry?.chargeId || payment.id, amount, reason: values.get("reason") }) });
      onSaved(`Refund ${titleCase(result.refund.status)}. Reference: ${result.refund.stripeRefundId}.`);
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  }
  return <AccountModal title={retry ? "Retry pending refund" : "Issue a refund"} onDismiss={onClose} busy={busy}><p className="mb-5 text-sm leading-6 text-[#526159]">Refund {account.email} to the original payment method. Available: <strong>{formatMoney(remaining, currency)}</strong>. This changes the payment; it does not cancel the subscription.</p><form onSubmit={submit} className="space-y-4"><label className="block text-sm font-medium">Amount ({currency.toUpperCase()})<input name="amount" type="number" step={1 / factor} min={1 / factor} max={remaining / factor} defaultValue={(remaining / factor).toFixed(digits)} required readOnly={Boolean(retry)} disabled={busy} className={`${input} mt-2`} /></label><label className="block text-sm font-medium">Reason<textarea name="reason" maxLength={500} rows={3} defaultValue={retry?.reason || ""} readOnly={Boolean(retry)} required disabled={busy} className={`${input} mt-2`} /></label><ErrorMessage>{error}</ErrorMessage><div className="flex justify-end gap-3"><button type="button" className="admin-button" disabled={busy} onClick={onClose}>Back</button><button className="admin-button danger" disabled={busy}>{busy ? "Processing..." : retry ? "Retry same refund" : "Confirm refund"}</button></div></form></AccountModal>;
}

function Payments({ revision }) {
  const [params, setParams] = useSearchParams();
  const userId = params.get("userId") || "";
  const [cursors, setCursors] = useState([""]), [selected, setSelected] = useState(null), [message, setMessage] = useState(null);
  const [localRevision, setLocalRevision] = useState(0), [notice, setNotice] = useState("");
  const { data, loading, error } = useStaffData(`/payments?${new URLSearchParams({ userId, after: cursors.at(-1) })}`, revision + localRevision);
  function saved(text) { setSelected(null); setMessage(null); setNotice(text); setLocalRevision((value) => value + 1); }
  return <div className="space-y-5">{notice && <p role="status" className="admin-notice">{notice}</p>}{userId && <button className="admin-button" onClick={() => { setParams({ view: "payments" }); setCursors([""]); }}><X size={15} />Clear customer filter</button>}{loading ? <Loading /> : error ? <ErrorMessage>{error}</ErrorMessage> : <section className={`${panel} overflow-hidden`}><header className="admin-panel-header"><div><h2>Payment history</h2><p>{data.liveMode ? "Live payments" : "Sandbox payments"} · Amounts are shown in the original currency.</p></div><CreditCard size={20} /></header>{!data.payments.length ? <Empty text="No Stripe payments for this selection." /> : <div className="admin-table-scroll"><table className="admin-table"><thead><tr><th>Customer / payment</th><th>Paid</th><th>Refunded</th><th>Status</th><th>Date</th><th>Actions</th></tr></thead><tbody>{data.payments.map((payment) => <tr key={payment.id}><td><strong className="block">{payment.user?.name || "Unlinked customer"}</strong><span className="mt-1 block text-xs text-[#526159]">{payment.user?.email || payment.id}</span></td><td>{formatMoney(payment.amount, payment.currency)}</td><td>{formatMoney(payment.amountRefunded, payment.currency)}</td><td><Badge value={payment.status} />{payment.disputed && <span className="ml-2 text-xs text-red-700">Disputed</span>}</td><td>{displayDate(payment.createdAt)}</td><td><div className="flex gap-2">{payment.user && <button className="admin-icon-button" title="Message customer" aria-label={`Message ${payment.user.email}`} onClick={() => setMessage(payment.user)}><Mail size={16} /></button>}{payment.receiptUrl && <a className="admin-icon-button" href={payment.receiptUrl} target="_blank" rel="noreferrer" title="Payment receipt" aria-label={`Receipt ${payment.id}`}><ArrowUpRight size={16} /></a>}<button className="admin-button" disabled={!payment.user || !payment.paid || payment.disputed || payment.amountRefunded >= payment.amount} onClick={() => setSelected(payment)}><RotateCcw size={14} />Refund</button></div></td></tr>)}</tbody></table></div>}<footer className="admin-pagination"><span>Page {cursors.length}</span><div><button className="admin-button" disabled={cursors.length === 1} onClick={() => setCursors((values) => values.slice(0, -1))}>Previous</button><button className="admin-button" disabled={!data.hasMore} onClick={() => setCursors((values) => [...values, data.nextCursor])}>Next</button></div></footer></section>}{selected && <RefundModal payment={selected} onClose={() => setSelected(null)} onSaved={saved} />}{message && <ComposeMessage account={message} onClose={() => setMessage(null)} onSaved={saved} />}</div>;
}

function Refunds({ revision }) {
  const [tab, setTab] = useState("requests"), [page, setPage] = useState(1), [retry, setRetry] = useState(null);
  const [localRevision, setLocalRevision] = useState(0), [notice, setNotice] = useState("");
  const { data, loading, error } = useStaffData(`/refunds?page=${page}`, revision + localRevision);
  return <div className="space-y-5"><div role="group" aria-label="Refund view" className="inline-flex gap-1 rounded-xl border border-[#CFDDD5] bg-white p-1">{[["requests", "Refund requests"], ["history", "Issued refunds"]].map(([value, text]) => <button key={value} aria-pressed={tab === value} className={`rounded-lg px-4 py-3 text-sm font-semibold ${tab === value ? "bg-[#294137] text-white" : "text-[#526159]"}`} onClick={() => setTab(value)}>{text}</button>)}</div>{notice && <p role="status" className="admin-notice">{notice}</p>}{tab === "requests" ? <Inbox category="refund" revision={revision} /> : loading ? <Loading /> : error ? <ErrorMessage>{error}</ErrorMessage> : <section className={`${panel} overflow-hidden`}><header className="admin-panel-header"><div><h2>Refund history</h2><p>Includes pending operations that can be safely retried.</p></div></header>{!data.refunds.length ? <Empty text="No refunds have been issued through this panel." /> : <div className="admin-table-scroll"><table className="admin-table"><thead><tr><th>Customer</th><th>Amount</th><th>Status</th><th>Reason / reference</th><th>Date</th><th>Action</th></tr></thead><tbody>{data.refunds.map((refund) => <tr key={refund.id}><td>{refund.user.email}<p className="mt-1 text-xs text-[#718578]">Issued by {refund.actor?.name || "Former staff member"}</p></td><td>{formatMoney(refund.amount, refund.currency)}</td><td><Badge value={refund.status} /></td><td><span className="block max-w-52 truncate" title={refund.reason}>{refund.reason}</span><span className="mt-1 block text-xs text-[#718578]">{refund.stripeRefundId || refund.id}</span></td><td>{displayDate(refund.createdAt)}</td><td>{refund.status === "pending" && <button className="admin-button" onClick={() => setRetry(refund)}>Retry</button>}</td></tr>)}</tbody></table></div>}<Pagination data={data} onChange={setPage} /></section>}{retry && <RefundModal retry={retry} onClose={() => setRetry(null)} onSaved={(text) => { setRetry(null); setNotice(text); setLocalRevision((value) => value + 1); }} />}</div>;
}

function ReportDetail({ id, onClose, session }) {
  const { data, loading, error } = useStaffData(`/reports/${id}`, 0, session);
  return <AccountModal title={`Generation report #${id}`} onDismiss={onClose}>{loading ? <Loading /> : error ? <ErrorMessage>{error}</ErrorMessage> : <GenerationResults run={data.run} />}</AccountModal>;
}

export function ReportsSection({ revision = 0, session = false }) {
  const [page, setPage] = useState(1), [selected, setSelected] = useState(null);
  const { data, loading, error } = useStaffData(`/reports?page=${page}`, revision, session);
  if (loading) return <Loading />;
  if (error) return <ErrorMessage>{error}</ErrorMessage>;
  const completed = data.summary.find((item) => item.status === "completed");
  return <div className="space-y-6"><div className="grid gap-4 sm:grid-cols-3">{[["Generation runs", data.total], ["Completed runs", completed?._count._all || 0], ["Generated test cases", completed?._sum.testCount || 0]].map(([name, count]) => <article key={name} className={`${panel} p-5`}><h2 className="text-sm font-semibold text-[#526159]">{name}</h2><p className="mt-4 text-3xl font-extrabold">{count.toLocaleString()}</p></article>)}</div><section className={`${panel} overflow-hidden`}><header className="admin-panel-header"><div><h2>Generation history</h2><p>Saved AI generation results. These are not execution or pass-rate reports.</p></div></header>{!data.runs.length ? <Empty text="Generate test cases to see your first report here." /> : <div className="admin-table-scroll"><table className="admin-table"><thead><tr><th>Report</th><th>User</th><th>Model</th><th>Cases</th><th>Status</th><th>Date</th><th>View</th></tr></thead><tbody>{data.runs.map((run) => <tr key={run.id}><td><strong className="block max-w-52 truncate">{run.subject}</strong><span className="mt-1 block text-xs text-[#718578]">#{run.id} · {titleCase(run.source)}</span></td><td>{run.user.name}</td><td>{run.model}</td><td>{run.testCount} / {run.requestedCount}</td><td><Badge value={run.status} /></td><td>{displayDate(run.createdAt)}</td><td><button className="admin-icon-button" aria-label={`Open report ${run.id}`} onClick={() => setSelected(run.id)}><ArrowUpRight size={17} /></button></td></tr>)}</tbody></table></div>}<Pagination data={data} onChange={setPage} /></section>{selected && <ReportDetail id={selected} session={session} onClose={() => setSelected(null)} />}</div>;
}

export default function StaffSections({ view, revision }) {
  if (view === "integrations") return <Integrations revision={revision} />;
  if (view === "subscriptions") return <Subscriptions revision={revision} />;
  if (view === "payments") return <Payments revision={revision} />;
  if (view === "refunds") return <Refunds revision={revision} />;
  if (view === "reports") return <ReportsSection revision={revision} />;
  return <Inbox key={view} category={view === "enterprise" ? "enterprise" : "support"} revision={revision} />;
}
