// app/api/lessons/[slug]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Ctx, getParams } from "@/lib/route";

export async function GET(_req: NextRequest, ctx: Ctx<{ slug: string }>) {
  const { slug } = await getParams(ctx); // 👈 Next 15: params es Promise

  const lesson = await prisma.lesson.findUnique({
    where: { slug },
    include: { challenges: { select: { slug: true, title: true } } },
  });

  if (!lesson) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ item: lesson });
}
