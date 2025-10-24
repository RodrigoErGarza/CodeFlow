"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import WindowCard from "@/app/components/WindowCard";

export default function ResetClient() {
  const sp = useSearchParams();
  const router = useRouter();
  const token = sp.get("token") || "";
  const [password, setPassword] = useState("");
  const [done, setDone] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setErr(null);

    const res = await fetch("/api/reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });

    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setErr(data?.error || "No se pudo cambiar la contraseña");
      return;
    }
    setDone(true);
    setTimeout(() => router.push("/login"), 800);
  }

  return (
    <main className="min-h-dvh bg-[#0D1321] text-white grid place-items-center px-6">
      <div className="w-full max-w-md">
        <WindowCard title="reset.tsx">
          <h1 className="text-xl font-semibold mb-4">Nueva contraseña</h1>
          {done ? (
            <p className="text-emerald-400">Contraseña actualizada. Redirigiendo…</p>
          ) : (
            <form onSubmit={onSubmit} className="space-y-4">
              <label className="block text-[15px] text-white/90">Nueva contraseña</label>
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                placeholder="Mínimo 8 caracteres"
                className="w-full px-4 py-3 rounded-xl bg-[#0D1321] border border-white/10 focus:outline-none focus:border-[#22D2A0]/60"
              />
              {err && <p className="text-sm text-rose-400">{err}</p>}
              <button
                disabled={loading}
                className="w-full mt-2 px-4 py-3 rounded-xl font-semibold
                           text-white bg-gradient-to-r from-[#6a3df5] to-[#1ea1ff]
                           hover:brightness-110 disabled:opacity-60 transition"
              >
                {loading ? "Guardando..." : "Cambiar contraseña"}
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
