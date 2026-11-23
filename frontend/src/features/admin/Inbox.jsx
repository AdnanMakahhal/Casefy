import Span from "../../ui/Span";
import Button from "../../ui/Button";
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import SupportConversation from "./SupportConversation";
import Payments from "./Payments";
import { useAuth } from "../authentication/authContext";
import Avatar from "../../components/Avatar";
import AnimatedView from "../../ui/AnimatedView";
import SupportInboxSkeleton from "../../ui/SupportInboxSkeleton";
import { useStaffData } from "./api";
import { displayDate, titleCase } from "../../lib/format";
import {
  ErrorMessage,
  SearchForm,
  Empty,
  Badge,
  Pagination,
} from "./ui";
import SelectMenu from "../../components/SelectMenu";
import { statuses, panel } from "./styles";
import {
  RiArrowRightSLine as ChevronRight,
} from "react-icons/ri";

export default function Inbox({ category: fixedCategory, revision = 0, onLoadingChange }) {
  const { user } = useAuth();
  const canBill = ["admin", "manager"].includes(user?.role);
  const [params, setParams] = useSearchParams();
  const category = fixedCategory || params.get("category") || "";
  const selected = params.get("requestId");
  const showPaymentHistory = canBill && category === "payment" && params.get("paymentView") !== "conversations";
  function selectConversation(id) {
    setParams((current) => {
      const next = new URLSearchParams(current);
      if (id) next.set("requestId", id);
      else next.delete("requestId");
      return next;
    });
  }
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [localRevision, setLocalRevision] = useState(0);

  const { data, loading, error } = useStaffData(
    `/inbox?${new URLSearchParams({ category, status, search, page })}`,
    revision + localRevision,
    false,
    true,
    { refreshKey: revision },
  );
  useEffect(() => { if (!selected && !showPaymentHistory) onLoadingChange?.(loading); }, [loading, selected, showPaymentHistory, onLoadingChange]);
  useEffect(() => {
    if (selected) return;
    const timer = setInterval(() => {
      if (document.visibilityState === "visible")
        setLocalRevision((value) => value + 1);
    }, 15000);
    return () => clearInterval(timer);
  }, [selected]);
  return (
    <AnimatedView viewKey={selected ? `conversation-${selected}` : "inbox"}>
      {selected ? <SupportConversation key={selected} id={selected} revision={revision} onLoadingChange={onLoadingChange} onClose={() => selectConversation(null)} onChanged={() => setLocalRevision((value) => value + 1)} /> : <>
      <section className={`${panel} overflow-visible`}>
        <div className="grid grid-cols-1 items-center gap-3 border-b border-[#CFDDD5] p-4 sm:grid-cols-2 sm:p-5 lg:grid-cols-[minmax(0,1fr)_13rem_11rem]">
          <div className="min-w-0 sm:col-span-2 lg:col-span-1">
          {showPaymentHistory ? <Span className="text-sm font-semibold text-[#294137]">Customer payments</Span> : <SearchForm
            onSearch={(value) => {
              setSearch(value);
              setPage(1);
            }}
            placeholder="Search contacts, emails, or subjects..."
            value={search}
            liveSearch
          />}
          </div>
          {!fixedCategory && <div className="min-w-0"><SelectMenu label="Filter support topic" value={category} onChange={(value) => {
            setPage(1);
            setParams((current) => { const next = new URLSearchParams(current); if (value) next.set("category", value); else next.delete("category"); next.delete("paymentView"); if (value !== "payment") next.delete("userId"); return next; });
          }} options={[
            { value: "", label: "All conversations" },
            { value: "messages", label: "Messages" },
            { value: "payment", label: "Payments" },
            { value: "refund", label: "Refunds" },
          ]} /></div>}
          {!showPaymentHistory && <div className="min-w-0">
            <SelectMenu
              label="Filter request status"
              value={status}
              onChange={(value) => {
                setStatus(value);
                setPage(1);
              }}
              options={[
                { value: "", label: "All statuses" },
                ...statuses.map((value) => ({
                  value,
                  label: value === "resolved" ? "Closed" : titleCase(value),
                })),
              ]}
            />
          </div>}
        </div>
        {canBill && category === "payment" && <div role="group" aria-label="Payment view" className="flex flex-wrap gap-2 border-b border-[#e1e9e4] px-4 py-3 sm:px-5">{[["history", "Payment history"], ["conversations", "Payment conversations"]].map(([value, label]) => <Button key={value} size="sm" variant={(showPaymentHistory ? "history" : "conversations") === value ? "primary" : "outline"} aria-pressed={(showPaymentHistory ? "history" : "conversations") === value} onClick={() => setParams((current) => { const next = new URLSearchParams(current); next.set("paymentView", value); return next; })}>{label}</Button>)}</div>}
        {showPaymentHistory ? <div className="p-4 sm:p-5"><Payments key={params.get("userId") || "all"} revision={revision} onLoadingChange={onLoadingChange} /></div> : loading ? (
          <SupportInboxSkeleton />
        ) : error ? (
          <div className="p-5">
            <ErrorMessage>{error}</ErrorMessage>
          </div>
        ) : (
          <>
            {!data.requests.length ? (
              <Empty text="No contact requests match these filters." />
            ) : (
              <div className="divide-y divide-[#e5ece7]">
                {data.requests.map((request) => (
                  <Button variant="unstyled" key={request.id} disabled={request.status === "resolved"} onClick={() => selectConversation(request.id)} aria-label={request.status === "resolved" ? `Closed conversation: ${request.subject}` : `Open conversation with ${request.name}: ${request.subject}`} className="flex w-full items-start gap-3 px-4 py-4 text-left transition-colors enabled:hover:bg-[#f6f8f7] focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-[#294137] disabled:cursor-default disabled:bg-[#f6f8f7] sm:px-5">
                    <Avatar user={{ name: request.name }} className="size-10 text-xs" />
                    <Span className="min-w-0 flex-1">
                      <Span className="flex items-center justify-between gap-3">
                        <strong title={request.name} className="min-w-0 truncate text-sm">{request.name}</strong>
                        <Badge value={request.status} />
                      </Span>
                      <Span title={request.subject} className="mt-1 block truncate text-sm font-medium text-[#294137]">{request.subject}</Span>
                      <Span variant="muted" title={request.description} className="mt-1 block truncate text-xs">{request.description}</Span>
                      <Span variant="muted" className="mt-2 block truncate text-[10px]">{request.category === "payment" ? "Payment" : request.category === "refund" ? "Refund" : "Message"} · {request._count.messages} replies · {displayDate(request.createdAt)}</Span>
                    </Span>
                    {request.status !== "resolved" && <ChevronRight size={17} aria-hidden="true" className="shrink-0 text-[#526159]" />}
                  </Button>
                ))}
              </div>
            )}
            <Pagination data={data} onChange={setPage} label="conversations" />
          </>
        )}
      </section>

      </>}
    </AnimatedView>
  );
}
