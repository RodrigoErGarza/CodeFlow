// app/components/CTAButtons.tsx
"use client";

import Link from "next/link";
import { useState } from "react";
import RegisterModal from "./RegisterModal";

export default function CTAButtons() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="mt-10 flex flex-wrap gap-4">
        <Link
          href="/login"
          className="px-6 py-3 rounded-xl font-semibold text-white
                     bg-gradient-to-r from-[#6a3df5] to-[#1ea1ff]
                     shadow-[0_10px_30px_-12px] shadow-[#1ea1ff]/60
                     hover:brightness-110 transition"
        >
          Iniciar sesión
        </Link>

        <Link
          href="/register"
          className="px-6 py-3 rounded-xl font-semibold border border-white/10
                     bg-white/5 hover:bg-white/10 transition"
        >
          Registrarse
        </Link>
      </div>

    
    </>
  );
}
