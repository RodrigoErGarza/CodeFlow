// app/api/lessons/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Devuelve la lista de UNIDADES (no "Lesson" del módulo de retos).
 * Ordenadas por 'number' asc. Los campos encajan con lo que pinta AprendizajePage.
 */
export async function GET() {
  try {
    const units = await prisma.unit.findMany({
      orderBy: { number: "asc" },
      select: {
        id: true,
        number: true,
        slug: true,
        title: true,
        summary: true,
      },
    });

    const items = units.map(u => ({
      id: u.id,
      number: u.number,
      slug: u.slug,
      title: u.title,
      description: u.summary,
    }));

    return NextResponse.json({ items });
  } catch (e) {
    console.error("GET /api/lessons failed:", e);
    return NextResponse.json({ items: [] }, { status: 200 });
  }
}
