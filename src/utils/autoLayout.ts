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

  const inputTypes = ['input', 'input-ref'];
  const dagreNodes = nodes.filter((n) => !inputTypes.includes((n.data as any)?.nodeType));
  
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
  const treeNodes = nodes.filter((n) => !inputTypes.includes((n.data as any)?.nodeType));
  const inputNodes = nodes.filter((n) => inputTypes.includes((n.data as any)?.nodeType));
  
  // Obere Kante des Baums finden
  const treeMinY = treeNodes.length > 0 ? Math.min(...treeNodes.map((n) => graph.node(n.id).y - NODE_HEIGHT / 2)) : 0;

  return nodes.map((node) => {
    if (inputTypes.includes((node.data as any)?.nodeType)) {
      const connectedEdge = edges.find((e) => e.source === node.id);
      const targetNode = connectedEdge ? graph.node(connectedEdge.target) : null;
      
      const position = {
        x: targetNode ? targetNode.x - NODE_WIDTH / 2 : inputNodes.indexOf(node) * 220,
        y: treeMinY - 120,
      };
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
