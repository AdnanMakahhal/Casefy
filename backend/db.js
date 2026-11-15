import "./config.js";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/prisma/index.js";

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DATABASE_URL,
    connectionTimeoutMillis: 5000,
    max: 5,
    idleTimeoutMillis: 10000,
  }),
});

export const isDatabaseConfigured = () => Boolean(process.env.DATABASE_URL);

export default prisma;
