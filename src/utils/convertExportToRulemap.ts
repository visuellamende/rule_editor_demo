import type { Node, Edge } from '@xyflow/react';
import type { RulemapFile, RulemapMeta } from '../types/rulemap';
import type { RuleNodeData, RuleNodeType, GoldenExample, KnowledgeSource, ConsequenceData } from '../types/nodes';

interface RawOutput {
  label?: string | null;
  value?: string | null;
  targetNodeId: number;
}

interface RawExportNode {
  id?: number | string;
  type?: string;
  label?: string | null;
  technicalKey?: string | null;
  expectedType?: string | null;
  notes?: string | null;
  consequence?: ConsequenceData | null;
  refId?: number;
  refNodeId?: number;
  consequenceRef?: number;
  inputRef?: number;
  inputSource?: {
    provider?: 'system' | 'manuell' | 'komposition';
    providerSubtype?: string | null;
    verfuegbarkeit?: 'vorhanden' | 'laufzeit';
    kannScheitern?: boolean;
    referenziertEntscheidung?: string | null;
  } | null;
  knowledgeSources?: KnowledgeSource[] | null;
  outputs?: RawOutput[];
}

export interface RawExportData {
  id?: string;
  name?: string;
  description?: string;
  category?: RulemapCategory | null;
  entryNodeId?: number | null;
  inputData?: RawExportNode[];
  nodes?: RawExportNode[];
  edges?: unknown[];
  testCases?: Array<{
    id?: string;
    name?: string;
    inputs?: Record<string, string>;
    expectedConsequenceId?: number;
    expectedResult?: string;
    notes?: string;
  }>;
}

export function isExportFormat(data: unknown): data is RawExportData {
  if (!data || typeof data !== 'object') return false;
  const obj = data as Record<string, unknown>;
  
  // Wenn 'edges' fehlt, aber 'nodes' oder 'inputData' sowie 'entryNodeId' / 'outputs' existieren
  const hasNoEdges = !obj.edges || !Array.isArray(obj.edges);
  const hasNodesOrInputs = Array.isArray(obj.nodes) || Array.isArray(obj.inputData);
  const hasEntryId = typeof obj.entryNodeId === 'number' || obj.entryNodeId === null;
  const hasOutputs = Array.isArray(obj.nodes) && obj.nodes.some((n: unknown) => typeof n === 'object' && n !== null && Array.isArray((n as Record<string, unknown>).outputs));

  return hasNoEdges && hasNodesOrInputs && (hasEntryId || hasOutputs);
}

export function convertExportToRulemap(exportData: RawExportData): RulemapFile {
  const meta: RulemapMeta = {
    id: exportData.id || crypto.randomUUID().slice(0, 8),
    name: exportData.name || 'Importierte Map',
    description: exportData.description || '',
    category: exportData.category || null,
    created: new Date().toISOString(),
    modified: new Date().toISOString(),
  };

  const rawNodes: RawExportNode[] = [
    ...(Array.isArray(exportData.inputData) ? exportData.inputData : []),
    ...(Array.isArray(exportData.nodes) ? exportData.nodes : []),
  ];

  const edges: Edge[] = [];
  let edgeCounter = 1;

  // Map ExportNode -> React Flow Node
  const nodes: Node[] = rawNodes.map((rawNode) => {
    const displayId: number = typeof rawNode.id === 'number' ? rawNode.id : Number(rawNode.id) || 1;
    const nodeId = `n${displayId}`;

    let nodeType: RuleNodeType = (rawNode.type as RuleNodeType) || 'decision';
    if (rawNode.type === 'entry') {
      nodeType = 'decision';
    }

    const nodeData: RuleNodeData = {
      displayId,
      label: rawNode.label || '',
      nodeType,
      ...(rawNode.technicalKey ? { technicalKey: rawNode.technicalKey } : {}),
      ...(rawNode.expectedType ? { expectedType: rawNode.expectedType } : {}),
      ...(rawNode.notes ? { notes: rawNode.notes } : {}),
      ...(rawNode.consequence ? { consequence: rawNode.consequence } : {}),
      ...(rawNode.knowledgeSources ? { knowledgeSources: rawNode.knowledgeSources } : {}),
    };

    // Referenzen
    const refId = rawNode.refId ?? rawNode.refNodeId ?? rawNode.consequenceRef ?? rawNode.inputRef;
    if (refId !== undefined && refId !== null) {
      nodeData.refNodeId = Number(refId);
    }

    // Input-Quellen
    if (rawNode.inputSource) {
      nodeData.inputProvider = rawNode.inputSource.provider;
      nodeData.inputProviderSubtype = rawNode.inputSource.providerSubtype || undefined;
      nodeData.inputVerfuegbarkeit = rawNode.inputSource.verfuegbarkeit;
      nodeData.inputKannScheitern = rawNode.inputSource.kannScheitern;
      nodeData.inputReferenziertEntscheidung = rawNode.inputSource.referenziertEntscheidung || undefined;
    }

    // Outgoing Edges verarbeiten
    if (Array.isArray(rawNode.outputs)) {
      for (const output of rawNode.outputs) {
        if (output && typeof output.targetNodeId === 'number') {
          const targetId = `n${output.targetNodeId}`;
          edges.push({
            id: `e${edgeCounter++}`,
            source: nodeId,
            target: targetId,
            type: 'labeled',
            label: output.label || undefined,
            ...(output.value ? { data: { value: output.value } } : {}),
          });
        }
      }
    }

    return {
      id: nodeId,
      type: 'ruleNode',
      position: { x: 0, y: 0 },
      data: nodeData as unknown as Record<string, unknown>,
    };
  });

  // Testfälle (Golden Examples) den Consequence-Knoten zuordnen
  if (Array.isArray(exportData.testCases)) {
    for (const tc of exportData.testCases) {
      if (!tc || typeof tc.expectedConsequenceId !== 'number') continue;
      const targetNode = nodes.find((n) => (n.data as unknown as RuleNodeData).displayId === tc.expectedConsequenceId);
      if (targetNode) {
        const data = targetNode.data as unknown as RuleNodeData;
        if (!data.examples) {
          data.examples = [];
        }
        const example: GoldenExample = {
          id: tc.id || crypto.randomUUID().slice(0, 8),
          name: tc.name || '',
          inputs: tc.inputs || {},
          expectedResult: tc.expectedResult || '',
          ...(tc.notes ? { notes: tc.notes } : {}),
        };
        data.examples.push(example);
      }
    }
  }

  return {
    version: '1.0.0',
    meta,
    nodes,
    edges,
  };
}
