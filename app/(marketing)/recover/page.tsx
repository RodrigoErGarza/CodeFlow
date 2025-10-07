"use client";

import { useState } from "react";
import Link from "next/link";
import WindowCard from "@/app/components/WindowCard";
import FlowBackground from "@/app/components/FlowBackGround";

export default function RecoverPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    await fetch("/api/recover", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setLoading(false);
    setSent(true);
  }

  return (
    <main className="min-h-dvh bg-[#0D1321] text-white grid place-items-center px-6 relative overflow-hidden">
      <FlowBackground />

      <div className="w-full max-w-md relative z-1">
        

        <WindowCard title="">
          <h1 className="text-xl font-semibold mb-4">Recuperar contraseña</h1>
          {sent ? (
            <p className="text-white/80">
              Te enviamos un enlace para restablecer tu contraseña a <span className="font-semibold text-[#22D2A0]">{email}</span>.
            </p>
          ) : (
            <form onSubmit={onSubmit} className="space-y-4">
              <label className="block text-[15px] text-white/90">Ingresa tu correo para restablecer tu contraseña</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                placeholder="correo@ejemplo.com"
                className="w-full px-4 py-3 rounded-xl bg-[#0D1321] border border-white/10 focus:outline-none focus:border-[#22D2A0]/60"
              />
              <button
                disabled={loading}
                className="w-full mt-2 px-4 py-3 rounded-xl font-semibold
                           text-white bg-gradient-to-r from-[#6a3df5] to-[#1ea1ff]
                           hover:brightness-110 disabled:opacity-60 transition"
              >
                {loading ? "Enviando..." : "Enviar enlace"}
              </button>
            </form>
          )}
          <div className="mt-4 text-sm text-white/70">
            <Link href="/login" className="underline">Volver a iniciar sesión</Link>
          </div>
        </WindowCard>
      </div>
    </main>
  );
}