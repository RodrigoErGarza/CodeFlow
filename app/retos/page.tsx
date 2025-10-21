// app/retos/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Sidebar from "@/app/components/Sidebar";
import Link from "next/link";

type Challenge = {
  id: string;
  slug: string;
  title: string;
  description: string;
  language: string;
  starterCode?: string | null;
  testsJson?: string | null; // aquí viene el meta.requiresUnitNumber
};

type LessonListItem = {
  id: string;
  number: number; // 1..5
  slug: string;
  title: string;
  description: string;
};

// ⬇️ NUEVO: tipos para el summary de retos por usuario
type ChallengeSummary = {
  bySlug: Record<string, {
    lastStatus: "PENDING" | "PASSED" | "FAILED";
    lastScore: number;
    attempts: number;
    updatedAt: string;
  }>;
  totals: { completed: number; total: number };
};

function normalizeUnitsSummary(d: any): Record<string, number> {
  if (!d) return {};
  if (d.perUnitPercent && typeof d.perUnitPercent === "object") {
    return d.perUnitPercent as Record<string, number>;
  }
  if (d.byUnitNumber && typeof d.byUnitNumber === "object") {
    const out: Record<string, number> = {};
    for (const [k, v] of Object.entries(d.byUnitNumber)) {
      out[String(k)] = Number(v) || 0;
    }
    return out;
  }
  return {};
}

function safeParse<T = any>(s: string | null | undefined): T | null {
  if (!s) return null;
  try { return JSON.parse(s) as T; } catch { return null; }
}

