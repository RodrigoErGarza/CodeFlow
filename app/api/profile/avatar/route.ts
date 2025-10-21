// app/api/profile/avatar/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabaseServer";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions as any);
    const userId = (session as any)?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "No auth" }, { status: 401 });
    }

    const form = await req.formData();
    const file = form.get("file") as File | null;
    const oldUrl = form.get("oldUrl") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file" }, { status: 400 });
    }

    // Máximo 2MB
    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json({ error: "Archivo > 2MB" }, { status: 413 });
    }

    const bucket = process.env.SUPABASE_BUCKET_AVATARS || "avatars";
    const ext = (file.type?.split("/")[1] || "bin").toLowerCase();

    // Ruta única por usuario (sobrescribe siempre el mismo nombre)
    const path = `users/${userId}/avatar.${ext}`;

    // Subir con upsert
    const { error: upErr } = await supabaseServer.storage
      .from(bucket)
      .upload(path, file, { upsert: true, contentType: file.type });
    if (upErr) {
      return NextResponse.json({ error: upErr.message }, { status: 500 });
    }

    // Intento de borrar el anterior si es del mismo bucket (opcional)
    if (oldUrl && oldUrl.includes(bucket)) {
      try {
        // extrae path relativo a partir de la publicUrl
        const url = new URL(oldUrl);
        const parts = url.pathname.split(`/${bucket}/`);
        if (parts[1]) {
          const oldPath = parts[1];
          await supabaseServer.storage.from(bucket).remove([oldPath]);
        }
      } catch {
        // ignoramos errores al borrar (no bloquea la subida)
      }
    }

    // Obtener URL pública
    const { data: pub } = supabaseServer.storage.from(bucket).getPublicUrl(path);
    const publicUrl = pub?.publicUrl ?? null;

    // Persistir en DB
    const cacheBusterUrl = publicUrl ? `${publicUrl}?t=${Date.now()}` : null;
    await prisma.user.update({
      where: { id: userId },
      data: { avatarUrl: cacheBusterUrl },
    });
    return NextResponse.json({ ok: true, url: cacheBusterUrl });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Upload error" },
      { status: 500 }
    );
  }
}
