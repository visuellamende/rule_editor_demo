import type { Node, Edge } from '@xyflow/react';
import type { RuleNodeData, KnowledgeSource } from '../types/nodes';
import type { RulemapMeta } from '../types/rulemap';
import { validateRulemap } from './validateRulemap';

// --- Strukturiertes JSON für KI-Agenten ---

interface ExportNode {
  id: number;
  type: string;
  label?: string | null;
  technicalKey?: string | null;
  expectedType?: string | null;
  notes?: string | null;
  consequence?: ExportConsequence | null;
  outputs?: ExportEdge[];
  refId?: number;
  inputSource?: {
    provider: 'system' | 'manuell' | 'komposition';
    providerSubtype: string | null;
    verfuegbarkeit: 'vorhanden' | 'laufzeit';
    kannScheitern: boolean;
    referenziertEntscheidung: string | null;
  } | null;
  knowledgeSources?: KnowledgeSource[] | null;
}


interface ExportConsequence {
  business?: string | null;
  technical?: string | null;
  reference?: string | null;
}

interface ExportEdge {
  label?: string | null;
  value?: string | null;             // NEU: maschinenlesbarer Wert
  targetNodeId: number;
}

interface ExportTestCase {
  id: string;
  name: string;
  inputs: Record<string, string>;
  expectedConsequenceId: number;
  expectedResult: string;
  notes?: string;
}

interface ExportRulemap {
  name: string;
  description: string;
  category: string | null;
  entryNodeId: number | null;
  validationWarnings: Array<{
    nodeId: number;
    type: string;
    message: string;
    severity: string;
  }> | null;
  testCases?: ExportTestCase[];
  inputData: ExportNode[];
  nodes: ExportNode[];
}

function cleanText(text: string | undefined | null): string | null {
  if (text === undefined || text === null) return null;
  const trimmed = text.replace(/\n{2,}/g, '\n').trim();
  return trimmed || null;
}

function omitNulls<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== null && value !== undefined) {
      result[key] = value;
    }
  }
  return result as Partial<T>;
}

const exportKnowledgeSources = (sources?: KnowledgeSource[]): KnowledgeSource[] | null => {
  if (!sources || sources.length === 0) return null;
  return sources.map((s) => ({
    id: s.id,
    art: s.art,
    verbindlichkeit: s.verbindlichkeit,
    referenz: cleanText(s.referenz) ?? '',
    eigner: cleanText(s.eigner),
    beschreibung: cleanText(s.beschreibung),
  }));
};

export function exportAsJSON(
  meta: RulemapMeta,
  nodes: Node[],
  edges: Edge[],
): string {
  const warnings = validateRulemap(nodes, edges);
  const exportNodes: ExportNode[] = nodes.map((node) => {
    const data = node.data as unknown as RuleNodeData;

    // Consequence-Ref exportieren (Endpunkt, keine Ausgänge)
    if (data?.nodeType === 'consequence-ref') {
      return {
        id: data.displayId,
        type: 'consequence-ref',
        refId: data.refNodeId,
      } as unknown as ExportNode;
    }

    const outgoingEdges = edges
      .filter((e) => e.source === node.id)
      .map((e) => {
        const targetNode = nodes.find((n) => n.id === e.target);
        const targetData = targetNode?.data as unknown as RuleNodeData | undefined;
        const edgeData = e.data as Record<string, unknown> | undefined;
        return omitNulls({
          label: cleanText(e.label as string),
          value: cleanText(edgeData?.value as string),
          targetNodeId: targetData?.displayId ?? 0,
        }) as ExportEdge;
      });

    // Input-Ref exportieren (inklusive ausgehender Kante zur Condition)
    if (data?.nodeType === 'input-ref') {
      return omitNulls({
        id: data.displayId,
        type: 'input-ref',
        refId: data.refNodeId,
        outputs: outgoingEdges.length > 0 ? outgoingEdges : undefined,
      }) as unknown as ExportNode;
    }

    const exportNode: ExportNode = omitNulls({
      id: data?.displayId ?? 0,
      type: data?.nodeType || 'ruleNode',
      label: cleanText(data?.label) ?? '',
      technicalKey: cleanText(data?.technicalKey),
      expectedType: cleanText(data?.expectedType),
      notes: cleanText(data?.notes),
      outputs: outgoingEdges,
      inputSource: data?.inputProvider ? {
        provider: data.inputProvider,
        providerSubtype: cleanText(data.inputProviderSubtype),
        verfuegbarkeit: data.inputVerfuegbarkeit,
        kannScheitern: data.inputKannScheitern,
        referenziertEntscheidung: cleanText(data.inputReferenziertEntscheidung),
      } : null,
      knowledgeSources: exportKnowledgeSources(data?.knowledgeSources),
    }) as ExportNode;


    if (data?.nodeType === 'consequence' && data.consequence) {
      exportNode.consequence = omitNulls({
        business: cleanText(data.consequence.business),
        technical: cleanText(data.consequence.technical),
        reference: cleanText(data.consequence.reference),
      }) as ExportConsequence;
    }

    return exportNode;
  });

  // Entry Node erkennen (Knoten ohne eingehende Logik-Kanten)
  const targetIds = new Set<number>();
  for (const node of exportNodes) {
    if (node.outputs) {
      for (const output of node.outputs) {
        targetIds.add(output.targetNodeId);
      }
    }
  }

  const isRefOrInput = (t: string) =>
    t === 'consequence-ref' || t === 'input-ref' || t === 'input';

  // Entry Node finden: Erster echter Logikknoten (nicht Input/Ref) ohne eingehende Kanten
  const entryNode = exportNodes.find((n) => !isRefOrInput(n.type) && !targetIds.has(n.id))
    ?? exportNodes.find((n) => !isRefOrInput(n.type));

  // Sort nodes by ID
  exportNodes.sort((a, b) => a.id - b.id);

  // Alle Examples aus Consequence-Knoten sammeln
  const testCases: ExportTestCase[] = [];
  for (const node of nodes) {
    const data = node.data as unknown as RuleNodeData;
    if (data?.nodeType === 'consequence' && data.examples?.length) {
      for (const example of data.examples) {
        testCases.push({
          id: example.id,
          name: example.name,
          inputs: example.inputs,
          expectedConsequenceId: data.displayId,
          expectedResult: example.expectedResult,
          ...(example.notes ? { notes: example.notes } : {}),
        });
      }
    }
  }

  const result: ExportRulemap = {
    name: meta.name,
    description: meta.description,
    category: meta.category,
    entryNodeId: entryNode ? entryNode.id : (exportNodes.length > 0 ? exportNodes[0].id : null),
    validationWarnings: warnings.length > 0
      ? warnings.map((w) => ({
          nodeId: w.displayId,
          type: w.type,
          message: w.message,
          severity: w.severity,
        }))
      : null,
    testCases: testCases.length > 0 ? testCases : undefined,
    inputData: exportNodes.filter((n) => n.type === 'input' || n.type === 'input-ref'),
    nodes: exportNodes.filter((n) => n.type !== 'input' && n.type !== 'input-ref'),
  };

  return JSON.stringify(result, null, 2);
}

