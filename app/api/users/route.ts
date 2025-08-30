// app/api/users/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request) {
  // ✅ valida sesión aquí y responde JSON si no hay
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const role = searchParams.get("role") as any | null;
    const q = searchParams.get("q") || "";
    const page = Number(searchParams.get("page") || 1);
    const limit = Math.min(Number(searchParams.get("limit") || 20), 100);
    const skip = (page - 1) * limit;

    const where: any = {};
    if (role) where.role = role;
    if (q) {
      where.OR = [
        { email: { contains: q, mode: "insensitive" } },
        { name: { contains: q, mode: "insensitive" } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.user.findMany({ where, skip, take: limit, orderBy: { createdAt: "desc" } }),
      prisma.user.count({ where }),
    ]);

    // ✅ siempre JSON
    return NextResponse.json({ items, total, page, limit });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// (POST se queda como lo tenías; si quieres, aplícale la misma validación de sesión)
