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
    rankdir: 'LR',
    nodesep: 60, // Normaler Abstand
    ranksep: 100,
    marginx: 50,
    marginy: 50,
  });

  const inputTypes = ['input', 'input-ref'];
  const dagreNodes = nodes.filter((n) => !inputTypes.includes((n.data as any)?.nodeType));
  const inputNodes = nodes.filter((n) => inputTypes.includes((n.data as any)?.nodeType));
  
  // Track inputs per target
  const targetInputs: Record<string, Node[]> = {};
  inputNodes.forEach((node) => {
    const connectedEdge = edges.find((e) => e.source === node.id);
    if (connectedEdge) {
      const targetId = connectedEdge.target;
      if (!targetInputs[targetId]) targetInputs[targetId] = [];
      targetInputs[targetId].push(node);
    }
  });

  // Knoten zum Graph hinzufügen mit dynamischen Größen
  dagreNodes.forEach((node) => {
    let inputSpace = 0;
    let inputGroupWidth = 0;
    
    if (targetInputs[node.id] && targetInputs[node.id].length > 0) {
       const inputs = targetInputs[node.id];
       const maxInputHeight = Math.max(...inputs.map(n => n.measured?.height ?? 80));
       inputSpace = maxInputHeight + 40; // 40px Padding
       
       inputGroupWidth = inputs.reduce((sum, n) => sum + (n.measured?.width ?? 180), 0) + 20 * (inputs.length - 1);
    }
    
    const visualWidth = node.measured?.width ?? 240;
    const visualHeight = node.measured?.height ?? 80;
    
    graph.setNode(node.id, {
      width: Math.max(visualWidth, inputGroupWidth),
      height: visualHeight + inputSpace,
    });
  });

  // Edges
  edges.forEach((edge) => {
    if (graph.hasNode(edge.source) && graph.hasNode(edge.target)) {
      graph.setEdge(edge.source, edge.target);
    }
  });

  dagre.layout(graph);

  return nodes.map((node) => {
    if (inputTypes.includes((node.data as any)?.nodeType)) {
      const connectedEdge = edges.find((e) => e.source === node.id);
      const targetId = connectedEdge ? connectedEdge.target : null;
      const targetNode = targetId ? graph.node(targetId) : null;
      
      let xPos = node.position.x;
      let yPos = node.position.y;
      
      if (targetNode && targetId) {
        const inputsForTarget = targetInputs[targetId];
        const currentIndex = inputsForTarget.indexOf(node);
        
        const targetVisualHeight = nodes.find(n => n.id === targetId)?.measured?.height ?? 80;
        const inputSpace = Math.max(...inputsForTarget.map(n => n.measured?.height ?? 80)) + 40;
        const visualTargetY = targetNode.y + (inputSpace / 2) - (targetVisualHeight / 2);
        
        const myHeight = node.measured?.height ?? 80;
        yPos = visualTargetY - myHeight - 40; 
        
        const totalGroupWidth = inputsForTarget.reduce((sum, n) => sum + (n.measured?.width ?? 180), 0) + 20 * (inputsForTarget.length - 1);
        let currentX = targetNode.x - (totalGroupWidth / 2); 
        
        for (let i = 0; i < currentIndex; i++) {
           currentX += (inputsForTarget[i].measured?.width ?? 180) + 20;
        }
        xPos = currentX;
      }
      
      return { ...node, position: { x: xPos, y: yPos } };
    }

    const nodeWithPosition = graph.node(node.id);
    const visualWidth = node.measured?.width ?? 240;
    const visualHeight = node.measured?.height ?? 80;
    
    let inputSpace = 0;
    if (targetInputs[node.id] && targetInputs[node.id].length > 0) {
       const inputs = targetInputs[node.id];
       inputSpace = Math.max(...inputs.map(n => n.measured?.height ?? 80)) + 40;
    }
    
    const visualY = nodeWithPosition.y + (inputSpace / 2) - (visualHeight / 2);
    const visualX = nodeWithPosition.x - (visualWidth / 2);

    return {
      ...node,
      position: { x: visualX, y: visualY },
    };
  });
}
