/**
 * Eine Teilsprache von FEEL (Friendly Enough Expression Language, DMN 1.3).
 *
 * Umfang und Begruendung stehen in docs/format-spec.md, Abschnitt 10.4.
 * Kurz: alles, was eine Rechtsfolge rechnet — Arithmetik, Vergleiche, Logik,
 * Bereiche, Bedingungen und eine Handvoll Funktionen. Nicht enthalten sind
 * Kontexte, Listenkomprehensionen, Schleifen und Funktionsdefinitionen.
 *
 * FEEL und keine andere Sprache, weil der DMN-Export schon FEEL erzeugt und
 * gaengige Entscheidungsmaschinen sie unmittelbar ausfuehren.
 */

export type FeelValue = number | string | boolean | null | FeelValue[];

export interface FeelError {
  message: string;
  position: number;
}

// ----------------------------------------------------------------- Tokenizer

type TokenType = 'number' | 'string' | 'name' | 'op' | 'eof';

interface Token {
  type: TokenType;
  value: string;
  position: number;
}

const KEYWORDS = ['and', 'or', 'not', 'if', 'then', 'else', 'in', 'true', 'false', 'null'];

const OPERATORS = ['**', '<=', '>=', '!=', '..', '+', '-', '*', '/', '=', '<', '>', '(', ')', '[', ']', ','];

class FeelSyntaxError extends Error {
  position: number;
  constructor(message: string, position: number) {
    super(message);
    this.position = position;
  }
}

function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;

  while (i < input.length) {
    const c = input[i];

    if (/\s/.test(c)) {
      i++;
      continue;
    }

    // Zeichenkette
    if (c === '"') {
      let j = i + 1;
      let value = '';
      while (j < input.length && input[j] !== '"') {
        if (input[j] === '\\' && j + 1 < input.length) {
          value += input[j + 1];
          j += 2;
          continue;
        }
        value += input[j];
        j++;
      }
      if (j >= input.length) throw new FeelSyntaxError('Zeichenkette ohne schließendes Anführungszeichen', i);
      tokens.push({ type: 'string', value, position: i });
      i = j + 1;
      continue;
    }

    // Zahl
    if (/[0-9]/.test(c)) {
      let j = i;
      while (j < input.length && /[0-9]/.test(input[j])) j++;
      // Ein Punkt gehoert nur dann zur Zahl, wenn kein zweiter folgt ("..").
      if (input[j] === '.' && input[j + 1] !== '.') {
        j++;
        while (j < input.length && /[0-9]/.test(input[j])) j++;
      }
      tokens.push({ type: 'number', value: input.slice(i, j), position: i });
      i = j;
      continue;
    }

    // Name oder Schluesselwort
    if (/[A-Za-z_]/.test(c)) {
      let j = i;
      while (j < input.length && /[A-Za-z0-9_]/.test(input[j])) j++;
      tokens.push({ type: 'name', value: input.slice(i, j), position: i });
      i = j;
      continue;
    }

    const op = OPERATORS.find((o) => input.startsWith(o, i));
    if (op) {
      tokens.push({ type: 'op', value: op, position: i });
      i += op.length;
      continue;
    }

    throw new FeelSyntaxError(`Unerwartetes Zeichen "${c}"`, i);
  }

  tokens.push({ type: 'eof', value: '', position: input.length });
  return tokens;
}

// -------------------------------------------------------------------- Syntax

export type FeelNode =
  | { kind: 'number'; value: number }
  | { kind: 'string'; value: string }
  | { kind: 'boolean'; value: boolean }
  | { kind: 'null' }
  | { kind: 'name'; name: string; position: number }
  | { kind: 'unary'; op: '-' | 'not'; operand: FeelNode }
  | { kind: 'binary'; op: string; left: FeelNode; right: FeelNode }
  | { kind: 'if'; condition: FeelNode; then: FeelNode; else: FeelNode }
  | { kind: 'in'; value: FeelNode; range: RangeNode | { kind: 'list'; items: FeelNode[] } }
  | { kind: 'call'; name: string; args: FeelNode[]; position: number };

