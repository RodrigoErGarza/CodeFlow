// app/api/register/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
const bcrypt = require("bcrypt");
import { Role } from "@prisma/client";

export async function POST(req: Request) {
  try {
    const { name, email, password, role } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email y contraseña son obligatorios" }, { status: 400 });
    }

    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) {
      return NextResponse.json({ error: "El email ya está registrado" }, { status: 409 });
    }

    // Reglas de negocio: si quieres restringir quién puede ser TEACHER/ADMIN, cambia aquí.
    const roleValue: Role = (role === "TEACHER" || role === "ADMIN") ? role : "STUDENT";

    const hash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { name, email, role: roleValue, passwordHash: hash },
      select: { id: true, email: true, name: true, role: true, createdAt: true },
    });

    return NextResponse.json({ user }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
