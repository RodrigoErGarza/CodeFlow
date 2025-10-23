import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  
  const item = await prisma.snippet.findFirst({
    where: { id: params.id, isPublic: true, deletedAt: null },
    select: { id: true, title: true, code: true, language: true, updatedAt: true },
  });
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ item });
}
