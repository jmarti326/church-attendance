import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const member = await prisma.member.findUnique({
    where: { id: parseInt(id) },
    include: { family: true },
  });

  if (!member) {
    return Response.json({ error: "Member not found" }, { status: 404 });
  }

  return Response.json(member);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  const member = await prisma.member.update({
    where: { id: parseInt(id) },
    data: {
      firstName: body.firstName,
      lastName: body.lastName,
      phone: body.phone || null,
      address: body.address || null,
      status: body.status,
      familyId: body.familyId || null,
    },
    include: { family: true },
  });

  return Response.json(member);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  await prisma.member.delete({ where: { id: parseInt(id) } });

  return Response.json({ success: true });
}
