import { exportAsJSON } from '../src/utils/exportRulemap';
import { isExportFormat, convertExportToRulemap } from '../src/utils/convertExportToRulemap';
import type { RulemapFile } from '../src/types/rulemap';
import type { RuleNodeData } from '../src/types/nodes';

console.log('--- Start Roundtrip Smoke Test ---');

// Testmap mit allen Knotentypen: Input, Input-Ref, Decision, Condition, Consequence, Consequence-Ref
const testMap: RulemapFile = {
  version: '1.0.0',
  meta: {
    id: 'test-map-full',
    name: 'Full Roundtrip Test Map',
    description: 'Testmap für verlustfreien Export und Import',
    category: 'permission',
    created: '2026-08-12T00:00:00.000Z',
    modified: '2026-08-12T00:00:00.000Z',
  },
  nodes: [
    {
      id: 'n1',
      type: 'ruleNode',
      position: { x: 0, y: 0 },
      data: {
        label: 'Nutzerrolle',
        nodeType: 'input',
        displayId: 1,
        technicalKey: 'userRole',
        expectedType: 'enum',
      } as unknown as Record<string, unknown>,
    },
    {
      id: 'n2',
      type: 'ruleNode',
      position: { x: 0, y: 0 },
      data: {
        label: 'Wird Zugriff gewährt?',
        nodeType: 'decision',
        displayId: 2,
      } as unknown as Record<string, unknown>,
    },
    {
      id: 'n3',
      type: 'ruleNode',
      position: { x: 0, y: 0 },
      data: {
        label: 'Ist Nutzer Admin?',
        nodeType: 'condition',
        displayId: 3,
        technicalKey: 'isAdmin',
      } as unknown as Record<string, unknown>,
    },
    {
      id: 'n4',
      type: 'ruleNode',
      position: { x: 0, y: 0 },
      data: {
        label: 'Zugriff verweigert',
        nodeType: 'consequence',
        displayId: 4,
        consequence: {
          business: 'Kein Admin-Zugriff.',
        },
      } as unknown as Record<string, unknown>,
    },
    {
      id: 'n5',
      type: 'ruleNode',
      position: { x: 0, y: 0 },
      data: {
        label: 'Zugriff erlaubt',
        nodeType: 'consequence',
        displayId: 5,
        consequence: {
          business: 'Admin-Zugriff gestattet.',
        },
      } as unknown as Record<string, unknown>,
    },
    {
      id: 'n6',
      type: 'ruleNode',
      position: { x: 0, y: 0 },
      data: {
        label: 'Nutzerrolle',
        nodeType: 'input-ref',
        displayId: 6,
        refNodeId: 1,
      } as unknown as Record<string, unknown>,
    },
    {
      id: 'n7',
      type: 'ruleNode',
      position: { x: 0, y: 0 },
      data: {
        label: 'Zugriff verweigert',
        nodeType: 'consequence-ref',
        displayId: 7,
        refNodeId: 4,
      } as unknown as Record<string, unknown>,
    },
  ],
  edges: [
    { id: 'e1', source: 'n1', target: 'n3', type: 'labeled' },
    { id: 'e2', source: 'n6', target: 'n3', type: 'labeled' },
    { id: 'e3', source: 'n2', target: 'n3', type: 'labeled' },
    { id: 'e4', source: 'n3', target: 'n4', type: 'labeled', label: 'Nein', data: { value: 'false' } },
    { id: 'e5', source: 'n3', target: 'n5', type: 'labeled', label: 'Ja', data: { value: 'true' } },
  ],
};

// 1. Export as JSON
const jsonString = exportAsJSON(testMap.meta, testMap.nodes, testMap.edges);
const exportData = JSON.parse(jsonString);

console.log('1. Export generated successfully.');

// Defekt 1 Check: entryNodeId muss auf den Einstiegsknoten (#2) zeigen, kein Input/Input-Ref darf entryNodeId sein
if (exportData.entryNodeId !== 2) {
  throw new Error(`TEST FAILED: entryNodeId expected 2 (decision node), but got ${exportData.entryNodeId}`);
}
console.log('✓ Defekt 1 Pass: entryNodeId points to root decision node (#2).');

// Defekt 1 & 4 Check: Keines der Export-Knoten hat 'type: entry', original nodeType bleibt erhalten
const hasTypeEntry = exportData.nodes.some((n: Record<string, unknown>) => n.type === 'entry');
if (hasTypeEntry) {
  throw new Error('TEST FAILED: Node in export has type "entry"! Original nodeTypes should be preserved.');
}

const rootNode = exportData.nodes.find((n: Record<string, unknown>) => n.id === 2);
if (rootNode?.type !== 'decision') {
  throw new Error(`TEST FAILED: Root node type expected "decision", got "${rootNode?.type}"`);
}
console.log('✓ Defekt 1 & 4 Pass: Node types preserved, root node retained type "decision".');

// Defekt 2 Check: input-ref in inputData muss outputs-Array besitzen
const inputRefNode = exportData.inputData?.find((n: Record<string, unknown>) => n.type === 'input-ref');
if (!inputRefNode) {
  throw new Error('TEST FAILED: input-ref node missing in inputData!');
}
const outputs = inputRefNode.outputs as Array<Record<string, unknown>> | undefined;
if (!Array.isArray(outputs) || outputs.length === 0) {
  throw new Error('TEST FAILED: input-ref node missing outputs array in export!');
}
if (outputs[0].targetNodeId !== 3) {
  throw new Error(`TEST FAILED: input-ref output target expected 3, got ${outputs[0].targetNodeId}`);
}
console.log('✓ Defekt 2 Pass: input-ref has outgoing outputs edge connecting to condition (#3).');

// 2. Re-import via convertExportToRulemap
const isExport = isExportFormat(exportData);
if (!isExport) {
  throw new Error('TEST FAILED: isExportFormat returned false for exportAsJSON output!');
}

const reimportedMap = convertExportToRulemap(exportData);

// Check node and edge counts
if (reimportedMap.nodes.length !== testMap.nodes.length) {
  throw new Error(
    `TEST FAILED: Node count mismatch! Expected ${testMap.nodes.length}, got ${reimportedMap.nodes.length}`
  );
}

if (reimportedMap.edges.length !== testMap.edges.length) {
  throw new Error(
    `TEST FAILED: Edge count mismatch! Expected ${testMap.edges.length}, got ${reimportedMap.edges.length}`
  );
}

console.log(`✓ Node count (${reimportedMap.nodes.length}) and edge count (${reimportedMap.edges.length}) match original.`);

// Defekt 3 Check: Ref-Knoten müssen gefülltes label besitzen
const refNodes = reimportedMap.nodes.filter((n) => {
  const data = n.data as unknown as RuleNodeData;
  return data.nodeType === 'consequence-ref' || data.nodeType === 'input-ref';
});

for (const refNode of refNodes) {
  const data = refNode.data as unknown as RuleNodeData;
  if (!data.label || data.label.trim() === '') {
    throw new Error(`TEST FAILED: Ref node #${data.displayId} has empty label after roundtrip!`);
  }
}
console.log('✓ Defekt 3 Pass: All ref nodes have resolved labels from target nodes.');

console.log('--- ALL ROUNDTRIP CHECKS PASSED SUCCESSFULLY! ---');
