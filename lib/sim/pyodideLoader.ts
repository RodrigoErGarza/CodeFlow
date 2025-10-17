// lib/sim/pyodideLoader.ts

// Asegura tipos de las globals que inyecta pyodide.js
declare global {
  interface Window {
    loadPyodide?: (opts: { indexURL: string }) => Promise<any>;
    pyodide?: any;
  }
}

let _once: Promise<any> | null = null;

export async function loadPyodideOnce() {
  if (typeof window === "undefined") {
    throw new Error("Pyodide solo puede cargarse en el cliente.");
  }
  if (_once) return _once;

  _once = new Promise<any>((resolve, reject) => {
    // Si ya existe la función global, solo inicializamos
    if (window.loadPyodide) {
      window
        .loadPyodide({ indexURL: "https://cdn.jsdelivr.net/pyodide/v0.25.1/full/" })
        .then((pyodide) => resolve(pyodide))
        .catch(reject);
      return;
    }

    // Inyecta el script de pyodide (NO .mjs)
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/pyodide/v0.25.1/full/pyodide.js";
    script.async = true;
    script.onload = () => {
      if (!window.loadPyodide) {
        reject(new Error("No se encontró window.loadPyodide después de cargar el script"));
        return;
      }
      window
        .loadPyodide({ indexURL: "https://cdn.jsdelivr.net/pyodide/v0.25.1/full/" })
        .then((pyodide) => resolve(pyodide))
        .catch(reject);
    };
    script.onerror = () => reject(new Error("No se pudo cargar Pyodide"));
    document.head.appendChild(script);
  });

  return _once;
}

// Útil para pruebas si alguna vez lo necesitas
export function _resetPyodideForTests() {
  _once = null;
  if (typeof window !== "undefined") {
    delete window.pyodide;
  }
}
