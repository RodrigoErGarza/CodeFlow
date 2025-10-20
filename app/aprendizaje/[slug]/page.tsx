// app/aprendizaje/[slug]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Sidebar from "@/app/components/Sidebar";

type UnitDTO = {
  unit: {
    id: string;
    slug: string;
    number: number;
    title: string;
    summary: string;
    sections: Array<{
      id: string;
      index: number;
      title: string;
      content: string;
      questions: Array<{
        id: string;
        prompt: string;
        options: Array<{ id: string; label: string }>;
        explanation?: string | null;
      }>;
    }>;
  } | null;
  percent: number;
  currentSectionIdx?: number;
  prefill?: Record<string, string>; // questionId -> optionId
};

export default function UnitPage() {
  const router = useRouter();
  const { slug } = useParams<{ slug: string }>();

  const [data, setData] = useState<UnitDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // índice de sección visible
  const [sectionIdx, setSectionIdx] = useState(0);

  // estado de respuestas/feedback en la sección activa
  const [answersBySection, setAnswersBySection] = useState<
    Record<string, Record<string, string>>
  >({});
  const [feedbackBySection, setFeedbackBySection] = useState<
    Record<string, Record<string, "ok" | "wrong" | undefined>>
  >({});
  const [checking, setChecking] = useState(false);
  const [sectionDone, setSectionDone] = useState(false);

  useEffect(() => {
    let alive = true;
    async function load() {
      if (!slug) return;
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/units/${slug}`, { cache: "no-store" });
        if (!res.ok) throw new Error(await res.text());
        const json = (await res.json()) as UnitDTO;

        if (!json?.unit) throw new Error("Unidad no encontrada");

        if (alive) {
          setData(json);

          const startIdx = Math.max(
            0,
            Math.min(json.unit.sections.length - 1, json.currentSectionIdx ?? 0)
          );
          setSectionIdx(startIdx);

          // mapear prefill (questionId -> optionId) a estructura por sección
          const bySection: Record<string, Record<string, string>> = {};
          for (const s of json.unit.sections) {
            const qMap: Record<string, string> = {};
            for (const q of s.questions) {
              const sel = json.prefill?.[q.id];
              if (sel) qMap[q.id] = sel;
            }
            bySection[s.id] = qMap;
          }
          setAnswersBySection(bySection);
          setFeedbackBySection({});
          setSectionDone(false);
        }
      } catch (e: any) {
        if (alive) setError(e?.message || "No se pudo cargar la unidad");
      } finally {
        if (alive) setLoading(false);
      }
    }
    load();
    return () => {
      alive = false;
    };
  }, [slug]);

  if (loading) {
    return (
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6">Cargando…</main>
      </div>
    );
  }
  if (error) {
    return (
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6 text-red-400">Error: {error}</main>
      </div>
    );
  }
  if (!data || !data.unit) {
    return (
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6">Unidad no encontrada.</main>
      </div>
    );
  }

  const unit = data.unit;
  const sections = unit.sections ?? [];
  const safeIdx = Math.max(0, Math.min(sectionIdx, Math.max(sections.length - 1, 0)));
  const sec = sections[safeIdx];

  const answers = answersBySection[sec.id] || {};
  const feedback = feedbackBySection[sec.id] || {};

  function setAnswer(qid: string, optionId: string) {
    setAnswersBySection((prev) => ({
      ...prev,
      [sec.id]: { ...(prev[sec.id] || {}), [qid]: optionId },
    }));
    setFeedbackBySection((prev) => ({
      ...prev,
      [sec.id]: { ...(prev[sec.id] || {}), [qid]: undefined },
    }));
  }

  async function checkSection() {
    setChecking(true);
    try {
      const r = await fetch(`/api/progress/section/${sec.id}/check`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });
      const resp = await r.json();

      if (!r.ok || !resp?.ok) throw new Error(resp?.error || "Error al comprobar");

      const newFb: Record<string, "ok" | "wrong"> = {};
      Object.entries(resp.results || {}).forEach(([qid, v]: any) => {
        newFb[qid] = v.correct ? "ok" : "wrong";
      });
      setFeedbackBySection((prev) => ({ ...prev, [sec.id]: newFb }));

      if (resp.allCorrect) setSectionDone(true);
      if (typeof resp.percent === "number") {
        setData((prev) => (prev ? { ...prev, percent: resp.percent } : prev));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setChecking(false);
    }
  }

  async function saveAndExit() {
    try {
      await fetch(`/api/progress/section/${sec.id}/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers, sectionIdx: safeIdx }),
      });
    } catch {}
    router.push(`/aprendizaje?u=${unit.slug}`);
  }

  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 p-6 space-y-5">
        <header className="flex items-center justify-between">
          <div>
            <div className="text-sm opacity-70">Aprendizaje</div>
            <h1 className="text-2xl font-semibold">
              Unidad {unit.number}: {unit.title}
            </h1>
            <p className="opacity-80">{unit.summary}</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-sm opacity-80">Progreso</div>
            <div className="w-40 h-2 rounded bg-white/10 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-400 to-blue-500"
                style={{ width: `${data.percent}%` }}
              />
            </div>
            <span className="text-sm opacity-80">{data.percent}%</span>
          </div>
        </header>

        {/* Navegación secciones */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSectionIdx((i) => Math.max(0, i - 1))}
            disabled={safeIdx === 0}
            className="px-3 py-1 rounded border border-white/10 bg-white/10 disabled:opacity-40"
          >
            ← Anterior
          </button>
          <div className="text-sm opacity-80">
            Sección {sec.index} de {sections.length}
          </div>
          <button
            onClick={() =>
              setSectionIdx((i) => Math.min(sections.length - 1, i + 1))
            }
            disabled={safeIdx >= sections.length - 1}
            className="px-3 py-1 rounded border border-white/10 bg-white/10 disabled:opacity-40"
          >
            Siguiente →
          </button>

          <div className="ml-auto flex gap-2">
            <button
              onClick={saveAndExit}
              className="px-3 py-1 rounded bg-white/10 hover:bg-white/20 border border-white/10"
              title="Guardar progreso y volver"
            >
              Guardar y salir
            </button>
          </div>
        </div>

        {/* Contenido */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <h2 className="font-medium mb-2">{sec.title}</h2>
          <div
            className="prose prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: sec.content }}
          />
        </div>

        {/* Preguntas */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-4">
          <div className="text-sm opacity-70 mb-1">Preguntas de repaso</div>

          {sec.questions.map((q) => (
            <div key={q.id} className="border border-white/10 rounded-lg p-3">
              <div className="font-medium mb-2">{q.prompt}</div>
              <div className="flex flex-col gap-2">
                {q.options.map((o) => (
                  <label key={o.id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name={q.id}
                      checked={answers[q.id] === o.id}
                      onChange={() => setAnswer(q.id, o.id)}
                    />
                    <span>{o.label}</span>
                  </label>
                ))}
              </div>

              {feedback[q.id] === "ok" && (
                <div className="mt-2 text-emerald-300 text-sm">✓ Respuesta correcta</div>
              )}
              {feedback[q.id] === "wrong" && (
                <div className="mt-2 text-red-300 text-sm">✗ Respuesta incorrecta</div>
              )}
              {q.explanation && feedback[q.id] && (
                <div className="mt-2 text-sm opacity-80">{q.explanation}</div>
              )}
            </div>
          ))}

          <div className="flex items-center gap-2">
            <button
              onClick={checkSection}
              disabled={checking}
              className="px-3 py-2 rounded bg-indigo-600 text-white"
            >
              {checking ? "Comprobando…" : "Comprobar sección"}
            </button>
            {sectionDone && (
              <span className="text-emerald-300 text-sm">Sección completada ✅</span>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
