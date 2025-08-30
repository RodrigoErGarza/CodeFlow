"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

type User = { id: string; email: string; name?: string | null; role: string };

export default function Home() {
  const { status, data: session } = useSession();
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status !== "authenticated") return; // 👈 no llames hasta tener sesión

    const load = async () => {
      setError(null);
      try {
        const res = await fetch("/api/users", { headers: { Accept: "application/json" } });

        if (!res.ok) {
          const text = await res.text(); // puede traer {"error":"Unauthorized"} o HTML si algo raro pasa
          setError(`/api/users ${res.status}: ${text.slice(0, 120)}`);
          return;
        }

        const ct = res.headers.get("content-type") || "";
        if (!ct.includes("application/json")) {
          const text = await res.text();
          setError(`Respuesta no-JSON: ${text.slice(0, 120)}`);
          return;
        }

        const data = await res.json();
        setUsers(data.items ?? []);
      } catch (e: any) {
        setError(e.message || "Error de red");
      }
    };

    load();
  }, [status]);

  if (status === "loading") {
    return <main className="p-6">Cargando sesión…</main>;
  }
  if (status === "unauthenticated") {
    return <main className="p-6">Inicia sesión para continuar.</main>;
  }

  return (
    <main className="p-6">
      <h1 className="text-xl font-bold mb-4">Usuarios</h1>
      {error && <p className="text-red-600 text-sm mb-2">{error}</p>}

      <ul className="space-y-2">
        {users.map((u) => (
          <li key={u.id} className="border rounded p-2">
            <b>{u.name || "Sin nombre"}</b> — {u.email} ({u.role})
          </li>
        ))}
      </ul>
    </main>
  );
}