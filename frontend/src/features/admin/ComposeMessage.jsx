import P from "../../ui/P";
import Button from "../../ui/Button";
import { useState } from "react";
import { adminRequest } from "./api";
import AccountModal from "../../components/AccountModal";
import SelectMenu from "../../components/SelectMenu";
import { input } from "./styles";
import { ErrorMessage } from "./ui";
import {
  RiSendPlane2Line as Send
} from "react-icons/ri";

export default function ComposeMessage({ account, request, onClose, onSaved }) {
  const [channel, setChannel] = useState(account ? "in_app" : "email");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(event) {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    setBusy(true);
    setError("");
    try {
      const result = await adminRequest("/messages", {
        method: "POST",
        body: JSON.stringify({
          ...(request
            ? { supportRequestId: request.id }
            : { recipientId: account.id }),
          subject: values.get("subject"),
          body: values.get("body"),
          channel,
        }),
      });
      onSaved(result.notice);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <AccountModal
      title={request ? "Reply to contact" : "Message user"}
      onDismiss={onClose}
      busy={busy}
    >
      <P variant="unstyled" className="mb-5 text-sm text-[#526159]">
        To: <strong>{account?.email || request.email}</strong>
      </P>
      <form onSubmit={submit} className="space-y-4">
        <fieldset disabled={busy} className="space-y-4">
          <label className="block text-xs font-semibold text-[#526159]">
            Delivery
            <SelectMenu
              label="Message delivery"
              value={channel}
              onChange={setChannel}
              options={[
                ...(account
                  ? [
                      {
                        value: "in_app",
                        label: "In-app inbox",
                        description: "Visible in the user's Messages page",
                      },
                    ]
                  : []),
                {
                  value: "email",
                  label: "Email",
                  description: "Send through your configured Resend account",
                },
              ]}
            />
          </label>
          <label className="block text-sm font-medium">
            Subject
            <input
              name="subject"
              defaultValue={
                request
                  ? `Re: ${request.subject}`.slice(0, 160)
                  : "Your Casefy subscription"
              }
              required
              maxLength={160}
              className={`${input} mt-2`}
            />
          </label>
          <label className="block text-sm font-medium">
            Message
            <textarea
              name="body"
              required
              maxLength={10000}
              rows={6}
              placeholder="Write your message..."
              className={`${input} mt-2`}
            />
          </label>
        </fieldset>
        <ErrorMessage>{error}</ErrorMessage>
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" size="md"
            type="button"
            disabled={busy}
            className="border px-5 py-2.5 whitespace-nowrap"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button variant="primary" size="md" type="submit" disabled={busy} className="border px-5 py-2.5 whitespace-nowrap border-[#294137]">
            <Send size={16} />
            {busy ? "Sending..." : "Send message"}
          </Button>
        </div>
      </form>
    </AccountModal>
  );
}
