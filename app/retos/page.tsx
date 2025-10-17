// app/retos/page.tsx
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type ChallengeItem = {
  slug: string;
  title: string;
  language: "python" | "java" | "pseint";
  lessonId: string;
};

export default function RetosPage() {
  const [challenges, setChallenges] = useState<ChallengeItem[]>([]);
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const [cRes, pRes] = await Promise.all([
        fetch("/api/challenges", { cache: "no-store" }),
        fetch("/api/progress/summary", { cache: "no-store" }),
      ]);
      const cData = await cRes.json();
      const pData = await pRes.json();
      setChallenges(cData.items || []);
      setCompleted(new Set(pData.completedLessonIds || []));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const grouped = useMemo(() => {
    return challenges.reduce((acc: Record<string, ChallengeItem[]>, ch) => {
      const key = ch.language;
      (acc[key] ||= []).push(ch);
      return acc;
    }, {});
  }, [challenges]);

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Retos</h1>
        <button
          onClick={load}
          className="px-3 py-2 rounded border border-white/10 bg-white/10 hover:bg-white/20"
        >
          Actualizar
        </button>
      </div>

      {loading && <div className="opacity-70 text-sm">Cargando…</div>}

      {Object.keys(grouped).length === 0 && !loading && (
        <div className="opacity-70 text-sm">Aún no hay retos.</div>
      )}

      <div className="space-y-6">
        {Object.entries(grouped).map(([language, items]) => (
          <div key={language} className="space-y-2">
            <div className="text-sm opacity-70 uppercase tracking-wide">
              {language}
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {items.map((ch) => {
                const unlocked = completed.has(ch.lessonId); // ← habilita si la lección asociada está completa
                return (
                  <div
                    key={ch.slug}
                    className={`rounded-xl border border-white/10 p-4 ${
                      unlocked ? "bg-white/5 hover:bg-white/10" : "bg-black/30"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-medium">{ch.title}</div>
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          unlocked
                            ? "bg-indigo-500/20 text-indigo-300"
                            : "bg-white/10"
                        }`}
                      >
                        {unlocked ? "Disponible" : "Bloqueado"}
                      </span>
                    </div>
                    <div className="mt-2 flex gap-2">
                      {unlocked ? (
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
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
