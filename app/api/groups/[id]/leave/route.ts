import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions as any);
  const me = (session as any)?.user;
  if (!me?.id) return NextResponse.json({ error: "No auth" }, { status: 401 });

  const group = await prisma.group.findUnique({
    where: { id: params.id },
    select: { createdById: true },
  });
  if (!group) return NextResponse.json({ error: "Grupo no encontrado" }, { status: 404 });

  // El creador no puede "abandonar": debe borrar el grupo
  if (group.createdById === me.id) {
    return NextResponse.json({ error: "El creador no puede abandonar el grupo" }, { status: 400 });
  }

  const del = await prisma.groupMember.deleteMany({
    where: { groupId: params.id, userId: me.id },
  });

  return NextResponse.json({ ok: true, removed: del.count });
}
