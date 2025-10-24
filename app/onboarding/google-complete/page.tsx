// app/onboarding/google-complete/page.tsx
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Lista blanca de roles permitidos (ajústala si tienes más)
const ROLES = new Set(["STUDENT", "TEACHER", "ADMIN"]);

type PageProps = {
  searchParams?: { role?: string };
};

export default async function GoogleCompletePage({ searchParams }: PageProps) {
  // Debe ejecutarse en el servidor
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    // Si no hay sesión, vuelve al login
    redirect("/login");
  }

  // Normaliza el rol y, si es válido, lo guarda
  const role = (searchParams?.role ?? "").toUpperCase();
  if (ROLES.has(role)) {
    try {
      await prisma.user.update({
        where: { id: session.user.id },
        data: { role: role as any },
      });
    } catch {
      // si falla el update, igual seguimos al dashboard para no romper el flujo
    }
  }

  // Siempre lleva al dashboard
  redirect("/dashboard");
}
