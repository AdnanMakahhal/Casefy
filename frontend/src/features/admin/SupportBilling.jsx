import { useState } from "react";
import Button from "../../ui/Button";
import P from "../../ui/P";
import Span from "../../ui/Span";
import { displayDate, formatMoney } from "../../lib/format";
import { useStaffData } from "./api";
import { Badge, ErrorMessage, Loading } from "./ui";
import RefundModal from "./RefundModal";

export default function SupportBilling({ request, revision: externalRevision = 0 }) {
  const [revision, setRevision] = useState(0);
  const [cursors, setCursors] = useState([""]);
  const [selected, setSelected] = useState(null);
  const [retry, setRetry] = useState(null);
  const [notice, setNotice] = useState("");
  const { data, loading, error } = useStaffData(`/inbox/${request.id}/billing?${new URLSearchParams({ after: cursors.at(-1) })}`, revision + externalRevision);
  function saved(text) {
    setSelected(null);
    setRetry(null);
    setNotice(text);
    setRevision((value) => value + 1);
  }
  return (
    <aside aria-label="Customer billing" className="min-w-0 space-y-4">
      <section className="overflow-hidden rounded-md border border-[#cfddd5] bg-white">
        <header className="flex items-center justify-between gap-3 border-b border-[#e1e9e4] p-4">
          <h3 className="text-sm font-semibold">Payment history</h3>
          <Button size="sm" variant="ghost" disabled={loading} onClick={() => setRevision((value) => value + 1)}>Refresh</Button>
        </header>
        {notice && <P variant="unstyled" role="status" className="m-4 rounded-md bg-[#edf3ef] p-3 text-xs leading-5 text-[#294137]">{notice}</P>}
        {loading ? <Loading /> : error ? <div className="p-4"><ErrorMessage>{error}</ErrorMessage></div> : !data.linked ? (
          <P variant="unstyled" className="p-4 text-sm leading-6 text-[#526159]">This guest request is not linked to an authenticated account. Verify the customer before reviewing payments or approving a refund.</P>
        ) : (
          <>
            {request.category === "refund" && data.operation && <div className="m-4 space-y-2 rounded-md border border-[#cfddd5] bg-[#f6f8f7] p-3">
              <div className="flex flex-wrap items-center justify-between gap-2"><Span className="text-xs font-semibold">Request refund</Span><Badge value={data.operation.status} /></div>
              <P variant="unstyled" className="text-xs text-[#526159]">{formatMoney(data.operation.amount, data.operation.currency)}</P>
              <P variant="unstyled" className="break-all text-xs text-[#718578]">{data.operation.stripeRefundId || "Awaiting confirmation"}</P>
              {["pending", "failed"].includes(data.operation.status) && <Button size="sm" variant="outline" onClick={() => setRetry(data.operation)}>Retry same refund</Button>}
            </div>}
            {!data.payments.length ? <P variant="unstyled" className="p-4 text-sm text-[#526159]">No payment history for this customer.</P> : <ul className="max-h-[32rem] divide-y divide-[#e1e9e4] overflow-y-auto overscroll-contain">
              {data.payments.map((payment) => (
                <li key={payment.id} className="space-y-2 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2"><Span className="text-sm font-semibold tabular-nums">{formatMoney(payment.amount, payment.currency)}</Span><Badge value={payment.status} /></div>
                  <P variant="unstyled" className="break-words text-xs leading-5 text-[#526159]">{payment.description || "Subscription payment"}</P>
                  <P variant="unstyled" className="text-xs text-[#718578]">{displayDate(payment.createdAt)}</P>
                  <P variant="unstyled" className="break-all text-[11px] text-[#718578]">{payment.id}</P>
                  {payment.amountRefunded > 0 && <P variant="unstyled" className="text-xs text-[#526159]">Refunded: {formatMoney(payment.amountRefunded, payment.currency)}</P>}
                  <div className="flex flex-wrap gap-2">
                    {payment.receiptUrl && <Button variant="outline" size="sm" href={payment.receiptUrl} target="_blank" rel="noreferrer">Receipt</Button>}
                    {request.category === "refund" && !data.operation && payment.refundable && payment.paid && !payment.disputed && payment.amountRefunded < payment.amount && <Button size="sm" onClick={() => setSelected(payment)}>Approve refund</Button>}
                  </div>
                </li>
              ))}
            </ul>}
            {(cursors.length > 1 || data.hasMore) && <div className="flex justify-between gap-2 border-t border-[#e1e9e4] p-3">
              <Button variant="outline" size="sm" disabled={cursors.length === 1} onClick={() => setCursors((values) => values.slice(0, -1))}>Previous</Button>
              <Button variant="outline" size="sm" disabled={!data.hasMore} onClick={() => setCursors((values) => [...values, data.nextCursor])}>Next</Button>
            </div>}
          </>
        )}
      </section>
      {data?.linked && <section className="rounded-md border border-[#cfddd5] bg-white p-4">
        <h3 className="text-sm font-semibold">Recent refunds</h3>
        {!data.refunds.length ? <P variant="unstyled" className="mt-3 text-xs text-[#526159]">No refunds recorded.</P> : <ul className="mt-3 space-y-3">
          {data.refunds.map((refund) => <li key={refund.id} className="rounded-md bg-[#f6f8f7] p-3">
            <div className="flex flex-wrap justify-between gap-2"><Span className="text-xs font-semibold">{formatMoney(refund.amount, refund.currency)}</Span><Badge value={refund.status} /></div>
            <P variant="unstyled" className="mt-2 break-words text-xs leading-5 text-[#526159]">{refund.reason}</P>
            <P variant="unstyled" className="mt-1 text-[11px] text-[#718578]">{displayDate(refund.createdAt)}</P>
          </li>)}
        </ul>}
      </section>}
      {(selected || retry) && <RefundModal payment={selected} retry={retry} request={request} onClose={() => { setSelected(null); setRetry(null); }} onSaved={saved} />}
    </aside>
  );
}
