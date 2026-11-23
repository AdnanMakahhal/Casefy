import H2 from "../ui/H2";
import P from "../ui/P";
import Span from "../ui/Span";
import {
  RiCalendarLine as Calendar,
  RiHistoryLine as History,
} from "react-icons/ri";

export default function SubscriptionHistory({ user }) {
  const dates = [
    { label: "Subscription started", value: user.subscriptionStartedAt, description: "The start of your paid subscription." },
    {
      label: user.cancelAtPeriodEnd ? "Paid access ends" : "Current billing period ends",
      value: user.subscriptionPeriodEnd,
      description: user.cancelAtPeriodEnd
        ? "Your access continues until this date."
        : "The end of your current subscription period.",
    },
    { label: "Complimentary access starts", value: user.complimentaryStartsAt, description: "Your complimentary access begins." },
    { label: "Complimentary access ends", value: user.complimentaryEndsAt, description: "The end of your complimentary access." },
  ]
    .filter(({ value }) => value)
    .map((entry) => ({ ...entry, date: new Date(entry.value) }))
    .filter(({ date }) => !Number.isNaN(date.getTime()))
    .sort((a, b) => a.date - b.date);

  return (
    <section aria-labelledby="subscription-history-heading" className="border-t border-[#e1e9e4] px-5 py-6 sm:px-8">
      <div className="flex items-start gap-3">
        <Span variant="accent" className="flex size-10 shrink-0 items-center justify-center rounded-md bg-[#edf3ef]">
          <History size={20} aria-hidden="true" />
        </Span>
        <div>
          <H2 variant="unstyled" id="subscription-history-heading" className="text-base font-semibold">Access timeline</H2>
          <P variant="unstyled" className="mt-1 text-xs leading-5 text-[#526159]">Key dates for your subscription and access. Times are shown in your local time zone.</P>
        </div>
      </div>
      {dates.length ? (
        <ol className="mt-6">
          {dates.map(({ label, date, description }, index) => (
            <li key={label} className="relative flex gap-4 pb-6 last:pb-0">
              {index < dates.length - 1 && <Span aria-hidden="true" className="absolute bottom-0 left-[15px] top-8 w-px bg-[#dce6df]" />}
              <Span className="relative flex size-8 shrink-0 items-center justify-center rounded-full border border-[#dce6df] bg-[#f6f8f7] text-[#526159]">
                <Calendar size={15} aria-hidden="true" />
              </Span>
              <div className="min-w-0 flex-1 pt-1 sm:flex sm:items-start sm:justify-between sm:gap-6">
                <div>
                  <P variant="unstyled" className="text-sm font-semibold text-[#102019]">{label}</P>
                  <P variant="unstyled" className="mt-1 text-xs leading-5 text-[#526159]">{description}</P>
                </div>
                <time dateTime={date.toISOString()} className="mt-2 block shrink-0 text-sm font-medium tabular-nums text-[#294137] sm:mt-0 sm:text-right">
                  {date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                  <Span className="mt-1 block text-xs font-normal text-[#526159]">
                    {date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit", timeZoneName: "short" })}
                  </Span>
                </time>
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <P variant="unstyled" className="mt-5 rounded-md border border-dashed border-[#CFDDD5] bg-[#f6f8f7] px-4 py-5 text-sm text-[#526159]">No subscription history yet. Your subscription dates will appear here when available.</P>
      )}
    </section>
  );
}
