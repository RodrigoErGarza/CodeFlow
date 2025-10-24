// app/api/groups/[id]/members/[userId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// En Next 15, params es una Promise y hay que esperarla.
type Ctx = { params: Promise<{ id: string; userId: string }> };

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const { id, userId } = await params; // 👈 await obligatorio

  const session = await getServerSession(authOptions as any);
  const me = (session as any)?.user;
  if (!me?.id) {
    return NextResponse.json({ error: "No auth" }, { status: 401 });
  }

  const group = await prisma.group.findUnique({
    where: { id },
    select: { createdById: true },
  });
  if (!group) {
    return NextResponse.json({ error: "Grupo no encontrado" }, { status: 404 });
  }

  // Solo el creador puede expulsar
  if (group.createdById !== me.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  // El creador no puede expulsarse a sí mismo por esta ruta
  if (userId === me.id) {
    return NextResponse.json(
      { error: "No puedes eliminarte a ti mismo" },
      { status: 400 }
    );
  }

  await prisma.groupMember.deleteMany({
    where: { groupId: id, userId },
  });

  return NextResponse.json({ ok: true });
}
