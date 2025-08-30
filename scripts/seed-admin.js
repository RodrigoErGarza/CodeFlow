const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");

const prisma = new PrismaClient();

async function main() {
  const email = "admin@demo.com";
  const plain = "admin123";

  const hash = await bcrypt.hash(plain, 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: { passwordHash: hash, role: "ADMIN" },
    create: { email, role: "ADMIN", passwordHash: hash, name: "Admin" },
  });

  console.log("✅ Usuario admin creado/listo:");
  console.log(`   Email: ${user.email}`);
  console.log(`   Contraseña: ${plain}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
