// app/api/recover/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateToken, sha256 } from "@/lib/crypto";
import { sendResetEmail } from "@/lib/mail";

export async function POST(req: Request) {
  const { email } = await req.json().catch(() => ({}));
  if (!email || typeof email !== "string") {
    return NextResponse.json({ ok: true }); // respuesta neutra
  }

  // ¿Existe el usuario?
  const user = await prisma.user.findUnique({ where: { email } });
  // Respuesta neutra siempre (no filtramos existencia)
  const generic = NextResponse.json({ ok: true });

  if (!user) return generic;

  // Generar token
  const token = generateToken(32);
  const tokenHash = sha256(token);

  // Guardar con expiración (30 minutos)
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

  await prisma.passwordResetToken.create({
    data: { email, tokenHash, expiresAt },
  });

  // URL a enviar
  const base = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const url = `${base}/reset?token=${token}`;

  // Enviar email (catch para no filtrar errores)
  try {
    await sendResetEmail(email, url);
  } catch {}

  return generic;
}
