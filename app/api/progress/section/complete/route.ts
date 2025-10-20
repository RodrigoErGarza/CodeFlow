// app/api/progress/section/complete/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function getUserId(req: Request) {
  // Ajusta a tu autenticación real
  return req.headers.get("x-user-id") ?? "demo-user";
}

export async function POST(req: Request) {
  try {
    const userId = await getUserId(req);
    const { sectionId } = await req.json();

    if (!sectionId) {
      return NextResponse.json({ error: "sectionId requerido" }, { status: 400 });
    }

    const section = await prisma.section.findUnique({
      where: { id: sectionId },
      include: { unit: { include: { sections: true } } },
    });

    if (!section) {
      return NextResponse.json({ error: "Sección no encontrada" }, { status: 404 });
    }

    // Marca sección como completada (upsert)
    await prisma.userSectionProgress.upsert({
      where: { userId_sectionId: { userId, sectionId } },
      update: { completed: true },
      create: { userId, sectionId, completed: true },
    });

    const totalSections = section.unit.sections.length || 1;

    const completedSections = await prisma.userSectionProgress.count({
      where: { userId, sectionId: { in: section.unit.sections.map((s) => s.id) }, completed: true },
    });

    const percent = Math.min(100, Math.floor((completedSections / totalSections) * 100));

    // Guarda (o crea) progreso de la unidad
    await prisma.userUnitProgress.upsert({
      where: { userId_unitId: { userId, unitId: section.unitId } },
      update: { percent },
      create: { userId, unitId: section.unitId, percent },
    });

    return NextResponse.json({ ok: true, percent });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Error" }, { status: 500 });
  }
}
