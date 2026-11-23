import P from "../../ui/P";
import Span from "../../ui/Span";
import Button from "../../ui/Button";
import { useEffect, useState } from "react";
import AdminTableSkeleton from "../../ui/AdminTableSkeleton";
import { adminRequest, useStaffData } from "./api";
import { titleCase, displayDate } from "../../lib/format";
import AccountModal from "../../components/AccountModal";
import {
  ErrorMessage,
  SearchForm,
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
      <P >
        {account.email} · {titleCase(account.plan)}.{" "}
        {account.cancelAtPeriodEnd
          ? "Recurring billing will continue on the existing schedule."
          : "Access continues until the current paid period ends. No refund will be issued by this action."}
      </P>
      <ErrorMessage>{error}</ErrorMessage>
      <div className="mt-6 flex justify-end gap-3">
        <Button variant="outline" size="md" type="submit" className="border px-5 py-2.5 whitespace-nowrap" disabled={busy} onClick={onClose}>
          Back
        </Button>
        <Button variant="primary" size="md" type="submit"
          className="border px-5 py-2.5 whitespace-nowrap border-[#294137]"
          disabled={busy}
          onClick={submit}
        >
          {busy
            ? "Updating..."
            : account.cancelAtPeriodEnd
              ? "Keep subscription active"
              : "Cancel at period end"}
        </Button>
      </div>
    </AccountModal>
  );
}

export default function Subscriptions({ revision = 0, onLoadingChange }) {
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
  useEffect(() => { onLoadingChange?.(loading); }, [loading, onLoadingChange]);
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
        <P variant="unstyled" role="status" className="admin-notice">
          {notice}
        </P>
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
              ...["free", "plus", "pro", "ultra"].map((value) => ({
                value,
                label: titleCase(value),
              })),
            ]}
          />
        </div>
        {loading ? (
          <AdminTableSkeleton />
        ) : error ? (
          <div className="p-5">
            <ErrorMessage>{error}</ErrorMessage>
          </div>
        ) : (
          <>
            <P variant="unstyled" className="border-b border-[#CFDDD5] bg-[#f6f8f7] px-6 py-3 text-xs text-[#526159]">
              {data.configured
                ? `${data.liveMode ? "Live" : "Sandbox"} Stripe billing. Subscription status is synchronized by webhooks.`
                : "Stripe is not configured. Account plans are shown below."}
            </P>
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
                        <Span className="mt-1 block text-xs text-[#526159]">
                          {account.email}
                        </Span>
                      </td>
                      <td>
                        {titleCase(account.plan)}
                        {account.complimentaryStatus && (
                          <P variant="unstyled" className="mt-1 text-xs text-[#718578]">
                            Complimentary:{" "}
                            {titleCase(account.complimentaryStatus)}
                          </P>
                        )}
                      </td>
                      <td>
                        <Badge
                          value={
                            account.subscriptionStatus ||
                            (account.complimentaryStatus
                              ? `complimentary_${account.complimentaryStatus}`
                              : "no_subscription")
                          }
                        />
                        {account.cancelAtPeriodEnd && (
                          <P variant="unstyled" className="mt-2 text-xs text-[#8e3530]">
                            Cancels at period end
                          </P>
                        )}
                      </td>
                      <td>
                        <P variant="unstyled" className="text-xs text-[#526159]">
                          Start:{" "}
                          {displayDate(
                            account.complimentaryStartsAt ||
                              account.subscriptionStartedAt,
                          )}
                        </P>
                        <P variant="unstyled" className="mt-1 text-xs text-[#526159]">
                          End:{" "}
                          {displayDate(
                            account.complimentaryEndsAt ||
                              account.subscriptionPeriodEnd,
                          )}
                        </P>
                      </td>
                      <td>
                        <div className="flex items-center gap-1">
                          <Button variant="outline" size="md" type="submit"
                            className="border px-5 py-2.5 whitespace-nowrap"
                            onClick={() => setAccess(account)}
                          >
                            Dates & free access
                          </Button>
                          <Button variant="unstyled" type="submit"
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
                          </Button>
                          <Button variant="unstyled" type="submit"
                            className="admin-icon-button"
                            title="Message customer"
                            aria-label={`Message ${account.email}`}
                            onClick={() => setMessage(account)}
                          >
                            <Mail size={17} />
                          </Button>
                          {account.stripeSubscriptionId &&
                            !["canceled", "incomplete_expired"].includes(
                              account.subscriptionStatus,
                            ) && (
                              <Button variant="outline" size="md" type="submit"
                                className="border px-5 py-2.5 whitespace-nowrap"
                                onClick={() => setChanging(account)}
                              >
                                {account.cancelAtPeriodEnd
                                  ? "Keep active"
                                  : "Cancel"}
                              </Button>
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
