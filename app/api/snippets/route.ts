import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const items = await prisma.snippet.findMany({
    where: { userId: session.user.id, deletedAt: null },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      title: true,
      language: true,
      updatedAt: true,
      isPublic: true,
      tags: true,
    },
  });

  return NextResponse.json({ items });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { title, code, language, isPublic = false, tags = [] } = await req.json();

  if (!title || !code || !language) {
    return NextResponse.json(
      { error: "title, code y language son obligatorios" },
      { status: 400 }
    );
  }

  const created = await prisma.snippet.create({
    data: {
      title,
      code,
      language,
      isPublic: !!isPublic,
      tags: Array.isArray(tags) ? tags : [],
      userId: session.user.id,
      // snippetVersion inicia en 1 por defecto (schema)
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

  return NextResponse.json({ item: created }, { status: 201 });
}
