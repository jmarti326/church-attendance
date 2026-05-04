import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function GET() {
  const families = await prisma.family.findMany({
    include: { _count: { select: { members: true } } },
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

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return Response.json({ error: "id required" }, { status: 400 });
  }

  // Unassign members from this family
  await prisma.member.updateMany({
    where: { familyId: parseInt(id) },
    data: { familyId: null },
  });

  await prisma.family.delete({ where: { id: parseInt(id) } });

  return Response.json({ success: true });
}
