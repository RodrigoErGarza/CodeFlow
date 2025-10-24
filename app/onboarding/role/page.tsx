// app/onboarding/role/page.tsx
import Link from "next/link";

export default function RolePickerPage() {
  return (
    <main className="min-h-dvh grid place-items-center px-6 text-white">
      <div className="w-full max-w-md space-y-6">
        <h1 className="text-2xl font-semibold">Elige tu rol</h1>
        <p className="opacity-80 text-sm">
          Selecciona cómo usarás CodeFlow. Puedes cambiarlo más tarde.
        </p>

        <div className="grid gap-3">
          <Link
            href="/onboarding/google-complete?role=STUDENT"
            className="rounded-xl border border-white/10 px-4 py-3 text-center hover:bg-white/5"
          >
            Soy estudiante
          </Link>
          <Link
            href="/onboarding/google-complete?role=TEACHER"
            className="rounded-xl border border-white/10 px-4 py-3 text-center hover:bg-white/5"
          >
            Soy profesor
          </Link>
        </div>

        <p className="text-xs opacity-60">
          Si ya tenías una cuenta, te enviaremos al dashboard automáticamente.
        </p>
      </div>
    </main>
  );
}
