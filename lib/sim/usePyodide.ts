import { loadPyodideOnce } from "./pyodideLoader";

type Step = { line?: number; locals?: Record<string, string>; error?: string };

// ⚠️ Ya no indentamos el código en un try: mantener numeración exacta
export async function tracePython(code: string): Promise<Step[]> {
  const pyodide = await loadPyodideOnce();

  // Pasamos el código del usuario a Pyodide y trazamos SOLO ese "archivo"
  const instrumented = `
import sys, json
from io import StringIO

_EVENTS = []
_stdout_buf = StringIO()

# proxy para capturar stdout
class _StdoutProxy:
    def write(self, s):
        _stdout_buf.write(s)
    def flush(self):
        pass

_old_stdout = sys.stdout
sys.stdout = _StdoutProxy()

def _tracer(frame, event, arg):
    # sólo líneas del "archivo" del usuario
    if event == "line" and frame.f_code.co_filename == "<user>":
        try:
            locs = {}
            for k, v in frame.f_locals.items():
                if not str(k).startswith("__"):
                    try:
                        locs[k] = repr(v)
                    except Exception:
                        locs[k] = "<unrepr>"
        except Exception:
            locs = {}
        _EVENTS.append({"line": frame.f_lineno, "locals": locs})
    return _tracer

sys.settrace(_tracer)

_ERR = None
try:
    __CODE = compile(__USER_SOURCE__, "<user>", "exec")
    __G = {}
    exec(__CODE, __G, __G)
except Exception as e:
    _ERR = str(e)
finally:
    sys.settrace(None)
    sys.stdout = _old_stdout

# stdout como líneas
_out_lines = _stdout_buf.getvalue().splitlines()

# armamos salida
if _ERR is not None:
    # último frame con error
    _EVENTS.append({"error": _ERR})
elif _out_lines:
    # frame final con stdout (opcional, no rompe a quien no lo use)
    _EVENTS.append({"stdout": _out_lines})

json.dumps(_EVENTS)
  `;

  try {
    // ponemos el código del usuario en una global temporal
    pyodide.globals.set("__USER_SOURCE__", code);
    const out = pyodide.runPython(instrumented);
    const steps = JSON.parse(out) as Step[];
    return Array.isArray(steps) ? steps : [];
  } catch (e: any) {
    return [{ error: e?.message || "No se pudo ejecutar la traza de Pyodide" }];
  } finally {
    try {
      pyodide.globals.delete("__USER_SOURCE__");
    } catch {}
  }
}
