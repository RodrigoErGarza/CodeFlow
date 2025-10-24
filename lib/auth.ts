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

// --- Helpers de logging (no intrusivos) ---
const log = (...args: any[]) => console.log("[auth]", ...args);
const warn = (...args: any[]) => console.warn("[auth]", ...args);
const errlog = (...args: any[]) => console.error("[auth]", ...args);

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
    id?: string;
    role?: Role;
    avatarUrl?: string | null;
  }
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  debug: true, // trazas de NextAuth en logs

  logger: {
    error(code, ...meta) {
      errlog("logger.error", code, ...meta);
    },
    warn(code, ...meta) {
      warn("logger.warn", code, ...meta);
    },
    debug(code, ...meta) {
      log("logger.debug", code, ...meta);
    },
  },

  // Nota: algunas versiones de tipos no incluyen `error` dentro de `events`,
  // por eso no lo declaramos aquí y usamos `logger.error` para errores.
  events: {
    async signIn(message: any) {
      log("event.signIn", {
        provider: message?.account?.provider,
        userId: message?.user?.id,
        email: message?.user?.email,
        isNewUser: message?.isNewUser,
      });
    },
    async signOut(message: any) {
      log("event.signOut", { session: !!message?.session });
    },
    async createUser(message: any) {
      log("event.createUser", { userId: message?.user?.id, email: message?.user?.email });
    },
    async linkAccount(message: any) {
      log("event.linkAccount", { userId: message?.user?.id, provider: message?.account?.provider });
    },
  },

  pages: {
    // Cuando Google crea un usuario por primera vez, NextAuth lo mandará aquí
    newUser: "/onboarding/role",
  },

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
        try {
          const email = creds?.email?.trim().toLowerCase();
          const password = creds?.password;
          log("credentials.authorize:start", { email });

          if (!email || !password) {
            warn("credentials.authorize:missing-fields");
            return null;
          }

          const user = await prisma.user.findUnique({ where: { email } });
          if (!user || !user.passwordHash) {
            warn("credentials.authorize:user-not-found-or-no-hash", { email });
            return null;
          }

          const ok = await bcrypt.compare(password, user.passwordHash);
          if (!ok) {
            warn("credentials.authorize:bad-password", { email });
            return null;
          }

          log("credentials.authorize:success", { userId: user.id });
          return { id: user.id, email: user.email, name: user.name } as any;
        } catch (e) {
          errlog("credentials.authorize:error", e);
          return null; // nunca romper el flujo
        }
      },
    }),
  ],

  callbacks: {
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
    async signIn({ user, account, profile }) {
      // Si falta email en Google, sí rechazamos (raro, pero pasa)
      if (account?.provider === "google") {
        const email = (profile?.email || user?.email || "").toString().trim().toLowerCase();
        if (!email) return false;
      }
      // De lo contrario, siempre true. El PrismaAdapter se encarga de crear/enlazar.
      // Si el usuario es nuevo, NextAuth usará pages.newUser automáticamente.
      return true;
    },

    
    async jwt({ token, user, profile }) {
      try {
        if (user?.email) user.email = user.email.trim().toLowerCase();
        if (token?.email) token.email = (token.email as string).trim().toLowerCase();

        const email = (user?.email ?? token?.email) as string | undefined;
        let dbUser: { id: string; role: Role; avatarUrl: string | null } | null = null;

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
          (token as any).id = dbUser.id;
          (token as any).role = dbUser.role;
          (token as any).avatarUrl =
            dbUser.avatarUrl ??
            (profile as any)?.picture ??
            (user as any)?.image ??
            (token as any).avatarUrl ??
            null;

          token.sub = dbUser.id;
          log("callback.jwt:dbUser", { userId: dbUser.id, role: dbUser.role });
        } else {
          (token as any).id = (token as any).id ?? token.sub;
          if ((token as any).role == null) (token as any).role = "STUDENT";
          (token as any).avatarUrl =
            (profile as any)?.picture ??
            (user as any)?.image ??
            (token as any).avatarUrl ??
            null;

          log("callback.jwt:no-dbUser → defaults", {
            id: (token as any).id,
            role: (token as any).role,
          });
        }

        return token;
      } catch (e) {
        errlog("callback.jwt:error", e);
        return token;
      }
    },

    async session({ session, token }) {
      try {
        if (token?.sub) {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.sub as string },
            select: { role: true, avatarUrl: true },
          });

          (session.user as any).id = token.sub;
          (session.user as any).role = dbUser?.role ?? (token as any).role ?? "STUDENT";
          (session.user as any).avatarUrl =
            dbUser?.avatarUrl ?? (token as any).avatarUrl ?? (session.user as any).image ?? null;

          log("callback.session", {
            userId: token.sub,
            role: (session.user as any).role,
          });
        }
        return session;
      } catch (e) {
        errlog("callback.session:error", e);
        return session;
      }
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
