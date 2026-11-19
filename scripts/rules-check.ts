/**
 * Prueft die Regeln aus docs/format-spec.md gegen kleine Decision Maps, die
 * jeweils genau einen Verstoss enthalten.
 *
 * Aufruf: npm run check-rules
 */
import type { Node, Edge } from '@xyflow/react';
import { validateDecisionMap } from '../src/utils/validateDecisionMap';
import { validateExportDocument } from '../src/utils/validateExportDocument';
import type { RuleNodeData } from '../src/types/nodes';

type Extra = Partial<RuleNodeData>;

function node(id: number, nodeType: RuleNodeData['nodeType'], label: string, extra: Extra = {}): Node {
  const data: RuleNodeData = { displayId: id, label, nodeType, ...extra } as RuleNodeData;
  return { id: `n${id}`, type: 'ruleNode', position: { x: 0, y: 0 }, data: data as unknown as Record<string, unknown> };
}

function edge(from: number, to: number, label?: string, value?: string): Edge {
  return {
    id: `e${from}-${to}-${label ?? ''}`,
    source: `n${from}`,
    target: `n${to}`,
    type: 'labeled',
    ...(label ? { label } : {}),
    ...(value ? { data: { value } } : {}),
  };
}

const end = (id: number, business = 'Fachliche Folge.') =>
  node(id, 'consequence', 'Endpunkt', { consequence: { business } });

interface Case {
  name: string;
  expect: string[];                 // diese Regel-IDs MUESSEN feuern
  forbid?: string[];                // diese Regel-IDs duerfen NICHT feuern
  nodes?: Node[];
  edges?: Edge[];
  doc?: unknown;                    // statt nodes/edges: Austauschdokument fuer FMT
}

/** Minimale, in jeder Hinsicht korrekte Map als Basis fuer forbid-Pruefungen. */
function cleanMap(): { nodes: Node[]; edges: Edge[] } {
  return {
    nodes: [
      node(1, 'decision', 'Welche Folge tritt ein?'),
      node(2, 'condition', 'Bedingung?', { technicalKey: 'flag', expectedType: 'boolean' }),
      end(3, 'Folge A.'),
      end(4, 'Folge B.'),
      node(5, 'input', 'Flag', {
        technicalKey: 'flag',
        expectedType: 'boolean',
        inputProvider: 'system',
        inputVerfuegbarkeit: 'vorhanden',
        inputKannScheitern: false,
      }),
    ],
    edges: [edge(1, 2), edge(2, 3, 'Ja', 'true'), edge(2, 4, 'Nein', 'false'), edge(5, 2)],
  };
}

