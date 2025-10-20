// scripts/seedUnits.ts
import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

// normalizador para empatar opción correcta por texto
const norm = (s: string) =>
  String(s).normalize("NFD").replace(/\p{Diacritic}/gu, "").trim().toLowerCase();

async function seedFile(absPath: string) {
  const raw = fs.readFileSync(absPath, "utf8");
  const data = JSON.parse(raw); // { slug, number, title, summary, sections[...] }

  // 1) Upsert de la unidad
  const unit = await prisma.unit.upsert({
    where: { slug: data.slug },
    update: {
      number: data.number,
      title: data.title,
      summary: data.summary,
    },
    create: {
      slug: data.slug,
      number: data.number,
      title: data.title,
      summary: data.summary,
    },
  });

  // 2) Para simplificar el seed en dev: rehacemos secciones de esa unidad
  // (borra secciones antiguas y crea frescas con preguntas/opciones/answerKey)
  await prisma.section.deleteMany({ where: { unitId: unit.id } });

  for (const s of data.sections ?? []) {
    const section = await prisma.section.create({
      data: {
        unitId: unit.id,
        index: s.index,
        title: s.title,
        content: s.content,
      },
    });

    for (const q of s.questions ?? []) {
      // primero creamos la pregunta SIN answerKey
      const createdQ = await prisma.question.create({
        data: {
          sectionId: section.id,
          prompt: q.prompt,
          explanation: q.explanation ?? null,
        },
      });

      // creamos opciones
      const createdOptions = [];
      for (const label of q.options ?? []) {
        const opt = await prisma.option.create({
          data: { questionId: createdQ.id, label },
        });
        createdOptions.push(opt);
      }

      // resolvemos answerKey comparando texto normalizado
      const correct = createdOptions.find(
        (o) => norm(o.label) === norm(q.answer)
      );

      if (correct) {
        await prisma.question.update({
          where: { id: createdQ.id },
          data: { answerKey: correct.id },
        });
      }
    }
  }

  console.log(`✅ Unidad sembrada: ${data.number} - ${data.title} (${data.slug})`);
}

async function main() {
  // Puedes pasar un archivo por CLI:  npx tsx scripts/seedUnits.ts data/diagramas_flujo.json
  // o si no pasas nada, siembra todos los .json dentro de /data
  const args = process.argv.slice(2);
  const files =
    args.length > 0
      ? args
      : fs
          .readdirSync(path.join(process.cwd(), "data"))
          .filter((f) => f.endsWith(".json"))
          .map((f) => path.join(process.cwd(), "data", f));

  for (const f of files) {
    const abs = path.isAbsolute(f) ? f : path.join(process.cwd(), f);
    await seedFile(abs);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
