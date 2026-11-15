import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma, { isDatabaseConfigured } from "../db.js";
import {
  signupRoles,
  adminRoles,
  homeForRole,
  publicUserSelect,
} from "../utils/roles.js";
import { normalizeAvatar } from "../utils/avatar.js";
import { normalizeWorkspaceName } from "../utils/workspaces.js";
import { stripe, billingConfig } from "../utils/stripe.js";
import { createBillingService } from "../services/billingService.js";
import { effectiveUser } from "../utils/subscriptions.js";

const signToken = (userId) =>
  jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "30d" });
const sessionResponse = (user) => ({
  user: effectiveUser(user),
  token: signToken(user.id),
  redirectTo: homeForRole(user.role),
});

export function createAuthController(db = prisma) {
  const signup = async (req, res) => {
    const { name, fullName, email, password, role, workspaceName } =
      req.body ?? {};
    const normalizedName =
      typeof (name ?? fullName) === "string" ? (name ?? fullName).trim() : "";
    const normalizedEmail =
      typeof email === "string" ? email.trim().toLowerCase() : "";
    const workspace =
      typeof workspaceName === "string" ? workspaceName.trim() : "";
    if (!normalizedName || !normalizedEmail || typeof password !== "string") {
      return res
        .status(400)
        .json({ message: "Name, email, and password are required" });
    }
    if (password.length < 8)
      return res
        .status(400)
        .json({ message: "Password must be at least 8 characters" });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return res
        .status(400)
        .json({ message: "Please provide a valid email address" });
    }
    if (!signupRoles.has(role))
      return res
        .status(400)
        .json({ message: "Please choose a valid signup role" });
    if (!workspace || workspace.length > 80)
      return res.status(400).json({
        message: "Workspace name must be between 1 and 80 characters",
      });
    if (!isDatabaseConfigured())
      return res.status(503).json({ message: "Database is not configured" });
    try {
      const passwordHash = await bcrypt.hash(password, 10);
      const user = await db.user.create({
        data: {
          name: normalizedName,
          email: normalizedEmail,
          passwordHash,
          role,
          workspaceName: workspace,
        },
        select: publicUserSelect,
      });
      return res.status(201).json(sessionResponse(user));
    } catch (error) {
      if (error.code === "P2002")
        return res.status(409).json({ message: "Email already registered" });
      console.error("Signup error:", error);
      return res.status(500).json({ message: "Unable to create account" });
    }
  };

  const signin = async (req, res) => {
    const { email, password } = req.body ?? {};
    const normalizedEmail =
      typeof email === "string" ? email.trim().toLowerCase() : "";
    if (!normalizedEmail || typeof password !== "string" || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }
    if (!isDatabaseConfigured())
      return res.status(503).json({ message: "Database is not configured" });
    try {
      const row = await db.user.findUnique({
        where: { email: normalizedEmail },
      });
      if (!row || !(await bcrypt.compare(password, row.passwordHash))) {
        return res.status(401).json({ message: "Invalid email or password" });
      }
      if (row.blockedAt)
        return res
          .status(403)
          .json({
            message: "Your account is blocked. Please contact support.",
          });
      const user = Object.fromEntries(
        Object.keys(publicUserSelect).map((key) => [key, row[key]]),
      );
      return res.json(sessionResponse(user));
    } catch (error) {
      console.error("Signin error:", error);
      return res.status(500).json({ message: "Unable to sign in" });
    }
  };

  const getMe = (req, res) => res.json(req.user);

  const updateMe = async (req, res) => {
    const { name, email, role, workspaceName, avatarImage, currentPassword } =
      req.body ?? {};
    const data = {};
    if (role !== undefined) {
      if (adminRoles.has(req.user.role))
        return res
          .status(403)
          .json({ message: "Admin and Manager roles cannot be changed here" });
      if (!signupRoles.has(role))
        return res.status(400).json({ message: "Choose a valid role" });
      data.role = role;
    }
    if (workspaceName !== undefined) {
      const workspace =
        typeof workspaceName === "string" ? workspaceName.trim() : "";
      if (!workspace || workspace.length > 80)
        return res.status(400).json({
          message: "Workspace name must be between 1 and 80 characters",
        });
      if (
        (req.user.workspaceNames || []).some(
          (name) =>
            normalizeWorkspaceName(name) === normalizeWorkspaceName(workspace),
        )
      )
        return res
          .status(409)
          .json({ message: "You already have a workspace with this name" });
      data.workspaceName = workspace;
    }
    if (name !== undefined) {
      if (typeof name !== "string" || !name.trim() || name.trim().length > 100)
        return res
          .status(400)
          .json({ message: "Name must be between 1 and 100 characters" });
      data.name = name.trim();
    }
    if (email !== undefined) {
      const normalizedEmail =
        typeof email === "string" ? email.trim().toLowerCase() : "";
      if (
        normalizedEmail.length > 254 ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)
      )
        return res
          .status(400)
          .json({ message: "Please provide a valid email address" });
      if (normalizedEmail !== req.user.email) data.email = normalizedEmail;
    }
    if (avatarImage !== undefined) {
      try {
        data.avatarImage = await normalizeAvatar(avatarImage);
      } catch (error) {
        return res.status(400).json({ message: error.message });
      }
    }
    if (!Object.keys(data).length)
      return res.status(400).json({ message: "No changes to save" });
    try {
      if (data.email) {
        const account = await db.user.findUnique({
          where: { id: req.user.id },
          select: { passwordHash: true },
        });
        if (
          typeof currentPassword !== "string" ||
          !account ||
          !(await bcrypt.compare(currentPassword, account.passwordHash))
        ) {
          return res.status(401).json({
            message: "Enter your current password to change your email",
          });
        }
      }
      const user = await db.user.update({
        where: { id: req.user.id },
        data,
        select: publicUserSelect,
      });
      return res.json(effectiveUser(user));
    } catch (error) {
      if (error.code === "P2002")
        return res.status(409).json({ message: "Email already registered" });
      console.error("Update profile error:", error);
      return res.status(500).json({ message: "Unable to update profile" });
    }
  };

  const deleteMe = async (req, res) => {
    const { currentPassword } = req.body ?? {};
    if (typeof currentPassword !== "string" || !currentPassword)
      return res.status(400).json({
        message: "Enter your current password to delete your account",
      });
    try {
      const account = await db.user.findUnique({
        where: { id: req.user.id },
        select: { passwordHash: true },
      });
      if (
        !account ||
        !(await bcrypt.compare(currentPassword, account.passwordHash))
      )
        return res.status(401).json({ message: "Incorrect password" });
      if (req.user.stripeCustomerId) {
        if (!stripe)
          return res
            .status(503)
            .json({
              message:
                "Billing is unavailable. Please try deleting your account later",
            });
        await createBillingService(db, stripe, billingConfig()).deleteAccount(
          req.user.id,
        );
      } else {
        await db.user.delete({ where: { id: req.user.id } });
      }
      return res.json({ message: "Account deleted" });
    } catch (error) {
      console.error("Delete account error:", error.code || error.name);
      return res.status(500).json({ message: "Unable to delete account" });
    }
  };
  return { signup, signin, getMe, updateMe, deleteMe };
}

export const { signup, signin, getMe, updateMe, deleteMe } =
  createAuthController();
