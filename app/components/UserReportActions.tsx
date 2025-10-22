// components/UserReportActions.tsx
"use client";

import { useSession } from "next-auth/react";
import { useMemo } from "react";
import { exportCSV, exportXLSX, Column, exportPDF } from "@/lib/exporters";
import ReportUserButton from "@/app/components/ReportUserButton"; // tu botón PDF estilizado

type Props = {
  intentosPasados: number;
  intentosTotales: number;
  unidadesCompletadas: number;
  totalUnidades: number;
  className?: string;
};

export default function UserReportActions({
  intentosPasados,
  intentosTotales,
  unidadesCompletadas,
  totalUnidades,
  className,
}: Props) {
  const { data: session } = useSession();
  const user = session?.user as any;

  const nombre = user?.name ?? "Usuario";
  const rol = user?.role ?? "STUDENT";
  const progreso = Math.round(
    (unidadesCompletadas / Math.max(totalUnidades, 1)) * 100
  );

  // columnas en español para CSV/XLSX (y también sirven para exportPDF si quieres)
  const columns: Column[] = useMemo(
    () => [
      { key: "nombre", label: "Nombre" },
      { key: "rol", label: "Rol" },
      { key: "intentosPasados", label: "Intentos Pasados" },
      { key: "intentosTotales", label: "Intentos Totales" },
      { key: "unidadesCompletadas", label: "Unidades Completadas" },
      { key: "totalUnidades", label: "Total Unidades" },
      { key: "progreso", label: "Progreso (%)" },
    ],
    []
  );

  const rows = useMemo(
    () => [
      {
        nombre,
        rol,
        intentosPasados,
        intentosTotales,
        unidadesCompletadas,
        totalUnidades,
        progreso,
      },
    ],
    [
      nombre,
      rol,
      intentosPasados,
      intentosTotales,
      unidadesCompletadas,
      totalUnidades,
      progreso,
    ]
  );

  const base = `reporte_${nombre.replace(/\s+/g, "_")}`;

  const onCSV = () => exportCSV(`${base}.csv`, rows, columns);
  const onXLSX = () => exportXLSX(`${base}.xlsx`, rows, columns);

  // Si prefieres usar también exportPDF (tabla simple) en vez del botón estilizado:
  // const onPDFSimple = () =>
  //   exportPDF(`${base}.pdf`, "Reporte individual", rows, columns);

  return (
    <div className={className ?? "mt-4 flex gap-2"}>
      {/* Tu botón PDF estilizado */}
      <ReportUserButton
        nombre={nombre}
        rol={rol}
        intentosPasados={intentosPasados}
        intentosTotales={intentosTotales}
        unidadesCompletadas={unidadesCompletadas}
        totalUnidades={totalUnidades}
      />

      {/* Botones XLSX y CSV usando tus exporters */}
      <button
        onClick={onXLSX}
        className="px-3 py-2 bg-white/10 hover:bg-white/15 rounded-md text-sm"
      >
        XLSX
      </button>
      <button
        onClick={onCSV}
        className="px-3 py-2 bg-white/10 hover:bg-white/15 rounded-md text-sm"
      >
        CSV
      </button>

      {/* Si alguna vez quieres tabla PDF simple:
      <button
        onClick={onPDFSimple}
        className="px-3 py-2 bg-white/10 hover:bg-white/15 rounded-md text-sm"
      >
        PDF (simple)
      </button> */}
    </div>
  );
}
