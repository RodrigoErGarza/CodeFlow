// app/onboarding/role/page.tsx
import Link from "next/link";

export default function RolePickerPage() {
  return (
    <main className="min-h-dvh grid place-items-center px-6 text-white">
      <div className="w-full max-w-md space-y-6">
        <h1 className="text-2xl font-semibold">Elige tu rol</h1>
        <p className="opacity-80 text-sm">
          Selecciona cómo usarás CodeFlow
        </p>

        <div className="grid gap-3">
          <Link
            href="/onboarding/google-complete?role=STUDENT"
            className="w-full text-center rounded-xl border border-white/10 bg-white/5 px-4 py-3 hover:bg-white/10 transition"
            role="button"
            prefetch
          >
            Soy estudiante
          </Link>

          <Link
            href="/onboarding/google-complete?role=TEACHER"
            className="w-full text-center rounded-xl border border-white/10 bg-white/5 px-4 py-3 hover:bg-white/10 transition"
            role="button"
            prefetch
          >
            Soy profesor
          </Link>
        </div>
      </div>
    </main>
  );
}
