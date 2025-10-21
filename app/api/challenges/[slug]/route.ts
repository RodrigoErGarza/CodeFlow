// app/api/challenges/[slug]/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
const CURRENT_USER_ID = "demo-user";

export async function GET(_: Request, { params }: { params: { slug: string } }) {
  const c = await prisma.challenge.findUnique({ where: { slug: params.slug }});
  if (!c) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let meta: any = {};
  try { meta = JSON.parse(c.testsJson || "{}"); } catch {}

  // estado (aprobado?)
  const ok = await prisma.challengeAttempt.findFirst({
    where: { userId: CURRENT_USER_ID, challengeId: c.id, isCorrect: true },
    orderBy: { createdAt: "desc" }
  });

  return NextResponse.json({
    id: c.id,
    slug: c.slug,
    title: c.title,
    description: c.description,
    language: c.language,
    requiresUnitNumber: meta?.meta?.requiresUnitNumber ?? null,
    passed: !!ok,
    // No devolvemos rules completas para no revelar la “solución”, solo hint opcional
    hint: meta?.meta?.hint ?? null,
  });
}
