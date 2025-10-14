// app/lib/elk.ts
import ELK, { ElkNode, ElkExtendedEdge } from "elkjs/lib/elk.bundled.js";
import type { FlowGraph } from "@/app/components/FlowCanvas";

// Ajusta aquí tamaños/espaciado si lo necesitas
const DEFAULTS = {
  direction: "DOWN", // "RIGHT" si quieres horizontal
  nodeWidth: 180,
  nodeHeight: 44,
  spacing: 70,
};

const elk = new ELK();

/**
 * Recibe un FlowGraph (nodes, edges) sin posiciones y devuelve
 * nodes con position.x/y aplicadas.
 */
export async function layoutWithELK(
  graph: FlowGraph,
  opts?: Partial<typeof DEFAULTS>
): Promise<FlowGraph> {
  const cfg = { ...DEFAULTS, ...(opts || {}) };

  const elkGraph: ElkNode = {
    id: "root",
    layoutOptions: {
      "elk.algorithm": "layered",
      "elk.direction": cfg.direction,
      "elk.spacing.nodeNode": `${cfg.spacing}`,
      "elk.layered.spacing.nodeNodeBetweenLayers": `${cfg.spacing}`,
      "elk.layered.crossingMinimization.semiInteractive": "true",
    },
    children: graph.nodes.map((n) => ({
      id: n.id,
      width: cfg.nodeWidth,
      height: cfg.nodeHeight,
    })),
    edges: graph.edges.map(
      (e) =>
        ({
          id: e.id,
          sources: [e.source],
          targets: [e.target],
        } as ElkExtendedEdge)
    ),
  };

  const res = await elk.layout(elkGraph);

  const byId = new Map(res.children?.map((c) => [c.id, c]) ?? []);

  return {
    nodes: graph.nodes.map((n) => ({
      ...n,
      position: {
        x: byId.get(n.id)?.x ?? 0,
        y: byId.get(n.id)?.y ?? 0,
      },
    })),
    edges: graph.edges,
  };
}
