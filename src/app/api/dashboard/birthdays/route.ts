import { prisma } from "@/lib/prisma";

export async function GET() {
  const members = await prisma.member.findMany({
    where: {
      birthday: { not: null },
      status: { not: "inactive" },
    },
    select: { id: true, firstName: true, lastName: true, birthday: true, photoUrl: true },
  });

  const today = new Date();
  const upcoming = members
    .map((m) => {
      const bday = new Date(m.birthday!);
      const nextBday = new Date(today.getFullYear(), bday.getMonth(), bday.getDate());
      if (nextBday < today) nextBday.setFullYear(nextBday.getFullYear() + 1);
      const daysUntil = Math.ceil((nextBday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return { ...m, daysUntil, nextBirthday: nextBday.toISOString().split("T")[0] };
    })
    .filter((m) => m.daysUntil <= 30)
    .sort((a, b) => a.daysUntil - b.daysUntil);

  return Response.json(upcoming);
}
