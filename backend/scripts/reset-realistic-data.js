import "../src/config.js";
import { randomBytes, randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import bcrypt from "bcryptjs";
import db from "../src/db.js";
import { creditPeriod } from "../src/services/creditService.js";
import { planLimits } from "../src/utils/subscriptions.js";

const target = new URL(process.env.DATABASE_URL);
if (!process.argv.includes("--reset-application-data") || !process.argv.includes(`--confirm-host=${target.hostname}`)) throw new Error("Pass --reset-application-data and --confirm-host=<configured database host> to replace application data.");
if (/^(sk|rk)_live_/.test(process.env.STRIPE_SECRET_KEY || "")) throw new Error("Refusing to seed an environment configured for live payments.");

const now = new Date();
const daysAgo = (days) => new Date(now.getTime() - days * 86400000);
const firstNames = ["Lina", "Omar", "Maya", "Daniel", "Nour", "Adam", "Leila", "James", "Sara", "Yusuf", "Sofia", "Ethan", "Hana", "Lucas", "Amira", "Noah", "Rania", "Oliver", "Dina", "Karim", "Emma", "Zaid", "Layla", "Alex", "Salma"];
const lastNames = ["Haddad", "Bennett", "Mansour", "Carter", "Rahman", "Wilson", "Khalil", "Reed", "Farah", "Brooks", "Nasser", "Hayes", "Darwish", "Morgan", "Saleh", "Parker", "Kareem", "Sullivan", "Aziz", "Foster"];
const companies = ["Cedar Labs", "Northstar Digital", "Atlas Commerce", "Olive Health", "Brightline Studio", "Juniper Systems", "Orbit Finance", "Clearwater Apps", "Meridian Cloud", "Saffron Tech", "Harbor Analytics", "Willow Learning", "Summit Logistics", "Bluebird Travel", "Meadow Retail"];
const projects = ["Checkout and billing", "Account onboarding", "Mobile sign-in", "Inventory dashboard", "Payment reconciliation", "Notification preferences", "Search and discovery", "Team permissions", "Booking workflow", "Customer portal", "API regression", "Accessibility review"];
const credentials = [];

try {
  const owner = await db.user.findFirst({ where: { role: "admin", isSynthetic: false }, orderBy: { id: "asc" } });
  if (!owner) throw new Error("An existing administrator is required; the reset preserves this login.");
  const accounts = [];
  for (let index = 0; index < 99; index++) {
    const password = `Cf!${randomBytes(12).toString("base64url")}`;
    const staff = index < 4;
    const customerIndex = index - 4;
    const plan = staff || customerIndex < 35 ? "free" : customerIndex < 65 ? "plus" : customerIndex < 85 ? "pro" : "custom";
    const name = `${firstNames[index % firstNames.length]} ${lastNames[Math.floor(index / firstNames.length) * 3 + index % 3]}`;
    const email = staff ? `${index === 0 ? "manager" : `support${index}`}@casefy.example` : `${name.toLowerCase().replaceAll(" ", ".")}.${customerIndex + 1}@example.test`;
    const limits = planLimits[plan];
    const started = daysAgo(95 + (index * 7 % 60));
    const paid = !staff && plan !== "free";
    const custom = plan === "custom";
    accounts.push({ name, email, passwordHash: await bcrypt.hash(password, 10), role: staff ? index === 0 ? "manager" : "employee" : ["qa_engineer", "developer", "student", "employee"][index % 4], isSupportAgent: staff && index > 0, isSynthetic: true, plan,
      seatLimit: custom ? 8 + index % 6 * 4 : limits.seats,
      projectLimit: custom ? 40 + index % 5 * 25 : limits.projects,
      monthlyCreditLimit: custom ? 15000 + index % 5 * 10000 : limits.credits,
      subscriptionStatus: paid ? "active" : null,
      subscriptionStartedAt: paid ? started : null,
      subscriptionPeriodEnd: paid ? creditPeriod({ subscriptionStartedAt: started }, now).end : null,
      cancelAtPeriodEnd: paid && index % 13 === 0,
      workspaceName: staff ? null : `${companies[customerIndex % companies.length]} QA`, createdAt: daysAgo(180 + index * 11 % 100),
    });
    credentials.push({ name, email, password, role: accounts.at(-1).role, plan, supportAgent: staff && index > 0 });
  }
  // One transaction: a failed insert rolls back the entire replacement.
  const summary = await db.$transaction(async (tx) => {
    await tx.customDeal.deleteMany();
    await tx.creditEntry.deleteMany();
    await tx.paymentRecord.deleteMany();
    await tx.refundRecord.deleteMany();
    await tx.userMessage.deleteMany();
    await tx.supportRequest.deleteMany();
    await tx.generationRun.deleteMany();
    await tx.workspaceInvite.deleteMany();
    await tx.workspaceMember.deleteMany();
    await tx.project.deleteMany();
    await tx.workspace.deleteMany();
    await tx.stripeWebhookEvent.deleteMany();
    await tx.user.deleteMany({ where: { id: { not: owner.id } } });
    await tx.user.update({ where: { id: owner.id }, data: { plan: "free", isSupportAgent: false, isSynthetic: false, seatLimit: null, projectLimit: null, monthlyCreditLimit: null, stripeCustomerId: null, stripeSubscriptionId: null, stripeCheckoutSessionId: null, subscriptionStatus: null, subscriptionStartedAt: null, subscriptionPeriodEnd: null, complimentaryPlan: null, complimentaryStartsAt: null, complimentaryEndsAt: null, cancelAtPeriodEnd: false, workspaceName: null, workspaceNames: [] } });
    const users = await tx.user.createManyAndReturn({ data: accounts });
    // The registration trigger creates primary workspaces; replace these with dated seed workspaces.
    await tx.workspace.deleteMany();
    const byEmail = new Map(users.map((user) => [user.email, user]));
    const staff = accounts.slice(0, 4).map((account) => byEmail.get(account.email));
    const customers = accounts.slice(4).map((account) => byEmail.get(account.email));
    const workspaceRows = [], projectRows = [], requestRows = [], runRows = [], paymentRows = [], creditRows = [], refundRows = [], dealRows = [], messageRows = [], memberRows = [];
    // IDs for integer-keyed tables come from Postgres sequences, never reused after reset.
    const nextIds = async (table, count) => (await tx.$queryRawUnsafe(`SELECT nextval(pg_get_serial_sequence('"${table}"', 'id'))::int AS id FROM generate_series(1, $1::int)`, count)).map((row) => row.id);
    const projectIds = await nextIds("projects", 600);
    const runIds = await nextIds("generation_runs", 1400);
    const requestIds = await nextIds("support_requests", 200);
    for (let index = 0; index < customers.length; index++) {
      const user = customers[index];
      const company = companies[index % companies.length];
      const workspaceId = randomUUID();
      workspaceRows.push({ id: workspaceId, ownerId: user.id, name: user.workspaceName, normalizedName: user.workspaceName.toLowerCase(), legacyKey: "primary", isPrimary: true, createdAt: user.createdAt });
      const projectCount = user.plan === "free" ? 1 + index % 2 : 3 + index % 4;
      for (let p = 0; p < projectCount; p++) projectRows.push({ id: projectIds.shift(), ownerId: user.id, workspaceId, workspaceKey: "primary", name: projects[(index + p) % projects.length], description: `Release coverage for ${company}: validate the customer journey, permissions, and error handling.`, createdAt: daysAgo(2 + (index + p * 7) % 35) });
      const { start, end } = creditPeriod(user, now);
      creditRows.push({ id: randomUUID(), userId: user.id, amount: user.monthlyCreditLimit, kind: "allowance", description: "Monthly plan allowance", operationKey: `allowance:${user.id}:${start.toISOString()}:${user.monthlyCreditLimit}`, periodStart: start, periodEnd: end, createdAt: start });
      const runCount = user.plan === "free" ? 4 + index % 4 : 8 + index % 8;
      for (let r = 0; r < runCount; r++) {
        const id = runIds.shift();
        const failed = (index + r) % 17 === 0;
        const source = user.plan === "free" ? "story" : ["story", "documents", "url"][(index + r) % 3];
        const count = user.plan === "free" ? 4 + r % 4 : 10 + r % 4 * 5;
        const cost = failed ? 0 : count * (source === "url" ? 3 : source === "documents" ? 2 : 1);
        const timestamp = new Date(start.getTime() + (now.getTime() - start.getTime()) * (r + 1) / (runCount + 1));
        const subject = projects[(index + r) % projects.length];
        const result = failed ? undefined : Array.from({ length: count }, (_, t) => ({ id: `TC-${t + 1}`, title: `${subject}: ${["valid input", "missing required fields", "permission checks", "boundary values", "recovery after failure"][t % 5]} ${Math.floor(t / 5) + 1}`, priority: ["high", "medium", "low"][t % 3], type: ["functional", "negative", "edge", "security"][t % 4], steps: [`Open ${subject.toLowerCase()}.`, "Enter the specified values and submit the form.", "Verify the resulting state and any validation feedback."], expectedResult: "The expected state is saved, appropriate feedback is shown, and unauthorized changes are rejected." }));
        runRows.push({ id, userId: user.id, subject, source, provider: "synthetic", model: source === "url" ? "LLM + Playwright" : "LLM", requestedCount: count, testCount: failed ? 0 : count, status: failed ? "failed" : "completed", result, error: failed ? "The request timed out. No credits were charged." : null, creditsUsed: cost, createdAt: timestamp });
        if (cost) creditRows.push({ id: randomUUID(), userId: user.id, amount: -cost, kind: source === "url" ? "generation_browser" : source === "documents" ? "generation_documents" : "generation_text", description: subject, operationKey: `generation:${id}`, generationRunId: id, periodStart: start, periodEnd: end, createdAt: timestamp });
      }
      const price = user.plan === "plus" ? 2400 : user.plan === "pro" ? 7900 : user.plan === "custom" ? (249 + index % 5 * 125) * 100 : 0;
      if (price) {
        for (let month = 0; month < 3; month++) {
          const id = randomUUID();
          const refunded = month === 1 && index % 11 === 0;
          paymentRows.push({ id, userId: user.id, amount: price, amountRefunded: refunded ? Math.round(price / 2) : 0, currency: "usd", status: "succeeded", source: "synthetic", plan: user.plan, description: `${user.plan === "custom" ? "Negotiated Custom" : user.plan === "plus" ? "Plus" : "Pro"} monthly subscription`, liveMode: false, createdAt: daysAgo(3 + month * 30 + index % 10) });
          if (refunded) refundRows.push({ id: randomUUID(), userId: user.id, actorId: staff[0].id, chargeId: `synthetic_${id}`, amount: Math.round(price / 2), currency: "usd", reason: "Partial service credit following a billing review.", status: "succeeded", createdAt: daysAgo(1 + month * 30 + index % 10) });
        }
        if (index % 7 === 0) paymentRows.push({ id: randomUUID(), userId: user.id, amount: price, currency: "usd", status: "failed", source: "synthetic", plan: user.plan, description: "Payment attempt declined; customer updated their payment method.", liveMode: false, createdAt: daysAgo(5 + index % 10) });
      }
      if (user.seatLimit > 1 && index > 0) memberRows.push({ workspaceId, userId: customers[index - 1].id, role: index % 2 ? "editor" : "viewer", createdAt: daysAgo(8) });
      if (index % 2 === 0 || user.plan === "custom") {
        const category = user.plan === "custom" ? "custom" : ["support", "refund", "contact", "live_chat"][Math.floor(index / 2) % 4];
        const id = requestIds.shift();
        const request = { id, userId: user.id, name: user.name, email: user.email, category, subject: category === "custom" ? `Custom plan for ${company}` : category === "refund" ? "Review of a recent subscription charge" : category === "contact" ? `Team enquiry from ${company}` : category === "live_chat" ? "Help with team access" : "Project setup and test coverage", description: category === "custom" ? `We are expanding QA at ${company} and would like a tailored agreement for our seats, projects, and generation credits.` : category === "refund" ? "Could you review my latest subscription charge? I would like to discuss a partial refund." : "Our team has started using the workspace. Could you help us confirm the right configuration for our next release?", status: ["open", "pending", "resolved"][index % 3], assignedToId: staff[1 + index % 3].id, details: category === "custom" ? { company, seats: user.seatLimit, projects: user.projectLimit, monthlyCredits: user.monthlyCreditLimit, budget: price } : category === "refund" ? { paymentReference: paymentRows.find((p) => p.userId === user.id)?.id || `account-review-${user.id}`, reason: "Please review our billing period and service usage." } : { company }, createdAt: daysAgo(2 + index % 16) };
        requestRows.push(request);
        messageRows.push({ recipientId: user.id, senderId: staff[1 + index % 3].id, supportRequestId: id, toEmail: user.email, subject: request.subject, body: category === "custom" ? "Thanks for sharing your requirements. I have passed them to our manager so we can agree on a tailored price and limits." : "Thank you for the details. I have reviewed your account and will help you work through this request.", readAt: index % 4 ? daysAgo(1) : null, createdAt: new Date(request.createdAt.getTime() + 20 * 60000) });
        messageRows.push({ senderId: user.id, supportRequestId: id, toEmail: user.email, subject: request.subject, body: "Thank you. Please let me know if you need anything else from our team.", channel: "support_reply", createdAt: new Date(request.createdAt.getTime() + 65 * 60000) });
        if (category === "custom") dealRows.push({ id: randomUUID(), userId: user.id, supportRequestId: id, approvedById: staff[0].id, status: "active", amount: price, currency: "usd", interval: "month", seats: user.seatLimit, projects: user.projectLimit, monthlyCredits: user.monthlyCreditLimit, notes: `Agreed monthly package for ${company}. Includes team onboarding and priority support. Additional capacity is subject to a new agreement.`, expiresAt: new Date(now.getTime() + 14 * 86400000), acceptedAt: daysAgo(2), activatedAt: daysAgo(1), createdAt: request.createdAt });
      }
    }
    // Pending offers for free customers demonstrate the negotiation workflow without granting access.
    for (let index = 0; index < 6; index++) {
      const user = customers[index + 3], id = requestIds.shift();
      requestRows.push({ id, userId: user.id, name: user.name, email: user.email, subject: `Custom capacity request: ${companies[index]}`, category: "custom", description: "We need a shared plan for a larger QA team. Please propose a price for our requirements.", details: { company: companies[index], seats: 12 + index * 2, projects: 60 + index * 10, monthlyCredits: 25000 + index * 5000, budget: 45000 + index * 10000 }, status: "pending", assignedToId: staff[0].id, createdAt: daysAgo(index + 1) });
      dealRows.push({ id: randomUUID(), userId: user.id, supportRequestId: id, approvedById: staff[0].id, status: index === 5 ? "declined" : index === 4 ? "accepted" : "offered", amount: 39900 + index * 10000, currency: "usd", interval: "month", seats: 12 + index * 2, projects: 60 + index * 10, monthlyCredits: 25000 + index * 5000, notes: "Tailored monthly agreement, including onboarding and priority assistance. Credits renew monthly; unused credits do not roll over.", expiresAt: new Date(now.getTime() + 10 * 86400000), acceptedAt: index === 4 ? daysAgo(1) : null, createdAt: daysAgo(index + 1) });
      messageRows.push({ recipientId: user.id, senderId: staff[0].id, supportRequestId: id, toEmail: user.email, subject: "Your custom offer is ready", body: "I have approved an offer based on your requirements. You can review the agreement in this conversation, then accept and complete checkout when ready.", createdAt: daysAgo(index + 0.5) });
    }
    await tx.workspace.createMany({ data: workspaceRows });
    await tx.project.createMany({ data: projectRows });
    await tx.workspaceMember.createMany({ data: memberRows });
    await tx.generationRun.createMany({ data: runRows });
    await tx.creditEntry.createMany({ data: creditRows });
    await tx.paymentRecord.createMany({ data: paymentRows });
    await tx.refundRecord.createMany({ data: refundRows });
    await tx.supportRequest.createMany({ data: requestRows });
    await tx.customDeal.createMany({ data: dealRows });
    await tx.userMessage.createMany({ data: messageRows });
    return { users: users.length + 1, staff: 5, customers: customers.length, projects: projectRows.length, generations: runRows.length, creditEntries: creditRows.length, payments: paymentRows.length, refunds: refundRows.length, requests: requestRows.length, deals: dealRows.length, messages: messageRows.length, retainedAdmin: owner.email };
  }, { timeout: 180000, maxWait: 30000 });
  await fs.writeFile(new URL("../../note.txt", import.meta.url), `Casefy synthetic dataset login accounts\nGenerated ${now.toISOString()}\nExisting administrator login retained: ${summary.retainedAdmin}\nThese are synthetic identities and database payment records. No external messages or charges were made.\n\n${credentials.map((account) => `${account.role}${account.supportAgent ? " (support agent)" : ""} | ${account.plan} | ${account.name}\n${account.email}\n${account.password}`).join("\n\n")}\n`, { mode: 0o600 });
  console.log(JSON.stringify(summary, null, 2));
} finally { await db.$disconnect(); }
