// app/api/public/snippets/[id]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Ctx, getParams } from "@/lib/route";

export async function GET(_req: Request, ctx: Ctx<{ id: string }>) {
  const { id } = await getParams(ctx); // 👈 params ahora es Promise

  const item = await prisma.snippet.findFirst({
    where: { id, isPublic: true, deletedAt: null },
    select: { id: true, title: true, code: true, language: true, updatedAt: true },
  });

  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ item });
}
