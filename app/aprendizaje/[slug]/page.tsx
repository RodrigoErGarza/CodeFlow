// app/aprendizaje/[slug]/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type LessonDetail = {
  id: string;
  number: number;
  slug: string;
  title: string;
  description: string;
  content: string;
  challenges: { slug: string; title: string }[];
};

export default function LessonDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const [lesson, setLesson] = useState<LessonDetail | null>(null);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  async function load() {
    const res = await fetch(`/api/lessons/${params.slug}`, { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      setLesson(data.item);
    }
  }

  async function markComplete() {
    if (!lesson) return;
    setSaving(true);
    try {
      const res = await fetch("/api/progress/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonSlug: lesson.slug }),
      });
      if (res.ok) {
        // Volver a aprendizaje o refrescar para que “Retos” se habilite
        router.push("/aprendizaje");
      }
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [params.slug]);

  if (!lesson) return <div className="p-6">Cargando…</div>;

  return (
    <div className="p-6 space-y-4">
      <div className="text-sm opacity-70">Lección {lesson.number}</div>
      <h1 className="text-2xl font-semibold">{lesson.title}</h1>
      <p className="opacity-80">{lesson.description}</p>

      <article className="prose prose-invert max-w-none">
        <pre className="whitespace-pre-wrap">{lesson.content}</pre>
      </article>

      <div className="flex gap-2">
        <button
          onClick={markComplete}
          disabled={saving}
          className="px-4 py-2 rounded bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50"
        >
          {saving ? "Marcando…" : "Marcar como completada"}
        </button>
        <Link
          href="/retos"
          className="px-4 py-2 rounded border border-white/10 bg-white/10 hover:bg-white/20"
        >
          Ir a Retos
        </Link>
      </div>

      {lesson.challenges?.length ? (
        <div className="mt-4">
          <div className="text-sm opacity-70 mb-2">Retos vinculados</div>
          <ul className="list-disc pl-6">
            {lesson.challenges.map((c) => (
              <li key={c.slug}>
                <Link href={`/retos`} className="underline">
                  {c.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
