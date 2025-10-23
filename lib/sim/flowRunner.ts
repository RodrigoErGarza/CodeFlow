// lib/sim/flowRunner.ts
import type { FlowGraph } from "@/app/components/FlowCanvas";

export type IRStep = {
  line?: number;
  locals?: Record<string, string>;
  stdout?: string[];
  error?: string;
};

type Env = {
  [k: string]: any;
  __stdout: string[]; // acumulamos salida por líneas
};

function getNodeLine(n: any): number | undefined {
  const r = n?.range;
  // Puede venir como número o como objeto { line: number }
  if (typeof r?.start === "number") return r.start;
  if (typeof r?.start?.line === "number") return r.start.line;
  if (typeof n?.meta?.line === "number") return n.meta.line;
  if (typeof n?.line === "number") return n.line;
  return undefined;
}

function emitStep(steps: IRStep[], env: Env, node: any) {
  const locals: Record<string, string> = {};
  for (const [k, v] of Object.entries(env)) {
    if (k === "__stdout") continue;
    try {
      locals[k] = typeof v === "string" ? v : JSON.stringify(v);
    } catch {
      locals[k] = "<unrepr>";
    }
  }
  const step: IRStep = {
    locals,
    stdout: [...(env.__stdout || [])],
  };
  const ln = getNodeLine(node);
  if (ln) step.line = ln;
  steps.push(step);
}

/** Normaliza operadores y literales entre PSeInt/Java y JS
 *  - Y/O/NO → &&/||/!
 *  - VERDADERO/FALSO → true/false
 */
function normalizeExpr(expr: string): string {
  return expr
    .replace(/\bNO\b/gi, "!") // negación unaria
    .replace(/\bY\b/gi, "&&")
    .replace(/\bO\b/gi, "||")
    .replace(/\bVERDADERO\b/gi, "true")
    .replace(/\bFALSO\b/gi, "false");
}

/** Eval segura “suficiente” para UI
 *  - Soporta números, (), + - * /, comparadores, && || !,
 *  - Mapea Y/O/NO (PSeInt) a operadores JS
 *  - Strings "..." o '...'
 *  - Variables del entorno simple (a-zA-Z_\w*)
 */
function evalExpr(expr: string, env: Env): any {
  const normalized = normalizeExpr(expr);

  // Sustituye variables (a-zA-Z_\w*)
  const substituted = normalized.replace(/[a-zA-Z_]\w*/g, (name) => {
    if (name in env) return JSON.stringify(env[name]);
    return name; // puede ser true/false o palabras ya normalizadas
  });

  // Quita cadenas antes de validar caracteres permitidos
  const withoutStrings = substituted.replace(/"([^"\\]|\\.)*"|'([^'\\]|\\.)*'/g, '""');

  // Sólo números, operadores, paréntesis, comas, puntos, comillas y espacios
  if (!/^[\d\s+\-*/()%<>=!&|.,"']+$/i.test(withoutStrings)) {
    throw new Error("Expresión no permitida");
  }

  // Evalúa en sandbox acotado
  // eslint-disable-next-line no-new-func
  return Function(`"use strict"; return (${substituted});`)();
}

export function traceIR(graph: FlowGraph): IRStep[] {
  const steps: IRStep[] = [];
  const env: Env = { __stdout: [] };

  const byId = new Map<string, any>();
  graph.nodes.forEach((n: any) => byId.set(n.id, n));

  const outgoing = new Map<string, any[]>();
  graph.edges.forEach((e: any) => {
    if (!outgoing.has(e.source)) outgoing.set(e.source, []);
    outgoing.get(e.source)!.push(e);
  });

  const start =
    graph.nodes.find((n: any) => (n.type || "").toLowerCase() === "start") ||
    graph.nodes[0];

  let cur = start;
  const maxSteps = 1000;
  let guard = 0;

  while (cur && guard++ < maxSteps) {
    const t = (cur.type || "").toLowerCase();
    const label = (cur.label || "").trim();

    // Snapshot antes de ejecutar el nodo (línea y locals)
    emitStep(steps, env, cur);
    if (t === "end") break;

    if (t === "action" || t === "" || t === "default") {
      // --- Salidas en Java / PSeInt / pseudo-Python ---
      if (/^system\.out\.println\s*\(/i.test(label)) {
        // Java: System.out.println(expr)
        const inside = label.replace(/^system\.out\.println\s*\(/i, "").replace(/\)\s*$/, "");
        try {
          const val = evalExpr(inside, env);
          env.__stdout.push(String(val));
        } catch (e: any) {
          steps.push({ error: e.message || "Error en println" });
          break;
        }
      } else if (/^print\s*\(/i.test(label)) {
        // print(expr)
        const inside = label.replace(/^print\s*\(/i, "").replace(/\)\s*$/, "");
        try {
          const val = evalExpr(inside, env);
          env.__stdout.push(String(val));
        } catch (e: any) {
          steps.push({ error: e.message || "Error en print" });
          break;
        }
      } else if (/^escribir\s+/i.test(label)) {
        // PSeInt: Escribir expr
        const inside = label.replace(/^escribir\s+/i, "");
        try {
          const val = evalExpr(inside, env);
          env.__stdout.push(String(val));
        } catch (e: any) {
          steps.push({ error: e.message || "Error en Escribir" });
          break;
        }
      } else if (/^leer\s+/i.test(label)) {
        // PSeInt: Leer var  -> sin entrada interactiva; dejamos valor actual
        // (Podrías simular un input aquí si luego lo necesitas)
      } else if (/^([a-zA-Z_]\w*)\s*(?:<-|=)\s*(.+)$/.test(label)) {
        // Asignación: nombre <- expr  |  nombre = expr
        const m = label.match(/^([a-zA-Z_]\w*)\s*(?:<-|=)\s*(.+)$/);
        if (m) {
          const name = m[1];
          const expr = m[2];
          try {
            env[name] = evalExpr(expr, env);
          } catch (e: any) {
            steps.push({ error: e.message || "Error en asignación" });
            break;
          }
        }
      }
    } else if (t === "decision") {
      const outs = outgoing.get(cur.id) || [];
      const cond = label;
      let truth = false;
      try {
        truth = !!evalExpr(cond, env);
      } catch (e: any) {
        steps.push({ error: e.message || "Error en condición" });
        break;
      }

      // “Sí/No” (PSeInt) o “true/false”/“Yes/No” — elegimos por etiqueta
      const yes =
        outs.find((e) => (e.label || "").toLowerCase().startsWith("s")) ||
        outs.find((e) => (e.label || "").toLowerCase().startsWith("y")) ||
        outs[0];
      const no =
        outs.find((e) => (e.label || "").toLowerCase().startsWith("n")) ||
        outs.find((e) => (e.label || "").toLowerCase().startsWith("f")) ||
        outs[1];

      cur = truth ? byId.get(yes?.target) : byId.get(no?.target);
      continue;
    }

    // Siguiente (primera salida por defecto)
    const outs = outgoing.get(cur.id) || [];
    cur = byId.get(outs[0]?.target);
  }

  return steps;
}
