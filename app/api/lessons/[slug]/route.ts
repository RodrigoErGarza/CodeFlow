// app/api/lessons/[slug]/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(_: Request, { params }: { params: { slug: string } }) {
  const lesson = await prisma.lesson.findUnique({
    where: { slug: params.slug },
    include: { challenges: { select: { slug: true, title: true } } }
  });
  if (!lesson) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ item: lesson });
}
