// app/grupos/[id]/GroupReportPanel.tsx
"use client";

import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { exportCSV, exportPDF, exportXLSX } from "@/lib/exporters";
import { groupColumnsES } from "@/lib/reportColumns";


type Report = {
  summary: {
    totalMembers: number;
    totalStudents: number;
    totalTeachers: number;
    avgProgress: number;
    totalPassed: number;
  };
  table: Array<{ userId: string; name: string; avatarUrl: string | null; role: string; avgProgress: number; passedAttempts: number; }>;
  timeseries: Array<{ date: string; value: number }>;
  topStudents: Array<{ userId: string; name: string; avatarUrl: string | null; role: string; avgProgress: number; passedAttempts: number; }>;
};

export default function GroupReportPanel({ groupId }: { groupId: string }) {
  const [data, setData] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const r = await fetch(`/api/groups/${groupId}/report`, { cache: "no-store" });
        if (r.ok) {
          const j = await r.json();
          if (alive) setData(j);
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [groupId]);

  if (loading) {
    return <section className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">Cargando estadísticas…</section>;
  }
  if (!data) return null;

  const { summary, table, timeseries, topStudents } = data;

  return (
    <section className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="mb-4 flex items-center justify-between">
        <div className="text-sm opacity-70">Estadísticas del grupo (solo docente)</div>
        <div className="flex gap-2">
          <button
            onClick={() => exportCSV("reporte_grupo.csv", table)}
            className="px-3 py-1.5 rounded bg-white/10 text-sm hover:bg-white/15"
          >
            Exportar CSV
          </button>
          <button
            onClick={() => exportPDF("reporte_grupo.pdf", "Reporte del grupo", table)}
            className="px-3 py-1.5 rounded bg-white/10 text-sm hover:bg-white/15"
          >
            Exportar PDF
          </button>
          <button onClick={() => exportXLSX("reporte_grupo.xlsx", table, groupColumnsES)} className="px-3 py-1.5 rounded bg-white/10 text-sm hover:bg-white/15">
            Excel
          </button>
        </div>
      </div>

      {/* Métricas */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metric title="Miembros" value={summary.totalMembers} />
        <Metric title="Docentes" value={summary.totalTeachers} />
        <Metric title="Estudiantes" value={summary.totalStudents} />
        <Metric title="Progreso promedio" value={`${summary.avgProgress}%`} />
      </div>

      {/* Serie de aprobados (últimos 30 días) */}
      <div className="grid gap-6 lg:grid-cols-2 mt-6">
        <div className="rounded-xl border border-white/10 p-4">
          <div className="mb-2 text-sm opacity-70">Retos aprobados (últimos 30 días)</div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timeseries}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke="#7c8fff" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top estudiantes */}
        <div className="rounded-xl border border-white/10 p-4">
          <div className="mb-2 text-sm opacity-70">Top 3 por progreso</div>
          <ul className="divide-y divide-white/10">
            {topStudents.map(s => (
              <li key={s.userId} className="py-3 flex items-center gap-3">
                <img
                  src={s.avatarUrl || "/images/avatar-placeholder.png"}
                  alt={s.name}
                  className="h-9 w-9 rounded-full object-cover"
                  onError={(e) => { (e.currentTarget as HTMLImageElement).src = "/images/avatar-placeholder.png"; }}
                />
                <div className="flex-1">
                  <div className="font-medium">{s.name}</div>
                  <div className="text-xs opacity-70">{s.role} · {s.avgProgress}%</div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Tabla resumida (mismo dataset que exportamos) */}
      <div className="mt-6 rounded-xl border border-white/10 overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-white/5 text-left">
              <th className="px-4 py-2">Estudiante</th>
              <th className="px-4 py-2">Progreso</th>
              <th className="px-4 py-2">Aprobados</th>
            </tr>
          </thead>
          <tbody>
            {table.map(r => (
              <tr key={r.userId} className="border-t border-white/10">
                <td className="px-4 py-2">{r.name}</td>
                <td className="px-4 py-2">{r.avgProgress}%</td>
                <td className="px-4 py-2">{r.passedAttempts}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Metric({ title, value }: { title: string; value: number | string }) {
  return (
    <div className="rounded-xl border border-white/10 p-4">
      <div className="text-sm opacity-70">{title}</div>
      <div className="text-2xl font-semibold mt-1">{value}</div>
    </div>
  );
}
