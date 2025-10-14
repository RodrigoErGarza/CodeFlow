"use client";
import CodeEditor from "@/app/components/CodeEditor";
import FlowCanvas, { type FlowGraph } from "@/app/components/FlowCanvas";
import { useState, useRef, useEffect } from "react";
import { layoutWithELK } from "@/lib/elk";
import { toPng } from "html-to-image";

export default function EditorPage() {
  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Editor</h1>
      <ClientEditorShell />
    </div>
  );
}

// ----------------------- Client shell -----------------------

type LangKey = "python" | "java" | "pseint";
type Item = { id: string; title: string; language: string; updatedAt?: string };

function useDebouncedCallback<T extends (...args: any[]) => void>(fn: T, delay: number) {
  const ref = useRef<ReturnType<typeof setTimeout> | null>(null);
  return (...args: Parameters<T>) => {
    if (ref.current) clearTimeout(ref.current);
    ref.current = setTimeout(() => fn(...args), delay);
  };
}

export function ClientEditorShell() {
  const [code, setCode] = useState("");
  const [lang, setLang] = useState<LangKey>("python");
  const [title, setTitle] = useState("Mi snippet");
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // UI state
  const [msg, setMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);

  // pestaña y grafo
  const [tab, setTab] = useState<"code" | "diagram">("code");
  const [graph, setGraph] = useState<FlowGraph | null>(null);
  const [compileError, setCompileError] = useState<string | null>(null);

  // refs para export/import
  const canvasRef = useRef<HTMLDivElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);

  function showMsg(text: string) {
    setMsg(text);
    setTimeout(() => setMsg(null), 1800);
  }

  // --------- listado ----------
  async function fetchItems() {
    setLoading(true);
    try {
      const res = await fetch("/api/snippets?q=&page=1&limit=50", { cache: "no-store" });
      const data = await res.json();
      setItems(Array.isArray(data.items) ? data.items : []);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    fetchItems();
  }, []);

  // --------- crear/actualizar (con guardado optimista) ----------
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
          body: JSON.stringify({ title, code, language: lang }),
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
          body: JSON.stringify({ title, code, language: lang }),
        });
        if (!res.ok) throw new Error("No se pudo actualizar");
      }

      setDirty(false);
      setLastSavedAt(new Date().toLocaleTimeString());
      showMsg("Guardado ✅");
    } catch (e: any) {
      showMsg(e.message || "Error al guardar");
      fetchItems();
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

  useEffect(() => {
    function onBeforeUnload(e: BeforeUnloadEvent) {
      if (!dirty) return;
      e.preventDefault();
      e.returnValue = "";
    }
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  // --------- cargar uno ----------
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
        setGraph(null);
        setCompileError(null);
      }
    } finally {
      setLoading(false);
    }
  }

  // --------- nuevo ----------
  function newSnippet() {
    setSelectedId(null);
    setTitle("Mi snippet");
    setLang("python");
    setCode("");
    setDirty(false);
    setLastSavedAt(null);
    setGraph(null);
    setCompileError(null);
  }

  // --------- eliminar ----------
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
      fetchItems();
    }
  }

  // --------- compilar a grafo + LAYOUT ELK ----------
  async function compileToGraph() {
    setCompileError(null);
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
    }
  }

  // Reaplicar layout al grafo actual
  async function relayoutGraph() {
    if (!graph) return;
    const laid = await layoutWithELK(graph, { direction: "DOWN" });
    setGraph(laid);
  }

  // ---------------- EXPORT/IMPORT helpers ----------------
  function download(blobOrDataUrl: Blob | string, filename: string) {
    const a = document.createElement("a");
    if (typeof blobOrDataUrl === "string") {
      a.href = blobOrDataUrl;
    } else {
      a.href = URL.createObjectURL(blobOrDataUrl);
    }
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    if (typeof blobOrDataUrl !== "string") {
      setTimeout(() => URL.revokeObjectURL(a.href), 0);
    }
  }

  // Exportar PNG del contenedor del diagrama
  async function exportPNG() {
    if (!canvasRef.current) return;

    // Oculta momentáneamente minimap/controles para no exportarlos
    const toHide = Array.from(
      canvasRef.current.querySelectorAll(".react-flow__minimap, .react-flow__controls")
    ) as HTMLElement[];
    toHide.forEach((el) => (el.style.visibility = "hidden"));

    try {
      const dataUrl = await toPng(canvasRef.current, {
        cacheBust: true,
        backgroundColor: "#0D1321",
        skipFonts: true, // evita logs por @font-face
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

  // Exportar SVG (serializando el <svg> de React Flow)
  function exportSVG() {
    if (!canvasRef.current) return;
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

  // Exportar JSON del grafo
  function exportJSON() {
    if (!graph) return;
    const text = JSON.stringify(graph, null, 2);
    const blob = new Blob([text], { type: "application/json" });
    download(blob, `${title || "diagrama"}.json`);
  }

  // Importar JSON (restaura grafo y aplica layout opcional)
  async function importJSON(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as FlowGraph;
      // opcional: asegurar layout
      const laid = await layoutWithELK(parsed, { direction: "DOWN" });
      setGraph(laid);
      setTab("diagram");
      showMsg("Diagrama importado ✅");
    } catch {
      showMsg("Archivo JSON inválido");
    } finally {
      // permite volver a seleccionar el mismo archivo si el usuario quiere
      if (importInputRef.current) importInputRef.current.value = "";
    }
  }

  // Auto-compila al ir a la pestaña de diagrama
  useEffect(() => {
    if (tab === "diagram") compileToGraph();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  return (
    <div className="grid grid-cols-12 gap-4">
      {/* Panel lateral */}
      <aside className="col-span-3 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Mis snippets</h2>
          <button
            className="text-sm px-2 py-1 rounded bg-white/10 hover:bg-white/20 border border-white/10"
            onClick={fetchItems}
          >
            Recargar
          </button>
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
                <div className="opacity-60 text-xs truncate">{it.language}</div>
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
            <div className="p-3 text-sm opacity-70">Aún no tienes snippets.</div>
          )}
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

          {/* Estado de guardado */}
          <span className="text-sm opacity-80">
            {saving
              ? "Guardando…"
              : dirty
              ? "Cambios sin guardar"
              : lastSavedAt
              ? `Guardado a las ${lastSavedAt}`
              : "Listo"}
          </span>

          {/* Pestañas */}
          <div className="ml-auto flex gap-1 rounded-lg border border-white/10 p-1 bg-white/5">
            <button
              onClick={() => setTab("code")}
              className={`px-3 py-1 rounded ${tab === "code" ? "bg-white/15" : "hover:bg-white/10"}`}
            >
              Código
            </button>
            <button
              onClick={() => setTab("diagram")}
              className={`px-3 py-1 rounded ${tab === "diagram" ? "bg-white/15" : "hover:bg-white/10"}`}
            >
              Diagrama
            </button>
          </div>

          {tab === "diagram" && (
            <>
              <button
                onClick={compileToGraph}
                className="px-3 py-2 rounded border border-white/10 bg-white/10 hover:bg-white/20"
              >
                Actualizar diagrama
              </button>
              <button
                onClick={relayoutGraph}
                className="px-3 py-2 rounded border border-white/10 bg-white/10 hover:bg-white/20"
                disabled={!graph}
              >
                Reordenar diagrama
              </button>

              {/* Export/Import */}
              <button
                onClick={exportPNG}
                className="px-3 py-2 rounded bg-gradient-to-r from-indigo-500 to-blue-500 text-white"
                disabled={!graph}
              >
                PNG
              </button>
              <button
                onClick={exportSVG}
                className="px-3 py-2 rounded border border-white/10 bg-white/10 hover:bg-white/20"
                disabled={!graph}
              >
                SVG
              </button>
              <button
                onClick={exportJSON}
                className="px-3 py-2 rounded border border-white/10 bg-white/10 hover:bg-white/20"
                disabled={!graph}
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
            </>
          )}

          {msg && <span className="text-sm opacity-80">{msg}</span>}
        </div>

        {tab === "code" ? (
          <CodeEditor
            initialCode={code}
            initialLang={lang}
            onChange={(c, l) => {
              setCode(c);
              setLang(l as LangKey);
            }}
          />
        ) : (
          <>
            {compileError && <div className="text-sm text-red-400">{compileError}</div>}

            {/* Contenedor del diagrama para exportar */}
            <div ref={canvasRef} className="rounded-xl border border-white/10 overflow-hidden">
              <FlowCanvas graph={graph} />
            </div>
          </>
        )}
      </section>
    </div>
  );
}