interface RangeNode {
  kind: 'range';
  from: FeelNode;
  to: FeelNode;
  fromInclusive: boolean;
  toInclusive: boolean;
}

/** Funktionen der Teilsprache: Name auf erwartete Stelligkeit. */
export const FUNCTIONS: Record<string, { min: number; max: number }> = {
  abs: { min: 1, max: 1 },
  ceiling: { min: 1, max: 1 },
  floor: { min: 1, max: 1 },
  round: { min: 1, max: 2 },
  min: { min: 1, max: Infinity },
  max: { min: 1, max: Infinity },
  sum: { min: 1, max: Infinity },
  count: { min: 1, max: Infinity },
  contains: { min: 2, max: 2 },
  'starts with': { min: 2, max: 2 },
  'string length': { min: 1, max: 1 },
  upper: { min: 1, max: 1 },
  lower: { min: 1, max: 1 },
};

class Parser {
  private tokens: Token[];
  private pos = 0;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  private peek(): Token {
    return this.tokens[this.pos];
  }

  private next(): Token {
    return this.tokens[this.pos++];
  }

  private expectOp(op: string): Token {
    const t = this.peek();
    if (t.type === 'op' && t.value === op) return this.next();
    throw new FeelSyntaxError(`"${op}" erwartet`, t.position);
  }

  private atOp(op: string): boolean {
    const t = this.peek();
    return t.type === 'op' && t.value === op;
  }

  private atName(name: string): boolean {
    const t = this.peek();
    return t.type === 'name' && t.value === name;
  }

  parse(): FeelNode {
    const node = this.parseExpression();
    if (this.peek().type !== 'eof') {
      throw new FeelSyntaxError('Unerwarteter Rest nach dem Ausdruck', this.peek().position);
    }
    return node;
  }

  private parseExpression(): FeelNode {
    if (this.atName('if')) return this.parseIf();
    return this.parseOr();
  }

  private parseIf(): FeelNode {
    this.next(); // if
    const condition = this.parseExpression();
    if (!this.atName('then')) throw new FeelSyntaxError('"then" erwartet', this.peek().position);
    this.next();
    const thenBranch = this.parseExpression();
    if (!this.atName('else')) throw new FeelSyntaxError('"else" erwartet', this.peek().position);
    this.next();
    const elseBranch = this.parseExpression();
    return { kind: 'if', condition, then: thenBranch, else: elseBranch };
  }

  private parseOr(): FeelNode {
    let left = this.parseAnd();
    while (this.atName('or')) {
      this.next();
      left = { kind: 'binary', op: 'or', left, right: this.parseAnd() };
    }
    return left;
  }

  private parseAnd(): FeelNode {
    let left = this.parseComparison();
    while (this.atName('and')) {
      this.next();
      left = { kind: 'binary', op: 'and', left, right: this.parseComparison() };
    }
    return left;
  }

  private parseComparison(): FeelNode {
    const left = this.parseAdditive();

    if (this.atName('in')) {
      this.next();
      return { kind: 'in', value: left, range: this.parseRangeOrList() };
    }

    for (const op of ['<=', '>=', '!=', '=', '<', '>']) {
      if (this.atOp(op)) {
        this.next();
        return { kind: 'binary', op, left, right: this.parseAdditive() };
      }
    }
    return left;
  }

  private parseRangeOrList(): RangeNode | { kind: 'list'; items: FeelNode[] } {
    const open = this.peek();
    const fromInclusive = open.type === 'op' && open.value === '[';
    if (!(open.type === 'op' && (open.value === '[' || open.value === '('))) {
      throw new FeelSyntaxError('"[" oder "(" nach "in" erwartet', open.position);
    }
    this.next();

    const first = this.parseAdditive();

    // Bereich: a .. b
    if (this.atOp('..')) {
      this.next();
      const to = this.parseAdditive();
      const close = this.peek();
      if (!(close.type === 'op' && (close.value === ']' || close.value === ')'))) {
        throw new FeelSyntaxError('"]" oder ")" erwartet', close.position);
      }
      this.next();
      return { kind: 'range', from: first, to, fromInclusive, toInclusive: close.value === ']' };
    }

    // Liste: a, b, c
    const items = [first];
    while (this.atOp(',')) {
      this.next();
      items.push(this.parseAdditive());
    }
    const close = this.peek();
    if (!(close.type === 'op' && (close.value === ']' || close.value === ')'))) {
      throw new FeelSyntaxError('"]" oder ")" erwartet', close.position);
    }
    this.next();
    return { kind: 'list', items };
  }

