import { headers } from "next/headers";
import GroupClient from "./GroupClient";

// En Next 15, el tipo oficial de `params` es una Promise<...>
type Ctx = {
  params: Promise<{ id: string }>;
  // (opcional) si usas search params en algún momento:
  // searchParams?: Promise<Record<string, string | string[]>> | Record<string, string | string[]>;
};

export default async function Page(ctx: Ctx) {
  // Desempaquetamos la promesa de params (Next 15)
  const { id } = await ctx.params;

  const h = await headers();
  const cookie = h.get("cookie") ?? "";

  const api = (p: string) =>
    process.env.NEXT_PUBLIC_BASE_URL
      ? `${process.env.NEXT_PUBLIC_BASE_URL}${p}`
      : p;

  const [groupRes, membersRes, sessionRes] = await Promise.all([
    fetch(api(`/api/groups/${id}`), { headers: { cookie }, cache: "no-store" }),
    fetch(api(`/api/groups/${id}/members`), { headers: { cookie }, cache: "no-store" }),
    fetch(api(`/api/auth/session`), { headers: { cookie }, cache: "no-store" }).catch(() => null),
  ]);

  const info = await groupRes.json();          // { id, name, joinCode, createdById }
  const { members } = await membersRes.json(); // [{ id, role, user: {...} }]
  const session = sessionRes ? await sessionRes.json().catch(() => null) : null;

  return (
    <GroupClient
      groupid={id}
      initialInfo={info}
      initialMembers={members}
      meId={session?.user?.id || null}
      isCreator={info?.createdById === (session?.user?.id || "")}
      meRole={(session?.user as any)?.role || "STUDENT"}
    />
  );
}
