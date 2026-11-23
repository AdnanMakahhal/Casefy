import { useEffect, useRef, useState } from "react";
import { RiArrowLeftLine as ArrowLeft, RiSendPlane2Line as Send, RiCheckboxCircleLine as CheckCircle } from "react-icons/ri";
import Avatar from "../../components/Avatar";
import SelectMenu from "../../components/SelectMenu";
import Button from "../../ui/Button";
import P from "../../ui/P";
import Span from "../../ui/Span";
import { useAuth } from "../authentication/authContext";
import { displayDate, formatMoney, titleCase } from "../../lib/format";
import { adminRequest, useStaffData } from "./api";
import { ErrorMessage } from "./ui";
import SupportConversationSkeleton from "../../ui/SupportConversationSkeleton";
import { input } from "./styles";
import SupportBilling from "./SupportBilling";

export default function SupportConversation({ id, revision: externalRevision = 0, onClose, onChanged, onLoadingChange }) {
  const { user } = useAuth();
  const canBill = ["admin", "manager"].includes(user.role);
  const [revision, setRevision] = useState(0);
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState("");
  const [delivery, setDelivery] = useState("in_app");
  const [actionError, setActionError] = useState("");
  const [notice, setNotice] = useState("");
  const [closedLocally, setClosedLocally] = useState(false);
  const closeHandler = useRef(onClose);
  const thread = useRef(null);
  const followThread = useRef(true);
  const { data, loading, error, errorStatus } = useStaffData(`/inbox/${id}`, revision + externalRevision, false, true, { refreshKey: externalRevision });
  useEffect(() => { onLoadingChange?.(loading); }, [loading, onLoadingChange]);
  const request = data?.request;
  const isClosed = closedLocally || request?.status === "resolved";
  const canReply = canBill && request?.assignedTo?.id === user.id;
  const canSend = canReply && request?.status === "open";
  const statusOptions = (request?.status === "pending" ? ["pending", "open"] : request?.status === "resolved" ? ["resolved"] : ["open", "resolved"]).map((value) => ({ value, label: value === "resolved" ? "Closed" : titleCase(value) }));
  const billingRequest = ["payment", "refund"].includes(request?.category);
  const lastMessageId = request?.messages.at(-1)?.id;
  useEffect(() => { closeHandler.current = onClose; }, [onClose]);
  useEffect(() => {
    if (!isClosed) return;
    const timer = setTimeout(() => closeHandler.current(), 2000);
    return () => clearTimeout(timer);
  }, [isClosed]);
  useEffect(() => {
    if (busy) return;
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") setRevision((value) => value + 1);
    }, 5000);
    return () => clearInterval(timer);
  }, [busy]);
  useEffect(() => {
    if ((isClosed || followThread.current) && thread.current) thread.current.scrollTop = thread.current.scrollHeight;
  }, [lastMessageId, loading, isClosed]);
  function changed() {
    setRevision((value) => value + 1);
    onChanged();
  }
  async function changeStatus(value) {
    if (busy) return;
    setBusy(true);
    setActionError("");
    try {
      await adminRequest(`/inbox/${id}`, { method: "PATCH", body: JSON.stringify(typeof value === "string" ? { status: value } : value) });
      if (value === "resolved") { setClosedLocally(true); followThread.current = true; setDraft(""); onChanged(); }
      else changed();
    } catch (err) { setActionError(err.message); }
    finally { setBusy(false); }
  }
  async function send(event) {
    event.preventDefault();
    if (busy || isClosed || !draft.trim() || !canSend) return;
    setBusy(true);
    setActionError("");
    setNotice("");
    try {
      const result = await adminRequest("/messages", { method: "POST", body: JSON.stringify({ supportRequestId: request.id, subject: `Re: ${request.subject}`.slice(0, 160), body: draft.trim(), channel: request.user ? delivery : "email" }) });
      setDraft("");
      setNotice(result.notice);
      followThread.current = true;
      changed();
    } catch (err) {
      setActionError(err.message);
      if (err.status === 409 && /ticket is closed/i.test(err.message)) { setClosedLocally(true); followThread.current = true; setDraft(""); }
    }
    finally { setBusy(false); }
  }
  return (
    <div className="space-y-4">
      {loading ? <SupportConversationSkeleton /> : error ? <section className="mx-auto max-w-xl rounded-md border border-[#cfddd5] bg-white px-6 py-10 text-center">
        <Span className="mx-auto flex size-12 items-center justify-center rounded-md bg-[#edf3ef] text-[#294137]"><CheckCircle size={25} aria-hidden="true" /></Span>
        <h2 className="mt-4 text-lg font-semibold">{errorStatus === 409 || /ticket is closed/i.test(error) ? "Conversation closed" : "Conversation unavailable"}</h2>
        <P variant="unstyled" className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#526159]">{errorStatus === 409 || /ticket is closed/i.test(error) ? "This ticket is complete. Return to your inbox to manage other conversations." : error}</P>
        <div className="mt-6 flex flex-wrap justify-center gap-3"><Button variant="outline" onClick={onClose}><ArrowLeft size={16} aria-hidden="true" />All conversations</Button>{errorStatus !== 409 && !/ticket is closed/i.test(error) && <Button onClick={() => setRevision((value) => value + 1)}>Try again</Button>}</div>
      </section> : request && (
        <div className={canBill && billingRequest ? "grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]" : "mx-auto max-w-4xl"}>
          <section aria-label={`Conversation with ${request.name}`} className="min-w-0 overflow-hidden rounded-md border border-[#cfddd5] bg-white">
            <header className="flex flex-wrap items-center gap-3 border-b border-[#e1e9e4] px-4 py-4 sm:px-5">
              <Button variant="outline" size="sm" onClick={onClose} className="w-full justify-start sm:w-auto"><ArrowLeft size={16} aria-hidden="true" />All conversations</Button>
              <Avatar user={request.user || { name: request.name }} className="size-10 text-xs" />
              <div className="min-w-0 flex-1"><h2 title={request.name} className="truncate text-sm font-semibold">{request.name}</h2><P variant="unstyled" title={request.email} className="mt-1 truncate text-xs text-[#526159]">{request.email}</P></div>
            </header>
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e1e9e4] bg-[#f6f8f7] px-4 py-3 sm:px-5">
              <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3">
                <div className="min-w-0"><P variant="unstyled" className="text-[10px] font-medium text-[#718578]">Assigned to</P><P variant="unstyled" title={request.assignedTo?.name} className="mt-1 truncate text-xs font-semibold text-[#294137]">{canReply ? "You" : request.assignedTo?.name || "Unassigned"}</P></div>
                {canBill && !canReply && <Button variant="outline" size="sm" disabled={busy || isClosed} onClick={() => changeStatus({ assignToMe: true })}>Assign to me</Button>}
              </div>
              <div className="w-full sm:w-40"><P variant="unstyled" className="mb-1 text-[10px] font-medium text-[#718578]">Ticket status</P><SelectMenu label="Ticket status" compact value={isClosed ? "resolved" : request.status} onChange={changeStatus} disabled={busy || isClosed || !canReply} options={closedLocally ? [{ value: "resolved", label: "Closed" }] : statusOptions} /></div>
            </div>
            <div className="border-b border-[#e1e9e4] bg-[#f6f8f7] px-4 py-3 sm:px-5">
              <h3 title={request.subject} className="truncate text-sm font-semibold">{request.subject}</h3>
              <P variant="unstyled" className="mt-1 text-xs text-[#718578]">Ticket #{request.id} · {request.category === "payment" ? "Payments" : request.category === "refund" ? "Refund request" : titleCase(request.category)}</P>
              {request.details && Object.keys(request.details).length > 0 && <details className="mt-3 text-xs text-[#526159]">
                <summary className="w-fit cursor-pointer rounded-md font-semibold focus-visible:outline-2 focus-visible:outline-[#294137]">Request details</summary>
                <dl className="mt-3 space-y-2">{Object.entries(request.details).map(([key, value]) => <div key={key}><dt className="font-medium">{titleCase(key.replace(/([A-Z])/g, " $1"))}</dt><dd className="mt-1 break-words">{key === "refundAmount" ? formatMoney(value, "usd") : String(value)}</dd></div>)}</dl>
              </details>}
            </div>
            <div ref={thread} role="log" aria-label="Conversation messages" aria-live="polite" onScroll={(event) => { const area = event.currentTarget; followThread.current = area.scrollHeight - area.scrollTop - area.clientHeight < 64; }} className="h-[min(50dvh,28rem)] min-h-64 space-y-4 overflow-y-auto overscroll-contain bg-[#f6f8f7] p-4 sm:p-5">
              <article className="max-w-[90%] rounded-md border border-[#e1e9e4] bg-white p-3 sm:max-w-[85%]">
                <P variant="unstyled" className="whitespace-pre-wrap break-words text-sm leading-6">{request.description}</P>
                <P variant="unstyled" className="mt-2 text-[10px] text-[#718578]">{displayDate(request.createdAt)}</P>
              </article>
              {request.messages.map((message) => {
                const bot = message.channel === "support_bot";
                const outgoing = bot || (message.senderId != null && message.senderId !== request.userId);
                return <article key={message.id} className={`max-w-[90%] rounded-md p-3 sm:max-w-[85%] ${outgoing ? "ml-auto bg-[#294137] text-white" : "border border-[#e1e9e4] bg-white"}`}>
                  <P variant="unstyled" className={`mb-1 text-[11px] font-semibold ${outgoing ? "text-white/80" : "text-[#526159]"}`}>{bot ? "Casefy assistant · Automated" : message.sender?.name || request.name}</P>
                  <P variant="unstyled" className="whitespace-pre-wrap break-words text-sm leading-6">{message.body}</P>
                  <P variant="unstyled" className={`mt-2 text-[10px] ${outgoing ? "text-white/70" : "text-[#718578]"}`}>{displayDate(message.createdAt)}{outgoing ? ` · ${titleCase(message.deliveryStatus)}` : ""}</P>
                </article>;
              })}
              {isClosed && <P variant="unstyled" role="status" className="rounded-md border border-[#cfddd5] bg-[#edf3ef] p-3 text-center text-xs leading-5 text-[#294137]">Ticket is closed. Returning to All conversations...</P>}
            </div>
            {!isClosed && <form onSubmit={send} className="space-y-3 border-t border-[#e1e9e4] p-4 sm:p-5">
              <label htmlFor={`support-reply-${id}`} className="sr-only">Reply to {request.name}</label>
              {!canReply && <P variant="unstyled" className="rounded-md bg-[#edf3ef] p-3 text-xs leading-5 text-[#526159]">{canBill ? "Assign this conversation to yourself to reply and manage its status." : "Only the assigned administrator or manager can reply."}</P>}
              {canReply && request.status === "pending" && <Button variant="outline" size="sm" disabled={busy} onClick={() => changeStatus("open")}>Open ticket to reply</Button>}
              <textarea id={`support-reply-${id}`} value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Write a reply..." rows={2} required maxLength={10000} disabled={busy || !canSend} className={`${input} resize-y disabled:cursor-not-allowed disabled:bg-[#f6f8f7]`} />
              <div className="flex flex-wrap items-center justify-between gap-3">
                {request.user ? <select aria-label="Reply delivery" value={delivery} onChange={(event) => setDelivery(event.target.value)} disabled={busy || !canReply} className="min-h-11 rounded-md border border-[#cfddd5] bg-white px-3 text-xs text-[#294137] focus:outline-2 focus:outline-[#294137]"><option value="in_app">In-app reply</option><option value="email">Email reply</option></select> : <Span className="text-xs text-[#718578]">Guest replies are sent by email.</Span>}
                <Button type="submit" disabled={busy || !canSend || !draft.trim()}><Send size={16} aria-hidden="true" />{busy ? "Updating..." : "Send reply"}</Button>
              </div>
              <ErrorMessage>{actionError}</ErrorMessage>
              {notice && <P variant="unstyled" role="status" className="text-xs text-[#526159]">{notice}</P>}
            </form>}
          </section>
          {canBill && billingRequest && <SupportBilling key={request.id} request={request} revision={externalRevision} />}
        </div>
      )}
    </div>
  );
}
