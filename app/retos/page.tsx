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
  testsJson?: string | null;
};

type LessonListItem = {
  id: string;
  number: number;
  slug: string;
  title: string;
  description: string;
};

type SummaryBySlug = Record<
  string,
  {
    lastStatus: "PENDING" | "PASSED" | "FAILED";
    isCorrect: boolean;
    updatedAt: string;
    tries: number;
  }
>;
type SummaryPayload = {
  bySlug: SummaryBySlug;
  completedCount: number;
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
function MedallasSection() {
  const [medals, setMedals] = useState<
    { unit: string; percent: number; completed: boolean }[]
  >([]);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/progress/medals", { cache: "no-store" });
        const d = await r.json();
        setMedals(d.medals || []);
      } catch {
        setMedals([]);
      }
    })();
  }, []);

  if (!medals.length) return null;

  return (
    <div className="flex flex-wrap gap-3">
      {medals.map((m, i) => (
        <div
          key={i}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 ${
            m.completed ? "bg-emerald-500/10" : "bg-white/5"
          }`}
        >
          <span className="font-medium text-sm">
            {m.unit.replace("unidad", "Unidad ")}
          </span>
          <span
            className={`text-xs px-2 py-1 rounded ${
              m.completed
                ? "bg-emerald-500/20 text-emerald-300"
                : "bg-white/10 text-white/70"
            }`}
          >
            {Math.round(m.percent)}%
          </span>
          {m.completed && (
            <span className="text-emerald-400 text-lg">🏅</span>
          )}
        </div>
      ))}
    </div>
  );
}


export default function RetosPage() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [items, setItems] = useState<Challenge[]>([]);
  const [perUnitPercent, setPerUnitPercent] = useState<Record<string, number>>({});
  const [summary, setSummary] = useState<SummaryPayload>({ bySlug: {}, completedCount: 0 });

  // *** función única de carga ***
  async function load(aliveRef: { current: boolean }) {
    setLoading(true);
    setErr(null);
    try {
      // 1) Retos y unidades
      const [cRes, lRes] = await Promise.all([
        fetch("/api/challenges", { cache: "no-store" }),
        fetch("/api/lessons", { cache: "no-store" }),
      ]);
      if (!cRes.ok) throw new Error("No se pudo cargar /api/challenges");
      if (!lRes.ok) throw new Error("No se pudo cargar /api/lessons");

      const challenges: Challenge[] = await cRes.json();
      const lessonsPayload = await lRes.json();
      const lessons: LessonListItem[] = lessonsPayload?.items ?? [];

      if (!aliveRef.current) return;
      setItems(challenges);

      // 2) Intento: /api/progress/units-summary
      let per: Record<string, number> = {};
      try {
        const uRes = await fetch("/api/progress/units-summary", { cache: "no-store" });
        if (uRes.ok) {
          const raw = await uRes.json();
          per = normalizeUnitsSummary(raw);
        }
      } catch {}

      // 3) Fallback % por unidad
      if (Object.keys(per).length === 0) {
        const numToSlug = new Map<number, string>(lessons.map((l) => [l.number, l.slug]));
        const reqNums = new Set<number>();
        for (const c of challenges) {
          const meta = safeParse<{ meta?: { requiresUnitNumber?: number } }>(c.testsJson);
          const req = meta?.meta?.requiresUnitNumber;
          if (req && typeof req === "number") reqNums.add(req);
        }
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
              } catch { tmp[String(n)] = 0; }
            })()
          );
        }
        await Promise.all(fetches);
        per = tmp;
      }
      if (!aliveRef.current) return;
      setPerUnitPercent(per);

      // 4) Resumen de intentos
      try {
        const sRes = await fetch("/api/challenges/summary", { cache: "no-store" });
        if (sRes.ok) {
          const sJson: SummaryPayload = await sRes.json();
          if (!aliveRef.current) return;
          setSummary(sJson);
        } else {
          setSummary({ bySlug: {}, completedCount: 0 });
        }
      } catch {
        setSummary({ bySlug: {}, completedCount: 0 });
      }
    } catch (e: any) {
      if (!aliveRef.current) return;
      setErr(e?.message ?? "Error al cargar retos");
    } finally {
      if (aliveRef.current) setLoading(false);
    }
  }

  useEffect(() => {
    const alive = { current: true };

    // carga inicial
    load(alive);

    // re-cargar cuando la ventana recupera foco o pestaña vuelve visible
    const refetch = () => load(alive);
    window.addEventListener("focus", refetch);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") refetch();
    });

    return () => {
      alive.current = false;
      window.removeEventListener("focus", refetch);
      // no hace falta quitar visibilitychange anónimo; mantenemos solo refetch en focus
    };
  }, []);

  const cards = useMemo(() => {
    const per = perUnitPercent || {};
    const bySlug = summary.bySlug || {};

    return items.map((c) => {
      const meta = safeParse<{ meta?: { requiresUnitNumber?: number } }>(c.testsJson ?? null);
      const req = meta?.meta?.requiresUnitNumber ?? null;

      const requiredPct = req ? (per[String(req)] ?? 0) : 100;
      const unlocked = requiredPct >= 100;

      const reqText = req ? `Requiere: Unidad ${req}` : "Libre";
      const percentText = req ? `${requiredPct}% de la unidad` : undefined;

      const s = bySlug[c.slug];
      const passed = !!s && (s.lastStatus === "PASSED" || s.isCorrect);

      return { ...c, req, unlocked, reqText, percentText, passed };
    });
  }, [items, perUnitPercent, summary]);

  const total = items.length;
  const completed = useMemo(() => cards.filter((c) => c.passed).length, [cards]);

  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 p-6">
        <div className="flex flex-col gap-4 mb-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-semibold">Retos de Programación</h1>
          <div className="text-sm opacity-80">Completados: {completed} / {total}</div>
        </div>

        {/* Medallas por unidad */}
        <MedallasSection />
      </div>

        {loading && <div className="opacity-70">Cargando…</div>}
        {!loading && err && <div className="text-red-400">{err}</div>}
        {!loading && !err && cards.length === 0 && <div className="opacity-70">No hay retos por ahora.</div>}

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

                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        c.unlocked ? "bg-emerald-500/20 text-emerald-300" : "bg-white/10"
                      }`}
                    >
                      {c.unlocked ? "Desbloqueado" : "Bloqueado"}
                    </span>
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        c.passed ? "bg-emerald-600/20 text-emerald-300" : "bg-white/10"
                      }`}
                    >
                      Estado: {c.passed ? "Aprobado" : "Pendiente"}
                    </span>
                  </div>

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
