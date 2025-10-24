// app/register/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import WindowCard from "@/app/components/WindowCard";
import CodeRain from "@/app/components/CodeRain";
import Image from "next/image";
import { signIn } from "next-auth/react";

export default function RegisterPage() {
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "STUDENT" });
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false); // 👈 ojito

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
            <div className="relative">
              <input
                type={showPass ? "text" : "password"}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Mínimo 8 caracteres"
                className="w-full px-4 py-3 pr-11 rounded-xl bg-[#0D1321] border border-white/10 focus:outline-none focus:border-[#22D2A0]/60"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPass(s => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70 hover:text-white text-sm"
                aria-label={showPass ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {showPass ? "🕶️" : "👀"}
              </button>
            </div>

            <label className="block text-[15px] text-white/90">Rol</label>
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-[#0D1321] border border-white/10 focus:outline-none focus:border-[#22D2A0]/60"
            >
              <option value="STUDENT">Estudiante</option>
              <option value="TEACHER">Docente</option>
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
        <div className="relative my-5">
          <div className="h-px w-full bg-white/10" />
          <span className="absolute left-1/2 -translate-x-1/2 -top-3 px-3 text-white/50 bg-[#0D1321]">
            o
          </span>
        </div>

        <button
          type="button"
          onClick={() => signIn("google")} // sin callbackUrl
          className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition"
        >
          {/* mismo ícono que usaste en login */}
          <svg width="20" height="20" viewBox="0 0 533.5 544.3" aria-hidden>
                <path fill="#4285F4" d="M533.5 278.4c0-17.6-1.4-35-4.3-51.8H272.1v98h146.9c-6.3 34.1-25.2 63.1-53.7 82.4l86.7 67.1c50.7-46.7 81.5-115.5 81.5-195.7z"/>
                <path fill="#34A853" d="M272.1 544.3c73.9 0 136.1-24.4 181.4-66.2l-86.7-67.1c-24.1 16.2-54.9 25.8-94.7 25.8-72.7 0-134.3-49-156.3-114.8l-90.6 70.5c41.8 83 127.4 151.8 247 151.8z"/>
                <path fill="#FBBC05" d="M115.8 322c-10.5-31.1-10.5-64.8 0-95.9l-90.6-70.5C-28.4 236.1-28.4 339 24.6 428.9l91.2-71z"/>
                <path fill="#EA4335" d="M272.1 107.7c40.1-.6 78.5 13.5 108.1 38.7l81-81.1C418 22.6 349.1-1.4 272.1 0 152.4 0 66.8 68.8 25 151.7l90.8 74.4C138 158.7 199.6 108.3 272.1 107.7z"/>
          </svg>
          Unirse con Google
        </button>

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
