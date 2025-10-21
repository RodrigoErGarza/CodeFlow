import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/getCurrentUserId";

type TestSpec =
  | { type: "contains"; tokens: string[] }
  | { type: "lineCount"; min?: number; max?: number };

type TestsJson = {
  meta?: { requiresUnitNumber?: number; hint?: string };
  rules?: TestSpec[];
};

// ===== Helpers muy simples de evaluación =====
function runTests(code: string, tests: TestsJson | null) {
  const results: { pass: boolean; message: string }[] = [];

  if (!tests?.rules?.length) {
    return { pass: true, results: [{ pass: true, message: "Sin reglas definidas." }] };
  }

  for (const rule of tests.rules) {
    if (rule.type === "contains") {
      const ok = rule.tokens.every(t => code.includes(t));
      results.push({
        pass: ok,
        message: ok
          ? `Contiene: ${rule.tokens.join(", ")}`
          : `Falta alguno de: ${rule.tokens.join(", ")}`,
      });
    } else if (rule.type === "lineCount") {
      const lines = code.split(/\r?\n/).length;
      const minOk = rule.min == null ? true : lines >= rule.min;
      const maxOk = rule.max == null ? true : lines <= rule.max;
      const ok = minOk && maxOk;
      results.push({
        pass: ok,
        message: ok
          ? `Líneas (${lines}) dentro del rango`
          : `Requiere líneas ${rule.min ?? "-"}..${rule.max ?? "-"} (tienes ${lines})`,
      });
    }
  }

  const pass = results.every(r => r.pass);
  return { pass, results };
}

export async function POST(
  req: Request,
  { params }: { params: { slug: string } }
) {
  const userId = await getCurrentUserId();

  const slug = params.slug;
  const body = await req.json();
  const code: string = body?.code ?? "";
  const language: string = body?.language ?? "python";

  // 1) Traer reto
  const challenge = await prisma.challenge.findUnique({
    where: { slug },
  });
  if (!challenge) {
    return NextResponse.json({ error: "Challenge not found" }, { status: 404 });
  }

  // 2) Cargar reglas
  let tests: TestsJson | null = null;
  try {
    tests = challenge.testsJson ? JSON.parse(challenge.testsJson) : null;
  } catch {
    tests = null;
  }

  // 3) Evaluar
  const { pass, results } = runTests(code, tests);

  // 4) Registrar intento
  await prisma.challengeAttempt.create({
    data: {
      userId,
      challengeId: challenge.id,
      code,
      language: language as any,
      status: pass ? "PASSED" : "FAILED",
      isCorrect: pass,
      feedback: results.map(r => `${r.pass ? "✔" : "✖"} ${r.message}`).join("\n"),
    },
  });

  // 5) Responder
  return NextResponse.json({
    pass,
    results,
  });
}
