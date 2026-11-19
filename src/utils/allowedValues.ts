import type { Node, Edge } from '@xyflow/react';
import type { AllowedValue, RuleNodeData } from '../types/nodes';

/**
 * Ermittelt den geschlossenen Wertebereich, über den ein Knoten verzweigt.
 *
 * Der Bereich kann an zwei Stellen stehen: am verzweigenden Knoten selbst oder
 * an einem Input, der ihn versorgt. Der eigene Bereich hat Vorrang; sonst gilt
 * der des Inputs, dessen technischer Schlüssel zum Knoten passt (oder, wenn
 * keiner einen Schlüssel trägt, der des einzigen versorgenden Inputs).
 *
 * Rückgabe `null` bedeutet: kein Wertebereich bekannt. Das ist nicht dasselbe
 * wie ein leerer Bereich.
 */
export function resolveAllowedValues(
  nodeId: string,
  nodes: Node[],
  edges: Edge[]
): AllowedValue[] | null {
  const node = nodes.find((n) => n.id === nodeId);
  if (!node) return null;

  const data = node.data as unknown as RuleNodeData;
  if (data.allowedValues?.length) return data.allowedValues;

  const feedingInputs = edges
    .filter((e) => e.target === nodeId)
    .map((e) => nodes.find((n) => n.id === e.source))
    .filter((n): n is Node => !!n)
    .filter((n) => {
      const d = n.data as unknown as RuleNodeData;
      return d.nodeType === 'input' && !!d.allowedValues?.length;
    });

  if (feedingInputs.length === 0) return null;

  if (data.technicalKey) {
    const match = feedingInputs.find(
      (n) => (n.data as unknown as RuleNodeData).technicalKey === data.technicalKey
    );
    if (match) return (match.data as unknown as RuleNodeData).allowedValues ?? null;
  }

  if (feedingInputs.length === 1) {
    return (feedingInputs[0].data as unknown as RuleNodeData).allowedValues ?? null;
  }

  return null;
}
