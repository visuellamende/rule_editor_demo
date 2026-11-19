import type { Node, Edge } from '@xyflow/react';
import type { RuleNodeData } from '../types/nodes';

/**
 * Pruefung einer Decision Map gegen die Regeln aus docs/format-spec.md.
 *
 * Jeder Befund traegt die stabile Regel-ID aus der Spezifikation. Der Wert von
 * `type` bleibt fuer die acht Befunde erhalten, die es vor Einfuehrung der
 * Regel-IDs schon gab, damit bestehende Exporte und Agenten-Prompts weiter
 * passen.
 *
 * Nicht enthalten: TC-06 (Nachrechnung von Testfaellen) und die Regeln aus
 * Abschnitt 8, die auf noch nicht eingefuehrten Feldern beruhen. Die
 * Strukturregeln der Gruppe FMT betreffen das Austauschdokument und stehen in
 * validateExportDocument.ts.
 */

export type Severity = 'error' | 'warning' | 'hint';

export interface ValidationWarning {
  nodeId: string;               // React-Flow-Knoten-ID; leer bei dokumentweiten Befunden
  displayId: number;            // Sichtbare #-ID; 0 bei dokumentweiten Befunden
  ruleId: string;               // Stabile Regel-ID, z. B. "CONS-07"
  type: ValidationWarningType;
  message: string;
  severity: Severity;
}

export type ValidationWarningType =
  // --- Bestand ---
  | 'incomplete_outputs'          // EDGE-05
  | 'missing_label'               // NODE-03
  | 'dead_end'                    // NODE-04
  | 'unreachable_node'            // NODE-06
  | 'empty_consequence'           // CONS-01, CONS-02
  | 'missing_edge_label'          // EDGE-02
  | 'orphan_ref'                  // REF-02
  | 'invalid_example_key'         // TC-02
  // --- Kanten ---
  | 'invalid_edge_target'         // EDGE-01
  | 'missing_edge_value'          // EDGE-03
  | 'duplicate_edge_value'        // EDGE-04
  // --- Knoten und Graph ---
  | 'consequence_has_outputs'     // NODE-05
  | 'missing_technical_key'       // NODE-07, IN-01
  | 'action_branches'             // NODE-08
  | 'action_untyped'              // NODE-09
  | 'cycle'                       // NODE-10
  // --- Referenzen ---
  | 'missing_ref'                 // REF-01, REF-03
  | 'ref_to_ref'                  // REF-04
  // --- Endpunkte ---
  | 'missing_consequence'         // CONS-05
  | 'duplicate_consequence'       // CONS-06
  | 'open_path'                   // CONS-07
  // --- Inputs ---
  | 'input_fanout'                // IN-02
  | 'input_target'                // IN-03
  | 'missing_input_source'        // IN-04
  | 'invalid_provider'            // IN-05
  | 'missing_referenced_decision' // IN-06
  | 'unhandled_failure'           // IN-07
  | 'duplicate_technical_key'     // IN-08
  | 'key_mismatch'                // IN-09
  // --- Testfaelle ---
  | 'invalid_test_consequence'    // TC-01
  | 'invalid_test_value'          // TC-03
  | 'missing_test_name'           // TC-04
  | 'untested_consequence'        // TC-05
  // --- Wissensquellen ---
  | 'invalid_knowledge_source'    // KS-01, KS-02, KS-03
  ;

const PROVIDERS = ['system', 'manuell', 'komposition'] as const;
const KS_ART = ['gesetz', 'norm_standard', 'interne_richtlinie', 'vertrag', 'fachwissen'] as const;
const KS_VERBINDLICHKEIT = ['verbindlich', 'empfohlen', 'optional'] as const;

const POSITIVE_LABELS = ['ja', 'yes', 'wahr', 'true'];
const NEGATIVE_LABELS = ['nein', 'no', 'falsch', 'false'];

const ENDPOINT_TYPES = ['consequence', 'consequence-ref'];
const INPUT_TYPES = ['input', 'input-ref'];

