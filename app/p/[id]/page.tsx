// app/p/[id]/page.tsx
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import FlowCanvas, { type FlowGraph } from "@/app/components/FlowCanvas";
import { layoutWithELK } from "@/lib/elk";
import Link from "next/link";
import { getParams, type Ctx } from "@/lib/route";

/**
 * Vista pública del DIAGRAMA de un snippet (solo lectura)
 * Ruta: /p/:id
 *
 * Requisitos:
 * - El snippet debe tener isPublic = true.
 * - NEXTAUTH_URL configurado para SSR si lo necesitas en local.
 */
export default async function PublicDiagramPage(ctx: Ctx<{ id: string }>) {
  // Next 15: params es una Promise
  const { id } = await getParams(ctx);

  // 1) Traer snippet público (código + lenguaje)
  const snippet = await prisma.snippet.findFirst({
    where: { id, isPublic: true, deletedAt: null },
    select: { id: true, title: true, language: true, code: true, updatedAt: true },
  });
  if (!snippet) return notFound();

  // 2) Compilar a grafo usando tu API interna
  const base = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const res = await fetch(`${base}/api/flow/compile`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ language: snippet.language, code: snippet.code }),
    cache: "no-store",
  });

  if (!res.ok) return notFound();
  const graph = (await res.json()) as FlowGraph;

  // 3) Auto-layout (vertical) para que se vea ordenado
  const laid = await layoutWithELK(graph, { direction: "DOWN" });

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{snippet.title}</h1>
        <div className="flex gap-4 text-sm">
          {/* Link para ver el CÓDIGO público del mismo snippet */}
          <Link href={`/s/${snippet.id}`} className="underline opacity-90 hover:opacity-100">
            Ver código
          </Link>
          <Link href="/" className="underline opacity-70 hover:opacity-100">
            Ir a CodeFlow
          </Link>
        </div>
      </div>

      <div className="rounded-xl border border-white/10 overflow-hidden">
        {/* Diagrama en modo lectura */}
        <FlowCanvas graph={laid} />
      </div>

      <p className="text-xs opacity-60">
        Última actualización: {new Date(snippet.updatedAt).toLocaleString()}
      </p>
    </div>
  );
}
