import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");

  if (!date) {
    return Response.json({ error: "date parameter required" }, { status: 400 });
  }

  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const record = await prisma.attendanceRecord.findFirst({
    where: {
      date: { gte: startOfDay, lte: endOfDay },
    },
    include: {
      attendances: { include: { member: true } },
    },
  });

  if (!record) {
    return Response.json({ record: null, attendances: [] });
  }

  return Response.json({
    record,
    attendances: record.attendances,
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { date, memberIds } = body as { date: string; memberIds: number[] };

  const dateObj = new Date(date);
  dateObj.setHours(12, 0, 0, 0);

  // Find or create attendance record for this date
  let record = await prisma.attendanceRecord.findFirst({
    where: {
      date: {
        gte: new Date(new Date(date).setHours(0, 0, 0, 0)),
        lte: new Date(new Date(date).setHours(23, 59, 59, 999)),
      },
    },
  });

  if (!record) {
    record = await prisma.attendanceRecord.create({
      data: { date: dateObj },
    });
  }

  // Clear existing attendance for this record and re-create
  await prisma.attendance.deleteMany({
    where: { recordId: record.id },
  });

  if (memberIds.length > 0) {
    await prisma.attendance.createMany({
      data: memberIds.map((memberId) => ({
        memberId,
        recordId: record.id,
        present: true,
      })),
    });
  }

  const updated = await prisma.attendanceRecord.findUnique({
    where: { id: record.id },
    include: { attendances: true },
  });

  return Response.json(updated);
}
