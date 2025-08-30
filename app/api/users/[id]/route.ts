// app/api/users/[id]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { Role } from "@prisma/client";

const UpdateUserSchema = z.object({
  name: z.string().min(1).optional(),
  role: z.nativeEnum(Role).optional(),
});

type Ctx = { params: { id: string } };

export async function GET(_req: Request, { params }: Ctx) {
  try {
    const user = await prisma.user.findUnique({ where: { id: params.id } });
    if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(user);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: Ctx) {
  try {
    const body = await req.json();
    const parsed = UpdateUserSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid body", details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const user = await prisma.user.update({
      where: { id: params.id },
      data: parsed.data,
    });
    return NextResponse.json(user);
  } catch (err: any) {
    if (err?.code === "P2025") {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    console.error(err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: Ctx) {
  try {
    await prisma.user.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    if (err?.code === "P2025") {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    console.error(err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
