import type { Node, Edge } from '@xyflow/react';
import type { RuleNodeData, InputDataSource } from '../types/nodes';
import type { RulemapMeta } from '../types/rulemap';

// --- Strukturiertes JSON für KI-Agenten ---

interface ExportNode {
  id: number;
  type: string;
  label: string | null;
  technicalKey: string | null;      // NEU
  expectedType: string | null;      // NEU
  notes: string | null;             // Immer vorhanden, ggf. null
  consequence: ExportConsequence | null;  // Immer vorhanden, ggf. null
  outputs: ExportEdge[];            // Immer vorhanden, ggf. leeres Array
  consequenceRef?: number;
  inputSource: InputDataSource | null;  // NEU
}

interface ExportConsequence {
  business: string | null;
  technical: string | null;
  reference: string | null;
}

interface ExportEdge {
  label: string | null;
  value: string | null;             // NEU: maschinenlesbarer Wert
  targetNodeId: number;
}

interface ExportRulemap {
  name: string;
  description: string;
  category: string | null;
  entryNodeId: number | null;
  nodes: ExportNode[];
}

function cleanText(text: string | undefined | null): string | null {
  if (text === undefined || text === null) return null;
  const trimmed = text.replace(/\n{2,}/g, '\n').trim();
  return trimmed || null;
}

export function exportAsJSON(
  meta: RulemapMeta,
  nodes: Node[],
  edges: Edge[],
): string {
  const exportNodes: ExportNode[] = nodes.map((node) => {
    const data = node.data as unknown as RuleNodeData;
    const outgoingEdges = edges
      .filter((e) => e.source === node.id)
      .map((e) => {
        const targetNode = nodes.find((n) => n.id === e.target);
        const targetData = targetNode?.data as unknown as RuleNodeData | undefined;
        const edgeData = e.data as any;
        return {
          label: cleanText(e.label as string),
          value: cleanText(edgeData?.value as string),
          targetNodeId: targetData?.displayId ?? 0,
        };
      });

    const exportNode: ExportNode = {
      id: data?.displayId ?? 0,
      type: data?.nodeType || 'ruleNode',
      label: cleanText(data?.label),
      technicalKey: cleanText(data?.technicalKey),
      expectedType: cleanText(data?.expectedType),
      notes: cleanText(data?.notes),
      consequence: null,
      outputs: outgoingEdges,
      inputSource: data?.inputSource ? {
        provider: data.inputSource.provider,
        providerSubtype: cleanText(data.inputSource.providerSubtype),
        verfuegbarkeit: data.inputSource.verfuegbarkeit,
        kannScheitern: data.inputSource.kannScheitern,
        referenziertEntscheidung: cleanText(data.inputSource.referenziertEntscheidung),
      } : null,
    };

    if (data?.nodeType === 'consequence' && data.consequence) {
      exportNode.consequence = {
        business: cleanText(data.consequence.business),
        technical: cleanText(data.consequence.technical),
        reference: cleanText(data.consequence.reference),
      };
    } else if (data?.nodeType === 'consequence-ref') {
      const refNode = nodes.find(
        (n) => (n.data as unknown as RuleNodeData).displayId === data.refNodeId
      );
      const refData = refNode?.data as unknown as RuleNodeData | undefined;
      exportNode.type = 'consequence';
      exportNode.consequenceRef = data.refNodeId;
      exportNode.consequence = refData?.consequence
        ? {
            business: cleanText(refData.consequence.business),
            technical: cleanText(refData.consequence.technical),
            reference: cleanText(refData.consequence.reference),
          }
        : null;
    }

    return exportNode;
  });

  // Entry Node erkennen
  const targetIds = new Set<number>();
  for (const node of exportNodes) {
    for (const output of node.outputs) {
      targetIds.add(output.targetNodeId);
    }
  }

  // Typ im Export überschreiben
  for (const node of exportNodes) {
    if (!targetIds.has(node.id)) {
      node.type = 'entry';
      break;
    }
  }

  // Consequence-Knoten mit identischem Inhalt bekommen denselben consequenceRef
  const consequenceGroups = new Map<string, number>();

  for (const node of exportNodes) {
    if (node.type === 'consequence' && node.consequence) {
      const key = `${node.label ?? ''}|${node.consequence.business ?? ''}`;
      if (!consequenceGroups.has(key)) {
        consequenceGroups.set(key, node.id);
      }
      node.consequenceRef = node.consequenceRef ?? consequenceGroups.get(key)!;
    }
  }

  // Sort nodes
  exportNodes.sort((a, b) => a.id - b.id);

  const entryNode = exportNodes.find((n) => n.type === 'entry');

  const result: ExportRulemap = {
    name: meta.name,
    description: meta.description,
    category: meta.category,
    entryNodeId: entryNode ? entryNode.id : (exportNodes.length > 0 ? exportNodes[0].id : null),
    nodes: exportNodes,
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
    if (data.nodeType === 'consequence-ref') {
      typeTag = '[Reference]';
    }

    // Knotenzeile
    if (data.nodeType === 'consequence-ref') {
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
