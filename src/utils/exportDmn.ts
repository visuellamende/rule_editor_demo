import type { Node, Edge } from '@xyflow/react';
import type { RulemapMeta } from '../types/rulemap';
import {
  RuleMap,
  validateRuleMap,
  collectPaths,
  buildDmnTable,
  feelEntry,
  feelString,
  TYPE_MAP,
  type DmnFinding,
  type DmnColumn,
  type DmnRow,
  type Translator,
} from './validateDmn';

export const DMN_NS = 'https://www.omg.org/spec/DMN/20191111/MODEL/';
export const DMNDI_NS = 'https://www.omg.org/spec/DMN/20191111/DMNDI/';
export const DC_NS = 'http://www.omg.org/spec/DMN/20180521/DC/';
export const DI_NS = 'http://www.omg.org/spec/DMN/20180521/DI/';
export const TARGET_NS = 'http://visuellamende.de/rule-editor';

export function slug(text: string | number, prefix: string): string {
  const s = String(text).replace(/[^A-Za-z0-9_]/g, '_');
  return `${prefix}_${s}`;
}

export function formatXml(xml: string): string {
  const PADDING = '  ';
  let formatted = '';
  let pad = 0;
  xml = xml.replace(/<\?xml[^>]*\?>/g, '').trim();

  const tokens = xml.split(/(<[^>]+>)/g).filter((t) => t.trim().length > 0);

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i].trim();
    if (!token) continue;

    if (token.startsWith('</')) {
      pad = Math.max(0, pad - 1);
      formatted += `${PADDING.repeat(pad)}${token}\n`;
    } else if (token.startsWith('<') && (token.endsWith('/>') || token.startsWith('<?'))) {
      formatted += `${PADDING.repeat(pad)}${token}\n`;
    } else if (token.startsWith('<')) {
      const nextToken = tokens[i + 1]?.trim();
      const afterNextToken = tokens[i + 2]?.trim();
      const tagName = token.match(/^<([^\s>]+)/)?.[1];
      if (
        tagName &&
        nextToken &&
        !nextToken.startsWith('<') &&
        afterNextToken === `</${tagName}>`
      ) {
        formatted += `${PADDING.repeat(pad)}${token}${nextToken}${afterNextToken}\n`;
        i += 2;
      } else {
        formatted += `${PADDING.repeat(pad)}${token}\n`;
        pad++;
      }
    } else {
      formatted += `${PADDING.repeat(pad)}${token}\n`;
    }
  }

  return '<?xml version="1.0" encoding="UTF-8"?>\n' + formatted.trim() + '\n';
}

