import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const user = session?.user;

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 space-y-6 px-4 pt-8">
        <h1 className="text-3xl font-bold">
          Bienvenido de vuelta{user?.name ? `, ${user.name}` : ""} 👋
        </h1>

        <div className="grid gap-4 md:grid-cols-3">
          <Card title="Actividad reciente">
            <p className="text-sm opacity-80">Aún no hay actividad.</p>
          </Card>

          <Card title="Aprendizaje">
            <div className="space-y-2 text-sm">
              <Button>Estructuras de control</Button>
              <Button>Ver Tutorial</Button>
            </div>
          </Card>

          <Card title="Progreso">
            <p className="text-sm opacity-80">0 de 20 completados</p>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card title="Snippets recientes">
            <p className="text-sm opacity-80">Sin snippets todavía.</p>
          </Card>
          <Card title="Acciones rápidas">
            <div className="flex flex-wrap gap-3">
              <Button>Nuevo flujo</Button>
              <Button>Mis proyectos</Button>
              <Button>Retos</Button>
            </div>
          </Card>
        </div>
      </div>

      <footer className="text-center text-white/60 text-sm w-full pb-4 mt-auto">
        © {new Date().getFullYear()} CodeFlow. Todos los derechos reservados.
      </footer>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.03)]">
      <h2 className="font-semibold mb-2">{title}</h2>
      {children}
    </div>
  );
}

function Button({ children }: { children: React.ReactNode }) {
  return (
    <button className="border border-white/10 rounded px-3 py-2 hover:bg-white/10 transition">
      {children}
    </button>
  );
}
