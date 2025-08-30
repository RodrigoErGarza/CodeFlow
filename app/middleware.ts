import { withAuth } from "next-auth/middleware";

export default withAuth({
  callbacks: {
    authorized: ({ token, req }) => {
      const path = req.nextUrl.pathname;

      // 🔓 Rutas públicas o que deben quedar libres para que respondan JSON
      if (path.startsWith("/login")) return true;
      if (path.startsWith("/api/auth")) return true;
      if (path.startsWith("/api/users")) return true; // 👈 importante

      // 🔐 Resto requiere sesión
      if (!token) return false;

      // 👮‍♂️ Zona admin
      if (path.startsWith("/admin")) return token.role === "ADMIN";

      return true;
    },
  },
});

export const config = {
  matcher: ["/((?!_next|favicon.ico|public).*)"],
};
