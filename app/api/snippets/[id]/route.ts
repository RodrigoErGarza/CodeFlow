import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

type Ctx = { params: { id: string } };

export async function GET(_req: Request, { params }: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const item = await prisma.snippet.findFirst({
    where: { id: params.id, userId: session.user.id, deletedAt: null },
  });

  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ item });
}

export async function PUT(req: Request, { params }: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { title, code, language, isPublic, tags } = await req.json();

  // Asegura propiedad del recurso
  const exists = await prisma.snippet.findFirst({
    where: { id: params.id, userId: session.user.id, deletedAt: null },
    select: { id: true },
  });
  if (!exists) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await prisma.snippet.update({
    where: { id: params.id },
    data: {
      ...(title !== undefined ? { title } : {}),
      ...(code !== undefined ? { code } : {}),
      ...(language !== undefined ? { language } : {}),
      ...(isPublic !== undefined ? { isPublic: !!isPublic } : {}),
      ...(Array.isArray(tags) ? { tags } : {}),
      // sube versión cada cambio
      snippetVersion: { increment: 1 },
    },
    select: {
      id: true,
      title: true,
      language: true,
      updatedAt: true,
      isPublic: true,
      tags: true,
      snippetVersion: true,
    },
  });

  return NextResponse.json({ item: updated });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const exists = await prisma.snippet.findFirst({
    where: { id: params.id, userId: session.user.id, deletedAt: null },
    select: { id: true },
  });
  if (!exists) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.snippet.update({
    where: { id: params.id },
    data: { deletedAt: new Date() }, // borrado suave
  });

  return NextResponse.json({ ok: true });
}
