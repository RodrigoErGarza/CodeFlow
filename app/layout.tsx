// app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";
import Providers from "./providers";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const metadata: Metadata = {
  title: "CodeFlow",
  description: "Plataforma CodeFlow",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="es">
      <body>
        <Providers session={session}>
          <header className="flex items-center justify-between px-4 py-2 border-b">
            <Link href="/" className="font-semibold">CodeFlow</Link>

            <nav className="flex items-center gap-3 text-sm">
              <Link href="/" className="underline">Inicio</Link>
              <Link href="/admin" className="underline">Admin</Link>

              {session ? (
                <>
                  <span>
                    Hola, {session.user?.name ?? session.user?.email} — <b>{session.user?.role}</b>
                  </span>
                  <form method="post" action="/api/auth/signout">
                    <input type="hidden" name="callbackUrl" value="/login" />
                    <button type="submit" className="border rounded px-3 py-1 hover:bg-gray-50">
                      Salir
                    </button>
                  </form>
                </>
              ) : (
                <Link className="border rounded px-3 py-1 hover:bg-gray-50" href="/login">
                  Iniciar sesión
                </Link>
              )}
            </nav>
          </header>

          <main>{children}</main>
        </Providers>
      </body>
    </html>
  );
}
