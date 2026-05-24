import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const memberId = Number.parseInt(id, 10);

  if (Number.isNaN(memberId)) {
    return Response.json({ error: "Invalid member id" }, { status: 400 });
  }

  const member = await prisma.member.findUnique({
    where: { id: memberId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      photoUrl: true,
      status: true,
      familyId: true,
    },
  });

  if (!member) {
    return Response.json({ error: "Member not found" }, { status: 404 });
  }

  const attendanceRecords = await prisma.attendanceRecord.findMany({
    orderBy: { date: "desc" },
    select: {
      date: true,
      attendances: {
        where: { memberId },
        select: { present: true },
        take: 1,
      },
    },
  });

  return Response.json({
    member,
    records: attendanceRecords.map((record) => ({
      date: record.date.toISOString(),
      present: record.attendances[0]?.present ?? false,
    })),
  });
}
