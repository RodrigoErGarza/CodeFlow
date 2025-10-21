import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions as any);
  const user = (session as any)?.user;
  if (!user) return NextResponse.json({ error: "No auth" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const code = (body?.code || "").toString().trim().toUpperCase();
  if (!code) return NextResponse.json({ error: "Código requerido" }, { status: 400 });

  const group = await prisma.group.findUnique({ where: { joinCode: code } });
  if (!group) return NextResponse.json({ error: "Código inválido" }, { status: 404 });

  if (group.createdById === user.id) {
    // el dueño no se agrega como miembro
    return NextResponse.json({ ok: true, group, joined: false, reason: "owner" });
  }

  await prisma.groupMember.upsert({
    where: { groupId_userId: { groupId: group.id, userId: user.id } },
    create: { groupId: group.id, userId: user.id, role: "STUDENT" }, // ← tu enum
    update: {},
  });

  return NextResponse.json({ ok: true, group, joined: true });
}
