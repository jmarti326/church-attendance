import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const view = searchParams.get("view") || "sunday";
  const dateStr = searchParams.get("date") || new Date().toISOString().split("T")[0];

  if (!["sunday", "month", "year"].includes(view)) {
    return Response.json({ error: "Invalid view. Use: sunday, month, year" }, { status: 400 });
  }

  const date = new Date(dateStr);

  if (view === "sunday") {
    return Response.json(await getSundayStats(date));
  } else if (view === "month") {
    return Response.json(await getMonthStats(date));
  } else {
    return Response.json(await getYearStats(date));
  }
}

async function getSundayStats(date: Date) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  // Get attendance for this date
  const record = await prisma.attendanceRecord.findFirst({
    where: { date: { gte: startOfDay, lte: endOfDay } },
    include: {
      attendances: { include: { member: { include: { family: true } } } },
      visitorCount: true,
    },
  });

  // Get active member count
  const activeMembers = await prisma.member.count({
    where: { status: { notIn: ["inactive", "fallecido"] } },
  });

  // Get previous Sunday's attendance
  const prevSunday = new Date(date);
  prevSunday.setDate(prevSunday.getDate() - 7);
  const prevStart = new Date(prevSunday);
  prevStart.setHours(0, 0, 0, 0);
  const prevEnd = new Date(prevSunday);
  prevEnd.setHours(23, 59, 59, 999);

  const prevRecord = await prisma.attendanceRecord.findFirst({
    where: { date: { gte: prevStart, lte: prevEnd } },
    include: { attendances: true },
  });

  const presentCount = record?.attendances.length || 0;
  const anonymousVisitors = record?.visitorCount?.count || 0;
  const prevCount = prevRecord?.attendances.length || 0;
  const attendanceRate = activeMembers > 0 ? Math.round((presentCount / activeMembers) * 100) : 0;

  // Group present members by family
  const familyAttendance: Record<string, { name: string; present: number; total: number }> = {};
  if (record) {
    for (const att of record.attendances) {
      const familyName = att.member.family?.name || "Sin familia";
      const familyId = att.member.familyId?.toString() || `solo-${att.member.id}`;
      if (!familyAttendance[familyId]) {
        familyAttendance[familyId] = { name: familyName, present: 0, total: 0 };
      }
      familyAttendance[familyId].present++;
    }
  }

  // Get total family members for each family represented
  const familyIds = Object.keys(familyAttendance)
    .filter((k) => !k.startsWith("solo-"))
    .map((k) => parseInt(k));

  if (familyIds.length > 0) {
    const familyCounts = await prisma.member.groupBy({
      by: ["familyId"],
      where: { familyId: { in: familyIds }, status: { notIn: ["inactive", "fallecido"] } },
      _count: true,
    });
    for (const fc of familyCounts) {
      if (fc.familyId && familyAttendance[fc.familyId.toString()]) {
        familyAttendance[fc.familyId.toString()].total = fc._count;
      }
    }
  }

  // First-time visitors (members created this week with status "visitor")
  const weekAgo = new Date(date);
  weekAgo.setDate(weekAgo.getDate() - 7);
  const newVisitors = await prisma.member.count({
    where: { status: "visitor", createdAt: { gte: weekAgo } },
  });

  return {
    view: "sunday",
    date: date.toISOString().split("T")[0],
    presentCount,
    anonymousVisitors,
    totalAttendance: presentCount + anonymousVisitors,
    activeMembers,
    attendanceRate,
    prevSundayCount: prevCount,
    change: prevCount > 0 ? Math.round(((presentCount - prevCount) / prevCount) * 100) : 0,
    newVisitors,
    families: Object.values(familyAttendance),
    presentMembers: record?.attendances.map((a) => ({
      id: a.member.id,
      name: `${a.member.firstName} ${a.member.lastName}`,
      status: a.member.status,
      family: a.member.family?.name,
    })) || [],
  };
}

async function getMonthStats(date: Date) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const startOfMonth = new Date(year, month, 1);
  const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59, 999);

  const records = await prisma.attendanceRecord.findMany({
    where: { date: { gte: startOfMonth, lte: endOfMonth } },
    include: { attendances: true, visitorCount: true },
    orderBy: { date: "asc" },
  });

  const activeMembers = await prisma.member.count({
    where: { status: { notIn: ["inactive", "fallecido"] } },
  });

  // Previous month for comparison
  const prevMonthStart = new Date(year, month - 1, 1);
  const prevMonthEnd = new Date(year, month, 0, 23, 59, 59, 999);
  const prevRecords = await prisma.attendanceRecord.findMany({
    where: { date: { gte: prevMonthStart, lte: prevMonthEnd } },
    include: { attendances: true },
  });

  const sundays = records.map((r) => ({
    date: r.date.toISOString().split("T")[0],
    count: r.attendances.length,
    anonymousVisitors: r.visitorCount?.count || 0,
    total: r.attendances.length + (r.visitorCount?.count || 0),
    rate: activeMembers > 0 ? Math.round((r.attendances.length / activeMembers) * 100) : 0,
  }));

  const totalAttendance = sundays.reduce((sum, s) => sum + s.count, 0);
  const average = sundays.length > 0 ? Math.round(totalAttendance / sundays.length) : 0;
  const highest = sundays.length > 0 ? Math.max(...sundays.map((s) => s.count)) : 0;
  const lowest = sundays.length > 0 ? Math.min(...sundays.map((s) => s.count)) : 0;

  const prevAvg = prevRecords.length > 0
    ? Math.round(prevRecords.reduce((sum, r) => sum + r.attendances.length, 0) / prevRecords.length)
    : 0;

  // New members/visitors this month
  const newMembers = await prisma.member.count({
    where: { createdAt: { gte: startOfMonth, lte: endOfMonth } },
  });

  // Members who attended at least once this month
  const uniqueAttendees = new Set<number>();
  for (const r of records) {
    for (const a of r.attendances) {
      uniqueAttendees.add(a.memberId);
    }
  }

  return {
    view: "month",
    month: `${year}-${String(month + 1).padStart(2, "0")}`,
    sundays,
    average,
    highest,
    lowest,
    activeMembers,
    averageRate: activeMembers > 0 ? Math.round((average / activeMembers) * 100) : 0,
    prevMonthAverage: prevAvg,
    change: prevAvg > 0 ? Math.round(((average - prevAvg) / prevAvg) * 100) : 0,
    newMembers,
    uniqueAttendees: uniqueAttendees.size,
    totalSundays: sundays.length,
  };
}

