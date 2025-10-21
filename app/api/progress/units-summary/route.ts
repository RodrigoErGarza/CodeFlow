// app/api/progress/units-summary/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Si ya tienes una utilidad para obtener el userId, reutilízala.
// Aquí dejo un fallback a 'demo-user' para seguir tu patrón.
async function getUserId() {
  // TODO: reemplaza por sesión real cuando la tengas
  return "demo-user";
}

export async function GET() {
  try {
    const userId = await getUserId();

    // Tomamos el % por unidad directamente de UserUnitProgress
    const rows = await prisma.userUnitProgress.findMany({
      where: { userId },
      include: { unit: { select: { number: true, slug: true } } },
      orderBy: { updatedAt: "desc" },
    });

    // Map de número de unidad -> percent
    const byUnitNumber: Record<number, number> = {};
    for (const r of rows) {
      if (r.unit?.number != null) byUnitNumber[r.unit.number] = r.percent;
    }

    return NextResponse.json({ byUnitNumber });
  } catch (e) {
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}
