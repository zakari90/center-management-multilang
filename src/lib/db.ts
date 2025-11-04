/* eslint-disable @typescript-eslint/no-explicit-any */
// src/lib/db.ts
import { PrismaClient } from "@prisma/client";



// Correct global declaration (must match everywhere it appears in your codebase)
declare global {
  var prisma: any;
}

// Singleton: reuse global prisma in dev, create new in prod
const db = global.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  global.prisma = db;
}

export default db;
