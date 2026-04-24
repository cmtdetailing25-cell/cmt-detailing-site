import { PrismaClient } from "@prisma/client";

// Reuse the same Prisma client instance across hot-reloads in development.
// Without this, Next.js dev mode creates a new client on every file change.
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient({ log: ["error"] });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
