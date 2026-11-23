import prisma, { isDatabaseConfigured } from "../db.js";
import { requestCategories, supportDetails } from "../utils/supportDetails.js";
import { supportGreeting } from "../utils/supportGreeting.js";

export function createSupportController(db = prisma) {
  return async (req, res) => {
    const data = {};
    for (const [field, limit] of Object.entries({
      name: 100,
      email: 254,
      subject: 160,
      description: 5000,
    })) {
      const value =
        typeof req.body?.[field] === "string" ? req.body[field].trim() : "";
      if (!value || value.length > limit)
        return res
          .status(400)
          .json({
            message: `Please enter ${field} between 1 and ${limit} characters`,
          });
      data[field] = value;
    }
    data.email = data.email.toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email))
      return res
        .status(400)
        .json({ message: "Please enter a valid email address" });
    const category = req.body?.category || "support";
    if (!requestCategories.includes(category))
      return res
        .status(400)
        .json({ message: "Choose support, contact, payments, refund, or live chat." });
    data.category = category;
    data.status = "pending";
    try { data.details = supportDetails(category, req.body?.details); }
    catch (error) { return res.status(400).json({ message: error.message }); }
    if (req.user) {
      data.userId = req.user.id;
      data.email = req.user.email;
      data.name = req.user.name;
    }
    if (!isDatabaseConfigured())
      return res
        .status(503)
        .json({
          message: "Support is temporarily unavailable. Please try again later",
        });
    try {
      const request = await db.supportRequest.create({
        data: { ...data, messages: { create: {
          recipientId: data.userId || null,
          toEmail: data.email,
          subject: "Casefy assistant",
          body: supportGreeting,
          channel: "support_bot",
          deliveryStatus: "sent",
        } } },
        select: { id: true },
      });
      return res.status(201).json({ id: request.id, autoReply: supportGreeting });
    } catch (error) {
      console.error("Support request failed:", error.code || error.name);
      return res
        .status(500)
        .json({ message: "Unable to save your request. Please try again" });
    }
  };
}

export const submitSupportRequest = createSupportController();
