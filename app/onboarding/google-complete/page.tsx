// app/onboarding/google-complete/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic"; // garantiza que no se cachee

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const role = (req.nextUrl.searchParams.get("role") || "").toUpperCase();

  if (role === "STUDENT" || role === "TEACHER") {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { role: role as any },
    });
  }

  return NextResponse.redirect(new URL("/dashboard", req.url));
}
