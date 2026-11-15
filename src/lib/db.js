import { PrismaClient } from "@prisma/client";

// Prisma singleton — survives HMR in dev, one pool in prod.
const globalForPrisma = globalThis;
export const prisma =
  globalForPrisma.__critiquePrisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.__critiquePrisma = prisma;
