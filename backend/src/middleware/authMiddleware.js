import jwt from "jsonwebtoken";
import prisma, { isDatabaseConfigured } from "../db.js";
import { publicUserSelect } from "../utils/roles.js";
import { effectiveUser } from "../utils/subscriptions.js";

export function createProtect(db = prisma) {
  return async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer "))
      return res.status(401).json({ message: "Not authorized, no token" });
    let userId;
    try {
      const decoded = jwt.verify(authHeader.slice(7), process.env.JWT_SECRET);
      if (typeof decoded !== "object" || !Number.isInteger(decoded?.userId) || decoded.userId < 1)
        throw new Error("Invalid token");
      userId = decoded.userId;
    } catch {
      return res.status(401).json({ message: "Not authorized, token failed" });
    }
    if (!isDatabaseConfigured())
      return res.status(503).json({ message: "Database is not configured" });
    try {
      const user = await db.user.findUnique({
        where: { id: userId },
        select: publicUserSelect,
      });
      if (!user) return res.status(401).json({ message: "Account no longer exists" });
      if (user.blockedAt)
        return res
          .status(401)
          .json({ message: "Your account is blocked. Please contact support." });
      req.userId = user.id;
      req.user = effectiveUser(user);
      return next();
    } catch (error) {
      console.error("Authentication error:", error);
      return res.status(503).json({ message: "Unable to verify account" });
    }
  };
}

export const protect = createProtect();
export const allowRoles =
  (...roles) =>
  (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: "Not authorized" });
    if (!roles.includes(req.user.role)) return res.status(403).json({ message: "Access denied" });
    return next();
  };
export default protect;
