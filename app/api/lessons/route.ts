// app/api/lessons/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function GET() {
  const lessons = await prisma.lesson.findMany({
    orderBy: { number: "asc" },
    select: { id: true, number: true, slug: true, title: true, description: true }
  });
  return NextResponse.json({ items: lessons });
}
