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
  const inputNodes = nodes.filter((n) => inputTypes.includes((n.data as any)?.nodeType));
  
  // Track how many inputs each target has
  const targetInputCounts: Record<string, number> = {};
  inputNodes.forEach((node) => {
    const connectedEdge = edges.find((e) => e.source === node.id);
    if (connectedEdge) {
      const targetId = connectedEdge.target;
      targetInputCounts[targetId] = (targetInputCounts[targetId] || 0) + 1;
    }
  });

  const INPUT_SPACE = 120; // Extra height for inputs above the node

  // Knoten zum Graph hinzufügen
  dagreNodes.forEach((node) => {
    const hasInputs = (targetInputCounts[node.id] || 0) > 0;
    graph.setNode(node.id, {
      width: NODE_WIDTH,
      height: hasInputs ? NODE_HEIGHT + INPUT_SPACE : NODE_HEIGHT,
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

  const INPUT_WIDTH = 180;
  const spacing = 20;

  // Wir tracken für jeden targetId den Index des aktuell gezeichneten Inputs, um sie zentriert aufzureihen
  const targetInputCurrentIndex: Record<string, number> = {};

  return nodes.map((node) => {
    if (inputTypes.includes((node.data as any)?.nodeType)) {
      const connectedEdge = edges.find((e) => e.source === node.id);
      const targetId = connectedEdge ? connectedEdge.target : null;
      const targetNode = targetId ? graph.node(targetId) : null;
      
      let xPos = inputNodes.indexOf(node) * 220;
      let yPos = 0;
      
      if (targetNode && targetId) {
        const totalInputs = targetInputCounts[targetId] || 1;
        const currentIndex = targetInputCurrentIndex[targetId] || 0;
        targetInputCurrentIndex[targetId] = currentIndex + 1;
        
        // Target Node in Dagre ist `NODE_HEIGHT + INPUT_SPACE` hoch, ihr Zentrum ist in `targetNode.y`.
        // Die "visuelle" Y-Position des Tree-Knotens ist `targetNode.y + (INPUT_SPACE / 2) - (NODE_HEIGHT / 2)`.
        const visualY = targetNode.y + (INPUT_SPACE / 2) - (NODE_HEIGHT / 2);
        
        yPos = visualY - INPUT_SPACE;
        
        // Zentriere alle Inputs über dem Knoten
        const totalGroupWidth = totalInputs * INPUT_WIDTH + (totalInputs - 1) * spacing;
        // Start-X relativ zur Mitte des Zielknotens
        const startX = targetNode.x - (totalGroupWidth / 2) + (INPUT_WIDTH / 2);
        xPos = startX + currentIndex * (INPUT_WIDTH + spacing) - (INPUT_WIDTH / 2);
      }
      
      const position = {
        x: xPos,
        y: yPos,
      };
      return { ...node, position };
    }

    const nodeWithPosition = graph.node(node.id);
    const hasInputs = (targetInputCounts[node.id] || 0) > 0;
    const visualY = hasInputs 
      ? nodeWithPosition.y + (INPUT_SPACE / 2) - (NODE_HEIGHT / 2)
      : nodeWithPosition.y - NODE_HEIGHT / 2;

    return {
      ...node,
      position: {
        x: nodeWithPosition.x - NODE_WIDTH / 2,
        y: visualY,
      },
    };
  });
}
