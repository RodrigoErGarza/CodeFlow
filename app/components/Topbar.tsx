"use client";

import { useState } from "react";
import { Search, Menu } from "lucide-react";
import { signOut } from "next-auth/react";

export default function Topbar({
  user,
  onMenu,
}: {
  user?: { name?: string | null; email?: string | null; role?: string | null };
  onMenu?: () => void;
}) {
  const [q, setQ] = useState("");

  const initial = (user?.name ?? user?.email ?? "U").slice(0, 1).toUpperCase();

  return (
    <header className="h-14 border-b border-white/10 px-4 md:px-5 flex items-center justify-between bg-white/5">
      <div className="flex items-center gap-2">
        {/* botón mobile para abrir sidebar */}
        <button
          className="md:hidden mr-1 text-white/80 hover:text-white"
          onClick={onMenu}
        >
          <Menu size={20} />
        </button>

        {/* búsqueda */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 focus-within:border-cyan-400/40">
          <Search size={16} className="text-white/60" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar…"
            className="bg-transparent outline-none text-sm placeholder-white/40"
          />
        </div>
      </div>

      {/* chip usuario */}
      <div className="flex items-center gap-3">
        <div className="text-right leading-tight max-w-[180px]">
          <div className="text-sm font-medium truncate">
            {user?.name ?? user?.email}
          </div>
          <div className="text-[11px] opacity-70">{user?.role}</div>
        </div>
        <div className="h-9 w-9 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 grid place-items-center font-semibold">
          {initial}
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="text-xs border rounded px-3 py-1 hover:bg-white/10"
        >
          Salir
        </button>
      </div>
    </header>
  );
}
