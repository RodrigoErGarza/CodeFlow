// app/api/challenges/[slug]/submit/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { evaluate } from "@/lib/challenge-eval";

const prisma = new PrismaClient();
const CURRENT_USER_ID = "demo-user";

export async function POST(req: Request, { params }: { params: { slug: string } }) {
  const body = await req.json().catch(() => ({}));
  const { code = "", language } = body as { code: string; language?: string };

  const c = await prisma.challenge.findUnique({ where: { slug: params.slug }});
  if (!c) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Gating: requiere unidad N al 100%
  let tests: any = {};
  try { tests = JSON.parse(c.testsJson || "{}"); } catch {}
  const reqN = tests?.meta?.requiresUnitNumber as number | undefined;

  if (reqN) {
    const prog = await prisma.userUnitProgress.findFirst({
      where: { userId: CURRENT_USER_ID, unit: { number: reqN } },
      include: { unit: true },
    });
    if (!prog || prog.percent < 100) {
      return NextResponse.json({ error: `Reto bloqueado: completa la Unidad ${reqN} al 100%.` }, { status: 403 });
    }
  }

  // Validación muy simple de tamaño
  if (!code || code.length < 3) {
    return NextResponse.json({ error: "Código demasiado corto." }, { status: 400 });
  }

  const rules = tests?.rules ?? [];
  const result = evaluate(code, rules);
  const feedback = result.results.map(r => `${r.pass ? "✔" : "✖"} ${r.name}: ${r.message}`).join("\n");

  // Guardamos intento
  const attempt = await prisma.challengeAttempt.create({
    data: {
      userId: CURRENT_USER_ID,
      challengeId: c.id,
      code,
      language: (language ?? c.language) as any,
      status: result.pass ? "PASSED" : "FAILED",
      isCorrect: result.pass,
      feedback,
    },
  });

  return NextResponse.json({
    pass: result.pass,
    results: result.results,
    feedback,
    attemptId: attempt.id,
  });
}

