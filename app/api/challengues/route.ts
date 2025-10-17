// app/api/challenges/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function GET() {
  const items = await prisma.challenge.findMany({
    orderBy: { title: "asc" },
    select: { slug: true, title: true, language: true, lessonId: true }
  });
  return NextResponse.json({ items });
}
