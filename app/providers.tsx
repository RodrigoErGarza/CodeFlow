"use client";

import { SessionProvider } from "next-auth/react";
import type { ReactNode } from "react";
import type { Session } from "next-auth";

/**
 * Envuelve la app con SessionProvider. Acepta Session | null | undefined
 * para empatar con getServerSession (que devuelve Session | null).
 */
export default function Providers({
  children,
  session,
}: {
  children: ReactNode;
  session?: Session | null;
}) {
  return <SessionProvider session={session}>{children}</SessionProvider>;
}
