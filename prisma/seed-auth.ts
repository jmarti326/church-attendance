import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

async function seed() {
  const connectionString = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/church";
  const adapter = new PrismaPg({ connectionString });
  const prisma = new PrismaClient({ adapter });

  // Create default admin user
  const hashedPassword = await bcrypt.hash("admin123", 10);
  
  await prisma.user.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      username: "admin",
      password: hashedPassword,
      name: "Administrador",
      role: "admin",
    },
  });

  console.log("✅ Seeded default admin user (admin / admin123)");
  await prisma.$disconnect();
  process.exit(0);
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
