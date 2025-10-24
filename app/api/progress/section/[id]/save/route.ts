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
    const sectionIdx: number =
      typeof body?.sectionIdx === "number" ? body.sectionIdx : 0;

    const section = await prisma.section.findUnique({
      where: { id: sectionId },
      include: { unit: true, questions: { select: { id: true } } },
    });
    if (!section) {
      return NextResponse.json({ error: "Section not found" }, { status: 404 });
    }

    // Guardar/actualizar respuestas
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

    // Guardar sección actual en el progreso de la unidad
    await prisma.userUnitProgress.upsert({
      where: { userId_unitId: { userId, unitId: section.unitId } },
      update: { currentSectionIdx: sectionIdx },
      create: {
        userId,
        unitId: section.unitId,
        percent: 0,
        currentSectionIdx: sectionIdx,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
