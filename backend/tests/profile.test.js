import assert from "node:assert/strict";
import { test } from "node:test";
import bcrypt from "bcryptjs";
import sharp from "sharp";
import { createAuthController } from "../controllers/authController.js";
import { normalizeAvatar } from "../utils/avatar.js";
import { cropGeometry } from "../../frontend/src/features/authentication/crop.js";

process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test";
const user = { id: 42, name: "Adnan", email: "adnan@example.com", role: "qa_engineer", workspaceName: "Casefy" };
const passwordHash = await bcrypt.hash("correct-password", 4);
const response = () => ({ statusCode: 200, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } });

test("editing name and workspace only updates the authenticated account", async () => {
  const { updateMe } = createAuthController({ user: { update: async ({ where, data }) => {
    assert.deepEqual(where, { id: 42 });
    assert.deepEqual(data, { name: "Adnan Updated", workspaceName: "New workspace" });
    return { ...user, ...data };
  } } });
  const res = response();
  await updateMe({ user, body: { id: 99, name: " Adnan Updated ", workspaceName: " New workspace " } }, res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.name, "Adnan Updated");
});

test("Admin and Manager users can edit personal details without changing their role", async () => {
  for (const role of ["admin", "manager"]) {
    const { updateMe } = createAuthController({ user: { update: async ({ data }) => {
      assert.deepEqual(data, { name: "Updated name" });
      return { ...user, role, ...data };
    } } });
    const res = response();
    await updateMe({ user: { ...user, role }, body: { name: "Updated name" } }, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.role, role);
  }
});

test("invalid names, emails, workspaces and unsupported updates are rejected", async () => {
  const { updateMe } = createAuthController({});
  for (const body of [{ name: " " }, { name: "x".repeat(101) }, { email: "invalid" }, { workspaceName: " " }, { workspaceName: "x".repeat(81) }, { passwordHash: "replace" }]) {
    const res = response();
    await updateMe({ user, body }, res);
    assert.equal(res.statusCode, 400);
  }
});

test("changing email requires a matching current password", async () => {
  const { updateMe } = createAuthController({ user: { findUnique: async ({ where }) => {
    assert.deepEqual(where, { id: user.id });
    return { passwordHash };
  } } });
  for (const currentPassword of [undefined, "incorrect"]) {
    const res = response();
    await updateMe({ user, body: { email: "new@example.com", currentPassword } }, res);
    assert.equal(res.statusCode, 401);
  }
});

test("email updates normalize the email and handle duplicate addresses", async () => {
  for (const duplicate of [false, true]) {
    const { updateMe } = createAuthController({ user: {
      findUnique: async () => ({ passwordHash }),
      update: async ({ data }) => {
        assert.deepEqual(data, { email: "new@example.com" });
        if (duplicate) throw { code: "P2002" };
        return { ...user, ...data };
      },
    } });
    const res = response();
    await updateMe({ user, body: { email: " NEW@example.com ", currentPassword: "correct-password" } }, res);
    assert.equal(res.statusCode, duplicate ? 409 : 200);
  }
});

test("account deletion rejects missing and incorrect passwords", async () => {
  const { deleteMe } = createAuthController({ user: { findUnique: async () => ({ passwordHash }) } });
  for (const currentPassword of [undefined, "", "incorrect"]) {
    const res = response();
    await deleteMe({ user, body: { currentPassword } }, res);
    assert.equal(res.statusCode, currentPassword ? 401 : 400);
  }
});

test("confirmed account deletion cannot target a different user", async () => {
  let deleted = false;
  const { deleteMe } = createAuthController({ user: {
    findUnique: async ({ where }) => { assert.deepEqual(where, { id: user.id }); return { passwordHash }; },
    delete: async ({ where }) => { assert.deepEqual(where, { id: user.id }); deleted = true; },
  } });
  const res = response();
  await deleteMe({ user, body: { id: 999, currentPassword: "correct-password" } }, res);
  assert.equal(deleted, true);
  assert.equal(res.statusCode, 200);
});

test("avatar images are decoded and normalized to 256 pixel JPEGs", async () => {
  const input = await sharp({ create: { width: 640, height: 320, channels: 3, background: "#21734d" } }).png().toBuffer();
  const avatarImage = await normalizeAvatar(`data:image/png;base64,${input.toString("base64")}`);
  assert.ok(avatarImage.startsWith("data:image/jpeg;base64,"));
  const metadata = await sharp(Buffer.from(avatarImage.split(",")[1], "base64")).metadata();
  assert.equal(metadata.width, 256);
  assert.equal(metadata.height, 256);
  assert.equal(metadata.format, "jpeg");
  assert.equal(metadata.exif, undefined);
});

test("invalid or oversized avatars cannot be saved", async () => {
  for (const input of ["https://example.com/image.jpg", "data:image/jpeg;base64,aGVsbG8=", "data:image/svg+xml;base64,PHN2Zy8+", "x".repeat(350_001)]) {
    await assert.rejects(() => normalizeAvatar(input));
  }
});

test("avatars can be removed without changing other profile details", async () => {
  const { updateMe } = createAuthController({ user: { update: async ({ data }) => {
    assert.deepEqual(data, { avatarImage: null });
    return { ...user, avatarImage: null };
  } } });
  const res = response();
  await updateMe({ user, body: { avatarImage: null } }, res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.avatarImage, null);
});

test("crop positions stay inside landscape, portrait and square images", () => {
  for (const [width, height] of [[1200, 600], [600, 1200], [600, 600]]) {
    for (const zoom of [1, 1.5, 3]) {
      for (const x of [-150, 0, 150]) for (const y of [-150, 0, 150]) {
        const crop = cropGeometry(width, height, zoom, x, y);
        assert.ok(crop.x >= 0 && crop.y >= 0);
        assert.ok(crop.x + crop.size <= width + 0.0001);
        assert.ok(crop.y + crop.size <= height + 0.0001);
        assert.equal(crop.size, Math.min(width, height) / zoom);
      }
    }
  }
  assert.deepEqual(cropGeometry(1200, 600, 1, -100, 0), { x: 0, y: 0, size: 600 });
  assert.deepEqual(cropGeometry(1200, 600, 1, 100, 0), { x: 600, y: 0, size: 600 });
});
