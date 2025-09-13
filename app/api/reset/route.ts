// app/api/reset/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sha256 } from "@/lib/crypto";
const bcrypt = require("bcrypt");

export async function POST(req: Request) {
  const { token, password } = await req.json().catch(() => ({}));

  if (!token || typeof token !== "string" || !password || password.length < 8) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const tokenHash = sha256(token);

  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
  });

  if (
    !record ||
    record.usedAt ||
    new Date(record.expiresAt).getTime() < Date.now()
  ) {
    return NextResponse.json(
      { error: "Enlace inválido o expirado" },
      { status: 400 }
    );
  }

  const hash = await bcrypt.hash(password, 10);

  await prisma.$transaction([
    prisma.user.update({
      where: { email: record.email },
      data: { passwordHash: hash },
    }),
    prisma.passwordResetToken.update({
      where: { tokenHash },
      data: { usedAt: new Date() },
    }),
  ]);

  return NextResponse.json({ ok: true });
}
