// app/api/profile/me/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions as any);
  const userId = (session as any)?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: "No auth" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      name: true,
      username: true,
      bio: true,
      avatarUrl: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({
    name: user.name ?? "",
    username: user.username ?? "",
    bio: user.bio ?? "",
    avatarUrl: user.avatarUrl ?? null,
  });
}
