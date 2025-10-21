import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const challenges = await prisma.challenge.findMany({
      orderBy: { slug: "asc" },
      select: {
        id: true,
        slug: true,
        title: true,
        description: true,
        language: true,
        starterCode: true,
        testsJson: true,
      },
    });

    return NextResponse.json(challenges);
  } catch (error) {
    console.error("Error fetching challenges:", error);
    return NextResponse.json({ error: "Failed to fetch challenges" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
