// lib/auth.ts (NextAuth v4)
import type { NextAuthOptions } from "next-auth";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
const bcrypt = require("bcrypt");
import { Role } from "@prisma/client";
import GoogleProvider from "next-auth/providers/google";
import { getServerSession } from "next-auth";


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
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true, // opcional
    }),
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
    async redirect({ url, baseUrl }) {
      // URL absoluta del mismo origen -> respétala
      try {
        const u = new URL(url);
        if (u.origin === baseUrl) return u.toString();
        return baseUrl; // origen externo? bloquear
      } catch {
        // URL relativa -> respétala (permite callbackUrl="/dashboard" o "/login")
        if (url.startsWith("/")) return baseUrl + url;
        return baseUrl;
      }
    },

    async jwt({ token, user, profile }) {
      // en login, 'user' viene definido: cargamos rol desde BD
      if (user) {
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email as string },
          select: { id: true, role: true },
        });
        token.id = dbUser?.id || (user as any).id;
        token.role = dbUser?.role || "STUDENT";
        token.avatarUrl =
        (user as any).avatarUrl ??
        (user as any).image ??
        (profile as any)?.picture ??
        token.avatarUrl ??
        null;
      }
      return token;
    },
    async session({ session, token }) {
      (session.user as any).id = token.sub;
      (session.user as any).role = (token as any).role ?? "STUDENT";
      (session.user as any).avatarUrl =
      (token as any).avatarUrl ?? (session.user as any).image ?? null;
    return session;
    },
  },
  secret: process.env.AUTH_SECRET,
};


export async function getUserIdOrThrow() {
  const session = await getServerSession(authOptions);
  const uid = session?.user?.id;
  if (!uid) {
    const err = new Error("Unauthorized");
    (err as any).status = 401;
    throw err;
  }
  return uid;
}