// app/api/groups/[id]/members/route.ts   ← usa "members" si ese es tu folder
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// En Next 15, `params` llega como Promise y hay que esperarlo.
type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { id } = await params; // 👈 await obligatorio

  const g = await prisma.group.findUnique({
    where: { id },
    select: {
      id: true,
      createdBy: {
        select: { id: true, name: true, username: true, avatarUrl: true, role: true },
      },
      members: {
        orderBy: { joinedAt: "asc" },
        select: {
          id: true,
          role: true,
          user: {
            select: { id: true, name: true, username: true, avatarUrl: true, role: true },
          },
        },
      },
    },
  });

  if (!g) return NextResponse.json({ members: [] });

  const list = g.members.map(m => ({
    id: m.id,
    role: m.role,
    user: m.user,
  }));

  const hasCreator = list.some(m => m.user.id === g.createdBy.id);
  if (!hasCreator) {
    list.unshift({
      id: `teacher-${g.createdBy.id}`,
      role: "TEACHER" as const,
      user: g.createdBy,
    });
  }

  return NextResponse.json({ members: list });
}
