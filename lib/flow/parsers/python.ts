// app/lib/flow/parsers/python.ts
import { Diagnostic, FlowGraph, FlowNode, nid, startEndSkeleton } from "../ir";

/** Estructuras simples por indentación */
type PyNode =
  | { k: "seq"; body: string[] }
  | { k: "if"; cond: string; then: PyNode[]; else: PyNode[] }
  | { k: "while"; cond: string; body: PyNode[] }
  | { k: "for"; hdr: string; body: PyNode[] };

function tokenize(src: string): { text: string; line: number; ind: number }[] {
  return src
    .split(/\r?\n/)
    .map((raw, idx) => {
      const m = /^(\s*)(.*)$/.exec(raw) as RegExpExecArray;
      const spaces = (m[1] || "").replace(/\t/g, "    ").length;
      const text = (m[2] || "").trim();
      return { text, line: idx + 1, ind: spaces };
    })
    .filter((t) => t.text.length > 0 && !t.text.startsWith("#"));
}

function parseBlocks(tokens: ReturnType<typeof tokenize>, errors: Diagnostic[]): PyNode[] {
  let i = 0;

  function parseBlock(base: number): PyNode[] {
    const out: PyNode[] = [];
    let curSeq: string[] = [];

    function flushSeq() {
      if (curSeq.length) {
        out.push({ k: "seq", body: curSeq });
        curSeq = [];
      }
    }

    while (i < tokens.length) {
      const { text, line, ind } = tokens[i];
      if (ind < base) break;         // termina bloque
      if (ind > base) { i++; continue; } // línea mal indentada → se ignora

      // if
      let m = /^if\s+(.+):$/.exec(text);
      if (m) {
        flushSeq();
        i++;
        const thenPart = parseBlock(base + 2);
        // else opcional
        let elsePart: PyNode[] = [];
        if (i < tokens.length && tokens[i].ind === base && /^else\s*:$/.test(tokens[i].text)) {
          i++;
          elsePart = parseBlock(base + 2);
        }
        out.push({ k: "if", cond: m[1], then: thenPart, else: elsePart });
        continue;
      }

      // while
      m = /^while\s+(.+):$/.exec(text);
      if (m) {
        flushSeq();
        i++;
        const body = parseBlock(base + 2);
        out.push({ k: "while", cond: m[1], body });
        continue;
      }

      // for
      m = /^for\s+(.+):$/.exec(text);
      if (m) {
        flushSeq();
        i++;
        const body = parseBlock(base + 2);
        out.push({ k: "for", hdr: m[1], body });
        continue;
      }

      // secuencia
      curSeq.push(text);
      i++;
    }
    flushSeq();
    return out;
  }

  return parseBlock(0);
}

// convertir árbol simple → IR (mismo patrón que PSeInt)
import { FlowEdge } from "../ir";

function emitSeq(body: string[], g: FlowGraph, from: string, to: string) {
  let cur = from;
  for (const line of body) {
    const n: FlowNode = { id: nid("act"), type: "action", label: line };
    g.nodes.push(n);
    g.edges.push({ id: nid("e"), source: cur, target: n.id });
    cur = n.id;
  }
  g.edges.push({ id: nid("e"), source: cur, target: to });
}

export function parsePythonToIR(src: string): FlowGraph {
  const g = startEndSkeleton();
  const start = g.nodes[0].id;
  const end = g.nodes[1].id;
  const errors: Diagnostic[] = [];

  const ast = parseBlocks(tokenize(src), errors);

  function walk(nodes: PyNode[], cur: string): string {
    for (const n of nodes) {
      if (n.k === "seq") {
        let c = cur;
        for (const line of n.body) {
          const act: FlowNode = { id: nid("act"), type: "action", label: line };
          g.nodes.push(act);
          g.edges.push({ id: nid("e"), source: c, target: act.id });
          c = act.id;
        }
        cur = c;
        continue;
      }
      if (n.k === "if") {
        const d: FlowNode = { id: nid("dec"), type: "decision", label: `¿${n.cond}?` };
        g.nodes.push(d);
        g.edges.push({ id: nid("e"), source: cur, target: d.id });

        const merge: FlowNode = { id: nid("noop"), type: "noop", label: " " };
        g.nodes.push(merge);

        // sí
        const yesEntry = nid("yes");
        g.nodes.push({ id: yesEntry, type: "noop", label: " " });
        g.edges.push({ id: nid("e"), source: d.id, target: yesEntry, label: "sí" });
        emitSeq(flattenSeq(n.then), g, yesEntry, merge.id);

        // no
        const noEntry = nid("no");
        g.nodes.push({ id: noEntry, type: "noop", label: " " });
        g.edges.push({ id: nid("e"), source: d.id, target: noEntry, label: "no" });
        emitSeq(flattenSeq(n.else), g, noEntry, merge.id);

        cur = merge.id;
        continue;
      }
      if (n.k === "while") {
        const d: FlowNode = { id: nid("dec"), type: "decision", label: `¿${n.cond}?` };
        g.nodes.push(d);
        g.edges.push({ id: nid("e"), source: cur, target: d.id });

        const yesEntry = nid("yes");
        g.nodes.push({ id: yesEntry, type: "noop", label: " " });
        g.edges.push({ id: nid("e"), source: d.id, target: yesEntry, label: "sí" });
        emitSeq(flattenSeq(n.body), g, yesEntry, d.id);

        const merge: FlowNode = { id: nid("noop"), type: "noop", label: " " };
        g.nodes.push(merge);
        g.edges.push({ id: nid("e"), source: d.id, target: merge.id, label: "no" });
        cur = merge.id;
        continue;
      }
      if (n.k === "for") {
        const d: FlowNode = { id: nid("dec"), type: "decision", label: `for ${n.hdr}` };
        g.nodes.push(d);
        g.edges.push({ id: nid("e"), source: cur, target: d.id });

        const yesEntry = nid("yes");
        g.nodes.push({ id: yesEntry, type: "noop", label: " " });
        g.edges.push({ id: nid("e"), source: d.id, target: yesEntry, label: "sí" });
        emitSeq(flattenSeq(n.body), g, yesEntry, d.id);

        const merge: FlowNode = { id: nid("noop"), type: "noop", label: " " };
        g.nodes.push(merge);
        g.edges.push({ id: nid("e"), source: d.id, target: merge.id, label: "no" });
        cur = merge.id;
      }
    }
    return cur;
  }

  function flattenSeq(nodes: PyNode[]): string[] {
    // Para el MVP, convertimos toda rama en secuencia simple (sin sub-ifs anidados profundos).
    // Notas: si hay ifs anidados, se degradan a texto; esto es consciente para MVP.
    const out: string[] = [];
    for (const n of nodes) {
      if (n.k === "seq") out.push(...n.body);
      else out.push(`[bloque ${n.k}]`); // mejora en Día 5
    }
    return out;
  }

  const last = walk(ast, start);
  g.edges.push({ id: nid("e"), source: last, target: end });

  if (errors.length) g.errors = errors;
  return g;
}
