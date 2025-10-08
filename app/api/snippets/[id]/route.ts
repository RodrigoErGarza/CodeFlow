import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

type Ctx = { params: { id: string } };

export async function GET(_req: Request, { params }: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const item = await prisma.snippet.findFirst({   // <-- singular
    where: { id: params.id, userId: session.user.id },
  });

  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ item });
}

export async function PUT(req: Request, { params }: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { title, code, language } = await req.json();
  const updated = await prisma.snippet.update({   // <-- singular
    where: { id: params.id },
    data: { title, code, language },
    select: { id: true, title: true, updatedAt: true },
  });

  return NextResponse.json({ item: updated });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await prisma.snippet.delete({                  // <-- singular
    where: { id: params.id },
  });

  return NextResponse.json({ ok: true });
}
