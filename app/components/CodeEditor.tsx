"use client";

import Editor from "@monaco-editor/react";
import { useEffect, useMemo, useState } from "react";

type LangKey = "python" | "java" | "pseint";

const langLabel: Record<LangKey, string> = {
  python: "Python",
  java: "Java",
  pseint: "PSeInt", // lo trataremos como 'plaintext' por ahora
};

const monacoLang: Record<LangKey, string> = {
  python: "python",
  java: "java",
  pseint: "plaintext", // más adelante podemos crear un tokenizer custom
};

export default function CodeEditor({
  initialCode = "",
  initialLang = "python",
  onChange,
}: {
  initialCode?: string;
  initialLang?: LangKey;
  onChange?: (code: string, lang: LangKey) => void;
}) {
  const [code, setCode] = useState(initialCode);
  const [lang, setLang] = useState<LangKey>(initialLang as LangKey);

  // Notifica cambios hacia el padre
  useEffect(() => {
    onChange?.(code, lang);
  }, [code, lang, onChange]);

  const monacoLanguage = useMemo(() => monacoLang[lang], [lang]);

  return (
    <div className="flex flex-col gap-3 w-full h-[70vh]">
      {/* Toolbar */}
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

      {/* Monaco */}
      <div className="flex-1 rounded-xl overflow-hidden border border-white/10">
        <Editor
          height="100%"
          defaultLanguage={monacoLanguage}
          language={monacoLanguage}
          value={code}
          theme="vs-dark"
          onChange={(val) => setCode(val ?? "")}
          options={{
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
