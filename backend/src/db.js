import "./config.js";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";
import { neonConfig } from "@neondatabase/serverless";
import WebSocket from "ws";

neonConfig.webSocketConstructor = WebSocket;

const connectionString = process.env.DATABASE_URL;
const isNeon = connectionString
  ? new URL(connectionString).hostname.endsWith(".neon.tech")
  : false;
const connectionOptions = {
  connectionString,
  connectionTimeoutMillis: 30000,
  max: 5,
  idleTimeoutMillis: 10000,
};

// Neon WebSockets use port 443, including on networks that block Postgres TCP.
const adapter = isNeon
  ? new PrismaNeon(connectionOptions)
  : new PrismaPg(connectionOptions);
const prisma = new PrismaClient({ adapter });

export const isDatabaseConfigured = () => Boolean(process.env.DATABASE_URL);

export default prisma;
