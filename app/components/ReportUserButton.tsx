"use client";

import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

type Props = {
  nombre: string;
  rol: string;
  intentosPasados: number;
  intentosTotales: number;
  unidadesCompletadas: number;
  totalUnidades: number;
};

export default function ReportUserButton(props: Props) {
  const {
    nombre,
    rol,
    intentosPasados,
    intentosTotales,
    unidadesCompletadas,
    totalUnidades,
  } = props;

  const onClick = () => {
    const doc = new jsPDF();

    // Header CodeFlow
    doc.setFillColor(9, 15, 24); // #090F18 aproximado
    doc.rect(0, 0, 210, 28, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.text("CodeFlow — Reporte individual", 14, 18);

    // Info del usuario
    doc.setTextColor(30, 215, 255);
    doc.setFontSize(12);
    doc.text("Usuario", 14, 40);
    doc.setTextColor(20, 20, 20);
    doc.setFontSize(11);
    doc.text(`Nombre: ${nombre}`, 14, 48);
    doc.text(`Rol: ${rol}`, 14, 56);

    // Métricas
    autoTable(doc, {
      startY: 68,
      head: [[
        "Intentos Pasados",
        "Intentos Totales",
        "Unidades Completadas",
        "Total Unidades",
        "Progreso (%)"
      ]],
      body: [[
        intentosPasados,
        intentosTotales,
        unidadesCompletadas,
        totalUnidades,
        Math.round((unidadesCompletadas / Math.max(totalUnidades, 1)) * 100)
      ]],
      styles: { fontSize: 10, cellPadding: 4 },
      headStyles: { fillColor: [32, 129, 226] }, // azul CodeFlow
      theme: "grid",
    });

    // Pie
    doc.setFontSize(9);
    doc.setTextColor(120);
    doc.text("Generado por CodeFlow", 14, 285);

    doc.save(`reporte-${nombre.replace(/\s+/g, "_")}.pdf`);
  };

  return (
    <button
      onClick={onClick}
      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-sm font-medium transition-all"
    >
      Generar reporte
    </button>
  );
}
