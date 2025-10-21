import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions as any);
  const user = (session as any)?.user;
  if (!user) return NextResponse.json({ error: "No auth" }, { status: 401 });

  const group = await prisma.group.findUnique({ where: { id: params.id } });
  if (!group) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const members = await prisma.groupMember.findMany({
    where: { groupId: group.id },
    select: { userId: true },
  });
  const userIds = members.map(m => m.userId);

  if (userIds.length === 0) {
    return NextResponse.json({ groupId: group.id, members: 0, units: [] });
  }

  // agrupa por unitId (tu schema), y saca promedio de percent
  const gb = await prisma.userUnitProgress.groupBy({
    by: ["unitId"],
    where: { userId: { in: userIds } },
    _avg: { percent: true },
  });

  // traer metadatos de las units (number, title) para presentarlo bonito
  const unitIds = gb.map(g => g.unitId);
  const units = await prisma.unit.findMany({
    where: { id: { in: unitIds } },
    select: { id: true, number: true, title: true },
  });
  const uMap = new Map(units.map(u => [u.id, u]));

  const rows = gb.map(g => {
    const u = uMap.get(g.unitId);
    return {
      unitId: g.unitId,
      unitNumber: u?.number ?? null,
      unitTitle: u?.title ?? null,
      avgPercent: Math.round(g._avg.percent ?? 0),
    };
  }).sort((a, b) => (a.unitNumber ?? 0) - (b.unitNumber ?? 0));

  return NextResponse.json({
    groupId: group.id,
    members: userIds.length,
    units: rows,
  });
}
