// app/api/progress/complete/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function POST(req: Request) {
  const { lessonSlug } = await req.json();

  const lesson = await prisma.lesson.findUnique({ where: { slug: lessonSlug } });
  if (!lesson) return NextResponse.json({ error: "Lección no encontrada" }, { status: 404 });

  const userId = "demo-user"; // ← TODO: sustituir por tu user real
  await prisma.userProgress.upsert({
    where: { userId_lessonId: { userId, lessonId: lesson.id } },
    update: { completed: true, completedAt: new Date() },
    create: { userId, lessonId: lesson.id, completed: true, completedAt: new Date() }
  });

  return NextResponse.json({ ok: true });
}
