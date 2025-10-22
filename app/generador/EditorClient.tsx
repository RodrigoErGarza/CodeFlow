"use client";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function GeneradorPage() {
  const params = useSearchParams();
  const snippetId = params.get("snippet");
  const [snippet, setSnippet] = useState<any>(null);

  useEffect(() => {
    if (!snippetId) return;
    (async () => {
      const res = await fetch(`/api/snippets/${snippetId}`);
      if (res.ok) setSnippet(await res.json());
    })();
  }, [snippetId]);

  return (
    <div className="p-6">
      {snippet ? (
        <>
          <h1 className="text-2xl font-semibold mb-3">{snippet.title}</h1>
          <pre className="bg-white/5 p-3 rounded-lg border border-white/10 text-sm">
            {snippet.code}
          </pre>
        </>
      ) : (
        <div>Cargando snippet...</div>
      )}
    </div>
  );
}
