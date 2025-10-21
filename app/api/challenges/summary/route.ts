import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/getCurrentUserId";

export async function GET() {
  const userId = await getCurrentUserId();

  const attempts = await prisma.challengeAttempt.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { challenge: { select: { slug: true } } },
  });

  const bySlug: Record<string, {
    lastStatus: "PENDING" | "PASSED" | "FAILED";
    isCorrect: boolean;
    updatedAt: string;
    tries: number;
  }> = {};

  const seen = new Set<string>();
  for (const a of attempts) {
    const slug = a.challenge.slug;
    if (seen.has(slug)) { bySlug[slug].tries += 1; continue; }
    seen.add(slug);
    bySlug[slug] = {
      lastStatus: a.status as any,
      isCorrect: !!a.isCorrect,
      updatedAt: a.createdAt.toISOString(),
      tries: 1,
    };
  }

  const completedCount = Object.values(bySlug)
    .filter(x => x.lastStatus === "PASSED" || x.isCorrect).length;

  return NextResponse.json({ bySlug, completedCount });
}
