// app/onboarding/role/page.tsx
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function RolePickerPage() {

  const router = useRouter();
  return (
    <main className="min-h-dvh grid place-items-center px-6 text-white">
      <div className="w-full max-w-md space-y-6">
        <h1 className="text-2xl font-semibold">Elige tu rol</h1>
        <p className="opacity-80 text-sm">
          Selecciona cómo usarás CodeFlow.
        </p>

        <div className="grid gap-3">
             <button onClick={() => router.push("/onboarding/google-complete?role=STUDENT")}>
        Soy estudiante
      </button>

      <button onClick={() => router.push("/onboarding/google-complete?role=TEACHER")}>
        Soy profesor
      </button>
        </div>
      </div>
    </main>
  );
}
