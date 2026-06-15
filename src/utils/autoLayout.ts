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

  const dagreNodes = nodes.filter((n) => (n.data as any)?.nodeType !== 'input');
  
  // Knoten zum Graph hinzufügen
  dagreNodes.forEach((node) => {
    graph.setNode(node.id, {
      width: NODE_WIDTH,
      height: NODE_HEIGHT,
    });
  });

  // Edges zum Graph hinzufügen, aber nur zwischen Knoten im Dagre-Graphen
  edges.forEach((edge) => {
    if (graph.hasNode(edge.source) && graph.hasNode(edge.target)) {
      graph.setEdge(edge.source, edge.target);
    }
  });

  // Layout berechnen
  dagre.layout(graph);

  // Neue Positionen auf die Knoten anwenden
  let inputY = 0;
  return nodes.map((node) => {
    if ((node.data as any)?.nodeType === 'input') {
      const position = {
        x: -300,
        y: inputY,
      };
      inputY += NODE_HEIGHT + VERTICAL_GAP;
      return { ...node, position };
    }

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
