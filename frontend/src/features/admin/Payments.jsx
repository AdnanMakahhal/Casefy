import H2 from "../../ui/H2";
import P from "../../ui/P";
import Span from "../../ui/Span";
import Button from "../../ui/Button";
import { useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import AdminTableSkeleton from "../../ui/AdminTableSkeleton";
import { useStaffData } from "./api";
import { formatMoney, displayDate } from "../../lib/format";
import {
  RiCloseLine as X,
  RiBankCardLine as CreditCard,
  RiMailLine as Mail,
  RiArrowRightUpLine as ArrowUpRight,
  RiRestartLine as RotateCcw,
} from "react-icons/ri";
import { ErrorMessage, Empty, Badge } from "./ui";
import { panel } from "./styles";
import RefundModal from "./RefundModal";
import ComposeMessage from "./ComposeMessage";

export default function Payments({ revision = 0, onLoadingChange }) {
  const [params, setParams] = useSearchParams();
  const userId = params.get("userId") || "";
  const [cursors, setCursors] = useState([""]),
    [selected, setSelected] = useState(null),
    [message, setMessage] = useState(null);
  const [localRevision, setLocalRevision] = useState(0),
    [notice, setNotice] = useState("");
  const { data, loading, error } = useStaffData(
    `/payments?${new URLSearchParams({ userId, after: cursors.at(-1) })}`,
    revision + localRevision,
  );
  useEffect(() => { onLoadingChange?.(loading); }, [loading, onLoadingChange]);
  function saved(text) {
    setSelected(null);
    setMessage(null);
    setNotice(text);
    setLocalRevision((value) => value + 1);
  }
  return (
    <div className="space-y-5">
      {notice && (
        <P variant="unstyled" role="status" className="admin-notice">
          {notice}
        </P>
      )}
      {userId && (
        <Button variant="outline" size="md" type="submit"
          className="border px-5 py-2.5 whitespace-nowrap"
          onClick={() => {
            setParams((current) => { const next = new URLSearchParams(current); next.delete("userId"); return next; });
            setCursors([""]);
          }}
        >
          <X size={15} />
          Clear customer filter
        </Button>
      )}
      {loading ? (
        <AdminTableSkeleton label="Loading payments" columns={6} />
      ) : error ? (
        <ErrorMessage>{error}</ErrorMessage>
      ) : (
        <section className={`${panel} overflow-hidden`}>
          <header className="admin-panel-header">
            <div>
              <H2 variant="unstyled">Payment history</H2>
              <P variant="unstyled">
                Stored payment records · Amounts are shown in the original
                currency.
              </P>
            </div>
            <CreditCard size={20} />
          </header>
          {!data.payments.length ? (
            <Empty text="No payment records for this selection." />
          ) : (
            <div className="admin-table-scroll">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Customer / payment</th>
                    <th>Paid</th>
                    <th>Refunded</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.payments.map((payment) => (
                    <tr key={payment.id}>
                      <td>
                        <strong className="block">
                          {payment.user?.name || "Unlinked customer"}
                        </strong>
                        <Span className="mt-1 block text-xs text-[#526159]">
                          {payment.user?.email || payment.id}
                        </Span>
                      </td>
                      <td>{formatMoney(payment.amount, payment.currency)}</td>
                      <td>
                        {formatMoney(payment.amountRefunded, payment.currency)}
                      </td>
                      <td>
                        <Badge value={payment.status} />
                        {payment.source === "synthetic" && (
                          <Span className="mt-1 block text-[10px] text-[#526159]">
                            Synthetic record
                          </Span>
                        )}
                        {payment.disputed && (
                          <Span className="ml-2 text-xs text-red-700">
                            Disputed
                          </Span>
                        )}
                      </td>
                      <td>{displayDate(payment.createdAt)}</td>
                      <td>
                        <div className="flex gap-2">
                          {payment.user && (
                            <Button variant="unstyled" type="submit"
                              className="admin-icon-button"
                              title="Message customer"
                              aria-label={`Message ${payment.user.email}`}
                              onClick={() => setMessage(payment.user)}
                            >
                              <Mail size={16} />
                            </Button>
                          )}
                          {payment.receiptUrl && (
                            <a
                              className="admin-icon-button"
                              href={payment.receiptUrl}
                              target="_blank"
                              rel="noreferrer"
                              title="Payment receipt"
                              aria-label={`Receipt ${payment.id}`}
                            >
                              <ArrowUpRight size={16} />
                            </a>
                          )}
                          <Button variant="outline" size="md" type="submit"
                            className="border px-5 py-2.5 whitespace-nowrap"
                            disabled={
                              !payment.user ||
                              !payment.refundable ||
                              !payment.paid ||
                              payment.disputed ||
                              payment.amountRefunded >= payment.amount
                            }
                            onClick={() => setSelected(payment)}
                          >
                            <RotateCcw size={14} />
                            Refund
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <footer className="admin-pagination">
            <Span>Page {cursors.length}</Span>
            <div>
              <Button variant="outline" size="md" type="submit"
                className="border px-5 py-2.5 whitespace-nowrap"
                disabled={cursors.length === 1}
                onClick={() => setCursors((values) => values.slice(0, -1))}
              >
                Previous
              </Button>
              <Button variant="outline" size="md" type="submit"
                className="border px-5 py-2.5 whitespace-nowrap"
                disabled={!data.hasMore}
                onClick={() =>
                  setCursors((values) => [...values, data.nextCursor])
                }
              >
                Next
              </Button>
            </div>
          </footer>
        </section>
      )}
      {selected && (
        <RefundModal
          payment={selected}
          onClose={() => setSelected(null)}
          onSaved={saved}
        />
      )}
      {message && (
        <ComposeMessage
          account={message}
          onClose={() => setMessage(null)}
          onSaved={saved}
        />
      )}
    </div>
  );
}
