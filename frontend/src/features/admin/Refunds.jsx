import { useState } from "react";
import { useStaffData } from "./api";
import { formatMoney, displayDate } from "../../lib/format";
import Inbox from "./Inbox";
import { Loading, ErrorMessage, Empty, Badge, Pagination } from "./ui";
import { panel } from "./styles";
import RefundModal from "./RefundModal";

export default function Refunds({ revision }) {
  const [tab, setTab] = useState("requests"),
    [page, setPage] = useState(1),
    [retry, setRetry] = useState(null);
  const [localRevision, setLocalRevision] = useState(0),
    [notice, setNotice] = useState("");
  const { data, loading, error } = useStaffData(
    `/refunds?page=${page}`,
    revision + localRevision,
  );
  return (
    <div className="space-y-5">
      <div
        role="group"
        aria-label="Refund view"
        className="inline-flex gap-1 rounded-md border border-[#CFDDD5] bg-white p-1"
      >
        {[
          ["requests", "Refund requests"],
          ["history", "Issued refunds"],
        ].map(([value, text]) => (
          <button
            key={value}
            aria-pressed={tab === value}
            className={`rounded-md px-4 py-3 text-sm font-semibold ${tab === value ? "bg-[#294137] text-white" : "text-[#526159]"}`}
            onClick={() => setTab(value)}
          >
            {text}
          </button>
        ))}
      </div>
      {notice && (
        <p role="status" className="admin-notice">
          {notice}
        </p>
      )}
      {tab === "requests" ? (
        <Inbox category="refund" revision={revision} />
      ) : loading ? (
        <Loading />
      ) : error ? (
        <ErrorMessage>{error}</ErrorMessage>
      ) : (
        <section className={`${panel} overflow-hidden`}>
          <header className="admin-panel-header">
            <div>
              <h2>Refund history</h2>
              <p>Includes pending operations that can be safely retried.</p>
            </div>
          </header>
          {!data.refunds.length ? (
            <Empty text="No refunds have been issued through this panel." />
          ) : (
            <div className="admin-table-scroll">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Reason / reference</th>
                    <th>Date</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {data.refunds.map((refund) => (
                    <tr key={refund.id}>
                      <td>
                        {refund.user.email}
                        <p className="mt-1 text-xs text-[#718578]">
                          Issued by{" "}
                          {refund.actor?.name || "Former staff member"}
                        </p>
                      </td>
                      <td>{formatMoney(refund.amount, refund.currency)}</td>
                      <td>
                        <Badge value={refund.status} />
                      </td>
                      <td>
                        <span
                          className="block max-w-52 truncate"
                          title={refund.reason}
                        >
                          {refund.reason}
                        </span>
                        <span className="mt-1 block text-xs text-[#718578]">
                          {refund.stripeRefundId || refund.id}
                        </span>
                      </td>
                      <td>{displayDate(refund.createdAt)}</td>
                      <td>
                        {refund.status === "pending" && (
                          <button
                            className="admin-button"
                            onClick={() => setRetry(refund)}
                          >
                            Retry
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <Pagination data={data} onChange={setPage} label="refunds" />
        </section>
      )}
      {retry && (
        <RefundModal
          retry={retry}
          onClose={() => setRetry(null)}
          onSaved={(text) => {
            setRetry(null);
            setNotice(text);
            setLocalRevision((value) => value + 1);
          }}
        />
      )}
    </div>
  );
}
