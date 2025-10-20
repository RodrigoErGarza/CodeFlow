// scripts/reorderUnits.ts
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// Ajusta títulos si también quieres cambiarlos aquí:
const ORDER: Array<{ slug: string; number: number; title?: string }> = [
  { slug: "fundamentos-logica", number: 1 },
  { slug: "diagramas-flujo",   number: 2 },
  { slug: "pseint",            number: 3 },
  { slug: "python",            number: 4 },
  { slug: "java",              number: 5 },
];

async function main() {
  for (const u of ORDER) {
    await prisma.unit.update({
      where: { slug: u.slug },
      data: {
        number: u.number,
        ...(u.title ? { title: u.title } : {}),
      },
    }).catch(() => {
      console.warn(`⚠️  No existe unit con slug ${u.slug}; sáltalo o siembra primero.`);
    });
  }
  console.log("✅ Reordenadas/renumeradas");
}

main().finally(() => prisma.$disconnect());
