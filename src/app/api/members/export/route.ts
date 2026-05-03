import { prisma } from "@/lib/prisma";

export async function GET() {
  const members = await prisma.member.findMany({
    include: { family: true },
    orderBy: [{ family: { name: "asc" } }, { lastName: "asc" }, { firstName: "asc" }],
  });

  const header = "firstName,lastName,phone,address,status,familyGroup";
  const rows = members.map((m) => {
    const phone = (m.phone || "").replace(/,/g, "");
    const address = (m.address || "").replace(/,/g, "");
    const familyGroup = m.family?.name || "";
    return `${m.firstName},${m.lastName},${phone},${address},${m.status},${familyGroup}`;
  });

  const csv = [header, ...rows].join("\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="miembros.csv"',
    },
  });
}
