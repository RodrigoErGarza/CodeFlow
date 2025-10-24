// app/api/groups/[id]/leave/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// En Next 15, "params" llega como Promise y hay que tiparlo y esperarlo.
type Ctx = { params: Promise<{ id: string }> };

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const { id } = await params; // 👈 obligatorio en Next 15

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

  // El creador no puede "abandonar": debe borrar el grupo
  if (group.createdById === me.id) {
    return NextResponse.json(
      { error: "El creador no puede abandonar el grupo" },
      { status: 400 }
    );
  }

  const del = await prisma.groupMember.deleteMany({
    where: { groupId: id, userId: me.id },
  });

  return NextResponse.json({ ok: true, removed: del.count });
}
