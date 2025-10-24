// app/onboarding/google-complete/page.tsx
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const ROLES = ["STUDENT", "TEACHER"] as const;

export default async function GoogleCompletePage({
  searchParams,
}: {
  searchParams: { role?: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const role = (searchParams.role ?? "").toUpperCase();
  if (ROLES.includes(role as any)) {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { role: role as any },
    });
  }

  redirect("/dashboard");
}
