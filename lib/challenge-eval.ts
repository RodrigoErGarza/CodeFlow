// lib/challenge-eval.ts
type Rule =
  | { type: "contains"; tokens: string[] }
  | { type: "notContains"; tokens: string[] }
  | { type: "regex"; patterns: string[] }
  | { type: "lineCount"; min?: number; max?: number };

export type EvalResult = {
  pass: boolean;
  results: { name: string; pass: boolean; message: string }[];
};

export function evaluate(code: string, rules: Rule[]): EvalResult {
  const results: EvalResult["results"] = [];

  for (const r of rules) {
    if (r.type === "contains") {
      const ok = r.tokens.every(t => code.includes(t));
      results.push({
        name: "contains",
        pass: ok,
        message: ok ? `Incluye: ${r.tokens.join(", ")}` : `Falta alguno de: ${r.tokens.join(", ")}`,
      });
    } else if (r.type === "notContains") {
      const ok = r.tokens.every(t => !code.includes(t));
      results.push({
        name: "notContains",
        pass: ok,
        message: ok ? `No incluye: ${r.tokens.join(", ")}` : `Aparece alguno de: ${r.tokens.join(", ")}`,
      });
    } else if (r.type === "regex") {
      const oks = r.patterns.map((p) => {
        const re = new RegExp(p, "m");
        return re.test(code);
      });
      const ok = oks.every(Boolean);
      results.push({
        name: "regex",
        pass: ok,
        message: ok ? `Coinciden todas las expresiones` : `Algún patrón no coincide`,
      });
    } else if (r.type === "lineCount") {
      const lines = code.split(/\r?\n/).length;
      const okMin = r.min ? lines >= r.min : true;
      const okMax = r.max ? lines <= r.max : true;
      const ok = okMin && okMax;
      results.push({
        name: "lineCount",
        pass: ok,
        message: `Líneas: ${lines} (min: ${r.min ?? "-"}, max: ${r.max ?? "-"})`,
      });
    }
  }

  return { pass: results.every(r => r.pass), results };
}