async function getYearStats(date: Date) {
  const year = date.getFullYear();
  const startOfYear = new Date(year, 0, 1);
  const endOfYear = new Date(year, 11, 31, 23, 59, 59, 999);

  const records = await prisma.attendanceRecord.findMany({
    where: { date: { gte: startOfYear, lte: endOfYear } },
    include: { attendances: true },
    orderBy: { date: "asc" },
  });

  const activeMembers = await prisma.member.count({
    where: { status: { notIn: ["inactive", "fallecido"] } },
  });

  // Group by month
  const monthlyData: { month: string; average: number; count: number; sundays: number }[] = [];
  const byMonth: Record<number, number[]> = {};

  for (const r of records) {
    const m = r.date.getMonth();
    if (!byMonth[m]) byMonth[m] = [];
    byMonth[m].push(r.attendances.length);
  }

  for (let m = 0; m < 12; m++) {
    const counts = byMonth[m] || [];
    const avg = counts.length > 0 ? Math.round(counts.reduce((a, b) => a + b, 0) / counts.length) : 0;
    monthlyData.push({
      month: new Date(year, m, 1).toLocaleString("es", { month: "short" }),
      average: avg,
      count: counts.reduce((a, b) => a + b, 0),
      sundays: counts.length,
    });
  }

  // Unique attendees for the year
  const uniqueAttendees = new Set<number>();
  for (const r of records) {
    for (const a of r.attendances) {
      uniqueAttendees.add(a.memberId);
    }
  }

  // Most consistent members (attended >80% of Sundays)
  const totalSundays = records.length;
  const memberAttendanceCounts: Record<number, number> = {};
  for (const r of records) {
    for (const a of r.attendances) {
      memberAttendanceCounts[a.memberId] = (memberAttendanceCounts[a.memberId] || 0) + 1;
    }
  }

  let consistent: { id: number; name: string; rate: number }[] = [];
  let atRisk: { id: number; name: string; rate: number }[] = [];

  if (totalSundays >= 4) {
    const memberIds = Object.keys(memberAttendanceCounts).map(Number);
    const membersData = await prisma.member.findMany({
      where: { id: { in: memberIds }, status: { notIn: ["inactive", "fallecido"] } },
      select: { id: true, firstName: true, lastName: true },
    });

    const memberMap = new Map(membersData.map((m) => [m.id, m]));

    const ranked = memberIds
      .map((id) => ({
        id,
        name: memberMap.get(id) ? `${memberMap.get(id)!.firstName} ${memberMap.get(id)!.lastName}` : "Unknown",
        rate: Math.round((memberAttendanceCounts[id] / totalSundays) * 100),
      }))
      .filter((m) => memberMap.has(m.id));

    consistent = ranked.filter((m) => m.rate >= 80).sort((a, b) => b.rate - a.rate).slice(0, 10);
    atRisk = ranked.filter((m) => m.rate <= 30 && m.rate > 0).sort((a, b) => a.rate - b.rate).slice(0, 10);
  }

  // Growth: new members this year
  const newThisYear = await prisma.member.count({
    where: { createdAt: { gte: startOfYear, lte: endOfYear } },
  });

  // Previous year comparison
  const prevYearStart = new Date(year - 1, 0, 1);
  const prevYearEnd = new Date(year - 1, 11, 31, 23, 59, 59, 999);
  const prevRecords = await prisma.attendanceRecord.findMany({
    where: { date: { gte: prevYearStart, lte: prevYearEnd } },
    include: { attendances: true },
  });
  const prevYearAvg = prevRecords.length > 0
    ? Math.round(prevRecords.reduce((sum, r) => sum + r.attendances.length, 0) / prevRecords.length)
    : 0;

  const yearAvg = records.length > 0
    ? Math.round(records.reduce((sum, r) => sum + r.attendances.length, 0) / records.length)
    : 0;

  return {
    view: "year",
    year,
    monthlyData,
    yearAverage: yearAvg,
    activeMembers,
    uniqueAttendees: uniqueAttendees.size,
    totalSundays,
    consistent,
    atRisk,
    newMembers: newThisYear,
    prevYearAverage: prevYearAvg,
    change: prevYearAvg > 0 ? Math.round(((yearAvg - prevYearAvg) / prevYearAvg) * 100) : 0,
  };
}
