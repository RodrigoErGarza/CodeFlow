// app/api/flow/compile/route.ts
import { NextResponse } from "next/server";
import { parsePSeIntToIR } from "../../../../lib/flow/parsers/pseint";
import { parsePythonToIR } from "../../../../lib/flow/parsers/python";

export async function POST(req: Request) {
  try {
    const { code, language } = await req.json();

    if (typeof code !== "string" || !code.trim()) {
      return NextResponse.json({ error: "code requerido" }, { status: 400 });
    }
    if (!["pseint", "python"].includes(language)) {
      return NextResponse.json({ error: "language inválido" }, { status: 400 });
    }

    const graph =
      language === "pseint"
        ? parsePSeIntToIR(code)
        : parsePythonToIR(code);

    return NextResponse.json(graph, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Error" }, { status: 500 });
  }
}
