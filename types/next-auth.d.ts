import NextAuth from "next-auth";

declare module "next-auth" {
  // Lo que realmente trae tu sesión en `session.user`
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      role?: "STUDENT" | "TEACHER" | "ADMIN";
      avatarUrl?: string | null; // 👈 añadimos
      image?: string | null;     // 👈 añadimos (p.ej. de Google/GitHub)
    };
  }

  // Lo que devuelve tu provider al autenticar
  interface User {
    id: string;
    name?: string | null;
    email?: string | null;
    role?: "STUDENT" | "TEACHER" | "ADMIN";
    avatarUrl?: string | null;
    image?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: "STUDENT" | "TEACHER" | "ADMIN";
    avatarUrl?: string | null;
    picture?: string | null;
  }
}