function dataOf(node: Node): RuleNodeData {
  return node.data as unknown as RuleNodeData;
}

function isLoopBack(edge: Edge): boolean {
  const d = edge.data as { edgeType?: string } | undefined;
  return d?.edgeType === 'loop-back';
}

export function validateDecisionMap(nodes: Node[], edges: Edge[]): ValidationWarning[] {
  const warnings: ValidationWarning[] = [];
  if (nodes.length === 0) return warnings;

  const push = (
    node: Node | null,
    ruleId: string,
    type: ValidationWarningType,
    message: string,
    severity: Severity
  ) => {
    warnings.push({
      nodeId: node ? node.id : '',
      displayId: node ? dataOf(node).displayId : 0,
      ruleId,
      type,
      message,
      severity,
    });
  };

  // ---------------------------------------------------------------- Hilfsdaten

  const nodeMap = new Map<string, Node>();
  nodes.forEach((n) => nodeMap.set(n.id, n));

  const byDisplayId = new Map<number, Node>();
  nodes.forEach((n) => byDisplayId.set(dataOf(n).displayId, n));

  const outgoing = new Map<string, Edge[]>();
  const incoming = new Set<string>();
  const danglingEdges: Edge[] = [];

  for (const e of edges) {
    if (!outgoing.has(e.source)) outgoing.set(e.source, []);
    outgoing.get(e.source)!.push(e);
    if (nodeMap.has(e.target)) {
      incoming.add(e.target);
    } else {
      danglingEdges.push(e);
    }
  }

  const availableKeys = new Set<string>();
  for (const n of nodes) {
    const d = dataOf(n);
    if ((d.nodeType === 'input' || d.nodeType === 'condition') && d.technicalKey) {
      availableKeys.add(d.technicalKey);
    }
  }

  const entryNodes = nodes.filter((n) => !incoming.has(n.id));

  // Wurzel der Entscheidung: der Einstiegsknoten, nicht die Inputs.
  const rootNode =
    entryNodes.find((n) => dataOf(n).nodeType === 'decision') ??
    entryNodes.find((n) => !INPUT_TYPES.includes(dataOf(n).nodeType)) ??
    null;

  // ------------------------------------------------- EDGE-01: Kantenziele gueltig

  for (const e of danglingEdges) {
    const source = nodeMap.get(e.source) ?? null;
    push(
      source,
      'EDGE-01',
      'invalid_edge_target',
      source
        ? `Knoten #${dataOf(source).displayId} hat eine Verbindung auf ein Ziel, das nicht existiert.`
        : 'Eine Verbindung zeigt auf ein Ziel, das nicht existiert.',
      'error'
    );
  }

  // ------------------------------------------------------- Regeln je Knoten

  const seenKeys = new Map<string, number[]>();

  for (const node of nodes) {
    const data = dataOf(node);
    const outEdges = outgoing.get(node.id) ?? [];
    const isEntry = entryNodes.includes(node);
    const isEndpoint = ENDPOINT_TYPES.includes(data.nodeType);
    const isRef = data.nodeType === 'consequence-ref' || data.nodeType === 'input-ref';
    const id = data.displayId;

    // --- NODE-03: Label vorhanden ---
    if (!isRef && (!data.label || data.label.trim() === '')) {
      push(node, 'NODE-03', 'missing_label', `Knoten #${id} hat kein Label.`, 'warning');
    }

    // --- NODE-04: Sackgasse ---
    if (!isEndpoint && outEdges.length === 0) {
      push(node, 'NODE-04', 'dead_end', `Knoten #${id} hat keine Ausgänge und ist kein Endpunkt.`, 'error');
    }

    // --- NODE-05: Endpunkt ohne Ausgaenge ---
    if (isEndpoint && outEdges.length > 0) {
      push(
        node,
        'NODE-05',
        'consequence_has_outputs',
        `Endpunkt #${id} hat ${outEdges.length} Ausgang/Ausgänge. Endpunkte haben keine Nachfolger.`,
        'error'
      );
    }

    // --- NODE-06: Unerreichbar ---
    if (!isEntry && !incoming.has(node.id)) {
      push(node, 'NODE-06', 'unreachable_node', `Knoten #${id} ist nicht erreichbar (keine eingehende Verbindung).`, 'error');
    }

    // --- NODE-07 / IN-01: technischer Schluessel ---
    if (data.nodeType === 'condition' && !data.technicalKey) {
      push(node, 'NODE-07', 'missing_technical_key', `Bedingung #${id} hat keinen technischen Schlüssel.`, 'warning');
    }
    if (data.nodeType === 'input' && !data.technicalKey) {
      push(node, 'IN-01', 'missing_technical_key', `Input #${id} hat keinen technischen Schlüssel.`, 'error');
    }

    // --- NODE-08 / NODE-09: Action-Knoten ---
    if (data.nodeType === 'action') {
      if (outEdges.length > 1) {
        push(
          node,
          'NODE-08',
          'action_branches',
          `Action #${id} hat ${outEdges.length} Ausgänge. Actions verzweigen nicht, sie erzeugen einen Wert.`,
          'error'
        );
      }
      if (!data.technicalKey || !data.expectedType) {
        push(
          node,
          'NODE-09',
          'action_untyped',
          `Action #${id} sollte technischen Schlüssel und Datentyp tragen, damit der erzeugte Wert benannt ist.`,
          'warning'
        );
      }
    }

    // --- EDGE-02 / EDGE-03 / EDGE-04 ---
    if (outEdges.length > 1) {
      const unlabeled = outEdges.filter((e) => !e.label || String(e.label).trim() === '');
      if (unlabeled.length > 0) {
        push(
          node,
          'EDGE-02',
          'missing_edge_label',
          `Knoten #${id} hat ${unlabeled.length} Verbindung(en) ohne Label.`,
          'warning'
        );
      }

      const values = outEdges.map((e) => (e.data as { value?: string } | undefined)?.value);
      const missingValues = values.filter((v) => v === undefined || v === null || v === '').length;
      if (missingValues > 0) {
        push(
          node,
          'EDGE-03',
          'missing_edge_value',
          `Knoten #${id} hat ${missingValues} Verbindung(en) ohne maschinenlesbaren Wert. Die Verzweigung ist nicht auswertbar.`,
          'warning'
        );
      }

      const seen = new Set<string>();
      const duplicates = new Set<string>();
      for (const v of values) {
        if (!v) continue;
        if (seen.has(v)) duplicates.add(v);
        seen.add(v);
      }
      if (duplicates.size > 0) {
        push(
          node,
          'EDGE-04',
          'duplicate_edge_value',
          `Knoten #${id} verwendet den Wert ${[...duplicates].map((v) => `"${v}"`).join(', ')} mehrfach.`,
          'error'
        );
      }
    }

    // --- EDGE-05: boolesche Vollstaendigkeit ---
    if ((data.nodeType === 'condition' || data.nodeType === 'decision') && outEdges.length > 0) {
      if (data.expectedType === 'boolean') {
        const labels = outEdges.map((e) => String(e.label ?? '').toLowerCase()).filter(Boolean);
        const hasYes = labels.some((l) => POSITIVE_LABELS.includes(l));
        const hasNo = labels.some((l) => NEGATIVE_LABELS.includes(l));

        if (hasYes && !hasNo) {
          push(node, 'EDGE-05', 'incomplete_outputs', `Knoten #${id} hat einen positiven Ausgang aber keinen negativen.`, 'warning');
        }
        if (hasNo && !hasYes) {
          push(node, 'EDGE-05', 'incomplete_outputs', `Knoten #${id} hat einen negativen Ausgang aber keinen positiven.`, 'warning');
        }
      }
    }

    // --- CONS-01 / CONS-02: Endpunkt mit fachlicher Beschreibung ---
    if (data.nodeType === 'consequence') {
      const hasContent = data.consequence?.business && data.consequence.business.trim() !== '';
      if (!hasContent) {
        push(node, 'CONS-02', 'empty_consequence', `Endpunkt #${id} hat keine fachliche Beschreibung.`, 'warning');
      }
    }

    // --- REF-01 bis REF-04 ---
    if (isRef) {
      if (data.refNodeId === undefined || data.refNodeId === null) {
        push(
          node,
          data.nodeType === 'consequence-ref' ? 'REF-01' : 'REF-03',
          'missing_ref',
          `Referenz #${id} nennt kein Ziel.`,
          'error'
        );
      } else {
        const target = byDisplayId.get(data.refNodeId);
        const targetType = target ? dataOf(target).nodeType : null;
        const expected = data.nodeType === 'consequence-ref' ? 'consequence' : 'input';

        if (!target || targetType !== expected) {
          push(
            node,
            data.nodeType === 'consequence-ref' ? 'REF-02' : 'REF-03',
            'orphan_ref',
            `Referenz #${id} verweist auf Knoten #${data.refNodeId}, der nicht existiert oder nicht vom Typ "${expected}" ist.`,
            'error'
          );
        }
        if (targetType === 'consequence-ref' || targetType === 'input-ref') {
          push(node, 'REF-04', 'ref_to_ref', `Referenz #${id} verweist auf eine weitere Referenz (#${data.refNodeId}).`, 'error');
        }
      }
    }

    // --- IN-02 bis IN-08: Inputs ---
    if (data.nodeType === 'input' || data.nodeType === 'input-ref') {
      if (outEdges.length !== 1) {
        push(
          node,
          'IN-02',
          'input_fanout',
          `Input #${id} hat ${outEdges.length} Ausgänge. Ein Input versorgt genau eine Bedingung oder Action.`,
          'error'
        );
      }
      for (const e of outEdges) {
        const target = nodeMap.get(e.target);
        if (!target) continue;
        const t = dataOf(target).nodeType;
        if (t !== 'condition' && t !== 'action') {
          push(
            node,
            'IN-03',
            'input_target',
            `Input #${id} zeigt auf Knoten #${dataOf(target).displayId} vom Typ "${t}". Zulässig sind "condition" und "action".`,
            'error'
          );
        }
        // --- IN-09: Schluessel passen zusammen ---
        const targetKey = dataOf(target).technicalKey;
        if (data.technicalKey && targetKey && data.technicalKey !== targetKey) {
          push(
            node,
            'IN-09',
            'key_mismatch',
            `Input #${id} ("${data.technicalKey}") versorgt Knoten #${dataOf(target).displayId} mit abweichendem Schlüssel ("${targetKey}").`,
            'warning'
          );
        }
      }
    }

    if (data.nodeType === 'input') {
      const hasSource = data.inputProvider !== undefined;
      if (!hasSource) {
        push(node, 'IN-04', 'missing_input_source', `Input #${id} hat keine Angabe zur Datenherkunft.`, 'warning');
      } else {
        if (!PROVIDERS.includes(data.inputProvider as (typeof PROVIDERS)[number])) {
          push(node, 'IN-05', 'invalid_provider', `Input #${id} hat eine unbekannte Datenherkunft ("${data.inputProvider}").`, 'error');
        }
        if (data.inputProvider === 'komposition' && !data.inputReferenziertEntscheidung) {
          push(
            node,
            'IN-06',
            'missing_referenced_decision',
            `Input #${id} stammt aus einer anderen Entscheidung, nennt sie aber nicht.`,
            'error'
          );
        }
        if (data.inputKannScheitern === true) {
          push(
            node,
            'IN-07',
            'unhandled_failure',
            `Input #${id} kann scheitern. Prüfe, ob die Map einen Pfad für den Fehlerfall hat.`,
            'hint'
          );
        }
      }

      // --- IN-08: Schluessel dokumentweit eindeutig ---
      if (data.technicalKey) {
        if (!seenKeys.has(data.technicalKey)) seenKeys.set(data.technicalKey, []);
        seenKeys.get(data.technicalKey)!.push(id);
      }
    }

    // --- KS-01 bis KS-03: Wissensquellen ---
    for (const ks of data.knowledgeSources ?? []) {
      const problems: string[] = [];
      if (!KS_ART.includes(ks.art as (typeof KS_ART)[number])) problems.push(`unbekannte Art "${ks.art}"`);
      if (!KS_VERBINDLICHKEIT.includes(ks.verbindlichkeit as (typeof KS_VERBINDLICHKEIT)[number])) {
        problems.push(`unbekannte Verbindlichkeit "${ks.verbindlichkeit}"`);
      }
      if (!ks.referenz || ks.referenz.trim() === '') problems.push('keine Referenz');
      if (problems.length > 0) {
        push(
          node,
          'KS-01',
          'invalid_knowledge_source',
          `Wissensquelle an Knoten #${id}: ${problems.join(', ')}.`,
          'error'
        );
      }
    }

    // --- TC-01 bis TC-04: Testfaelle ---
    if (data.nodeType === 'consequence' && data.examples?.length) {
      for (const example of data.examples) {
        if (!example.name || example.name.trim() === '') {
          push(node, 'TC-04', 'missing_test_name', `Ein Testfall an Endpunkt #${id} hat keinen Namen.`, 'warning');
        }
        for (const [key, value] of Object.entries(example.inputs ?? {})) {
          if (key && !availableKeys.has(key)) {
            push(
              node,
              'TC-02',
              'invalid_example_key',
              `Beispiel "${example.name}": Key "${key}" existiert nicht im Baum.`,
              'warning'
            );
          }
          if (typeof value !== 'string') {
            push(
              node,
              'TC-03',
              'invalid_test_value',
              `Beispiel "${example.name}": Wert für "${key}" ist keine Zeichenkette.`,
              'error'
            );
          }
        }
      }
    }
  }

  // --- IN-08: Auswertung der Schluesseldopplungen ---
  for (const [key, ids] of seenKeys) {
    if (ids.length > 1) {
      const node = byDisplayId.get(ids[ids.length - 1]) ?? null;
      push(
        node,
        'IN-08',
        'duplicate_technical_key',
        `Der technische Schlüssel "${key}" wird von mehreren Inputs verwendet (#${ids.join(', #')}).`,
        'warning'
      );
    }
  }

  // ------------------------------------------------- CONS-05: Endpunkt vorhanden

  const consequences = nodes.filter((n) => dataOf(n).nodeType === 'consequence');
  if (consequences.length === 0) {
    push(null, 'CONS-05', 'missing_consequence', 'Die Decision Map hat keinen Endpunkt.', 'error');
  }

  // ------------------------------------------- CONS-06: doppelte Endpunkttexte

  const byBusiness = new Map<string, number[]>();
  for (const n of consequences) {
    const text = dataOf(n).consequence?.business?.trim();
    if (!text) continue;
    if (!byBusiness.has(text)) byBusiness.set(text, []);
    byBusiness.get(text)!.push(dataOf(n).displayId);
  }
  for (const ids of byBusiness.values()) {
    if (ids.length > 1) {
      const node = byDisplayId.get(ids[ids.length - 1]) ?? null;
      push(
        node,
        'CONS-06',
        'duplicate_consequence',
        `Endpunkte #${ids.join(', #')} haben dieselbe fachliche Beschreibung. Einer davon sollte eine Referenz sein.`,
        'hint'
      );
    }
  }

  // ----------------------------------------------------- NODE-10: Zyklenfreiheit

  const cycleNodes = findCycleNodes(nodes, outgoing);
  for (const n of cycleNodes) {
    push(
      n,
      'NODE-10',
      'cycle',
      `Knoten #${dataOf(n).displayId} liegt auf einem Zyklus, der nicht als Rücksprung gekennzeichnet ist.`,
      'error'
    );
  }

  // ------------------------------------------------- CONS-07: Endpunktgarantie

  if (rootNode) {
    const reachable = collectReachable(rootNode.id, outgoing, nodeMap);
    const reachesEndpoint = computeReachesEndpoint(nodes, outgoing, nodeMap);

    for (const id of reachable) {
      const node = nodeMap.get(id);
      if (!node) continue;
      if (ENDPOINT_TYPES.includes(dataOf(node).nodeType)) continue;
      if (reachesEndpoint.has(id)) continue;
      push(
        node,
        'CONS-07',
        'open_path',
        `Von Knoten #${dataOf(node).displayId} führt kein Weg zu einem Endpunkt.`,
        'error'
      );
    }
  }

  // ------------------------------------------------ TC-05: Abdeckung der Endpunkte

  const testedConsequenceIds = new Set<number>();
  for (const n of nodes) {
    const d = dataOf(n);
    if (d.nodeType === 'consequence' && d.examples?.length) {
      testedConsequenceIds.add(d.displayId);
    }
  }
  if (testedConsequenceIds.size > 0) {
    for (const n of consequences) {
      const d = dataOf(n);
      if (!testedConsequenceIds.has(d.displayId)) {
        push(n, 'TC-05', 'untested_consequence', `Endpunkt #${d.displayId} wird von keinem Testfall erreicht.`, 'hint');
      }
    }
  }

  return warnings;
}

