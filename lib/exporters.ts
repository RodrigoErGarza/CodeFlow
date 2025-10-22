// lib/exporters.ts
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

export type Column = { key: string; label: string };

function makeTableData(rows: any[], columns: Column[]) {
  const headers = columns.map(c => c.label);
  const body = rows.map(r => columns.map(c => r[c.key]));
  return { headers, body };
}

export function exportCSV(filename: string, rows: any[], columns?: Column[]) {
  if (!rows.length) return;
  const keys = columns?.map(c => c.key) ?? Object.keys(rows[0]);
  const headers = columns?.map(c => c.label) ?? keys;
  const csv =
    [headers.join(",")]
      .concat(rows.map(r => keys.map(k => JSON.stringify(r[k] ?? "")).join(",")))
      .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportPDF(filename: string, title: string, rows: any[], columns?: Column[]) {
  const doc = new jsPDF();
  doc.setFontSize(14);
  doc.text(title, 14, 18);

  if (rows.length) {
    const { headers, body } = makeTableData(rows, columns ?? Object.keys(rows[0]).map(k => ({ key: k, label: k })));
    autoTable(doc, {
      head: [headers],
      body,
      startY: 24,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [30, 41, 59] },
    });
  } else {
    doc.text("Sin datos", 14, 28);
  }

  doc.save(filename.endsWith(".pdf") ? filename : `${filename}.pdf`);
}

export function exportXLSX(filename: string, rows: any[], columns?: Column[]) {
  const sheetRows = columns
    ? rows.map(r => {
        const o: Record<string, any> = {};
        for (const c of columns) o[c.label] = r[c.key];
        return o;
      })
    : rows;

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(sheetRows);
  XLSX.utils.book_append_sheet(wb, ws, "Reporte");
  XLSX.writeFile(wb, filename.endsWith(".xlsx") ? filename : `${filename}.xlsx`);
}
