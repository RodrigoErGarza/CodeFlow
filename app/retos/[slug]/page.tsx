// app/retos/[slug]/page.tsx
"use client";
import Sidebar from "@/app/components/Sidebar";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type ChallengeDetail = {
  id: string;
  slug: string;
  title: string;
  description: string;
  language: string;
  requiresUnitNumber: number | null;
  passed: boolean;
  hint: string | null;
  starterCode?: string | null; // si lo tienes
};

export default function RetoDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();

  const [data, setData] = useState<ChallengeDetail | null>(null);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  // cargar reto + draft
  useEffect(() => {
    (async () => {
      const r = await fetch(`/api/challenges/${slug}`, { cache: "no-store" });
      const d = await r.json();
      if (!d?.error) {
        setData(d);
        const draft = localStorage.getItem(`challenge-draft:${slug}`);
        if (draft) setCode(draft);
        else if (d?.starterCode) setCode(d.starterCode);
      }
      setLoading(false);
    })();
  }, [slug]);

  async function submit() {
    setSending(true);
    setFeedback(null);
    try {
      const r = await fetch(`/api/challenges/${slug}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, language: data?.language }),
      });
      const d = await r.json();
      if (!r.ok) {
        setFeedback(`✖ ${d?.error || "Error al enviar"}`);
      } else {
        const lines = (d.results || []).map((x: any) => `${x.pass ? "✔" : "✖"} ${x.message}`).join("\n");
        setFeedback(`${d.pass ? "✅ ¡Aprobado!" : "❌ No pasó todas las pruebas"}\n\n${lines}`);

        // Si pasó, opcional: guardar borrador vacío y volver
        if (d.pass) {
          localStorage.removeItem(`challenge-draft:${slug}`);
          // refresca /retos para que coja el nuevo resumen
          router.push("/retos");
          router.refresh();
        }
      }
    } finally {
      setSending(false);
    }
  }

  function saveAndExit() {
    localStorage.setItem(`challenge-draft:${slug}`, code);
    router.push("/retos");
    router.refresh();
  }

  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 p-6 space-y-5">
        {loading && <div className="opacity-70 text-sm">Cargando…</div>}
        {!loading && !data && <div className="text-red-400">Reto no encontrado.</div>}
        {data && (
          <>
            <header className="flex items-center justify-between">
              <div>
                <div className="text-sm opacity-70">Retos</div>
                <h1 className="text-2xl font-semibold">{data.title}</h1>
                <p className="opacity-80">{data.description}</p>
                {data.hint && <p className="text-sm opacity-70 mt-1">Pista: {data.hint}</p>}
                {data.requiresUnitNumber && (
                  <p className="text-xs opacity-70 mt-1">Requiere Unidad {data.requiresUnitNumber} al 100%</p>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={saveAndExit}
                  className="px-3 py-2 rounded bg-white/10 hover:bg-white/15 text-sm"
                >
                  Guardar y salir
                </button>
              </div>
            </header>

            <section className="grid grid-cols-12 gap-4">
              <div className="col-span-12 lg:col-span-8 space-y-3">
                <textarea
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Escribe tu solución aquí…"
                  className="w-full min-h-[360px] rounded-lg bg-black/40 border border-white/10 p-3 font-mono text-sm"
                />
                <div className="flex gap-2">
                  <button
                    onClick={submit}
                    disabled={sending}
                    className="px-3 py-2 rounded bg-indigo-600 text-white"
                  >
                    {sending ? "Evaluando…" : "Enviar y evaluar"}
                  </button>
                  <button
                    onClick={saveAndExit}
                    className="px-3 py-2 rounded bg-white/10 hover:bg-white/15"
                  >
                    Guardar y salir
                  </button>
                </div>
                {feedback && (
                  <pre className="whitespace-pre-wrap rounded-lg bg-black/40 border border-white/10 p-3 text-sm">
                    {feedback}
                  </pre>
                )}
              </div>
              <aside className="col-span-12 lg:col-span-4 space-y-3">
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <div className="text-sm opacity-70 mb-2">Estado</div>
                  <div className="text-sm">
                    {data.passed ? "✅ Ya aprobaste este reto" : "Pendiente"}
                  </div>
                </div>
              </aside>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
