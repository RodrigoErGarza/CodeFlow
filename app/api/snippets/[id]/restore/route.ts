import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Ctx } from "@/lib/route";
import { getParams } from "@/lib/route";

export async function PATCH(_req: NextRequest, ctx: Ctx<{ id: string }>) {
  const { id } = await getParams(ctx);

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await prisma.snippet.updateMany({
    where: { id, userId: session.user.id, deletedAt: { not: null } },
    data: { deletedAt: null },
  });

  if (result.count === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
