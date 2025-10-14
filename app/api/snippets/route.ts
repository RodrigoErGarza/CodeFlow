// app/api/snippets/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();
  const language = (searchParams.get("language") || "").trim(); // "python" | "java" | "pseint" | ""
  const page = Math.max(1, Number(searchParams.get("page") || 1));
  const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit") || 10)));
  const skip = (page - 1) * limit;

  const where: any = {
    userId: session.user.id,
    deletedAt: null,
  };
  if (q) {
    where.title = { contains: q, mode: "insensitive" };
  }
  if (language) {
    where.language = language;
  }

  const [items, total] = await Promise.all([
    prisma.snippet.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip,
      take: limit,
      select: {
        id: true,
        title: true,
        language: true,
        updatedAt: true,
        isPublic: true,
        tags: true,
      },
    }),
    prisma.snippet.count({ where }),
  ]);

  return NextResponse.json({
    items,
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  });
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
