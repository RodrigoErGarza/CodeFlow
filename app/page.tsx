// app/page.tsx
import Link from "next/link";
import FlowBackground from "./components/FlowBackGround";
import CTAButtons from "./components/CTAButtons";
import Image from "next/image";

export default async function Landing() {
  return (
    <main className="min-h-dvh bg-[#0D1321] text-white relative overflow-hidden">
      <FlowBackground />

      <section className="relative z-10 mx-auto max-w-7xl px-6 py-20 grid gap-12 md:grid-cols-2 items-center">
        {/* Izquierda */}
        <div>

          <h1 className="text-4xl md:text-6xl font-extrabold leading-tight">
            Transforma tu código en{" "}
            <span className="bg-gradient-to-r from-[#6a3df5] to-[#1ea1ff] bg-clip-text text-transparent">
              diagramas de flujo
            </span>
          </h1>

          <p className="mt-5 text-[#E3E6EB]/80 max-w-prose">
            Visualiza la lógica del programa con facilidad.
          </p>

          <CTAButtons />
        </div>

        {/* Derecha: imagen integrada “sin fondo” sobre los efectos */}
        <div className="relative">
          {/* Glow suave detrás para integrar con el fondo */}
          <div className="absolute -right-10 -bottom-10 h-40 w-40 rounded-full blur-3xl bg-[#22D2A0]/30" />

          <Image
            src="/codigoadiagrama.png" // <-- coloca aquí la imagen que me enviaste
            alt="De código a diagrama de flujo"
            width={900}
            height={900}
            priority
            className={[
              // Ajuste responsivo
              "w-full h-auto select-none pointer-events-none",
              // Hace que el negro/fondo oscuro desaparezca y deje ver los efectos detrás
              "mix-blend-lighten",
              // Glow sutil
              "[filter:drop-shadow(0_10px_30px_rgba(34,210,160,0.25))]",
            ].join(" ")}
          />
        </div>
      </section>

      <footer className="mt-10 text-center text-white/60 text-sm w-full pb-4">
        © {new Date().getFullYear()} CodeFlow. Todos los derechos reservados.
      </footer>
    </main>
  );
}

function Row({
  label,
  value,
  dim,
}: {
  label: string;
  value: string;
  dim?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between rounded-xl px-4 py-3 border ${
        dim ? "border-white/5 bg-white/[0.03]" : "border-white/10 bg-white/10"
      }`}
    >
      <span className="font-semibold text-[#22D2A0]">{label}</span>
      <span className="text-[#E3E6EB]">{value}</span>
    </div>
  );
}
