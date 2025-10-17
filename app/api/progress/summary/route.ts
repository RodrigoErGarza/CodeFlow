// app/api/progress/summary/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function GET() {
  // TODO: reemplazar por el userId real cuando tengas auth
  const userId = "demo-user";
  const rows = await prisma.userProgress.findMany({
    where: { userId, completed: true },
    select: { lessonId: true },
  });
  return NextResponse.json({
    userId,
    completedLessonIds: rows.map((r) => r.lessonId),
  });
}
