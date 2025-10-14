"use client";

import { useEffect, useMemo } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useEdgesState,
  useNodesState,
  Edge,
  Node,
} from "reactflow";
import "reactflow/dist/style.css";

/** Estructura que devuelve tu /api/flow/compile */
export type FlowGraph = {
  nodes: Array<{ id: string; type?: string; label?: string; position?: { x: number; y: number } }>;
  edges: Array<{ id: string;  source: string; target: string; label?: string }>;
};

type Props = {
  graph?: FlowGraph | null;
};

export default function FlowCanvas({ graph }: Props) {
  // Si no hay posiciones, creamos un layout simple vertical
  const [nodes, setNodes, onNodesChange] = useNodesState<Node[]>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge[]>([]);

  const laidOut = useMemo(() => {
    if (!graph) return { nodes: [], edges: [] };

    // 1) Convertimos a formato ReactFlow
    const baseNodes: Node[] = graph.nodes.map((n, i) => ({
      id: n.id,
      type: "default",
      data: { label: n.label || n.type || n.id },
      position: n.position ?? { x: 80, y: i * 120 }, // fallback: columnas simples
      style: styleForNode(n.type),
    }));

    const baseEdges: Edge[] = graph.edges.map((e, i) => ({
      id: `e${i}`,
      source: e.source,
      target: e.target,
      label: e.label,
      animated: !!e.label && e.label.toLowerCase() === "sí", // ejemplo: animamos la rama 'Sí'
      style: { strokeWidth: 2 },
      labelBgPadding: [6, 3],
      labelBgBorderRadius: 4,
      labelBgStyle: { fill: "rgba(13,19,33,.85)", stroke: "rgba(255,255,255,.1)" },
    }));

    return { nodes: baseNodes, edges: baseEdges };
  }, [graph]);

  useEffect(() => {
    setNodes(laidOut.nodes);
    setEdges(laidOut.edges);
  }, [laidOut, setNodes, setEdges]);

  return (
    <div className="h-[70vh] w-full rounded-xl overflow-hidden border border-white/10">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
      >
        <Background gap={16} />
        <MiniMap
          nodeStrokeColor={(n) => (n.style?.border as string) || "#666"}
          nodeColor={(n) => (n.style?.background as string) || "#1f2937"}
        />
        <Controls />
      </ReactFlow>
    </div>
  );
}

function styleForNode(type?: string) {
  const base = {
    color: "white",
    background: "rgba(255,255,255,.04)",
    border: "1px solid rgba(255,255,255,.12)",
    borderRadius: 12,
    padding: 10,
  };
  switch ((type || "").toLowerCase()) {
    case "start":
      return { ...base, background: "rgba(34, 211, 238, .12)", border: "1px solid rgba(34,211,238,.35)" };
    case "end":
      return { ...base, background: "rgba(99, 102, 241, .12)", border: "1px solid rgba(99,102,241,.35)" };
    case "decision":
      return { ...base, background: "rgba(234, 179, 8, .12)", border: "1px solid rgba(234,179,8,.35)" };
    default:
      return base;
  }
}
