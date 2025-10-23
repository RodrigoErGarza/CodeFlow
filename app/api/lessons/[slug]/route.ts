// app/api/lessons/[slug]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_: NextRequest, { params }: { params: { slug: string } }) {
  const { slug } = params;
  const lesson = await prisma.lesson.findUnique({
    where: { slug: params.slug },
    include: { challenges: { select: { slug: true, title: true } } }
  });
  if (!lesson) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ item: lesson });
}
