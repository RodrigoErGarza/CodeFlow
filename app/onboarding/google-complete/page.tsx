// app/onboarding/google-complete/page.tsx
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// (opcional) evita caché si te interesa
export const dynamic = "force-dynamic";

type SP = { role?: string };

/**
 * Next 15.5 expone `searchParams` como Promise en tiempo de build.
 * Por eso lo tipamos como Promise<SP> | undefined y hacemos `await`.
 */
export default async function GoogleCompletePage(props: {
  searchParams?: Promise<SP>;
}) {
  // 1) Proteger ruta: si no hay sesión => /login
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/login");
  }

  // 2) Leer ?role=... desde la URL (maneja Promise u undefined)
  const sp = (await props.searchParams) ?? {};
  const role = (sp.role ?? "").toUpperCase();

  // 3) Si viene un rol válido, persiste en BD
  if (role === "STUDENT" || role === "TEACHER") {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { role: role as any },
    });
  }

  // 4) En todos los casos, al dashboard
  redirect("/dashboard");
}
