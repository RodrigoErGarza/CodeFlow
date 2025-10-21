import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";// ajusta la ruta si es distinta
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ percents: {} }, { status: 200 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });
  if (!user) return NextResponse.json({ percents: {} }, { status: 200 });

  // Trae % de todas las unidades para el usuario
  const ups = await prisma.userUnitProgress.findMany({
    where: { userId: user.id },
    select: {
      percent: true,
      unit: { select: { number: true } },
    },
  });

  const percents: Record<number, number> = {};
  for (const u of ups) percents[u.unit.number] = u.percent ?? 0;

  return NextResponse.json({ percents });
}
