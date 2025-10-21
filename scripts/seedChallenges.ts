// scripts/seedChallenges.ts
import { PrismaClient, Language } from "@prisma/client";

const prisma = new PrismaClient();

type Payload = {
  slug: string;
  title: string;
  description: string;
  language: Language;                // <- respeta tu enum: 'python' | 'java' | 'pseint'
  requiresUnitNumber: number;        // gating por unidad
  testsJson: any;                    // reglas de evaluación + meta
  starterCode?: string;              // opcional, por si quieres poner boilerplate
};

async function main() {
  // (opcional) verificamos que existan las unidades 1..5
  const units = await prisma.unit.findMany({
    select: { number: true },
  });
  const unitNumbers = new Set(units.map(u => u.number));
  [1,2,3,4,5].forEach(n => {
    if (!unitNumbers.has(n)) {
      console.warn(`⚠️ Falta la Unidad ${n} (no es bloqueante para crear el reto, pero el gating no desbloqueará).`);
    }
  });

  const payloads: Payload[] = [
    {
      slug: "reto-1",
      title: "Lógica básica: conceptos y decisiones",
      description: "Usa al menos una variable y un condicional simple.",
      language: "python",
      requiresUnitNumber: 1,
      starterCode: `# Escribe tu solución aquí\nx = 10\nif x > 5:\n    print("mayor")\n`,
      testsJson: {
        meta: { requiresUnitNumber: 1, hint: "Incluye una condición if" },
        rules: [
          { type: "contains", tokens: ["if"] },
          { type: "lineCount", min: 3 },
        ],
      },
    },
    {
      slug: "reto-2",
      title: "Diagramas de flujo → Decisión",
      description: "Simula el rombo (if/else) con dos rutas.",
      language: "python",
      requiresUnitNumber: 2,
      starterCode: `# if/else\ny = 3\nif y % 2 == 0:\n    print("par")\nelse:\n    print("impar")\n`,
      testsJson: {
        meta: { requiresUnitNumber: 2, hint: "Debe tener if y else" },
        rules: [
          { type: "contains", tokens: ["if"] },
          { type: "contains", tokens: ["else"] },
          { type: "lineCount", min: 4 },
        ],
      },
    },
    {
      slug: "reto-3",
      title: "PSeInt: Secuencia E→P→S",
      description: "Entrada → Proceso → Salida en PSeInt/pseudo.",
      language: "pseint",
      requiresUnitNumber: 3,
      starterCode: `# PSeInt/pseudo\na <- 5\nb <- 7\nc <- a + b\nEscribir c\n`,
      testsJson: {
        meta: { requiresUnitNumber: 3 },
        rules: [{ type: "lineCount", min: 3 }],
      },
    },
    {
      slug: "reto-4",
      title: "Python: ciclos y acumuladores",
      description: "Usa un ciclo para acumular y mostrar el resultado.",
      language: "python",
      requiresUnitNumber: 4,
      starterCode: `total = 0\nfor i in range(5):\n    total += i\nprint(total)\n`,
      testsJson: {
        meta: { requiresUnitNumber: 4 },
        rules: [{ type: "contains", tokens: ["for"] }, { type: "contains", tokens: ["print"] }],
      },
    },
    {
      slug: "reto-5",
      title: "Java: Scanner + condición",
      description: "Lee con Scanner y usa if/else para decidir la salida.",
      language: "java",
      requiresUnitNumber: 5,
      starterCode: `import java.util.*;\npublic class Main {\n  public static void main(String[] args){\n    Scanner sc = new Scanner(System.in);\n    int x = sc.nextInt();\n    if (x > 0) System.out.println("positivo");\n    else System.out.println("no positivo");\n  }\n}\n`,
      testsJson: {
        meta: { requiresUnitNumber: 5 },
        rules: [
          { type: "contains", tokens: ["Scanner"] },
          { type: "contains", tokens: ["if"] },
          { type: "contains", tokens: ["System.out.println"] },
        ],
      },
    },
  ];

  for (const p of payloads) {
    await prisma.challenge.upsert({
      where: { slug: p.slug },
      create: {
        slug: p.slug,
        title: p.title,
        description: p.description,
        language: p.language,
        starterCode: p.starterCode ?? "",                 // <- REQUERIDO
        testsJson: JSON.stringify(p.testsJson),
      },
      update: {
        title: p.title,
        description: p.description,
        language: p.language,
        starterCode: p.starterCode ?? "",
        testsJson: JSON.stringify(p.testsJson),
      },
    });
  }

  console.log("✅ Retos sembrados/actualizados.");
}

main().finally(() => prisma.$disconnect());
