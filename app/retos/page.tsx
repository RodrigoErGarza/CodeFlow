// app/retos/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Sidebar from "@/app/components/Sidebar";

type ChallengeItem = {
  slug: string;
  title: string;
  language: "python" | "java" | "pseint";
  lessonId: string; // se habilita si esa lección está completa
};

type ProgressSummary = {
  completedLessonIds: string[];
};

type Tab = "all" | "available" | "locked";

export default function RetosPage() {
  const [challenges, setChallenges] = useState<ChallengeItem[]>([]);
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("all");

  async function load() {
    setLoading(true);
    try {
      const [cRes, pRes] = await Promise.all([
        fetch("/api/challenges", { cache: "no-store" }),
        fetch("/api/progress/summary", { cache: "no-store" }),
      ]);
      const cData = await cRes.json();
      const pData: ProgressSummary = await pRes.json();
      setChallenges(cData.items || []);
      setCompletedLessons(new Set(pData.completedLessonIds || []));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const decorated = useMemo(() => {
    return challenges.map((ch) => ({
      ...ch,
      unlocked: completedLessons.has(ch.lessonId),
    }));
  }, [challenges, completedLessons]);

  const filtered = useMemo(() => {
    if (tab === "available") return decorated.filter((c) => c.unlocked);
    if (tab === "locked") return decorated.filter((c) => !c.unlocked);
    return decorated;
  }, [decorated, tab]);

  const groupedByLanguage = useMemo(() => {
    return filtered.reduce((acc: Record<string, typeof filtered>, ch) => {
      (acc[ch.language] ||= []).push(ch);
      return acc;
    }, {});
  }, [filtered]);

  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Retos de Programación</h1>
          <button
            onClick={load}
            className="px-3 py-2 rounded border border-white/10 bg-white/10 hover:bg-white/20"
          >
            Actualizar
          </button>
        </div>

        {/* Filtros (tabs) */}
        <div className="flex gap-2">
          {(
            [
              ["all", "Todos"],
              ["available", "Disponibles"],
              ["locked", "Bloqueados"],
            ] as [Tab, string][]
          ).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`px-3 py-1 rounded border ${
                tab === key
                  ? "border-cyan-400/40 bg-cyan-500/10"
                  : "border-white/10 hover:bg-white/10"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {loading && <div className="opacity-70 text-sm">Cargando…</div>}
        {!loading && filtered.length === 0 && (
          <div className="opacity-70 text-sm">No hay retos para este filtro.</div>
        )}

        {/* Grupos por lenguaje */}
        <div className="space-y-8">
          {Object.entries(groupedByLanguage).map(([language, items]) => (
            <section key={language} className="space-y-3">
              <div className="text-sm opacity-70 uppercase tracking-wide">
                {language}
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {items.map((ch) => (
                  <div
                    key={ch.slug}
                    className={`rounded-2xl border p-4 transition ${
                      ch.unlocked
                        ? "border-white/10 bg-white/5 hover:bg-white/10"
                        : "border-white/5 bg-black/30"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-xs opacity-70 mb-1">Reto</div>
                        <div className="font-medium">{ch.title}</div>
                      </div>
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          ch.unlocked
                            ? "bg-emerald-500/20 text-emerald-300"
                            : "bg-white/10"
                        }`}
                      >
                        {ch.unlocked ? "Disponible" : "Bloqueado"}
                      </span>
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      {/* mini “ring” de estado (placeholder) */}
                      <div className="w-10 h-10 rounded-full border-2 border-white/15 grid place-items-center">
                        <span className="text-xs opacity-70">1</span>
                      </div>

                      <div className="flex gap-2">
                        {ch.unlocked ? (
                          <Link
                            href={`/retos/${ch.slug}`}
                            className="px-3 py-1 rounded border border-white/10 bg-white/10 hover:bg-white/20 text-sm"
                          >
                            Abrir
                          </Link>
                        ) : (
                          <button
                            disabled
                            className="px-3 py-1 rounded border border-white/10 bg-white/10 opacity-60 text-sm"
                            title="Completa la lección relacionada para desbloquear"
                          >
                            Bloqueado
                          </button>
                        )}
                        <Link
                          href="/aprendizaje"
                          className="px-3 py-1 rounded border border-white/10 bg-white/10 hover:bg-white/20 text-sm"
                        >
                          Ir a lecciones
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </main>
    </div>
  );
}
