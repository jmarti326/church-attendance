import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import bcrypt from "bcryptjs";

async function seed() {
  const adapter = new PrismaBetterSqlite3({ url: "file:./template.db" });
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
  process.exit(0);
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
