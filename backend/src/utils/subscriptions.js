export const planRank = { free: 0, plus: 1, pro: 2, enterprise: 3 };

export function effectivePlanFilter(plan, now = new Date()) {
  const lower = Object.keys(planRank).filter(
    (value) => planRank[value] <= planRank[plan],
  );

  return {
    OR: [
      {
        plan,
        OR: [
          { complimentaryPlan: null },
          { complimentaryStartsAt: { gt: now } },
          { complimentaryEndsAt: { lte: now } },
          { complimentaryPlan: { in: lower } },
        ],
      },
      {
        plan: { in: lower },
        complimentaryPlan: plan,
        complimentaryStartsAt: { lte: now },
        complimentaryEndsAt: { gt: now },
      },
    ],
    AND: [
      {
        OR: [
          { complimentaryPlan: null },
          { complimentaryPlan: { in: lower } },
          { complimentaryStartsAt: { gt: now } },
          { complimentaryEndsAt: { lte: now } },
        ],
      },
    ],
  };
}

export function effectiveUser(user, now = new Date()) {
  if (!user?.complimentaryPlan) return user;

  const basePlan = user.basePlan || user.plan;
  const starts = new Date(user.complimentaryStartsAt).getTime();
  const ends = new Date(user.complimentaryEndsAt).getTime();

  const active =
    Number.isFinite(starts) &&
    Number.isFinite(ends) &&
    starts <= now.getTime() &&
    now.getTime() < ends;

  const complimentaryStatus = active
    ? "active"
    : starts > now.getTime()
      ? "scheduled"
      : "expired";

  return {
    ...user,
    basePlan,
    plan:
      active && planRank[user.complimentaryPlan] > (planRank[basePlan] || 0)
        ? user.complimentaryPlan
        : basePlan,
    complimentaryStatus,
    ...(!active && basePlan === "free"
      ? { seatLimit: null, projectLimit: null, monthlyCreditLimit: null }
      : {}),
  };
}

export function accessSchedule(body, now = new Date()) {
  if (body.remove === true)
    return {
      complimentaryPlan: null,
      complimentaryStartsAt: null,
      complimentaryEndsAt: null,
    };

  if (!["plus", "pro", "enterprise"].includes(body.plan))
    throw new Error(
      "Choose Plus, Pro, or Enterprise for complimentary access.",
    );

  const starts = body.startsAt ? parseTimestamp(body.startsAt) : new Date(now);

  let ends;
  if (body.duration === "week" || body.duration === "14days")
    ends = new Date(
      starts.getTime() + (body.duration === "week" ? 7 : 14) * 86400000,
    );
  else if (body.duration === "month") {
    ends = new Date(starts);
    const day = starts.getUTCDate();
    ends.setUTCDate(1);
    ends.setUTCMonth(ends.getUTCMonth() + 1);
    const lastDay = new Date(
      Date.UTC(ends.getUTCFullYear(), ends.getUTCMonth() + 1, 0),
    ).getUTCDate();
    ends.setUTCDate(Math.min(day, lastDay));
  } else if (body.duration === "custom") ends = parseTimestamp(body.endsAt);
  else throw new Error("Choose one week, 14 days, one month, or custom dates.");

  if (!Number.isFinite(ends.getTime()) || ends <= starts)
    throw new Error("The end date must be after the start date.");

  return {
    complimentaryPlan: body.plan,
    complimentaryStartsAt: starts,
    complimentaryEndsAt: ends,
  };
}

function parseTimestamp(value) {
  if (
    typeof value !== "string" ||
    !/^\d{4}-\d\d-\d\dT\d\d:\d\d(?::\d\d(?:\.\d{1,3})?)?(?:Z|[+-]\d\d:\d\d)$/.test(
      value,
    )
  )
    throw new Error("Provide a date and time with a timezone.");

  const year = Number(value.slice(0, 4)),
    month = Number(value.slice(5, 7)),
    day = Number(value.slice(8, 10));

  const days = [
    31,
    year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0) ? 29 : 28,
    31,
    30,
    31,
    30,
    31,
    31,
    30,
    31,
    30,
    31,
  ];

  if (
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > days[month - 1] ||
    Number(value.slice(11, 13)) > 23 ||
    Number(value.slice(14, 16)) > 59
  )
    throw new Error("Choose a valid subscription date and time.");

  const date = new Date(value);

  if (!Number.isFinite(date.getTime()))
    throw new Error("Choose a valid subscription date.");
  
  return date;
}
