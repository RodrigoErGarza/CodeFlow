// app/aprendizaje/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Sidebar from "@/app/components/Sidebar";
import { Check, ChevronRight, X } from "lucide-react";

type LessonListItem = {
  id: string;
  number: number; // 1..5
  slug: string;
  title: string;
  description: string;
};

type ProgressSummary = {
  completedUnitIds: string[];
  percents: Array<{ unitId: string; slug: string; percent: number }>;
};


type UnitInfo = { percent: number };

export default function AprendizajePage() {
  // ---- estado base ----
  const [lessons, setLessons] = useState<LessonListItem[]>([]);
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  // % cacheado por unidad (clave: slug)
  const [unitInfo, setUnitInfo] = useState<Record<string, UnitInfo>>({});

  const router = useRouter();
  const pathname = usePathname(); // /aprendizaje
  const search = useSearchParams();
  const openSlug = search.get("u"); // unidad/lección abierta en slide-over

  const openLesson = useMemo(
    () => lessons.find((l) => l.slug === openSlug) || null,
    [openSlug, lessons]
  );

  // ---- cargar listado + resumen completadas ----
  async function load() {
    setLoading(true);
    try {
      const [lRes, pRes] = await Promise.all([
        fetch("/api/lessons", { cache: "no-store" }),
        fetch("/api/progress/summary", { cache: "no-store" }),
      ]);
      const lData = await lRes.json();
      const pData: ProgressSummary = await pRes.json();
      setLessons(lData.items || []);
      setCompleted(new Set(pData.completedUnitIds || []));
      const nextUnitInfo: Record<string, { percent: number }> = {};
      for (const p of pData.percents || []) {
        nextUnitInfo[p.slug] = { percent: p.percent ?? 0 };
      }
      setUnitInfo(nextUnitInfo);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  // ---- cuando hay un slide-over abierto, trae su % ----
  useEffect(() => {
    if (!openSlug || typeof openSlug !== "string") return;

    let alive = true;
    (async () => {
      try {
        const r = await fetch(`/api/units/${openSlug}`, { cache: "no-store" });
        const d = await r.json();
        if (!alive) return;
        setUnitInfo((prev) => ({
          ...prev,
          [openSlug]: { percent: Number(d?.percent ?? 0) },
        }));
      } catch {
        // ignora
      }
    })();

    return () => {
      alive = false;
    };
  }, [openSlug]);

  // ---- progreso global (conteo de lecciones completas) ----
  // ⬇️ Reemplaza tu useMemo de progressPct por este
  const progressPct = useMemo(() => {
    if (!lessons.length) return 0;
    let done = 0;
    for (const l of lessons) {
      const p = unitInfo[l.slug]?.percent ?? 0;
      if (p >= 100 || completed.has(l.id)) done++;
    }
    return Math.round((done / lessons.length) * 100);
  }, [lessons, unitInfo, completed]);

  // ⬇️ NUEVO: trae el % de TODAS las unidades para que las tarjetas muestren "Completada" sin abrir la unidad
  useEffect(() => {
    if (!lessons.length) return;

    let canceled = false;

    async function fetchPercents() {
      try {
        const pairs = await Promise.all(
          lessons.map(async (l) => {
            try {
              const r = await fetch(`/api/units/${l.slug}`, { cache: "no-store" });
              const d = await r.json();
              return [l.slug, Number(d?.percent ?? 0)] as const;
            } catch {
              return [l.slug, 0] as const;
            }
          })
        );

        if (canceled) return;
        setUnitInfo((prev) => {
          const next = { ...prev };
          for (const [slug, percent] of pairs) next[slug] = { percent };
          return next;
        });
      } catch {
        /* ignore */
      }
    }

    fetchPercents();

    // refresca cuando vuelves a la pestaña/ventana
    function onFocus() { fetchPercents(); }
    function onVisible() { if (document.visibilityState === "visible") fetchPercents(); }

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      canceled = true;
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [lessons]);



  // ---- navegación slide-over ----
  function pushOpen(slug: string) {
    const sp = new URLSearchParams(search?.toString());
    sp.set("u", slug);
    router.replace(`${pathname}?${sp.toString()}`);
  }
  function closeDrawer() {
    const sp = new URLSearchParams(search?.toString());
    sp.delete("u");
    router.replace(`${pathname}${sp.size ? `?${sp.toString()}` : ""}`);
  }

  // ---- marcar lección como completada (badge de la lista) ----
  async function markCompleted(lessonId: string) {
    try {
      setCompleted((prev) => new Set(prev).add(lessonId)); // optimista
      await fetch("/api/progress/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonId }),
      });
    } catch {
      await load(); // revert simple si falla
    }
  }

  // ---- CTA según % ----
  function actionFor(percent: number) {
    if (percent >= 100)
      return {
        text: "Terminada",
        style: "bg-emerald-600/20 text-emerald-300",
        href: false as const,
      };
    if (percent <= 0)
      return { text: "Iniciar", style: "bg-indigo-600 text-white", href: true as const };
    return { text: "Continuar", style: "bg-indigo-600 text-white", href: true as const };
  }

  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 p-6 space-y-5">
        {/* Encabezado + acciones */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Mi ruta de aprendizaje</h1>
          <div className="flex items-center gap-2">
            <div className="text-sm opacity-80">Progreso</div>
            <div className="w-40 h-2 rounded bg-white/10 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-400 to-blue-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <span className="text-sm opacity-80">{progressPct}%</span>
          </div>
        </div>

        {/* Buscador sencillo */}
        <div className="flex items-center gap-2">
          <input
            placeholder="Buscar unidad o tema…"
            className="w-full max-w-xl px-3 py-2 rounded border border-white/10 bg-white/5"
          />
        </div>

        {/* Grid de Unidades */}
        {loading && <div className="opacity-70 text-sm">Cargando…</div>}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {lessons.map((l) => {
            const percentForCard = unitInfo[l.slug]?.percent ?? 0;
            const done = percentForCard >= 100 || completed.has(l.id);

            return (
              <button
                key={l.id}
                onClick={() => pushOpen(l.slug)}
                className="text-left rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition p-4 group"
              >
                <div className="text-sm opacity-70 mb-2">Unidad {l.number}</div>

                <div className="h-24 flex items-center justify-center rounded-xl bg-black/20 border border-white/10">
                  <div className="text-4xl">🧩</div>
                </div>

                <div className="mt-3 font-medium line-clamp-2">{l.title}</div>
                <p className="mt-1 text-sm opacity-80 line-clamp-2">{l.description}</p>

                {/* barra de % en la tarjeta */}
                <div className="mt-3">
                  <div className="w-full h-1.5 rounded bg-white/10 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-400 to-blue-500"
                      style={{ width: `${percentForCard}%` }}
                    />
                  </div>
                  <div className="mt-1 text-xs opacity-70">{percentForCard}%</div>
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      done ? "bg-emerald-500/20 text-emerald-300" : "bg-white/10"
                    }`}
                  >
                    {done ? "Completada" : "Pendiente"}
                  </span>
                  <ChevronRight size={16} className="opacity-60 group-hover:opacity-100" />
                </div>
              </button>
            );
          })}
        </div>

        {!loading && lessons.length === 0 && (
          <div className="opacity-70 text-sm">No hay lecciones por ahora.</div>
        )}
      </main>

      {/* Slide-over: detalle de la lección */}
      {/* Slide-over: detalle de la lección */}
<div
  className={`fixed top-0 right-0 h-screen w-full max-w-3xl bg-[#0B0F19] border-l border-white/10 transition-transform duration-300 z-50 ${openLesson ? "translate-x-0" : "translate-x-full"}`}
  aria-hidden={!openLesson}
>
  {/* Header */}
  <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
    <div className="min-w-0">
      <div className="text-sm opacity-70">Aprendizaje</div>
      <div className="text-lg font-semibold truncate">
        {openLesson ? `Unidad ${openLesson.number}: ${openLesson.title}` : ""}
      </div>

      {/* Progreso de esta unidad */}
      {openLesson && (
        <div className="mt-2 flex items-center gap-3">
          <div className="flex-1 h-2 rounded bg-white/10 overflow-hidden">
            <div
              className="h-full bg-cyan-400"
              style={{ width: `${unitInfo[openLesson.slug]?.percent ?? 0}%` }}
            />
          </div>
          <div className="text-sm opacity-80">
            {unitInfo[openLesson.slug]?.percent ?? 0}%
          </div>

          {/* CTA según % */}
          {(() => {
            const p = unitInfo[openLesson.slug]?.percent ?? 0;
            const action = actionFor(p);
            return action.href ? (
              <a
                href={`/aprendizaje/${openLesson.slug}`}
                className={`px-3 py-2 rounded ${action.style}`}
              >
                {action.text}
              </a>
            ) : (
              <button className={`px-3 py-2 rounded ${action.style}`} disabled>
                {action.text}
              </button>
            );
          })()}
        </div>
      )}
    </div>

    <button
      onClick={closeDrawer}
      className="p-2 rounded hover:bg-white/10"
      aria-label="Cerrar"
    >
      <X size={18} />
    </button>
  </div>

  {/* Body */}
  {openLesson && (
    <div className="grid grid-cols-12 gap-4 p-5">
      {/* Contenido principal */}
      <section className="col-span-12 lg:col-span-8 space-y-4">
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="text-sm opacity-70 mb-2">Introducción</div>
          <div className="font-medium mb-2">{openLesson.title}</div>
          <p className="opacity-90 leading-relaxed">{openLesson.description}</p>
        </div>

        {/* Acciones */}
        <div className="flex items-center gap-2">
          {completed.has(openLesson.id) ? (
            <span className="inline-flex items-center gap-1 text-emerald-300 text-sm">
              <Check size={16} /> Lección completada
            </span>
          ) : (
            <button
              onClick={() => markCompleted(openLesson.id)}
              className="px-3 py-2 rounded bg-gradient-to-r from-emerald-500 to-green-500 text-black font-medium"
            >
              Marcar como completada
            </button>
          )}
        </div>

        
      </section>

      {/* Índice / Lecciones de la unidad */}
      <aside className="col-span-12 lg:col-span-4 space-y-3">
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="text-sm opacity-70 mb-2">Lecciones</div>
          <div className="space-y-2">
            {lessons.map((l) => (
              <button
                key={l.id}
                onClick={() => pushOpen(l.slug)}
                className={`w-full text-left px-3 py-2 rounded border ${
                  l.slug === openLesson.slug
                    ? "border-cyan-400/40 bg-cyan-500/10"
                    : "border-white/10 hover:bg-white/10"
                }`}
              >
                <div className="text-xs opacity-70 mb-0.5">Unidad {l.number}</div>
                <div className="text-sm">{l.title}</div>
              </button>
            ))}
          </div>
        </div>
      </aside>
    </div>
  )}
</div>    
</div>
  );
}
