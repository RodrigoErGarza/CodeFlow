"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Sidebar from "@/app/components/Sidebar";

type Group = { id: string; name: string; code: string; _count?: { members: number } };
type SessionUser = { id: string; role: "TEACHER" | "STUDENT" | string };

export default function GroupsPage() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<Group[]>([]);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        // tu endpoint de sesión actual (si tienes). O en su lugar puedes pasar el rol desde layout
        // @ts-ignore
        const s = await fetch("/api/auth/session").then(r => r.json()).catch(() => null);
        if (alive) setUser(s?.user ?? null);

        const g = await fetch("/api/groups", { cache: "no-store" }).then(r => r.json());
        if (alive) setItems(g.items ?? []);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  async function createGroup() {
    setMsg(null);
    const r = await fetch("/api/groups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const j = await r.json();
    if (!r.ok) return setMsg(j?.error || "Error");
    setItems((prev) => [j.group, ...prev]);
    setName("");
  }

  async function joinGroup() {
    setMsg(null);
    const r = await fetch("/api/groups/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    const j = await r.json();
    if (!r.ok) return setMsg(j?.error || "Error");
    setItems((prev) => {
      const exists = prev.some((x) => x.id === j.group.id);
      return exists ? prev : [j.group, ...prev];
    });
    setCode("");
  }

  return (
    <div className="flex">
   

      <main className="flex-1 p-6 space-y-6">
        <h1 className="text-3xl font-semibold">Mis Grupos</h1>

        {user?.role === "TEACHER" ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-sm opacity-70 mb-2">Crear grupo (docente)</div>
            <div className="flex gap-2">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nombre del grupo"
                className="flex-1 rounded bg-black/40 border border-white/10 px-3 py-2"
              />
              <button onClick={createGroup} className="px-4 py-2 rounded bg-indigo-600 text-white">
                Crear
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-sm opacity-70 mb-2">Unirse a un grupo (estudiante)</div>
            <div className="flex gap-2">
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="Código"
                className="w-48 rounded bg-black/40 border border-white/10 px-3 py-2 tracking-widest"
              />
              <button onClick={joinGroup} className="px-4 py-2 rounded bg-indigo-600 text-white">
                Unirse
              </button>
            </div>
          </div>
        )}

        {msg && <div className="text-amber-300">{msg}</div>}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {loading && <div className="opacity-70">Cargando…</div>}
          {!loading && items.length === 0 && <div className="opacity-70">Sin grupos.</div>}
          {items.map((g) => (
            <Link
              key={g.id}
              href={`/grupos/${g.id}`}
              className="rounded-2xl border border-white/10 bg-white/5 p-4 hover:bg-white/10 transition"
            >
              <div className="text-lg font-medium">{g.name}</div>
              <div className="text-sm opacity-70">Miembros: {g._count?.members ?? 0}</div>
            </Link>
          ))}
        </section>
      </main>
    </div>
  );
}
