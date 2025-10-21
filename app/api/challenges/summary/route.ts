// app/api/challenges/summary/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";

// ⬇️ ajusta este import al path real donde exportas tus authOptions
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions as any);
  // 👇 resolvemos el error de tipos con un cast seguro y fallback
  const userId = (session as any)?.user?.id ?? "demo-user";

  // Últimos intentos del usuario, ordenados por fecha (desc)
  const attempts = await prisma.challengeAttempt.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { challenge: { select: { slug: true } } },
  });

  type Row = {
    lastStatus: "PENDING" | "PASSED" | "FAILED";
    lastScore: number;
    attempts: number;
    updatedAt: string;
  };

  const bySlug: Record<string, Row> = {};
  const seen = new Set<string>();

  for (const a of attempts) {
    const slug = a.challenge.slug;
    if (!seen.has(slug)) {
      // este es el último intento (porque está ordenado desc)
      bySlug[slug] = {
        lastStatus: a.status as any,
        // si no tienes "score" en el schema, usa isCorrect->100/0
        lastScore: (a as any).score ?? (a.isCorrect ? 100 : 0),
        attempts: 1,
        updatedAt: a.createdAt.toISOString(),
      };
      seen.add(slug);
    } else {
      // cuenta de intentos para ese reto
      bySlug[slug].attempts += 1;
    }
  }

  const totalChallenges = await prisma.challenge.count();
  const completed = Object.values(bySlug).filter(r => r.lastStatus === "PASSED").length;

  return NextResponse.json({
    bySlug,
    totals: { completed, total: totalChallenges },
  });
}