// ------------------------------------------------------------------ Hilfsfunktionen

/** Knoten, die auf einem nicht als Ruecksprung gekennzeichneten Zyklus liegen. */
function findCycleNodes(nodes: Node[], outgoing: Map<string, Edge[]>): Node[] {
  const WHITE = 0, GREY = 1, BLACK = 2;
  const color = new Map<string, number>();
  const onCycle = new Set<string>();
  const stack: string[] = [];
  nodes.forEach((n) => color.set(n.id, WHITE));

  const visit = (id: string) => {
    color.set(id, GREY);
    stack.push(id);
    for (const e of outgoing.get(id) ?? []) {
      if (isLoopBack(e)) continue;
      if (!color.has(e.target)) continue;
      const c = color.get(e.target);
      if (c === WHITE) {
        visit(e.target);
      } else if (c === GREY) {
        // Zyklus gefunden: alles ab dem Ziel auf dem aktuellen Stack gehoert dazu
        const from = stack.lastIndexOf(e.target);
        if (from >= 0) stack.slice(from).forEach((x) => onCycle.add(x));
      }
    }
    stack.pop();
    color.set(id, BLACK);
  };

  for (const n of nodes) {
    if (color.get(n.id) === WHITE) visit(n.id);
  }

  return nodes.filter((n) => onCycle.has(n.id));
}

