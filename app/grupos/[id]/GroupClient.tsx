"use client";
import { useState } from "react";

type MemberDTO = {
  id: string;
  role: "TEACHER" | "STUDENT";
  user: { id: string; name: string | null; username: string | null; avatarUrl: string | null; role: string };
};

type Props = {
  initialInfo: { name: string; joinCode?: string };
  initialMembers: MemberDTO[];
};

export default function GroupClient({ initialInfo, initialMembers }: Props) {
  const [members] = useState<MemberDTO[]>(initialMembers);

  return (
    <div className="flex-1 p-6">
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-semibold">{initialInfo?.name}</h1>
        {initialInfo?.joinCode && (
          <div className="text-sm opacity-80">
            Código: <span className="px-2 py-1 rounded bg-white/10">{initialInfo.joinCode}</span>
          </div>
        )}
      </header>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="text-sm opacity-70 mb-2">Miembros</div>

        {members.length === 0 ? (
          <div className="opacity-70">Aún no hay miembros.</div>
        ) : (
          <ul className="divide-y divide-white/10">
            {members.map((m) => {
              const name = m.user.name || m.user.username || "Sin nombre";
              const avatar = m.user.avatarUrl || "/images/avatar-placeholder.png";
              const rol = m.role === "TEACHER" ? "Docente" : "Estudiante";
              return (
                <li key={m.id} className="py-3 flex items-center gap-3">
                  <img
                    src={avatar}
                    alt={name}
                    className="h-9 w-9 rounded-full object-cover"
                    onError={(e) => { (e.currentTarget as HTMLImageElement).src = "/images/avatar-placeholder.png"; }}
                  />
                  <div className="flex-1">
                    <div className="font-medium">{name}</div>
                    <div className="text-xs opacity-70">{rol}</div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
