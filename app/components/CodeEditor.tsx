"use client";

import Editor from "@monaco-editor/react";
import { useEffect, useMemo, useState } from "react";

export type LangKey = "python" | "java" | "pseint";

const langLabel: Record<LangKey, string> = {
  python: "Python",
  java: "Java",
  pseint: "PSeInt",
};

const monacoLang: Record<LangKey, string> = {
  python: "python",
  java: "java",
  pseint: "plaintext", // más adelante podrías añadir un tokenizer custom
};

type Props = {
  initialCode?: string;
  initialLang?: LangKey;
  onChange?: (code: string, lang: LangKey) => void;
  /** habilita modo solo lectura */
  readOnly?: boolean;
};

export default function CodeEditor({
  initialCode = "",
  initialLang = "python",
  onChange,
  readOnly = false,
}: Props) {
  const [code, setCode] = useState(initialCode);
  const [lang, setLang] = useState<LangKey>(initialLang);

  // Si cambian las props iniciales desde fuera (p.e. en /s/[id]), sincroniza
  useEffect(() => {
    setCode(initialCode);
  }, [initialCode]);

  useEffect(() => {
    setLang(initialLang);
  }, [initialLang]);

  // Notifica cambios hacia el padre (solo cuando no es readOnly)
  useEffect(() => {
    if (!readOnly) onChange?.(code, lang);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, lang, readOnly]);

  const monacoLanguage = useMemo(() => monacoLang[lang], [lang]);

  return (
    <div className="flex flex-col gap-3 w-full h-[70vh]">
      {/* Toolbar: oculta el selector en readOnly (o desactívalo si prefieres mostrarlo) */}
      {!readOnly ? (
        <div className="flex items-center gap-3">
          <label className="text-sm opacity-70">Lenguaje:</label>
          <select
            value={lang}
            onChange={(e) => setLang(e.target.value as LangKey)}
            className="rounded-md border border-white/10 bg-[#181A20] text-white px-2 py-1"
          >
            {Object.keys(langLabel).map((k) => (
              <option key={k} value={k} className="bg-[#181A20] text-white">
                {langLabel[k as LangKey]}
              </option>
            ))}
          </select>
        </div>
      ) : (
        <div className="text-sm opacity-70">
          Lenguaje: <span className="font-medium">{langLabel[lang]}</span>
        </div>
      )}

      {/* Monaco */}
      <div className="flex-1 rounded-xl overflow-hidden border border-white/10">
        <Editor
          height="100%"
          language={monacoLanguage}
          value={code}
          theme="vs-dark"
          onChange={(val) => {
            if (readOnly) return;            // no permitas edición
            setCode(val ?? "");
          }}
          options={{
            readOnly,                        // ← clave para Monaco
            fontSize: 14,
            minimap: { enabled: false },
            smoothScrolling: true,
            scrollBeyondLastLine: false,
            padding: { top: 12 },
          }}
        />
      </div>
    </div>
  );
}
