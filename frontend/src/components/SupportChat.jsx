import { useCallback, useEffect, useRef, useState } from "react";
import {
  RiArrowLeftLine as ArrowLeft,
  RiArrowRightUpLine as ArrowUpRight,
  RiCheckLine as Check,
  RiArrowDownSLine as ChevronDown,
  RiInboxLine as Inbox,
  RiLoader4Line as LoaderCircle,
  RiChat3Line as MessageCircle,
  RiAddLine as Plus,
  RiSendPlane2Line as Send,
  RiTicket2Line as Ticket,
  RiCloseLine as X,
} from "react-icons/ri";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../features/authentication/authContext";
import { useSupportChat } from "../features/support-chat/context";
import { displayDate, titleCase } from "../lib/format";
import { sessionRequest } from "../lib/api";
import SelectMenu from "./SelectMenu";
import SupportRequestFields from "./SupportRequestFields";
import CustomDealCard from "./CustomDealCard";
import "./SupportChat.css";

const pages = new Set([
  "/",
  "/features",
  "/how-it-works",
  "/use-cases",
  "/pricing",
  "/docs",
  "/dashboard",
  "/executions",
]);
const categoryLabels = {
  support: "General support",
  refund: "Billing & refunds",
  custom: "Custom enquiry",
  contact: "Contact our team",
  live_chat: "Live chat",
};

function Skeleton() {
  return (
    <div className="support-chat-skeleton" role="status" aria-busy="true">
      <span className="sr-only">Loading your conversations...</span>
      {[1, 2, 3].map((key) => (
        <div aria-hidden="true" key={key} />
      ))}
    </div>
  );
}

