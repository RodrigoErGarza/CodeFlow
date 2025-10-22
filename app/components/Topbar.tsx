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
        
      </div>

      {/* chip usuario */}
      
    </header>
  );
}
