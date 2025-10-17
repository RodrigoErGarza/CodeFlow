import { loadPyodideOnce } from "./pyodideLoader";

type Step = { line?: number; locals?: Record<string, string>; error?: string };

// Indenta código Python embebido en el try para que los numerales de línea coincidan
function indent(code: string, spaces = 4) {
  const pad = " ".repeat(spaces);
  return code
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((l) => (l.length ? pad + l : l))
    .join("\n");
}

export async function tracePython(code: string): Promise<Step[]> {
  // Carga (o reutiliza) la instancia global de Pyodide
  const pyodide = await loadPyodideOnce();

  const instrumented = `
import sys, json

_events = []

def _tracer(frame, event, arg):
    if event == 'line':
        try:
            locs = {k: repr(v) for k, v in frame.f_locals.items() if not k.startswith('__')}
        except Exception:
            locs = {}
        _events.append({"line": frame.f_lineno, "locals": locs})
    return _tracer

sys.settrace(_tracer)
try:
${indent(code)}
except Exception as _e:
    _events.append({"error": str(_e)})
finally:
    sys.settrace(None)

json.dumps(_events)
`;

  try {
  const out = pyodide.runPython(instrumented);
  const steps = JSON.parse(out) as Step[];
  return Array.isArray(steps) ? steps : [];
} catch (e: any) {
  // Si algo falla, el caller mostrará el mensaje
  return [{ error: e?.message || "No se pudo ejecutar la traza de Pyodide" }];
}
}
