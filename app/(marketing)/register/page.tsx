// app/register/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import WindowCard from "@/app/components/WindowCard";
import CodeRain from "@/app/components/CodeRain";
import Image from "next/image";

export default function RegisterPage() {
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "STUDENT" });
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr(null); setOk(null); setLoading(true);

    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await res.json().catch(() => ({}));
    setLoading(false);

    if (!res.ok) return setErr(data?.error || "No se pudo registrar");

    setOk("Cuenta creada. Ahora puedes iniciar sesión.");
    // Si quieres redirigir al login automáticamente:
    // setTimeout(() => (window.location.href = "/login"), 800);
  }

  return (
    <main className="min-h-dvh bg-[#0D1321] text-white grid place-items-center px-6 relative overflow-hidden">
      <div className="pointer-events-none absolute bottom-0 right-0 h-80 w-80 rounded-full blur-2xl bg-[#6a3df5]/20" />
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-20 left-1/2 -translate-x-1/2 h-96 w-96 rounded-full blur-3xl bg-[#6a3df5]/25" />
        <div className="absolute top-28 left-1/2 -translate-x-1/2 h-80 w-80 rounded-full blur-2xl bg-[#1ea1ff]/20" />
        <div className="absolute top-36 left-1/2 -translate-x-1/2 h-72 w-72 rounded-full blur-xl bg-[#22D2A0]/14" />
      </div>


      <div className="w-full max-w-md">
        <div className="flex flex-col items-center ">
                  <div className="relative">
                    {/* halo suave detrás del logo */}
                    <span className="pointer-events-none absolute -inset-6 rounded-full bg-[#22D2A0]/15 blur-2xl" />
                    <Image
                      src="/logoblanco.png"
                      alt="CodeFlow"
                      width={200}
                      height={180}
                      priority
                    />
                  </div>
        </div>

        <WindowCard title="REGISTRO">
          <div className="mb-4 relative h-[220px] rounded-xl overflow-hidden border border-white/10">
            <CodeRain density={20} opacity={0.18} />
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <h1 className="text-2xl font-bold">Crear cuenta</h1>

            <label className="block text-[15px] text-white/90">Nombre</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Tu nombre"
              className="w-full px-4 py-3 rounded-xl bg-[#0D1321] border border-white/10 focus:outline-none focus:border-[#22D2A0]/60"
            />

            <label className="block text-[15px] text-white/90">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="correo@ejemplo.com"
              className="w-full px-4 py-3 rounded-xl bg-[#0D1321] border border-white/10 focus:outline-none focus:border-[#22D2A0]/60"
            />

            <label className="block text-[15px] text-white/90">Contraseña</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="Mínimo 8 caracteres"
              className="w-full px-4 py-3 rounded-xl bg-[#0D1321] border border-white/10 focus:outline-none focus:border-[#22D2A0]/60"
            />

            <label className="block text-[15px] text-white/90">Rol</label>
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-[#0D1321] border border-white/10 focus:outline-none focus:border-[#22D2A0]/60"
            >
              <option value="STUDENT">Estudiante</option>
              <option value="TEACHER">Docente</option>
              {/* ADMIN normalmente NO se expone públicamente */}
            </select>

            {err && <p className="text-sm text-rose-400">{err}</p>}
            {ok && <p className="text-sm text-emerald-400">{ok}</p>}

            <button
              disabled={loading}
              className="w-full mt-2 px-4 py-3 rounded-xl font-semibold
                         text-white bg-gradient-to-r from-[#6a3df5] to-[#1ea1ff]
                         shadow-[0_10px_30px_-12px] shadow-[#1ea1ff]/60
                         hover:brightness-110 disabled:opacity-60 transition"
            >
              {loading ? "Creando..." : "Registrarse"}
            </button>
          </form>
        </WindowCard>

        <p className="text-center mt-6 text-white/80">
          ¿Ya tienes cuenta?{" "}
          <Link href="/login" className="text-[#22D2A0] hover:underline">
            Inicia sesión
          </Link>
        </p>
      </div>
      <footer className="mt-10 text-center text-white/60 text-sm w-full pb-4">
        © {new Date().getFullYear()} CodeFlow. Todos los derechos reservados.
      </footer>
    </main>
  );
}
