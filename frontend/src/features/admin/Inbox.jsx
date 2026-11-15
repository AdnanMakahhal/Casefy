import { useState, useEffect } from "react";
import { useStaffData, adminRequest } from "./api";
import { displayDate, titleCase } from "../../lib/format";
import ComposeMessage from "./ComposeMessage";
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
import { Send, ArrowUpRight } from "lucide-react";

function Conversation({ id, onClose, onChanged }) {
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
        body: JSON.stringify({ status }),
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
          <div className="rounded-xl bg-[#f6f8f7] p-4 text-sm leading-7 whitespace-pre-wrap">
            {data.request.description}
          </div>
          <div className="max-h-64 space-y-3 overflow-y-auto">
            {data.request.messages.map((message) => (
              <article
                key={message.id}
                className="rounded-lg border border-[#CFDDD5] p-4"
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
        <div className="flex flex-wrap items-end gap-4 border-b border-[#CFDDD5] p-5">
          <SearchForm
            onSearch={(value) => {
              setSearch(value);
              setPage(1);
            }}
            placeholder="Search contacts, emails, or subjects..."
          />
          <div className="w-48 max-w-full">
            <p className="mb-2 text-xs font-semibold text-[#526159]">
              Request status
            </p>
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
            <Pagination data={data} onChange={setPage} />
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
