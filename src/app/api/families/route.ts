import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function GET() {
  const families = await prisma.family.findMany({
    include: { members: true },
    orderBy: { name: "asc" },
  });
  return Response.json(families);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const family = await prisma.family.create({
    data: { name: body.name },
  });
  return Response.json(family, { status: 201 });
}
