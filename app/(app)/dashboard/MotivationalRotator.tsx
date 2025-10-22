// app/dashboard/MotivationalRotator.tsx
"use client";
import { useEffect, useState } from "react";

const FRASES = [
  { text: "Cada bug te enseña algo. ¡Sigue!", icon: "🪲" },
  { text: "Pequeños commits, grandes proyectos.", icon: "🧱" },
  { text: "Lee el error, ahí está la pista.", icon: "🔎" },
  { text: "Primero que funcione, luego optimiza.", icon: "⚙️" },
  { text: "La práctica hace al dev.", icon: "💻" },
];

export default function MotivationalRotator() {
  const [i, setI] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setI((v) => (v + 1) % FRASES.length), 30_000); // 3 min
    return () => clearInterval(id);
  }, []);

  const f = FRASES[i];

  return (
    <div className="flex items-center gap-3">
      <span className="text-2xl">{f.icon}</span>
      <span className="opacity-90">{f.text}</span>
    </div>
  );
}
