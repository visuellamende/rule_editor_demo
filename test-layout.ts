import { getAutoLayout } from './src/utils/autoLayout';
import { exampleMap } from './src/data/exampleMap';
import { exampleMapEn } from './src/data/exampleMapEn';

function printPositions(nodes) {
  nodes.forEach(n => console.log(`${n.id}: { x: ${n.position.x}, y: ${n.position.y} }`));
}

console.log("=== exampleMap ===");
const layouted = getAutoLayout(exampleMap.nodes as any, exampleMap.edges as any);
printPositions(layouted);

console.log("=== exampleMapEn ===");
const layoutedEn = getAutoLayout(exampleMapEn.nodes as any, exampleMapEn.edges as any);
printPositions(layoutedEn);

