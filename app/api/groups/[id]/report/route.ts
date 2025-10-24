// app/api/groups/[id]/report/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// En Next 15 el 2º argumento es una Promise que hay que await.
type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;            // 👈 await obligatorio
  const groupId = id;

  // Grupo + miembros
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: {
      members: {
        include: {
          user: {
            select: { id: true, name: true, username: true, avatarUrl: true, role: true },
          },
        },
      },
    },
  });
  if (!group) return NextResponse.json({ error: "Group not found" }, { status: 404 });

  const students = group.members.filter(m => m.role === "STUDENT");
  const teachers = group.members.filter(m => m.role === "TEACHER");
  const studentIds = students.map(m => m.userId);

  // Progreso promedio por estudiante (promedio de percent de sus unidades)
  const progressByUser = await prisma.userUnitProgress.groupBy({
    by: ["userId"],
    _avg: { percent: true },
    where: { userId: { in: studentIds } },
  });

  const avgProgress =
    progressByUser.length === 0
      ? 0
      : Math.round(
          (progressByUser.reduce((a, b) => a + (b._avg.percent ?? 0), 0) / progressByUser.length) *
            10
        ) / 10;

  // Intentos aprobados por estudiante
  const passedByUser = await prisma.challengeAttempt.groupBy({
    by: ["userId"],
    _count: { _all: true },
    where: { userId: { in: studentIds }, isCorrect: true },
  });

  // Últimos 30 días (time-series de aprobados)
  const since = new Date();
  since.setDate(since.getDate() - 30);
  const recentPasses = await prisma.challengeAttempt.findMany({
    where: { userId: { in: studentIds }, isCorrect: true, createdAt: { gte: since } },
    select: { createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  const byDay = new Map<string, number>();
  for (const r of recentPasses) {
    const key = r.createdAt.toISOString().slice(0, 10);
    byDay.set(key, (byDay.get(key) ?? 0) + 1);
  }
  const timeseries = Array.from(byDay.entries())
    .map(([date, value]) => ({ date, value }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Tabla por estudiante
  const table = students.map(s => {
    const u = s.user;
    const name = u.name || u.username || "Sin nombre";
    const avg = progressByUser.find(x => x.userId === u.id)?._avg.percent ?? 0;
    const passed = passedByUser.find(x => x.userId === u.id)?._count._all ?? 0;
    return {
      userId: u.id,
      name,
      avatarUrl: u.avatarUrl,
      role: "Estudiante",
      avgProgress: Math.round((avg ?? 0) * 10) / 10,
      passedAttempts: passed,
    };
  });

  // Top 3 por progreso
  const topStudents = [...table]
    .sort((a, b) => b.avgProgress - a.avgProgress)
    .slice(0, 3);

  return NextResponse.json({
    summary: {
      totalMembers: group.members.length,
      totalStudents: students.length,
      totalTeachers: teachers.length,
      avgProgress,
      totalPassed: passedByUser.reduce((a, b) => a + b._count._all, 0),
    },
    table,
    timeseries,
    topStudents,
  });
}