// --- Markdown für Tickets, Prompts, Dokumentation ---

export function exportAsMarkdown(
  meta: RulemapMeta,
  nodes: Node[],
  edges: Edge[],
): string {
  const lines: string[] = [];

  // Header
  lines.push(`# ${meta.name}`);
  lines.push('');
  if (meta.description) {
    lines.push(meta.description);
    lines.push('');
  }
  if (meta.category) {
    lines.push(`**Kategorie:** ${meta.category}`);
    lines.push('');
  }

  lines.push('---');
  lines.push('');

  // Entry Node finden (kein eingehender Edge)
  const targetIds = new Set(edges.map((e) => e.target));
  const entryNode = nodes.find((n) => !targetIds.has(n.id));

  if (!entryNode) {
    lines.push('*Kein Einstiegsknoten gefunden.*');
    return lines.join('\n');
  }

  // Rekursiver Baum-Durchlauf
  const visited = new Set<string>();

  function renderNode(nodeId: string, depth: number): void {
    if (visited.has(nodeId)) {
      const indent = '  '.repeat(depth);
      lines.push(`${indent}↩ *(zurück zu #${getDisplayId(nodeId)})*`);
      return;
    }
    visited.add(nodeId);

    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return;

    const data = node.data as unknown as RuleNodeData;
    const indent = '  '.repeat(depth);
    
    let typeTag = `[${data.nodeType.charAt(0).toUpperCase() + data.nodeType.slice(1)}]`;
    if (data.nodeType === 'consequence-ref' || data.nodeType === 'input-ref') {
      typeTag = '[Reference]';
    }

    // Knotenzeile
    if (data.nodeType === 'consequence-ref' || data.nodeType === 'input-ref') {
      lines.push(`${indent}**#${data.displayId}** ${typeTag} ${data.label} *(→ #${data.refNodeId})*`);
    } else {
      lines.push(`${indent}**#${data.displayId}** ${typeTag} ${data.label}`);
    }

    // Konsequenz-Details
    if (data.nodeType === 'consequence' && data.consequence) {
      if (data.consequence.business) {
        lines.push(`${indent}  → Fachlich: ${data.consequence.business}`);
      }
      if (data.consequence.technical) {
        lines.push(`${indent}  → Technisch: ${data.consequence.technical}`);
      }
      if (data.consequence.reference) {
        lines.push(`${indent}  → Referenz: ${data.consequence.reference}`);
      }
    }

    // Notizen
    if (data.notes) {
      lines.push(`${indent}  _${data.notes}_`);
    }

    // Ausgehende Edges
    const outgoing = edges.filter((e) => e.source === nodeId);

    if (outgoing.length === 0) {
      lines.push('');
      return;
    }

    for (const edge of outgoing) {
      const edgeLabel = (edge.label as string) || '→';
      lines.push(`${indent}  ↳ **${edgeLabel}:**`);
      renderNode(edge.target, depth + 2);
    }
  }

  function getDisplayId(nodeId: string): number {
    const node = nodes.find((n) => n.id === nodeId);
    return (node?.data as unknown as RuleNodeData)?.displayId ?? 0;
  }

  renderNode(entryNode.id, 0);

  // Zusätzlich: Zusammenfassung aller Konsequenzen
  lines.push('---');
  lines.push('');
  lines.push('## Zusammenfassung der Endpunkte');
  lines.push('');

  const consequences = nodes
    .filter((n) => (n.data as unknown as RuleNodeData).nodeType === 'consequence')
    .map((n) => n.data as unknown as RuleNodeData);

  for (const c of consequences) {
    lines.push(`- **#${c.displayId}** ${c.label}${c.consequence?.business ? ': ' + c.consequence.business : ''}`);
  }

  lines.push('');

  return lines.join('\n');
}
