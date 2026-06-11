import dagre from '@dagrejs/dagre';
import type { Node, Edge } from '@xyflow/react';

const NODE_WIDTH = 240;
const NODE_HEIGHT = 80;
const HORIZONTAL_GAP = 100;
const VERTICAL_GAP = 60;

export function getAutoLayout(nodes: Node[], edges: Edge[]): Node[] {
  if (nodes.length === 0) return nodes;

  const graph = new dagre.graphlib.Graph();
  graph.setDefaultEdgeLabel(() => ({}));
  graph.setGraph({
    rankdir: 'LR', // Links nach rechts
    nodesep: VERTICAL_GAP,
    ranksep: HORIZONTAL_GAP,
    marginx: 50,
    marginy: 50,
  });

  // Knoten zum Graph hinzufügen
  nodes.forEach((node) => {
    graph.setNode(node.id, {
      width: NODE_WIDTH,
      height: NODE_HEIGHT,
    });
  });

  // Edges zum Graph hinzufügen
  edges.forEach((edge) => {
    graph.setEdge(edge.source, edge.target);
  });

  // Layout berechnen
  dagre.layout(graph);

  // Neue Positionen auf die Knoten anwenden
  return nodes.map((node) => {
    const nodeWithPosition = graph.node(node.id);
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - NODE_WIDTH / 2,
        y: nodeWithPosition.y - NODE_HEIGHT / 2,
      },
    };
  });
}
