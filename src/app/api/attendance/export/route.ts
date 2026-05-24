import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const dateFilter: Record<string, Date> = {};
  if (from) dateFilter.gte = new Date(from);
  if (to) dateFilter.lte = new Date(to);

  const records = await prisma.attendanceRecord.findMany({
    where: Object.keys(dateFilter).length > 0 ? { date: dateFilter } : undefined,
    include: {
      attendances: {
        where: { present: true },
        include: { member: { include: { family: true } } },
      },
    },
    orderBy: { date: "desc" },
  });

  const header = "Fecha,Nombre,Apellido,Familia,Estado";
  const rows: string[] = [];

  for (const record of records) {
    const dateStr = record.date.toISOString().split("T")[0];
    for (const att of record.attendances) {
      const family = att.member.family?.name || "";
      rows.push(
        `${dateStr},${att.member.firstName},${att.member.lastName},${family},${att.member.status}`
      );
    }
  }

  const csv = [header, ...rows].join("\n");
  const filename = from && to ? `asistencia_${from}_${to}.csv` : "asistencia.csv";

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
