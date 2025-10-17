// app/api/submissions/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * POST { challengeSlug, code, language }
 * Respuesta:
 *  { ok: boolean, passed: boolean, messages: string[] }
 */
export async function POST(req: Request) {
  const body = await req.json();
  const { challengeSlug, code, language } = body || {};

  if (!challengeSlug || typeof code !== "string") {
    return NextResponse.json(
      { ok: false, passed: false, messages: ["Datos incompletos"] },
      { status: 400 }
    );
  }

  // 1) Carga el reto para saber qué tokens validar
  //    Si no tienes BD, reutilizamos el endpoint público para no repetir lógica:
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL ?? ""}/api/challenges/${challengeSlug}`, { cache: "no-store" })
    .catch(() => null);
  const data = res && res.ok ? await res.json() : null;
  const tests = data?.item?.tests || {};
  const expectedTokens: string[] = tests?.expectedTokens || [];

  // 2) Validación súper simple: buscar tokens en el código
  const missing: string[] = [];
  for (const t of expectedTokens) {
    if (!code.includes(t)) missing.push(t);
  }

  const passed = missing.length === 0;
  const messages: string[] = passed
    ? ["✅ ¡Bien! Pasaste las comprobaciones básicas."]
    : [
        "❌ Faltan algunos tokens esperados en tu solución:",
        ...missing.map((m) => `- ${m}`),
        tests?.tip ? `💡 Tip: ${tests.tip}` : "",
      ].filter(Boolean);

  // 3) Guarda la entrega (userId fijo por ahora)
  const userId = "demo-user";
  try {
    await prisma.userSubmission.create({
      data: {
        userId,
        challengeSlug,
        language: language || "python",
        code,
        passed,
        score: passed ? 100 : 0,
      },
    });
  } catch {
    // si no tienes tabla aún, ignora silenciosamente
  }

  return NextResponse.json({ ok: true, passed, messages });
}
