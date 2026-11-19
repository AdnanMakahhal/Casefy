import { useState, useEffect } from "react";
import { useStaffData, adminRequest } from "./api";
import { displayDate, titleCase } from "../../lib/format";
import ComposeMessage from "./ComposeMessage";
import CustomOfferForm from "./CustomOfferForm";
import CustomDealCard from "../../components/CustomDealCard";
import { useAuth } from "../authentication/authContext";
import AccountModal from "../../components/AccountModal";
import {
  Loading,
  ErrorMessage,
  SearchForm,
  Empty,
  Badge,
  Pagination,
} from "./ui";
import SelectMenu from "../../components/SelectMenu";
import { statuses, panel } from "./styles";
import {
  RiSendPlane2Line as Send,
  RiArrowRightUpLine as ArrowUpRight,
} from "react-icons/ri";

function Conversation({ id, onClose, onChanged }) {
  const { user } = useAuth();
  const [revision, setRevision] = useState(0);
  const { data, loading, error } = useStaffData(
    `/inbox/${id}`,
    revision,
    false,
    true,
  );
  const [replying, setReplying] = useState(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState("");
  useEffect(() => {
    if (replying || busy) return;
    const timer = setInterval(() => {
      if (document.visibilityState === "visible")
        setRevision((value) => value + 1);
    }, 5000);
    return () => clearInterval(timer);
  }, [replying, busy]);
  async function changeStatus(status) {
    setBusy(true);
    setActionError("");
    try {
      await adminRequest(`/inbox/${id}`, {
        method: "PATCH",
        body: JSON.stringify(typeof status === "string" ? { status } : status),
      });
      setRevision((value) => value + 1);
      onChanged();
    } catch (err) {
      setActionError(err.message);
    } finally {
      setBusy(false);
    }
  }
  if (replying)
    return (
      <ComposeMessage
        account={replying.user}
        request={replying}
        onClose={() => setReplying(null)}
        onSaved={() => {
          setReplying(null);
          setRevision((value) => value + 1);
          onChanged();
        }}
      />
    );
  return (
    <AccountModal
      title={`Contact request #${id}`}
      onDismiss={onClose}
      busy={busy}
    >
      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorMessage>{error}</ErrorMessage>
      ) : (
        <div className="space-y-5">
          <div>
            <h3 className="text-lg font-bold">{data.request.subject}</h3>
            <p className="mt-2 text-sm text-[#526159]">
              {data.request.name} · {data.request.email}
            </p>
            <p className="mt-1 text-xs text-[#718578]">
              {displayDate(data.request.createdAt)} ·{" "}
              {titleCase(data.request.category)}
              {data.request.user
                ? ` · ${titleCase(data.request.user.plan)} plan`
                : " · Guest contact"}
            </p>
          </div>
          <div className="rounded-md bg-[#f6f8f7] p-4 text-sm leading-7 whitespace-pre-wrap">
            {data.request.description}
          </div>
          {data.request.details && (
            <dl className="grid gap-3 sm:grid-cols-2">
              {Object.entries(data.request.details).map(([key, value]) => (
                <div key={key}>
                  <dt className="text-xs capitalize text-[#526159]">
                    {key.replace(/([A-Z])/g, " $1")}
                  </dt>
                  <dd className="mt-1 break-words text-sm font-medium">
                    {["budget", "refundAmount"].includes(key)
                      ? new Intl.NumberFormat(undefined, {
                          style: "currency",
                          currency: "USD",
                        }).format(Number(value) / 100)
                      : String(value)}
                  </dd>
                </div>
              ))}
            </dl>
          )}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-[#526159]">
              Assigned to {data.request.assignedTo?.name || "unassigned"}
            </p>
            <button
              disabled={busy}
              className="admin-button"
              onClick={() => changeStatus({ assignToMe: true })}
            >
              Assign to me
            </button>
          </div>
          {data.request.deals?.map((deal) => (
            <CustomDealCard key={deal.id} deal={deal} />
          ))}
          {data.request.category === "custom" &&
            data.request.user &&
            ["admin", "manager"].includes(user.role) && (
              <CustomOfferForm
                request={data.request}
                onSaved={() => {
                  setRevision((value) => value + 1);
                  onChanged();
                }}
              />
            )}
          <div className="max-h-64 space-y-3 overflow-y-auto">
            {data.request.messages.map((message) => (
              <article
                key={message.id}
                className="rounded-md border border-[#CFDDD5] p-4"
              >
                <div className="flex flex-wrap justify-between gap-2 text-xs text-[#526159]">
                  <strong>{message.sender?.name || "Casefy team"}</strong>
                  <span>
                    {titleCase(message.channel)} ·{" "}
                    {titleCase(message.deliveryStatus)}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-6 whitespace-pre-wrap">
                  {message.body}
                </p>
                <p className="mt-2 text-[11px] text-[#718578]">
                  {displayDate(message.createdAt)}
                </p>
              </article>
            ))}
          </div>
          <ErrorMessage>{actionError}</ErrorMessage>
          <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
            <SelectMenu
              label="Request status"
              value={data.request.status}
              disabled={busy}
              onChange={changeStatus}
              options={statuses.map((status) => ({
                value: status,
                label: titleCase(status),
                description:
                  status === "open"
                    ? "Needs attention"
                    : status === "pending"
                      ? "Waiting for a response"
                      : "Conversation complete",
              }))}
            />
            <button
              className="admin-button primary"
              disabled={busy}
              onClick={() => setReplying(data.request)}
            >
              <Send size={16} />
              Reply
            </button>
          </div>
        </div>
      )}
    </AccountModal>
  );
}

