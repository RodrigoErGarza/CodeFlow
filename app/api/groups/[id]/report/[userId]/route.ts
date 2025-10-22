// app/api/groups/[id]/report/[userId]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: { id: string; userId: string } }
) {
  const { userId } = params;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, username: true, role: true, avatarUrl: true },
  });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const units = await prisma.userUnitProgress.findMany({
    where: { userId },
    select: { unitId: true, percent: true, updatedAt: true, unit: { select: { title: true, number: true } } },
    orderBy: { updatedAt: "desc" },
  });

  const attempts = await prisma.challengeAttempt.findMany({
    where: { userId },
    select: { isCorrect: true, createdAt: true },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const passed = attempts.filter(a => a.isCorrect).length;
  const avgProgress = units.length === 0 ? 0 : Math.round((units.reduce((a,b)=>a+(b.percent??0),0)/units.length)*10)/10;

  // Serie diaria para gráfico (últimos 30 días)
  const since = new Date();
  since.setDate(since.getDate() - 30);
  const recent = attempts.filter(a => a.createdAt >= since && a.isCorrect);
  const byDay = new Map<string, number>();
  for (const a of recent) {
    const key = a.createdAt.toISOString().slice(0,10);
    byDay.set(key, (byDay.get(key) ?? 0) + 1);
  }
  const timeseries = Array.from(byDay.entries()).map(([date,value])=>({date,value})).sort((a,b)=>a.date.localeCompare(b.date));

  const summaryRow = {
    name: user.name || user.username || "Sin nombre",
    role: user.role === "TEACHER" ? "Docente" : "Estudiante",
    passedAttempts: passed,
    avgProgress,
  };

  return NextResponse.json({
    user: {
      id: user.id,
      name: user.name || user.username || "Sin nombre",
      role: user.role === "TEACHER" ? "Docente" : "Estudiante",
      avatarUrl: user.avatarUrl,
    },
    summaryRow,        // <-- para exportar con columnas en ES
    units,             // detalle por unidad
    timeseries,        // para línea de tiempo
  });
}
