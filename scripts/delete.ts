
import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";
const prisma = new PrismaClient();
await prisma.account.deleteMany({
  where: { user: { email: 'regaza72@gmail.com' } },
});
await prisma.user.delete({
  where: { email: 'regaza72@gmail.com' },
});