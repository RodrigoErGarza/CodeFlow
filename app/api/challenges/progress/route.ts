import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

function getUserId() { return "demo-user"; }

export async function GET(_req: NextRequest) {
  const userId = getUserId();

  // último intento por reto para este usuario
  const attempts = await prisma.challengeAttempt.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: { challengeId: true, isCorrect: true, createdAt: true },
  });

  // nos quedamos con el último por challengeId
  const latest: Record<string, { isCorrect: boolean; createdAt: string }> = {};
  for (const a of attempts) {
    if (!latest[a.challengeId]) {
      latest[a.challengeId] = { isCorrect: a.isCorrect, createdAt: a.createdAt.toISOString() };
    }
  }

  return NextResponse.json({ ok: true, items: latest });
}
