// app/onboarding/google-complete/loading.tsx
export default function LoadingGoogleComplete() {
  return (
    <main className="min-h-dvh grid place-items-center text-white">
      <div className="space-y-2 text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-white/30 border-t-white mx-auto" />
        <p className="opacity-80">Procesando tu elección…</p>
      </div>
    </main>
  );
}
