import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const id = params.id;

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

  // Mapea a un DTO sencillo
  const list = g.members.map(m => ({
    id: m.id,
    role: m.role, // "TEACHER" | "STUDENT"
    user: m.user, // { id, name, username, avatarUrl, role }
  }));

  // Si por alguna razón el creador no aparece como TEACHER, lo agregamos en memoria
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
