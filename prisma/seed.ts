// prisma/seed.ts
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  // Limpia datos anteriores (opcional en desarrollo)
  await prisma.challengeAttempt.deleteMany({});
  await prisma.userProgress.deleteMany({});
  await prisma.challenge.deleteMany({});
  await prisma.lesson.deleteMany({});

  // Lecciones
  const lessons = await prisma.$transaction([
    prisma.lesson.create({
      data: {
        number: 1,
        slug: "fundamentos-logica",
        title: "Fundamentos de la Lógica de Programación y Estructuras de Control",
        description:
          "Aprende qué es un algoritmo, variables, condicionales, bucles y cómo pensar en pasos.",
        content:
`# Fundamentos de la lógica
- ¿Qué es un algoritmo?
- Variables y tipos (a nivel conceptual).
- Estructuras de control: if/else, while/for.
- Diagramas de flujo y pseudocódigo.
`
      }
    }),
    prisma.lesson.create({
      data: {
        number: 2,
        slug: "intro-python",
        title: "Lenguaje de Programación Python",
        description:
          "Sintaxis básica, print, variables, condicionales y bucles en Python.",
        content:
`# Python básico
- print()
- Asignaciones
- if / else
- while / for
`
      }
    }),
    prisma.lesson.create({
      data: {
        number: 3,
        slug: "intro-java",
        title: "Lenguaje de Programación Java",
        description:
          "Sintaxis básica de Java, clase main, System.out.println, condicionales y bucles.",
        content:
`# Java básico
- public class / main
- System.out.println
- if / else
- for / while
`
      }
    }),
    prisma.lesson.create({
      data: {
        number: 4,
        slug: "intro-pseint",
        title: "Pseudocódigo PSeInt",
        description:
          "Cómo expresar algoritmos con Escribir, Si/Sino, Mientras, Para en PSeInt.",
        content:
`# PSeInt
- Escribir
- Si ... Entonces ... Sino ... FinSi
- Mientras / Para
`
      }
    }),
    prisma.lesson.create({
      data: {
        number: 5,
        slug: "diagramas-flujo",
        title: "Diagramas de flujo",
        description:
          "Cómo modelar la lógica con diagramas de flujo y relacionarlo con el código.",
        content:
`# Diagramas de flujo
- Símbolos (inicio/fin, proceso, decisión)
- Buenas prácticas de legibilidad
- Del diagrama al código
`
      }
    }),
  ]);

  // Retos (1 a 5) mapeados a cada lección
  const [l1, l2, l3, l4, l5] = lessons;

  await prisma.challenge.createMany({
    data: [
      {
        slug: "reto-1-despega-logica",
        title: "Reto 1: Despega con la lógica",
        description:
          "Escribe un algoritmo que asigne x=0, y si x>0 imprima 'positivo', si no, 'negativo'.",
        language: "pseint", // libre, lo usaremos solo como meta; en día 4 validaremos por tokens
        starterCode:
`x <- 0
Si x > 0 Entonces
  Escribir "positivo"
Sino
  Escribir "negativo"
FinSi
`,
        testsJson: JSON.stringify({ type: "contains", tokens: ["x <- 0", "Si", "Sino", "FinSi"] }),
        lessonId: l1.id,
      },
      {
        slug: "reto-2-python",
        title: "Reto 2: Python a la vista",
        description:
          "Usa Python para pedir un número (o define x) y muestra 'par' o 'impar'.",
        language: "python",
        starterCode:
`x = 4
if x % 2 == 0:
    print("par")
else:
    print("impar")
`,
        testsJson: JSON.stringify({ type: "contains", tokens: ["print(", "if", "else"] }),
        lessonId: l2.id,
      },
      {
        slug: "reto-3-java",
        title: "Reto 3: Java al mando",
        description:
          "Imprime 'Hola Java' y usa un if para imprimir 'OK' si x > 0.",
        language: "java",
        starterCode:
`public class Main {
  public static void main(String[] args) {
    int x = 1;
    System.out.println("Hola Java");
    if (x > 0) {
      System.out.println("OK");
    } else {
      System.out.println("NO");
    }
  }
}
`,
        testsJson: JSON.stringify({ type: "contains", tokens: ["System.out.println", "if (x > 0)"] }),
        lessonId: l3.id,
      },
      {
        slug: "reto-4-pseint",
        title: "Reto 4: PSeInt en marcha",
        description:
          "Pide/define x y usa Si/Sino para imprimir mensaje personalizado.",
        language: "pseint",
        starterCode:
`x <- 5
Si x >= 5 Entonces
  Escribir "alto"
Sino
  Escribir "bajo"
FinSi
`,
        testsJson: JSON.stringify({ type: "contains", tokens: ["FinSi"] }),
        lessonId: l4.id,
      },
      {
        slug: "reto-5-flujo",
        title: "Reto 5: Fluye como el agua",
        description:
          "Convierte un diagrama simple en código (cualquier lenguaje de los 3).",
        language: "python",
        starterCode:
`# Esboza aquí tu solución basándote en el diagrama
x = 0
if x == 0:
    print("inicio")
print("fin")
`,
        testsJson: JSON.stringify({ type: "contains", tokens: ["print"] }),
        lessonId: l5.id,
      },
    ],
  });

  console.log("✅ Seed Sprint 6 listo: 5 lecciones + 5 retos.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
