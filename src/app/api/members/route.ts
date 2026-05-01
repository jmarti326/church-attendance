import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const search = searchParams.get("search");

  const where: Record<string, unknown> = {};

  if (status && status !== "all") {
    where.status = status;
  }

  if (search) {
    where.OR = [
      { firstName: { contains: search } },
      { lastName: { contains: search } },
    ];
  }

  const members = await prisma.member.findMany({
    where,
    include: { family: true },
    orderBy: [{ family: { name: "asc" } }, { lastName: "asc" }, { firstName: "asc" }],
  });

  return Response.json(members);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const member = await prisma.member.create({
    data: {
      firstName: body.firstName,
      lastName: body.lastName,
      phone: body.phone || null,
      address: body.address || null,
      status: body.status || "member",
      familyId: body.familyId || null,
    },
  });
  return Response.json(member, { status: 201 });
}
