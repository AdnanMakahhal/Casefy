import H2 from "../ui/H2";
import P from "../ui/P";
import Span from "../ui/Span";
import Button from "../ui/Button";
import { useCallback, useEffect, useRef, useState } from "react";
import { motion as Motion, useReducedMotion } from "motion/react";
import AnimatedIcon from "../ui/AnimatedIcon";
import {
  RiArrowLeftLine as ArrowLeft,
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
import { useAuth } from "../features/authentication/authContext";
import { useSupportChat } from "../features/support-chat/context";
import { displayDate, titleCase } from "../lib/format";
import { sessionRequest } from "../lib/api";
import SelectMenu from "./SelectMenu";
import SupportRequestFields from "./SupportRequestFields";
import GuestSupport from "../features/support-chat/GuestSupport";

const categoryLabels = {
  support: "General support",
  payment: "Payments",
  refund: "Refund request",
  contact: "Contact our team",
  live_chat: "Live chat",
};

function Skeleton() {
  return (
    <div className="support-chat-skeleton" role="status" aria-busy="true">
      <Span className="sr-only">Loading your conversations...</Span>
      {[1, 2, 3].map((key) => (
        <div aria-hidden="true" key={key} />
      ))}
    </div>
  );
}

function Chat({ user }) {
  const reducedMotion = useReducedMotion();
  const { open, openChat, closeChat, requestedTopic } = useSupportChat();
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
  const selectedClosed = selected?.status === "resolved";
  const resetConversation = useCallback(() => {
    setSelectedId(null);
    setSelectedMessageId(null);
    setCreating(false);
    setReply("");
    setActionError("");
    setTab("tickets");
  }, []);
  useEffect(() => {
    if (!open || !selectedClosed) return;
    const timer = setTimeout(resetConversation, 2000);
    return () => clearTimeout(timer);
  }, [open, selectedClosed, selectedId, resetConversation]);
  const selectedMessage = messages.find(
    (message) => message.id === selectedMessageId,
  );
  const unread = messages.filter((message) => !message.readAt).length;
  const userId = user?.id;
  useEffect(() => {
    if (!userId || !requestedTopic) return;
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      setCategory(requestedTopic.category);
      setRequestDetails({});
      setCreating(true);
      setSelectedId(null);
      setSelectedMessageId(null);
      setActionError("");
    });
    return () => { active = false; };
  }, [requestedTopic, userId]);
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
        resetConversation();
        closeChat();
        launcher.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, closeChat, resetConversation]);

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
    if (selectedClosed || lastTicket.current !== selected.id || followThread.current)
      area.scrollTop = area.scrollHeight;
    lastTicket.current = selected.id;
  }, [selected, lastMessageId, open, selectedClosed]);

  function back() {
    resetConversation();
  }
  function newTicket(prefill = "") {
    setCreating(true);
    setSelectedId(null);
    setSelectedMessageId(null);
    setSubject(prefill || subject);
    setActionError("");
  }
  function openTicket(id) {
    if (tickets.find((ticket) => ticket.id === id)?.status === "resolved") return;
    followThread.current = true;
    setSelectedId(id);
    setSelectedMessageId(null);
    setCreating(false);
    setReply("");
    setActionError("");
  }
  function minimize() {
    resetConversation();
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
          status: "pending",
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
    if (busy || selectedClosed || !reply.trim()) return;
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
      <Motion.section
        id="casefy-support-chat"
        role="dialog"
        aria-modal="false"
        aria-labelledby="support-chat-title"
        className="support-chat-panel"
        initial={false}
        animate={{ opacity: open ? 1 : 0, y: open || reducedMotion ? 0 : 18, scale: open || reducedMotion ? 1 : 0.94 }}
        transition={reducedMotion ? { duration: 0 } : {
          type: "spring", duration: 0.32, bounce: 0.1, delay: 0.06,
          opacity: { type: "tween", duration: 0.2, delay: 0.06, ease: "easeInOut" },
        }}
        style={{ transformOrigin: "bottom right", pointerEvents: open ? "auto" : "none" }}
        inert={!open}
        aria-hidden={!open}
      >
        <header className="support-chat-header">
          {detail && (
            <Button variant="unstyled"
              type="button"
              className="support-chat-header-button"
              aria-label="Back to conversations"
              onClick={back}
              disabled={busy}
            >
              <ArrowLeft size={19} />
            </Button>
          )}
          <Span className="support-chat-mark">
            <MessageCircle size={21} />
          </Span>
          <div className="support-chat-heading">
            <H2 variant="unstyled" ref={heading} tabIndex={-1} id="support-chat-title">
              Casefy support
            </H2>
            <P variant="unstyled">Chat with our team</P>
          </div>
          <Button variant="unstyled"
            type="button"
            className="support-chat-header-button"
            onClick={minimize}
            aria-label="Minimize support chat"
          >
            <ChevronDown size={22} />
          </Button>
        </header>

        {!user ? (
          <GuestSupport key={requestedTopic?.id || "guest"} initialCategory={requestedTopic?.category} />
        ) : (
          <>
            {!detail && (
              <>
                <div className="support-chat-intro">
                  <Button variant="unstyled" className="support-chat-primary" onClick={() => newTicket()}>
                    <Plus size={17} />Start a conversation
                  </Button>
                </div>
                <div className="support-chat-tabs" role="group" aria-label="Support inbox view">
                  <Button variant="unstyled" aria-pressed={tab === "tickets"} onClick={() => setTab("tickets")}><Ticket size={15} />My tickets</Button>
                  <Button variant="unstyled" aria-pressed={tab === "messages"} onClick={() => setTab("messages")}><Inbox size={15} />Messages{unread > 0 && <Span>{Math.min(unread, 99)}</Span>}</Button>
                </div>
              </>
            )}
            {loadError && <div className="support-chat-error" role="alert">{loadError}<Button variant="unstyled" onClick={() => setRetry((value) => value + 1)}>Retry</Button></div>}
            {creating ? (
              <form className="support-chat-new-ticket" onSubmit={createTicket}>
                <div className="support-chat-form-body">
                  <h3>Open a support ticket</h3>
                  <P variant="unstyled">Our support team will reply here. Conversations are saved to your account.</P>
                  <fieldset disabled={busy}>
                    <div>
                      <label htmlFor="support-chat-topic">Topic</label>
                      <SelectMenu id="support-chat-topic" label="Support topic" className="mt-2" value={category} onChange={(value) => { setCategory(value); setRequestDetails({}); }} disabled={busy} options={[
                        { value: "support", label: categoryLabels.support, description: "Account questions and technical issues" },
                        { value: "payment", label: categoryLabels.payment, description: "Payment questions and billing history" },
                        { value: "refund", label: categoryLabels.refund, description: "Request a refund for a payment" },
                        { value: "contact", label: categoryLabels.contact, description: "Business and general enquiries" },
                        { value: "live_chat", label: categoryLabels.live_chat, description: "Talk to a support agent" },
                      ]} />
                    </div>
                    <SupportRequestFields category={category} value={requestDetails} onChange={setRequestDetails} />
                    <label>Subject<input value={subject} onChange={(event) => setSubject(event.target.value)} required maxLength={160} placeholder="What do you need help with?" /></label>
                    <label>Message<textarea value={description} onChange={(event) => setDescription(event.target.value)} required maxLength={5000} rows={5} placeholder="Tell us a little more..." /></label>
                  </fieldset>
                  {actionError && <P variant="unstyled" className="support-chat-error" role="alert">{actionError}</P>}
                </div>
                <footer>
                  <Button variant="unstyled" type="submit" className="support-chat-primary" disabled={busy || !subject.trim() || !description.trim()}>
                    {busy ? <LoaderCircle size={17} className="support-chat-spin" /> : <Send size={16} />}{busy ? "Opening ticket..." : "Send & open ticket"}
                  </Button>
                </footer>
              </form>
            ) : selectedId ? (
              selected ? (
                <>
                  <div className="support-chat-ticket-heading">
                    <div><h3>{selected.subject}</h3><P variant="unstyled">Ticket #{selected.id} · {categoryLabels[selected.category] || "General support"}</P></div>
                    <Span className={`support-chat-status ${selected.status}`}>{selectedClosed ? "Closed" : titleCase(selected.status)}</Span>
                  </div>
                  <div ref={thread} onScroll={(event) => { const area = event.currentTarget; followThread.current = area.scrollHeight - area.scrollTop - area.clientHeight < 100; }} className="support-chat-thread" role="log" aria-label="Ticket conversation" aria-live="polite" aria-relevant="additions text">
                    <P variant="unstyled" className="support-chat-date">{displayDate(selected.createdAt)}</P>
                    <article className="support-chat-bubble own"><P variant="unstyled">{selected.description}</P><small>You · Ticket opened</small></article>
                    {selected.messages.map((message) => (
                      <article key={message.id} className={`support-chat-bubble ${message.senderId === user.id ? "own" : "team"}`}>
                        {message.senderId !== user.id && <strong>{message.channel === "support_bot" ? "Casefy assistant · Automated" : `${message.sender?.name || "Casefy support"} · Team`}</strong>}
                        <P variant="unstyled">{message.body}</P>
                        <small>{displayDate(message.createdAt)}{message.senderId === user.id && <Check size={12} aria-hidden="true" />}</small>
                      </article>
                    ))}
                    {!selected.messages.length && <P variant="unstyled" className="support-chat-awaiting">Our team will reply here.</P>}
                    {selectedClosed && <P variant="unstyled" role="status" className="rounded-md border border-[#cfddd5] bg-[#edf3ef] p-3 text-center text-xs leading-5 text-[#294137]">Ticket is closed. Returning to conversations...</P>}
                  </div>
                  {!selectedClosed && <form className="support-chat-composer" onSubmit={sendReply}>
                    <div><textarea aria-label="Reply to conversation" value={reply} onChange={(event) => setReply(event.target.value)} maxLength={5000} rows={2} placeholder="Write a reply..." disabled={busy} required /><Button variant="unstyled" type="submit" aria-label="Send reply" disabled={busy || !reply.trim()}>{busy ? <LoaderCircle size={17} className="support-chat-spin" /> : <Send size={17} />}</Button></div>
                    {actionError && <P variant="unstyled" className="support-chat-error" role="alert">{actionError}</P>}
                    <P variant="unstyled">Your conversation is saved to your account.</P>
                  </form>}
                </>
              ) : <div className="support-chat-empty"><P variant="unstyled">Conversation unavailable.</P><Button variant="unstyled" onClick={back}>Back to conversations</Button></div>
            ) : selectedMessageId ? (
              <div className="support-chat-message">
                {selectedMessage ? <><small>{displayDate(selectedMessage.createdAt)}</small><h3>{selectedMessage.subject}</h3><P variant="unstyled">{selectedMessage.body}</P></> : <P variant="unstyled">Message unavailable.</P>}
                {actionError && <P variant="unstyled" className="support-chat-error" role="alert">{actionError}</P>}
                <Button variant="unstyled" className="support-chat-primary" onClick={() => newTicket()}>Start a conversation</Button>
              </div>
            ) : loading ? <Skeleton /> : tab === "tickets" ? (
              tickets.length ? <div className="support-chat-list">{tickets.map((ticket) => (
                <Button variant="unstyled" key={ticket.id} disabled={ticket.status === "resolved"} onClick={() => openTicket(ticket.id)}>
                  <Span className="support-chat-list-icon"><Ticket size={17} /></Span>
                  <Span><strong>{ticket.subject}</strong><P variant="unstyled">{ticket.messages.at(-1)?.body || ticket.description}</P><small>{titleCase(ticket.status)} · {displayDate(ticket.createdAt)}</small></Span>
                  {messages.some((message) => message.supportRequestId === ticket.id && !message.readAt) && <Span className="support-chat-unread-dot" aria-label="Unread replies" />}
                </Button>
              ))}</div> : <div className="support-chat-empty"><Ticket size={25} /><h3>No conversations yet</h3><P variant="unstyled">Start a conversation to get help from our team.</P></div>
            ) : (
              messages.length ? <div className="support-chat-list">{messages.map((message) => (
                <Button variant="unstyled" key={message.id} onClick={() => openMessage(message)}>
                  <Span className="support-chat-list-icon"><Inbox size={17} /></Span>
                  <Span><strong>{message.subject}</strong><P variant="unstyled">{message.body}</P><small>{displayDate(message.createdAt)}</small></Span>
                  {!message.readAt && <Span className="support-chat-unread-dot" aria-label="Unread message" />}
                </Button>
              ))}</div> : <div className="support-chat-empty"><Inbox size={25} /><h3>No messages yet</h3><P variant="unstyled">Messages from our team will appear here.</P></div>
            )}
          </>
        )}
        <div className="support-chat-powered">
          <MessageCircle size={12} />
          Support by Casefy
        </div>
      </Motion.section>
      <Button variant="unstyled"
        ref={launcher}
        type="button"
        className="support-chat-launcher"
        title={open ? "Minimize support chat" : "Support"}
        onClick={() => (open ? minimize() : openChat())}
        aria-label={
          open
            ? "Minimize support chat"
            : `Open support chat${unread ? `, ${unread} unread messages` : ""}`
        }
        aria-expanded={open}
        aria-controls="casefy-support-chat"
      >
        <AnimatedIcon animationKey={open ? "close" : "chat"}>
          {open ? <X size={24} /> : <MessageCircle size={25} />}
        </AnimatedIcon>
        {!open && unread > 0 && <b>{unread > 99 ? "99+" : unread}</b>}
      </Button>
    </div>
  );
}

export default function SupportChat() {
  const { user, isLoading } = useAuth();
  if (
    isLoading ||
    ["admin", "manager"].includes(user?.role)
  )
    return null;
  return <Chat key={user?.id || "guest"} user={user} />;
}