const cases: Case[] = [
  {
    name: 'saubere Map erzeugt keine Befunde',
    expect: [],
    forbid: ['NODE-03', 'NODE-04', 'NODE-06', 'EDGE-02', 'EDGE-03', 'EDGE-05', 'CONS-02', 'CONS-05', 'CONS-07', 'NODE-10'],
    ...cleanMap(),
  },
  {
    name: 'EDGE-01: Kante auf nicht existierendes Ziel',
    expect: ['EDGE-01'],
    nodes: [node(1, 'decision', 'Start'), end(2)],
    edges: [edge(1, 2), edge(1, 99)],
  },
  {
    name: 'EDGE-03: Mehrfachverzweigung ohne Wert',
    expect: ['EDGE-03'],
    nodes: [node(1, 'condition', 'Welcher Fall?', { technicalKey: 'k' }), end(2), end(3, 'Andere Folge.')],
    edges: [edge(1, 2, 'A'), edge(1, 3, 'B')],
  },
  {
    name: 'EDGE-04: Wert doppelt an einem Knoten',
    expect: ['EDGE-04'],
    nodes: [node(1, 'condition', 'Welcher Fall?', { technicalKey: 'k' }), end(2), end(3, 'Andere Folge.')],
    edges: [edge(1, 2, 'A', 'x'), edge(1, 3, 'B', 'x')],
  },
  {
    name: 'NODE-05: Endpunkt mit Ausgang',
    expect: ['NODE-05'],
    nodes: [node(1, 'decision', 'Start'), end(2), end(3, 'Andere Folge.')],
    edges: [edge(1, 2), edge(2, 3)],
  },
  {
    name: 'NODE-08: Action verzweigt',
    expect: ['NODE-08'],
    nodes: [
      node(1, 'decision', 'Start'),
      node(2, 'action', 'Wert bestimmen', { technicalKey: 'q', expectedType: 'number' }),
      end(3),
      end(4, 'Andere Folge.'),
    ],
    edges: [edge(1, 2), edge(2, 3, 'A', 'a'), edge(2, 4, 'B', 'b')],
  },
  {
    name: 'NODE-09: Action ohne Schluessel und Typ',
    expect: ['NODE-09'],
    nodes: [node(1, 'decision', 'Start'), node(2, 'action', 'Irgendwas tun'), end(3)],
    edges: [edge(1, 2), edge(2, 3)],
  },
  {
    name: 'NODE-10: Zyklus',
    expect: ['NODE-10'],
    nodes: [
      node(1, 'decision', 'Start'),
      node(2, 'condition', 'A?', { technicalKey: 'a' }),
      node(3, 'condition', 'B?', { technicalKey: 'b' }),
      end(4),
    ],
    edges: [edge(1, 2), edge(2, 3), edge(3, 2), edge(3, 4)],
  },
  {
    name: 'NODE-10: als Ruecksprung gekennzeichneter Zyklus ist erlaubt',
    expect: [],
    forbid: ['NODE-10'],
    nodes: [
      node(1, 'decision', 'Start'),
      node(2, 'condition', 'A?', { technicalKey: 'a' }),
      node(3, 'condition', 'B?', { technicalKey: 'b' }),
      end(4),
    ],
    edges: [
      edge(1, 2),
      edge(2, 3),
      { id: 'back', source: 'n3', target: 'n2', type: 'labeled', label: 'nochmal', data: { edgeType: 'loop-back', value: 'again' } },
      edge(3, 4, 'fertig', 'done'),
    ],
  },
  {
    name: 'REF-01: Referenz ohne Ziel',
    expect: ['REF-01'],
    nodes: [node(1, 'decision', 'Start'), end(2), node(3, 'consequence-ref', '')],
    edges: [edge(1, 2), edge(1, 3)],
  },
  {
    name: 'REF-04: Referenz auf Referenz',
    expect: ['REF-04'],
    nodes: [
      node(1, 'decision', 'Start'),
      end(2),
      node(3, 'consequence-ref', '', { refNodeId: 2 }),
      node(4, 'consequence-ref', '', { refNodeId: 3 }),
    ],
    edges: [edge(1, 2, 'a', 'a'), edge(1, 3, 'b', 'b'), edge(1, 4, 'c', 'c')],
  },
  {
    name: 'CONS-05: kein Endpunkt',
    expect: ['CONS-05'],
    nodes: [node(1, 'decision', 'Start'), node(2, 'condition', 'A?', { technicalKey: 'a' })],
    edges: [edge(1, 2)],
  },
  {
    name: 'CONS-06: zwei Endpunkte mit demselben Text',
    expect: ['CONS-06'],
    nodes: [node(1, 'decision', 'Start'), end(2, 'Gleiche Folge.'), end(3, 'Gleiche Folge.')],
    edges: [edge(1, 2, 'a', 'a'), edge(1, 3, 'b', 'b')],
  },
  {
    name: 'CONS-07: Weg ohne Endpunkt (gefangen im Zyklus)',
    expect: ['CONS-07'],
    nodes: [
      node(1, 'decision', 'Start'),
      node(2, 'condition', 'A?', { technicalKey: 'a' }),
      node(3, 'condition', 'B?', { technicalKey: 'b' }),
      end(4),
    ],
    edges: [edge(1, 2, 'hin', 'h'), edge(1, 4, 'fertig', 'f'), edge(2, 3), edge(3, 2)],
  },
  {
    name: 'IN-02: Input mit zwei Ausgaengen',
    expect: ['IN-02'],
    nodes: [
      node(1, 'decision', 'Start'),
      node(2, 'condition', 'A?', { technicalKey: 'a' }),
      node(3, 'condition', 'B?', { technicalKey: 'a' }),
      end(4),
      node(5, 'input', 'A', { technicalKey: 'a', inputProvider: 'system' }),
    ],
    edges: [edge(1, 2), edge(2, 4, 'x', 'x'), edge(3, 4, 'y', 'y'), edge(5, 2), edge(5, 3)],
  },
  {
    name: 'IN-03: Input zeigt auf einen Endpunkt',
    expect: ['IN-03'],
    nodes: [
      node(1, 'decision', 'Start'),
      end(2),
      node(3, 'input', 'A', { technicalKey: 'a', inputProvider: 'system' }),
    ],
    edges: [edge(1, 2), edge(3, 2)],
  },
  {
    name: 'IN-05: unbekannte Datenherkunft',
    expect: ['IN-05'],
    nodes: [
      node(1, 'decision', 'Start'),
      node(2, 'condition', 'A?', { technicalKey: 'a' }),
      end(3),
      node(4, 'input', 'A', { technicalKey: 'a', inputProvider: 'erfunden' as RuleNodeData['inputProvider'] }),
    ],
    edges: [edge(1, 2), edge(2, 3), edge(4, 2)],
  },
  {
    name: 'IN-06: komposition ohne benannte Entscheidung',
    expect: ['IN-06'],
    nodes: [
      node(1, 'decision', 'Start'),
      node(2, 'condition', 'A?', { technicalKey: 'a' }),
      end(3),
      node(4, 'input', 'A', { technicalKey: 'a', inputProvider: 'komposition' }),
    ],
    edges: [edge(1, 2), edge(2, 3), edge(4, 2)],
  },
  {
    name: 'IN-07: Input kann scheitern',
    expect: ['IN-07'],
    nodes: [
      node(1, 'decision', 'Start'),
      node(2, 'condition', 'A?', { technicalKey: 'a' }),
      end(3),
      node(4, 'input', 'A', { technicalKey: 'a', inputProvider: 'system', inputKannScheitern: true }),
    ],
    edges: [edge(1, 2), edge(2, 3), edge(4, 2)],
  },
  {
    name: 'IN-08: technischer Schluessel doppelt belegt',
    expect: ['IN-08'],
    nodes: [
      node(1, 'decision', 'Start'),
      node(2, 'condition', 'A?', { technicalKey: 'a' }),
      end(3),
      node(4, 'input', 'A', { technicalKey: 'a', inputProvider: 'system' }),
      node(5, 'input', 'A nochmal', { technicalKey: 'a', inputProvider: 'system' }),
    ],
    edges: [edge(1, 2), edge(2, 3), edge(4, 2), edge(5, 2)],
  },
  {
    name: 'IN-09: Input und Bedingung mit verschiedenen Schluesseln',
    expect: ['IN-09'],
    nodes: [
      node(1, 'decision', 'Start'),
      node(2, 'condition', 'A?', { technicalKey: 'b' }),
      end(3),
      node(4, 'input', 'A', { technicalKey: 'a', inputProvider: 'system' }),
    ],
    edges: [edge(1, 2), edge(2, 3), edge(4, 2)],
  },
  {
    name: 'KS-01: Wissensquelle mit unbekannter Art',
    expect: ['KS-01'],
    nodes: [
      node(1, 'decision', 'Start', {
        knowledgeSources: [
          { id: 'k1', art: 'erfunden', verbindlichkeit: 'verbindlich', referenz: '§ 1', eigner: null, beschreibung: null } as never,
        ],
      }),
      end(2),
    ],
    edges: [edge(1, 2)],
  },
  {
    name: 'TC-04 und TC-05: Testfall ohne Namen, anderer Endpunkt ungetestet',
    expect: ['TC-04', 'TC-05'],
    nodes: [
      node(1, 'decision', 'Start'),
      node(2, 'consequence', 'Endpunkt', {
        consequence: { business: 'Folge A.' },
        examples: [{ id: 'x', name: '', inputs: {}, expectedResult: 'Folge A.' }],
      }),
      end(3, 'Folge B.'),
    ],
    edges: [edge(1, 2, 'a', 'a'), edge(1, 3, 'b', 'b')],
  },
  {
    name: 'TC-02: Testfall nutzt unbekannten Schluessel',
    expect: ['TC-02'],
    nodes: [
      node(1, 'decision', 'Start'),
      node(2, 'consequence', 'Endpunkt', {
        consequence: { business: 'Folge A.' },
        examples: [{ id: 'x', name: 'Fall', inputs: { gibtsNicht: 'true' }, expectedResult: 'Folge A.' }],
      }),
    ],
    edges: [edge(1, 2)],
  },
  {
    name: 'IN-10: Aufzählungstyp ohne Wertebereich',
    expect: ['IN-10'],
    forbid: ['EDGE-08', 'EDGE-09'],
    nodes: [
      node(1, 'decision', 'Start'),
      node(2, 'condition', 'Welcher Fall?', { technicalKey: 'k', expectedType: 'enum' }),
      end(3),
      end(4, 'Folge B.'),
    ],
    edges: [edge(1, 2), edge(2, 3, 'A', 'a'), edge(2, 4, 'B', 'b')],
  },
  {
    name: 'IN-11: Wert im Wertebereich doppelt',
    expect: ['IN-11'],
    nodes: [
      node(1, 'decision', 'Start'),
      node(2, 'condition', 'Welcher Fall?', {
        technicalKey: 'k',
        expectedType: 'enum',
        allowedValues: [{ value: 'a' }, { value: 'a' }],
      }),
      end(3),
    ],
    edges: [edge(1, 2), edge(2, 3)],
  },
  {
    name: 'EDGE-08: zulässiger Wert ohne Verzweigung',
    expect: ['EDGE-08'],
    nodes: [
      node(1, 'decision', 'Start'),
      node(2, 'condition', 'Welcher Fall?', {
        technicalKey: 'k',
        expectedType: 'enum',
        allowedValues: [{ value: 'a' }, { value: 'b' }, { value: 'c' }],
      }),
      end(3),
      end(4, 'Folge B.'),
    ],
    edges: [edge(1, 2), edge(2, 3, 'A', 'a'), edge(2, 4, 'B', 'b')],
  },
  {
    name: 'EDGE-09: Verzweigung über einen unbekannten Wert',
    expect: ['EDGE-09'],
    nodes: [
      node(1, 'decision', 'Start'),
      node(2, 'condition', 'Welcher Fall?', {
        technicalKey: 'k',
        expectedType: 'enum',
        allowedValues: [{ value: 'a' }, { value: 'b' }],
      }),
      end(3),
      end(4, 'Folge B.'),
    ],
    edges: [edge(1, 2), edge(2, 3, 'A', 'a'), edge(2, 4, 'Z', 'z')],
  },
  {
    name: 'Wertebereich am Input wird von der Bedingung geerbt',
    expect: [],
    forbid: ['IN-10', 'EDGE-08', 'EDGE-09'],
    nodes: [
      node(1, 'decision', 'Start'),
      node(2, 'condition', 'Welcher Fall?', { technicalKey: 'k', expectedType: 'enum' }),
      end(3),
      end(4, 'Folge B.'),
      node(5, 'input', 'K', {
        technicalKey: 'k',
        expectedType: 'enum',
        allowedValues: [{ value: 'a' }, { value: 'b' }],
        inputProvider: 'system',
      }),
    ],
    edges: [edge(1, 2), edge(2, 3, 'A', 'a'), edge(2, 4, 'B', 'b'), edge(5, 2)],
  },
  // --- Austauschdokument, Gruppe FMT ---
  {
    name: 'FMT-02: leerer Name',
    expect: ['FMT-02'],
    doc: { name: '  ', entryNodeId: 1, nodes: [{ id: 1, type: 'decision' }], inputData: [] },
  },
  {
    name: 'FMT-03: unbekannte Kategorie',
    expect: ['FMT-03'],
    doc: { name: 'M', category: 'erfunden', entryNodeId: 1, nodes: [{ id: 1, type: 'decision' }], inputData: [] },
  },
  {
    name: 'FMT-04: Einstiegsknoten existiert nicht',
    expect: ['FMT-04'],
    doc: { name: 'M', entryNodeId: 99, nodes: [{ id: 1, type: 'decision' }], inputData: [] },
  },
  {
    name: 'FMT-05: Einstiegsknoten ist ein Input',
    expect: ['FMT-05'],
    doc: { name: 'M', entryNodeId: 2, nodes: [{ id: 1, type: 'decision' }], inputData: [{ id: 2, type: 'input' }] },
  },
  {
    name: 'FMT-06: Nicht-Input in inputData',
    expect: ['FMT-06'],
    doc: { name: 'M', entryNodeId: 1, nodes: [{ id: 1, type: 'decision' }], inputData: [{ id: 2, type: 'condition' }] },
  },
  {
    name: 'FMT-07: Input in nodes',
    expect: ['FMT-07'],
    doc: { name: 'M', entryNodeId: 1, nodes: [{ id: 1, type: 'decision' }, { id: 2, type: 'input' }], inputData: [] },
  },
  {
    name: 'FMT-08: ID doppelt',
    expect: ['FMT-08'],
    doc: { name: 'M', entryNodeId: 1, nodes: [{ id: 1, type: 'decision' }], inputData: [{ id: 1, type: 'input' }] },
  },
  {
    name: 'FMT-09: mitgebrachte Befunde',
    expect: ['FMT-09'],
    doc: {
      name: 'M',
      entryNodeId: 1,
      validationWarnings: [{ nodeId: 1, type: 'x', message: 'y', severity: 'error' }],
      nodes: [{ id: 1, type: 'decision' }],
      inputData: [],
    },
  },
  {
    name: 'FMT-10: unbekanntes Wurzelfeld',
    expect: ['FMT-10'],
    doc: { name: 'M', entryNodeId: 1, nodes: [{ id: 1, type: 'decision' }], inputData: [], extraFeld: 1 },
  },
];

let failed = 0;
let passed = 0;

console.log('--- Regelpruefung gegen docs/format-spec.md ---\n');

for (const c of cases) {
  const found = c.doc !== undefined
    ? validateExportDocument(c.doc).map((f) => f.ruleId)
    : validateDecisionMap(c.nodes ?? [], c.edges ?? []).map((w) => w.ruleId);

  const missing = c.expect.filter((r) => !found.includes(r));
  const forbidden = (c.forbid ?? []).filter((r) => found.includes(r));

  if (missing.length === 0 && forbidden.length === 0) {
    passed++;
    console.log(`  ok    ${c.name}`);
  } else {
    failed++;
    console.log(`  FEHL  ${c.name}`);
    if (missing.length > 0) console.log(`        erwartet, aber nicht gemeldet: ${missing.join(', ')}`);
    if (forbidden.length > 0) console.log(`        gemeldet, aber unerwuenscht: ${forbidden.join(', ')}`);
    console.log(`        tatsaechlich: ${found.length > 0 ? [...new Set(found)].join(', ') : '(nichts)'}`);
  }
}

console.log(`\n${passed} bestanden, ${failed} fehlgeschlagen.`);
if (failed > 0) process.exitCode = 1;
