import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import AppShell from "@/app/components/AppShell";
import DashboardPage from "./dashboard/page";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  const user = session?.user;

  return (
    <AppShell user={user as any}>
      <DashboardPage user={user} />
    </AppShell>
  );
}