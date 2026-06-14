import type { Node, Edge } from '@xyflow/react';
import type { RuleNodeData } from '../types/nodes';

export interface ValidationWarning {
  nodeId: string;               // React Flow Node-ID
  displayId: number;            // Sichtbare #-ID
  type: ValidationWarningType;
  message: string;
  severity: 'warning' | 'error';
}

export type ValidationWarningType =
  | 'incomplete_outputs'        // Fehlende Ausgänge (z.B. boolean ohne "Nein")
  | 'missing_label'             // Knoten ohne Label
  | 'dead_end'                  // Kein Consequence, aber keine Ausgänge
  | 'unreachable_node'          // Kein eingehender Edge (außer Entry)
  | 'empty_consequence'         // Consequence ohne fachliche Beschreibung
  | 'missing_edge_label'        // Edge an Multi-Output-Knoten ohne Label
  | 'orphan_ref'                // Consequence-Ref verweist auf nicht existierenden Knoten
  ;

export function validateRulemap(nodes: Node[], edges: Edge[]): ValidationWarning[] {
  const warnings: ValidationWarning[] = [];

  if (nodes.length === 0) return warnings;

  // Hilfsdaten aufbauen
  const nodeMap = new Map<string, Node>();
  nodes.forEach((n) => nodeMap.set(n.id, n));

  const outgoingEdges = new Map<string, Edge[]>();
  const incomingNodeIds = new Set<string>();

  edges.forEach((e) => {
    if (!outgoingEdges.has(e.source)) outgoingEdges.set(e.source, []);
    outgoingEdges.get(e.source)!.push(e);
    incomingNodeIds.add(e.target);
  });

  // Entry-Node finden (kein eingehender Edge)
  const entryNodes = nodes.filter((n) => !incomingNodeIds.has(n.id));

  for (const node of nodes) {
    const data = node.data as unknown as RuleNodeData;
    const outEdges = outgoingEdges.get(node.id) ?? [];
    const isEntry = entryNodes.includes(node);

    // --- 1. Fehlende Labels ---
    if (!data.label || data.label.trim() === '') {
      warnings.push({
        nodeId: node.id,
        displayId: data.displayId,
        type: 'missing_label',
        message: `Knoten #${data.displayId} hat kein Label.`,
        severity: 'warning',
      });
    }

    // --- 2. Sackgasse (kein Consequence, aber keine Ausgänge) ---
    if (
      data.nodeType !== 'consequence' &&
      data.nodeType !== 'consequence-ref' &&
      outEdges.length === 0
    ) {
      warnings.push({
        nodeId: node.id,
        displayId: data.displayId,
        type: 'dead_end',
        message: `Knoten #${data.displayId} hat keine Ausgänge und ist kein Endpunkt.`,
        severity: 'error',
      });
    }

    // --- 3. Unerreichbare Knoten ---
    if (!isEntry && !incomingNodeIds.has(node.id)) {
      warnings.push({
        nodeId: node.id,
        displayId: data.displayId,
        type: 'unreachable_node',
        message: `Knoten #${data.displayId} ist nicht erreichbar (keine eingehende Verbindung).`,
        severity: 'error',
      });
    }

    // --- 4. Fehlende Ausgänge bei typisierten Bedingungen ---
    if (
      (data.nodeType === 'condition' || data.nodeType === 'decision') &&
      outEdges.length > 0
    ) {
      if (data.expectedType === 'boolean') {
        const labels = outEdges.map((e) => (e.label as string)?.toLowerCase()).filter(Boolean);
        const hasYes = labels.some((l) => ['ja', 'yes', 'wahr', 'true'].includes(l));
        const hasNo = labels.some((l) => ['nein', 'no', 'falsch', 'false'].includes(l));

        if (hasYes && !hasNo) {
          warnings.push({
            nodeId: node.id,
            displayId: data.displayId,
            type: 'incomplete_outputs',
            message: `Knoten #${data.displayId} hat einen positiven Ausgang aber keinen negativen.`,
            severity: 'warning',
          });
        }
        if (hasNo && !hasYes) {
          warnings.push({
            nodeId: node.id,
            displayId: data.displayId,
            type: 'incomplete_outputs',
            message: `Knoten #${data.displayId} hat einen negativen Ausgang aber keinen positiven.`,
            severity: 'warning',
          });
        }
      }
    }

    // --- 5. Multi-Output ohne Edge-Labels ---
    if (outEdges.length > 1) {
      const unlabeledEdges = outEdges.filter(
        (e) => !e.label || (e.label as string).trim() === ''
      );
      if (unlabeledEdges.length > 0) {
        warnings.push({
          nodeId: node.id,
          displayId: data.displayId,
          type: 'missing_edge_label',
          message: `Knoten #${data.displayId} hat ${unlabeledEdges.length} Verbindung(en) ohne Label.`,
          severity: 'warning',
        });
      }
    }

    // --- 6. Leere Consequence ---
    if (data.nodeType === 'consequence') {
      const hasContent = data.consequence?.business && data.consequence.business.trim() !== '';
      if (!hasContent) {
        warnings.push({
          nodeId: node.id,
          displayId: data.displayId,
          type: 'empty_consequence',
          message: `Endpunkt #${data.displayId} hat keine fachliche Beschreibung.`,
          severity: 'warning',
        });
      }
    }

    // --- 7. Verwaiste Consequence-Ref ---
    if (data.nodeType === 'consequence-ref' && data.refNodeId) {
      const refExists = nodes.some(
        (n) => (n.data as unknown as RuleNodeData).displayId === data.refNodeId &&
               (n.data as unknown as RuleNodeData).nodeType === 'consequence'
      );
      if (!refExists) {
        warnings.push({
          nodeId: node.id,
          displayId: data.displayId,
          type: 'orphan_ref',
          message: `Referenz #${data.displayId} verweist auf Knoten #${data.refNodeId}, der nicht existiert.`,
          severity: 'error',
        });
      }
    }
  }

  return warnings;
}
