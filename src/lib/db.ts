/* eslint-disable @typescript-eslint/no-explicit-any */
// src/lib/db.ts
import { PrismaClient } from "@prisma/client";

// Correct global declaration (must match everywhere it appears in your codebase)
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

// Singleton: reuse global prisma in dev, create new in prod
// This ensures we don't create multiple instances during hot reloading
const db: PrismaClient =
  global.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  global.prisma = db;
}

export default db;
