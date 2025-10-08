import Image from "next/image";

export default function Logo({ size = 32 }: { size?: number }) {
  return (
    <div
      style={{ width: size, height: size }}
      className="relative rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 shadow-[0_0_20px_rgba(34,210,255,0.35)] flex items-center justify-center"
    >
      <Image
        src="/logocircular.png"
        alt="Logo"
        width={size * 0.8}
        height={size * 0.8}
        className="rounded-full object-contain"
        priority
      />
      {/* Glow extra */}
      <div className="absolute inset-0 rounded-full pointer-events-none animate-pulse bg-cyan-400/10 blur-xl" />
    </div>
  );
}