import type { Node, Edge } from '@xyflow/react';
import type { RuleNodeData } from '../types/nodes';

export interface DmnFinding {
  level: 'error' | 'warning' | 'hint';
  message: string;
  nodeIds: string[]; // React-Flow-IDs, zum Springen im Canvas
}

export type Translator = (key: any, params?: Record<string, string | number>) => string;

export const INPUT_TYPES = ['input', 'input-ref'] as const;
export const END_TYPES = ['consequence', 'consequence-ref'] as const;

export const TYPE_MAP: Record<string, string> = {
  boolean: 'boolean',
  bool: 'boolean',
  string: 'string',
  enum: 'string',
  text: 'string',
  number: 'number',
  integer: 'number',
  int: 'number',
  float: 'number',
  date: 'date',
  datetime: 'dateTime',
};

export const FEEL_PASSTHROUGH = /^(<=|>=|<|>|=|\[|\(|\]|not\(|")/;
export const NUMERIC = /^-?\d+(\.\d+)?$/;

export function normalizeLabel(label: string): string {
  return label
    .toLowerCase()
    .replace(/\([^)]*\)/g, '')          // Klammerzusätze entfernen
    .replace(/[?!.,:;„“"'‚‘…–-]/g, ' ') // Satzzeichen entfernen
    .replace(/\s+/g, ' ')               // Leerzeichen zusammenfassen
    .trim();
}

export interface DmnColumn {
  key: string;
  label: string;
  expression: string;
  typeRef: string | null;
  typeDerived: boolean;
  nodeIds: string[]; // React Flow node IDs
  notes: string[];   // e.g. "Notiz #4: ..."
}

export interface DmnRow {
  cells: Map<string, string | null>;
  output: string;
  notes: string[];
  endId: string | number | null;
}

export interface DmnPathStep {
  nodeId: string;
  edge: Edge;
}

export interface DmnPath {
  steps: DmnPathStep[];
  end: string; // React Flow node ID
}

export class RuleMap {
  meta: Record<string, any>;
  nodes: Map<string, Node>;
  edges: Edge[];
  byDisplay: Map<number | string, Node>;
  outEdges: Map<string, Edge[]>;

  constructor(nodes: Node[], edges: Edge[], meta?: Record<string, any>) {
    this.meta = meta || {};
    this.nodes = new Map();
    this.byDisplay = new Map();
    this.edges = edges;
    this.outEdges = new Map();

    for (const node of nodes) {
      this.nodes.set(node.id, node);
      const data = this.d(node);
      if (data && data.displayId !== undefined && data.displayId !== null) {
        this.byDisplay.set(data.displayId, node);
        this.byDisplay.set(String(data.displayId), node);
      }
    }

    for (const edge of edges) {
      if (!this.outEdges.has(edge.source)) {
        this.outEdges.set(edge.source, []);
      }
      this.outEdges.get(edge.source)!.push(edge);
    }
  }

  d(node: Node | undefined): RuleNodeData {
    return (node?.data || {}) as unknown as RuleNodeData;
  }

  type(nodeId: string): string | undefined {
    const node = this.nodes.get(nodeId);
    return this.d(node)?.nodeType;
  }

  did(nodeId: string): number | string {
    const node = this.nodes.get(nodeId);
    const displayId = this.d(node)?.displayId;
    return displayId !== undefined && displayId !== null ? displayId : nodeId;
  }

  label(nodeId: string): string {
    const node = this.nodes.get(nodeId);
    return (this.d(node)?.label || '').trim();
  }

  treeEdges(nodeId: string): Edge[] {
    const nodeType = this.type(nodeId);
    if (nodeType && (INPUT_TYPES as readonly string[]).includes(nodeType)) {
      return [];
    }
    const out = this.outEdges.get(nodeId) || [];
    return out.filter((e) => this.nodes.has(e.target));
  }

  resolve(nodeId: string): string | null {
    const node = this.nodes.get(nodeId);
    if (!node) return null;
    const data = this.d(node);
    if (data.nodeType === 'consequence-ref' || data.nodeType === 'input-ref') {
      const refId = data.refNodeId;
      if (refId !== undefined && refId !== null) {
        const original = this.byDisplay.get(refId);
        return original ? original.id : null;
      }
      return null;
    }
    return nodeId;
  }
}

export function edgeValue(edge: Edge): string | null {
  const val = (edge.data as any)?.value;
  if (val === null || val === undefined) {
    return null;
  }
  const s = String(val).trim();
  return s.length > 0 ? s : null;
}

export function feelEntry(value: string | null | undefined, typeRef: string | null): string {
  if (value === null || value === undefined) {
    return '-';
  }
  if (typeRef === 'boolean' && (value.toLowerCase() === 'true' || value.toLowerCase() === 'false')) {
    return value.toLowerCase();
  }
  if (FEEL_PASSTHROUGH.test(value)) {
    return value;
  }
  if (typeRef === 'number' && NUMERIC.test(value)) {
    return value;
  }
  return '"' + value.split('"').join('\\"') + '"';
}

export function feelString(text: string): string {
  return '"' + text.split('"').join('\\"') + '"';
}

export function isBranching(rm: RuleMap, nodeId: string): boolean {
  const nodeType = rm.type(nodeId);
  if (nodeType === 'condition') {
    return true;
  }
  if (nodeType === 'decision' || nodeType === 'action') {
    return rm.treeEdges(nodeId).length > 1;
  }
  return false;
}

function defaultTranslate(key: string, params?: Record<string, string | number>): string {
  const defaults: Record<string, string> = {
    'dmn.finding.decisionsCount': 'Die Map braucht genau eine Decision, gefunden: {count}.',
    'dmn.finding.unresolvedRef': 'Referenz #{id} verweist auf einen Knoten, der nicht existiert.',
    'dmn.finding.missingEdgeValue': '#{id}: Kante „{label}“ hat keinen technischen Wert (data.value).',
    'dmn.finding.duplicateEdgeValue': '#{id}: Wert „{value}“ kommt an {count} Kanten vor. Verletzt Hit Policy UNIQUE.',
    'dmn.finding.noTechnicalKey': '#{id} hat keinen technicalKey. Die Condition bekommt eine eigene Spalte.',
    'dmn.finding.booleanSingleEdge': '#{id} ist boolesch, hat aber nur eine Kante. Für den anderen Wert fehlt eine Regel.',
    'dmn.finding.duplicateLabelDiffKey': '„{label}“ kommt mehrfach mit abweichendem oder fehlendem Key vor ({ids}). Vermutlich dieselbe Prüfung, ergibt aber mehrere Spalten.',
    'dmn.finding.cycle': 'Zyklus im Graphen: Pfad kehrt zu #{id} zurück.',
    'dmn.finding.deadEnd': 'Pfad endet bei #{id} ohne Consequence. Die Zeile hätte keinen Output.',
    'dmn.finding.conflictingValues': 'Pfad nach #{endId} prüft „{colLabel}“ zweimal mit widersprüchlichen Werten ({val1} / {val2}). Die Zeile kann nie zutreffen.',
    'dmn.finding.derivedType': 'Spalte „{colLabel}“ hat keinen expectedType, abgeleitet: {type}.',
    'dmn.finding.actionInPath': 'Action #{id} liegt im Pfad. DMN kennt keine Seiteneffekte, sie wird als Annotation geführt.',
    'dmn.finding.notesCount': '{count} Notiz(en) werden als Annotation übernommen.',
  };
  let msg = defaults[key] || key;
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      msg = msg.split(`{${k}}`).join(String(v));
    }
  }
  return msg;
}

export function collectPaths(rm: RuleMap, startNodeId: string, findings: DmnFinding[], t: Translator = defaultTranslate): DmnPath[] {
  const paths: DmnPath[] = [];
  const cycleReported = new Set<string>();
  const deadEndReported = new Set<string>();

  function walk(nodeId: string, steps: DmnPathStep[], ancestors: Set<string>) {
    if (ancestors.has(nodeId)) {
      if (!cycleReported.has(nodeId)) {
        cycleReported.add(nodeId);
        findings.push({
          level: 'error',
          message: t('dmn.finding.cycle', { id: rm.did(nodeId) }),
          nodeIds: [nodeId],
        });
      }
      return;
    }

    const nodeType = rm.type(nodeId);
    if (nodeType && (END_TYPES as readonly string[]).includes(nodeType)) {
      paths.push({ steps, end: nodeId });
      return;
    }

    const edges = rm.treeEdges(nodeId);
    if (edges.length === 0) {
      if (!deadEndReported.has(nodeId)) {
        deadEndReported.add(nodeId);
        findings.push({
          level: 'error',
          message: t('dmn.finding.deadEnd', { id: rm.did(nodeId) }),
          nodeIds: [nodeId],
        });
      }
      return;
    }

    const nextAncestors = new Set(ancestors);
    nextAncestors.add(nodeId);

    for (const edge of edges) {
      walk(edge.target, [...steps, { nodeId, edge }], nextAncestors);
    }
  }

  walk(startNodeId, [], new Set());
  return paths;
}

export function validateRuleMap(rm: RuleMap, t: Translator = defaultTranslate): { findings: DmnFinding[]; decisions: string[] } {
  const findings: DmnFinding[] = [];

  const decisions: string[] = [];
  for (const [nid] of rm.nodes) {
    if (rm.type(nid) === 'decision') {
      decisions.push(nid);
    }
  }

  if (decisions.length !== 1) {
    findings.push({
      level: 'error',
      message: t('dmn.finding.decisionsCount', { count: decisions.length }),
      nodeIds: decisions,
    });
  }

  for (const [nid] of rm.nodes) {
    const nodeType = rm.type(nid);

    // Referenzen müssen auflösbar sein
    if ((nodeType === 'consequence-ref' || nodeType === 'input-ref') && rm.resolve(nid) === null) {
      findings.push({
        level: 'error',
        message: t('dmn.finding.unresolvedRef', { id: rm.did(nid) }),
        nodeIds: [nid],
      });
    }

    if (!isBranching(rm, nid)) {
      continue;
    }

    const edges = rm.treeEdges(nid);

    // Kantenwerte: Pflicht und eindeutig
    const values = new Map<string, number>();
    for (const edge of edges) {
      const val = edgeValue(edge);
      if (val === null) {
        findings.push({
          level: 'error',
          message: t('dmn.finding.missingEdgeValue', {
            id: rm.did(nid),
            label: String(edge.label || '?'),
          }),
          nodeIds: [nid],
        });
        continue;
      }
      values.set(val, (values.get(val) || 0) + 1);
    }

    for (const [val, count] of values.entries()) {
      if (count > 1) {
        findings.push({
          level: 'error',
          message: t('dmn.finding.duplicateEdgeValue', {
            id: rm.did(nid),
            value: val,
            count,
          }),
          nodeIds: [nid],
        });
      }
    }

    const node = rm.nodes.get(nid);
    const data = rm.d(node);
    if (nodeType === 'condition' && !(data.technicalKey || '').trim()) {
      findings.push({
        level: 'warning',
        message: t('dmn.finding.noTechnicalKey', { id: rm.did(nid) }),
        nodeIds: [nid],
      });
    }

    const expType = (data.expectedType || '').toLowerCase();
    const isBoolean =
      expType === 'boolean' ||
      expType === 'bool' ||
      (edges.length > 0 &&
        edges.every((e) => {
          const v = (edgeValue(e) || '').toLowerCase();
          return v === 'true' || v === 'false';
        }));

    if (nodeType === 'condition' && isBoolean && edges.length === 1) {
      findings.push({
        level: 'warning',
        message: t('dmn.finding.booleanSingleEdge', { id: rm.did(nid) }),
        nodeIds: [nid],
      });
    }
  }

  // Gleiches oder normalisiertes Label, abweichender oder fehlender Key
  const byNormalizedLabel = new Map<string, string[]>();
  for (const [nid] of rm.nodes) {
    if (rm.type(nid) === 'condition') {
      const norm = normalizeLabel(rm.label(nid));
      if (!byNormalizedLabel.has(norm)) {
        byNormalizedLabel.set(norm, []);
      }
      byNormalizedLabel.get(norm)!.push(nid);
    }
  }

  for (const [, ids] of byNormalizedLabel.entries()) {
    const keys = new Set(
      ids.map((n) => (rm.d(rm.nodes.get(n)).technicalKey || '').trim())
    );
    if (ids.length > 1 && (keys.size > 1 || keys.has(''))) {
      const originalLabels = Array.from(new Set(ids.map((n) => rm.label(n))));
      const idsText =
        originalLabels.length > 1
          ? ids.map((n) => `#${rm.did(n)}: „${rm.label(n)}“`).join(', ')
          : ids.map((n) => '#' + rm.did(n)).join(', ');

      findings.push({
        level: 'warning',
        message: t('dmn.finding.duplicateLabelDiffKey', {
          label: rm.label(ids[0]),
          ids: idsText,
        }),
        nodeIds: ids,
      });
    }
  }

  return { findings, decisions };
}

export function buildDmnTable(
  rm: RuleMap,
  paths: DmnPath[],
  findings: DmnFinding[],
  t: Translator = defaultTranslate
): { columns: DmnColumn[]; rows: DmnRow[] } {
  const columns = new Map<string, DmnColumn>();
  const columnValues = new Map<string, Set<string>>();

  function columnFor(nid: string): string {
    const data = rm.d(rm.nodes.get(nid));
    const key = (data.technicalKey || '').trim();
    const colKey = key || `label:${nid}`;
    if (!columns.has(colKey)) {
      const label = rm.label(nid) || `#${rm.did(nid)}`;
      const expType = (data.expectedType || '').trim().toLowerCase();
      const typeRef = TYPE_MAP[expType] || null;
      columns.set(colKey, {
        key: colKey,
        label,
        expression: key || label,
        typeRef,
        typeDerived: false,
        nodeIds: [],
        notes: [],
      });
      columnValues.set(colKey, new Set());
    }
    const col = columns.get(colKey)!;
    if (!col.nodeIds.includes(nid)) {
      col.nodeIds.push(nid);
      const note = (data.notes || '').trim();
      if (note) {
        col.notes.push(`Notiz #${rm.did(nid)}: ${note}`);
      }
    }
    return colKey;
  }

  const rows: DmnRow[] = [];
  const actionsSeen = new Set<string>();
  const consequenceNotesSeen = new Set<string>();

  for (const path of paths) {
    const cells = new Map<string, string | null>();
    const notes: string[] = [];

    for (const step of path.steps) {
      const nid = step.nodeId;
      const nodeType = rm.type(nid);
      const data = rm.d(rm.nodes.get(nid));

      if (nodeType === 'action') {
        const aNote = (data.notes || '').trim();
        const aLabel = rm.label(nid);
        if (aNote) {
          notes.push(`Aktion #${rm.did(nid)}: ${aLabel} (Notiz: ${aNote})`);
        } else {
          notes.push(`Aktion #${rm.did(nid)}: ${aLabel}`);
        }
        actionsSeen.add(nid);
      }

      if (isBranching(rm, nid)) {
        const colKey = columnFor(nid);
        const val = edgeValue(step.edge);
        if (cells.has(colKey) && cells.get(colKey) !== val) {
          findings.push({
            level: 'warning',
            message: t('dmn.finding.conflictingValues', {
              endId: rm.did(path.end),
              colLabel: columns.get(colKey)!.label,
              val1: cells.get(colKey) ?? '-',
              val2: val ?? '-',
            }),
            nodeIds: [nid],
          });
        }
        cells.set(colKey, val);
        if (val !== null) {
          columnValues.get(colKey)!.add(val);
        }
      }
    }

    const resolvedEnd = rm.resolve(path.end);
    const endLabel = resolvedEnd ? rm.label(resolvedEnd) : '?';
    const endNode = resolvedEnd ? rm.nodes.get(resolvedEnd) : undefined;
    const endNotes = (rm.d(endNode).notes || '').trim();
    if (endNotes && resolvedEnd && !consequenceNotesSeen.has(resolvedEnd)) {
      consequenceNotesSeen.add(resolvedEnd);
      notes.push(`Notiz #${rm.did(resolvedEnd)}: ${endNotes}`);
    }

    rows.push({
      cells,
      output: endLabel,
      notes,
      endId: resolvedEnd ? rm.did(resolvedEnd) : null,
    });
  }

  for (const col of columns.values()) {
    col.notes.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  }

  // Fehlender Typ: aus den Kantenwerten ableiten (deterministisch)
  for (const [colKey, col] of columns.entries()) {
    if (col.typeRef) {
      continue;
    }
    const values = columnValues.get(colKey)!;
    const valsArray = Array.from(values);
    if (valsArray.length > 0 && valsArray.every((v) => v.toLowerCase() === 'true' || v.toLowerCase() === 'false')) {
      col.typeRef = 'boolean';
    } else if (valsArray.length > 0 && valsArray.every((v) => NUMERIC.test(v))) {
      col.typeRef = 'number';
    } else {
      col.typeRef = 'string';
    }
    col.typeDerived = true;
    findings.push({
      level: 'hint',
      message: t('dmn.finding.derivedType', {
        colLabel: col.label,
        type: col.typeRef,
      }),
      nodeIds: [...col.nodeIds],
    });
  }

  const sortedActions = Array.from(actionsSeen).sort((a, b) =>
    String(rm.did(a)).localeCompare(String(rm.did(b)), undefined, { numeric: true })
  );
  for (const nid of sortedActions) {
    findings.push({
      level: 'warning',
      message: t('dmn.finding.actionInPath', { id: rm.did(nid) }),
      nodeIds: [nid],
    });
  }

  let noteCount = 0;
  for (const [nid, node] of rm.nodes.entries()) {
    const nodeType = rm.type(nid);
    if (
      nodeType &&
      !(INPUT_TYPES as readonly string[]).includes(nodeType) &&
      (rm.d(node).notes || '').trim().length > 0
    ) {
      noteCount++;
    }
  }
  if (noteCount > 0) {
    findings.push({
      level: 'hint',
      message: t('dmn.finding.notesCount', { count: noteCount }),
      nodeIds: [],
    });
  }

  return { columns: Array.from(columns.values()), rows };
}

export function validateDmn(
  nodes: Node[],
  edges: Edge[],
  meta?: Record<string, any>,
  t: Translator = defaultTranslate
): DmnFinding[] {
  const rm = new RuleMap(nodes, edges, meta);
  const { findings, decisions } = validateRuleMap(rm, t);

  if (decisions.length === 1) {
    const paths = collectPaths(rm, decisions[0], findings, t);
    buildDmnTable(rm, paths, findings, t);
  } else {
    // Trotzdem alle Pfade prüfen, damit Zyklen und offene Enden gleich mitgemeldet werden
    for (const decision of decisions) {
      collectPaths(rm, decision, findings, t);
    }
  }

  // Sort findings by level: errors first, then warnings, then hints
  const order: Record<'error' | 'warning' | 'hint', number> = {
    error: 0,
    warning: 1,
    hint: 2,
  };
  return findings.sort((a, b) => order[a.level] - order[b.level]);
}

/**
 * Erzeugt eine inhaltliche Signatur der Map.
 * Positionen, Dimensionen und Auswahlstatus von React Flow werden ignoriert,
 * sodass der DMN-Statusbereich nur verschwindet, wenn sich der fachliche Inhalt ändert.
 */
export function computeContentSignature(nodes: Node[], edges: Edge[]): string {
  const simplifiedNodes = nodes
    .map((n) => {
      const d = (n.data || {}) as any;
      return {
        id: n.id,
        nodeType: d.nodeType,
        label: d.label,
        technicalKey: d.technicalKey,
        expectedType: d.expectedType,
        notes: d.notes,
        refNodeId: d.refNodeId,
        knowledgeSources: d.knowledgeSources,
        inputProvider: d.inputProvider,
        inputProviderSubtype: d.inputProviderSubtype,
        inputVerfuegbarkeit: d.inputVerfuegbarkeit,
        consequence: d.consequence,
      };
    })
    .sort((a, b) => a.id.localeCompare(b.id));

  const simplifiedEdges = edges
    .map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      label: e.label,
      value: (e.data as any)?.value,
    }))
    .sort((a, b) => a.id.localeCompare(b.id));

  return JSON.stringify({ n: simplifiedNodes, e: simplifiedEdges });
}
