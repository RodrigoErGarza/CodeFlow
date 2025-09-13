// app/components/CodeRain.tsx
"use client";

import { useEffect, useRef } from "react";

export default function CodeRain({
  density = 18,         // columnas
  speed = 55,           // ms por frame
  opacity = 0.22,
}: { density?: number; speed?: number; opacity?: number }) {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext("2d")!;
    let w = (canvas.width = canvas.offsetWidth);
    let h = (canvas.height = canvas.offsetHeight);

    const letters = "01{}[]()</>;$=#*&+-|".split("");
    const fontSize = 14;
    const cols = Math.max(10, Math.floor(w / (fontSize * (18 / density))));
    const drops = Array(cols).fill(1);

    let raf: number;
    let timer: number;

    const draw = () => {
      ctx.fillStyle = `rgba(13,19,33,${1 - opacity})`; // base #0D1321
      ctx.fillRect(0, 0, w, h);

      ctx.fillStyle = "#22D2A0";
      ctx.font = `${fontSize}px ui-monospace, SFMono-Regular, Menlo, monospace`;

      for (let i = 0; i < drops.length; i++) {
        const text = letters[Math.floor(Math.random() * letters.length)];
        const x = i * (w / cols);
        const y = drops[i] * fontSize;
        ctx.fillText(text, x, y);
        if (y > h && Math.random() > 0.975) drops[i] = 0;
        drops[i]++;
      }
    };

    const step = () => {
      draw();
      timer = window.setTimeout(() => (raf = requestAnimationFrame(step)), speed);
    };

    const onResize = () => {
      w = canvas.width = canvas.offsetWidth;
      h = canvas.height = canvas.offsetHeight;
    };
    window.addEventListener("resize", onResize);
    step();

    return () => {
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(raf);
      clearTimeout(timer);
    };
  }, [density, speed, opacity]);

  return (
    <div className="relative">
      <canvas ref={ref} className="absolute inset-0 w-full h-[220px] rounded-xl opacity-70" />
    </div>
  );
}
