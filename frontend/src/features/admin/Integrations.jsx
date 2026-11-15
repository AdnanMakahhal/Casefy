import { useState } from "react";
import { adminRequest, useStaffData } from "./api";
import { titleCase } from "../../lib/format";
import { panel, input } from "./styles";
import { Plug, CreditCard, ArrowUpRight } from "lucide-react";
import { Badge, ErrorMessage, Loading } from "./ui";
import { useAuth } from "../authentication/authContext";
import { Link } from "react-router-dom";

function IntegrationCard({ integration, editable, onSaved }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    setBusy(true);
    setError("");
    try {
      await adminRequest(`/integrations/${integration.provider}`, {
        method: "PUT",
        body: JSON.stringify({
          apiKey: values.get("apiKey"),
          model: values.get("model") || "",
          senderEmail: values.get("senderEmail") || "",
          enabled: values.get("enabled") === "on",
        }),
      });
      form.reset();
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <form onSubmit={submit} className={`${panel} space-y-5 p-6`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-lg bg-[#edf3ef] text-[#294137]">
            <Plug size={20} />
          </span>
          <h2 className="font-bold">{integration.name}</h2>
        </div>
        <Badge
          value={
            !integration.enabled ? "disabled" : integration.configured ? "active" : "not_configured"
          }
        />
      </div>
      <fieldset disabled={busy || !editable} className="space-y-4">
        <label className="block text-sm font-medium">
          API key
          <input
            name="apiKey"
            type="password"
            autoComplete="new-password"
            placeholder={
              integration.configured
                ? "Saved securely · enter to replace"
                : "Enter provider API key"
            }
            maxLength={1000}
            className={`${input} mt-2`}
          />
        </label>
        {integration.provider === "resend" ? (
          <label className="block text-sm font-medium">
            Verified sender email
            <input
              name="senderEmail"
              type="email"
              defaultValue={integration.senderEmail}
              placeholder="support@yourdomain.com"
              className={`${input} mt-2`}
            />
          </label>
        ) : (
          <label className="block text-sm font-medium">
            Model ID
            <input
              name="model"
              required
              defaultValue={integration.model}
              maxLength={100}
              className={`${input} mt-2`}
            />
            <small className="mt-2 block text-xs leading-5 text-[#718578]">
              Use a model available to your provider account.
            </small>
          </label>
        )}
        <label className="flex items-center gap-2 text-sm">
          <input
            name="enabled"
            type="checkbox"
            defaultChecked={integration.enabled}
            className="accent-[#294137]"
          />
          Enable integration
        </label>
      </fieldset>
      <ErrorMessage>{error}</ErrorMessage>
      {editable && (
        <button disabled={busy} className="admin-button primary">
          {busy ? "Saving..." : "Save integration"}
        </button>
      )}
    </form>
  );
}

export default function Integrations({ revision }) {
  const { user } = useAuth();
  const [localRevision, setLocalRevision] = useState(0);
  const [notice, setNotice] = useState("");
  const { data, loading, error } = useStaffData("/integrations", revision + localRevision);
  if (loading) return <Loading />;
  if (error) return <ErrorMessage>{error}</ErrorMessage>;
  return (
    <div className="space-y-6">
      {notice && (
        <p role="status" className="admin-notice">
          {notice}
        </p>
      )}
      <p className="text-sm leading-6 text-[#526159]">
        Keys are encrypted on the server and are never returned to the browser. Leave a saved key
        blank to keep it. {user.role === "manager" && "Only administrators can change credentials."}
      </p>
      <div className="grid gap-6 xl:grid-cols-2">
        {data.integrations.map((integration) => (
          <IntegrationCard
            key={`${integration.provider}-${localRevision}`}
            integration={integration}
            editable={user.role === "admin"}
            onSaved={() => {
              setLocalRevision((value) => value + 1);
              setNotice("Integration settings saved.");
            }}
          />
        ))}
      </div>
      <section className={`${panel} p-6`}>
        <div className="flex items-center gap-3">
          <CreditCard size={22} className="text-[#294137]" />
          <h2 className="font-bold">Stripe billing</h2>
          <Badge value={data.stripe.configured ? "active" : "not_configured"} />
          <span className="text-xs text-[#526159]">
            {data.stripe.liveMode ? "Live mode" : "Sandbox mode"}
          </span>
        </div>
        <p className="mt-4 text-sm leading-6 text-[#526159]">
          Stripe credentials and webhook signing secrets are managed in the server environment.
          Webhook signing: {data.stripe.webhookConfigured ? "configured" : "not configured"}.
        </p>
        <Link
          to="/admin?view=payments"
          className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#294137]"
        >
          Manage payments <ArrowUpRight size={16} />
        </Link>
      </section>
      <section className={`${panel} p-6`}>
        <div className="flex items-center gap-3">
          <CreditCard size={22} className="text-[#294137]" />
          <h2 className="font-bold">PayPal subscriptions</h2>
          <Badge
            value={
              data.paypal?.configured && data.paypal?.webhookConfigured
                ? "active"
                : "not_configured"
            }
          />
        </div>
        <p className="mt-4 text-sm leading-6 text-[#526159]">
          PayPal checkout is disabled. Existing subscriptions can still be verified and managed.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-3">
          {["plus", "pro"].flatMap((tier) =>
            ["monthly", "annual"].map((period) => (
              <div
                key={tier + period}
                className="rounded-lg border border-[#CFDDD5] p-3 text-xs text-[#526159]"
              >
                {titleCase(tier)} / {period}:{" "}
                {data.paypal?.plans?.[tier]?.[period] ? "Plan mapped" : "Needs plan ID"}
              </div>
            )),
          )}
        </div>
      </section>
    </div>
  );
}
