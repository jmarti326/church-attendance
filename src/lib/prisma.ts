import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient;
};

if (!globalForPrisma.prisma) {
  const connectionString = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/church";
  const adapter = new PrismaPg({ connectionString });
  globalForPrisma.prisma = new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma;
