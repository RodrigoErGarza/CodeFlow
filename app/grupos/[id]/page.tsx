import { headers } from "next/headers";
import GroupClient from "./GroupClient";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const h = await headers();
  const cookie = h.get("cookie") ?? "";

  const api = (p: string) =>
    (process.env.NEXT_PUBLIC_BASE_URL ? `${process.env.NEXT_PUBLIC_BASE_URL}${p}` : p);

  const [groupRes, membersRes] = await Promise.all([
    fetch(api(`/api/groups/${id}`), { headers: { cookie }, cache: "no-store" }),
    fetch(api(`/api/groups/${id}/members`), { headers: { cookie }, cache: "no-store" }),
  ]);

  const groupInfo = await groupRes.json();     // { name, joinCode }
  const { members } = await membersRes.json(); // [{ id, role, user: { id,name,username,avatarUrl,role } }]

  return (
    <GroupClient
      initialInfo={groupInfo}
      initialMembers={Array.isArray(members) ? members : []}
    />
  );
}
