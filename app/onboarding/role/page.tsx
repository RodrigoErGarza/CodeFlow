// app/onboarding/role/page.tsx
import Link from "next/link";

export default function RolePickerPage() {
  return (
    <main className="min-h-dvh grid place-items-center px-6 text-white">
      <div className="w-full max-w-md space-y-6">
        <h1 className="text-2xl font-semibold">Elige tu rol</h1>
        <p className="opacity-80 text-sm">Selecciona cómo usarás CodeFlow.</p>

        <div className="grid gap-3">
          <Link
            href="/onboarding/google-complete?role=STUDENT"
            className="px-4 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-[#6a3df5] to-[#1ea1ff] text-center hover:brightness-110 transition"
          >
            Soy estudiante
          </Link>

          <Link
            href="/onboarding/google-complete?role=TEACHER"
            className="px-4 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-[#6a3df5] to-[#1ea1ff] text-center hover:brightness-110 transition"
          >
            Soy profesor
          </Link>
        </div>
      </div>
    </main>
  );
}