function Chat({ user }) {
  const { open, openChat, closeChat } = useSupportChat();
  const [tab, setTab] = useState("tickets");
  const [creating, setCreating] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [selectedMessageId, setSelectedMessageId] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(Boolean(user));
  const [loadError, setLoadError] = useState("");
  const [actionError, setActionError] = useState("");
  const [busy, setBusy] = useState(false);
  const [category, setCategory] = useState("support");
  const [requestDetails, setRequestDetails] = useState({});
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [reply, setReply] = useState("");
  const [retry, setRetry] = useState(0);
  const launcher = useRef(null),
    heading = useRef(null),
    thread = useRef(null),
    lastTicket = useRef(null),
    followThread = useRef(true);
  const lifecycle = useRef({
    active: false,
    sequence: 0,
    inFlight: false,
    queued: false,
  });
  const selected = tickets.find((ticket) => ticket.id === selectedId);
  const selectedMessage = messages.find(
    (message) => message.id === selectedMessageId,
  );
  const unread = messages.filter((message) => !message.readAt).length;
  const unreadTicketMessages =
    open && selectedId
      ? messages
          .filter(
            (message) =>
              !message.readAt && message.supportRequestId === selectedId,
          )
          .map((message) => message.id)
          .join(",")
      : "";

  useEffect(() => {
    const state = lifecycle.current;
    state.active = true;
    return () => {
      state.active = false;
      state.sequence++;
    };
  }, []);
  const refresh = useCallback(async function poll() {
    const state = lifecycle.current;
    if (state.inFlight) {
      state.queued = true;
      return;
    }
    state.inFlight = true;
    const sequence = ++state.sequence;
    try {
      const [requestData, messageData] = await Promise.all([
        sessionRequest("/support/mine"),
        sessionRequest("/messages"),
      ]);
      if (!state.active || sequence !== state.sequence) return;
      setTickets(requestData.requests);
      setMessages(messageData.messages);
      setLoadError("");
    } catch (error) {
      if (state.active && sequence === state.sequence)
        setLoadError(error.message);
    } finally {
      state.inFlight = false;
      if (state.active && sequence === state.sequence) setLoading(false);
      if (state.queued && state.active) {
        state.queued = false;
        queueMicrotask(poll);
      }
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    queueMicrotask(() => {
      if (lifecycle.current.active) refresh();
    });
    const interval = setInterval(
      () => {
        if (document.visibilityState === "visible") refresh();
      },
      open ? 5000 : 30000,
    );
    const onFocus = () => refresh();
    window.addEventListener("focus", onFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, [user, open, retry, refresh]);

  useEffect(() => {
    if (!open) return;
    heading.current?.focus();
    const onKey = (event) => {
      if (event.key === "Escape") {
        closeChat();
        launcher.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, closeChat]);

  useEffect(() => {
    if (!unreadTicketMessages) return;
    const ids = unreadTicketMessages.split(",").map(Number);
    let active = true;
    Promise.all(
      ids.map((id) =>
        sessionRequest(`/messages/${id}/read`, { method: "POST" }),
      ),
    )
      .then(() => {
        if (active)
          setMessages((current) =>
            current.map((message) =>
              ids.includes(message.id)
                ? { ...message, readAt: new Date().toISOString() }
                : message,
            ),
          );
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [unreadTicketMessages]);

  const lastMessageId = selected?.messages.at(-1)?.id;
  useEffect(() => {
    const area = thread.current;
    if (!area || !open || !selected) return;
    if (lastTicket.current !== selected.id || followThread.current)
      area.scrollTop = area.scrollHeight;
    lastTicket.current = selected.id;
  }, [selected, lastMessageId, open]);

  function back() {
    setSelectedId(null);
    setSelectedMessageId(null);
    setCreating(false);
    setActionError("");
  }
  function newTicket(prefill = "") {
    setCreating(true);
    setSelectedId(null);
    setSelectedMessageId(null);
    setSubject(prefill || subject);
    setActionError("");
  }
  function openTicket(id) {
    followThread.current = true;
    setSelectedId(id);
    setSelectedMessageId(null);
    setCreating(false);
    setReply("");
    setActionError("");
  }
  function minimize() {
    closeChat();
    launcher.current?.focus();
  }
  async function openMessage(message) {
    if (message.supportRequestId) {
      openTicket(message.supportRequestId);
      return;
    }
    setSelectedMessageId(message.id);
    setActionError("");
    if (message.readAt) return;
    try {
      await sessionRequest(`/messages/${message.id}/read`, { method: "POST" });
      if (lifecycle.current.active)
        setMessages((current) =>
          current.map((item) =>
            item.id === message.id
              ? { ...item, readAt: new Date().toISOString() }
              : item,
          ),
        );
    } catch (error) {
      if (lifecycle.current.active) setActionError(error.message);
    }
  }
  async function createTicket(event) {
    event.preventDefault();
    if (busy || !subject.trim() || !description.trim()) return;
    setBusy(true);
    setActionError("");
    try {
      const result = await sessionRequest("/support", {
        method: "POST",
        body: JSON.stringify({
          name: user.name,
          email: user.email,
          subject: subject.trim(),
          description: description.trim(),
          category,
          details: requestDetails,
        }),
      });
      if (!lifecycle.current.active) return;
      setTickets((current) => [
        {
          id: result.id,
          subject: subject.trim(),
          description: description.trim(),
          category,
          status: "open",
          createdAt: new Date().toISOString(),
          messages: [],
        },
        ...current,
      ]);
      setSubject("");
      setDescription("");
      setCreating(false);
      setTab("tickets");
      setSelectedId(result.id);
      await refresh();
    } catch (error) {
      if (lifecycle.current.active) setActionError(error.message);
    } finally {
      if (lifecycle.current.active) setBusy(false);
    }
  }
  async function sendReply(event) {
    event.preventDefault();
    if (busy || !reply.trim()) return;
    setBusy(true);
    setActionError("");
    try {
      await sessionRequest(`/support/${selectedId}/reply`, {
        method: "POST",
        body: JSON.stringify({ body: reply.trim() }),
      });
      if (!lifecycle.current.active) return;
      setReply("");
      await refresh();
    } catch (error) {
      if (lifecycle.current.active) setActionError(error.message);
    } finally {
      if (lifecycle.current.active) setBusy(false);
    }
  }

  const detail = creating || selectedId || selectedMessageId;
  return (
    <div className="support-chat-widget">
      <section
        id="casefy-support-chat"
        role="dialog"
        aria-modal="false"
        aria-labelledby="support-chat-title"
        className="support-chat-panel"
        hidden={!open}
      >
        <header className="support-chat-header">
          {detail && (
            <button
              type="button"
              className="support-chat-header-button"
              aria-label="Back to conversations"
              onClick={back}
              disabled={busy}
            >
              <ArrowLeft size={19} />
            </button>
          )}
          <span className="support-chat-mark">
            <MessageCircle size={21} />
          </span>
          <div className="support-chat-heading">
            <h2 ref={heading} tabIndex={-1} id="support-chat-title">
              Casefy support
            </h2>
            <p>Chat with our team</p>
          </div>
          <button
            type="button"
            className="support-chat-header-button"
            onClick={minimize}
            aria-label="Minimize support chat"
          >
            <ChevronDown size={22} />
          </button>
        </header>

        {!user ? (
          <div className="support-chat-welcome">
            <span>
              <MessageCircle size={30} />
            </span>
            <h3>How can we help?</h3>
            <p>
              Sign in to chat with the Casefy support team. Your conversations
              stay in your account.
            </p>
            <Link to="/signin" className="support-chat-primary">
              Sign in to chat <ArrowUpRight size={16} />
            </Link>
            <p className="support-chat-small">
              Need help signing in? <Link to="/support">Contact support</Link>
            </p>
          </div>
        ) : (
          <>
            {!detail && (
              <>
                <div className="support-chat-intro">
                  <h3>
                    Hi, {user.name.split(" ")[0]}{" "}
                    <span aria-hidden="true">👋</span>
                  </h3>
                  <p>Have a question? Start a conversation.</p>
                  <button
                    type="button"
                    className="support-chat-primary"
                    onClick={() => newTicket()}
                  >
                    <Plus size={17} />
                    Start a conversation
                  </button>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {[
                      ["live_chat", "Live chat"],
                      ["custom", "Custom plan"],
                      ["refund", "Refund"],
                      ["contact", "Contact"],
                    ].map(([value, label]) => (
                      <button
                        key={value}
                        type="button"
                        className="min-h-11 rounded-md border border-[#CFDDD5] bg-white px-3 text-xs font-semibold text-[#294137]"
                        onClick={() => {
                          setCategory(value);
                          setRequestDetails({});
                          newTicket(
                            value === "live_chat"
                              ? "Live support conversation"
                              : "",
                          );
                        }}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
                <div
                  className="support-chat-tabs"
                  role="group"
                  aria-label="Support inbox view"
                >
                  <button
                    type="button"
                    aria-pressed={tab === "tickets"}
                    onClick={() => setTab("tickets")}
                  >
                    <Ticket size={15} />
                    My tickets
                  </button>
                  <button
                    type="button"
                    aria-pressed={tab === "messages"}
                    onClick={() => setTab("messages")}
                  >
                    <Inbox size={15} />
                    Messages{unread > 0 && <span>{Math.min(unread, 99)}</span>}
                  </button>
                </div>
              </>
            )}
            {loadError && (
              <div className="support-chat-error" role="alert">
                {loadError}
                <button
                  type="button"
                  onClick={() => setRetry((value) => value + 1)}
                >
                  Retry
                </button>
              </div>
            )}

            {creating ? (
              <form className="support-chat-new-ticket" onSubmit={createTicket}>
                <div className="support-chat-form-body">
                  <h3>Open a support ticket</h3>
                  <p>
                    Our support team will reply here. Conversations are saved to
                    your account.
                  </p>
                  <fieldset disabled={busy}>
                    <div>
                      <label htmlFor="support-chat-topic">Topic</label>
                      <SelectMenu
                        id="support-chat-topic"
                        label="Support topic"
                        className="mt-2"
                        value={category}
                        onChange={setCategory}
                        disabled={busy}
                        options={[
                          {
                            value: "support",
                            label: categoryLabels.support,
                            description:
                              "Account questions and technical issues",
                          },
                          {
                            value: "refund",
                            label: categoryLabels.refund,
                            description: "Payments, subscriptions, and refunds",
                          },
                          {
                            value: "custom",
                            label: categoryLabels.custom,
                            description:
                              "Custom plans, seats, and team requirements",
                          },
                          {
                            value: "contact",
                            label: "Contact our team",
                            description: "Business and general enquiries",
                          },
                          {
                            value: "live_chat",
                            label: "Live chat",
                            description: "Talk to a support agent",
                          },
                        ]}
                      />
                    </div>
                    <SupportRequestFields
                      category={category}
                      value={requestDetails}
                      onChange={setRequestDetails}
                    />
                    <label>
                      Subject
                      <input
                        value={subject}
                        onChange={(event) => setSubject(event.target.value)}
                        required
                        maxLength={160}
                        placeholder="What do you need help with?"
                      />
                    </label>
                    <label>
                      Message
                      <textarea
                        value={description}
                        onChange={(event) => setDescription(event.target.value)}
                        required
                        maxLength={5000}
                        rows={5}
                        placeholder="Tell us a little more..."
                      />
                    </label>
                  </fieldset>
                  {actionError && (
                    <p className="support-chat-error" role="alert">
                      {actionError}
                    </p>
                  )}
                </div>
                <footer>
                  <button
                    className="support-chat-primary"
                    disabled={busy || !subject.trim() || !description.trim()}
                  >
                    {busy ? (
                      <LoaderCircle size={17} className="support-chat-spin" />
                    ) : (
                      <Send size={16} />
                    )}
                    {busy ? "Opening ticket..." : "Send & open ticket"}
                  </button>
                </footer>
              </form>
            ) : selectedId ? (
              selected ? (
                <>
                  <div className="support-chat-ticket-heading">
                    <div>
                      <h3>{selected.subject}</h3>
                      <p>
                        Ticket #{selected.id} ·{" "}
                        {categoryLabels[selected.category]}
                      </p>
                    </div>
                    <span className={`support-chat-status ${selected.status}`}>
                      {titleCase(selected.status)}
                    </span>
                  </div>
                  <div
                    ref={thread}
                    onScroll={(event) => {
                      const area = event.currentTarget;
                      followThread.current =
                        area.scrollHeight - area.scrollTop - area.clientHeight <
                        100;
                    }}
                    className="support-chat-thread"
                    role="log"
                    aria-label="Ticket conversation"
                    aria-live="polite"
                    aria-relevant="additions text"
                  >
                    <p className="support-chat-date">
                      {displayDate(selected.createdAt)}
                    </p>
                    <article className="support-chat-bubble own">
                      <p>{selected.description}</p>
                      <small>You · Ticket opened</small>
                    </article>
                    {selected.deals?.map((deal) => (
                      <CustomDealCard
                        key={deal.id}
                        deal={deal}
                        customer
                        onChanged={refresh}
                      />
                    ))}
                    {selected.messages.map((message) => (
                      <article
                        key={message.id}
                        className={`support-chat-bubble ${message.senderId === user.id ? "own" : "team"}`}
                      >
                        {message.senderId !== user.id && (
                          <strong>
                            {message.sender?.name || "Casefy support"} · Team
                          </strong>
                        )}
                        <p>{message.body}</p>
                        <small>
                          {new Date(message.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                          {message.senderId === user.id && (
                            <Check size={11} aria-label="Sent" />
                          )}
                        </small>
                      </article>
                    ))}
                    {selected.messages.length === 0 && (
                      <p className="support-chat-awaiting">
                        Your ticket is open. Our team will reply here.
                      </p>
                    )}
                  </div>
                  <form className="support-chat-composer" onSubmit={sendReply}>
                    {actionError && (
                      <p className="support-chat-error" role="alert">
                        {actionError}
                      </p>
                    )}
                    <div>
                      <textarea
                        aria-label="Message to the support team"
                        aria-describedby="support-chat-send-hint"
                        placeholder={
                          selected.status === "resolved"
                            ? "Reply to reopen this ticket..."
                            : "Write a message..."
                        }
                        value={reply}
                        onChange={(event) => setReply(event.target.value)}
                        maxLength={10000}
                        required
                        rows={2}
                        disabled={busy}
                        onKeyDown={(event) => {
                          if (
                            event.key === "Enter" &&
                            !event.shiftKey &&
                            !event.nativeEvent.isComposing
                          ) {
                            event.preventDefault();
                            if (!busy && reply.trim())
                              event.currentTarget.form.requestSubmit();
                          }
                        }}
                      />
                      <button
                        type="submit"
                        disabled={busy || !reply.trim()}
                        aria-label="Send message"
                      >
                        {busy ? (
                          <LoaderCircle
                            size={18}
                            className="support-chat-spin"
                          />
                        ) : (
                          <Send size={18} />
                        )}
                      </button>
                    </div>
                    <p id="support-chat-send-hint">
                      Enter to send · Shift + Enter for a new line
                    </p>
                  </form>
                </>
              ) : loading ? (
                <Skeleton />
              ) : (
                <div className="support-chat-empty">
                  <Ticket size={25} />
                  <p>This ticket is unavailable.</p>
                  <button type="button" onClick={back}>
                    Back to tickets
                  </button>
                </div>
              )
            ) : selectedMessageId ? (
              selectedMessage ? (
                <div className="support-chat-message">
                  <span className="support-chat-status">
                    From the Casefy team
                  </span>
                  <h3>{selectedMessage.subject}</h3>
                  <small>{displayDate(selectedMessage.createdAt)}</small>
                  <p>{selectedMessage.body}</p>
                  <button
                    type="button"
                    className="support-chat-primary"
                    onClick={() =>
                      newTicket(`Re: ${selectedMessage.subject}`.slice(0, 160))
                    }
                  >
                    Ask a question <Send size={15} />
                  </button>
                  {actionError && (
                    <p className="support-chat-error" role="alert">
                      {actionError}
                    </p>
                  )}
                </div>
              ) : (
                <Skeleton />
              )
            ) : loading ? (
              <Skeleton />
            ) : (
              <div className="support-chat-list">
                {tab === "tickets" ? (
                  tickets.length ? (
                    tickets.map((ticket) => (
                      <button
                        type="button"
                        key={ticket.id}
                        onClick={() => openTicket(ticket.id)}
                      >
                        <span className="support-chat-list-icon">
                          <Ticket size={18} />
                        </span>
                        <span>
                          <strong>{ticket.subject}</strong>
                          <small>
                            #{ticket.id} · {titleCase(ticket.status)}
                          </small>
                          <p>
                            {ticket.messages.at(-1)?.body || ticket.description}
                          </p>
                        </span>
                        {messages.some(
                          (message) =>
                            !message.readAt &&
                            message.supportRequestId === ticket.id,
                        ) && <i className="support-chat-unread-dot" />}
                      </button>
                    ))
                  ) : (
                    <div className="support-chat-empty">
                      <MessageCircle size={27} />
                      <h3>No tickets yet</h3>
                      <p>Open a ticket and we’ll help you here.</p>
                    </div>
                  )
                ) : messages.length ? (
                  messages.map((message) => (
                    <button
                      type="button"
                      key={message.id}
                      onClick={() => openMessage(message)}
                    >
                      <span className="support-chat-list-icon">
                        <Inbox size={18} />
                      </span>
                      <span>
                        <strong>{message.subject}</strong>
                        <small>{message.sender?.name || "Casefy team"}</small>
                        <p>{message.body}</p>
                      </span>
                      {!message.readAt && (
                        <i className="support-chat-unread-dot" />
                      )}
                    </button>
                  ))
                ) : (
                  <div className="support-chat-empty">
                    <Inbox size={27} />
                    <h3>You’re all caught up</h3>
                    <p>Account updates and team messages appear here.</p>
                  </div>
                )}
              </div>
            )}
          </>
        )}
        <div className="support-chat-powered">
          <MessageCircle size={12} />
          Support by Casefy
        </div>
      </section>
      <button
        ref={launcher}
        type="button"
        className="support-chat-launcher"
        onClick={() => (open ? minimize() : openChat())}
        aria-label={
          open
            ? "Minimize support chat"
            : `Open support chat${unread ? `, ${unread} unread messages` : ""}`
        }
        aria-expanded={open}
        aria-controls="casefy-support-chat"
      >
        {open ? <X size={24} /> : <MessageCircle size={25} />}
        <span>{open ? "Close" : "Support"}</span>
        {!open && unread > 0 && <b>{unread > 99 ? "99+" : unread}</b>}
      </button>
    </div>
  );
}

export default function SupportChat() {
  const { user, isLoading } = useAuth();
  const { pathname } = useLocation();
  if (
    isLoading ||
    ["admin", "manager"].includes(user?.role) ||
    (!pages.has(pathname) &&
      !pathname.startsWith("/settings") &&
      !pathname.startsWith("/workspaces") &&
      ![
        "/support",
        "/messages",
        "/test-generator",
        "/reports",
        "/profile",
      ].includes(pathname))
  )
    return null;
  return <Chat key={user?.id || "guest"} user={user} />;
}
