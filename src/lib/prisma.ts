import { PrismaClient } from "../generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { getDb } from "./sqlite";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient;
};

if (!globalForPrisma.prisma) {
  // Initialize our shared database connection first (sets WAL mode)
  getDb();

  // Prisma adapter will create its own connection, but WAL mode persists
  // on the file level so both connections can coexist
  const dbUrl = process.env.DATABASE_URL || "file:./dev.db";
  const adapter = new PrismaBetterSqlite3({ url: dbUrl, timeout: 30000 });
  globalForPrisma.prisma = new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma;
