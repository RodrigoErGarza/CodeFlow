// app/grupos/layout.tsx
import Sidebar from "@/app/components/Sidebar";

export default function GruposLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
