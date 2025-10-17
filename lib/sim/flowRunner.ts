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
  __stdout: string[];
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

/** Eval segura “suficiente” para UI
 *  - Soporta números, (), + - * /, comparadores, && || !,
 *  - `Y/O/NO` (PSeInt) -> && || !
 *  - strings "..." o '...'
 *  - variables del entorno simple (a-zA-Z_\\w*)
 */
function evalExpr(expr: string, env: Env): any {
  // Sustituye variables (a-zA-Z_\w*)
  const safe = expr.replace(/[a-zA-Z_]\w*/g, (name) => {
    if (name in env) return JSON.stringify(env[name]);
    return name; // por si es true/false o similares
  });

  // 👇 NUEVO: quita cadenas "..." y '...' antes de validar caracteres
  const withoutStrings = safe.replace(/"([^"\\]|\\.)*"|'([^'\\]|\\.)*'/g, '""');

  // valida caracteres (ya sin letras dentro de comillas)
  if (!/^[\d\s+\-*/()<>!=&|.,"']+$/i.test(withoutStrings)) {
    throw new Error("Expresión no permitida");
  }

  // evalúa en sandbox acotado
  // eslint-disable-next-line no-new-func
  return Function(`"use strict"; return (${safe});`)();
}

export function traceIR(graph: FlowGraph): IRStep[] {
  const steps: IRStep[] = [];
  const env: Env = {__stdout: []};
  const byId = new Map<string, any>();
  graph.nodes.forEach((n: any) => byId.set(n.id, n));
  const outgoing = new Map<string, any[]>();
  graph.edges.forEach((e: any) => {
    if (!outgoing.has(e.source)) outgoing.set(e.source, []);
    outgoing.get(e.source)!.push(e);
  });

  const start = graph.nodes.find((n: any) => (n.type || "").toLowerCase() === "start") || graph.nodes[0];
  let cur = start;

  const maxSteps = 1000;
  let guard = 0;

  while (cur && guard++ < maxSteps) {
    const t = (cur.type || "").toLowerCase();
    const label = (cur.label || "").trim();

    emitStep(steps, env, cur);
    if (t === "end") break;

    if (t === "action" || t === "" || t === "default") {
      if (/^print\s*\(/i.test(label)) {
        try {
          const inside = label.replace(/^print\s*\(/i, "").replace(/\)\s*$/, "");
          const val = evalExpr(inside, env);
          env.stdout = (env.stdout || "") + String(val) + "\n";
        } catch (e: any) {
          steps.push({ error: e.message || "Error en print" });
          break;
        }
      } else if (/^escribir\s+/i.test(label)) {
        const inside = label.replace(/^escribir\s+/i, "");
        try {
          const val = evalExpr(inside, env);
          env.stdout = (env.stdout || "") + String(val) + "\n";
        } catch (e: any) {
          steps.push({ error: e.message || "Error en Escribir" });
          break;
        }
      } else if (/^system\.out\.println\s*\(/i.test(label)) {
        const inside = label.replace(/^system\.out\.println\s*\(/i, "").replace(/\)\s*$/, "");
        try {
          const val = evalExpr(inside, env);
          env.stdout = (env.stdout || "") + String(val) + "\n";
        } catch (e: any) {
          steps.push({ error: e.message || "Error en println" });
          break;
        }
      } else if (/<=|<-|=/.test(label)) {
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
      try { truth = !!evalExpr(cond, env); }
      catch (e: any) { steps.push({ error: e.message || "Error en condición" }); break; }

      const yes = outs.find((e) => (e.label || "").toLowerCase().startsWith("s")) || outs[0];
      const no  = outs.find((e) => (e.label || "").toLowerCase().startsWith("n")) || outs[1];

      cur = truth ? byId.get(yes?.target) : byId.get(no?.target);
      continue;
    }

    const outs = outgoing.get(cur.id) || [];
    cur = byId.get(outs[0]?.target);
  }

  return steps;
}
