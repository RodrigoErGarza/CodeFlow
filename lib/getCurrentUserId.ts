// /lib/getCurrentUserId.ts
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function getCurrentUserId() {
  const session = await getServerSession(authOptions as any);
  return (session as any)?.user?.id || "demo-user";
}
