import Avatar from "../../components/Avatar";
import H2 from "../../ui/H2";
import P from "../../ui/P";
import Span from "../../ui/Span";
import { plans, label } from "./userOptions";

const colors = {
  free: { badge: "bg-[#294137] text-white", bar: "bg-[#294137]" },
  plus: { badge: "bg-[#294137] text-white", bar: "bg-[#294137]" },
  pro: { badge: "bg-[#294137] text-white", bar: "bg-[#294137]" },
  ultra: { badge: "bg-[#294137] text-white", bar: "bg-[#294137]" },
};

export default function OverviewCards({ overview }) {
  const total = Math.max(0, overview.totalUsers || 0);
  return (
    <div className="mt-6 grid items-start gap-5 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
      <section aria-labelledby="recent-users-heading" className="min-w-0 overflow-hidden rounded-md border border-[#cfddd5] bg-white">
        <header className="flex items-center justify-between gap-3 border-b border-[#e1e9e4] px-4 py-4 sm:px-5">
          <div>
            <H2 variant="unstyled" id="recent-users-heading" className="text-base font-semibold">Recent users</H2>
            <P variant="unstyled" className="mt-1 text-xs leading-5 text-[#526159]">The latest accounts to join.</P>
          </div>
        </header>
        <ul className="divide-y divide-[#e1e9e4]">
          {overview.recentUsers.map((account) => (
            <li key={account.id}>
              <div className="flex min-h-20 items-center gap-3 px-4 py-4 sm:px-5">
                <Avatar user={account} className="size-9 text-xs" />
                <div className="min-w-0 flex-1">
                  <P variant="unstyled" className="truncate text-sm font-semibold" title={account.name}>{account.name}</P>
                  <P variant="unstyled" className="mt-1 truncate text-xs text-[#526159]" title={account.email}>{account.email}</P>
                </div>
                <Span className={`shrink-0 rounded-md px-2 py-1 text-[11px] font-semibold ${colors[account.plan]?.badge || colors.free.badge}`}>{label(account.plan)}</Span>
              </div>
            </li>
          ))}
        </ul>
        {!overview.recentUsers.length && <P variant="unstyled" className="px-5 py-12 text-center text-sm text-[#526159]">No accounts yet.</P>}
      </section>

      <section aria-labelledby="plan-distribution-heading" className="min-w-0 overflow-hidden rounded-md border border-[#cfddd5] bg-white">
        <header className="flex items-center justify-between gap-3 border-b border-[#e1e9e4] px-4 py-4 sm:px-5">
          <div>
            <H2 variant="unstyled" id="plan-distribution-heading" className="text-base font-semibold">Plan distribution</H2>
            <P variant="unstyled" className="mt-1 text-xs leading-5 text-[#526159]">Share of all accounts.</P>
          </div>
        </header>
        <ul className="space-y-1 p-3 sm:p-4">
          {plans.map((plan) => {
            const count = Math.max(0, overview.planCounts.find((item) => item.plan === plan)?._count?._all || 0);
            const share = total ? Math.min(100, count / total * 100) : 0;
            const percentage = `${Math.round(share)}%`;
            return (
              <li key={plan}>
                <div className="px-2 py-3">
                  <div className="mb-2.5 flex items-center justify-between gap-3">
                    <Span className={`rounded-md px-2 py-1 text-[11px] font-semibold ${colors[plan].badge}`}>{label(plan)}</Span>
                    <Span className="text-sm font-semibold tabular-nums text-[#526159]">{percentage}</Span>
                  </div>
                  <div role="meter" aria-label={`${label(plan)} share of accounts`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={share} aria-valuetext={percentage} className="h-1.5 overflow-hidden rounded-md bg-[#edf3ef]">
                    <Span className={`block h-full w-[var(--plan-share)] rounded-md ${colors[plan].bar}`} style={{ "--plan-share": `${share}%` }} />
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
