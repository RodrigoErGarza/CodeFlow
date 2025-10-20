// scripts/fixAnswerKeys.ts
import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";
const prisma = new PrismaClient();

const norm = (s: string) =>
  String(s).normalize("NFD").replace(/\p{Diacritic}/gu, "").trim().toLowerCase();

async function main() {
  const file = path.join(process.cwd(), "data", "fundamentos_logica.json");
  const raw = fs.readFileSync(file, "utf8");
  const data = JSON.parse(raw);

  const unit = await prisma.unit.findUnique({ where: { slug: data.slug } });
  if (!unit) {
    console.log("No existe la unidad, corre primero el seed.");
    return;
  }

  for (const s of data.sections as Array<any>) {
    const section = await prisma.section.findFirst({
      where: { unitId: unit.id, index: s.index },
    });
    if (!section) continue;

    for (const q of s.questions as Array<any>) {
      const question = await prisma.question.findUnique({
        where: { sectionId_prompt: { sectionId: section.id, prompt: q.prompt } },
        include: { options: true },
      });
      if (!question) continue;

      const correct = question.options.find(
        (o) => norm(o.label) === norm(q.answer)
      );
      if (correct && question.answerKey !== correct.id) {
        await prisma.question.update({
          where: { id: question.id },
          data: { answerKey: correct.id },
        });
      }
    }
  }

  console.log("✅ answerKey corregidos (si hacía falta).");
}

main().finally(() => prisma.$disconnect());
