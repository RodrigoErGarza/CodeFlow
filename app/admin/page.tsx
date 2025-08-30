import { requireRole } from "@/lib/acl";

export default async function AdminPage() {
  const session = await requireRole(["ADMIN"]);

  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold">Panel Admin</h1>
      <p>Bienvenido {session.user.email}, tienes rol {session.user.role}</p>
    </main>
  );
}
