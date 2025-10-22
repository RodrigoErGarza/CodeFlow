// app/dashboard/page.tsx
import { headers } from "next/headers";
import Link from "next/link";
import MotivationalRotator from "./MotivationalRotator";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

function fmtFecha(d?: string|Date) {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleString();
}


export default async function DashboardPage() {
  const h = await headers();
  const cookie = h.get("cookie") ?? "";
  const base = process.env.NEXT_PUBLIC_BASE_URL || "";
  const session = await getServerSession(authOptions);
  const user = session?.user;


  const res = await fetch(`${base}/api/dashboard/overview`, {
    headers: { cookie },
    cache: "no-store",
  });
  const data = await res.json();

  const { actividadReciente, progresoUnidades, snippetsRecientes, stats } = data;

  const pct =
    progresoUnidades?.totalUnits
      ? Math.min(
          100,
          Math.round(
            ((progresoUnidades.completedUnits || 0) /
              (progresoUnidades.totalUnits || 1)) * 100
          )
        )
      : 0;

  return (
    <div className="p-6">
      <h1 className="text-2xl md:text-3xl font-semibold mb-4">
        Bienvenido de vuelta{user?.name ? `, ${user.name}` : ""} 👋
      </h1>

      <div className="grid gap-4 md:grid-cols-3">
        {/* Actividad reciente */}
        <Card title="Actividad reciente">
          {actividadReciente ? (
            <div className="space-y-1">
              <div className="text-sm opacity-70">{actividadReciente.type}</div>
              <div className="font-medium">{actividadReciente.label}</div>
              <div className="text-xs opacity-60">{fmtFecha(actividadReciente.when)}</div>
              {actividadReciente.href && (
                <div className="mt-2">
                  <Link
                    href={actividadReciente.href}
                    className="text-sm px-3 py-1.5 rounded bg-white/10 hover:bg-white/15"
                  >
                    Reanudar
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <div className="opacity-70 text-sm">Aún no hay actividad.</div>
          )}
        </Card>

        {/* Progreso por UNIDADES */}
        <Card title="Aprendizaje / Progreso">
          <div className="text-sm opacity-70">Unidades completadas</div>
          <div className="mt-1 text-xl font-semibold">
            {progresoUnidades?.completedUnits ?? 0} / {progresoUnidades?.totalUnits ?? 0}
          </div>
          <div className="mt-3 h-2 rounded bg-white/10 overflow-hidden">
            <div className="h-full bg-indigo-500" style={{ width: `${pct}%` }} />
          </div>
          <div className="mt-2 text-xs opacity-70">
            Promedio de avance: {progresoUnidades?.avgUnitPercent ?? 0}%
          </div>
        </Card>

        {/* Motivación */}
        <Card title="Motivación">
          <MotivationalRotator />
        </Card>
      </div>

      {/* Fila 2: Snippets + Stats */}
      <div className="grid gap-4 md:grid-cols-2 mt-4">
        <Card title="Snippets recientes">
          {!snippetsRecientes || snippetsRecientes.length === 0 ? (
            <div className="opacity-70 text-sm">Sin snippets todavía.</div>
          ) : (
            <ul className="divide-y divide-white/10">
              {snippetsRecientes.map((s: any) => (
                <li key={s.id} className="py-2 flex items-center justify-between">
                  <div>
                    <div className="font-medium">{s.title || "Sin título"}</div>
                    <div className="text-xs opacity-60">{fmtFecha(s.updatedAt)}</div>
                  </div>
                  <Link
                    href={`/generador?snippet=${s.id}`}
                    className="text-sm px-3 py-1.5 rounded bg-white/10 hover:bg-white/15"
                  >
                    Abrir
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Estadísticas">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <Stat label="Intentos pasados" value={stats?.passedAttempts ?? 0} />
            <Stat label="Intentos totales" value={stats?.totalAttempts ?? 0} />
          </div>
        </Card>
        

        
      </div>
      
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="text-sm opacity-70 mb-2">{title}</div>
      {children}
    </section>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
      <div className="opacity-70">{label}</div>
      <div className="mt-1 text-lg font-semibold">{value}</div>
    </div>
  );
}
