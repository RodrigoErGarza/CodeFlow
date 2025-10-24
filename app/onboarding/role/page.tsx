"use client";
import Link from "next/link";

export default function RolePickerPage() {
  return (
    <main className="min-h-dvh grid place-items-center text-white px-6">
      <div className="max-w-md w-full space-y-6">
        <h1 className="text-2xl font-semibold">Selecciona tu rol</h1>
        <p className="opacity-80 text-sm">Elige cómo usarás CodeFlow</p>

        <div className="grid gap-3">
          <Link
            href="/onboarding/google-complete?role=STUDENT"
            className="btn"
          >
            Soy estudiante
          </Link>
          <Link
            href="/onboarding/google-complete?role=TEACHER"
            className="btn"
          >
            Soy docente
          </Link>
        </div>
      </div>
    </main>
  );
}
