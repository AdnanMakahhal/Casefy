import prisma, { isDatabaseConfigured } from "../db.js";

export function createSupportController(db = prisma) {
  return async (req, res) => {
    const data = {};
    for (const [field, limit] of Object.entries({
      name: 100,
      email: 254,
      subject: 160,
      description: 5000,
    })) {
      const value = typeof req.body?.[field] === "string" ? req.body[field].trim() : "";
      if (!value || value.length > limit)
        return res
          .status(400)
          .json({ message: `Please enter ${field} between 1 and ${limit} characters` });
      data[field] = value;
    }
    data.email = data.email.toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email))
      return res.status(400).json({ message: "Please enter a valid email address" });
    const category =
      req.body?.category || (/enterprise/i.test(data.subject) ? "enterprise" : "support");
    if (!["support", "enterprise", "refund"].includes(category))
      return res.status(400).json({ message: "Choose support, Enterprise, or refund." });
    data.category = category;
    if (req.user) {
      data.userId = req.user.id;
      data.email = req.user.email;
      data.name = req.user.name;
    }
    if (!isDatabaseConfigured())
      return res
        .status(503)
        .json({ message: "Support is temporarily unavailable. Please try again later" });
    try {
      const request = await db.supportRequest.create({ data, select: { id: true } });
      return res.status(201).json({ id: request.id });
    } catch (error) {
      console.error("Support request failed:", error.code || error.name);
      return res.status(500).json({ message: "Unable to save your request. Please try again" });
    }
  };
}

export const submitSupportRequest = createSupportController();
