import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
// ⚠️ cambia esto por tu forma real de obtener el usuario actual
import { getServerSession } from "next-auth";

const prisma = new PrismaClient();

export async function GET() {
  try {
    // 1) Usuario actual (ajústalo a tu auth real)
    const session = await getServerSession();
    const userId = (session?.user as any)?.id || "demo-user";

    // 2) Leemos progreso por unidad (percent) y el slug de la unidad
    const rows = await prisma.userUnitProgress.findMany({
      where: { userId },
      select: {
        unitId: true,
        percent: true,
        unit: { select: { slug: true } },
      },
    });

    // 3) Derivamos “completadas” por percent >= 100
    const completedUnitIds = rows
      .filter((r) => (r.percent ?? 0) >= 100)
      .map((r) => r.unitId);

    // 4) Devolvemos también los percent por unidad para que el grid los pinte
    const percents = rows.map((r) => ({
      unitId: r.unitId,
      slug: r.unit.slug,
      percent: r.percent ?? 0,
    }));

    return NextResponse.json({
      completedUnitIds,
      percents,
    });
  } catch (e) {
    console.error("GET /api/progress/summary failed:", e);
    return NextResponse.json(
      { completedUnitIds: [], percents: [] },
      { status: 200 },
    );
  }
}
