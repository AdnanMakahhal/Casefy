import prisma from "../db.js";
import { isId, staffFailure } from "./staffController.js";

export function createMessagesController(db = prisma) {
  return {
    async list(req, res) {
      try {
        const messages = await db.userMessage.findMany({
          where: { recipientId: req.userId, deliveryStatus: "sent" },
          orderBy: { id: "desc" },
          take: 100,
          select: {
            id: true,
            subject: true,
            body: true,
            createdAt: true,
            readAt: true,
            supportRequestId: true,
            sender: { select: { name: true } },
            channel: true,
          },
        });
        return res.json({ messages });
      } catch (error) {
        return staffFailure(res, error);
      }
    },
    async read(req, res) {
      if (!isId(req.params.id))
        return res.status(400).json({ message: "Invalid message." });
      try {
        const result = await db.userMessage.updateMany({
          where: {
            id: Number(req.params.id),
            recipientId: req.userId,
            readAt: null,
          },
          data: { readAt: new Date() },
        });
        return res.json({ updated: result.count });
      } catch (error) {
        return staffFailure(res, error);
      }
    },
    async requests(req, res) {
      try {
        const requests = await db.supportRequest.findMany({
          where: { userId: req.userId },
          orderBy: { id: "desc" },
          take: 100,
          include: {
            messages: {
              where: {
                OR: [
                  { deliveryStatus: "sent", recipientId: req.userId },
                  { senderId: req.userId, channel: "support_reply" },
                ],
              },
              orderBy: { id: "asc" },
              select: {
                id: true,
                body: true,
                createdAt: true,
                senderId: true,
                channel: true,
                sender: { select: { name: true } },
              },
            },
          },
        });
        return res.json({ requests });
      } catch (error) {
        return staffFailure(res, error);
      }
    },
    async reply(req, res) {
      if (
        !isId(req.params.id) ||
        typeof req.body?.body !== "string" ||
        !req.body.body.trim() ||
        req.body.body.length > 10000
      )
        return res
          .status(400)
          .json({ message: "Enter a reply up to 10,000 characters." });
      try {
        const request = await db.supportRequest.findFirst({
          where: { id: Number(req.params.id), userId: req.userId },
        });
        if (!request)
          return res.status(404).json({ message: "Request not found." });
        if (request.status === "resolved") return res.status(409).json({ message: "Ticket is closed. Please start a new conversation." });
        await db.$transaction(async (tx) => {
          await tx.$queryRaw`SELECT id FROM support_requests WHERE id = ${request.id} FOR UPDATE`;
          const current = await tx.supportRequest.findFirst({ where: { id: request.id, userId: req.userId } });
          if (!current) throw Object.assign(new Error("Request not found."), { status: 404 });
          if (current.status === "resolved") throw Object.assign(new Error("Ticket is closed. Please start a new conversation."), { status: 409 });
          await tx.userMessage.create({
            data: {
              senderId: req.userId,
              supportRequestId: request.id,
              toEmail: req.user.email,
              subject: request.subject,
              body: req.body.body.trim(),
              channel: "support_reply",
              deliveryStatus: "sent",
            },
          });
        });
        return res.status(201).json({ message: "Reply sent to support." });
      } catch (error) {
        return staffFailure(res, error);
      }
    },
  };
}
export const messagesController = createMessagesController();
