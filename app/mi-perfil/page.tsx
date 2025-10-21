"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Sidebar from "@/app/components/Sidebar";

type Profile = {
  id: string;
  name: string | null;
  username: string | null;
  bio: string | null;
  avatarUrl: string | null;
};

export default function MiPerfilPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    (async () => {
      const r = await fetch("/api/profile", { cache: "no-store" });
      if (!r.ok) return;
      const p = await r.json();
      setProfile(p);
      setName(p?.name ?? "");
      setUsername(p?.username ?? "");
      setBio(p?.bio ?? "");
      setAvatarUrl(p?.avatarUrl ?? null);
    })();
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      const r = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, username, bio }),
      });
      if (!r.ok) throw new Error("Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  async function handleChangePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("Archivo mayor a 2MB");
      return;
    }

    const fd = new FormData();
    fd.append("file", file);

    const r = await fetch("/api/profile/avatar", { method: "POST", body: fd });
    const data = await r.json();
    if (!r.ok) {
      alert(data?.error ?? "Error al subir imagen");
      return;
    }
    // Rompemos caché del navegador con ?t=...
    setAvatarUrl((data?.url as string) ?? null);
  }

  // Fallback del placeholder local
  const shownAvatar = avatarUrl || "/images/avatar-placeholder.png";

  return (
    <div className="flex">
      <Sidebar />

      <main className="flex-1 p-6 space-y-6">
        <h1 className="text-3xl font-semibold">Mi Perfil</h1>

        <div className="grid grid-cols-12 gap-6">
          <section className="col-span-12 lg:col-span-4 rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-sm opacity-70 mb-3">Foto de perfil</div>

            <div className="flex items-center gap-4">
              <div className="relative h-28 w-28 rounded-full overflow-hidden bg-black/30">
                {/* <Image/> exige el host permitido en next.config */}
                <Image
                  src={shownAvatar}
                  alt="avatar"
                  fill
                  sizes="112px"
                  className="object-cover"
                  priority
                  onError={() => setAvatarUrl(null)} // si falla, vuelve al placeholder
                />
              </div>

              <div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={handleChangePhoto}
                />
                <button
                  onClick={() => fileRef.current?.click()}
                  className="px-3 py-2 rounded bg-indigo-600 text-white"
                >
                  Cambiar foto
                </button>
                <p className="text-xs opacity-60 mt-2">PNG/JPG/WEBP · máx. 2MB</p>
              </div>
            </div>
          </section>

          <section className="col-span-12 lg:col-span-8 rounded-2xl border border-white/10 bg-white/5 p-4 space-y-4">
            <div>
              <div className="text-sm opacity-70 mb-1">Nombre</div>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded bg-black/40 border border-white/10 p-3"
              />
            </div>

            <div>
              <div className="text-sm opacity-70 mb-1">Nombre de usuario</div>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded bg-black/40 border border-white/10 p-3"
              />
            </div>

            <div>
              <div className="text-sm opacity-70 mb-1">Bio</div>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={5}
                className="w-full rounded bg-black/40 border border-white/10 p-3"
              />
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 rounded bg-emerald-600 text-white"
            >
              {saving ? "Guardando..." : "Guardar"}
            </button>
          </section>
        </div>
      </main>
    </div>
  );
}
