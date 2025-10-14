// lib/parsers/java.ts
export type FlowGraph = {
  nodes: Array<{ id: string; type?: string; label?: string }>;
  edges: Array<{ id: string; source: string; target: string; label?: string }>;
};

let idc = 0;
const nid = (p = "n") => `${p}${++idc}`;

export function compileJavaToFlow(src: string): FlowGraph {
  idc = 0;

  // 1) quitar comentarios y normalizar
  let code = src
    .replace(/\/\/.*$/gm, "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\r/g, "");

  // 2) si viene con class/main, extrae el cuerpo del método main si existe
  const mainMatch = code.match(/public\s+static\s+void\s+main\s*\([\s\S]*?\)\s*\{([\s\S]*)\}$/m);
  if (mainMatch) code = mainMatch[1];

  // 3) tokenizar por llaves y puntos y coma para bloques sencillos
  //    mantenemos una "pila" de bloques (if/else/while/for)
  const start = nid("start");
  const end = nid("end");

  const nodes: FlowGraph["nodes"] = [
    { id: start, type: "start", label: "Start" },
    { id: end, type: "end", label: "End" },
  ];
  const edges: FlowGraph["edges"] = [];

  type Ctx =
    | { kind: "seq"; last: string }
    | { kind: "if"; cond: string; condId: string; thenEntry: string | null; elseEntry: string | null; joinId: string }
    | { kind: "while"; cond: string; condId: string; bodyEntry: string | null; afterId: string }
    | { kind: "for"; initId: string | null; cond: string; condId: string; incId: string | null; bodyEntry: string | null; afterId: string };

  const stack: Ctx[] = [{ kind: "seq", last: start }];

  // util para añadir un nodo de acción/print/asignación a la secuencia actual
  function pushAction(label: string) {
    const actionId = nid("a");
    nodes.push({ id: actionId, label });
    // unir desde el "last" de la secuencia más cercana
    const topSeq = [...stack].reverse().find(s => s.kind === "seq") as Extract<Ctx, {kind:"seq"}>;
    edges.push({ id: nid("e"), source: topSeq.last, target: actionId });
    topSeq.last = actionId;
  }

  // Avance línea por línea, pero respetando llaves
  // Partimos por dividir en "tokens" de bloque: {, }, ;  (conservando texto)
  const tokens: string[] = [];
  {
    let buf = "";
    for (let i = 0; i < code.length; i++) {
      const ch = code[i];
      if (ch === "{" || ch === "}" || ch === ";") {
        if (buf.trim()) tokens.push(buf.trim());
        tokens.push(ch);
        buf = "";
      } else {
        buf += ch;
      }
    }
    if (buf.trim()) tokens.push(buf.trim());
  }

  // helpers para abrir/cerrar bloques
  function openIf(condText: string) {
    const condId = nid("d");
    nodes.push({ id: condId, type: "decision", label: condText });
    const topSeq = stack[stack.length - 1] as Extract<Ctx, {kind:"seq"}>;
    edges.push({ id: nid("e"), source: topSeq.last, target: condId });
    const joinId = nid("j");
    nodes.push({ id: joinId, label: "" });
    const ctx: Ctx = { kind: "if", cond: condText, condId, thenEntry: null, elseEntry: null, joinId };
    // next de la secuencia será el condId temporalmente
    topSeq.last = condId;
    stack.push(ctx);
    // abrir secuencia para rama THEN
    stack.push({ kind: "seq", last: condId });
  }

  function openWhile(condText: string) {
    const condId = nid("w");
    nodes.push({ id: condId, type: "decision", label: condText });
    const topSeq = stack[stack.length - 1] as Extract<Ctx, {kind:"seq"}>;
    edges.push({ id: nid("e"), source: topSeq.last, target: condId });
    const afterId = nid("wa");
    nodes.push({ id: afterId, label: "" });
    const ctx: Ctx = { kind: "while", cond: condText, condId, bodyEntry: null, afterId };
    topSeq.last = condId;
    stack.push(ctx);
    // body como nueva secuencia desde cond (rama Sí)
    const bodySeq: Ctx = { kind: "seq", last: condId };
    stack.push(bodySeq);
  }

  function openFor(header: string) {
    // muy simple: for (init; cond; inc)
    const m = header.match(/for\s*\(\s*(.*?);(.*?);(.*?)\s*\)$/);
    const init = m?.[1]?.trim() || "";
    const cond = m?.[2]?.trim() || "cond";
    const inc  = m?.[3]?.trim() || "";

    const topSeq = stack[stack.length - 1] as Extract<Ctx, {kind:"seq"}>;
    let initId: string | null = null;
    if (init) {
      initId = nid("fi");
      nodes.push({ id: initId, label: init });
      edges.push({ id: nid("e"), source: topSeq.last, target: initId });
      topSeq.last = initId;
    }

    const condId = nid("fd");
    nodes.push({ id: condId, type: "decision", label: cond });
    edges.push({ id: nid("e"), source: topSeq.last, target: condId });
    const afterId = nid("fa");
    nodes.push({ id: afterId, label: "" });

    const ctx: Ctx = { kind: "for", initId, cond, condId, incId: null, bodyEntry: null, afterId };
    stack.push(ctx);
    // body como secuencia (rama Sí)
    stack.push({ kind: "seq", last: condId });

    // guardamos inc como nodo que conectaremos al cerrar body
    if (inc) {
      const incId = nid("fu");
      nodes.push({ id: incId, label: inc });
      (ctx as any).incId = incId;
    }
  }

  // recorrido principal
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];

    if (t === "{") {
      // ya abrimos secuencias para if/while/for al ver su cabecera;
      // las llaves sólo delimitan, así que no hacemos nada aquí.
      continue;
    }
    if (t === "}") {
      // cerramos el bloque actual: puede ser THEN, ELSE, WHILE body, FOR body
      // quitamos la secuencia top hasta topar con un ctx de control
      while (stack.length && stack[stack.length - 1].kind === "seq") {
        stack.pop();
      }
      const ctx = stack.pop();
      if (!ctx) continue;

      if (ctx.kind === "if") {
        const seqTop = stack[stack.length - 1] as Extract<Ctx, {kind:"seq"}>;
        // la secuencia que acabamos de cerrar es THEN o ELSE según si ELSE ya estaba tomado
        if (!ctx.thenEntry) {
          ctx.thenEntry = (seqTop.last !== ctx.condId) ? seqTop.last : ctx.condId;
          // abrir rama ELSE si viene "else" inmediatamente
          if (tokens[i + 1] && /^else\b/.test(tokens[i + 1])) {
            i++; // consumir "else"
            // abrir secuencia para ELSE
            stack.push(ctx);
            stack.push({ kind: "seq", last: ctx.condId });
            continue;
          }
        } else {
          ctx.elseEntry = seqTop.last !== ctx.condId ? seqTop.last : ctx.condId;
        }
        // unir condId → thenEntry (sí) y condId → elseEntry/no (a join)
        if (ctx.thenEntry && ctx.thenEntry !== ctx.condId) {
          edges.push({ id: nid("e"), source: ctx.condId, target: ctx.thenEntry, label: "sí" });
          edges.push({ id: nid("e"), source: ctx.thenEntry, target: ctx.joinId });
        } else {
          edges.push({ id: nid("e"), source: ctx.condId, target: ctx.joinId, label: "sí" });
        }
        if (ctx.elseEntry && ctx.elseEntry !== ctx.condId) {
          edges.push({ id: nid("e"), source: ctx.condId, target: ctx.elseEntry, label: "no" });
          edges.push({ id: nid("e"), source: ctx.elseEntry, target: ctx.joinId });
        } else {
          edges.push({ id: nid("e"), source: ctx.condId, target: ctx.joinId, label: "no" });
        }
        // continuar la secuencia padre desde join
        const parentSeq = stack[stack.length - 1] as Extract<Ctx, {kind:"seq"}>;
        parentSeq.last = ctx.joinId;
      } else if (ctx.kind === "while") {
        // la secuencia justo antes que sacamos es el body
        const parentSeq = stack[stack.length - 1] as Extract<Ctx, {kind:"seq"}>;
        const bodyEnd = parentSeq.last;
        // back-edge bodyEnd → condId (sí-loop)
        if (bodyEnd !== ctx.condId) {
          edges.push({ id: nid("e"), source: bodyEnd, target: ctx.condId });
        }
        // condId (no) → after
        edges.push({ id: nid("e"), source: ctx.condId, target: ctx.afterId, label: "no" });
        parentSeq.last = ctx.afterId;
      } else if (ctx.kind === "for") {
        const parentSeq = stack[stack.length - 1] as Extract<Ctx, {kind:"seq"}>;
        const bodyEnd = parentSeq.last;
        // body → (inc?) → cond
        if ((ctx as any).incId) {
          const incId = (ctx as any).incId as string;
          edges.push({ id: nid("e"), source: bodyEnd, target: incId });
          edges.push({ id: nid("e"), source: incId, target: ctx.condId });
        } else {
          edges.push({ id: nid("e"), source: bodyEnd, target: ctx.condId });
        }
        // cond (no) → after
        edges.push({ id: nid("e"), source: ctx.condId, target: ctx.afterId, label: "no" });
        parentSeq.last = ctx.afterId;
      }
      continue;
    }

    if (t === ";") continue; // separados arriba

    // Cabeceras de control
    if (/^if\s*\(/.test(t)) {
      const cond = t.replace(/^if\s*\(|\)\s*$/g, "").trim();
      openIf(cond);
      continue;
    }
    if (/^else\b/.test(t)) {
      // se maneja al cerrar el if (arriba)
      continue;
    }
    if (/^while\s*\(/.test(t)) {
      const cond = t.replace(/^while\s*\(|\)\s*$/g, "").trim();
      openWhile(cond);
      continue;
    }
    if (/^for\s*\(/.test(t)) {
      openFor(t);
      continue;
    }

    // acciones simples
    // println
    const print = t.match(/System\.out\.println\s*\((.*)\)\s*$/);
    if (print) {
      pushAction(`print(${print[1].trim()})`);
      continue;
    }
    // asignaciones / expresiones terminadas en ;
    if (/[A-Za-z_]\w*\s*=[^=].*$/.test(t) || /^(int|double|float|long|boolean|String)\b/.test(t)) {
      pushAction(t.replace(/\s+/g, " "));
      continue;
    }
    // cualquier otra instrucción como acción genérica
    pushAction(t.replace(/\s+/g, " "));
  }

  // cerrar secuencias abiertas hasta llegar al principio
  const seqTop = [...stack].reverse().find(s => s.kind === "seq") as Extract<Ctx, {kind:"seq"}>;
  if (seqTop && seqTop.last) {
    edges.push({ id: nid("e"), source: seqTop.last, target: end });
  } else {
    edges.push({ id: nid("e"), source: start, target: end });
  }

  return { nodes, edges };
}
