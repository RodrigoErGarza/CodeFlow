import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions as any);
  const user = (session as any)?.user;
  if (!user) return NextResponse.json({ error: "No auth" }, { status: 401 });

  const group = await prisma.group.findUnique({ where: { id: params.id } });
  if (!group) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const members = await prisma.groupMember.findMany({
    where: { groupId: group.id },
    include: {
      user: { select: { id: true, name: true, email: true, avatarUrl: true } },
    },
    orderBy: { joinedAt: "desc" },
  });

  const owner = await prisma.user.findUnique({
    where: { id: group.createdById },
    select: { id: true, name: true, email: true, avatarUrl: true },
  });

  return NextResponse.json({
    group: { id: group.id, name: group.name, joinCode: group.joinCode, createdById: group.createdById },
    owner,
    members,
  });
}
