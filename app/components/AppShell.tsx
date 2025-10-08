// app/components/AppShell.tsx
"use client";

import { useState } from "react";
import Sidebar from "@/app/components/Sidebar";
import Topbar from "@/app/components/Topbar";


export default function AppShell({
  children,
  user,
}: {
  children: React.ReactNode;
  user?: { name?: string | null; email?: string | null; role?: string | null };
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#0D1321] text-white flex">
      <Sidebar open={open} onClose={() => setOpen(false)} />
      <div className="flex-1 flex flex-col md:ml-0">
        <Topbar user={user} onMenu={() => setOpen(true)} />
        <main className="relative p-4 md:p-6">{children}</main>
       </div>
    </div>
  );
}
