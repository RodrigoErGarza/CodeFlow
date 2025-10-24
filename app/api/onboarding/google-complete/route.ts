// app/onboarding/google-complete/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const ROLES = new Set(["STUDENT", "TEACHER"]);

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      // Sin sesión → login
      return NextResponse.redirect(new URL("/login", req.url));
    }

    const url = new URL(req.url);
    const incomingRole = (url.searchParams.get("role") || "").toUpperCase();

    if (ROLES.has(incomingRole)) {
      await prisma.user.update({
        where: { id: session.user.id },
        data: { role: incomingRole as any },
      });
    }

    // En cualquier caso, lleva al dashboard
    return NextResponse.redirect(new URL("/dashboard", req.url));
  } catch (e) {
    // En fallo inesperado, también manda al dashboard (o a /login si prefieres)
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }
}
