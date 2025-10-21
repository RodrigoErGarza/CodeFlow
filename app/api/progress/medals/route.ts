// app/api/progress/medals/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/getCurrentUserId";

export async function GET() {
  const userId = await getCurrentUserId();

  // 1. Traer todos los retos con su unidad (meta.requiresUnitNumber)
  const challenges = await prisma.challenge.findMany();
  const attempts = await prisma.challengeAttempt.findMany({
    where: { userId, isCorrect: true },
    select: { challengeId: true },
  });

  const completedIds = new Set(attempts.map(a => a.challengeId));

  // 2. Calcular progreso por unidad
  const progressByUnit: Record<string, { total: number; completed: number }> = {};

  for (const c of challenges) {
    let unit = "sinUnidad";
    try {
      const parsed = c.testsJson ? JSON.parse(c.testsJson) : null;
      if (parsed?.meta?.requiresUnitNumber)
        unit = `unidad${parsed.meta.requiresUnitNumber}`;
    } catch {}
    if (!progressByUnit[unit]) progressByUnit[unit] = { total: 0, completed: 0 };
    progressByUnit[unit].total++;
    if (completedIds.has(c.id)) progressByUnit[unit].completed++;
  }

  // 3. Medallas (completado si todos los retos de la unidad fueron aprobados)
  const medals = Object.entries(progressByUnit).map(([unit, info]) => ({
    unit,
    percent: (info.completed / info.total) * 100,
    completed: info.completed === info.total && info.total > 0,
  }));

  return NextResponse.json({ medals });
}
