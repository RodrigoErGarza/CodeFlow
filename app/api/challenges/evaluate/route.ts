import { NextRequest, NextResponse } from "next/server";
import { PrismaClient, AttemptStatus } from "@prisma/client";
import { evaluateCode, normalizeRules, TestsJsonShape } from "@/lib/challenges/evaluator";

const prisma = new PrismaClient();

// ⚠️ Ajusta esto según tu auth real. En dev usamos el "demo-user".
function getUserId() {
  return "demo-user";
}

type Body = {
  challengeId?: string;
  slug?: string;
  code?: string;
  language?: string; // opcional (tomamos la del reto)
};

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Body;
    const { challengeId, slug, code } = body;

    if (!code || code.length < 1) {
      return NextResponse.json(
        { ok: false, error: "Código vacío. Escribe tu solución para evaluar." },
        { status: 400 }
      );
    }
    if (code.length > 100_000) {
      return NextResponse.json(
        { ok: false, error: "El código excede el tamaño permitido." },
        { status: 413 }
      );
    }

    // 1) Localizamos el reto por id o slug
    const challenge = await prisma.challenge.findFirst({
      where: {
        OR: [
          challengeId ? { id: challengeId } : undefined,
          slug ? { slug } : undefined,
        ].filter(Boolean) as any[],
      },
    });

    if (!challenge) {
      return NextResponse.json(
        { ok: false, error: "Challenge no encontrado" },
        { status: 404 }
      );
    }

    // 2) Tomamos reglas desde testsJson
    const raw: TestsJsonShape | null = challenge.testsJson
      ? (JSON.parse(challenge.testsJson) as TestsJsonShape)
      : null;
    const rules = normalizeRules(raw);

    // 3) Evaluamos como análisis estático (seguro)
    const result = evaluateCode(code, rules);
    const isCorrect = result.score === 100;
    const status: AttemptStatus = isCorrect ? "PASSED" : "FAILED";

    // 4) Guardamos el intento
    const userId = getUserId();
    const attempt = await prisma.challengeAttempt.create({
      data: {
        userId,
        challengeId: challenge.id,
        code,
        language: challenge.language,
        status,
        feedback: result.feedback.join(" "),
        isCorrect,
      },
      select: { id: true, createdAt: true, status: true, isCorrect: true },
    });

    // 5) Devolvemos evaluación
    return NextResponse.json({
      ok: true,
      attemptId: attempt.id,
      status: attempt.status,
      isCorrect: attempt.isCorrect,
      score: result.score,
      passed: result.passed,
      total: result.total,
      feedback: result.feedback,
      // por si quieres mostrar hint si falla:
      hint: raw?.meta?.hint ?? null,
    });
  } catch (e: any) {
    console.error("evaluate error:", e);
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Error inesperado al evaluar" },
      { status: 500 }
    );
  }
}
