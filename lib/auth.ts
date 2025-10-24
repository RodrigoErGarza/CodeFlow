// lib/auth.ts (NextAuth v4)
import type { NextAuthOptions } from "next-auth";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { Role } from "@prisma/client";
const bcrypt = require("bcrypt");

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      role: Role;
      avatarUrl?: string | null;
    };
  }
}
declare module "next-auth/jwt" {
  interface JWT {
    /** Usa opcional para evitar conflicto con otras declaraciones */
    id?: string;
    role?: Role;
    avatarUrl?: string | null;
  }
}


export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },

  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),

    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Correo", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(creds) {
        const email = creds?.email?.trim().toLowerCase();
        const password = creds?.password;
        if (!email || !password) return null;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !user.passwordHash) return null;

        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return null;

        return { id: user.id, email: user.email, name: user.name } as any;
      },
    }),
  ],

  callbacks: {
    // Redirecciones seguras
    async redirect({ url, baseUrl }) {
      try {
        const u = new URL(url);
        if (u.origin === baseUrl) return u.toString();
        return baseUrl;
      } catch {
        if (url.startsWith("/")) return baseUrl + url;
        return baseUrl;
      }
    },

    /**
     * SOLO nuevos con Google → ir a /onboarding/role
     * Usuarios existentes → continuar normal (no pedir rol otra vez)
     */
    async signIn({ user, account, profile }) {
      if (account?.provider === "google") {
        const email =
          (profile?.email || user?.email || "").toString().trim().toLowerCase();
        if (!email) return false; // algo raro, no seguimos

        const existing = await prisma.user.findUnique({
          where: { email },
          select: { id: true }, // basta saber si existe
        });

        if (!existing) {
          // Nuevo usuario → deja firmar y llévalo al role picker
          return "/onboarding/role";
        }
      }
      return true;
    },

    /**
     * JWT: inyecta id/rol/avatar. Prioriza lo que haya en BD si existe.
     * Usa avatar de BD si lo hay; si no, el de Google; si no, deja null.
     */
    async jwt({ token, user, profile, account }) {
      // Normaliza email en token si existe
      if (user?.email) user.email = user.email.trim().toLowerCase();
      if (token?.email) token.email = (token.email as string).trim().toLowerCase();

      // Carga desde BD por email si se puede, si no por id (sub)
      const email = (user?.email ?? token?.email) as string | undefined;
      let dbUser:
        | { id: string; role: Role; avatarUrl: string | null }
        | null = null;

      if (email) {
        dbUser = await prisma.user.findUnique({
          where: { email },
          select: { id: true, role: true, avatarUrl: true },
        });
      }
      if (!dbUser && token?.sub) {
        dbUser = await prisma.user.findUnique({
          where: { id: token.sub as string },
          select: { id: true, role: true, avatarUrl: true },
        });
      }

      if (dbUser) {
        token.sub = dbUser.id;
        (token as any).id = dbUser.id;
        (token as any).role = dbUser.role;
        (token as any).avatarUrl =
          dbUser.avatarUrl ??
          (profile as any)?.picture ??
          (user as any)?.image ??
          (token as any).avatarUrl ??
          null;
      } else {
        // nuevo o inconsistente: asegura defaults sin forzar cambio a student si ya hay rol
        (token as any).id = (token as any).id ?? token.sub;
        if ((token as any).role == null) (token as any).role = "STUDENT";
        (token as any).avatarUrl =
          (profile as any)?.picture ??
          (user as any)?.image ??
          (token as any).avatarUrl ??
          null;
      }

      return token;
    },

    /**
     * Session: refresca SIEMPRE rol y avatar desde BD para que Sidebar
     * vea la foto actual del perfil. Si no hay avatar en BD, usa el del token (Google).
     */
    async session({ session, token }) {
      if (token?.sub) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.sub as string },
          select: { role: true, avatarUrl: true },
        });

        (session.user as any).id = token.sub;
        (session.user as any).role = dbUser?.role ?? (token as any).role ?? "STUDENT";
        (session.user as any).avatarUrl =
          dbUser?.avatarUrl ??
          (token as any).avatarUrl ??
          (session.user as any).image ??
          null;
      }
      return session;
    },
  },

  secret: process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET,

};

// Helper
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