  private parseAdditive(): FeelNode {
    let left = this.parseMultiplicative();
    while (this.atOp('+') || this.atOp('-')) {
      const op = this.next().value;
      left = { kind: 'binary', op, left, right: this.parseMultiplicative() };
    }
    return left;
  }

  private parseMultiplicative(): FeelNode {
    let left = this.parsePower();
    while (this.atOp('*') || this.atOp('/')) {
      const op = this.next().value;
      left = { kind: 'binary', op, left, right: this.parsePower() };
    }
    return left;
  }

  private parsePower(): FeelNode {
    const left = this.parseUnary();
    if (this.atOp('**')) {
      this.next();
      return { kind: 'binary', op: '**', left, right: this.parsePower() };
    }
    return left;
  }

  private parseUnary(): FeelNode {
    if (this.atOp('-')) {
      this.next();
      return { kind: 'unary', op: '-', operand: this.parseUnary() };
    }
    return this.parsePrimary();
  }

  private parsePrimary(): FeelNode {
    const t = this.peek();

    if (t.type === 'number') {
      this.next();
      return { kind: 'number', value: Number(t.value) };
    }
    if (t.type === 'string') {
      this.next();
      return { kind: 'string', value: t.value };
    }
    if (t.type === 'op' && t.value === '(') {
      this.next();
      const inner = this.parseExpression();
      this.expectOp(')');
      return inner;
    }
    if (t.type === 'name') {
      if (t.value === 'true' || t.value === 'false') {
        this.next();
        return { kind: 'boolean', value: t.value === 'true' };
      }
      if (t.value === 'null') {
        this.next();
        return { kind: 'null' };
      }
      if (t.value === 'not') {
        this.next();
        this.expectOp('(');
        const operand = this.parseExpression();
        this.expectOp(')');
        return { kind: 'unary', op: 'not', operand };
      }
      if (KEYWORDS.includes(t.value)) {
        throw new FeelSyntaxError(`"${t.value}" steht hier unerwartet`, t.position);
      }

      // Funktionsnamen mit Leerzeichen, z. B. "string length"
      let name = t.value;
      let position = t.position;
      let lookahead = 1;
      while (this.tokens[this.pos + lookahead]?.type === 'name') {
        const combined = `${name} ${this.tokens[this.pos + lookahead].value}`;
        if (!Object.keys(FUNCTIONS).some((f) => f === combined || f.startsWith(`${combined} `))) break;
        name = combined;
        lookahead++;
      }

      if (this.tokens[this.pos + lookahead]?.type === 'op' && this.tokens[this.pos + lookahead].value === '(') {
        this.pos += lookahead + 1;
        const args: FeelNode[] = [];
        if (!this.atOp(')')) {
          args.push(this.parseExpression());
          while (this.atOp(',')) {
            this.next();
            args.push(this.parseExpression());
          }
        }
        this.expectOp(')');
        return { kind: 'call', name, args, position };
      }

      this.next();
      position = t.position;
      return { kind: 'name', name: t.value, position };
    }

    throw new FeelSyntaxError('Ausdruck erwartet', t.position);
  }
}

export interface ParseResult {
  ok: boolean;
  node?: FeelNode;
  error?: FeelError;
}

export function parseFeel(source: string): ParseResult {
  try {
    const node = new Parser(tokenize(source)).parse();
    return { ok: true, node };
  } catch (e) {
    if (e instanceof FeelSyntaxError) {
      return { ok: false, error: { message: e.message, position: e.position } };
    }
    return { ok: false, error: { message: String(e), position: 0 } };
  }
}

