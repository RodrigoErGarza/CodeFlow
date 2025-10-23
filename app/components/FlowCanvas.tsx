"use client";

import { forwardRef, useEffect, useImperativeHandle, useMemo, useCallback } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useEdgesState,
  useNodesState,
  useReactFlow,
  ReactFlowProvider,
  Edge,
  Node,
} from "reactflow";
import "reactflow/dist/style.css";

/** Estructura que devuelve /api/flow/compile */
export type FlowGraph = {
  nodes: Array<{
    id: string;
    type?: string;
    label?: string;
    position?: { x: number; y: number };
    meta?: { line?: number }; // opcional, ayuda a sincronizar con el editor
  }>;
  edges: Array<{ id: string; source: string; target: string; label?: string }>;
};

type Props = {
  graph?: FlowGraph | null;
  /** nodo a resaltar (p.ej. paso actual de la simulación) */
  selectedNodeId?: string | null;
  /** click en nodo → saltar a código si hay meta.line */
  onNodeClick?: (info: { id: string; range?: { start: number; end: number } }) => void;
};

export type FlowCanvasHandle = {
  fitView: () => void;
};

/** ---- Componente público: mantiene el ReactFlowProvider ---- */
const FlowCanvas = forwardRef<FlowCanvasHandle, Props>(function FlowCanvas(
  { graph, selectedNodeId = null, onNodeClick },
  ref
) {
  // inyecta CSS para el “pulse” una sola vez
  useEffect(() => {
    const id = "cf-node-pulse-css";
    if (document.getElementById(id)) return;
    const style = document.createElement("style");
    style.id = id;
    style.innerHTML = `
      @keyframes cfPulse {
        0%   { box-shadow: 0 0 0 0 rgba(99,102,241,.45); }
        70%  { box-shadow: 0 0 0 10px rgba(99,102,241,0); }
        100% { box-shadow: 0 0 0 0 rgba(99,102,241,0); }
      }
      .cf-node-active {
        outline: 2px solid rgba(99,102,241,.85);
        border-radius: 12px;
        animation: cfPulse 1.2s ease-out infinite;
      }
    `;
    document.head.appendChild(style);
  }, []);

  return (
    <div className="h-[70vh] w-full rounded-xl overflow-hidden border border-white/10">
      <ReactFlowProvider>
        <InnerCanvas
          ref={ref}
          graph={graph}
          selectedNodeId={selectedNodeId}
          onNodeClick={onNodeClick}
        />
      </ReactFlowProvider>
    </div>
  );
});

export default FlowCanvas;

/** ---- Hijo que usa useReactFlow() y expone el handle ---- */
const InnerCanvas = forwardRef<FlowCanvasHandle, Props>(function InnerCanvas(
  { graph, selectedNodeId = null, onNodeClick },
  ref
) {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node[]>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge[]>([]);
  const rf = useReactFlow();

  const laidOut = useMemo(() => {
    if (!graph) return { nodes: [], edges: [] };

    const baseNodes: Node[] = graph.nodes.map((n, i) => ({
      id: n.id,
      type: "default",
      data: { label: n.label || n.type || n.id, meta: n.meta },
      position: n.position ?? { x: 80, y: i * 120 },
      style: styleForNode(n.type),
      className: n.id === selectedNodeId ? "cf-node-active" : undefined,
    }));

    const baseEdges: Edge[] = graph.edges.map((e, i) => ({
      id: `e${i}`,
      source: e.source,
      target: e.target,
      label: e.label,
      animated: !!e.label && e.label.toLowerCase() === "sí",
      style: { strokeWidth: 2 },
      labelBgPadding: [6, 3],
      labelBgBorderRadius: 4,
      labelBgStyle: { fill: "rgba(13,19,33,.85)", stroke: "rgba(255,255,255,.1)" },
    }));

    return { nodes: baseNodes, edges: baseEdges };
  }, [graph, selectedNodeId]);

  useEffect(() => {
    setNodes(laidOut.nodes);
    setEdges(laidOut.edges);
    const t = setTimeout(() => {
      try {
        rf.fitView({ padding: 0.2, includeHiddenNodes: true });
      } catch {}
    }, 0);
    return () => clearTimeout(t);
  }, [laidOut, setNodes, setEdges, rf]);

  useImperativeHandle(ref, () => ({
    fitView: () => rf.fitView({ padding: 0.2, includeHiddenNodes: true }),
  }));

  const handleNodeClick = useCallback(
    (_: any, node: Node) => {
      const meta = (node?.data as any)?.meta;
      const line = meta?.line;
      onNodeClick?.({ id: node.id, range: line ? { start: line, end: line } : undefined });
    },
    [onNodeClick]
  );

  // memo para callbacks de minimap (evita recrearlos)
  const miniMapStroke = useCallback(
    (n: Node) => (n.style?.border as string) || "#666",
    []
  );
  const miniMapColor = useCallback(
    (n: Node) => (n.style?.background as string) || "#1f2937",
    []
  );

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onNodeClick={handleNodeClick}
      fitView
    >
      <Background gap={16} />
      <MiniMap nodeStrokeColor={miniMapStroke} nodeColor={miniMapColor} />
      <Controls />
    </ReactFlow>
  );
});

/* ---- estilos por tipo de nodo ---- */
function styleForNode(type?: string) {
  const base = {
    color: "white",
    background: "rgba(255,255,255,.04)",
    border: "1px solid rgba(255,255,255,.12)",
    borderRadius: 12,
    padding: 10,
  } as const;

  switch ((type || "").toLowerCase()) {
    case "start":
      return {
        ...base,
        background: "rgba(34, 211, 238, .12)",
        border: "1px solid rgba(34,211,238,.35)",
      };
    case "end":
      return {
        ...base,
        background: "rgba(99, 102, 241, .12)",
        border: "1px solid rgba(99,102,241,.35)",
      };
    case "decision":
      return {
        ...base,
        background: "rgba(234, 179, 8, .12)",
        border: "1px solid rgba(234,179,8,.35)",
      };
    default:
      return base;
  }
}
