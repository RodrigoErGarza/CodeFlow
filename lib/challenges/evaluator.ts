export type RuleContains = { type: "contains"; tokens: string[] };
export type RuleNotContains = { type: "notContains"; tokens: string[] };
export type RuleLineCount = { type: "lineCount"; min?: number; max?: number };

export type ChallengeRules = Array<RuleContains | RuleNotContains | RuleLineCount>;

export type TestsJsonShape = {
  meta?: {
    requiresUnitNumber?: number;
    hint?: string;
  };
  // por compatibilidad: a veces llamaste "rules", otras veces pusiste los objetos sueltos
  rules?: ChallengeRules;
} & Partial<Record<"type" | "tokens" | "min" | "max", any>>; // tolerante a formatos viejos

export type EvalResult = {
  passed: number;
  total: number;
  feedback: string[];
  score: number; // 0..100
};

/**
 * Normaliza el testsJson (que puede venir en tus retos a veces como objeto suelto o array)
 * y lo convierte en un arreglo de reglas tipadas.
 */
export function normalizeRules(testsJson: TestsJsonShape | null): ChallengeRules {
  if (!testsJson) return [];

  // Caso A: viene como { rules: [...] }
  if (Array.isArray(testsJson.rules)) {
    return testsJson.rules as ChallengeRules;
  }

  // Caso B: viene como objeto suelto, p. ej. {"type":"contains","tokens":["if"]}
  if (testsJson.type) {
    const one: any = {
      type: testsJson.type,
      tokens: testsJson.tokens,
      min: testsJson.min,
      max: testsJson.max,
    };
    return [one] as ChallengeRules;
  }

  // Nada
  return [];
}

function includesInsensitive(haystack: string, needle: string) {
  return haystack.toLowerCase().includes(needle.toLowerCase());
}

/**
 * Evalúa el "code" del usuario contra las reglas normalizadas.
 * NO ejecuta el código, solo inspecciona texto (seguro).
 */
export function evaluateCode(code: string, rules: ChallengeRules): EvalResult {
  const feedback: string[] = [];
  let passed = 0;
  const total = rules.length;

  for (const r of rules) {
    if (r.type === "contains") {
      const allOk = r.tokens.every((t) => includesInsensitive(code, String(t)));
      if (allOk) {
        passed++;
      } else {
        feedback.push(
          `Faltan elementos requeridos: ${r.tokens.map((t) => `"${t}"`).join(", ")}.`
        );
      }
    } else if (r.type === "notContains") {
      const noneFound = r.tokens.every((t) => !includesInsensitive(code, String(t)));
      if (noneFound) {
        passed++;
      } else {
        feedback.push(
          `Tu solución contiene elementos no permitidos: ${r.tokens
            .map((t) => `"${t}"`)
            .join(", ")}.`
        );
      }
    } else if (r.type === "lineCount") {
      const lines = code.split(/\r?\n/).length;
      const min = typeof r.min === "number" ? r.min : undefined;
      const max = typeof r.max === "number" ? r.max : undefined;

      const okMin = min === undefined || lines >= min;
      const okMax = max === undefined || lines <= max;

      if (okMin && okMax) {
        passed++;
      } else {
        if (!okMin && !okMax) {
          feedback.push(`El número de líneas debe estar entre ${min} y ${max}. Tienes ${lines}.`);
        } else if (!okMin) {
          feedback.push(`Debes tener al menos ${min} líneas. Tienes ${lines}.`);
        } else {
          feedback.push(`Debes tener como máximo ${max} líneas. Tienes ${lines}.`);
        }
      }
    } else {
      // Regla desconocida → no bloquea (para no romper)
      passed++;
    }
  }

  const score = total === 0 ? 100 : Math.round((passed / total) * 100);
  if (total === 0 && feedback.length === 0) {
    feedback.push("No hay reglas de evaluación definidas; se considera correcto.");
  }

  return { passed, total, feedback, score };
}
