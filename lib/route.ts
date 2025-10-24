// lib/route.ts
import type { NextRequest } from "next/server";

/** Contexto de Next 15: params ahora es una Promise */
export type Ctx<T extends Record<string, string>> = { params: Promise<T> };

/** Azúcar sintáctico para leer params tipados */
export const getParams = async <T extends Record<string, string>>(ctx: Ctx<T>) =>
  await ctx.params;

/** Exporto el tipo por comodidad en los handlers */
export type { NextRequest };
