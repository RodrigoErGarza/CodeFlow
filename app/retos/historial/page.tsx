// app/retos/historial/page.tsx
"use client";
import { useEffect, useState } from "react";
import Sidebar from "@/app/components/Sidebar";
import Link from "next/link";

type Attempt = {
  id: string;
  slug: string;
  title: string;
  language: string;
  status: string;
  isCorrect: boolean;
  createdAt: string;
  feedback?: string | null;
};

export default function HistoryPage() {
  const [data, setData] = useState<Attempt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/challenges/history", { cache: "no-store" });
        const d = await r.json();
        setData(d.history || []);
      } catch {
        setData([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 p-6">
        <h1 className="text-3xl font-semibold mb-6">Historial de Intentos</h1>

        {loading && <div className="opacity-70">Cargando...</div>}
        {!loading && data.length === 0 && <div className="opacity-70">No hay intentos registrados.</div>}

        {!loading && data.length > 0 && (
          <div className="space-y-4">
            {data.map((a) => (
              <div
                key={a.id}
                className="border border-white/10 bg-white/5 p-4 rounded-xl hover:bg-white/10 transition"
              >
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <Link href={`/retos/${a.slug}`} className="text-lg font-medium hover:underline">
                      {a.title}
                    </Link>
                    <div className="text-sm opacity-70">{new Date(a.createdAt).toLocaleString()}</div>
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      a.isCorrect
                        ? "bg-emerald-500/20 text-emerald-300"
                        : "bg-red-500/20 text-red-300"
                    }`}
                  >
                    {a.isCorrect ? "Aprobado" : "Fallido"}
                  </span>
                </div>

                {a.feedback && (
                  <pre className="text-sm opacity-80 whitespace-pre-wrap border-t border-white/10 pt-2 mt-2">
                    {a.feedback}
                  </pre>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
