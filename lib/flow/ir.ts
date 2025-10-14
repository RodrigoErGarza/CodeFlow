// app/lib/flow/ir.ts
export type NodeType = "start" | "end" | "action" | "decision" | "noop";
export type EdgeLabel = "sí" | "no" | undefined;

export type FlowNode = {
  id: string;
  type: NodeType;
  label: string;
  meta?: { line?: number };
};

export type FlowEdge = {
  id: string;
  source: string;
  target: string;
  label?: EdgeLabel;
};

export type FlowGraph = {
  nodes: FlowNode[];
  edges: FlowEdge[];
  errors?: Diagnostic[];
};

export type Diagnostic = {
  line?: number;
  message: string;
};

let _id = 0;
export function nid(prefix = "n"): string {
  _id += 1;
  return `${prefix}_${_id}`;
}

// Helpers rápidos
export function startEndSkeleton(): FlowGraph {
  const s: FlowNode = { id: nid("start"), type: "start", label: "Start" };
  const e: FlowNode = { id: nid("end"), type: "end", label: "End" };
  return { nodes: [s, e], edges: [] };
}
