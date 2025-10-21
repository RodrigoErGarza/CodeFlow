import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(
  _req: Request,
  { params }: { params: { slug: string } }
) {
  const session = await getServerSession(authOptions as any);
  const userId = (session as any)?.user?.id ?? "demo-user";

  const challenge = await prisma.challenge.findUnique({
    where: { slug: params.slug },
  });
  if (!challenge) {
    return NextResponse.json({ error: "Challenge not found" }, { status: 404 });
  }

  let meta: any = null;
  try { meta = challenge.testsJson ? JSON.parse(challenge.testsJson) : null; } catch {}

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
    requiresUnitNumber: meta?.meta?.requiresUnitNumber ?? null,
    hint: meta?.meta?.hint ?? null,
    starterCode: challenge.starterCode ?? "",
    passed: last?.status === "PASSED",
  });
}
