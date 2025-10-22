// app/api/groups/[id]/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions as any);
  const userId = (session as any)?.user?.id;
  if (!userId) return NextResponse.json({ error: "No auth" }, { status: 401 });

  const g = await prisma.group.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      name: true,
      joinCode: true,
      createdById: true,
      members: { where: { userId }, select: { role: true } },
    },
  });

  if (!g) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isTeacher = g.createdById === userId || g.members.some((m) => m.role === "TEACHER");

  return NextResponse.json({
    id: g.id,
    name: g.name,
    isTeacher,
    joinCode: isTeacher ? g.joinCode : null,
  });
}
