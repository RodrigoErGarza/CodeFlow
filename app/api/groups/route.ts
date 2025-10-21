import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { randomBytes } from "crypto";

function genCode(len = 6) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const buf = randomBytes(len);
  let s = "";
  for (let i = 0; i < len; i++) s += alphabet[buf[i] % alphabet.length];
  return s;
}

export async function GET() {
  const session = await getServerSession(authOptions as any);
  const userId = (session as any)?.user?.id;
  if (!userId) return NextResponse.json({ error: "No auth" }, { status: 401 });

  const [created, memberOf] = await Promise.all([
    prisma.group.findMany({
      where: { createdById: userId },
      include: { _count: { select: { members: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.groupMember.findMany({
      where: { userId },
      include: { group: { include: { _count: { select: { members: true } } } } },
      orderBy: { joinedAt: "desc" },
    }),
  ]);

  const joined = memberOf.map((gm) => gm.group);
  const map = new Map<string, any>();
  for (const g of [...created, ...joined]) map.set(g.id, g);

  return NextResponse.json({ items: [...map.values()] });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions as any);
  const user = (session as any)?.user;
  if (!user) return NextResponse.json({ error: "No auth" }, { status: 401 });

  if (user.role !== "TEACHER")
    return NextResponse.json({ error: "Solo docentes" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const name = (body?.name || "").toString().trim();
  if (!name) return NextResponse.json({ error: "Nombre requerido" }, { status: 400 });

  // generar joinCode único
  let joinCode = genCode();
  for (;;) {
    const found = await prisma.group.findUnique({ where: { joinCode } });
    if (!found) break;
    joinCode = genCode();
  }

  const group = await prisma.group.create({
    data: { name, joinCode, createdById: user.id },
  });

  return NextResponse.json({ ok: true, group });
}
