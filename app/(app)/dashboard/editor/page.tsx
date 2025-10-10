"use client";
import CodeEditor from "@/app/components/CodeEditor";
import { useState, useRef, useEffect } from "react";

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

  // --------- helpers ----------
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

    // Optimista: aplica cambios en UI antes de ir al servidor
    if (selectedId) {
      setItems((prev) =>
        prev.map((it) =>
          it.id === selectedId ? { ...it, title, language: lang, updatedAt: nowIso } : it
        )
      );
    } else {
      // crear “fantasma” mientras llega el id real
      const tempId = `temp-${Date.now()}`;
      setItems((prev) => [
        { id: tempId, title, language: lang, updatedAt: nowIso },
        ...prev,
      ]);
      setSelectedId(tempId);
    }

    try {
      if (!selectedId || selectedId.startsWith("temp-")) {
        // POST (crear)
        const res = await fetch("/api/snippets", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, code, language: lang }),
        });
        if (!res.ok) throw new Error("No se pudo crear");

        const data = await res.json(); // { id, ... }
        const realId: string = data?.item?.id || data?.id;

        // Reemplaza temp-id por el real
        setItems((prev) =>
          prev.map((it) =>
            it.id === selectedId ? { ...it, id: realId } : it
          )
        );
        setSelectedId(realId);
      } else {
        // PUT (actualizar)
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
      // opcional: refetch para reconciliar en caso de error
      fetchItems();
    } finally {
      setSaving(false);
    }
  }

  // Debounce: guarda 600 ms después de dejar de teclear/cambiar
  const debouncedPersist = useDebouncedCallback(persist, 600);

  // Marca como sucio y dispara autosave por cambios
  useEffect(() => {
    if (!title.trim() && !code.trim()) return;
    setDirty(true);
    debouncedPersist();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, code, lang]);

  // Aviso si hay cambios sin guardar al cerrar pestaña
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
  }

  // --------- eliminar ----------
  async function deleteItem(id: string) {
    if (!confirm("¿Eliminar snippet?")) return;
    // Optimista: quítalo de la lista ya
    setItems((prev) => prev.filter((it) => it.id !== id));
    if (id === selectedId) newSnippet();

    try {
      const res = await fetch(`/api/snippets/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("No se pudo eliminar");
      showMsg("Eliminado 🗑️");
    } catch (e: any) {
      showMsg(e.message || "Error al eliminar");
      // Recupera la lista si hubo error
      fetchItems();
    }
  }

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

      {/* Editor */}
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

          {msg && <span className="text-sm opacity-80">{msg}</span>}
        </div>

        <CodeEditor
          initialCode={code}
          initialLang={lang}
          onChange={(c, l) => {
            setCode(c);
            setLang(l);
          }}
        />
      </section>
    </div>
  );
}