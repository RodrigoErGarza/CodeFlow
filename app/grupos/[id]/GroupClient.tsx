"use client";
import { useMemo, useState } from "react";

type MemberDTO = {
  id: string; // id del GroupMember
  role: "TEACHER" | "STUDENT";
  user: {
    id: string;
    name: string | null;
    username: string | null;
    avatarUrl: string | null;
    role: string;
  };
};

type Props = {
  groupid: string;
  initialInfo: { id?: string; name: string; joinCode?: string; createdById?: string };
  initialMembers: MemberDTO[];
  meId: string | null;
  isCreator: boolean;
  meRole: "TEACHER" | "STUDENT" | string;
};

export default function GroupClient({
  groupid,
  initialInfo,
  initialMembers,
  meId,
  isCreator,
  meRole,
}: Props) {
  const [members, setMembers] = useState<MemberDTO[]>(initialMembers);
  const iAmTeacher = useMemo(() => meRole === "TEACHER", [meRole]);

  async function removeMember(userId: string) {
    if (!isCreator) return;
    const ok = confirm("¿Eliminar a este miembro del grupo?");
    if (!ok) return;

    // optimista
    setMembers((prev) => prev.filter((m) => m.user.id !== userId));

    const res = await fetch(`/api/groups/${groupid}/members/${userId}`, { method: "DELETE" });
    if (!res.ok) {
      // revertir si falla
      const { members: restore } = await fetch(`/api/groups/${groupid}/members`, { cache: "no-store" }).then((r) => r.json());
      setMembers(restore);
      alert("No fue posible eliminar al miembro.");
    }
  }

  async function leaveGroup() {
    const ok = confirm("¿Quieres abandonar este grupo?");
    if (!ok || !meId) return;

    // optimista
    setMembers((prev) => prev.filter((m) => m.user.id !== meId));

    const res = await fetch(`/api/groups/${groupid}/members/${meId}`, { method: "DELETE" });
    if (!res.ok) {
      const { members: restore } = await fetch(`/api/groups/${groupid}/members`, { cache: "no-store" }).then((r) => r.json());
      setMembers(restore);
      alert("No fue posible abandonar el grupo.");
    } else {
      // si abandonó, puedes redirigir a /grupos si quieres
      // location.href = "/grupos";
    }
  }

  async function deleteGroup() {
    if (!isCreator) return;
    const ok = confirm("Esta acción eliminará el grupo y sus miembros. ¿Continuar?");
    if (!ok) return;

    const res = await fetch(`/api/groups/${groupid}`, { method: "DELETE" });
    if (res.ok) {
      // redirige a la lista de grupos
      location.href = "/grupos";
    } else {
      alert("No fue posible eliminar el grupo.");
    }
  }

  return (
    <div className="flex-1 p-6">
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-semibold">{initialInfo?.name}</h1>

        <div className="flex items-center gap-3">
          {initialInfo?.joinCode && (
            <div className="text-sm opacity-80">
              Código: <span className="px-2 py-1 rounded bg-white/10">{initialInfo.joinCode}</span>
            </div>
          )}

          {/* Botón eliminar grupo SOLO para el creador */}
          {isCreator && (
            <button
              onClick={deleteGroup}
              className="text-sm px-3 py-1.5 rounded bg-red-600/80 hover:bg-red-600 text-white"
              title="Eliminar grupo"
            >
              Eliminar grupo
            </button>
          )}

          {/* Abandonar grupo para no-creadores (estudiante o docente no creador) */}
          {!isCreator && (
            <button
              onClick={leaveGroup}
              className="text-sm px-3 py-1.5 rounded bg-white/10 hover:bg-white/20"
              title="Abandonar grupo"
            >
              Abandonar grupo
            </button>
          )}
        </div>
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

              const showRemove =
                isCreator && // solo creador
                m.user.id !== initialInfo?.createdById && // nunca al creador
                m.role === "STUDENT"; // solo estudiantes

              return (
                <li key={m.id} className="py-3 flex items-center gap-3">
                  <img
                    src={avatar}
                    alt={name}
                    className="h-9 w-9 rounded-full object-cover"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = "/images/avatar-placeholder.png";
                    }}
                  />

                  <div className="flex-1">
                    <div className="font-medium">{name}</div>
                    <div className="text-xs opacity-70">{rol}</div>
                  </div>

                  {/* Acción a la derecha: no modifica tu layout, solo añade un botón discreto */}
                  {showRemove && (
                    <button
                      onClick={() => removeMember(m.user.id)}
                      className="text-xs px-2 py-1 rounded bg-white/10 hover:bg-white/20"
                      title="Eliminar miembro"
                    >
                      Eliminar
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
