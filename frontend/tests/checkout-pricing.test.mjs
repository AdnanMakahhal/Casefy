import assert from "node:assert/strict";
import { test } from "node:test";
import { formatCheckoutMoney } from "../src/features/checkout/pricing.js";

test("checkout formatting is safe before prices load or when the catalog is unavailable", () => {
  assert.equal(formatCheckoutMoney(2400, undefined), null);
  assert.equal(formatCheckoutMoney(undefined, undefined), null);
  assert.equal(formatCheckoutMoney(null, "usd"), null);
  assert.equal(formatCheckoutMoney(2400, ""), null);
  assert.equal(formatCheckoutMoney(2400, "invalid"), null);
});

test("monthly and annual prices keep the correct amounts and currency", () => {
  assert.equal(formatCheckoutMoney(2400, "usd", 0), "$24");
  assert.equal(formatCheckoutMoney(23040, "usd"), "$230.40");
  assert.equal(formatCheckoutMoney(5760, "usd"), "$57.60");
  assert.equal(formatCheckoutMoney(0, "usd"), "$0.00");
  assert.equal(formatCheckoutMoney(23040, "gbp"), "£230.40");
});
