// lib/reportColumns.ts
import type { Column } from "./exporters";

export const groupColumnsES: Column[] = [
  { key: "name",            label: "Nombre" },
  { key: "role",            label: "Rol" },
  { key: "passedAttempts",  label: "Intentos Aprobados" },
  { key: "avgProgress",     label: "Progreso Promedio (%)" },
];

export const studentColumnsES: Column[] = [
  { key: "name",           label: "Nombre" },
  { key: "role",           label: "Rol" },
  { key: "passedAttempts", label: "Intentos Aprobados" },
  { key: "avgProgress",    label: "Progreso Promedio (%)" },
];
