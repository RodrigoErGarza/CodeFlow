// app/onboarding/google-complete/page.tsx
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type SP = { role?: string };

export default async function GoogleCompletePage(props: { searchParams?: Promise<SP> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const sp = (await props.searchParams) ?? {};
  const role = (sp.role ?? "").toUpperCase();

  if (role === "STUDENT" || role === "TEACHER") {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { role: role as any },
    });
  }

  redirect("/dashboard");
}
