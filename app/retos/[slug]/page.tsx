// app/retos/[slug]/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import CodeEditor from "@/app/components/CodeEditor";

type ChallengeDetail = {
  slug: string;
  title: string;
  description: string;
  language: "python" | "java" | "pseint";
  starterCode: string;
  lessonId: string;
  tests?: { expectedTokens?: string[]; tip?: string };
};

export default function RetoDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const [challenge, setChallenge] = useState<ChallengeDetail | null>(null);
  const [code, setCode] = useState("");
  const [lang, setLang] = useState<"python" | "java" | "pseint">("python");
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState<string[]>([]);
  const [passed, setPassed] = useState<boolean | null>(null);

  async function load() {
    const res = await fetch(`/api/challenges/${params.slug}`, { cache: "no-store" });
    if (!res.ok) return;
    const data = await res.json();
    const item: ChallengeDetail = data.item;
    setChallenge(item);
    setCode(item.starterCode || "");
    setLang(item.language || "python");
    setMessages([]);
    setPassed(null);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.slug]);

  const expected = useMemo(
    () => challenge?.tests?.expectedTokens || [],
    [challenge]
  );

  function localCheck(): { ok: boolean; messages: string[] } {
    if (!expected.length) {
      return {
        ok: true,
        messages: ["(No hay pruebas configuradas para este reto)"],
      };
    }
    const missing = expected.filter((t) => !code.includes(t));
    if (missing.length === 0) {
      return { ok: true, messages: ["✅ ¡Tus cambios contienen los tokens esperados!"] };
    }
    return {
      ok: false,
      messages: [
        "❌ Faltan tokens esperados:",
        ...missing.map((m) => `- ${m}`),
        challenge?.tests?.tip ? `💡 Tip: ${challenge.tests.tip}` : "",
      ].filter(Boolean),
    };
  }

  async function submit() {
    setBusy(true);
    setMessages([]);
    try {
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          challengeSlug: params.slug,
          code,
          language: lang,
        }),
      });
      const data = await res.json();
      setMessages(data?.messages || []);
      setPassed(!!data?.passed);
    } finally {
      setBusy(false);
    }
  }

  if (!challenge) return <div className="p-6">Cargando…</div>;

  const local = localCheck();

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm opacity-70">Reto</div>
          <h1 className="text-2xl font-semibold">{challenge.title}</h1>
          <p className="opacity-80 mt-1">{challenge.description}</p>
        </div>
        <Link
          href="/retos"
          className="px-3 py-2 rounded border border-white/10 bg-white/10 hover:bg-white/20"
        >
          Volver
        </Link>
      </div>

      <CodeEditor
        initialCode={code}
        initialLang={lang}
        onChange={(c, l) => {
          setCode(c);
          setLang(l as any);
          setPassed(null);
        }}
      />

      <div className="flex items-center gap-2">
        <button
          onClick={() => {
            const chk = localCheck();
            setMessages(chk.messages);
            setPassed(chk.ok);
          }}
          className="px-3 py-2 rounded border border-white/10 bg-white/10 hover:bg-white/20"
        >
          Probar (local)
        </button>

        <button
          onClick={submit}
          disabled={busy}
          className="px-3 py-2 rounded bg-gradient-to-r from-indigo-500 to-blue-500 text-white disabled:opacity-60"
        >
          {busy ? "Enviando…" : "Entregar"}
        </button>

        {passed != null && (
          <span
            className={`text-sm px-2 py-1 rounded ${
              passed ? "bg-emerald-500/20 text-emerald-300" : "bg-red-500/20 text-red-300"
            }`}
          >
            {passed ? "Aprobado" : "Pendiente"}
          </span>
        )}
      </div>

      <div className="rounded-xl border border-white/10 p-3 bg-white/5">
        <div className="text-sm opacity-70 mb-2">Mensajes</div>
        {messages.length ? (
          <ul className="list-disc pl-5 space-y-1 text-sm">
            {messages.map((m, i) => (
              <li key={i}>{m}</li>
            ))}
          </ul>
        ) : (
          <div className="text-sm opacity-60">Sin mensajes por ahora.</div>
        )}
      </div>

      {expected.length ? (
        <div className="rounded-xl border border-white/10 p-3 bg-white/5">
          <div className="text-sm opacity-70 mb-2">Pruebas esperadas</div>
          <ul className="list-disc pl-5 text-sm">
            {expected.map((t, i) => (
              <li key={i}>
                Debe aparecer el token: <code className="opacity-90">{t}</code>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
