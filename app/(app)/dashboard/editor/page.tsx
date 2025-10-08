"use client";
import CodeEditor from "@/app/components/CodeEditor";
import { useState, useEffect } from "react";

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

export function ClientEditorShell() {
  const [code, setCode] = useState("");
  const [lang, setLang] = useState<LangKey>("python");
  const [title, setTitle] = useState("Mi snippet");
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  // Cargar lista de snippets del usuario
  async function fetchItems() {
    setLoading(true);
    try {
      const res = await fetch("/api/snippets", { cache: "no-store" });
      const data = await res.json();
      setItems(data.items || []);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    fetchItems();
  }, []);

  // Guardar
  async function saveSnippet() {
    if (!title.trim() || !code.trim()) {
      setMsg("Escribe un título y algo de código.");
      return;
    }
    setLoading(true);
    try {
      if (!selectedId) {
        // crear
        const res = await fetch("/api/snippets", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, code, language: lang }),
        });
        if (!res.ok) throw new Error("Error al guardar");
      } else {
        // actualizar
        const res = await fetch(`/api/snippets/${selectedId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, code, language: lang }),
        });
        if (!res.ok) throw new Error("Error al actualizar");
      }
      setMsg("Guardado ✅");
      await fetchItems();
    } catch (e: any) {
      setMsg(e.message || "Error");
    } finally {
      setLoading(false);
      setTimeout(() => setMsg(null), 2000);
    }
  }

  // Cargar uno
  async function loadItem(id: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/snippets/${id}`);
      const data = await res.json();
      if (data?.item) {
        setSelectedId(id);
        setTitle(data.item.title);
        setLang((data.item.language || "python") as LangKey);
        setCode(data.item.code || "");
      }
    } finally {
      setLoading(false);
    }
  }

  // Nuevo
  function newSnippet() {
    setSelectedId(null);
    setTitle("Mi snippet");
    setLang("python");
    setCode("");
  }

  // Borrar
  async function deleteItem(id: string) {
    if (!confirm("¿Eliminar snippet?")) return;
    setLoading(true);
    try {
      await fetch(`/api/snippets/${id}`, { method: "DELETE" });
      if (id === selectedId) newSnippet();
      await fetchItems();
    } finally {
      setLoading(false);
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
        <div className="flex gap-2 items-center">
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
          <button
            onClick={saveSnippet}
            className="px-3 py-2 rounded bg-gradient-to-r from-indigo-500 to-blue-500 text-white"
            disabled={loading}
          >
            {selectedId ? "Guardar cambios" : "Guardar"}
          </button>
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
