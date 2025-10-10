import CodeEditor from "@/app/components/CodeEditor";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function PublicSnippetPage({ params }: { params: { id: string } }) {
  const base = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const res = await fetch(`${base}/api/public/snippets/${params.id}`, { cache: "no-store" });

  if (!res.ok) notFound();
  const { item } = await res.json();

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{item.title}</h1>
        <Link href="/" className="text-sm underline opacity-80 hover:opacity-100">
          Ir a CodeFlow
        </Link>
      </div>

      {/* Si tu CodeEditor no tiene modo readonly, añade un prop y desactiva edición internamente */}
      <CodeEditor initialCode={item.code} initialLang={item.language} readOnly />
      <p className="text-xs opacity-60">Última actualización: {new Date(item.updatedAt).toLocaleString()}</p>
    </div>
  );
}
