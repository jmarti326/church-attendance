import { prisma } from "@/lib/prisma";

interface VisitorSummary {
  id: number;
  name: string;
  firstVisit: string;
  visitCount: number;
}

export async function GET() {
  const visitors = await prisma.member.findMany({
    where: { status: "visitor" },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      attendances: {
        where: { present: true },
        select: {
          record: {
            select: {
              date: true,
            },
          },
        },
        orderBy: {
          record: {
            date: "asc",
          },
        },
      },
    },
  });

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  thirtyDaysAgo.setHours(0, 0, 0, 0);

  const summarizedVisitors = visitors
    .map<VisitorSummary | null>((visitor) => {
      const firstVisit = visitor.attendances[0]?.record.date;

      if (!firstVisit) {
        return null;
      }

      return {
        id: visitor.id,
        name: `${visitor.firstName} ${visitor.lastName}`.trim(),
        firstVisit: firstVisit.toISOString(),
        visitCount: visitor.attendances.length,
      };
    })
    .filter((visitor): visitor is VisitorSummary => visitor !== null);

  const lostVisitors = summarizedVisitors
    .filter((visitor) => visitor.visitCount === 1)
    .sort((a, b) => new Date(b.firstVisit).getTime() - new Date(a.firstVisit).getTime());

  const returningVisitors = summarizedVisitors
    .filter((visitor) => visitor.visitCount >= 2)
    .sort((a, b) => {
      if (b.visitCount !== a.visitCount) {
        return b.visitCount - a.visitCount;
      }

      return new Date(b.firstVisit).getTime() - new Date(a.firstVisit).getTime();
    });

  const recentFirstTimeVisitors = summarizedVisitors
    .filter((visitor) => new Date(visitor.firstVisit) >= thirtyDaysAgo)
    .sort((a, b) => new Date(b.firstVisit).getTime() - new Date(a.firstVisit).getTime());

  return Response.json({
    recentFirstTimeVisitors,
    returningVisitors,
    lostVisitors,
  });
}
