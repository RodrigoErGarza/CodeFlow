// app/api/profile/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions as any);
  const userId = (session as any)?.user?.id;
  if (!userId) return NextResponse.json({ error: "No auth" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      username: true,
      bio: true,
      avatarUrl: true,
    },
  });

  return NextResponse.json(user);
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions as any);
  const userId = (session as any)?.user?.id;
  if (!userId) return NextResponse.json({ error: "No auth" }, { status: 401 });

  const body = await req.json();
  const { name, username, bio } = body || {};

  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      name: name ?? undefined,
      username: username ?? undefined,
      bio: bio ?? undefined,
    },
    select: { id: true },
  });

  return NextResponse.json({ ok: true, id: user.id });
}
