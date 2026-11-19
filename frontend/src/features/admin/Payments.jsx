import { useSearchParams } from "react-router-dom";
import { useState } from "react";
import { useStaffData } from "./api";
import { formatMoney, displayDate } from "../../lib/format";
import {
  RiCloseLine as X,
  RiBankCardLine as CreditCard,
  RiMailLine as Mail,
  RiArrowRightUpLine as ArrowUpRight,
  RiRestartLine as RotateCcw,
} from "react-icons/ri";
import { Loading, ErrorMessage, Empty, Badge } from "./ui";
import { panel } from "./styles";
import RefundModal from "./RefundModal";
import ComposeMessage from "./ComposeMessage";

export default function Payments({ revision }) {
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
  function saved(text) {
    setSelected(null);
    setMessage(null);
    setNotice(text);
    setLocalRevision((value) => value + 1);
  }
  return (
    <div className="space-y-5">
      {notice && (
        <p role="status" className="admin-notice">
          {notice}
        </p>
      )}
      {userId && (
        <button
          className="admin-button"
          onClick={() => {
            setParams({});
            setCursors([""]);
          }}
        >
          <X size={15} />
          Clear customer filter
        </button>
      )}
      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorMessage>{error}</ErrorMessage>
      ) : (
        <section className={`${panel} overflow-hidden`}>
          <header className="admin-panel-header">
            <div>
              <h2>Payment history</h2>
              <p>
                Stored payment records · Amounts are shown in the original
                currency.
              </p>
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
                        <span className="mt-1 block text-xs text-[#526159]">
                          {payment.user?.email || payment.id}
                        </span>
                      </td>
                      <td>{formatMoney(payment.amount, payment.currency)}</td>
                      <td>
                        {formatMoney(payment.amountRefunded, payment.currency)}
                      </td>
                      <td>
                        <Badge value={payment.status} />
                        {payment.source === "synthetic" && (
                          <span className="mt-1 block text-[10px] text-[#526159]">
                            Synthetic record
                          </span>
                        )}
                        {payment.disputed && (
                          <span className="ml-2 text-xs text-red-700">
                            Disputed
                          </span>
                        )}
                      </td>
                      <td>{displayDate(payment.createdAt)}</td>
                      <td>
                        <div className="flex gap-2">
                          {payment.user && (
                            <button
                              className="admin-icon-button"
                              title="Message customer"
                              aria-label={`Message ${payment.user.email}`}
                              onClick={() => setMessage(payment.user)}
                            >
                              <Mail size={16} />
                            </button>
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
                          <button
                            className="admin-button"
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
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <footer className="admin-pagination">
            <span>Page {cursors.length}</span>
            <div>
              <button
                className="admin-button"
                disabled={cursors.length === 1}
                onClick={() => setCursors((values) => values.slice(0, -1))}
              >
                Previous
              </button>
              <button
                className="admin-button"
                disabled={!data.hasMore}
                onClick={() =>
                  setCursors((values) => [...values, data.nextCursor])
                }
              >
                Next
              </button>
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
