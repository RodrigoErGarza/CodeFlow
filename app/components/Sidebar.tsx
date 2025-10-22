"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useState } from "react";
import { Home, Code2, BookOpen, Target, User, Users, LogOut } from "lucide-react";
import Logo from "./Logo";

const links = [
  { href: "/dashboard", label: "Inicio", icon: Home },
  { href: "/dashboard/editor", label: "Generador de Flujos", icon: Code2 },
  { href: "/aprendizaje", label: "Aprendizaje", icon: BookOpen },
  { href: "/retos", label: "Retos", icon: Target },
  { href: "/mi-perfil", label: "Mi Perfil", icon: User },
  { href: "/grupos", label: "Grupos", icon: Users },
  { href: "/retos/historial", label: "Historial", icon: BookOpen },
];

export default function Sidebar({
  open,
  onClose,
}: { open?: boolean; onClose?: () => void }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const user = session?.user;
  const [confirming, setConfirming] = useState(false);

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  return (
    <aside
      className={`fixed md:static z-40 h-screen w-[260px] shrink-0 
        border-r border-white/10 bg-white/5 backdrop-blur-sm
        flex flex-col justify-between
        transition-transform md:translate-x-0
        ${open ? "translate-x-0" : "-translate-x-full"}`}
    >
      {/* Header */}
      <div className="px-5 py-4 flex items-center justify-between border-b border-white/10">
        <div className="flex items-center gap-3">
          <Logo />
          <span className="text-lg font-semibold">CodeFlow</span>
        </div>
        <button
          onClick={onClose}
          className="md:hidden text-white/70 hover:text-white"
          aria-label="Cerrar"
        >
          ✕
        </button>
      </div>

      <div className="absolute left-1/2 -translate-x-1/2 top-[72px] pointer-events-none">
        <img
          src="/images/avatarsf.png"           // <-- pon aquí tu archivo
          alt="Logo organización"
          className="h-25 w-25 rounded-full object-cover
                     ring-2 ring-cyan-400/40 border border-white/10
                     shadow-[0_0_20px_rgba(34,210,255,0.25)]"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = "/images/avatar-placeholder.png";
          }}
        />
      </div>

      {/* Navegación */}
      <nav className="p-3 space-y-1 text-sm">
        {links.map(({ href, label, icon: Icon }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              className={`relative group flex items-center gap-3 px-3 py-2 rounded-md
                transition border
                ${
                  active
                    ? "border-cyan-400/30 bg-gradient-to-r from-cyan-500/15 to-blue-500/15 text-white shadow-[0_0_22px_rgba(34,210,255,0.14)]"
                    : "border-transparent hover:bg-white/10 text-white/80"
                }`}
            >
              <span
                className={`absolute left-0 top-1/2 -translate-y-1/2 h-6 w-0.5 rounded-full
                transition-all ${
                  active ? "bg-cyan-400 scale-y-100" : "bg-transparent scale-y-0"
                }`}
              />
              <Icon
                size={18}
                className={`${active ? "text-cyan-300" : "text-white/70 group-hover:text-white"}`}
              />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Perfil + Cerrar sesión */}
      <div className="p-4 border-t border-white/10">
        <div className="flex items-center gap-3">
          <img
            src={(user as any)?.image || "/images/avatar-placeholder.png"}
            alt="Avatar"
            className="h-10 w-10 rounded-full object-cover border border-white/10"
            onError={(e) => { (e.currentTarget as HTMLImageElement).src = "/images/avatar-placeholder.png"; }}
          />
          <div className="flex-1">
            <div className="text-sm font-medium truncate">
              {user?.name || "Usuario"}
            </div>
            <div className="text-xs opacity-70">{(user as any)?.role || "STUDENT"}</div>
          </div>
        </div>

        <div className="mt-3">
          {!confirming ? (
            <button
              onClick={() => setConfirming(true)}
              className="w-full flex items-center justify-center gap-2 bg-white/10 hover:bg-white/15 text-sm py-1.5 rounded-lg transition-all"
            >
              <LogOut size={16} />
              Cerrar sesión
            </button>
          ) : (
            <div className="bg-white/5 border border-white/10 rounded-lg p-3">
              <p className="text-xs mb-3 opacity-80">
                ¿Seguro que deseas cerrar sesión?
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => signOut({ callbackUrl: "/login", redirect: true })}
                  className="flex-1 bg-red-500/80 hover:bg-red-600 text-white rounded-lg py-1 text-sm transition-all"
                >
                  Sí, salir
                </button>
                <button
                  onClick={() => setConfirming(false)}
                  className="flex-1 bg-white/10 hover:bg-white/20 rounded-lg py-1 text-sm transition-all"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
