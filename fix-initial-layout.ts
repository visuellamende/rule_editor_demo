import dagre from '@dagrejs/dagre';
import fs from 'fs';
import { exampleMap } from './src/data/exampleMap';
import { exampleMapEn } from './src/data/exampleMapEn';

function getMockLayout(nodes: any[], edges: any[]) {
  const graph = new dagre.graphlib.Graph();
  graph.setDefaultEdgeLabel(() => ({}));
  graph.setGraph({
    rankdir: 'LR',
    nodesep: 60,
    ranksep: 150, // Erhöhter horizontaler Abstand
    marginx: 50,
    marginy: 50,
  });

  const inputTypes = ['input', 'input-ref'];
  const dagreNodes = nodes.filter((n) => !inputTypes.includes(n.data.nodeType));
  const inputNodes = nodes.filter((n) => inputTypes.includes(n.data.nodeType));

  const targetInputs: Record<string, any[]> = {};
  inputNodes.forEach((node) => {
    const connectedEdge = edges.find((e) => e.source === node.id);
    if (connectedEdge) {
      const targetId = connectedEdge.target;
      if (!targetInputs[targetId]) targetInputs[targetId] = [];
      targetInputs[targetId].push(node);
    }
  });

  dagreNodes.forEach((node) => {
    let inputSpace = 0;
    let inputGroupWidth = 0;
    if (targetInputs[node.id] && targetInputs[node.id].length > 0) {
       const inputs = targetInputs[node.id];
       inputSpace = 80 + 40;
       inputGroupWidth = inputs.reduce((sum, n) => sum + 280, 0) + 20 * (inputs.length - 1);
    }
    
    // Wir nehmen an, dass Entscheidungs/Bedingungsknoten recht breit sein können (ca. 320px)
    const visualWidth = 320;
    const visualHeight = 80;
    
    graph.setNode(node.id, {
      width: Math.max(visualWidth, inputGroupWidth),
      height: visualHeight + inputSpace,
    });
  });

  edges.forEach((edge) => {
    if (graph.hasNode(edge.source) && graph.hasNode(edge.target)) {
      graph.setEdge(edge.source, edge.target);
    }
  });

  dagre.layout(graph);

  return nodes.map((node) => {
    if (inputTypes.includes(node.data.nodeType)) {
      const connectedEdge = edges.find((e) => e.source === node.id);
      const targetId = connectedEdge ? connectedEdge.target : null;
      const targetNode = targetId ? graph.node(targetId) : null;
      let xPos = 0; let yPos = 0;
      if (targetNode && targetId) {
        const inputsForTarget = targetInputs[targetId];
        const currentIndex = inputsForTarget.indexOf(node);
        const visualTargetY = targetNode.y + ((80 + 40) / 2) - (80 / 2);
        yPos = visualTargetY - 80 - 40;
        const totalGroupWidth = inputsForTarget.reduce((sum, n) => sum + 280, 0) + 20 * (inputsForTarget.length - 1);
        let currentX = targetNode.x - (totalGroupWidth / 2);
        for (let i = 0; i < currentIndex; i++) {
           currentX += 280 + 20;
        }
        xPos = currentX;
      }
      return { ...node, position: { x: Math.round(xPos), y: Math.round(yPos) } };
    }

    const nodeWithPosition = graph.node(node.id);
    const visualWidth = 320;
    const visualHeight = 80;
    let inputSpace = 0;
    if (targetInputs[node.id] && targetInputs[node.id].length > 0) {
       inputSpace = 80 + 40;
    }
    const visualY = nodeWithPosition.y + (inputSpace / 2) - (visualHeight / 2);
    const visualX = nodeWithPosition.x - (visualWidth / 2);

    return { ...node, position: { x: Math.round(visualX), y: Math.round(visualY) } };
  });
}

function updateMap(filePath, mapObj) {
  let content = fs.readFileSync(filePath, 'utf8');
  const layouted = getMockLayout(mapObj.nodes, mapObj.edges);
  
  for (const node of layouted) {
    const posStr = `{ x: ${node.position.x}, y: ${node.position.y} }`;
    const regex = new RegExp(`(id:\\s*'${node.id}',\\s*type:\\s*'ruleNode',\\s*position:\\s*)\\{[^}]+\\}`, 'g');
    content = content.replace(regex, `$1${posStr}`);
  }
  fs.writeFileSync(filePath, content, 'utf8');
}

updateMap('./src/data/exampleMap.ts', exampleMap);
updateMap('./src/data/exampleMapEn.ts', exampleMapEn);
