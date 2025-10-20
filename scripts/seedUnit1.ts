// scripts/seedUnit1.ts
import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

// normaliza acentos y espacios para comparar sin errores
const norm = (s: string) =>
  String(s).normalize("NFD").replace(/\p{Diacritic}/gu, "").trim().toLowerCase();

async function main() {
  const file = path.join(process.cwd(), "data", "fundamentos_logica.json");
  const raw = fs.readFileSync(file, "utf8");
  const data = JSON.parse(raw);

  // upsert de la unidad
  const unit = await prisma.unit.upsert({
    where: { slug: data.slug },
    create: {
      slug: data.slug,
      number: data.number,
      title: data.title,
      summary: data.summary,
    },
    update: {
      number: data.number,
      title: data.title,
      summary: data.summary,
    },
  });

  // por cada sección del JSON
  for (const s of data.sections as Array<any>) {
    const section = await prisma.section.upsert({
      where: {
        // combinamos por (unitId, index) para no duplicar
        // si no tienes esta unique, usa where: { id: ... } con un findFirst previo
        // pero lo común es poner esta única también:
        // @@unique([unitId, index], name: "unit_index")
        // Si NO la tienes, usa findFirst + create/update manual.
        unitId_index: { unitId: unit.id, index: s.index },
      } as any, // si aún no tienes la unique, elimina esta línea y haz un findFirst+create/update
      create: {
        unitId: unit.id,
        index: s.index,
        title: s.title,
        content: s.content,
      },
      update: {
        title: s.title,
        content: s.content,
      },
    });

    // Por cada pregunta de la sección
    for (const q of s.questions as Array<any>) {
      // 1) upsert de la pregunta por (sectionId, prompt)
      const question = await prisma.question.upsert({
        where: { sectionId_prompt: { sectionId: section.id, prompt: q.prompt } },
        create: {
          sectionId: section.id,
          prompt: q.prompt,
          explanation: q.explanation ?? null,
          // answerKey se setea luego
        },
        update: {
          prompt: q.prompt,
          explanation: q.explanation ?? null,
        },
      });

      // 2) upsert de opciones por (questionId, label)
      const createdOptions = [];
      for (const label of q.options as string[]) {
        const opt = await prisma.option.upsert({
          where: { questionId_label: { questionId: question.id, label } },
          create: { questionId: question.id, label },
          update: {},
        });
        createdOptions.push(opt);
      }

      // 3) encuentra la correcta por el texto del JSON
      const correct = createdOptions.find(
        (o) => norm(o.label) === norm(q.answer)
      );

      // 4) actualiza answerKey si encontramos match
      if (correct && question.answerKey !== correct.id) {
        await prisma.question.update({
          where: { id: question.id },
          data: { answerKey: correct.id },
        });
      }
    }
  }

  console.log("✅ Unidad/Secciones/Preguntas/Options sembradas y answerKey seteadas");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
