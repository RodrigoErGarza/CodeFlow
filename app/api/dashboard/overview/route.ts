// app/api/dashboard/overview/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions as any);
  const userId = (session as any)?.user?.id;
  if (!userId) return NextResponse.json({ error: "No auth" }, { status: 401 });

  // === Actividad reciente (igual que antes) ===
  const [lastStudy, lastChallenge, lastSnippet] = await Promise.all([
    prisma.userUnitProgress.findFirst({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      select: { updatedAt: true, unit: { select: { title: true, number: true } } },
    }),
    prisma.challengeAttempt.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true, challenge: { select: { title: true } } },
    }),
    prisma.snippet.findFirst({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      select: { updatedAt: true, title: true, id: true },
    }),
  ]);

  type Item = { when: Date; label: string; type: "Aprendizaje"|"Retos"|"Snippets"; href?: string };
  const candidates: Item[] = [];
  if (lastStudy) {
    candidates.push({
      when: lastStudy.updatedAt,
      type: "Aprendizaje",
      label: lastStudy.unit?.title ? `Unidad: ${lastStudy.unit.title}` : "Aprendizaje",
    });
  }
  if (lastChallenge) {
    candidates.push({
      when: lastChallenge.createdAt,
      type: "Retos",
      label: lastChallenge.challenge?.title ?? "Reto",
    });
  }
  if (lastSnippet) {
    candidates.push({
      when: lastSnippet.updatedAt,
      type: "Snippets",
      label: lastSnippet.title ?? "Snippet",
      href: `/generador?snippet=${lastSnippet.id}`,
    });
  }
  const actividadReciente =
    candidates.sort((a,b)=>b.when.getTime()-a.when.getTime())[0] ?? null;

  // === PROGRESO por UNIDADES ===
  const [totalUnits, completedUnits, avgRow] = await Promise.all([
    prisma.unit.count(),
    prisma.userUnitProgress.count({
      where: { userId, percent: { gte: 100 } },
    }),
    prisma.userUnitProgress.aggregate({
      _avg: { percent: true },
      where: { userId },
    }),
  ]);

  // === STATS rápidas (para tarjetas/mini KPIs) ===
  const [passedAttempts, totalAttempts] = await Promise.all([
    prisma.challengeAttempt.count({ where: { userId, isCorrect: true } }),
    prisma.challengeAttempt.count({ where: { userId } }),
  ]);

  // === Snippets recientes ===
  const snippetsRecientes = await prisma.snippet.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    take: 4,
    select: { id: true, title: true, updatedAt: true },
  });

  return NextResponse.json({
    actividadReciente,
    progresoUnidades: {
      completedUnits,
      totalUnits,
      avgUnitPercent: Math.round(avgRow._avg.percent ?? 0),
    },
    stats: {
      passedAttempts,
      totalAttempts,
    },
    snippetsRecientes,
  });
}
