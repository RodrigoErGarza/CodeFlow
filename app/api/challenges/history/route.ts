// app/api/challenges/history/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/getCurrentUserId";

export async function GET() {
  const userId = await getCurrentUserId();

  // Obtenemos los últimos intentos del usuario
  const attempts = await prisma.challengeAttempt.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      challenge: { select: { slug: true, title: true, language: true } },
    },
  });

  // Formateamos datos para frontend
  const history = attempts.map(a => ({
    id: a.id,
    slug: a.challenge.slug,
    title: a.challenge.title,
    language: a.challenge.language,
    status: a.status,
    isCorrect: a.isCorrect,
    createdAt: a.createdAt,
    feedback: a.feedback,
  }));

  return NextResponse.json({ history });
}
    