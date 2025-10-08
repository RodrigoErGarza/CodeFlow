import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ items: [] });

  const items = await prisma.snippet.findMany({  // <-- singular
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
    select: { id: true, title: true, language: true, updatedAt: true },
  });

  return NextResponse.json({ items });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { title, code, language } = await req.json();

  if (!title || !code || !language) {
    return NextResponse.json({ error: "Faltan campos" }, { status: 400 });
  }

  const created = await prisma.snippet.create({  // <-- singular
    data: { title, code, language, userId: session.user.id },
    select: { id: true, title: true },
  });

  return NextResponse.json({ item: created }, { status: 201 });
}
