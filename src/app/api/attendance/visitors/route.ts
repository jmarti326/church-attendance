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
    where: { date: { gte: startOfDay, lte: endOfDay } },
    include: { visitorCount: true },
  });

  if (!record?.visitorCount) {
    return Response.json({ count: 0, notes: null });
  }

  return Response.json({
    count: record.visitorCount.count,
    notes: record.visitorCount.notes,
  });
}

export async function PUT(request: NextRequest) {
  const body = await request.json();
  const { date, count, notes } = body as { date: string; count: number; notes?: string };

  if (!date || count == null) {
    return Response.json({ error: "date and count are required" }, { status: 400 });
  }

  const dateObj = new Date(date);
  dateObj.setHours(12, 0, 0, 0);
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  // Find or create attendance record for this date
  let record = await prisma.attendanceRecord.findFirst({
    where: { date: { gte: startOfDay, lte: endOfDay } },
  });

  if (!record) {
    record = await prisma.attendanceRecord.create({
      data: { date: dateObj },
    });
  }

  // Upsert the visitor count
  const visitorCount = await prisma.visitorCount.upsert({
    where: { recordId: record.id },
    update: { count, notes: notes ?? null },
    create: { recordId: record.id, count, notes: notes ?? null },
  });

  return Response.json({ count: visitorCount.count, notes: visitorCount.notes });
}
