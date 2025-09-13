// app/login/page.tsx
"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import WindowCard from "@/app/components/WindowCard";
import CodeRain from "@/app/components/CodeRain";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr(null);
    setLoading(true);

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl: "/",
    });

    setLoading(false);
    if (res?.error) setErr("Credenciales inválidas");
    else if (res?.ok) window.location.href = res.url ?? "/";
  }

  return (
    <main
      className="min-h-dvh text-white grid place-items-center px-6 relative overflow-hidden"
      style={{
        // Fondo integrado con tu logo: base, halo violeta→azul, toque cian
        background:
          "radial-gradient(60rem 40rem at 80% 10%, rgba(30,161,255,0.12), transparent 60%)," +
          "radial-gradient(70rem 40rem at 10% 100%, rgba(34,210,160,0.10), transparent 60%)," +
          "#0D1321",
      }}
    >
      {/* Halos extra para integrar el logo */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-20 left-1/2 -translate-x-1/2 h-96 w-96 rounded-full blur-3xl bg-[#6a3df5]/25" />
        <div className="absolute top-28 left-1/2 -translate-x-1/2 h-80 w-80 rounded-full blur-2xl bg-[#1ea1ff]/20" />
        <div className="absolute top-36 left-1/2 -translate-x-1/2 h-72 w-72 rounded-full blur-xl bg-[#22D2A0]/14" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* LOGO + nombre — integrado con halos */}
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

        <WindowCard title="INICIO DE SESIÓN">
          {/* cabecera animada tipo “code” */}
          <div className="mb-4 relative h-[220px] rounded-xl overflow-hidden border border-white/10">
            <CodeRain />
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <label className="block text-[15px] text-white/90">
              Email o nombre de usuario
            </label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              placeholder="correo@ejemplo.com"
              className="w-full px-4 py-3 rounded-xl bg-[#0D1321] border border-white/10 focus:outline-none focus:border-[#22D2A0]/60"
            />

            <label className="block text-[15px] text-white/90 mt-2">
              Contraseña
            </label>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              placeholder="Contraseña"
              className="w-full px-4 py-3 rounded-xl bg-[#0D1321] border border-white/10 focus:outline-none focus:border-[#22D2A0]/60"
            />

            {err && <p className="text-sm text-rose-400">{err}</p>}

            <button
              disabled={loading}
              className="w-full mt-2 px-4 py-3 rounded-xl font-semibold
                         text-white bg-gradient-to-r from-[#6a3df5] to-[#1ea1ff]
                         shadow-[0_10px_30px_-12px] shadow-[#1ea1ff]/60
                         hover:brightness-110 disabled:opacity-60 transition"
            >
              {loading ? "Entrando..." : "Iniciar sesión"}
            </button>

            <div className="text-center mt-3">
              <Link href="/recover" className="text-[#22D2A0] hover:underline">
                ¿Olvidaste tu contraseña?
              </Link>
            </div>

            {/* separador */}
            <div className="relative my-5">
              <div className="h-px w-full bg-white/10" />
              <span className="absolute left-1/2 -translate-x-1/2 -top-3 px-3 text-white/50 bg-[#0D1321]">
                o
              </span>
            </div>

            {/* Botón Google (quedará listo para cuando configures el provider) */}
            <button
              type="button"
              onClick={() => signIn("google", { callbackUrl: "/" })}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition"
            >
              {/* ícono Google */}
              <svg width="20" height="20" viewBox="0 0 533.5 544.3" aria-hidden>
                <path fill="#4285F4" d="M533.5 278.4c0-17.6-1.4-35-4.3-51.8H272.1v98h146.9c-6.3 34.1-25.2 63.1-53.7 82.4l86.7 67.1c50.7-46.7 81.5-115.5 81.5-195.7z"/>
                <path fill="#34A853" d="M272.1 544.3c73.9 0 136.1-24.4 181.4-66.2l-86.7-67.1c-24.1 16.2-54.9 25.8-94.7 25.8-72.7 0-134.3-49-156.3-114.8l-90.6 70.5c41.8 83 127.4 151.8 247 151.8z"/>
                <path fill="#FBBC05" d="M115.8 322c-10.5-31.1-10.5-64.8 0-95.9l-90.6-70.5C-28.4 236.1-28.4 339 24.6 428.9l91.2-71z"/>
                <path fill="#EA4335" d="M272.1 107.7c40.1-.6 78.5 13.5 108.1 38.7l81-81.1C418 22.6 349.1-1.4 272.1 0 152.4 0 66.8 68.8 25 151.7l90.8 74.4C138 158.7 199.6 108.3 272.1 107.7z"/>
              </svg>
              Continuar con Google
            </button>
          </form>
        </WindowCard>

        <p className="text-center mt-6 text-white/80">
          ¿No tienes cuenta?{" "}
          <Link href="/register" className="text-[#22D2A0] hover:underline mb-4">
            Crear cuenta
          </Link>
        </p>
      </div>
      <footer className="mt-10 text-center text-white/60 text-sm w-full pb-4">
        © {new Date().getFullYear()} CodeFlow. Todos los derechos reservados.
      </footer>
    </main>
  );
}
