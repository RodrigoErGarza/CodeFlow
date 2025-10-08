import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import AppShell from "@/app/components/AppShell";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  const user = session?.user;

  return (
    <AppShell user={user as any}>
      {children}  {/* <- AQUÍ debe ir el contenido de cada página */}
    </AppShell>
  );
}
