import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import type { Ctx } from "@/lib/route";
import { getParams } from "@/lib/route";

export async function GET(_req: NextRequest, ctx: Ctx<{ id: string }>) {
  const { id } = await getParams(ctx);

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const item = await prisma.snippet.findFirst({
    where: { id, userId: session.user.id, deletedAt: null },
  });

  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ item });
}

export async function PUT(req: NextRequest, ctx: Ctx<{ id: string }>) {
  const { id } = await getParams(ctx);

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { title, code, language, isPublic, tags } = await req.json();

  const exists = await prisma.snippet.findFirst({
    where: { id, userId: session.user.id, deletedAt: null },
    select: { id: true },
  });
  if (!exists) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await prisma.snippet.update({
    where: { id },
    data: {
      ...(title !== undefined ? { title } : {}),
      ...(code !== undefined ? { code } : {}),
      ...(language !== undefined ? { language } : {}),
      ...(isPublic !== undefined ? { isPublic: !!isPublic } : {}),
      ...(Array.isArray(tags) ? { tags } : {}),
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

export async function DELETE(req: NextRequest, ctx: Ctx<{ id: string }>) {
  const { id } = await getParams(ctx);

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const hard = new URL(req.url).searchParams.get("hard") === "true";

  if (hard) {
    const res = await prisma.snippet.deleteMany({
      where: { id, userId: session.user.id },
    });
    if (res.count === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ ok: true, hard: true });
  }

  const res = await prisma.snippet.updateMany({
    where: { id, userId: session.user.id, deletedAt: null },
    data: { deletedAt: new Date() },
  });
  if (res.count === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ ok: true });
}