export default function Inbox({ category, revision = 0 }) {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [localRevision, setLocalRevision] = useState(0);
  const [selected, setSelected] = useState(null);
  const { data, loading, error } = useStaffData(
    `/inbox?${new URLSearchParams({ category, status, search, page })}`,
    revision + localRevision,
    false,
    true,
  );
  useEffect(() => {
    const timer = setInterval(() => {
      if (document.visibilityState === "visible")
        setLocalRevision((value) => value + 1);
    }, 15000);
    return () => clearInterval(timer);
  }, []);
  return (
    <>
      <section className={`${panel} overflow-visible`}>
        <div className="flex flex-col items-stretch gap-4 border-b border-[#CFDDD5] p-5 sm:flex-row sm:flex-wrap sm:items-end">
          <SearchForm
            onSearch={(value) => {
              setSearch(value);
              setPage(1);
            }}
            placeholder="Search contacts, emails, or subjects..."
            liveSearch
          />
          <div className="w-full sm:w-48">
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
                  label: titleCase(value),
                })),
              ]}
            />
          </div>
        </div>
        {loading ? (
          <Loading />
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
                  <button
                    key={request.id}
                    onClick={() => setSelected(request.id)}
                    className="flex w-full items-start gap-4 px-6 py-5 text-left hover:bg-[#f6f8f7]"
                  >
                    <span className="admin-avatar">
                      {request.name.slice(0, 1).toUpperCase()}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-2">
                        <strong className="text-sm">{request.subject}</strong>
                        <Badge value={request.status} />
                      </span>
                      <span className="mt-2 block text-xs text-[#526159]">
                        {request.name} · {request.email}
                      </span>
                      <span className="mt-2 block truncate text-sm text-[#718578]">
                        {request.description}
                      </span>
                      <span className="mt-2 block text-[11px] text-[#718578]">
                        {displayDate(request.createdAt)} ·{" "}
                        {request._count.messages} replies
                      </span>
                    </span>
                    <ArrowUpRight
                      size={17}
                      className="shrink-0 text-[#526159]"
                    />
                  </button>
                ))}
              </div>
            )}
            <Pagination data={data} onChange={setPage} label="conversations" />
          </>
        )}
      </section>
      {selected && (
        <Conversation
          id={selected}
          onClose={() => setSelected(null)}
          onChanged={() => setLocalRevision((value) => value + 1)}
        />
      )}
    </>
  );
}
