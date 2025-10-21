"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/app/components/Sidebar";

type Member = {
  user: { id: string; name: string | null; email: string; avatarUrl: string | null };
  role: "MEMBER" | "ASSISTANT" | "LEAD";
};
type Data = {
  group: { id: string; name: string; code: string; createdById: string };
  owner: { id: string; name: string | null; email: string; avatarUrl: string | null } | null;
  members: Member[];
};
type SessionUser = { id: string; role: "TEACHER" | "STUDENT" | string };

export default function GroupDetail({ params }: { params: { id: string } }) {
  const [data, setData] = useState<Data | null>(null);
  const [user, setUser] = useState<SessionUser | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      const s = await fetch("/api/auth/session").then(r => r.json()).catch(() => null);
      if (alive) setUser(s?.user ?? null);
      const d = await fetch(`/api/groups/${params.id}/members`, { cache: "no-store" }).then(r => r.json());
      if (alive) setData(d);
    })();
    return () => { alive = false; };
  }, [params.id]);

  return (
    <div className="flex">
      <Sidebar />

      <main className="flex-1 p-6 space-y-6">
        {!data ? (
          <div className="opacity-70">Cargando…</div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-semibold">{data.group.name}</h1>
              {user?.role === "TEACHER" && (
                <div className="text-sm opacity-80">
                  Código: <span className="font-mono px-2 py-1 rounded bg-black/40 border border-white/10">{data.group.code}</span>
                </div>
              )}
            </div>

            <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="text-sm opacity-70 mb-3">Miembros</div>
              <ul className="space-y-2">
                {data.owner && (
                  <li className="flex items-center gap-3">
                    <img
                      src={data.owner.avatarUrl || "/images/avatar-placeholder.png"}
                      className="w-9 h-9 rounded-full object-cover"
                    />
                    <div className="flex-1">
                      <div className="text-sm">{data.owner.name || data.owner.email}</div>
                      <div className="text-xs opacity-60">Docente</div>
                    </div>
                  </li>
                )}
                {data.members.map((m) => (
                  <li key={m.user.id} className="flex items-center gap-3">
                    <img
                      src={m.user.avatarUrl || "/images/avatar-placeholder.png"}
                      className="w-9 h-9 rounded-full object-cover"
                    />
                    <div className="flex-1">
                      <div className="text-sm">{m.user.name || m.user.email}</div>
                      <div className="text-xs opacity-60">{m.role === "MEMBER" ? "Estudiante" : m.role}</div>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
