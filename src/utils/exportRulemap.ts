import type { Node, Edge } from '@xyflow/react';
import type { RuleNodeData } from '../types/nodes';
import type { RulemapMeta } from '../types/rulemap';

// --- Strukturiertes JSON für KI-Agenten ---

interface ExportNode {
  id: number;
  type: string;
  label: string;
  consequence?: {
    business: string;
    technical?: string;
    reference?: string;
  };
  notes?: string;
  outputs: ExportEdge[];
}

interface ExportEdge {
  label: string;
  targetNodeId: number;
}

interface ExportRulemap {
  name: string;
  description: string;
  category: string | null;
  entryNodeId: number | null;
  nodes: ExportNode[];
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
        return {
          label: (e.label as string) || '',
          targetNodeId: targetData?.displayId ?? 0,
        };
      });

    const exportNode: ExportNode = {
      id: data?.displayId ?? 0,
      type: data?.nodeType || 'ruleNode',
      label: data?.label || '',
      outputs: outgoingEdges,
    };

    if (data?.nodeType === 'consequence' && data.consequence) {
      exportNode.consequence = {
        business: data.consequence.business,
        ...(data.consequence.technical && { technical: data.consequence.technical }),
        ...(data.consequence.reference && { reference: data.consequence.reference }),
      };
    }

    if (data?.notes) {
      exportNode.notes = data.notes;
    }

    return exportNode;
  });

  // Entry Node: der Knoten ohne eingehende Edges
  const targetIds = new Set(edges.map((e) => e.target));
  const entryNode = nodes.find((n) => !targetIds.has(n.id));
  const entryData = entryNode?.data as unknown as RuleNodeData | undefined;

  const result: ExportRulemap = {
    name: meta.name,
    description: meta.description,
    category: meta.category,
    entryNodeId: entryData?.displayId ?? null,
    nodes: exportNodes.sort((a, b) => a.id - b.id),
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
    const typeTag = `[${data.nodeType.charAt(0).toUpperCase() + data.nodeType.slice(1)}]`;

    // Knotenzeile
    lines.push(`${indent}**#${data.displayId}** ${typeTag} ${data.label}`);

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
