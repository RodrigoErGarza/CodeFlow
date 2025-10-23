"use client";

import Editor, { OnChange, useMonaco } from "@monaco-editor/react";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";

type LangKey = "python" | "java" | "pseint";

const langLabel: Record<LangKey, string> = {
  python: "Python",
  java: "Java",
  pseint: "PSeInt",
};
const monacoLang: Record<LangKey, string> = {
  python: "python",
  java: "java",
  pseint: "plaintext",
};

type Props = {
  initialCode?: string;
  initialLang?: LangKey;
  onChange?: (code: string, lang: LangKey) => void;
  readOnly?: boolean;
  /** Rango a enfocar (p.ej. al clicar un nodo del diagrama) */
  focusRange?: { start: number; end: number } | null;
  /** Línea a resaltar (p.ej. paso actual de la simulación) */
  highlightLine?: number | null;
};

export default function CodeEditor({
  initialCode = "",
  initialLang = "python",
  onChange,
  readOnly = false,
  focusRange = null,
  highlightLine = null,
}: Props) {
  const [code, setCode] = useState(initialCode);
  const [lang, setLang] = useState<LangKey>(initialLang);

  const monaco = useMonaco();
  const editorRef = useRef<any>(null);
  const [decorations, setDecorations] = useState<string[]>([]);

  // Flag para distinguir cambios programáticos (setValue/sync) de cambios del usuario.
  const programmaticUpdate = useRef(false);

  const monacoLanguage = useMemo(() => monacoLang[lang], [lang]);

  const handleEditorMount = useCallback((editor: any) => {
    editorRef.current = editor;
  }, []);

  /** Sincroniza DESDE props solo cuando realmente cambia el initialCode. */
  useEffect(() => {
    if (initialCode === undefined) return;
    if (initialCode === code) return;

    programmaticUpdate.current = true;
    setCode(initialCode);

    // Actualiza el buffer del editor sin disparar onChange del usuario
    const ed = editorRef.current;
    if (ed && ed.getValue && ed.getValue() !== initialCode) {
      ed.setValue(initialCode);
    }

    // Libera el flag en el microtask siguiente (antes de próximos onChange de usuario)
    queueMicrotask(() => {
      programmaticUpdate.current = false;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialCode]);

  /** Sincroniza lenguaje si cambian las props. */
  useEffect(() => {
    setLang(initialLang as LangKey);
  }, [initialLang]);

  /** Asegura que el modelo de Monaco tenga el lenguaje correcto. */
  useEffect(() => {
    if (!monaco || !editorRef.current) return;
    const model = editorRef.current.getModel?.();
    if (model) {
      monaco.editor.setModelLanguage(model, monacoLanguage);
    }
  }, [monaco, monacoLanguage]);

  /** Notifica cambios al padre SOLO cuando cambia el lenguaje. */


  /** onChange del editor: ignora cambios programáticos, evita setState redundante y notifica al padre. */
  const handleChange = useCallback<OnChange>(
    (val) => {
      if (programmaticUpdate.current) return;
      const next = val ?? "";
      setCode((prev) => {
        if (prev === next) return prev;
        // Notifica al padre solo en cambios del usuario
        onChange?.(next, lang);
        return next;
      });
    },
    [onChange, lang]
  );

  /** Decoraciones (rango o línea). */
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor || !monaco) return;

    const decos: any[] = [];
    if (focusRange && focusRange.start != null && focusRange.end != null) {
      const startLine = Math.max(1, focusRange.start);
      const endLine = Math.max(startLine, focusRange.end);
      decos.push({
        range: new monaco.Range(startLine, 1, endLine, 1),
        options: { isWholeLine: true, className: "cf-focus-range" },
      });
      editor.revealLineInCenter(startLine);
    } else if (highlightLine && highlightLine > 0) {
      decos.push({
        range: new monaco.Range(highlightLine, 1, highlightLine, 1),
        options: { isWholeLine: true, className: "cf-highlight-line" },
      });
      editor.revealLineInCenter(highlightLine);
    }

    const newIds = editor.deltaDecorations(decorations, decos);
    setDecorations(newIds);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusRange, highlightLine, monaco]);

  /** Estilos de decoraciones (una sola vez). */
  useEffect(() => {
    if (!monaco) return;
    const styleId = "cf-editor-decos";
    if (document.getElementById(styleId)) return;
    const style = document.createElement("style");
    style.id = styleId;
    style.innerHTML = `
      .monaco-editor .cf-focus-range { background: rgba(56,189,248,.15); }
      .monaco-editor .cf-highlight-line { background: rgba(251,191,36,.18); }
    `;
    document.head.appendChild(style);
  }, [monaco]);

  return (
    <div className="flex flex-col gap-3 w-full h-[70vh]">
      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <label className="text-sm opacity-70">Lenguaje:</label>
        <select
          value={lang}
           onChange={(e) => {
            const next = e.target.value as LangKey;
            setLang(next);
            onChange?.(code, next);  // <- notifica aquí, NO en un efecto
          }}
          className="rounded-md border border-white/10 bg-[#181A20] text-white px-2 py-1"
          disabled={readOnly}
        >
          {(Object.keys(langLabel) as LangKey[]).map((k) => (
            <option key={k} value={k} className="bg-[#181A20] text-white">
              {langLabel[k]}
            </option>
          ))}
        </select>
      </div>

      {/* Monaco */}
      <div className="flex-1 rounded-xl overflow-hidden border border-white/10">
        <Editor
          height="100%"
          language={monacoLanguage}     // una sola fuente para el lenguaje
          value={code}                  // controlado por estado local
          theme="vs-dark"
          onMount={handleEditorMount}
          onChange={handleChange}
          options={{
            readOnly,
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
