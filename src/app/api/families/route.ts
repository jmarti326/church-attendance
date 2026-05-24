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

  // Merge: move all members from source families into target, then delete sources
  if (body.action === "merge") {
    const { targetId, sourceIds } = body as { targetId: number; sourceIds: number[] };
    if (!targetId || !sourceIds?.length) {
      return Response.json({ error: "targetId and sourceIds required" }, { status: 400 });
    }
    await prisma.member.updateMany({
      where: { familyId: { in: sourceIds } },
      data: { familyId: targetId },
    });
    await prisma.family.deleteMany({ where: { id: { in: sourceIds } } });
    return Response.json({ success: true });
  }

  // Bulk delete
  if (body.action === "bulkDelete") {
    const { ids } = body as { ids: number[] };
    if (!ids?.length) {
      return Response.json({ error: "ids required" }, { status: 400 });
    }
    await prisma.member.updateMany({
      where: { familyId: { in: ids } },
      data: { familyId: null },
    });
    await prisma.family.deleteMany({ where: { id: { in: ids } } });
    return Response.json({ success: true });
  }

  // Create new family
  const family = await prisma.family.create({
    data: { name: body.name },
  });
  return Response.json(family, { status: 201 });
}

export async function PUT(request: NextRequest) {
  const body = await request.json();
  const { id, name } = body;

  if (!id || !name?.trim()) {
    return Response.json({ error: "id and name required" }, { status: 400 });
  }

  const family = await prisma.family.update({
    where: { id: parseInt(id) },
    data: { name: name.trim() },
  });
  return Response.json(family);
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return Response.json({ error: "id required" }, { status: 400 });
  }

  await prisma.member.updateMany({
    where: { familyId: parseInt(id) },
    data: { familyId: null },
  });

  await prisma.family.delete({ where: { id: parseInt(id) } });

  return Response.json({ success: true });
}
