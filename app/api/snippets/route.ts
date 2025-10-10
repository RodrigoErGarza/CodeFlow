import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

/**
 * GET /api/snippets
 * Query params:
 *  - q: string (busca en título y código)
 *  - language: "python"|"java"|"pseint"
 *  - tag: string (filtra snippets que contengan ese tag)
 *  - isPublic: "true" | "false"
 *  - page: number (>=1)       default: 1
 *  - limit: number (1..100)   default: 20
 *  - sort: "updated" | "created" | "title" (default "updated")
 *  - dir: "asc" | "desc" (default "desc")
 */
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const q = (url.searchParams.get("q") || "").trim();
  const language = url.searchParams.get("language") || undefined;
  const tag = url.searchParams.get("tag") || undefined;

  const isPublicParam = url.searchParams.get("isPublic");
  const isPublic =
    isPublicParam === "true" ? true : isPublicParam === "false" ? false : undefined;

  const page = Math.max(parseInt(url.searchParams.get("page") || "1", 10) || 1, 1);
  const limitRaw = parseInt(url.searchParams.get("limit") || "20", 10) || 20;
  const limit = Math.min(Math.max(limitRaw, 1), 100);
  const skip = (page - 1) * limit;

  const sort = url.searchParams.get("sort") || "updated";
  const dir = (url.searchParams.get("dir") || "desc") as "asc" | "desc";

  // Ordenamiento seguro
  const orderBy =
    sort === "title"
      ? { title: dir }
      : sort === "created"
      ? { createdAt: dir }
      : { updatedAt: dir }; // "updated" por defecto

  // Filtros base: mis snippets no borrados
  const where: any = {
    userId: session.user.id,
    deletedAt: null,
  };

  if (language) where.language = language;
  if (typeof isPublic === "boolean") where.isPublic = isPublic;

  // Si viene un tag, buscamos que el array lo contenga
  if (tag) where.tags = { has: tag };

  // Búsqueda textual en título o código (simple)
  if (q) {
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { code: { contains: q, mode: "insensitive" } },
    ];
  }

  // total para paginación
  const total = await prisma.snippet.count({ where });

  const items = await prisma.snippet.findMany({
    where,
    orderBy,
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
  });

  return NextResponse.json({
    items,
    total,
    page,
    limit,
    hasNext: skip + items.length < total,
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