// Lightweight DOM shim for headless / testing environments where `document` is undefined
interface SimpleElement {
  namespaceURI: string;
  tagName: string;
  attributes: Record<string, string>;
  children: (SimpleElement | string)[];
  setAttribute: (name: string, value: string) => void;
  appendChild: (child: SimpleElement) => void;
  textContent: string;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function serializeSimpleElement(el: SimpleElement): string {
  const attrs = Object.entries(el.attributes)
    .map(([k, v]) => ` ${k}="${escapeXml(v)}"`)
    .join('');

  if (el.children.length === 0) {
    return `<${el.tagName}${attrs} />`;
  }

  const inner = el.children
    .map((c) => (typeof c === 'string' ? escapeXml(c) : serializeSimpleElement(c)))
    .join('');

  return `<${el.tagName}${attrs}>${inner}</${el.tagName}>`;
}

interface XmlDocHelper {
  createElementNS: (ns: string, tag: string) => any;
  serialize: (root: any) => string;
}

function getXmlHelper(): XmlDocHelper {
  if (typeof document !== 'undefined' && typeof XMLSerializer !== 'undefined') {
    const doc = document.implementation.createDocument(DMN_NS, 'definitions', null);
    return {
      createElementNS: (ns: string, tag: string) => doc.createElementNS(ns, tag),
      serialize: (root: any) => new XMLSerializer().serializeToString(root),
    };
  }

  // Fallback for Node.js test environment
  return {
    createElementNS: (ns: string, tag: string) => {
      const el: SimpleElement = {
        namespaceURI: ns,
        tagName: tag,
        attributes: {},
        children: [],
        setAttribute(name, value) {
          this.attributes[name] = String(value);
        },
        appendChild(child) {
          this.children.push(child);
        },
        get textContent() {
          return this.children.join('');
        },
        set textContent(text: string) {
          this.children = [text];
        },
      };
      return el;
    },
    serialize: (root: SimpleElement) => serializeSimpleElement(root),
  };
}

export function buildDmnXml(
  rm: RuleMap,
  decisionId: string,
  columns: DmnColumn[],
  rows: DmnRow[]
): string {
  const helper = getXmlHelper();
  const mapName = rm.meta?.name || 'Rulemap';

  // Root: definitions
  const defs = helper.createElementNS(DMN_NS, 'definitions');
  defs.setAttribute('id', slug(rm.meta?.id || 'definitions', 'definitions'));
  defs.setAttribute('name', mapName);
  defs.setAttribute('namespace', TARGET_NS);
  defs.setAttribute('xmlns', DMN_NS);
  defs.setAttribute('xmlns:dmndi', DMNDI_NS);
  defs.setAttribute('xmlns:dc', DC_NS);
  defs.setAttribute('xmlns:di', DI_NS);

  if (rm.meta?.description) {
    const desc = helper.createElementNS(DMN_NS, 'description');
    desc.textContent = rm.meta.description;
    defs.appendChild(desc);
  }

  const decDid = rm.did(decisionId);
  const decElId = slug(decDid, 'Decision');
  const decision = helper.createElementNS(DMN_NS, 'decision');
  decision.setAttribute('id', decElId);
  decision.setAttribute('name', rm.label(decisionId) || mapName);
  defs.appendChild(decision);

  // Input Data IDs & Information Requirements
  const inputs: string[] = [];
  for (const [nid] of rm.nodes) {
    if (rm.type(nid) === 'input') {
      inputs.push(nid);
    }
  }

  const inputIds: Record<string, string> = {};
  const infoReqs: [string, string][] = [];
  for (const nid of inputs) {
    const elId = slug(rm.did(nid), 'InputData');
    inputIds[nid] = elId;
    const reqId = slug(rm.did(nid), 'InformationRequirement');
    const req = helper.createElementNS(DMN_NS, 'informationRequirement');
    req.setAttribute('id', reqId);
    const reqInp = helper.createElementNS(DMN_NS, 'requiredInput');
    reqInp.setAttribute('href', `#${elId}`);
    req.appendChild(reqInp);
    decision.appendChild(req);
    infoReqs.push([reqId, elId]);
  }

  // Knowledge Sources: aus allen Knoten sammeln, nach Referenz dedupliziert
  const sources = new Map<string, any>();
  for (const [, node] of rm.nodes) {
    const ksList = (rm.d(node).knowledgeSources || []) as any[];
    for (const ks of ksList) {
      const key = `${ks.art || ''}:::${(ks.referenz || '').trim()}`;
      if (!sources.has(key)) {
        sources.set(key, ks);
      }
    }
  }

  const authReqs: [string, string][] = [];
  const ksIds: Record<string, string> = {};
  let ksIndex = 1;
  for (const [key] of sources.entries()) {
    const elId = `KnowledgeSource_${ksIndex}`;
    ksIds[key] = elId;
    const reqId = `AuthorityRequirement_${ksIndex}`;
    const req = helper.createElementNS(DMN_NS, 'authorityRequirement');
    req.setAttribute('id', reqId);
    const reqAuth = helper.createElementNS(DMN_NS, 'requiredAuthority');
    reqAuth.setAttribute('href', `#${elId}`);
    req.appendChild(reqAuth);
    decision.appendChild(req);
    authReqs.push([reqId, elId]);
    ksIndex++;
  }

  // Decision Table (Hit Policy UNIQUE)
  const table = helper.createElementNS(DMN_NS, 'decisionTable');
  table.setAttribute('id', `DecisionTable_${decDid}`);
  table.setAttribute('hitPolicy', 'UNIQUE');
  decision.appendChild(table);

  columns.forEach((col, idx) => {
    const i = idx + 1;
    const inp = helper.createElementNS(DMN_NS, 'input');
    inp.setAttribute('id', `Input_${i}`);
    inp.setAttribute('label', col.label);

    const expr = helper.createElementNS(DMN_NS, 'inputExpression');
    expr.setAttribute('id', `InputExpression_${i}`);
    if (col.typeRef) {
      expr.setAttribute('typeRef', col.typeRef);
    }
    const txt = helper.createElementNS(DMN_NS, 'text');
    txt.textContent = col.expression;
    expr.appendChild(txt);

    inp.appendChild(expr);
    table.appendChild(inp);
  });

  const output = helper.createElementNS(DMN_NS, 'output');
  output.setAttribute('id', 'Output_1');
  output.setAttribute('name', 'ergebnis');
  output.setAttribute('label', 'Ergebnis');
  output.setAttribute('typeRef', 'string');

  const distinctOutputs = Array.from(new Set(rows.map((r) => r.output)));
  const ov = helper.createElementNS(DMN_NS, 'outputValues');
  ov.setAttribute('id', 'OutputValues_1');
  const ovText = helper.createElementNS(DMN_NS, 'text');
  ovText.textContent = distinctOutputs.map(feelString).join(',');
  ov.appendChild(ovText);
  output.appendChild(ov);
  table.appendChild(output);

  const annotation = helper.createElementNS(DMN_NS, 'annotation');
  annotation.setAttribute('name', 'Hinweise');
  table.appendChild(annotation);

  rows.forEach((row, rIdx) => {
    const rI = rIdx + 1;
    const rule = helper.createElementNS(DMN_NS, 'rule');
    rule.setAttribute('id', `Rule_${rI}`);

    columns.forEach((col, cIdx) => {
      const cI = cIdx + 1;
      const entry = helper.createElementNS(DMN_NS, 'inputEntry');
      entry.setAttribute('id', `InputEntry_${rI}_${cI}`);
      const entryText = helper.createElementNS(DMN_NS, 'text');
      entryText.textContent = feelEntry(row.cells.get(col.key), col.typeRef);
      entry.appendChild(entryText);
      rule.appendChild(entry);
    });

    const outEntry = helper.createElementNS(DMN_NS, 'outputEntry');
    outEntry.setAttribute('id', `OutputEntry_${rI}`);
    const outText = helper.createElementNS(DMN_NS, 'text');
    outText.textContent = feelString(row.output);
    outEntry.appendChild(outText);
    rule.appendChild(outEntry);

    const annEntry = helper.createElementNS(DMN_NS, 'annotationEntry');
    const annText = helper.createElementNS(DMN_NS, 'text');
    annText.textContent = row.notes.join(' | ');
    annEntry.appendChild(annText);
    rule.appendChild(annEntry);

    table.appendChild(rule);
  });

  // Input Data elements
  for (const nid of inputs) {
    const data = rm.d(rm.nodes.get(nid));
    const el = helper.createElementNS(DMN_NS, 'inputData');
    el.setAttribute('id', inputIds[nid]);
    el.setAttribute('name', rm.label(nid));

    const metaFields = [data.inputProvider, data.inputProviderSubtype, data.inputVerfuegbarkeit].filter(Boolean);
    if (metaFields.length > 0) {
      const dEl = helper.createElementNS(DMN_NS, 'description');
      dEl.textContent = metaFields.join(' · ');
      el.appendChild(dEl);
    }

    const vEl = helper.createElementNS(DMN_NS, 'variable');
    vEl.setAttribute('id', `${inputIds[nid]}_variable`);
    vEl.setAttribute('name', rm.label(nid));
    const expType = (data.expectedType || '').toLowerCase();
    vEl.setAttribute('typeRef', TYPE_MAP[expType] || 'string');
    el.appendChild(vEl);

    defs.appendChild(el);
  }

  // Knowledge Source elements
  for (const [key, ks] of sources.entries()) {
    const desc = [ks.verbindlichkeit, ks.eigner, ks.beschreibung].filter(Boolean);
    const el = helper.createElementNS(DMN_NS, 'knowledgeSource');
    el.setAttribute('id', ksIds[key]);
    el.setAttribute('name', ks.referenz || ks.art || 'Quelle');

    if (desc.length > 0) {
      const dEl = helper.createElementNS(DMN_NS, 'description');
      dEl.textContent = desc.join(' · ');
      el.appendChild(dEl);
    }
    if (ks.art) {
      const tEl = helper.createElementNS(DMN_NS, 'type');
      tEl.textContent = ks.art;
      el.appendChild(tEl);
    }

    defs.appendChild(el);
  }

  // DMNDI Layout
  buildDmndi(helper, defs, decElId, inputIds, infoReqs, ksIds, authReqs);

  const rawXml = helper.serialize(defs);
  return formatXml(rawXml);
}

function buildDmndi(
  helper: XmlDocHelper,
  defs: any,
  decElId: string,
  inputIds: Record<string, string>,
  infoReqs: [string, string][],
  ksIds: Record<string, string>,
  authReqs: [string, string][]
) {
  const dmndi = helper.createElementNS(DMNDI_NS, 'dmndi:DMNDI');
  defs.appendChild(dmndi);
  const diagram = helper.createElementNS(DMNDI_NS, 'dmndi:DMNDiagram');
  diagram.setAttribute('id', 'DMNDiagram_1');
  dmndi.appendChild(diagram);

  function shape(elId: string, x: number, y: number, w: number, h: number) {
    const s = helper.createElementNS(DMNDI_NS, 'dmndi:DMNShape');
    s.setAttribute('id', `DMNShape_${elId}`);
    s.setAttribute('dmnElementRef', elId);
    const b = helper.createElementNS(DC_NS, 'dc:Bounds');
    b.setAttribute('x', String(x));
    b.setAttribute('y', String(y));
    b.setAttribute('width', String(w));
    b.setAttribute('height', String(h));
    s.appendChild(b);
    diagram.appendChild(s);
  }

  function edge(reqId: string, points: [number, number][]) {
    const e = helper.createElementNS(DMNDI_NS, 'dmndi:DMNEdge');
    e.setAttribute('id', `DMNEdge_${reqId}`);
    e.setAttribute('dmnElementRef', reqId);
    for (const [x, y] of points) {
      const wp = helper.createElementNS(DI_NS, 'di:waypoint');
      wp.setAttribute('x', String(x));
      wp.setAttribute('y', String(y));
      e.appendChild(wp);
    }
    diagram.appendChild(e);
  }

  const inputValues = Object.values(inputIds);
  const nInputs = Math.max(inputValues.length, 1);
  const rowWidth = nInputs * 165;
  const decW = 180;
  const decH = 80;
  const decX = 100 + Math.floor(Math.max(rowWidth - decW, 0) / 2);
  const decY = 80;
  shape(decElId, decX, decY, decW, decH);

  const positions: Record<string, [number, number]> = {};
  inputValues.forEach((elId, i) => {
    const x = 100 + i * 165;
    const y = 280;
    shape(elId, x, y, 125, 45);
    positions[elId] = [x + 62, y];
  });

  for (const [reqId, elId] of infoReqs) {
    const [px, py] = positions[elId];
    edge(reqId, [
      [px, py],
      [decX + Math.floor(decW / 2), decY + decH],
    ]);
  }

  const ksPositions: Record<string, [number, number]> = {};
  const ksValues = Object.values(ksIds);
  ksValues.forEach((elId, i) => {
    const x = decX + decW + 120 + i * 140;
    const y = decY + 8;
    shape(elId, x, y, 100, 63);
    ksPositions[elId] = [x, y + 31];
  });

  for (const [reqId, elId] of authReqs) {
    const [px, py] = ksPositions[elId];
    edge(reqId, [
      [px, py],
      [decX + decW, decY + Math.floor(decH / 2)],
    ]);
  }
}

export interface DmnExportResult {
  success: boolean;
  xml: string | null;
  findings: DmnFinding[];
  columns: DmnColumn[];
  rows: DmnRow[];
}

export function exportDmn(
  meta: RulemapMeta,
  nodes: Node[],
  edges: Edge[],
  t?: Translator
): DmnExportResult {
  const rm = new RuleMap(nodes, edges, meta as any);
  const { findings, decisions } = validateRuleMap(rm, t);

  let columns: DmnColumn[] = [];
  let rows: DmnRow[] = [];

  if (decisions.length === 1) {
    const paths = collectPaths(rm, decisions[0], findings, t);
    const tbl = buildDmnTable(rm, paths, findings, t);
    columns = tbl.columns;
    rows = tbl.rows;
  } else {
    for (const decision of decisions) {
      collectPaths(rm, decision, findings, t);
    }
  }

  const order: Record<'error' | 'warning' | 'hint', number> = {
    error: 0,
    warning: 1,
    hint: 2,
  };
  findings.sort((a, b) => order[a.level] - order[b.level]);

  const hasErrors = findings.some((f) => f.level === 'error');
  if (hasErrors || decisions.length !== 1) {
    return {
      success: false,
      xml: null,
      findings,
      columns: [],
      rows: [],
    };
  }

  const xml = buildDmnXml(rm, decisions[0], columns, rows);
  return {
    success: true,
    xml,
    findings,
    columns,
    rows,
  };
}
