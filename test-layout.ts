import { getAutoLayout } from './src/utils/autoLayout';
import { exampleMap } from './src/data/exampleMap';

const layouted = getAutoLayout(exampleMap.nodes as any, exampleMap.edges as any);
const inputs = layouted.filter(n => n.data.nodeType === 'input');
console.log(inputs.map(n => ({ id: n.id, pos: n.position })));
