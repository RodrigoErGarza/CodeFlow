// app/aprendizaje/page.tsx
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type LessonListItem = {
  id: string;
  number: number;
  slug: string;
  title: string;
  description: string;
};

export default function AprendizajePage() {
  const [lessons, setLessons] = useState<LessonListItem[]>([]);
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const [lRes, pRes] = await Promise.all([
        fetch("/api/lessons", { cache: "no-store" }),
        fetch("/api/progress/summary", { cache: "no-store" }),
      ]);
      const lData = await lRes.json();
      const pData = await pRes.json();
      setLessons(lData.items || []);
      setCompleted(new Set(pData.completedLessonIds || []));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Aprendizaje</h1>
        <button
          onClick={load}
          className="px-3 py-2 rounded border border-white/10 bg-white/10 hover:bg-white/20"
        >
          Actualizar
        </button>
      </div>

      {loading && <div className="opacity-70 text-sm">Cargando…</div>}

      <div className="grid gap-3 md:grid-cols-2">
        {lessons.map((l) => {
          const done = completed.has(l.id);
          return (
            <Link
              key={l.id}
              href={`/aprendizaje/${l.slug}`}
              className="block rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 p-4"
            >
              <div className="flex items-center justify-between">
                <div className="text-sm opacity-70">Lección {l.number}</div>
                <span
                  className={`text-xs px-2 py-1 rounded ${
                    done ? "bg-emerald-500/20 text-emerald-300" : "bg-white/10"
                  }`}
                >
                  {done ? "Completada" : "Pendiente"}
                </span>
              </div>
              <div className="mt-1 font-medium">{l.title}</div>
              <p className="mt-1 text-sm opacity-80 line-clamp-2">
                {l.description}
              </p>
            </Link>
          );
        })}
      </div>

      {!loading && lessons.length === 0 && (
        <div className="opacity-70 text-sm">No hay lecciones por ahora.</div>
      )}
    </div>
  );
}
