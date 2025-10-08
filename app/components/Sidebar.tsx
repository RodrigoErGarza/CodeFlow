"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home, Code2, BookOpen, Target, User, Users
} from "lucide-react";
import Logo from "./Logo";

const links = [
  { href: "/dashboard", label: "Inicio", icon: Home },
  { href: "/dashboard/editor", label: "Generador de Flujos", icon: Code2 },
  { href: "/dashboard/learning", label: "Aprendizaje", icon: BookOpen },
  { href: "/dashboard/challenges", label: "Retos", icon: Target },
  { href: "/dashboard/profile", label: "Mi Perfil", icon: User },
  { href: "/dashboard/groups", label: "Grupos", icon: Users },
];

export default function Sidebar({
  open,
  onClose,
}: { open?: boolean; onClose?: () => void }) {
  const pathname = usePathname();

  // ✅ Lógica mejorada para marcar activo correctamente
  const isActive = (href: string) => {
    if (href === "/dashboard") {
      // Exacto solo para /dashboard
      return pathname === "/dashboard";
    }
    // Para los demás, permite subrutas
    return pathname.startsWith(href);
  };

  return (
    <aside
      className={`fixed md:static z-40 h-screen w-[260px] shrink-0 
        border-r border-white/10 bg-white/5 backdrop-blur-sm
        transition-transform md:translate-x-0
        ${open ? "translate-x-0" : "-translate-x-full"}`}
    >
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
              {/* barra animada lateral */}
              <span
                className={`absolute left-0 top-1/2 -translate-y-1/2 h-6 w-0.5 rounded-full
                transition-all ${
                  active ? "bg-cyan-400 scale-y-100" : "bg-transparent scale-y-0"
                }`}
              />
              <Icon
                size={18}
                className={`${
                  active
                    ? "text-cyan-300"
                    : "text-white/70 group-hover:text-white"
                }`}
              />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
