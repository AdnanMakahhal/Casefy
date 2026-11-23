import { createHash } from "node:crypto";

// One refund operation per support request, stable across tabs and retries.
export function supportRefundOperationId(requestId) {
  const hash = createHash("sha256").update(`casefy-support-refund:${requestId}`).digest("hex");
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-5${hash.slice(13, 16)}-a${hash.slice(17, 20)}-${hash.slice(20, 32)}`;
}
