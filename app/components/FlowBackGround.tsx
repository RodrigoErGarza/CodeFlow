// app/components/FlowBackground.tsx
// Server Component
export default function FlowBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* orbs suaves */}
      <div className="absolute -top-24 -left-24 h-[28rem] w-[28rem] rounded-full blur-3xl bg-gradient-to-tr from-[#6a3df5]/25 to-[#1ea1ff]/25" />
      <div className="absolute bottom-0 right-0 h-[24rem] w-[24rem] rounded-full blur-3xl bg-gradient-to-tr from-[#1ea1ff]/20 to-[#22D2A0]/20" />

      {/* curvas animadas */}
      <svg
        className="absolute inset-0 opacity-40"
        viewBox="0 0 1200 800"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <linearGradient id="g1" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#6a3df5" />
            <stop offset="100%" stopColor="#1ea1ff" />
          </linearGradient>
        </defs>

        {[
          "M-100 100 C 200 0, 400 200, 700 120 S 1100 80, 1300 180",
          "M-120 300 C 200 250, 400 380, 700 300 S 1100 250, 1300 320",
          "M-140 520 C 220 520, 420 520, 720 520 S 1120 520, 1320 520",
        ].map((d, i) => (
          <g key={i}>
            <path
              d={d}
              stroke="url(#g1)"
              strokeWidth={1.2}
              strokeOpacity={0.35}
            />
            <path
              d={d}
              stroke="url(#g1)"
              strokeWidth={2.5}
              strokeLinecap="round"
              style={{
                strokeDasharray: 12,
                animation: `dash ${12 + i * 4}s linear infinite`,
              }}
            />
          </g>
        ))}
      </svg>

      <style
        dangerouslySetInnerHTML={{
          __html: `
          @keyframes dash {
            to { stroke-dashoffset: -240; }
          }
        `,
        }}
      />
    </div>
  );
}
