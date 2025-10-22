// app/grupos/[id]/MemberReportModal.tsx
"use client";

import { useEffect, useState } from "react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { exportCSV, exportPDF, exportXLSX } from "@/lib/exporters";
import { studentColumnsES } from "@/lib/reportColumns";

type Props = {
  groupId: string;
  userId: string;
  onClose: () => void;
};

export default function MemberReportModal({ groupId, userId, onClose }: Props) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const r = await fetch(`/api/groups/${groupId}/report/${userId}`, { cache: "no-store" });
        if (r.ok) {
          const j = await r.json();
          if (alive) setData(j);
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [groupId, userId]);

  if (!data && loading) return null;

  const row = data?.summaryRow ?? null; // { name, role, passedAttempts, avgProgress }
  const rowsForExport = row ? [row] : [];

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center">
      <div className="w-full max-w-2xl rounded-2xl border border-white/10 bg-[#0c111a] p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-lg font-semibold">Reporte de {data?.user?.name ?? "Estudiante"}</div>
          <button onClick={onClose} className="px-3 py-1.5 rounded bg-white/10 text-sm hover:bg-white/15">Cerrar</button>
        </div>

        {loading ? (
          <div className="opacity-70">Cargando…</div>
        ) : (
          <>
            {/* Métricas */}
            <div className="grid gap-4 sm:grid-cols-3">
              <Metric title="Rol" value={data.user.role} />
              <Metric title="Intentos Aprobados" value={row?.passedAttempts ?? 0} />
              <Metric title="Progreso Promedio" value={`${row?.avgProgress ?? 0}%`} />
            </div>

            {/* Gráfica */}
            <div className="rounded-xl border border-white/10 p-4 mt-4">
              <div className="mb-2 text-sm opacity-70">Aprobados (últimos 30 días)</div>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.timeseries}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="value" stroke="#7c8fff" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Exportar */}
            <div className="flex items-center gap-2 mt-4">
              <button
                onClick={() => exportCSV(`reporte_${data.user.name}.csv`, rowsForExport, studentColumnsES)}
                className="px-3 py-1.5 rounded bg-white/10 text-sm hover:bg-white/15"
              >
                CSV
              </button>
              <button
                onClick={() => exportPDF(`reporte_${data.user.name}.pdf`, `Reporte de ${data.user.name}`, rowsForExport, studentColumnsES)}
                className="px-3 py-1.5 rounded bg-white/10 text-sm hover:bg-white/15"
              >
                PDF
              </button>
              <button
                onClick={() => exportXLSX(`reporte_${data.user.name}.xlsx`, rowsForExport, studentColumnsES)}
                className="px-3 py-1.5 rounded bg-white/10 text-sm hover:bg-white/15"
              >
                Excel
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Metric({ title, value }: { title: string; value: number | string }) {
  return (
    <div className="rounded-xl border border-white/10 p-4">
      <div className="text-sm opacity-70">{title}</div>
      <div className="text-xl font-semibold mt-1">{value}</div>
    </div>
  );
}
