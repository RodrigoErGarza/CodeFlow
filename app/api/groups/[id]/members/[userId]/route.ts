import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string; userId: string } }
) {
  const session = await getServerSession(authOptions as any);
  const me = (session as any)?.user;
  if (!me?.id) return NextResponse.json({ error: "No auth" }, { status: 401 });

  const group = await prisma.group.findUnique({
    where: { id: params.id },
    select: { createdById: true },
  });
  if (!group) return NextResponse.json({ error: "Grupo no encontrado" }, { status: 404 });

  // Solo el creador puede expulsar
  if (group.createdById !== me.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  // No te expulses a ti mismo por esta ruta (para el creador usa eliminar grupo)
  if (params.userId === me.id) {
    return NextResponse.json({ error: "No puedes eliminarte a ti mismo" }, { status: 400 });
  }

  await prisma.groupMember.deleteMany({
    where: { groupId: params.id, userId: params.userId },
  });

  return NextResponse.json({ ok: true });
}