/** Alle freien Namen eines Ausdrucks — die Werte, die er von aussen braucht. */
export function collectNames(node: FeelNode, out: Set<string> = new Set()): Set<string> {
  switch (node.kind) {
    case 'name':
      out.add(node.name);
      break;
    case 'unary':
      collectNames(node.operand, out);
      break;
    case 'binary':
      collectNames(node.left, out);
      collectNames(node.right, out);
      break;
    case 'if':
      collectNames(node.condition, out);
      collectNames(node.then, out);
      collectNames(node.else, out);
      break;
    case 'in':
      collectNames(node.value, out);
      if (node.range.kind === 'range') {
        collectNames(node.range.from, out);
        collectNames(node.range.to, out);
      } else {
        node.range.items.forEach((item) => collectNames(item, out));
      }
      break;
    case 'call':
      node.args.forEach((a) => collectNames(a, out));
      break;
    default:
      break;
  }
  return out;
}

/** Funktionsaufrufe, die die Teilsprache nicht kennt oder falsch bestückt sind. */
export function collectCallProblems(node: FeelNode, out: string[] = []): string[] {
  switch (node.kind) {
    case 'call': {
      const spec = FUNCTIONS[node.name];
      if (!spec) {
        out.push(`unbekannte Funktion "${node.name}"`);
      } else if (node.args.length < spec.min || node.args.length > spec.max) {
        const erwartet = spec.max === Infinity ? `mindestens ${spec.min}` : `${spec.min} bis ${spec.max}`;
        out.push(`"${node.name}" erwartet ${erwartet} Argument(e), bekommt ${node.args.length}`);
      }
      node.args.forEach((a) => collectCallProblems(a, out));
      break;
    }
    case 'unary':
      collectCallProblems(node.operand, out);
      break;
    case 'binary':
      collectCallProblems(node.left, out);
      collectCallProblems(node.right, out);
      break;
    case 'if':
      collectCallProblems(node.condition, out);
      collectCallProblems(node.then, out);
      collectCallProblems(node.else, out);
      break;
    case 'in':
      collectCallProblems(node.value, out);
      if (node.range.kind === 'range') {
        collectCallProblems(node.range.from, out);
        collectCallProblems(node.range.to, out);
      } else {
        node.range.items.forEach((item) => collectCallProblems(item, out));
      }
      break;
    default:
      break;
  }
  return out;
}

// ---------------------------------------------------------------- Auswertung

export interface EvalResult {
  ok: boolean;
  value?: FeelValue;
  error?: string;
}

const asNumber = (v: FeelValue, where: string): number => {
  if (typeof v === 'number') return v;
  throw new Error(`${where} erwartet eine Zahl, bekommt ${describe(v)}`);
};

function describe(v: FeelValue): string {
  if (v === null) return 'null';
  if (Array.isArray(v)) return 'eine Liste';
  if (typeof v === 'string') return `"${v}"`;
  return String(v);
}

function flatten(values: FeelValue[]): FeelValue[] {
  return values.flatMap((v) => (Array.isArray(v) ? flatten(v) : [v]));
}

function callFunction(name: string, args: FeelValue[]): FeelValue {
  const nums = () => flatten(args).map((a) => asNumber(a, `"${name}"`));
  switch (name) {
    case 'abs':
      return Math.abs(asNumber(args[0], '"abs"'));
    case 'ceiling':
      return Math.ceil(asNumber(args[0], '"ceiling"'));
    case 'floor':
      return Math.floor(asNumber(args[0], '"floor"'));
    case 'round': {
      const value = asNumber(args[0], '"round"');
      const scale = args.length > 1 ? asNumber(args[1], '"round"') : 0;
      const factor = 10 ** scale;
      return Math.round(value * factor) / factor;
    }
    case 'min':
      return Math.min(...nums());
    case 'max':
      return Math.max(...nums());
    case 'sum':
      return nums().reduce((a, b) => a + b, 0);
    case 'count':
      return flatten(args).length;
    case 'contains':
      return String(args[0]).includes(String(args[1]));
    case 'starts with':
      return String(args[0]).startsWith(String(args[1]));
    case 'string length':
      return String(args[0]).length;
    case 'upper':
      return String(args[0]).toUpperCase();
    case 'lower':
      return String(args[0]).toLowerCase();
    default:
      throw new Error(`unbekannte Funktion "${name}"`);
  }
}

