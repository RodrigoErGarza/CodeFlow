import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { isPublic } = await req.json().catch(() => ({}));
  if (typeof isPublic !== "boolean") {
    return NextResponse.json({ error: "isPublic (boolean) requerido" }, { status: 400 });
  }

  // updateMany + count para asegurar pertenencia
  const result = await prisma.snippet.updateMany({
    where: { id: params.id, userId: session.user.id, deletedAt: null },
    data: { isPublic },
  });

  if (result.count === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const item = await prisma.snippet.findUnique({
    where: { id: params.id },
    select: { id: true, isPublic: true },
  });

  return NextResponse.json({ ok: true, item });
}
