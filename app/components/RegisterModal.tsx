// app/components/RegisterModal.tsx
"use client";

import { useState } from "react";

type Props = { open: boolean; onClose: () => void };

export default function RegisterModal({ open, onClose }: Props) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "STUDENT",
  });
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setOk(null);
    setLoading(true);

    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    setLoading(false);
    const data = await res.json().catch(() => ({} as any));
    if (!res.ok) return setErr(data?.error || "No se pudo registrar");

    setOk("Cuenta creada con éxito. Ya puedes iniciar sesión.");
    // Si deseas cerrar automáticamente:
    // setTimeout(onClose, 900);
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/60 backdrop-blur-sm px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0D1321]/90 text-white p-6 shadow-[0_30px_100px_-20px] shadow-black/70"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">Crear cuenta</h2>
          <button
            onClick={onClose}
            className="rounded-lg px-3 py-1 bg-white/10 hover:bg-white/20"
          >
            ✕
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="text-sm text-white/80">Nombre</label>
            <input
              className="mt-1 w-full rounded-xl bg-[#0D1321] border border-white/10 px-4 py-3 focus:outline-none focus:border-[#22D2A0]/60"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Tu nombre"
            />
          </div>

          <div>
            <label className="text-sm text-white/80">Email</label>
            <input
              type="email"
              className="mt-1 w-full rounded-xl bg-[#0D1321] border border-white/10 px-4 py-3 focus:outline-none focus:border-[#22D2A0]/60"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="correo@ejemplo.com"
            />
          </div>

          <div>
            <label className="text-sm text-white/80">Contraseña</label>
            <input
              type="password"
              className="mt-1 w-full rounded-xl bg-[#0D1321] border border-white/10 px-4 py-3 focus:outline-none focus:border-[#22D2A0]/60"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="Mínimo 8 caracteres"
            />
          </div>

          <div>
            <label className="text-sm text-white/80">Rol</label>
            <select
              className="mt-1 w-full rounded-xl bg-[#0D1321] border border-white/10 px-4 py-3 focus:outline-none focus:border-[#22D2A0]/60"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
            >
              <option value="STUDENT">Estudiante</option>
              <option value="TEACHER">Docente</option>
              {/* ADMIN normalmente no se expone aquí */}
            </select>
          </div>

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
      </div>
    </div>
  );
}
