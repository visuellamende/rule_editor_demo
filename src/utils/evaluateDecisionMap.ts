import type { Node, Edge } from '@xyflow/react';
import type { RuleNodeData } from '../types/nodes';

/**
 * Auswertung einer Decision Map: Welchen Weg nimmt ein Fall mit gegebenen
 * Eingaben, und in welchem Endpunkt endet er?
 *
 * Die Auswertung ist bewusst eng: Sie folgt Kanten anhand ihrer Werte und
 * rechnet nichts. Ausdrücke in Endpunkten und die Werte, die `action`-Knoten
 * erzeugen, liegen ausserhalb (Abschnitt 12 der Spezifikation). Fuer die
 * Wegfindung genuegt das, denn verzweigt wird ueber Kantenwerte.
 *
 * Alle Eingaben sind Zeichenketten, so wie sie in `testCases[].inputs` stehen.
 */

export type EvaluationStatus =
  | 'consequence'    // Ein Endpunkt wurde erreicht
  | 'no_entry'       // Kein Einstiegsknoten gefunden
  | 'no_key'         // Verzweigender Knoten ohne technischen Schluessel
  | 'missing_value'  // Fuer den Schluessel wurde kein Wert uebergeben
  | 'no_branch'      // Kein Ausgang passt zum Wert
  | 'dead_end'       // Knoten ohne Ausgang, der kein Endpunkt ist
  | 'cycle';         // Ein Knoten wurde zweimal betreten

export interface EvaluationResult {
  status: EvaluationStatus;
  /** Besuchte Knoten als displayId, in der Reihenfolge des Durchlaufs. */
  path: number[];
  /** Nur bei status "consequence": der erreichte Endpunkt. */
  consequenceId?: number;
  /** Knoten, an dem die Auswertung stehen blieb. */
  stoppedAt?: number;
  /** Schluessel, um den es ging. */
  key?: string;
  /** Wert, zu dem kein Ausgang passte. */
  value?: string;
  /** Durchlaufene action-Knoten; ihre Werte werden nicht berechnet. */
  uncomputedActions: number[];
}

function dataOf(node: Node): RuleNodeData {
  return node.data as unknown as RuleNodeData;
}

const INPUT_TYPES = ['input', 'input-ref'];

/** Der Knoten, an dem die Auswertung beginnt: der Einstieg, nicht die Inputs. */
export function findEntryNode(nodes: Node[], edges: Edge[]): Node | null {
  const withIncoming = new Set(edges.map((e) => e.target));
  const candidates = nodes.filter((n) => !withIncoming.has(n.id));
  return (
    candidates.find((n) => dataOf(n).nodeType === 'decision') ??
    candidates.find((n) => !INPUT_TYPES.includes(dataOf(n).nodeType)) ??
    null
  );
}

/**
 * Schluessel, ueber den ein Knoten verzweigt: der eigene, sonst der eines
 * Inputs, der ihn versorgt (IN-09 verlangt, dass beide uebereinstimmen).
 */
function branchKey(node: Node, nodes: Node[], edges: Edge[]): string | null {
  const own = dataOf(node).technicalKey;
  if (own) return own;

  const feeding = edges
    .filter((e) => e.target === node.id)
    .map((e) => nodes.find((n) => n.id === e.source))
    .filter((n): n is Node => !!n)
    .filter((n) => dataOf(n).nodeType === 'input' && !!dataOf(n).technicalKey);

  return feeding.length === 1 ? dataOf(feeding[0]).technicalKey ?? null : null;
}

/**
 * Waehlt den Ausgang, der zum Wert passt.
 *
 * Zuerst ueber `value`, exakt und dann ohne Beachtung der Gross- und
 * Kleinschreibung. Erst wenn keine Kante einen Wert traegt, wird das Label
 * herangezogen — fuer Maps, die vor EDGE-03 entstanden sind.
 */
