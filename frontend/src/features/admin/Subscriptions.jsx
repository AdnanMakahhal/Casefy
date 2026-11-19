import { useState } from "react";
import { adminRequest, useStaffData } from "./api";
import { titleCase, displayDate } from "../../lib/format";
import AccountModal from "../../components/AccountModal";
import {
  ErrorMessage,
  SearchForm,
  Loading,
  Badge,
  Empty,
  Pagination,
} from "./ui";
import { useNavigate } from "react-router-dom";
import { panel } from "./styles";
import SelectMenu from "../../components/SelectMenu";
import {
  RiBankCardLine as CreditCard,
  RiMailLine as Mail,
} from "react-icons/ri";
import ComposeMessage from "./ComposeMessage";
import ComplimentaryAccess from "./ComplimentaryAccess";

function SubscriptionAction({ account, onClose, onSaved }) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function submit() {
    setBusy(true);
    setError("");
    try {
      await adminRequest(`/subscriptions/${account.id}`, {
        method: "POST",
        body: JSON.stringify({ cancelAtPeriodEnd: !account.cancelAtPeriodEnd }),
      });
      onSaved("Subscription updated.");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <AccountModal
      title={
        account.cancelAtPeriodEnd
          ? "Keep subscription active?"
          : "Cancel at period end?"
      }
      onDismiss={onClose}
      busy={busy}
    >
      <p className="text-sm leading-7 text-[#526159]">
        {account.email} · {titleCase(account.plan)}.{" "}
        {account.cancelAtPeriodEnd
          ? "Recurring billing will continue on the existing schedule."
          : "Access continues until the current paid period ends. No refund will be issued by this action."}
      </p>
      <ErrorMessage>{error}</ErrorMessage>
      <div className="mt-6 flex justify-end gap-3">
        <button className="admin-button" disabled={busy} onClick={onClose}>
          Back
        </button>
        <button
          className="admin-button primary"
          disabled={busy}
          onClick={submit}
        >
          {busy
            ? "Updating..."
            : account.cancelAtPeriodEnd
              ? "Keep subscription active"
              : "Cancel at period end"}
        </button>
      </div>
    </AccountModal>
  );
}

export default function Subscriptions({ revision }) {
  const navigate = useNavigate();
  const [page, setPage] = useState(1),
    [search, setSearch] = useState(""),
    [plan, setPlan] = useState("");
  const [localRevision, setLocalRevision] = useState(0),
    [notice, setNotice] = useState("");
  const [message, setMessage] = useState(null),
    [changing, setChanging] = useState(null),
    [access, setAccess] = useState(null);
  const { data, loading, error } = useStaffData(
    `/subscriptions?${new URLSearchParams({ page, search, plan })}`,
    revision + localRevision,
  );
  function saved(text) {
    setNotice(text);
    setChanging(null);
    setMessage(null);
    setAccess(null);
    setLocalRevision((value) => value + 1);
  }
  return (
    <>
      {notice && (
        <p role="status" className="admin-notice">
          {notice}
        </p>
      )}
      <section className={`${panel} overflow-visible`}>
        <div className="flex flex-col items-stretch gap-4 border-b border-[#CFDDD5] p-5 sm:flex-row sm:flex-wrap sm:items-center">
          <SearchForm
            onSearch={(value) => {
              setSearch(value);
              setPage(1);
            }}
            liveSearch
          />
          <SelectMenu
            label="Subscription plan"
            className="w-full sm:w-44"
            value={plan}
            onChange={(value) => {
              setPlan(value);
              setPage(1);
            }}
            options={[
              { value: "", label: "All plans" },
              ...["free", "plus", "pro", "custom"].map((value) => ({
                value,
                label: titleCase(value),
              })),
            ]}
          />
        </div>
        {loading ? (
          <Loading />
        ) : error ? (
          <div className="p-5">
            <ErrorMessage>{error}</ErrorMessage>
          </div>
        ) : (
          <>
            <p className="border-b border-[#CFDDD5] bg-[#f6f8f7] px-6 py-3 text-xs text-[#526159]">
              {data.configured
                ? `${data.liveMode ? "Live" : "Sandbox"} Stripe billing. Subscription status is synchronized by webhooks.`
                : "Stripe is not configured. Account plans are shown below."}
            </p>
            <div className="admin-table-scroll">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Plan</th>
                    <th>Subscription</th>
                    <th>Start / end dates</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.users.map((account) => (
                    <tr key={account.id}>
                      <td>
                        <strong className="block">{account.name}</strong>
                        <span className="mt-1 block text-xs text-[#526159]">
                          {account.email}
                        </span>
                      </td>
                      <td>
                        {titleCase(account.plan)}
                        {account.complimentaryStatus && (
                          <p className="mt-1 text-xs text-[#718578]">
                            Complimentary:{" "}
                            {titleCase(account.complimentaryStatus)}
                          </p>
                        )}
                      </td>
                      <td>
                        <Badge
                          value={
                            account.subscriptionStatus ||
                            (account.complimentaryStatus
                              ? `complimentary_${account.complimentaryStatus}`
                              : account.plan === "custom"
                                ? "manual_plan"
                                : "no_subscription")
                          }
                        />
                        {account.cancelAtPeriodEnd && (
                          <p className="mt-2 text-xs text-[#8e3530]">
                            Cancels at period end
                          </p>
                        )}
                      </td>
                      <td>
                        <p className="text-xs text-[#526159]">
                          Start:{" "}
                          {displayDate(
                            account.complimentaryStartsAt ||
                              account.subscriptionStartedAt,
                          )}
                        </p>
                        <p className="mt-1 text-xs text-[#526159]">
                          End:{" "}
                          {displayDate(
                            account.complimentaryEndsAt ||
                              account.subscriptionPeriodEnd,
                          )}
                        </p>
                      </td>
                      <td>
                        <div className="flex items-center gap-1">
                          <button
                            className="admin-button"
                            onClick={() => setAccess(account)}
                          >
                            Dates & free access
                          </button>
                          <button
                            className="admin-icon-button"
                            title="View payments"
                            aria-label={`Payments for ${account.email}`}
                            onClick={() =>
                              navigate(
                                `/admin/payments?${new URLSearchParams({ userId: String(account.id) })}`,
                              )
                            }
                          >
                            <CreditCard size={17} />
                          </button>
                          <button
                            className="admin-icon-button"
                            title="Message customer"
                            aria-label={`Message ${account.email}`}
                            onClick={() => setMessage(account)}
                          >
                            <Mail size={17} />
                          </button>
                          {account.stripeSubscriptionId &&
                            !["canceled", "incomplete_expired"].includes(
                              account.subscriptionStatus,
                            ) && (
                              <button
                                className="admin-button"
                                onClick={() => setChanging(account)}
                              >
                                {account.cancelAtPeriodEnd
                                  ? "Keep active"
                                  : "Cancel"}
                              </button>
                            )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!data.users.length && <Empty />}
            <Pagination data={data} onChange={setPage} label="users" />
          </>
        )}
      </section>
      {message && (
        <ComposeMessage
          account={message}
          onClose={() => setMessage(null)}
          onSaved={saved}
        />
      )}
      {access && (
        <ComplimentaryAccess
          account={access}
          onClose={() => setAccess(null)}
          onSaved={saved}
        />
      )}
      {changing && (
        <SubscriptionAction
          account={changing}
          onClose={() => setChanging(null)}
          onSaved={saved}
        />
      )}
    </>
  );
}