function evalNode(node: FeelNode, context: Record<string, FeelValue>): FeelValue {
  switch (node.kind) {
    case 'number':
    case 'string':
    case 'boolean':
      return node.value;
    case 'null':
      return null;

    case 'name':
      if (!(node.name in context)) throw new Error(`"${node.name}" ist nicht belegt`);
      return context[node.name];

    case 'unary':
      if (node.op === '-') return -asNumber(evalNode(node.operand, context), '"-"');
      return !truthy(evalNode(node.operand, context));

    case 'binary': {
      if (node.op === 'and') {
        return truthy(evalNode(node.left, context)) && truthy(evalNode(node.right, context));
      }
      if (node.op === 'or') {
        return truthy(evalNode(node.left, context)) || truthy(evalNode(node.right, context));
      }

      const left = evalNode(node.left, context);
      const right = evalNode(node.right, context);

      switch (node.op) {
        case '+':
          if (typeof left === 'string' || typeof right === 'string') return String(left) + String(right);
          return asNumber(left, '"+"') + asNumber(right, '"+"');
        case '-':
          return asNumber(left, '"-"') - asNumber(right, '"-"');
        case '*':
          return asNumber(left, '"*"') * asNumber(right, '"*"');
        case '/': {
          const divisor = asNumber(right, '"/"');
          if (divisor === 0) throw new Error('Division durch null');
          return asNumber(left, '"/"') / divisor;
        }
        case '**':
          return asNumber(left, '"**"') ** asNumber(right, '"**"');
        case '=':
          return left === right;
        case '!=':
          return left !== right;
        case '<':
          return compare(left, right) < 0;
        case '<=':
          return compare(left, right) <= 0;
        case '>':
          return compare(left, right) > 0;
        case '>=':
          return compare(left, right) >= 0;
        default:
          throw new Error(`unbekannter Operator "${node.op}"`);
      }
    }

    case 'if':
      return truthy(evalNode(node.condition, context))
        ? evalNode(node.then, context)
        : evalNode(node.else, context);

    case 'in': {
      const value = evalNode(node.value, context);
      if (node.range.kind === 'range') {
        const from = evalNode(node.range.from, context);
        const to = evalNode(node.range.to, context);
        const lower = node.range.fromInclusive ? compare(value, from) >= 0 : compare(value, from) > 0;
        const upper = node.range.toInclusive ? compare(value, to) <= 0 : compare(value, to) < 0;
        return lower && upper;
      }
      return node.range.items.some((item) => evalNode(item, context) === value);
    }

    case 'call':
      return callFunction(node.name, node.args.map((a) => evalNode(a, context)));
  }
}

function truthy(v: FeelValue): boolean {
  if (typeof v === 'boolean') return v;
  throw new Error(`Wahrheitswert erwartet, bekommt ${describe(v)}`);
}

function compare(a: FeelValue, b: FeelValue): number {
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  if (typeof a === 'string' && typeof b === 'string') return a < b ? -1 : a > b ? 1 : 0;
  throw new Error(`${describe(a)} und ${describe(b)} lassen sich nicht vergleichen`);
}

export function evaluateFeel(source: string, context: Record<string, FeelValue>): EvalResult {
  const parsed = parseFeel(source);
  if (!parsed.ok || !parsed.node) {
    return { ok: false, error: parsed.error?.message ?? 'Ausdruck nicht lesbar' };
  }
  try {
    return { ok: true, value: evalNode(parsed.node, context) };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}
