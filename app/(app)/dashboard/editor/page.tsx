"use client";
import CodeEditor from "@/app/components/CodeEditor";
import FlowCanvas, {
  type FlowGraph,
  type FlowCanvasHandle,
} from "@/app/components/FlowCanvas";
import { useState, useRef, useEffect } from "react";
import { layoutWithELK } from "@/lib/elk";
import { toPng } from "html-to-image";
import { tracePython } from "@/lib/sim/usePyodide";
import { traceIR } from "@/lib/sim/flowRunner";

type LangKey = "python" | "java" | "pseint";
type Item = {
  id: string;
  title: string;
  language: string;
  updatedAt?: string;
  isPublic?: boolean;
};

export default function EditorPage() {
  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Editor</h1>
      <ClientEditorShell />
    </div>
  );
}

function useDebouncedCallback<T extends (...args: any[]) => void>(
  fn: T,
  delay: number
) {
  const ref = useRef<ReturnType<typeof setTimeout> | null>(null);
  return (...args: Parameters<T>) => {
    if (ref.current) clearTimeout(ref.current);
    ref.current = setTimeout(() => fn(...args), delay);
  };
}

export function ClientEditorShell() {
  // snippet
  const [code, setCode] = useState("");
  const [lang, setLang] = useState<LangKey>("python");
  const [title, setTitle] = useState("Mi snippet");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // listado
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState("");
  const [filterLang, setFilterLang] = useState<"" | LangKey>("");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);

  // UI
  const [msg, setMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [tab, setTab] = useState<"code" | "diagram" | "simulate">("code");
  const [compileError, setCompileError] = useState<string | null>(null);
  const [compiling, setCompiling] = useState(false);

  // graph & canvas
  const [graph, setGraph] = useState<FlowGraph | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const flowRef = useRef<FlowCanvasHandle>(null);
  const importInputRef = useRef<HTMLInputElement>(null);
  const [isPublic, setIsPublic] = useState(false);

  // selección/rango
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [focusRange, setFocusRange] = useState<{ start: number; end: number } | null>(null);

  // simulación
  type Step = { line?: number; nodeId?: string; locals?: Record<string, any>; stdout?: string[]; error?: string };
  const [simSteps, setSimSteps] = useState<Step[]>([]);
  const [simIndex, setSimIndex] = useState(0);
  const currentStep = simSteps[simIndex] || null;
  const [playing, setPlaying] = useState(false);
  const [editorKey, setEditorKey] = useState(0);
  const [highlightLine, setHighlightLine] = useState<number | null>(null);


  function showMsg(text: string) {
    setMsg(text);
    setTimeout(() => setMsg(null), 1800);
  }

  // listado
  async function fetchItems(opts?: { keepPage?: boolean }) {
    setLoading(true);
    try {
      const _page = opts?.keepPage ? page : 1;
      if (!opts?.keepPage) setPage(1);

      const params = new URLSearchParams();
      params.set("q", q);
      params.set("page", String(_page));
      params.set("limit", String(limit));
      if (filterLang) params.set("language", filterLang);

      const res = await fetch(`/api/snippets?` + params.toString(), {
        cache: "no-store",
      });
      const data = await res.json();
      setItems(Array.isArray(data.items) ? data.items : []);
      setTotal(Number(data.total || 0));
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    fetchItems({ keepPage: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, filterLang]);

  // crear/actualizar
  async function persist() {
    if (!title.trim() || !code.trim()) return;
    setSaving(true);
    const nowIso = new Date().toISOString();

    if (selectedId) {
      setItems((prev) =>
        prev.map((it) =>
          it.id === selectedId ? { ...it, title, language: lang, updatedAt: nowIso } : it
        )
      );
    } else {
      const tempId = `temp-${Date.now()}`;
      setItems((prev) => [{ id: tempId, title, language: lang, updatedAt: nowIso }, ...prev]);
      setSelectedId(tempId);
    }

    try {
      if (!selectedId || selectedId.startsWith("temp-")) {
        const res = await fetch("/api/snippets", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, code, language: lang, isPublic }),
        });
        if (!res.ok) throw new Error("No se pudo crear");
        const data = await res.json();
        const realId: string = data?.item?.id || data?.id;
        setItems((prev) => prev.map((it) => (it.id === selectedId ? { ...it, id: realId } : it)));
        setSelectedId(realId);
      } else {
        const res = await fetch(`/api/snippets/${selectedId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, code, language: lang, isPublic }),
        });
        if (!res.ok) throw new Error("No se pudo actualizar");
      }
      setDirty(false);
      setLastSavedAt(new Date().toLocaleTimeString());
      showMsg("Guardado ✅");
    } catch (e: any) {
      showMsg(e.message || "Error al guardar");
      fetchItems({ keepPage: true });
    } finally {
      setSaving(false);
    }
  }
  const debouncedPersist = useDebouncedCallback(persist, 600);
  useEffect(() => {
    if (!title.trim() && !code.trim()) return;
    setDirty(true);
    debouncedPersist();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, code, lang]);

  // aviso al cerrar pestaña
  useEffect(() => {
    function onBeforeUnload(e: BeforeUnloadEvent) {
      if (!dirty) return;
      e.preventDefault();
      e.returnValue = "";
    }
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  // enfoca línea durante simulación
  useEffect(() => {
    if (tab !== "simulate") return;
    const line = currentStep?.line;
    if (line != null) setFocusRange({ start: line, end: line });
  }, [currentStep?.line, tab]);
  
  useEffect(() => {
  if (currentStep?.line != null) {
    setHighlightLine(currentStep.line);
  } else {
    setHighlightLine(null);
  }
}, [currentStep?.line, simIndex]);

  // cargar uno
  async function loadItem(id: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/snippets/${id}`, { cache: "no-store" });
      const data = await res.json();
      if (data?.item) {
        setSelectedId(id);
        setTitle(data.item.title ?? "Mi snippet");
        setLang((data.item.language || "python") as LangKey);
        setCode(data.item.code || "");
        setDirty(false);
        setLastSavedAt(data.item.updatedAt || null);
        setIsPublic(!!data.item.isPublic);

        setSelectedNodeId(null);
        setFocusRange(null);
        setGraph(null);
        setCompileError(null);
        setEditorKey((k) => k + 1);
      }
    } finally {
      setLoading(false);
    }
  }

  // nuevo
  function newSnippet() {
    setSelectedId(null);
    setTitle("Mi snippet");
    setLang("python");
    setCode("");
    setDirty(false);
    setLastSavedAt(null);
    setGraph(null);
    setCompileError(null);
    setSelectedNodeId(null);
    setFocusRange(null);
    setEditorKey((k) => k + 1);
  }

  // eliminar
  async function deleteItem(id: string) {
    if (!confirm("¿Eliminar snippet?")) return;
    setItems((prev) => prev.filter((it) => it.id !== id));
    if (id === selectedId) newSnippet();
    try {
      const res = await fetch(`/api/snippets/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("No se pudo eliminar");
      showMsg("Eliminado 🗑️");
    } catch (e: any) {
      showMsg(e.message || "Error al eliminar");
      fetchItems({ keepPage: true });
    }
  }

  // compilar + layout
  async function compileToGraph() {
    setCompileError(null);
    setCompiling(true);
    setSelectedNodeId(null);
    setFocusRange(null);
    try {
      const res = await fetch("/api/flow/compile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language: lang, code }),
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || "Error al compilar");
      }
      const raw = (await res.json()) as FlowGraph;
      const laid = await layoutWithELK(raw, { direction: "DOWN" });
      setGraph(laid);
    } catch (e: any) {
      setGraph(null);
      setCompileError(e.message || "Error al compilar");
    } finally {
      setCompiling(false);
    }
  }
  async function relayoutGraph() {
    if (!graph) return;
    const laid = await layoutWithELK(graph, { direction: "DOWN" });
    setGraph(laid);
  }

  // preparar simulación
  async function prepareSimulation() {
    setPlaying(false);
    setSimSteps([]);
    setSimIndex(0);

    try {
      if (lang === "python") {
        const frames = await tracePython(code);
        setSimSteps(frames);
        if (frames.length === 0) showMsg("No hubo líneas ejecutadas.");
        setTab("simulate");
        return;
      }

      // PSeInt / Java → IR
      let g = graph;
      if (!g) {
        const res = await fetch("/api/flow/compile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ language: lang, code }),
        });
        if (!res.ok) throw new Error(await res.text());
        const raw = await res.json();
        g = await layoutWithELK(raw, { direction: "DOWN" });
        setGraph(g);
      }

      const frames = traceIR(g!);
      setSimSteps(frames);
      if (frames.length === 0) showMsg("No hubo pasos en la simulación.");
      setTab("simulate");
    } catch (e: any) {
      showMsg(e?.message || "No se pudo simular");
    }
  }
  function findNodeIdByLine(g: FlowGraph | null, line?: number | null): string | null {
  if (!g || line == null) return null;
  const n = (g.nodes as any[]).find(n => n?.meta?.line === line);
  return n?.id || null;
}

  function stepNext() {
    setSimIndex((i) => Math.min(i + 1, Math.max(0, simSteps.length - 1)));
  }
  function stepPrev() {
    setSimIndex((i) => Math.max(i - 1, 0));
  }
  function resetSim() {
    setPlaying(false);
    setSimIndex(0);
  }
  function playPause() {
    if (playing) {
      setPlaying(false);
      return;
    }
    if (simSteps.length === 0) return;
    setPlaying(true);
  }
  useEffect(() => {
    if (!playing) return;
    const t = setInterval(() => {
      setSimIndex((i) => {
        if (i >= simSteps.length - 1) {
          setPlaying(false);
          return i;
        }
        return i + 1;
      });
    }, 600);
    return () => clearInterval(t);
  }, [playing, simSteps.length]);

  useEffect(() => {
  if (tab !== "simulate") return;
  const step = currentStep;
  if (!step) return;

  // 1) editor: resaltar línea si existe
  if (step.line != null) {
    setFocusRange({ start: step.line, end: step.line });
  }

  // 2) diagrama: resaltar nodo (por nodeId directo o por línea)
  let nid: string | null = null;
  if (step.nodeId) nid = step.nodeId;
  else nid = findNodeIdByLine(graph, step.line);

  setSelectedNodeId(nid);

  // (opcional) centrar/fit si estás en Diagrama
  // if (nid && tab === "diagram") flowRef.current?.fitView?.();

}, [simIndex, currentStep, tab, graph]);

  // auto-compila al ir a Diagrama
  useEffect(() => {
    if (tab === "diagram") compileToGraph();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  // público/compartir
  async function togglePublic() {
    if (!selectedId) return;
    const current = items.find((i) => i.id === selectedId);
    const next = !current?.isPublic;
    setItems((prev) => prev.map((i) => (i.id === selectedId ? { ...i, isPublic: next } : i)));
    try {
      const res = await fetch(`/api/snippets/${selectedId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublic: next }),
      });
      if (!res.ok) throw new Error("No se pudo actualizar visibilidad");
    } catch {
      setItems((prev) =>
        prev.map((i) => (i.id === selectedId ? { ...i, isPublic: !next } : i))
      );
      showMsg("No se pudo cambiar visibilidad");
    }
  }
  function sharePublicLink() {
    if (!selectedId) return;
    const it = items.find((i) => i.id === selectedId);
    if (!it?.isPublic) {
      showMsg("Pon el snippet en Público para compartir");
      return;
    }
    const url = `${window.location.origin}/p/${selectedId}`;
    navigator.clipboard.writeText(url);
    showMsg("Link copiado 📋");
  }

  // export/import (lo de siempre)
  function download(blobOrDataUrl: Blob | string, filename: string) {
    const a = document.createElement("a");
    if (typeof blobOrDataUrl === "string") a.href = blobOrDataUrl;
    else a.href = URL.createObjectURL(blobOrDataUrl);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    if (typeof blobOrDataUrl !== "string") setTimeout(() => URL.revokeObjectURL(a.href), 0);
  }
  async function exportPNG() {
    if (!canvasRef.current || !graph || compileError) return;
    const toHide = Array.from(
      canvasRef.current.querySelectorAll(".react-flow__minimap, .react-flow__controls")
    ) as HTMLElement[];
    toHide.forEach((el) => (el.style.visibility = "hidden"));
    try {
      const dataUrl = await toPng(canvasRef.current, {
        cacheBust: true,
        backgroundColor: "#0D1321",
        skipFonts: true,
        filter: (node) => {
          const el = node as HTMLElement;
          if (!el) return true;
          if (el.classList?.contains("react-flow__minimap")) return false;
          if (el.classList?.contains("react-flow__controls")) return false;
          return true;
        },
      });
      download(dataUrl, `${title || "diagrama"}.png`);
    } finally {
      toHide.forEach((el) => (el.style.visibility = ""));
    }
  }
  function exportSVG() {
    if (!canvasRef.current || !graph || compileError) return;
    const svg = canvasRef.current.querySelector("svg");
    if (!svg) return;
    const clone = svg.cloneNode(true) as SVGSVGElement;
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    clone.setAttribute("xmlns:xlink", "http://www.w3.org/1999/xlink");
    const xml = new XMLSerializer().serializeToString(clone);
    const blob = new Blob([`<?xml version="1.0" encoding="UTF-8"?>\n${xml}`], {
      type: "image/svg+xml;charset=utf-8",
    });
    download(blob, `${title || "diagrama"}.svg`);
  }
  function exportJSON() {
    if (!graph || compileError) return;
    const blob = new Blob([JSON.stringify(graph, null, 2)], {
      type: "application/json",
    });
    download(blob, `${title || "diagrama"}.json`);
  }
  async function importJSON(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as FlowGraph;
      const laid = await layoutWithELK(parsed, { direction: "DOWN" });
      setGraph(laid);
      setTab("diagram");
      showMsg("Diagrama importado ✅");
    } catch {
      showMsg("Archivo JSON inválido");
    } finally {
      if (importInputRef.current) importInputRef.current.value = "";
    }
  }

  // paginación
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const canPrev = page > 1;
  const canNext = page < totalPages;

  const selected = selectedId ? items.find((i) => i.id === selectedId) : null;


  return (
    <div className="grid grid-cols-12 gap-4">
      {/* Lateral */}
      <aside className="col-span-3 space-y-3">
        <div className="flex items-center gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar título…"
            className="flex-1 px-3 py-2 rounded border border-white/10 bg-white/5"
          />
          <button
            onClick={() => fetchItems({ keepPage: false })}
            className="px-3 py-2 rounded border border-white/10 bg-white/10 hover:bg-white/20"
          >
            Buscar
          </button>
        </div>

        <div className="flex items-center justify-between">
          <label className="text-sm opacity-80">Lenguaje:</label>
          <select
            value={filterLang}
            onChange={(e) => setFilterLang(e.target.value as any)}
            className="px-2 py-1 rounded border border-white/10 bg-black text-white"
          >
            <option value="">Todos</option>
            <option value="python">Python</option>
            <option value="java">Java</option>
            <option value="pseint">PSeInt</option>
          </select>
        </div>

        <div className="rounded-xl border border-white/10 divide-y divide-white/10 overflow-hidden">
          {loading && items.length === 0 && (
            <div className="p-3 text-sm opacity-70">Cargando...</div>
          )}
          {items.map((it) => (
            <div
              key={it.id}
              className={`flex items-center justify-between px-3 py-2 text-sm hover:bg-white/5 cursor-pointer ${
                selectedId === it.id ? "bg-white/10" : ""
              }`}
              onClick={() => loadItem(it.id)}
            >
              <div className="min-w-0">
                <div className="font-medium truncate">{it.title}</div>
                <div className="opacity-60 text-xs truncate">
                  {it.language}
                  {it.isPublic ? " • público" : ""}
                </div>
              </div>
              <button
                className="text-xs opacity-70 hover:opacity-100"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteItem(it.id);
                }}
              >
                Borrar
              </button>
            </div>
          ))}
          {items.length === 0 && !loading && (
            <div className="p-3 text-sm opacity-70">Sin resultados.</div>
          )}
        </div>

        <div className="flex items-center justify-between text-sm opacity-80">
          <button
            disabled={!canPrev}
            onClick={() => canPrev && setPage((p) => p - 1)}
            className="px-2 py-1 border border-white/10 rounded disabled:opacity-40"
          >
            ← Anterior
          </button>
          <div>
            Página {page} / {totalPages}
          </div>
          <button
            disabled={!canNext}
            onClick={() => canNext && setPage((p) => p + 1)}
            className="px-2 py-1 border border-white/10 rounded disabled:opacity-40"
          >
            Siguiente →
          </button>
        </div>
      </aside>

      {/* Área principal */}
      <section className="col-span-9 space-y-3">
        <div className="flex flex-wrap gap-2 items-center">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="px-3 py-2 rounded border border-white/10 bg-white/5 w-72"
            placeholder="Título del snippet"
          />
        <button
            onClick={newSnippet}
            className="px-3 py-2 rounded bg-white/10 hover:bg-white/20 border border-white/10"
          >
            Nuevo
          </button>

          <span className="text-sm opacity-80">
            {saving
              ? "Guardando…"
              : dirty
              ? "Cambios sin guardar"
              : lastSavedAt
              ? `Guardado a las ${lastSavedAt}`
              : "Listo"}
          </span>

          
        </div>

        {/* Pestañas */}
        <div className="flex gap-1 rounded-lg border border-white/10 p-1 bg-white/5">
          <button
            onClick={() => setTab("code")}
            className={`px-3 py-1 rounded ${
              tab === "code" ? "bg-white/15" : "hover:bg-white/10"
            }`}
          >
            Código
          </button>
          <button
            onClick={() => setTab("diagram")}
            className={`px-3 py-1 rounded ${
              tab === "diagram" ? "bg-white/15" : "hover:bg-white/10"
            }`}
          >
            Diagrama
          </button>
          <button
            onClick={() => setTab("simulate")}
            className={`px-3 py-1 rounded ${
              tab === "simulate" ? "bg-white/15" : "hover:bg-white/10"
            }`}
          >
            Simular
          </button>
        </div>

        {/* CODE */}
        {tab === "code" && (
          <CodeEditor
            key={editorKey}
            initialCode={code}
            initialLang={lang}
            // enfocar rango si viene de un nodo clicado
            {...({ focusRange } as any)}
            onChange={(c, l) => {
              setCode(c);
              setLang(l as LangKey);
            }}
          />
        )}

        {/* DIAGRAM */}
        {tab === "diagram" && (
          <>
            {compiling && <div className="text-sm opacity-80">Compilando…</div>}
            {compileError && (
              <div className="text-sm text-red-400">
                No se pudo compilar: {compileError}
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={compileToGraph}
                className="px-3 py-2 rounded border border-white/10 bg-white/10 hover:bg-white/20"
              >
                Actualizar diagrama
              </button>
              <button
                onClick={() => flowRef.current?.fitView?.()}
                className="px-3 py-2 rounded border border-white/10 bg-white/10 hover:bg-white/20"
                disabled={!graph}
              >
                Ajustar a pantalla
              </button>
              <button
                onClick={relayoutGraph}
                className="px-3 py-2 rounded border border-white/10 bg-white/10 hover:bg-white/20"
                disabled={!graph}
              >
                Reordenar
              </button>
              <button
                onClick={exportPNG}
                className="px-3 py-2 rounded bg-gradient-to-r from-indigo-500 to-blue-500 text-white"
                disabled={!graph || !!compileError}
              >
                PNG
              </button>
              <button
                onClick={exportSVG}
                className="px-3 py-2 rounded border border-white/10 bg-white/10 hover:bg-white/20"
                disabled={!graph || !!compileError}
              >
                SVG
              </button>
              <button
                onClick={exportJSON}
                className="px-3 py-2 rounded border border-white/10 bg-white/10 hover:bg-white/20"
                disabled={!graph || !!compileError}
              >
                JSON
              </button>
              <button
                onClick={() => importInputRef.current?.click()}
                className="px-3 py-2 rounded border border-white/10 bg-white/10 hover:bg-white/20"
              >
                Importar JSON
              </button>
              <input
                ref={importInputRef}
                type="file"
                accept="application/json"
                hidden
                onChange={importJSON}
              />
            </div>

            <div
              ref={canvasRef}
              className="rounded-xl border border-white/10 overflow-hidden"
            >
              <FlowCanvas
                ref={flowRef}
                graph={graph}
                selectedNodeId={selectedNodeId}
                onNodeClick={({ id, range }) => {
                  setSelectedNodeId(id);
                  if (range?.start != null && range?.end != null) {
                    setTab("code");
                    setFocusRange({ start: range.start, end: range.end });
                  }
                }}
              />
            </div>
          </>
        )}

        {/* SIMULATE */}
        {tab === "simulate" && (
          <>
            <CodeEditor
              key={`sim-${selectedId ?? "new"}-${lang}`}// 👈 fuerza refresh limpio del Monaco en esta pestaña
              initialCode={code}
              initialLang={lang}
              readOnly
              {...({ highlightLine} as any)}
            />

            <div className="flex items-center gap-2">
              <button onClick={prepareSimulation} className="px-3 py-2 rounded border border-white/10 bg-white/10 hover:bg-white/20">Preparar</button>
              <button onClick={stepPrev} className="px-3 py-2 rounded border border-white/10 bg-white/10 hover:bg-white/20" disabled={simIndex <= 0}>◀ Paso</button>
              <button onClick={playPause} className="px-3 py-2 rounded bg-gradient-to-r from-indigo-500 to-blue-500 text-white" disabled={simSteps.length === 0}>{playing ? "Pausar" : "Reproducir"}</button>
              <button onClick={stepNext} className="px-3 py-2 rounded border border-white/10 bg-white/10 hover:bg-white/20" disabled={simIndex >= simSteps.length - 1}>Paso ▶</button>
              <button onClick={resetSim} className="px-3 py-2 rounded border border-white/10 bg-white/10 hover:bg-white/20">Reiniciar</button>
              <span className="text-sm opacity-80">{simSteps.length ? `Paso ${simIndex + 1}/${simSteps.length}` : "Sin traza"}</span>
            </div>

            <div className="rounded-xl border border-white/10 p-3 bg-white/5">
              {currentStep?.error ? (
                <div className="text-red-400 text-sm">Error: {currentStep.error}</div>
              ) : (
                <>
                  <div className="text-sm opacity-80 mb-2">Variables</div>
                  {currentStep?.locals && Object.keys(currentStep.locals).length ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                      {Object.entries(currentStep.locals).map(([k, v]) => (
                        <div key={k} className="px-2 py-1 rounded bg-black/30 border border-white/10">
                          <span className="opacity-70">{k}</span>
                          <span className="opacity-40 px-1">=</span>
                          <span className="break-all">{String(v)}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm opacity-60">Sin variables en este paso.</div>
                  )}

                  <div className="mt-3 rounded-xl border border-white/10 p-3 bg-white/5">
                    <div className="text-sm opacity-80 mb-2">Salida </div>
                    {currentStep?.stdout && currentStep.stdout.length > 0 ? (
                      <pre className="text-sm opacity-90 whitespace-pre-wrap">
                        {currentStep.stdout.join("\n")}
                      </pre>
                    ) : (
                      <div className="text-sm opacity-60">Sin salida por ahora.</div>
                    )}
                  </div>
                </>
              )}
            </div>
          </>
        )}


        {msg && <div className="text-sm opacity-80">{msg}</div>}
      </section>
    </div>
  );
}
