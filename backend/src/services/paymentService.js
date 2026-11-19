export async function storeCharge(db, charge) {
  const customerId = typeof charge.customer === "string" ? charge.customer : charge.customer?.id;
  if (!customerId) return null;
  const user = await db.user.findUnique({ where: { stripeCustomerId: customerId }, select: { id: true, plan: true } });
  if (!user) return null;
  const data = {
    userId: user.id, externalId: charge.id, amount: charge.amount,
    amountRefunded: charge.amount_refunded || 0, currency: charge.currency,
    status: charge.status, source: "stripe", plan: user.plan,
    description: (charge.description || `${user.plan} subscription payment`).slice(0, 250),
    receiptUrl: charge.receipt_url || null, liveMode: Boolean(charge.livemode),
    disputed: Boolean(charge.disputed), createdAt: new Date(charge.created * 1000),
  };
  return db.paymentRecord.upsert({ where: { externalId: charge.id }, create: data, update: data });
}

export const paymentView = (payment) => ({
  ...payment, id: payment.externalId || payment.id,
  paid: payment.status === "succeeded", refundable: payment.source === "stripe" && Boolean(payment.externalId),
});
