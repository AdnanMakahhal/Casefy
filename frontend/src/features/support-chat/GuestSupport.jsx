import { useState } from "react";
import { Link } from "react-router-dom";
import { RiArrowLeftLine, RiArrowRightUpLine, RiChat3Line, RiSendPlane2Line } from "react-icons/ri";
import { apiRequest } from "../../lib/api";
import Button from "../../ui/Button";
import P from "../../ui/P";
import Span from "../../ui/Span";
import SelectMenu from "../../components/SelectMenu";
import SupportRequestFields from "../../components/SupportRequestFields";
import { useSupportChat } from "./context";

export default function GuestSupport({ initialCategory }) {
  const { closeChat } = useSupportChat();
  const [creating, setCreating] = useState(Boolean(initialCategory));
  const [category, setCategory] = useState(initialCategory || "support");
  const [details, setDetails] = useState({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [reference, setReference] = useState(null);
  const [autoReply, setAutoReply] = useState("");

  async function submit(event) {
    event.preventDefault();
    if (busy) return;
    const form = new FormData(event.currentTarget);
    const fields = Object.fromEntries(["name", "email", "subject", "description"].map((key) => [key, String(form.get(key) || "").trim()]));
    if (Object.values(fields).some((value) => !value)) {
      setError("Please complete all fields.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const result = await apiRequest("/support", { method: "POST", body: JSON.stringify({ ...fields, category, details }) });
      setReference(result.id);
      setAutoReply(result.autoReply || "");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (!creating) return (
    <div className="support-chat-welcome">
      <Span><RiChat3Line size={30} aria-hidden="true" /></Span>
      <h3>How can we help?</h3>
      <P variant="unstyled">Sign in to chat with our team and keep your conversations in your account.</P>
      <Link to="/signin" onClick={closeChat} className="support-chat-primary">Sign in to chat <RiArrowRightUpLine size={16} /></Link>
      <P variant="unstyled" className="support-chat-small">Need help signing in?</P>
      <Button variant="ghost" size="sm" className="mt-2 underline" onClick={() => setCreating(true)}>Contact support</Button>
    </div>
  );

  if (reference) return (
    <div className="support-chat-welcome" role="status">
      <Span><RiChat3Line size={30} aria-hidden="true" /></Span>
      <h3>Request received</h3>
      <P variant="unstyled">Your request has been saved. Keep your reference number: #{reference}.</P>
      {autoReply && <div className="mt-4 rounded-md border border-[#cfddd5] bg-[#edf3ef] p-4 text-left"><P variant="unstyled" className="text-xs font-semibold text-[#294137]">Casefy assistant · Automated</P><P variant="unstyled" className="mt-2 text-sm leading-6 text-[#526159]">{autoReply}</P></div>}
      <Button variant="outline" onClick={() => { setReference(null); setCreating(false); setDetails({}); }}>Back to support</Button>
    </div>
  );

  return (
    <form className="support-chat-new-ticket" onSubmit={submit}>
      <div className="support-chat-form-body">
        <Button variant="outline" size="sm" className="mb-4 min-h-10" aria-label="Back to support" disabled={busy} onClick={() => setCreating(false)}><RiArrowLeftLine size={17} aria-hidden="true" />Back</Button>
        <h3>Contact support</h3>
        <P variant="unstyled">Tell us how we can help. Include your email so our team can contact you.</P>
        <fieldset disabled={busy}>
          <label>Name<input name="name" autoComplete="name" required maxLength={100} /></label>
          <label>Email<input name="email" type="email" autoComplete="email" required maxLength={254} /></label>
          <div>
            <P variant="unstyled" className="mb-2 text-xs font-semibold text-[#526159]">Topic</P>
            <SelectMenu label="Support topic" value={category} onChange={(value) => { setCategory(value); setDetails({}); }} disabled={busy} options={[
              { value: "support", label: "General support" },
              { value: "payment", label: "Payments" },
              { value: "refund", label: "Refund request" },
              { value: "contact", label: "Contact our team" },
              { value: "live_chat", label: "Live chat" },
            ]} />
          </div>
          <SupportRequestFields category={category} value={details} onChange={setDetails} />
          <label>Subject<input name="subject" required maxLength={160} placeholder="What do you need help with?" /></label>
          <label>Message<textarea name="description" required maxLength={5000} rows={5} placeholder="Tell us a little more..." /></label>
        </fieldset>
        {error && <P variant="unstyled" className="support-chat-error" role="alert">{error}</P>}
      </div>
      <footer><Button variant="unstyled" type="submit" className="support-chat-primary" disabled={busy}><RiSendPlane2Line size={16} />{busy ? "Sending..." : "Send request"}</Button></footer>
    </form>
  );
}
