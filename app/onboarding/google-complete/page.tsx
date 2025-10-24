// app/onboarding/google-complete/page.tsx
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const ROLES = ["STUDENT", "TEACHER"] as const;

type Search = { role?: string | string[] };

export default async function GoogleCompletePage({
  searchParams,
}: {
  // En Next 15 puede ser Promise
  searchParams: Promise<Search>;
}) {
  const sp = await searchParams; // ← importante
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/login");
  }

  // role puede venir como string o string[]
  const roleParam = Array.isArray(sp.role) ? sp.role[0] : sp.role;
  const role = (roleParam ?? "").toUpperCase();

  if (ROLES.includes(role as any)) {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { role: role as any },
    });
  }

  redirect("/dashboard");
}
