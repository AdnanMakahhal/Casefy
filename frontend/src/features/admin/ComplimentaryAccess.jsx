import P from "../../ui/P";
import Button from "../../ui/Button";
import { useState } from "react";
import AccountModal from "../../components/AccountModal";
import SelectMenu from "../../components/SelectMenu";
import { adminRequest } from "./api";
import { displayDate, titleCase } from "../../lib/format";

const input =
  "mt-2 min-h-11 w-full rounded-md border border-[#CFDDD5] bg-white px-3 py-2 text-sm";
function localDate(value) {
  const date = new Date(value);
  const pad = (number) => String(number).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
function endFor(start, duration) {
  const date = new Date(start);
  if (!Number.isFinite(date.getTime())) return "";
  if (duration === "month") {
    const day = date.getUTCDate();
    date.setUTCDate(1);
    date.setUTCMonth(date.getUTCMonth() + 1);
    date.setUTCDate(
      Math.min(
        day,
        new Date(
          Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0),
        ).getUTCDate(),
      ),
    );
  } else
    date.setTime(date.getTime() + (duration === "week" ? 7 : 14) * 86400000);
  return localDate(date);
}

export default function ComplimentaryAccess({ account, onClose, onSaved }) {
  const [plan, setPlan] = useState(
    account.complimentaryPlan ||
      (account.plan !== "free" ? account.plan : "plus"),
  );
  const [duration, setDuration] = useState(
    account.complimentaryPlan ? "custom" : "14days",
  );
  const [start, setStart] = useState(() =>
    localDate(account.complimentaryStartsAt || new Date()),
  );
  const [customEnd, setCustomEnd] = useState(() =>
    localDate(
      account.complimentaryEndsAt || new Date(Date.now() + 14 * 86400000),
    ),
  );
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const end = duration === "custom" ? customEnd : endFor(start, duration);
  async function save(event, remove = false) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const body = remove
        ? { remove: true }
        : {
            plan,
            duration,
            startsAt: new Date(start).toISOString(),
            ...(duration === "custom"
              ? { endsAt: new Date(customEnd).toISOString() }
              : {}),
          };
      const result = await adminRequest(`/subscriptions/${account.id}/access`, {
        method: "PUT",
        body: JSON.stringify(body),
      });
      onSaved(result.message);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <AccountModal
      title="Manage subscription dates"
      onDismiss={onClose}
      busy={busy}
    >
      <P variant="unstyled" className="mb-5 text-sm leading-6 text-[#526159]">
        Grant {account.email} complimentary plan access. No card or payment is
        required. Dates use your local timezone.
      </P>
      {account.stripeSubscriptionId && (
        <div className="mb-5 rounded-md bg-[#edf3ef] p-4 text-xs leading-6 text-[#526159]">
          <strong>Stripe billing</strong>
          <br />
          Started: {displayDate(account.subscriptionStartedAt)}
          <br />
          Period ends: {displayDate(account.subscriptionPeriodEnd)}
          <br />
          Complimentary dates do not reschedule or cancel Stripe charges.
        </div>
      )}
      <form onSubmit={save} className="space-y-5">
        <fieldset disabled={busy} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <P variant="unstyled" className="mb-2 text-sm font-medium">Complimentary plan</P>
              <SelectMenu
                label="Complimentary subscription plan"
                value={plan}
                onChange={setPlan}
                options={["plus", "pro", "ultra"].map((value) => ({
                  value,
                  label: titleCase(value),
                  description: "Free temporary access",
                }))}
              />
            </div>
            <div>
              <P variant="unstyled" className="mb-2 text-sm font-medium">Duration</P>
              <SelectMenu
                label="Complimentary duration"
                value={duration}
                onChange={setDuration}
                options={[
                  { value: "week", label: "One week", description: "7 days" },
                  {
                    value: "14days",
                    label: "14 days",
                    description: "Two weeks",
                  },
                  {
                    value: "month",
                    label: "One month",
                    description: "One calendar month",
                  },
                  {
                    value: "custom",
                    label: "Custom dates",
                    description: "Choose start and end",
                  },
                ]}
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-medium">
              Starts at
              <input
                type="datetime-local"
                required
                value={start}
                onChange={(event) => setStart(event.target.value)}
                className={input}
              />
            </label>
            <label className="text-sm font-medium">
              Ends at
              <input
                type="datetime-local"
                required
                readOnly={duration !== "custom"}
                value={end}
                onChange={(event) => setCustomEnd(event.target.value)}
                className={`${input} read-only:bg-[#f6f8f7]`}
              />
            </label>
          </div>
          <P variant="muted" >
            Access activates at the start and expires at the end automatically.
            Accounts without an ongoing Stripe subscription return to Free
            outside these dates. Existing paid Stripe access continues.
          </P>
        </fieldset>
        {error && (
          <P variant="unstyled"
            role="alert"
            className="rounded-md bg-red-50 p-3 text-sm text-red-800"
          >
            {error}
          </P>
        )}
        <div className="flex flex-wrap justify-end gap-3 border-t border-[#CFDDD5] pt-5">
          {account.complimentaryPlan && (
            <Button variant="danger" size="md"
              type="button"
              disabled={busy}
              onClick={(event) => save(event, true)}
              className="border px-5 py-2.5 whitespace-nowrap border-red-700"
            >
              Remove complimentary access
            </Button>
          )}
          <Button variant="outline" size="md"
            type="button"
            disabled={busy}
            onClick={onClose}
            className="border px-5 py-2.5 whitespace-nowrap"
          >
            Cancel
          </Button>
          <Button variant="primary" size="md" type="submit" disabled={busy} className="border px-5 py-2.5 whitespace-nowrap border-[#294137]">
            {busy ? "Saving..." : "Save dates & access"}
          </Button>
        </div>
      </form>
    </AccountModal>
  );
}
