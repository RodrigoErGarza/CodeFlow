import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserIdOrThrow } from "@/lib/auth";
import type { Ctx } from "@/lib/route";
import { getParams } from "@/lib/route";

export async function GET(_req: NextRequest, ctx: Ctx<{ slug: string }>) {
  const { slug } = await getParams(ctx);

  try {
    const userId = await getUserIdOrThrow();

    const unit = await prisma.unit.findUnique({
      where: { slug },
      include: {
        sections: {
          orderBy: { index: "asc" },
          include: {
            questions: {
              orderBy: { id: "asc" },
              select: {
                id: true,
                prompt: true,
                explanation: true,
                // devolvemos solo options, NO answerKey
                options: { select: { id: true, label: true } },
              },
            },
          },
        },
      },
    });

    if (!unit) return NextResponse.json({ error: "Unit not found" }, { status: 404 });

    const uup = await prisma.userUnitProgress.findUnique({
      where: { userId_unitId: { userId, unitId: unit.id } },
    });

    const allQuestionIds = unit.sections.flatMap(s => s.questions.map(q => q.id));
    const answers = await prisma.userAnswer.findMany({
      where: { userId, questionId: { in: allQuestionIds } },
      select: { questionId: true, optionId: true },
    });

    const prefill: Record<string, string> = {};
    for (const a of answers) prefill[a.questionId] = a.optionId;

    return NextResponse.json({
      unit,
      percent: uup?.percent ?? 0,
      currentSectionIdx: uup?.currentSectionIdx ?? 0,
      prefill,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
