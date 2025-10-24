import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

type Ctx = { params: Promise<{ slug: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { slug } = await params; // Next 15: params es Promise

  const session = await getServerSession(authOptions as any);
  const userId = (session as any)?.user?.id ?? "demo-user";

  const challenge = await prisma.challenge.findUnique({ where: { slug } });
  if (!challenge) {
    return NextResponse.json({ error: "Challenge not found" }, { status: 404 });
  }

  let meta: unknown = null;
  try {
    meta = challenge.testsJson ? JSON.parse(challenge.testsJson) : null;
  } catch {}

  const last = await prisma.challengeAttempt.findFirst({
    where: { userId, challengeId: challenge.id },
    orderBy: { createdAt: "desc" },
    select: { status: true },
  });

  return NextResponse.json({
    id: challenge.id,
    slug: challenge.slug,
    title: challenge.title,
    description: challenge.description,
    language: challenge.language,
    requiresUnitNumber: (meta as any)?.meta?.requiresUnitNumber ?? null,
    hint: (meta as any)?.meta?.hint ?? null,
    starterCode: challenge.starterCode ?? "",
    passed: last?.status === "PASSED",
  });
}
