import { PrismaClient } from "../generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import path from "path";

const dbUrl = process.env.DATABASE_URL || `file:${path.join(process.cwd(), "dev.db")}`;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient;
};

if (!globalForPrisma.prisma) {
  const adapter = new PrismaBetterSqlite3({ url: dbUrl, timeout: 15000 });
  globalForPrisma.prisma = new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma;
