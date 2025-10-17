// app/api/challenges/[slug]/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Devuelve un reto por slug con toda la info necesaria para renderizarlo.
 * Campos mínimos que usamos en el front:
 *  - slug, title, description, language, starterCode, lessonId
 *  - tests.expectedTokens: string[]     (validador simple)
 *  - tests.tip?: string                 (opcional)
 */
export async function GET(
  _req: Request,
  { params }: { params: { slug: string } }
) {
  const { slug } = params;

  // En producción esto viene de la base de datos
  // 👇 Ejemplo "seed" fallback por si aún no tienes datos en Challenge
  const fallback: any = {
    slug,
    title:
      slug === "reto-1-logica"
        ? "Reto 1: Lógica de programación"
        : slug === "reto-2-python"
        ? "Reto 2: Sumérgete en Python"
        : "Reto de ejemplo",
    description:
      "Escribe una solución que cumpla con lo pedido. Este validador buscará ciertos **tokens** en tu código.",
    language:
      slug === "reto-2-python" ? "python" : slug.includes("java") ? "java" : "pseint",
    starterCode:
      slug === "reto-2-python"
        ? `# Escribe una función saludar(nombre) que retorne "Hola, <nombre>!"
def saludar(nombre: str) -> str:
    # tu código aquí
    return ""
`
        : slug.includes("java")
        ? `public class Main {
  public static void main(String[] args) {
    // TODO: imprime "Hola Mundo"
  }
}
`
        : `Algoritmo HolaMundo
  // TODO: escribe "Hola Mundo"
FinAlgoritmo
`,
    tests: {
      expectedTokens:
        slug === "reto-2-python"
          ? ["def saludar", "return", "Hola"]
          : slug.includes("java")
          ? ["System.out.println", "Hola Mundo"]
          : ["Escribir", "Hola Mundo"],
      tip:
        "No es un compilador real: el validador solo comprueba que aparezcan ciertos tokens clave.",
    },
    lessonId:
      slug === "reto-1-logica"
        ? "l1"
        : slug === "reto-2-python"
        ? "l2"
        : "lX",
  };

  // Intenta BD primero; si no hay, usa fallback
  const fromDb = await prisma.challenge.findUnique({
    where: { slug },
  }).catch(() => null);

  const item =
    fromDb ??
    fallback;

  return NextResponse.json({ item });
}
