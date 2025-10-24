import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserIdOrThrow } from "@/lib/auth";
import { Ctx, getParams } from "@/lib/route";

export async function POST(req: NextRequest, ctx: Ctx<{ id: string }>) {
  try {
    const userId = await getUserIdOrThrow();
    const { id } = await getParams(ctx);         // 👈 params async
    const sectionId = id;

    const body = await req.json().catch(() => ({}));
    const answers: Record<string, string> = body?.answers || {};

    const section = await prisma.section.findUnique({
      where: { id: sectionId },
      include: {
        unit: { include: { sections: { select: { id: true } } } },
        questions: { select: { id: true, answerKey: true } },
      },
    });
    if (!section) {
      return NextResponse.json({ error: "Section not found" }, { status: 404 });
    }

    // Evaluación
    const results: Record<string, { selected?: string; correct: boolean }> = {};
    let allCorrect = true;
    for (const q of section.questions) {
      const sel = answers[q.id];
      const correct = sel && sel === q.answerKey;
      results[q.id] = { selected: sel, correct: !!correct };
      if (!correct) allCorrect = false;
    }

    // Guardar respuestas del usuario
    await Promise.all(
      Object.entries(answers).map(([questionId, optionId]) =>
        prisma.userAnswer.upsert({
          where: { userId_questionId: { userId, questionId } },
          update: { optionId },
          create: {
            userId,
            unitId: section.unitId,
            sectionId: section.id,
            questionId,
            optionId,
          },
        })
      )
    );

    let percent = 0;
    if (allCorrect) {
      await prisma.userSectionProgress.upsert({
        where: { userId_sectionId: { userId, sectionId } },
        update: { completed: true },
        create: { userId, sectionId, completed: true },
      });

      const total = section.unit.sections.length;
      const completedCount = await prisma.userSectionProgress.count({
        where: {
          userId,
          sectionId: { in: section.unit.sections.map(s => s.id) },
          completed: true,
        },
      });
      percent = Math.round((completedCount / Math.max(total, 1)) * 100);

      await prisma.userUnitProgress.upsert({
        where: { userId_unitId: { userId, unitId: section.unitId } },
        update: { percent },
        create: { userId, unitId: section.unitId, percent, currentSectionIdx: 0 },
      });
    } else {
      const uup = await prisma.userUnitProgress.findUnique({
        where: { userId_unitId: { userId, unitId: section.unitId } },
      });
      percent = uup?.percent ?? 0;
    }

    return NextResponse.json({ ok: true, results, allCorrect, percent });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
