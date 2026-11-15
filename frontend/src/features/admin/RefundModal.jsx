import { useState } from "react";
import { currencyDigits, titleCase, formatMoney } from "../../lib/format";
import { adminRequest } from "./api";
import AccountModal from "../../components/AccountModal";
import { input } from "./styles";
import { ErrorMessage } from "./ui";

export default function RefundModal({ payment, retry, onClose, onSaved }) {
  const [operationId] = useState(() => retry?.id || crypto.randomUUID());
  const currency = retry?.currency || payment.currency;
  const remaining = retry?.amount || payment.amount - payment.amountRefunded;
  const digits = currencyDigits(currency),
    factor = 10 ** digits;
  const account = retry?.user || payment.user;
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function submit(event) {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    const raw = values.get("amount");
    if (
      !new RegExp(`^\\d+(?:\\.\\d{1,${Math.max(1, digits)}})?$`).test(raw) ||
      (digits === 0 && raw.includes("."))
    ) {
      setError("Enter an amount in the payment's currency precision.");
      return;
    }
    const amount = Math.round(Number(raw) * factor);
    if (amount < 1 || amount > remaining) {
      setError("The amount exceeds the remaining refundable balance.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const result = await adminRequest("/refunds", {
        method: "POST",
        body: JSON.stringify({
          operationId,
          userId: account.id,
          chargeId: retry?.chargeId || payment.id,
          amount,
          reason: values.get("reason"),
        }),
      });
      onSaved(
        `Refund ${titleCase(result.refund.status)}. Reference: ${result.refund.stripeRefundId}.`,
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <AccountModal
      title={retry ? "Retry pending refund" : "Issue a refund"}
      onDismiss={onClose}
      busy={busy}
    >
      <p className="mb-5 text-sm leading-6 text-[#526159]">
        Refund {account.email} to the original payment method. Available:{" "}
        <strong>{formatMoney(remaining, currency)}</strong>. This changes the
        payment; it does not cancel the subscription.
      </p>
      <form onSubmit={submit} className="space-y-4">
        <label className="block text-sm font-medium">
          Amount ({currency.toUpperCase()})
          <input
            name="amount"
            type="number"
            step={1 / factor}
            min={1 / factor}
            max={remaining / factor}
            defaultValue={(remaining / factor).toFixed(digits)}
            required
            readOnly={Boolean(retry)}
            disabled={busy}
            className={`${input} mt-2`}
          />
        </label>
        <label className="block text-sm font-medium">
          Reason
          <textarea
            name="reason"
            maxLength={500}
            rows={3}
            defaultValue={retry?.reason || ""}
            readOnly={Boolean(retry)}
            required
            disabled={busy}
            className={`${input} mt-2`}
          />
        </label>
        <ErrorMessage>{error}</ErrorMessage>
        <div className="flex justify-end gap-3">
          <button
            type="button"
            className="admin-button"
            disabled={busy}
            onClick={onClose}
          >
            Back
          </button>
          <button className="admin-button danger" disabled={busy}>
            {busy
              ? "Processing..."
              : retry
                ? "Retry same refund"
                : "Confirm refund"}
          </button>
        </div>
      </form>
    </AccountModal>
  );
}
