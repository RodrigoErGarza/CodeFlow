// app/api/users/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import type { Ctx } from "@/lib/route";
import { getParams } from "@/lib/route";

export async function GET(_req: NextRequest, ctx: Ctx<{ id: string }>) {
  const { id } = await getParams(ctx);

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  return NextResponse.json(user);
}

export async function PUT(req: NextRequest, ctx: Ctx<{ id: string }>) {
  const { id } = await getParams(ctx);
  const body = await req.json();

  const { name, email, role } = body as {
    name?: string;
    email?: string;
    role?: Role | string;
  };

  const data: any = {};
  if (name !== undefined) data.name = name;
  if (email !== undefined) data.email = email;
  if (role !== undefined) data.role = String(role).toUpperCase() as Role;

  const updated = await prisma.user.update({
    where: { id },
    data,
  });

  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, ctx: Ctx<{ id: string }>) {
  const { id } = await getParams(ctx);
  await prisma.user.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
