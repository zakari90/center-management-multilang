// center-management-multilang-pwa/src/lib/db.ts
import { PrismaClient } from "@prisma/client"

const prismaClientSingleton = () => {
  return new PrismaClient()
}

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>

declare global {
  var prisma: undefined | PrismaClientSingleton
}

const db = globalThis.prisma ?? prismaClientSingleton()

export default db

if (process.env.NODE_ENV !== "production") globalThis.prisma = db