export default function RetosPage() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [items, setItems] = useState<Challenge[]>([]);
  const [perUnitPercent, setPerUnitPercent] = useState<Record<string, number>>({});
  // ⬇️ NUEVO: summary local
  const [summary, setSummary] = useState<ChallengeSummary | null>(null);

  useEffect(() => {
    let alive = true;

    (async () => {
      setLoading(true);
      setErr(null);
      try {
        // 1) Retos y unidades (para mapear number -> slug)
        const [cRes, lRes, sRes] = await Promise.all([
          fetch("/api/challenges", { cache: "no-store" }),
          fetch("/api/lessons", { cache: "no-store" }),
          fetch("/api/challenges/summary", { cache: "no-store" }), // ⬅️ NUEVO
        ]);
        if (!cRes.ok) throw new Error("No se pudo cargar /api/challenges");
        if (!lRes.ok) throw new Error("No se pudo cargar /api/lessons");

        // summary es opcional: si falla, no rompemos UI
        let challengeSummary: ChallengeSummary | null = null;
        if (sRes.ok) {
          challengeSummary = await sRes.json();
        }

        const challenges: Challenge[] = await cRes.json();
        const lessonsPayload = await lRes.json();
        const lessons: LessonListItem[] = lessonsPayload?.items ?? [];

        if (!alive) return;
        setItems(challenges);
        setSummary(challengeSummary);

        // 2) Intento A: /api/progress/units-summary (si existe/funciona)
        let per: Record<string, number> = {};
        try {
          const uRes = await fetch("/api/progress/units-summary", { cache: "no-store" });
          if (uRes.ok) {
            const raw = await uRes.json();
            per = normalizeUnitsSummary(raw);
          }
        } catch {
          // ignoramos; pasamos a fallback
        }

        // 3) Fallback: pedir % real por slug usando /api/units/[slug]
        //    — solo para las unidades que realmente piden los retos.
        if (Object.keys(per).length === 0) {
          const numToSlug = new Map<number, string>(
            lessons.map((l) => [l.number, l.slug])
          );

          // set de números de unidad requeridos por los retos
          const reqNums = new Set<number>();
          for (const c of challenges) {
            const meta = safeParse<{ meta?: { requiresUnitNumber?: number } }>(c.testsJson);
            const req = meta?.meta?.requiresUnitNumber;
            if (req && typeof req === "number") reqNums.add(req);
          }

          // si no hubo ninguno, no hay nada que desbloquear por % (todos libres)
          const fetches: Array<Promise<void>> = [];
          const tmp: Record<string, number> = {};

          for (const n of reqNums) {
            const slug = numToSlug.get(n);
            if (!slug) { tmp[String(n)] = 0; continue; }

            fetches.push(
              (async () => {
                try {
                  const r = await fetch(`/api/units/${slug}`, { cache: "no-store" });
                  if (r.ok) {
                    const d = await r.json();
                    tmp[String(n)] = Number(d?.percent ?? 0) || 0;
                  } else {
                    tmp[String(n)] = 0;
                  }
                } catch {
                  tmp[String(n)] = 0;
                }
              })()
            );
          }
          await Promise.all(fetches);
          per = tmp;
        }

        if (!alive) return;
        setPerUnitPercent(per);
      } catch (e: any) {
        if (!alive) return;
        setErr(e?.message ?? "Error al cargar retos");
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => { alive = false; };
  }, []);

  const cards = useMemo(() => {
    const per = perUnitPercent || {};
    const s = summary?.bySlug || {};
    return items.map((c) => {
      const meta = safeParse<{ meta?: { requiresUnitNumber?: number } }>(c.testsJson ?? null);
      const req = meta?.meta?.requiresUnitNumber ?? null;

      const requiredPct = req ? (per[String(req)] ?? 0) : 100;
      const unlocked = requiredPct >= 100;

      const reqText = req ? `Requiere: Unidad ${req}` : "Libre";
      const percentText = req ? `${requiredPct}% de la unidad` : undefined;

      // ⬇️ NUEVO: estado por reto (si existe)
      const st = s[c.slug];
      const lastStatus = st?.lastStatus ?? "PENDING";
      const lastScore = st?.lastScore ?? null;

      return { ...c, req, unlocked, reqText, percentText, lastStatus, lastScore };
    });
  }, [items, perUnitPercent, summary]);

  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 p-6">
        <h1 className="text-3xl font-semibold mb-2">Retos de Programación</h1>

        {/* ⬇️ NUEVO: contador de completados */}
        {summary?.totals && (
          <div className="text-sm opacity-80 mb-4">
            Completados: {summary.totals.completed} / {summary.totals.total}
          </div>
        )}

        {loading && <div className="opacity-70">Cargando…</div>}
        {!loading && err && <div className="text-red-400">{err}</div>}
        {!loading && !err && cards.length === 0 && (
          <div className="opacity-70">No hay retos por ahora.</div>
        )}

        {!loading && !err && cards.length > 0 && (
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {cards.map((c) => (
              <div key={c.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="text-sm opacity-70 mb-2 flex items-center justify-between">
                  <span>{c.reqText}</span>
                  {c.percentText && <span className="opacity-60">{c.percentText}</span>}
                </div>

                <div className="text-lg font-medium mb-1 line-clamp-2">{c.title}</div>
                <p className="text-sm opacity-85 line-clamp-3">{c.description}</p>

                {/* ⬇️ NUEVO: estado/puntaje (no interfiere con desbloqueo) */}
                <div className="mt-1 text-xs opacity-70">
                  {c.lastScore !== null && <span className="mr-2">Último puntaje: {c.lastScore}%</span>}
                  <span>
                    Estado: {c.lastStatus === "PASSED" ? "Aprobado" : c.lastStatus === "FAILED" ? "Con errores" : "Pendiente"}
                  </span>
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      c.unlocked ? "bg-emerald-500/20 text-emerald-300" : "bg-white/10"
                    }`}
                  >
                    {c.unlocked ? "Desbloqueado" : "Bloqueado"}
                  </span>

                  {c.unlocked ? (
                    <Link href={`/retos/${c.slug}`} className="px-3 py-1.5 rounded bg-indigo-600 text-white text-sm">
                      Abrir
                    </Link>
                  ) : (
                    <button disabled className="px-3 py-1.5 rounded bg-white/10 text-sm opacity-60 cursor-not-allowed">
                      Abrir
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
