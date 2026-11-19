import type { Severity } from './validateDecisionMap';

/**
 * Strukturpruefung des Austauschdokuments gegen die Regelgruppe FMT aus
 * docs/format-spec.md.
 *
 * Diese Regeln lassen sich nur vor der Umwandlung pruefen: Im internen Modell
 * sind `inputData` und `nodes` ein Array, und `entryNodeId` existiert dort
 * nicht mehr, weil der Einstieg aus dem Graphen folgt.
 */

export interface DocumentFinding {
  ruleId: string;
  message: string;
  severity: Severity;
}

const CATEGORIES = ['validation', 'permission', 'state', 'business-logic', 'error-handling'];
const INPUT_TYPES = ['input', 'input-ref'];
const KNOWN_ROOT_FIELDS = [
  'id',
  'name',
  'description',
  'category',
  'entryNodeId',
  'validationWarnings',
  'inputData',
  'nodes',
  'testCases',
];

interface RawNode {
  id?: unknown;
  type?: unknown;
}

export function validateExportDocument(raw: unknown): DocumentFinding[] {
  const findings: DocumentFinding[] = [];
  const add = (ruleId: string, message: string, severity: Severity) =>
    findings.push({ ruleId, message, severity });

  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    add('FMT-01', 'Das Dokument ist kein Objekt.', 'error');
    return findings;
  }

  const doc = raw as Record<string, unknown>;

  // --- FMT-01: Pflichtfelder ---
  if (!('name' in doc)) add('FMT-01', 'Das Feld "name" fehlt.', 'error');
  if (!Array.isArray(doc.nodes)) add('FMT-01', 'Das Feld "nodes" fehlt oder ist kein Array.', 'error');

  // --- FMT-02: Name nicht leer ---
  if ('name' in doc) {
    if (typeof doc.name !== 'string' || doc.name.trim() === '') {
      add('FMT-02', 'Das Feld "name" muss eine nicht leere Zeichenkette sein.', 'error');
    }
  }

  // --- FMT-03: Kategorie ---
  if (doc.category !== undefined && doc.category !== null) {
    if (typeof doc.category !== 'string' || !CATEGORIES.includes(doc.category)) {
      add('FMT-03', `Unbekannte Kategorie "${String(doc.category)}". Zulässig: ${CATEGORIES.join(', ')}.`, 'error');
    }
  }

  const nodes: RawNode[] = Array.isArray(doc.nodes) ? (doc.nodes as RawNode[]) : [];
  const inputData: RawNode[] = Array.isArray(doc.inputData) ? (doc.inputData as RawNode[]) : [];

  const idOf = (n: RawNode): number | null => {
    const v = typeof n.id === 'number' ? n.id : Number(n.id);
    return Number.isFinite(v) ? v : null;
  };

  // --- FMT-06 / FMT-07: Knotentypen in der richtigen Liste ---
  for (const n of inputData) {
    const t = typeof n.type === 'string' ? n.type : '';
    if (!INPUT_TYPES.includes(t)) {
      add('FMT-06', `Knoten #${String(n.id)} steht in "inputData", ist aber vom Typ "${t}".`, 'error');
    }
  }
  for (const n of nodes) {
    const t = typeof n.type === 'string' ? n.type : '';
    if (INPUT_TYPES.includes(t)) {
      add('FMT-07', `Knoten #${String(n.id)} steht in "nodes", ist aber vom Typ "${t}".`, 'error');
    }
  }

  // --- FMT-08: IDs eindeutig ueber beide Listen ---
  const seen = new Set<number>();
  const duplicates = new Set<number>();
  for (const n of [...inputData, ...nodes]) {
    const id = idOf(n);
    if (id === null) {
      add('FMT-08', 'Ein Knoten hat keine numerische "id".', 'error');
      continue;
    }
    if (seen.has(id)) duplicates.add(id);
    seen.add(id);
  }
  for (const id of duplicates) {
    add('FMT-08', `Die ID #${id} wird mehrfach verwendet.`, 'error');
  }

  // --- FMT-04 / FMT-05: Einstiegsknoten ---
  if (doc.entryNodeId !== undefined && doc.entryNodeId !== null) {
    if (typeof doc.entryNodeId !== 'number') {
      add('FMT-04', 'Das Feld "entryNodeId" muss eine Zahl oder null sein.', 'error');
    } else {
      const inNodes = nodes.some((n) => idOf(n) === doc.entryNodeId);
      const inInputs = inputData.some((n) => idOf(n) === doc.entryNodeId);
      if (inInputs) {
        add('FMT-05', `Der Einstiegsknoten #${doc.entryNodeId} ist ein Input. Inputs können nicht Einstieg sein.`, 'error');
      } else if (!inNodes) {
        add('FMT-04', `Der Einstiegsknoten #${doc.entryNodeId} existiert nicht in "nodes".`, 'error');
      }
    }
  }

  // --- FMT-09: abgeleitete Befunde im Dokument ---
  if (doc.validationWarnings !== undefined && doc.validationWarnings !== null) {
    add(
      'FMT-09',
      'Das Dokument bringt eigene Validierungsbefunde mit. Sie werden ignoriert und neu berechnet.',
      'hint'
    );
  }

  // --- FMT-10: unbekannte Wurzelfelder ---
  const unknown = Object.keys(doc).filter((k) => !KNOWN_ROOT_FIELDS.includes(k));
  if (unknown.length > 0) {
    add('FMT-10', `Unbekannte Felder im Dokument: ${unknown.join(', ')}. Sie werden beim Import nicht übernommen (FMT-10 noch nicht umgesetzt).`, 'hint');
  }

  return findings;
}
