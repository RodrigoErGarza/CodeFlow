// middleware.ts
import { withAuth } from "next-auth/middleware";

export default withAuth({
  callbacks: {
    authorized: ({ token, req }) => {
      const path = req.nextUrl.pathname;

      // 🔓 Rutas públicas de páginas
      if (
        path === "/" ||
        path.startsWith("/login") ||
        path.startsWith("/register") ||
        path.startsWith("/recover") ||  // <— NUEVO
        path.startsWith("/reset")       // <— NUEVO
      ) {
        return true;
      }

      // 🔓 Rutas públicas de API (NextAuth + reset password)
      if (
        path.startsWith("/api/auth") ||
        path.startsWith("/api/recover") || // <— NUEVO
        path.startsWith("/api/reset")      // <— NUEVO
      ) {
        return true;
      }

      // Si mantienes /api/register abierto, déjalo:
      if (path.startsWith("/api/register")) return true;

      // 🔐 Resto requiere sesión
      if (!token) return false;

      // 👮 Zona admin protegida por rol
      if (path.startsWith("/admin")) return token.role === "ADMIN";

      return true;
    },
  },
});

// Ajusta el matcher para no interceptar assets estáticos
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|assets|public).*)",
  ],
};