/** Alle vom Startknoten erreichbaren Knoten-IDs, Startknoten eingeschlossen. */
function collectReachable(startId: string, outgoing: Map<string, Edge[]>, nodeMap: Map<string, Node>): Set<string> {
  const seen = new Set<string>([startId]);
  const queue = [startId];
  while (queue.length > 0) {
    const id = queue.shift()!;
    for (const e of outgoing.get(id) ?? []) {
      if (!nodeMap.has(e.target) || seen.has(e.target)) continue;
      seen.add(e.target);
      queue.push(e.target);
    }
  }
  return seen;
}

/** Knoten, von denen aus ein Endpunkt erreichbar ist. Rueckwaerts bis zum Fixpunkt. */
function computeReachesEndpoint(nodes: Node[], outgoing: Map<string, Edge[]>, nodeMap: Map<string, Node>): Set<string> {
  const result = new Set<string>();
  for (const n of nodes) {
    if (ENDPOINT_TYPES.includes(dataOf(n).nodeType)) result.add(n.id);
  }
  let grew = true;
  while (grew) {
    grew = false;
    for (const n of nodes) {
      if (result.has(n.id)) continue;
      for (const e of outgoing.get(n.id) ?? []) {
        if (!nodeMap.has(e.target)) continue;
        if (result.has(e.target)) {
          result.add(n.id);
          grew = true;
          break;
        }
      }
    }
  }
  return result;
}
