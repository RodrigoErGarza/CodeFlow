// lib/auth.ts (NextAuth v4)
import type { NextAuthOptions } from "next-auth";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
const bcrypt = require("bcrypt");
import { Role } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      role: Role;
    };
  }
}
declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: Role;
  }
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" }, // ← importante para middleware
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Correo", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(creds) {
        if (!creds?.email || !creds.password) return null;
        const user = await prisma.user.findUnique({ where: { email: creds.email } });
        if (!user || !user.passwordHash) return null;

        const ok = await bcrypt.compare(creds.password, user.passwordHash);
        if (!ok) return null;

        // devolvemos lo mínimo; el rol lo inyectamos en callbacks
        return { id: user.id, email: user.email, name: user.name } as any;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // en login, 'user' viene definido: cargamos rol desde BD
      if (user) {
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email as string },
          select: { id: true, role: true },
        });
        token.id = dbUser?.id || (user as any).id;
        token.role = dbUser?.role || "STUDENT";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        // @ts-ignore
        session.user.role = token.role;
      }
      return session;
    },
  },
  secret: process.env.AUTH_SECRET,
};
