import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const group = await prisma.group.findUnique({
    where: { id: params.id },
    select: { id: true, name: true, joinCode: true, createdById: true },
  });
  if (!group) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(group);
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions as any);
    const userId = (session as any)?.user?.id;
    if (!userId) return NextResponse.json({ error: "No auth" }, { status: 401 });

    const group = await prisma.group.findUnique({ where: { id: params.id } });
    if (!group) return NextResponse.json({ error: "Grupo no existe" }, { status: 404 });

    if (group.createdById !== userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    // Si tus relaciones no tienen cascade, borra miembros primero
    await prisma.groupMember.deleteMany({ where: { groupId: params.id } });
    await prisma.group.delete({ where: { id: params.id } });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Error" }, { status: 500 });
  }
}
