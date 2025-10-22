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
  try {
    const session = await getServerSession(authOptions as any);
    const userId = (session as any)?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { name } = await req.json();
    if (!name || typeof name !== "string") {
      return NextResponse.json({ error: "Nombre inválido" }, { status: 400 });
    }

    // genera un código único de 6 caracteres
    const joinCode = randomBytes(3).toString("hex").toUpperCase();

    // ✅ CREA EL GRUPO Y AGREGA AL DOCENTE COMO MIEMBRO
    // POST /api/groups  (crear grupo)
    const group = await prisma.group.create({
      data: {
        name,
        joinCode,
        createdById: userId,
        members: {
          create: { userId, role: "TEACHER" }, // ← el creador queda como miembro-docente
        },
      },
      select: { id: true, name: true, joinCode: true },
    });


    return NextResponse.json(group);
  } catch (e) {
    console.error("Error creando grupo:", e);
    return NextResponse.json(
      { error: "Error al crear grupo" },
      { status: 500 }
    );
  }
}