function selectEdge(outEdges: Edge[], value: string): Edge | null {
  const valueOf = (e: Edge) => (e.data as { value?: string } | undefined)?.value;

  const exact = outEdges.find((e) => valueOf(e) === value);
  if (exact) return exact;

  const lower = value.toLowerCase();
  const insensitive = outEdges.find((e) => valueOf(e)?.toLowerCase() === lower);
  if (insensitive) return insensitive;

  if (outEdges.every((e) => !valueOf(e))) {
    const byLabel = outEdges.find((e) => String(e.label ?? '').toLowerCase() === lower);
    if (byLabel) return byLabel;
  }

  return null;
}

export function evaluateDecisionMap(
  nodes: Node[],
  edges: Edge[],
  inputs: Record<string, string>
): EvaluationResult {
  const path: number[] = [];
  const uncomputedActions: number[] = [];
  const visited = new Set<string>();

  const nodeMap = new Map<string, Node>();
  nodes.forEach((n) => nodeMap.set(n.id, n));

  const byDisplayId = new Map<number, Node>();
  nodes.forEach((n) => byDisplayId.set(dataOf(n).displayId, n));

  const outgoing = new Map<string, Edge[]>();
  for (const e of edges) {
    if (!outgoing.has(e.source)) outgoing.set(e.source, []);
    outgoing.get(e.source)!.push(e);
  }

  let current = findEntryNode(nodes, edges);
  if (!current) return { status: 'no_entry', path, uncomputedActions };

  for (;;) {
    const data = dataOf(current);

    if (visited.has(current.id)) {
      return { status: 'cycle', path, stoppedAt: data.displayId, uncomputedActions };
    }
    visited.add(current.id);
    path.push(data.displayId);

    // --- Endpunkte ---
    if (data.nodeType === 'consequence') {
      return { status: 'consequence', path, consequenceId: data.displayId, uncomputedActions };
    }
    if (data.nodeType === 'consequence-ref') {
      const target = data.refNodeId !== undefined ? byDisplayId.get(data.refNodeId) : undefined;
      if (target && dataOf(target).nodeType === 'consequence') {
        return { status: 'consequence', path, consequenceId: dataOf(target).displayId, uncomputedActions };
      }
      return { status: 'dead_end', path, stoppedAt: data.displayId, uncomputedActions };
    }

    if (data.nodeType === 'action') uncomputedActions.push(data.displayId);

    // --- Weitergehen ---
    const outEdges = (outgoing.get(current.id) ?? []).filter((e) => nodeMap.has(e.target));
    if (outEdges.length === 0) {
      return { status: 'dead_end', path, stoppedAt: data.displayId, uncomputedActions };
    }

    let next: Edge | null;
    if (outEdges.length === 1) {
      next = outEdges[0];
    } else {
      const key = branchKey(current, nodes, edges);
      if (!key) {
        return { status: 'no_key', path, stoppedAt: data.displayId, uncomputedActions };
      }
      const value = inputs[key];
      if (value === undefined) {
        return { status: 'missing_value', path, stoppedAt: data.displayId, key, uncomputedActions };
      }
      next = selectEdge(outEdges, value);
      if (!next) {
        return { status: 'no_branch', path, stoppedAt: data.displayId, key, value, uncomputedActions };
      }
    }

    const target = nodeMap.get(next.target);
    if (!target) {
      return { status: 'dead_end', path, stoppedAt: data.displayId, uncomputedActions };
    }
    current = target;
  }
}

/** Kurzfassung eines Ergebnisses fuer Meldungen. */
export function describeResult(result: EvaluationResult): string {
  switch (result.status) {
    case 'consequence':
      return `Endpunkt #${result.consequenceId}`;
    case 'no_entry':
      return 'kein Einstiegsknoten';
    case 'no_key':
      return `Knoten #${result.stoppedAt} verzweigt ohne technischen Schlüssel`;
    case 'missing_value':
      return `kein Wert für "${result.key}" an Knoten #${result.stoppedAt}`;
    case 'no_branch':
      return `kein Ausgang für "${result.key}" = "${result.value}" an Knoten #${result.stoppedAt}`;
    case 'dead_end':
      return `Knoten #${result.stoppedAt} ohne Ausgang`;
    case 'cycle':
      return `Zyklus an Knoten #${result.stoppedAt}`;
  }
}
