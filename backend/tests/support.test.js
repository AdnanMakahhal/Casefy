import assert from "node:assert/strict";
import { test } from "node:test";
import { createSupportController } from "../src/controllers/supportController.js";

process.env.DATABASE_URL ||= "postgresql://test:test@localhost/test";
const details = {
  name: "Adnan",
  email: "adnan@example.com",
  subject: "Enterprise plan enquiry",
  description: "We need an Enterprise workspace for our team.",
};
const response = () => ({
  statusCode: 200,
  status(code) {
    this.statusCode = code;
    return this;
  },
  json(body) {
    this.body = body;
    return this;
  },
});

test("support requests save normalized fields and return a reference number", async () => {
  const submit = createSupportController({
    supportRequest: {
      create: async ({ data, select }) => {
        assert.deepEqual(data, { ...details, category: "enterprise" });
        assert.deepEqual(select, { id: true });
        return { id: 12 };
      },
    },
  });
  const res = response();
  await submit(
    {
      body: {
        name: " Adnan ",
        email: " ADNAN@example.com ",
        subject: " Enterprise plan enquiry ",
        description: ` ${details.description} `,
        status: "closed",
      },
    },
    res,
  );
  assert.equal(res.statusCode, 201);
  assert.deepEqual(res.body, { id: 12 });
});

test("missing, blank or non-text support fields are rejected", async () => {
  const submit = createSupportController({});
  for (const field of Object.keys(details)) {
    for (const value of [undefined, " ", 123]) {
      const res = response();
      await submit({ body: { ...details, [field]: value } }, res);
      assert.equal(res.statusCode, 400);
    }
  }
});

test("support requests validate email and field lengths", async () => {
  const submit = createSupportController({});
  for (const changes of [
    { email: "invalid" },
    { name: "x".repeat(101) },
    { email: "x".repeat(255) },
    { subject: "x".repeat(161) },
    { description: "x".repeat(5001) },
  ]) {
    const res = response();
    await submit({ body: { ...details, ...changes } }, res);
    assert.equal(res.statusCode, 400);
  }
});

test("failed support submissions do not show a success reference", async (t) => {
  t.mock.method(console, "error", () => {});
  const submit = createSupportController({
    supportRequest: {
      create: async () => {
        throw new Error("Database unavailable");
      },
    },
  });
  const res = response();
  await submit({ body: details }, res);
  assert.equal(res.statusCode, 500);
  assert.equal(res.body.id, undefined);
});
