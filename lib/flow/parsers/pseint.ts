// app/lib/flow/parsers/pseint.ts
import { Diagnostic, FlowGraph, FlowNode, FlowEdge, nid, startEndSkeleton } from "../ir";

type Block =
  | { kind: "if"; cond: string; then: string[]; else: string[] | null }
  | { kind: "while"; cond: string; body: string[] }
  | { kind: "for"; hdr: string; body: string[] }
  | { kind: "seq"; body: string[] };

function splitToStmts(src: string): string[] {
  return src
    .split(/\r?\n/)
    .map((l) => l.replace(/\t/g, "    ").trim())
    .filter((l) => l.length > 0 && !/^\/\//.test(l));
}

/** Construye un bloque de alto nivel por tokens muy simples (Si/Entonces/Sino/FinSi, Mientras/FinMientras, Para/FinPara). */
function buildBlocks(lines: string[], errors: Diagnostic[]): (Block)[] {
  const out: Block[] = [];
  const stack: any[] = [];
  let currentSeq: string[] = [];

  function flushSeq() {
    if (currentSeq.length) {
      out.push({ kind: "seq", body: currentSeq });
      currentSeq = [];
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const l = raw.toLowerCase();

    // Estructuras
    const mIf = /^si\s+(.+?)\s+entonces/.exec(l);
    if (mIf) {
      flushSeq();
      stack.push({ t: "if", line: i + 1, cond: mIf[1], then: [] as string[], else: null as string[] | null, inElse: false });
      continue;
    }
    if (/^sino/.test(l)) {
      const top = stack[stack.length - 1];
      if (!top || top.t !== "if") {
        errors.push({ line: i + 1, message: "‘Sino’ sin ‘Si’." });
      } else {
        top.inElse = true;
        top.else = [];
      }
      continue;
    }
    if (/^finsi/.test(l)) {
      const top = stack.pop();
      if (!top || top.t !== "if") {
        errors.push({ line: i + 1, message: "‘FinSi’ sin ‘Si’." });
      } else {
        out.push({ kind: "if", cond: top.cond, then: top.then, else: top.else });
      }
      continue;
    }

    const mWhile = /^mientras\s+(.+?)\s+hacer|^mientras\s+(.+)/.exec(l); // tolerante
    if (mWhile) {
      flushSeq();
      stack.push({ t: "while", line: i + 1, cond: (mWhile[1] || mWhile[2]).trim(), body: [] as string[] });
      continue;
    }
    if (/^finmientras/.test(l)) {
      const top = stack.pop();
      if (!top || top.t !== "while") {
        errors.push({ line: i + 1, message: "‘FinMientras’ sin ‘Mientras’." });
      } else {
        out.push({ kind: "while", cond: top.cond, body: top.body });
      }
      continue;
    }

    const mFor = /^para\s+(.+?)\s+hasta|^para\s+(.+)/.exec(l);
    if (mFor) {
      flushSeq();
      stack.push({ t: "for", line: i + 1, hdr: (mFor[1] || mFor[2]).trim(), body: [] as string[] });
      continue;
    }
    if (/^finpara/.test(l)) {
      const top = stack.pop();
      if (!top || top.t !== "for") {
        errors.push({ line: i + 1, message: "‘FinPara’ sin ‘Para’." });
      } else {
        out.push({ kind: "for", hdr: top.hdr, body: top.body });
      }
      continue;
    }

    // Línea normal → enviar a secuencia actual o al bloque en el stack
    const top = stack[stack.length - 1];
    if (!top) currentSeq.push(raw);
    else if (top.t === "if") {
      if (!top.inElse) top.then.push(raw);
      else if (top.else) top.else.push(raw);
    } else if (top.t === "while" || top.t === "for") {
      top.body.push(raw);
    }
  }
  flushSeq();

  if (stack.length) {
    errors.push({ message: "Bloques sin cerrar (Si/Mientras/Para)." });
  }
  return out;
}

function seqToIR(body: string[], g: FlowGraph, entry: string, next: string) {
  let cur = entry;
  for (const line of body) {
    const n: FlowNode = { id: nid("act"), type: "action", label: line };
    g.nodes.push(n);
    g.edges.push({ id: nid("e"), source: cur, target: n.id });
    cur = n.id;
  }
  g.edges.push({ id: nid("e"), source: cur, target: next });
}

export function parsePSeIntToIR(src: string): FlowGraph {
  const g = startEndSkeleton();
  const errors: Diagnostic[] = [];
  const seqStart = g.nodes[0].id; // start
  const endId = g.nodes[1].id;    // end

  const blocks = buildBlocks(splitToStmts(src), errors);

  // Puntero de “siguiente”
  let cur = seqStart;

  for (const b of blocks) {
    if (b.kind === "seq") {
      for (const line of b.body) {
        const n: FlowNode = { id: nid("act"), type: "action", label: line };
        g.nodes.push(n);
        g.edges.push({ id: nid("e"), source: cur, target: n.id });
        cur = n.id;
      }
      continue;
    }

    if (b.kind === "if") {
      const d: FlowNode = { id: nid("dec"), type: "decision", label: `¿${b.cond}?` };
      g.nodes.push(d);
      g.edges.push({ id: nid("e"), source: cur, target: d.id });

      const merge: FlowNode = { id: nid("noop"), type: "noop", label: " " };
      g.nodes.push(merge);

      // rama sí
      if (b.then.length) {
        const entryYes = nid("yes");
        const nEntryYes: FlowNode = { id: entryYes, type: "noop", label: " " };
        g.nodes.push(nEntryYes);
        g.edges.push({ id: nid("e"), source: d.id, target: entryYes, label: "sí" });
        seqToIR(b.then, g, entryYes, merge.id);
      } else {
        g.edges.push({ id: nid("e"), source: d.id, target: merge.id, label: "sí" });
      }

      // rama no
      if (b.else && b.else.length) {
        const entryNo = nid("no");
        const nEntryNo: FlowNode = { id: entryNo, type: "noop", label: " " };
        g.nodes.push(nEntryNo);
        g.edges.push({ id: nid("e"), source: d.id, target: entryNo, label: "no" });
        seqToIR(b.else, g, entryNo, merge.id);
      } else {
        g.edges.push({ id: nid("e"), source: d.id, target: merge.id, label: "no" });
      }

      cur = merge.id;
      continue;
    }

    if (b.kind === "while") {
      const d: FlowNode = { id: nid("dec"), type: "decision", label: `¿${b.cond}?` };
      g.nodes.push(d);
      g.edges.push({ id: nid("e"), source: cur, target: d.id });

      const entryYes = nid("yes");
      const nEntryYes: FlowNode = { id: entryYes, type: "noop", label: " " };
      g.nodes.push(nEntryYes);
      g.edges.push({ id: nid("e"), source: d.id, target: entryYes, label: "sí" });

      // cuerpo
      const before = g.nodes.length + g.edges.length;
      seqToIR(b.body, g, entryYes, d.id);
      // si no hubo cuerpo, al menos regresar al decision
      if (g.nodes.length + g.edges.length === before) {
        g.edges.push({ id: nid("e"), source: entryYes, target: d.id });
      }

      // salida no
      const merge: FlowNode = { id: nid("noop"), type: "noop", label: " " };
      g.nodes.push(merge);
      g.edges.push({ id: nid("e"), source: d.id, target: merge.id, label: "no" });
      cur = merge.id;
      continue;
    }

    if (b.kind === "for") {
      const d: FlowNode = { id: nid("dec"), type: "decision", label: `Para ${b.hdr}` };
      g.nodes.push(d);
      g.edges.push({ id: nid("e"), source: cur, target: d.id });

      const entryYes = nid("yes");
      const nEntryYes: FlowNode = { id: entryYes, type: "noop", label: " " };
      g.nodes.push(nEntryYes);
      g.edges.push({ id: nid("e"), source: d.id, target: entryYes, label: "sí" });

      seqToIR(b.body, g, entryYes, d.id);

      const merge: FlowNode = { id: nid("noop"), type: "noop", label: " " };
      g.nodes.push(merge);
      g.edges.push({ id: nid("e"), source: d.id, target: merge.id, label: "no" });
      cur = merge.id;
      continue;
    }
  }

  // conectar al End
  g.edges.push({ id: nid("e"), source: cur, target: endId });

  if (errors.length) g.errors = errors;
  return g;
}
